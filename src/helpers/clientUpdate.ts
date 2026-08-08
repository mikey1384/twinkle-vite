import { inputStates, editFormTextStates } from '../constants/state';
import { LOADED_BUILD_RUNTIME_SESSION_SELECTOR } from '../constants/appShell';

const UPDATE_RELOAD_PARAM = '_twinkleUpdate';
const SILENT_ATTEMPT_KEY = 'twinkleSilentUpdateAttempt';
const SILENT_ATTEMPT_TTL = 60 * 60 * 1000;

interface AttemptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let reloadInitiated = false;
let updatePending = false;
let lastStaleActionErrorAt = 0;
let lastDeployFreshnessProbeAt = 0;

const STALE_ACTION_DEBOUNCE_MS = 5000;
const DEPLOY_FRESHNESS_PROBE_INTERVAL_MS = 10 * 60 * 1000;

export function buildClientVersionCheckUrl({
  apiUrl,
  version,
  requestId = Date.now()
}: {
  apiUrl: string;
  version: string;
  requestId?: number;
}) {
  const query = new URLSearchParams({
    version,
    t: String(requestId)
  });
  return `${apiUrl}/notification/version?${query.toString()}`;
}

export function performClientUpdateReload() {
  reloadInitiated = true;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(UPDATE_RELOAD_PARAM, String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

// A stale tab (typically one iOS Safari resumed from memory with an old bundle
// still running) can bring itself current with a plain reload — production
// always serves a matching bundle. Reload silently instead of interrupting
// with the update popup, but at most once per bundle version per hour: if the
// reload somehow lands this same stale bundle again (e.g. CDN edge lag), fall
// through to the popup instead of loop-reloading. Returns true when a reload
// is (or already was) initiated, meaning the caller must not show the popup.
export function attemptSilentClientUpdate({
  version,
  storage = getSessionStorage(),
  now = Date.now(),
  reload = performClientUpdateReload
}: {
  version: string;
  storage?: AttemptStorage | null;
  now?: number;
  reload?: () => void;
}): boolean {
  if (reloadInitiated) return true;
  if (!storage || !hasSilentAttemptBudget({ storage, now, version })) {
    return false;
  }
  try {
    storage.setItem(
      SILENT_ATTEMPT_KEY,
      JSON.stringify({ version, at: now })
    );
  } catch {
    return false;
  }
  reloadInitiated = true;
  reload();
  return true;
}

// A stale bundle was detected at a moment when reloading could interrupt the
// user (they had already interacted, or an action of theirs just failed with a
// stale-client error). Instead of showing the popup, remember that an update
// is due; the next safe boundary — a route navigation, a clean tab resume, or
// a repeat stale-action error — performs the reload.
export function markClientUpdatePending() {
  updatePending = true;
}

export function isClientUpdatePending() {
  return updatePending;
}

// A SUPPORTED bundle can still be outdated: the API's version check only
// answers "still compatible?", and an SPA never refetches index.html on its
// own, so a long-lived tab would coast on an old bundle until the minimum
// version is raised. The deployment itself is the source of truth for "is
// there something newer": fetch our own index.html and compare its
// fingerprinted ENTRY SCRIPT basename (assets/index-<hash>.js) against the
// one this tab is running. That catches every JS-carrying deploy, including
// ones that never bump clientVersion, with no API coupling. Script tags only:
// Vite injects runtime chunk preloads as <link> elements (and dynamic chunks
// can legitimately be named index-*.js), so links must not pollute the
// identity; the tradeoff is that a CSS-only deploy goes undetected until the
// next JS deploy. A mismatch arms the pending update. Wake/focus probes leave
// it for the next safe boundary; the navigation wrapper can consume it during
// the same user-chosen transition. Every reload remains gated by
// hasUnsavedUserWork, and a compatible bundle never escalates to the popup.
// Probes are throttled and evidence is held to the captive-portal standard: no
// well-formed entry script on both sides, no conclusion.
export async function armUpdateIfDeployedBundleNewer({
  now = Date.now(),
  fetcher,
  doc = typeof document === 'undefined' ? null : document
}: {
  now?: number;
  fetcher?: (
    url: string,
    init?: { cache?: string }
  ) => Promise<{ ok: boolean; text(): Promise<string> }>;
  doc?: { querySelectorAll(selector: string): ArrayLike<any> } | null;
} = {}): Promise<boolean> {
  if (updatePending || reloadInitiated) return false;
  if (now - lastDeployFreshnessProbeAt < DEPLOY_FRESHNESS_PROBE_INTERVAL_MS) {
    return false;
  }
  const resolvedFetcher =
    fetcher ?? (typeof fetch === 'undefined' ? null : fetch);
  if (!resolvedFetcher || !doc) return false;
  const runningEntries = getRunningEntryScripts(doc);
  // No fingerprinted entry script in this document means a dev server or an
  // unknown layout — there is nothing trustworthy to compare against.
  if (runningEntries.length === 0) return false;
  lastDeployFreshnessProbeAt = now;
  try {
    const response = await resolvedFetcher('/', { cache: 'no-store' });
    if (!response?.ok) return false;
    const deployedEntries = getDeployedEntryScripts(await response.text());
    if (deployedEntries.length === 0) return false;
    if (deployedEntries.join('|') === runningEntries.join('|')) return false;
    markClientUpdatePending();
    return true;
  } catch {
    return false;
  }
}

// Route navigation is already a user-chosen boundary, so it can both discover
// and apply a deployed bundle in one transition. A wake/focus probe still only
// arms the update; the next navigation calls this helper and consumes it. If
// the network is offline, the probe has no canonical deployment evidence and
// leaves the running client alone. If precious local work exists, the update
// stays pending for a later safe boundary.
export async function applyClientUpdateAtSafeBoundary({
  version,
  now = Date.now(),
  fetcher,
  doc = typeof document === 'undefined' ? null : document,
  storage = getSessionStorage(),
  reload = performClientUpdateReload,
  hasUnsavedWork = () => hasUnsavedUserWork()
}: {
  version: string;
  now?: number;
  fetcher?: (
    url: string,
    init?: { cache?: string }
  ) => Promise<{ ok: boolean; text(): Promise<string> }>;
  doc?: { querySelectorAll(selector: string): ArrayLike<any> } | null;
  storage?: AttemptStorage | null;
  reload?: () => void;
  hasUnsavedWork?: () => boolean;
}): Promise<'current' | 'deferred' | 'reloading'> {
  if (!updatePending) {
    await armUpdateIfDeployedBundleNewer({ now, fetcher, doc });
  }
  if (!updatePending) return 'current';
  if (hasUnsavedWork()) return 'deferred';
  return attemptSilentClientUpdate({
    version,
    storage,
    now,
    reload
  })
    ? 'reloading'
    : 'deferred';
}

const ENTRY_SCRIPT_BASENAME_PATTERN = /\/assets\/(index-[\w~-]+\.js)$/;

export function getRunningEntryScripts(
  doc: { querySelectorAll(selector: string): ArrayLike<any> } | null
): string[] {
  if (!doc) return [];
  const names = new Set<string>();
  for (const node of Array.from(doc.querySelectorAll('script[src]'))) {
    const src = String(node?.getAttribute?.('src') || '');
    const match = ENTRY_SCRIPT_BASENAME_PATTERN.exec(src);
    if (match) names.add(match[1]);
  }
  return [...names].sort();
}

export function getDeployedEntryScripts(html: string): string[] {
  const names = new Set<string>();
  const scriptTagPattern =
    /<script\b[^>]*\bsrc="([^"]*\/assets\/index-[\w~-]+\.js)"/g;
  for (const match of String(html || '').matchAll(scriptTagPattern)) {
    const basename = ENTRY_SCRIPT_BASENAME_PATTERN.exec(match[1]);
    if (basename) names.add(basename[1]);
  }
  return [...names].sort();
}

