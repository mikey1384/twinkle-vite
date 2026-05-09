import { lazy, type ComponentType } from 'react';

const lazyImportRetryDelays = [400, 1200, 2500];
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
      if (attempt >= lazyImportRetryDelays.length) {
        if (await shouldReloadForLazyImportFailure(error)) {
          reloadAfterLazyImportFailure();
          return await new Promise<{ default: T }>(() => {});
        }
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

async function shouldReloadForLazyImportFailure(error: unknown) {
  if (typeof window === 'undefined') return false;
  const failedUrl = getLazyImportFailureUrl(error);
  if (failedUrl) {
    const staleAsset = await isLikelyStaleLazyImportAsset(failedUrl);
    if (!staleAsset) return false;
  } else {
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
