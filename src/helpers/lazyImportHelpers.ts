import { lazy, type ComponentType } from 'react';
import { Color } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import {
  hasRecentLazyImportReload,
  isTruncatedScriptError,
  LAZY_IMPORT_RELOAD_PARAM,
  extractEntryScriptPaths
} from '~/helpers/lazyChunkErrors';
import { noteClientReload } from '~/helpers/clientTraceBus';

export { isTruncatedScriptError };

const lazyImportRetryDelays = [400, 1200, 2500];
const LAZY_IMPORT_OVERLAY_ID = 'twinkle-lazy-import-reload-overlay';
const LAZY_IMPORT_RELOAD_STORAGE_KEY = 'twinkleLazyImportReloadAt';
const LAZY_IMPORT_RELOAD_COOLDOWN_MS = 60 * 1000;
const LAZY_IMPORT_MANUAL_RECOVERY_PARAM = '_twinkleLazyImportRecovery';
const LAZY_IMPORT_RELOAD_COUNTS_KEY = 'twinkleLazyImportReloadCounts';
// Reloading can only fix a stale bundle. If a page keeps failing for another
// reason (device memory pressure, content blockers), more reloads make it
// worse, so auto-reloads are capped per pathname for the session.
const LAZY_IMPORT_MAX_RELOADS_PER_PATH = 2;
// The staleness probes run while the user is staring at a Suspense fallback
// (or, for request-helper modules, a pending request). On a stalled connection
// an un-timeboxed fetch can hang for minutes, so cap the probes.
const LAZY_IMPORT_PROBE_TIMEOUT_MS = 8000;
// a retry's request for a fresh copy of the failed chunk (a browser can keep a
// failed module for the page's life, keyed by its exact URL)
const LAZY_IMPORT_FRESH_COPY_PARAM = 'twinkleRetry';
const LAZY_IMPORT_OFFLINE_WAIT_MS = 30 * 1000;
const LAZY_IMPORT_OVERLAY_MAX_MS = 15 * 1000;

function fetchWithProbeTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    LAZY_IMPORT_PROBE_TIMEOUT_MS
  );
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(() => importWithRecovery(importer));
}

// A retry's fresh copy of one chunk, for loaders whose result can be checked
// (request-helper modules: `{ default: factory }`).
export interface FreshCopyOptions {
  // true when a module loaded straight from the chunk URL is exactly what the
  // importer returns: a bare import() with nothing chained, and the expected
  // exports present. Anything else falls back to the importer itself.
  isUsable: (loaded: unknown) => boolean;
  // the browser's native import; replaceable only by tests
  load?: (url: string) => Promise<unknown>;
}