// A user action failed because the client is stale (HTTP 426). The first time,
// stay quiet: the failed action surfaces its own "please refresh" error and
// the user keeps everything on screen. A repeat while the update is already
// pending means the user is trying to continue a flow the old bundle can never
// complete, so reload right away — but never over the user's unsaved work: the
// failing action is usually a submit, so the draft on screen is exactly what a
// reload would destroy. With drafts present the popup is the escalation
// instead — it tells the user the client must update while leaving their text
// on screen to keep or copy. The popup is also the fallback when the reload
// budget is exhausted (a reload already happened and the bundle is still
// stale). `allowPopup: false` is for a client that remains generally usable
// but cannot perform this one action: it follows the same deferred/retry reload
// ladder without ever blockading the rest of the site.
export function noteStaleClientActionError({
  version,
  storage,
  now = Date.now(),
  reload,
  hasUnsavedWork = () => hasUnsavedUserWork(),
  allowPopup = true
}: {
  version: string;
  storage?: AttemptStorage | null;
  now?: number;
  reload?: () => void;
  hasUnsavedWork?: () => boolean;
  allowPopup?: boolean;
}): 'deferred' | 'reloading' | 'popup' {
  // One failed user action can emit more than one stale-client signal (e.g.
  // the chunked-upload helper and the generic request error handler both
  // dispatch). Treat signals within the window as the same action so a single
  // failure never escalates straight to a reload.
  if (now - lastStaleActionErrorAt < STALE_ACTION_DEBOUNCE_MS) {
    return 'deferred';
  }
  lastStaleActionErrorAt = now;
  if (!updatePending) {
    updatePending = true;
    return 'deferred';
  }
  if (hasUnsavedWork()) {
    return allowPopup ? 'popup' : 'deferred';
  }
  if (attemptSilentClientUpdate({ version, storage, now, reload })) {
    return 'reloading';
  }
  return allowPopup ? 'popup' : 'deferred';
}

