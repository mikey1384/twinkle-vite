import { lazy, type ComponentType } from 'react';
import { Color } from '~/constants/css';

const lazyImportRetryDelays = [400, 1200, 2500];
const LAZY_IMPORT_OVERLAY_ID = 'twinkle-lazy-import-reload-overlay';
const LAZY_IMPORT_RELOAD_STORAGE_KEY = 'twinkleLazyImportReloadAt';
const LAZY_IMPORT_RELOAD_COOLDOWN_MS = 60 * 1000;
const LAZY_IMPORT_RELOAD_PARAM = '_twinkleLazyImportReload';

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(() => retryLazyImport(importer));
}

async function retryLazyImport<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= lazyImportRetryDelays.length; attempt += 1) {
    try {
      return await importer();
    } catch (error) {
      lastError = error;
      if (!isLazyImportLoadError(error)) {
        throw error;
      }
      const isFinalAttempt = attempt >= lazyImportRetryDelays.length;
      // A chunk confirmed stale (deploy replaced the hashed assets) never
      // recovers by retrying, so reload immediately instead of burning the
      // retry delays while the user stares at the previous page.
      if (
        await shouldReloadForLazyImportFailure(error, {
          confirmedStaleOnly: !isFinalAttempt
        })
      ) {
        showLazyImportReloadOverlay();
        reloadAfterLazyImportFailure();
        return await new Promise<{ default: T }>(() => {});
      }
      if (isFinalAttempt) {
        throw error;
      }
      await wait(lazyImportRetryDelays[attempt]);
    }
  }
  throw lastError;
}

export function isLazyImportLoadError(error: unknown) {
  const message = String((error as Error)?.message || error || '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('not a valid JavaScript MIME type') ||
    message.includes('Unable to preload CSS for') ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk')
  );
}

async function shouldReloadForLazyImportFailure(
  error: unknown,
  { confirmedStaleOnly }: { confirmedStaleOnly: boolean }
) {
  if (typeof window === 'undefined') return false;
  const failedUrl = getLazyImportFailureUrl(error);
  if (failedUrl) {
    const staleAsset = await isLikelyStaleLazyImportAsset(failedUrl);
    if (!staleAsset) return false;
  } else {
    // Without a failed asset URL we cannot prove staleness, so keep the
    // conservative retry-first behavior for transient network failures.
    if (confirmedStaleOnly) return false;
    const documentReachable = await isFreshDocumentReachable();
    if (!documentReachable) return false;
  }
  try {
    if (typeof window.sessionStorage === 'undefined') return false;
    const lastReload =
      Number(
        window.sessionStorage.getItem(LAZY_IMPORT_RELOAD_STORAGE_KEY)
      ) || 0;
    const now = Date.now();
    if (lastReload && now - lastReload <= LAZY_IMPORT_RELOAD_COOLDOWN_MS) {
      return false;
    }
    window.sessionStorage.setItem(
      LAZY_IMPORT_RELOAD_STORAGE_KEY,
      String(now)
    );
    return true;
  } catch {
    return false;
  }
}

// Rendered with plain DOM because this runs outside the React tree and the
// document is about to be replaced; it also blocks repeat taps that would
// otherwise stack history entries while the reload is in flight.
function showLazyImportReloadOverlay() {
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
    title.textContent = 'Twinkle has been updated!';
    title.style.cssText = 'font-size: 1.7rem; font-weight: bold;';
    const message = document.createElement('div');
    message.textContent = 'Loading the new version...';
    message.style.cssText = 'font-size: 1.3rem;';
    overlay.append(style, spinner, title, message);
    document.body.appendChild(overlay);
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
    if (url.origin !== window.location.origin) return false;
    const assetExtension = getLazyImportAssetExtension(url.pathname);
    if (!url.pathname.startsWith('/assets/') || !assetExtension) {
      return false;
    }
    const response = await fetch(url.toString(), {
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

function getLazyImportAssetExtension(pathname: string) {
  if (pathname.endsWith('.js')) return 'js';
  if (pathname.endsWith('.css')) return 'css';
  return '';
}

async function isFreshDocumentReachable() {
  try {
    const response = await fetch(window.location.href, {
      cache: 'no-store',
      method: 'HEAD'
    });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return /text\/html/i.test(contentType);
  } catch {
    return false;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