// The one way the site loads a code chunk on demand: page components
// (lazyWithRetry) and request-helper modules (contexts/requestHelpers).
// - Retries wait until the page is visible and online: a phone pauses a
//   backgrounded page's network (11-09 Blackstar).
// - Chromium and WebKit keep a failed module for the page's life (checked
//   11-09: importing it again sends no request). So a loader that passes
//   `freshCopy` retries with a fresh copy of the chunk under a never-reused
//   URL. Page components never do: their importers can reshape the module and
//   their CSS would not be loaded again (review r1).
// - A stale or truncated chunk reloads as before (capped). A dropped
//   connection never reloads by itself: typed work stays, and the member gets
//   a LazyLoadConnectionError in plain words (the boundary adds a Reload
//   button). The next call tries again.
// - Waiting for the device to come online shares one 30 s budget per call,
//   and a loader with no fresh copy to ask for waits once and then decides:
//   retrying its importer only gets the kept failure back (review r2).
export async function importWithRecovery<T>(
  importer: () => Promise<T>,
  freshCopy?: FreshCopyOptions
): Promise<T> {
  let lastError: unknown;
  let freshCopyUrl: string | null = null;
  let offlineDeadline = 0;
  const waitForUsablePage = () => {
    if (!offlineDeadline) {
      offlineDeadline = Date.now() + LAZY_IMPORT_OFFLINE_WAIT_MS;
    }
    return waitUntilPageCanLoad(offlineDeadline);
  };
  for (let attempt = 0; attempt <= lazyImportRetryDelays.length; attempt += 1) {
    try {
      if (freshCopy && freshCopyUrl) {
        const load =
          freshCopy.load || ((url: string) => import(/* @vite-ignore */ url));
        const loaded = await load(withFreshCopyParam(freshCopyUrl));
        if (freshCopy.isUsable(loaded)) return loaded as T;
        // not the importer's result: never try a fresh copy again here
        freshCopyUrl = null;
        freshCopy = undefined;
        throw lastError;
      }
      return await importer();
    } catch (error) {
      lastError = error;
      if (!isLazyImportLoadError(error)) {
        throw error;
      }
      const truncated = isTruncatedScriptError(error);
      // Chromium names the failed file; Safari does not, so read the chunk
      // file name the build wrote into the importer itself.
      if (freshCopy && !truncated) {
        freshCopyUrl =
          getFreshCopyChunkUrl(error) ||
          freshCopyUrl ||
          getImporterChunkUrl(importer);
      }
      const canRetry =
        attempt < lazyImportRetryDelays.length && freshCopyUrl !== null;
      // a truncated chunk (failed to parse) goes straight to the capped
      // reload; a stale one (a deploy replaced it) reloads as soon as the
      // probe confirms it, instead of burning the retry delays
      if (
        await recoverFromLazyImportLoadError(error, {
          confirmedStaleOnly: canRetry && !truncated
        })
      ) {
        return await waitForReloadOrGiveUp<T>(error);
      }
      if (!canRetry) {
        // decide once the page is usable, so the stale check can reach the
        // network; then the plain error
        if (!isPageUsable()) {
          await waitForUsablePage();
          if (await recoverFromLazyImportLoadError(error)) {
            return await waitForReloadOrGiveUp<T>(error);
          }
        }
        break;
      }
      await wait(lazyImportRetryDelays[attempt]);
      await waitForUsablePage();
    }
  }
  throw new LazyLoadConnectionError(lastError);
}

// A reload is under way: the caller waits for the new page. If this page is
// still here when the overlay gives up (a "Leave site?" prompt answered Stay,
// or a stalled load), the load fails in plain words instead of hanging.
function waitForReloadOrGiveUp<T>(error: unknown) {
  return new Promise<T>((_, reject) => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(
      () => reject(new LazyLoadConnectionError(error)),
      LAZY_IMPORT_OVERLAY_MAX_MS
    );
    window.addEventListener('pagehide', () => window.clearTimeout(timer), {
      once: true
    });
  });
}

// Thrown once a chunk still won't load after the retries (and it was neither
// stale nor truncated, or their capped reload was not allowed). Callers often
// show error.message, so it is written for members.
export class LazyLoadConnectionError extends Error {
  cause: unknown;
  constructor(cause: unknown) {
    super(
      `Part of ${SITE_NAME} didn't load because the connection dropped. Please reload the page and try again.`
    );
    this.name = 'LazyLoadConnectionError';
    this.cause = cause;
  }
}

export function isLazyLoadConnectionError(error: unknown) {
  return (error as Error | null)?.name === 'LazyLoadConnectionError';
}

export function isLazyImportLoadError(error: unknown) {
  const message = String((error as Error)?.message || error || '');
  return (
    isLazyLoadConnectionError(error) ||
    isTruncatedScriptError(error) ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    // Safari surfaces a failed cross-origin module fetch (assets load from the
    // *.vercel.app deployment origin) with this message instead of the generic
    // import failure above.
    message.includes('Cross-origin script load denied') ||
    message.includes('not a valid JavaScript MIME type') ||
    message.includes('Unable to preload CSS for') ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk')
  );
}