export type ClientVersionResultOutcome =
  | 'ignored'
  | 'compatible'
  | 'deferred'
  | 'reloading'
  | 'popup';

// This is the complete decision boundary between the server-owned version
// answer and user-visible update behavior. Keeping it outside React makes the
// mandatory and feature-specific compatibility paths behavior-testable as one
// state machine instead of testing helpers and trusting source wiring between
// them. Only an explicit boolean `match` is canonical evidence; a failed
// request, captive portal, or malformed proxy response changes nothing.
export function applyClientVersionResult({
  data,
  trigger,
  version,
  interactedSinceArrival,
  hasUnsavedWork,
  onVersionStatus,
  onCompatibleArrival,
  storage,
  now = Date.now(),
  reload
}: {
  data: unknown;
  trigger: 'arrival' | 'staleActionError';
  version: string;
  interactedSinceArrival: boolean;
  hasUnsavedWork: () => boolean;
  onVersionStatus: (data: Record<string, unknown> & { match: boolean }) => void;
  onCompatibleArrival: () => void;
  storage?: AttemptStorage | null;
  now?: number;
  reload?: () => void;
}): ClientVersionResultOutcome {
  if (!data || typeof data !== 'object') return 'ignored';
  const versionStatus = data as Record<string, unknown> & { match?: unknown };
  if (typeof versionStatus.match !== 'boolean') return 'ignored';
  const confirmedStatus = versionStatus as Record<string, unknown> & {
    match: boolean;
  };

  if (confirmedStatus.match) {
    onVersionStatus(confirmedStatus);
    if (trigger === 'arrival') {
      onCompatibleArrival();
      return 'compatible';
    }
    return noteStaleClientActionError({
      version,
      storage,
      now,
      reload,
      hasUnsavedWork,
      // The server confirmed that the site is generally usable. This action
      // needs a newer feature contract, but that can never blockade the rest
      // of Twinkle.
      allowPopup: false
    });
  }

  if (trigger === 'arrival') {
    if (interactedSinceArrival || hasUnsavedWork()) {
      markClientUpdatePending();
      return 'deferred';
    }
    if (attemptSilentClientUpdate({ version, storage, now, reload })) {
      return 'reloading';
    }
    onVersionStatus(confirmedStatus);
    return 'popup';
  }

  const outcome = noteStaleClientActionError({
    version,
    storage,
    now,
    reload,
    hasUnsavedWork
  });
  if (outcome === 'popup') onVersionStatus(confirmedStatus);
  return outcome;
}

// Silent reloads must never destroy in-progress content that only lives in
// memory, wherever it lives. User-authored content is spread across several
// stores — the Input context (chat input text, comment/subject attachments),
// the `inputStates` module store (comment text, which also has server drafts
// but may trail by a debounce), and the `editFormTextStates` module store
// (edit forms, which have no drafts at all) — plus whatever store gets added
// next. hasUnsavedUserWork ORs exact scans of the known stores with a DOM
// sweep of visible text fields as the catch-all for unknown ones, and treats
// any loaded Build runtime session as unsaved work outright, because its
// state lives inside a sandboxed iframe no parent-side scan can reach. Call
// sites gate every silent reload on this; the deferred update simply stays
// pending.
export function hasUnsavedUserWork({
  inputState,
  moduleStores = [inputStates, editFormTextStates],
  root = typeof document === 'undefined' ? null : document
}: {
  inputState?: Record<string, any> | null;
  moduleStores?: Array<Record<string, any>>;
  root?: ParentNode | null;
} = {}): boolean {
  return (
    hasUnsavedTypedInput(inputState) ||
    moduleStores.some(hasStoreDraft) ||
    hasLiveBuildRuntimeSession(root) ||
    hasVisibleTypedContent(root)
  );
}

// A mounted Build runtime session is opaque, un-persistable state: the app
// runs in a sandboxed iframe, so neither the store scans nor the DOM sweep can
// see what the user has going inside it (typed text, game progress, anything
// in its JS memory). Keep-alive exists precisely to preserve that state across
// SPA navigation, so HIDDEN layers count the same as the visible one — a
// reload at any boundary (navigation, hidden tab, resume) destroys them all.
// Only LOADED sessions block: a still-loading session holds no user state yet,
// and a fresh arrival on an /app route is the one guaranteed-lossless moment
// to take a silent reload. A runtime-dwelling user is not stranded on a stale
// bundle without notice: a repeat stale-action error still surfaces the popup,
// which leaves the app on screen and gives them the choice.
export function hasLiveBuildRuntimeSession(root: ParentNode | null): boolean {
  if (!root) return false;
  return root.querySelectorAll(LOADED_BUILD_RUNTIME_SESSION_SELECTOR).length > 0;
}

