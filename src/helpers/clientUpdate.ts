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

const STALE_ACTION_DEBOUNCE_MS = 5000;

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
// stale).
export function noteStaleClientActionError({
  version,
  storage,
  now = Date.now(),
  reload,
  hasUnsavedWork = () => hasUnsavedUserWork()
}: {
  version: string;
  storage?: AttemptStorage | null;
  now?: number;
  reload?: () => void;
  hasUnsavedWork?: () => boolean;
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
    return 'popup';
  }
  return attemptSilentClientUpdate({ version, storage, now, reload })
    ? 'reloading'
    : 'popup';
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