export async function recoverFromLazyImportLoadError(
  error: unknown,
  { confirmedStaleOnly = false }: { confirmedStaleOnly?: boolean } = {}
) {
  if (!isLazyImportLoadError(error)) return false;
  // importWithRecovery already applied the reload policy to this failure
  if (isLazyLoadConnectionError(error)) return false;
  const reason = await getLazyImportReloadReason(error, {
    confirmedStaleOnly
  });
  if (!reason) return false;
  showLazyImportReloadOverlay(reason);
  noteClientReload('lazy-chunk-recovery', {
    truncated: reason === 'truncated',
    reason,
    msg: String((error as Error)?.message || error || '').slice(0, 160)
  });
  reloadAfterLazyImportFailure();
  return true;
}

export function reloadForLazyImportRecovery() {
  noteClientReload('lazy-chunk-recovery-button');
  try {
    clearLazyImportReloadGuards();
    const url = new URL(window.location.href);
    url.searchParams.set(LAZY_IMPORT_MANUAL_RECOVERY_PARAM, String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

type LazyImportReloadReason = 'update' | 'truncated';

// Why a reload can fix this failure, or null when it can't or isn't allowed.
// - truncated: the chunk arrived cut off; the browser keeps it broken.
// - update: a newer deploy replaced the chunk (or the entry assets).
// A chunk that merely failed to download never reloads by itself (it could
// land offline on the browser's error page, or drop typed work).
// Every reload is capped: never within a minute of the last (the URL param
// holds even without sessionStorage), and at most twice per path a session.
async function getLazyImportReloadReason(
  error: unknown,
  { confirmedStaleOnly }: { confirmedStaleOnly: boolean }
): Promise<LazyImportReloadReason | null> {
  if (typeof window === 'undefined') return null;
  const failedUrl = getLazyImportFailureUrl(error);
  let reason: LazyImportReloadReason | null = null;
  if (isTruncatedScriptError(error)) {
    if (confirmedStaleOnly) return null;
    reason = 'truncated';
  } else if (failedUrl && (await isLikelyStaleLazyImportAsset(failedUrl))) {
    reason = 'update';
  } else if (confirmedStaleOnly) {
    return null;
  } else if (!failedUrl && (await hasNewDeployedIndexHtml())) {
    // Safari import errors carry no URL: compare the deployed entry assets
    reason = 'update';
  } else {
    return null;
  }
  if (hasRecentLazyImportReload(window.location.href)) return null;
  try {
    if (typeof window.sessionStorage === 'undefined') return null;
    const lastReload =
      Number(
        window.sessionStorage.getItem(LAZY_IMPORT_RELOAD_STORAGE_KEY)
      ) || 0;
    const now = Date.now();
    if (lastReload && now - lastReload <= LAZY_IMPORT_RELOAD_COOLDOWN_MS) {
      return null;
    }
    const reloadCounts = readLazyImportReloadCounts();
    const pathname = window.location.pathname;
    if ((reloadCounts[pathname] || 0) >= LAZY_IMPORT_MAX_RELOADS_PER_PATH) {
      return null;
    }
    reloadCounts[pathname] = (reloadCounts[pathname] || 0) + 1;
    window.sessionStorage.setItem(
      LAZY_IMPORT_RELOAD_COUNTS_KEY,
      JSON.stringify(reloadCounts)
    );
    window.sessionStorage.setItem(
      LAZY_IMPORT_RELOAD_STORAGE_KEY,
      String(now)
    );
    return reason;
  } catch {
    return null;
  }
}

function clearLazyImportReloadGuards() {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.sessionStorage === 'undefined') return;
    window.sessionStorage.removeItem(LAZY_IMPORT_RELOAD_STORAGE_KEY);
    window.sessionStorage.removeItem(LAZY_IMPORT_RELOAD_COUNTS_KEY);
  } catch {}
}

function readLazyImportReloadCounts(): Record<string, number> {
  try {
    const raw = window.sessionStorage.getItem(LAZY_IMPORT_RELOAD_COUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// Rendered with plain DOM because this runs outside the React tree and the
// document is about to be replaced; it also blocks repeat taps that would
// otherwise stack history entries while the reload is in flight.
function showLazyImportReloadOverlay(reason: LazyImportReloadReason) {
  try {
    if (typeof document === 'undefined' || !document.body) return;
    if (document.getElementById(LAZY_IMPORT_OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.id = LAZY_IMPORT_OVERLAY_ID;
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.style.cssText =
      'position: fixed; inset: 0; z-index: 2147483647;' +
      'display: flex; flex-direction: column; align-items: center;' +
      'justify-content: center; gap: 1.5rem; padding: 2rem;' +
      `background: ${Color.white(0.96)}; color: ${Color.darkerGray()};` +
      'text-align: center; cursor: wait;';
    const style = document.createElement('style');
    style.textContent = `@keyframes ${LAZY_IMPORT_OVERLAY_ID}-spin { to { transform: rotate(360deg); } }`;
    const spinner = document.createElement('div');
    spinner.style.cssText =
      'width: 3.5rem; height: 3.5rem; border-radius: 50%;' +
      `border: 0.4rem solid ${Color.borderGray()};` +
      `border-top-color: ${Color.logoBlue()};` +
      `animation: ${LAZY_IMPORT_OVERLAY_ID}-spin 0.8s linear infinite;`;
    const title = document.createElement('div');
    title.textContent =
      reason === 'update' ? `${SITE_NAME} has been updated!` : 'Reloading...';
    title.style.cssText = 'font-size: 1.7rem; font-weight: bold;';
    const message = document.createElement('div');
    message.textContent =
      reason === 'update'
        ? 'Loading the new version...'
        : 'Part of the page did not finish loading. Trying again...';
    message.style.cssText = 'font-size: 1.3rem;';
    overlay.append(style, spinner, title, message);
    document.body.appendChild(overlay);
    // Still here long after the reload began: it was cancelled (a "Leave
    // site?" prompt answered Stay) or stalled, so never trap the page.
    const timer = window.setTimeout(
      () => overlay.remove(),
      LAZY_IMPORT_OVERLAY_MAX_MS
    );
    window.addEventListener('pagehide', () => window.clearTimeout(timer), {
      once: true
    });
    window.addEventListener('pageshow', (event) => {
      if ((event as PageTransitionEvent).persisted) {
        overlay.remove();
      }
    });
  } catch {
    // The overlay is purely cosmetic; never let it block the reload.
  }
}

function reloadAfterLazyImportFailure() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(LAZY_IMPORT_RELOAD_PARAM, String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

function getLazyImportFailureUrl(error: unknown) {
  const request = (error as { request?: unknown })?.request;
  if (typeof request === 'string' && request.trim()) {
    return request.trim();
  }
  const targetSrc = (error as { target?: { src?: unknown } })?.target?.src;
  if (typeof targetSrc === 'string' && targetSrc.trim()) {
    return targetSrc.trim();
  }
  const targetHref = (error as { target?: { href?: unknown } })?.target?.href;
  if (typeof targetHref === 'string' && targetHref.trim()) {
    return targetHref.trim();
  }
  const message = String((error as Error)?.message || error || '');
  return (
    message.match(
      /(?:https?:\/\/[^\s"'`<>)]*|\/[^\s"'`<>)]*|(?:\.{1,2}\/)?assets\/[^\s"'`<>)]*)\.(?:js|css)\b[^\s"'`<>)]*/i
    )?.[0] ||
    null
  );
}

async function isLikelyStaleLazyImportAsset(rawUrl: string) {
  try {
    const url = new URL(rawUrl, window.location.href);
    if (!isOwnAssetOrigin(url.origin)) return false;
    const assetExtension = getLazyImportAssetExtension(url.pathname);
    if (!url.pathname.startsWith('/assets/') || !assetExtension) {
      return false;
    }
    const response = await fetchWithProbeTimeout(url.toString(), {
      cache: 'no-store',
      method: 'HEAD'
    });
    if (response.status === 404 || response.status === 410) return true;
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType) return false;
    if (assetExtension === 'css') return !/text\/css/i.test(contentType);
    return !/javascript|ecmascript/i.test(contentType);
  } catch {
    return false;
  }
}

// Built assets load from the immutable *.vercel.app deployment origin
// (vite.config.ts renderBuiltUrl), not the page origin; this module is one of
// them, so its own URL names that origin (the page origin in development).
function getAssetOrigin() {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
}

function isOwnAssetOrigin(origin: string) {
  return (
    origin === window.location.origin ||
    (!!origin && origin !== 'null' && origin === getAssetOrigin())
  );
}

// The failed chunk's own URL, when the browser named it (Chromium, Firefox).
function getFreshCopyChunkUrl(error: unknown) {
  if (typeof window === 'undefined') return null;
  if (isTruncatedScriptError(error)) return null;
  const failedUrl = getLazyImportFailureUrl(error);
  if (!failedUrl) return null;
  try {
    return toFreshCopyCandidate(new URL(failedUrl, window.location.href));
  } catch {
    return null;
  }
}

// The chunk an importer loads, read from its built source: Vite emits
// `import("./content-CA8FY4Cc.js")` there, and every chunk sits next to this
// module in /assets/. Development imports (/src/...ts) never match.
function getImporterChunkUrl(importer: unknown) {
  if (typeof window === 'undefined') return null;
  try {
    const source = Function.prototype.toString.call(importer);
    const specifiers = Array.from(
      source.matchAll(/\bimport\(\s*["'`](\.\/[\w.-]+\.js)["'`]\s*\)/g),
      (match) => match[1]
    );
    if (new Set(specifiers).size !== 1) return null;
    return toFreshCopyCandidate(new URL(specifiers[0], import.meta.url));
  } catch {
    return null;
  }
}

// only our own built JS chunks are ever imported again
function toFreshCopyCandidate(url: URL) {
  if (!isOwnAssetOrigin(url.origin)) return null;
  if (!url.pathname.startsWith('/assets/')) return null;
  if (getLazyImportAssetExtension(url.pathname) !== 'js') return null;
  url.searchParams.delete(LAZY_IMPORT_FRESH_COPY_PARAM);
  return url.toString();
}

// Never reused: the browser keeps a failed fresh copy under its URL too.
let freshCopyCount = 0;
function withFreshCopyParam(url: string) {
  freshCopyCount += 1;
  const next = new URL(url);
  next.searchParams.set(
    LAZY_IMPORT_FRESH_COPY_PARAM,
    `${Date.now().toString(36)}${freshCopyCount}`
  );
  return next.toString();
}

function isPageVisible() {
  return (
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
}

function isPageUsable() {
  return (
    isPageVisible() &&
    (typeof navigator === 'undefined' || navigator.onLine !== false)
  );
}

// Waits until the page is visible (no timeout: nobody is looking) and the
// device says it is online, but only until offlineDeadline for the online
// part, since onLine can be wrong; never resolves on a hidden page.
function waitUntilPageCanLoad(offlineDeadline: number) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;
    let done = false;
    const check = () => {
      if (done) return;
      if (!isPageVisible()) return;
      if (navigator.onLine === false && Date.now() < offlineDeadline) {
        if (!offlineTimer) {
          offlineTimer = setTimeout(() => {
            offlineTimer = null;
            check();
          }, Math.max(0, offlineDeadline - Date.now()));
        }
        return;
      }
      finish();
    };
    const finish = () => {
      if (done) return;
      done = true;
      if (offlineTimer) clearTimeout(offlineTimer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
      resolve();
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    check();
  });
}

function getLazyImportAssetExtension(pathname: string) {
  if (pathname.endsWith('.js')) return 'js';
  if (pathname.endsWith('.css')) return 'css';
  return '';
}

async function hasNewDeployedIndexHtml() {
  try {
    const response = await fetchWithProbeTimeout(`${window.location.origin}/`, {
      cache: 'no-store'
    });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html/i.test(contentType)) return false;
    const deployedAssets = extractEntryScriptPaths(await response.text());
    const runningAssets = extractEntryScriptPaths(
      document.documentElement.outerHTML
    );
    if (deployedAssets.length === 0 || runningAssets.length === 0) {
      // Cannot compare (unexpected html shape); allow the reload rather than
      // stranding a genuinely stale client.
      return true;
    }
    return deployedAssets.join('|') !== runningAssets.join('|');
  } catch {
    return false;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