// Inspects the Input context state. `subject` and `content` are the structured
// composers and are checked field-by-field because they also retain fetched,
// non-precious data (`content.alreadyPosted`, `content.ytDetails`) that must
// not count. Every other retained entry is deep-scanned: the shapes are many —
// `.text`/`.attachment` chat/comment inputs, `edit<contentKey>` forms
// (editedTitle/editedDescription/...), `reward<contentKey>` forms,
// `edit-interactive-*` slide forms, `mission-feedback-*`, `userInfo` — and new
// ones keep being added, so enumerating field names is an under-matching trap
// where any missed field is a draft a silent reload destroys. Any non-empty
// string or any attachment at any depth counts; over-matching only defers the
// update, which is the safe direction. Selected file attachments are in-memory
// File objects and can never survive a reload. Top-level search strings are
// not precious.
export function hasUnsavedTypedInput(
  inputState: Record<string, any> | null | undefined
): boolean {
  if (!inputState || typeof inputState !== 'object') return false;
  for (const [key, value] of Object.entries(inputState)) {
    if (typeof value === 'string') {
      if (key.endsWith('SearchText')) continue;
      if (hasText(value)) return true;
      continue;
    }
    if (!value || typeof value !== 'object') continue;
    if (key === 'subject') {
      const details = value.details || {};
      if (
        [details.title, details.description, details.secretAnswer].some(
          hasText
        ) ||
        details.attachment ||
        details.secretAttachment
      ) {
        return true;
      }
      continue;
    }
    if (key === 'content') {
      const form = value.form || {};
      if ([form.url, form.title, form.description].some(hasText)) {
        return true;
      }
      continue;
    }
    if (hasDraftContent(value)) return true;
  }
  return false;
}

function hasDraftContent(value: Record<string, any>, depth = 0): boolean {
  if (depth > 3) return false;
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'attachment' || key === 'secretAttachment') {
      if (entry) return true;
      continue;
    }
    if (hasText(entry)) return true;
    if (entry && typeof entry === 'object' && hasDraftContent(entry, depth + 1)) {
      return true;
    }
  }
  return false;
}

// Module text stores hold either raw strings (editFormTextStates) or entry
// objects with `.text`/`.attachment` (inputStates). Entries persist after
// their component unmounts — that is their purpose — so the DOM sweep cannot
// replace this scan.
export function hasStoreDraft(
  store: Record<string, any> | null | undefined
): boolean {
  if (!store || typeof store !== 'object') return false;
  for (const value of Object.values(store)) {
    if (hasText(value)) return true;
    if (!value || typeof value !== 'object') continue;
    if (hasDraftContent(value)) return true;
  }
  return false;
}

// Catch-all for text living in a store this helper does not know about: any
// visible form field or editable region with content counts as unsaved work.
// Over-matching (a filled search box) just defers the update further, which
// is the safe direction.
export function hasVisibleTypedContent(root: ParentNode | null): boolean {
  if (!root) return false;
  const fields = root.querySelectorAll(
    'textarea, input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="password"], input[type="number"], [contenteditable="true"], [contenteditable=""]'
  );
  for (const field of Array.from(fields)) {
    const value =
      (field as HTMLInputElement).value ?? (field as HTMLElement).textContent;
    if (hasText(value)) return true;
  }
  return false;
}

// After an update reload lands, drop the cache-busting param so the address
// bar, bookmarks, and shared links stay canonical.
export function stripClientUpdateReloadParam() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(UPDATE_RELOAD_PARAM)) return;
    url.searchParams.delete(UPDATE_RELOAD_PARAM);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {}
}

export function clearSilentClientUpdateMemory() {
  reloadInitiated = false;
  updatePending = false;
  lastStaleActionErrorAt = 0;
  lastDeployFreshnessProbeAt = 0;
}

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasSilentAttemptBudget({
  storage,
  now,
  version
}: {
  storage: AttemptStorage;
  now: number;
  version: string;
}) {
  try {
    const raw = storage.getItem(SILENT_ATTEMPT_KEY);
    if (!raw) return true;
    const stored = JSON.parse(raw);
    if (stored?.version !== version) return true;
    return now - Number(stored?.at || 0) > SILENT_ATTEMPT_TTL;
  } catch {
    return false;
  }
}

function getSessionStorage(): AttemptStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
