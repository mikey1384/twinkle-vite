import axios, {
  AxiosResponse,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosProgressEvent
} from 'axios';
import pLimit from 'p-limit';
import API_URL from '~/constants/URL';
import { logForAdmin } from '~/helpers';

export interface DroppableError extends AxiosError {
  dropped?: boolean;
}

interface RetryItem {
  config: InternalAxiosRequestConfig;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  lastError?: AxiosError;
}

interface NetworkConfig {
  MIN_TIMEOUT: number;
  MAX_TIMEOUT: number;
  RETRY_DELAY: number;
  MAX_RETRIES: number;
  MAX_TOTAL_DURATION: number;
  BATCH_SIZE: number;
  BATCH_INTERVAL: number;
  MAX_QUEUE: number;
}

const NETWORK_CONFIG: NetworkConfig = {
  MIN_TIMEOUT: 8000, // 8s (match server p95 response)
  MAX_TIMEOUT: 60_000, // cap backoff at 60s
  RETRY_DELAY: 1000, // base for backoff
  MAX_RETRIES: 5, // ↓ from 20
  MAX_TOTAL_DURATION: 90_000, // 90s total per request
  BATCH_SIZE: 3, // fewer in-flight retries
  BATCH_INTERVAL: 1500,
  MAX_QUEUE: 50 // bound per-tab retry pressure
};

// --- Client-side circuit breaker to avoid thundering herd ---
type BreakerState = 'closed' | 'open' | 'half';
const breaker = {
  state: 'closed' as BreakerState,
  openedAt: 0,
  lastProbeAt: 0
};
const BREAKER = {
  ERROR_WINDOW_MS: 10_000,
  ERROR_THRESHOLD: 5,
  OPEN_MS: 30_000,
  PROBE_EVERY_MS: 5_000
};
let recentErrors: number[] = [];
function noteRetryableError() {
  const now = Date.now();
  recentErrors.push(now);
  recentErrors = recentErrors.filter((t) => now - t <= BREAKER.ERROR_WINDOW_MS);
  if (
    breaker.state === 'closed' &&
    recentErrors.length >= BREAKER.ERROR_THRESHOLD
  ) {
    breaker.state = 'open';
    breaker.openedAt = now;
  }
}
function breakerAllowsAttempt() {
  const now = Date.now();
  if (breaker.state === 'open') {
    if (now - breaker.openedAt >= BREAKER.OPEN_MS) {
      breaker.state = 'half';
      breaker.lastProbeAt = 0; // allow immediate probe
      return true;
    }
    return false;
  }
  if (breaker.state === 'half') {
    if (now - breaker.lastProbeAt >= BREAKER.PROBE_EVERY_MS) {
      breaker.lastProbeAt = now;
      return true;
    }
    return false;
  }
  return true; // closed
}
function onSuccessfulProbe() {
  if (breaker.state !== 'closed') {
    breaker.state = 'closed';
    recentErrors = [];
  }
}

const conn: any =
  typeof navigator !== 'undefined' && 'connection' in navigator
    ? (navigator as any).connection
    : null;

const isSlow = () =>
  conn ? ['slow-2g', '2g'].includes(conn.effectiveType) : false;

let limiter = pLimit(3);

if (typeof window !== 'undefined') {
  applyBandwidthPreset(!!isSlow());
}

const sleepers = new Set<ReturnType<typeof setTimeout>>();
const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isApiRequest =
    typeof API_URL === 'string' &&
    typeof config.url === 'string' &&
    config.url.startsWith(API_URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  return isApiRequest && isGetRequest ? createApiRequestConfig(config) : config;
});

axiosInstance.interceptors.response.use(handleSuccessfulResponse, (error) => {
  const config = error?.config || {};
  const isGetRequest = config.method?.toLowerCase() === 'get';
  const isApiRequest =
    typeof API_URL === 'string' &&
    typeof config.url === 'string' &&
    config.url.startsWith(API_URL);

  if (!isGetRequest || !isApiRequest || !isRetryableError(error)) {
    return Promise.reject(error);
  }
  return handleRetry(config, error);
});

function handleSuccessfulResponse(response: AxiosResponse) {
  const requestId = getRequestIdentifier(response.config);
  cleanup(requestId);
  onSuccessfulProbe();
  return response;
}

conn?.addEventListener?.('change', () => applyBandwidthPreset(!!isSlow()));

function applyBandwidthPreset(slow: boolean) {
  NETWORK_CONFIG.BATCH_SIZE = slow ? 1 : 5;
  NETWORK_CONFIG.BATCH_INTERVAL = slow ? 3000 : 1000;
  NETWORK_CONFIG.MAX_QUEUE = slow ? 50 : 200;

  const cores = navigator.hardwareConcurrency ?? 4;
  limiter = pLimit(cores <= 2 ? 1 : slow ? 1 : 3);
}

const state = {
  retryQueue: new Set<string>(),
  retryMap: new Map<string, RetryItem>(),
  processingRequests: new Map<string, boolean>(),
  retryCountMap: new Map<string, number>(),
  isQueueProcessing: false,
  isOffline: false
};

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    state.isOffline = true;
  });

  window.addEventListener('online', () => {
    state.isOffline = false;
    if (!state.isQueueProcessing) processQueue();
  });
}

function logRetryAttempt(
  requestId: string,
  retryCount: number,
  config: AxiosRequestConfig
) {
  logForAdmin({
    message: `Retry attempt ${retryCount}: ${config.method} ${config.url} (requestId: ${requestId})`
  });
}

function getRequestIdentifier(config: AxiosRequestConfig): string {
  const { method = 'GET', url = '', data, params } = config;
  let dataString = '';
  let paramsString = '';

  try {
    dataString =
      data && typeof data === 'object'
        ? JSON.stringify(data)
        : String(data || '');
  } catch {
    dataString = 'unserializable-data';
  }

  try {
    paramsString =
      params && typeof params === 'object'
        ? JSON.stringify(params)
        : String(params || '');
  } catch {
    paramsString = 'unserializable-params';
  }

  if (!url) {
    // If somehow no URL is defined, just return something minimal
    return `${method}-${dataString}-${paramsString}`;
  }

  try {
    const parsedUrl = new URL(
      url,
      typeof window !== 'undefined' ? window.location.href : 'http://localhost'
    );

    // Remove the special query params we add for retries
    parsedUrl.searchParams.delete('_t');
    parsedUrl.searchParams.delete('_rid');

    // Build a stable ID without the ephemeral `_t` and `_rid`
    return `${method}-${
      parsedUrl.pathname + parsedUrl.search
    }-${dataString}-${paramsString}`;
  } catch {
    // If parsing fails for some reason, fallback to the original
    return `${method}-${url}-${dataString}-${paramsString}`;
  }
}

function createApiRequestConfig(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const requestId = getRequestIdentifier(config);
  const retryCount = state.retryCountMap.get(requestId) || 0;
  const apiConfig: InternalAxiosRequestConfig = {
    ...config,
    timeout: getTimeout(retryCount),
    headers:
      config.headers instanceof AxiosHeaders
        ? new AxiosHeaders(config.headers.toJSON())
        : new AxiosHeaders(config.headers ?? {})
  };

  return apiConfig;
}

function resolveMaxBytes(c: InternalAxiosRequestConfig): number | undefined {
  const requested = c.meta?.maxBytes;
  if (typeof requested === 'number') {
    if (!isFinite(requested) || requested <= 0) return undefined; // turn guard off
    return requested;
  }
  const maxBytes = defaultMaxBytesForLink();
  return maxBytes;
}

function defaultMaxBytesForLink(): number {
  const MB = 1024 * 1024;
  switch (currentEffectiveType()) {
    case 'slow-2g':
    case '2g':
      return 1 * MB;
    case '3g':
      return 5 * MB;
    default:
      return 100 * MB;
  }
}

function currentEffectiveType(): string | undefined {
  if (typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    return nav.connection?.effectiveType;
  }
  return undefined;
}

function isRetryableError(error: AxiosError): boolean {
  const isCancel = (value: unknown): boolean => axios.isCancel(value);
  if (isCancel(error)) {
    return false;
  }
  if ((error as any).code === 'ERR_CANCELED') {
    return false;
  }
  if (!error.response) {
    return true;
  }
  const status = error.response.status;
  const nonRetryableCodes = [400, 401, 403, 404, 422];
  return !nonRetryableCodes.includes(status);
}

function getRetryDelay(retryCount: number, error?: AxiosError): number {
  const retryAfter = parseRetryAfter(error);
  if (retryAfter != null) return retryAfter;

  // Decorrelated jitter backoff: BASE + random(0, prev*3), capped
  const BASE = NETWORK_CONFIG.RETRY_DELAY; // 1s
  const CAP = NETWORK_CONFIG.MAX_TIMEOUT; // 60s
  const prev = Math.max(
    BASE,
    Math.min(CAP, BASE * Math.pow(2, Math.max(0, retryCount - 1)))
  );
  const delay = Math.min(CAP, BASE + Math.random() * prev * 3);
  return delay;
}
// Collapse identical in-flight GETs so we don't duplicate requests
const inflight = new Map<string, Promise<AxiosResponse>>();
async function sendWithCollapse(cfg: InternalAxiosRequestConfig) {
  const id = getRequestIdentifier(cfg);
  const isGet = cfg.method?.toLowerCase() === 'get';
  if (isGet && inflight.has(id)) {
    return inflight.get(id)!;
  }
  const p = axios(cfg).finally(() => {
    if (isGet) inflight.delete(id);
  });
  if (isGet) inflight.set(id, p);
  return p;
}

function parseRetryAfter(error?: AxiosError) {
  const headers = error?.response?.headers;
  const headerVal = headers?.['retry-after'] ?? headers?.['Retry-After'];
  if (!headerVal) return null;

  const seconds = parseInt(headerVal, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  const date = new Date(headerVal).getTime();
  if (!isNaN(date)) {
    const diff = date - Date.now();
    return diff > 0 ? diff : null;
  }
  return null;
}

function getTimeout(retryCount: number) {
  const BASE = NETWORK_CONFIG.MIN_TIMEOUT;
  const CAP = isSlow() ? NETWORK_CONFIG.MAX_TIMEOUT : 60_000;
  const jitter = Math.random() * 1000;
  return Math.min(BASE * Math.pow(2, retryCount) + jitter, CAP);
}

async function processQueue() {
  if (state.isQueueProcessing || state.isOffline) return;
  state.isQueueProcessing = true;

  try {
    cleanupOldRequests();

    const batch = Array.from(state.retryQueue).slice(
      0,
      NETWORK_CONFIG.BATCH_SIZE
    );

    if (batch.length === 0) {
      return;
    }

    batch.forEach((requestId) => state.retryQueue.delete(requestId));

    // Process requests with concurrency limit
    await Promise.all(
      batch.map((requestId) => {
        const item = state.retryMap.get(requestId);
        if (!item) return Promise.resolve();
        return limiter(() => processRetryItem(requestId, item));
      })
    );

    // If there's more in the queue, schedule the next batch
    if (state.retryQueue.size > 0) {
      setTimeout(() => {
        state.isQueueProcessing = false; // allow the next run
        processQueue();
      }, NETWORK_CONFIG.BATCH_INTERVAL);
    }
  } catch (error) {
    logForAdmin({
      message: `Error processing retry queue: ${error}`
    });
  } finally {
    state.isQueueProcessing = false;
  }
}

function cleanupOldRequests() {
  const MAX_AGE = NETWORK_CONFIG.MAX_TOTAL_DURATION;
  const now = Date.now();

  for (const requestId of state.retryQueue) {
    const item = state.retryMap.get(requestId);
    if (!item) {
      state.retryQueue.delete(requestId);
      continue;
    }
    if (now - item.timestamp > MAX_AGE) {
      const timeoutErr = new Error(
        'Request timed out: exceeded maximum retry duration'
      );
      if (item.lastError?.response) {
        attachErrorDetails(timeoutErr, item.lastError);
      }
      cleanup(requestId);
      item.reject(timeoutErr);
    }
  }
}

function addFreshRequestParams(config: AxiosRequestConfig) {
  if (config.method?.toLowerCase() !== 'get') return config;
  const now = Date.now();
  const randomId = Math.random().toString(36).slice(2);
  const url = config.url || '';

  const separator = url.includes('?') ? '&' : '?';
  const newUrl = `${url}${separator}_t=${now}&_rid=${randomId}`;

  return {
    ...config,
    url: newUrl
  };
}

async function processRetryItem(requestId: string, item: RetryItem) {
  if (state.processingRequests.get(requestId)) return;
  state.processingRequests.set(requestId, true);

  // Circuit breaker: if open, reschedule softly and skip this attempt
  if (!breakerAllowsAttempt()) {
    // small pause to avoid tight loops while open/half-open
    await sleep(2000);
    state.retryQueue.add(requestId);
    return; // finally{} will clear processing flag and trigger next round
  }

  try {
    let retryCount = state.retryCountMap.get(requestId) ?? 0;
    retryCount += 1;
    state.retryCountMap.set(requestId, retryCount);

    if (retryCount > NETWORK_CONFIG.MAX_RETRIES) {
      failOutMaxRetries(requestId, item, retryCount);
      return;
    }

    logRetryAttempt(requestId, retryCount, item.config);

    const delay = getRetryDelay(retryCount - 1, item.lastError);
    const sizeCap = resolveMaxBytes(item.config as InternalAxiosRequestConfig);
    const sizeAbortCtl =
      sizeCap && typeof AbortController === 'function'
        ? new AbortController()
        : undefined;
    await sleep(delay, sizeAbortCtl?.signal);

    const finalConfig: InternalAxiosRequestConfig = {
      ...addFreshRequestParams(item.config),
      timeout: getTimeout(retryCount - 1),
      signal: sizeAbortCtl?.signal,
      headers: new AxiosHeaders(
        item.config.headers instanceof AxiosHeaders
          ? item.config.headers.toJSON()
          : item.config.headers || {}
      )
    };

    if (sizeCap && sizeAbortCtl) {
      finalConfig.onDownloadProgress = (e: AxiosProgressEvent) => {
        if (e.loaded > sizeCap) {
          sizeAbortCtl.abort('max-bytes-exceeded');
        }
      };
    }

    const response = await sendWithCollapse(finalConfig);
    cleanup(requestId);
    item.resolve(response);
  } catch (error: any) {
    if (isSizeAbort(error)) {
      cleanup(requestId);
      item.reject(error);
      return;
    }
    item.lastError = error?.isAxiosError ? error : undefined;

    // Call noteRetryableError before re-adding to the queue
    noteRetryableError();

    const next = state.retryCountMap.get(requestId) ?? 0;
    if (next > NETWORK_CONFIG.MAX_RETRIES) {
      failOutMaxRetries(requestId, item, next);
      return;
    }

    state.retryCountMap.set(requestId, next);

    state.retryMap.set(requestId, {
      ...item,
      timestamp: Date.now(),
      lastError: item.lastError
    });

    state.retryQueue.add(requestId);
  } finally {
    state.processingRequests.delete(requestId);
    if (!state.isQueueProcessing && state.retryQueue.size) {
      processQueue();
    }
  }
}

function failOutMaxRetries(
  requestId: string,
  item: RetryItem,
  retryCount: number
) {
  logForAdmin({
    message: `Max retries reached for request: ${requestId} (attempts: ${retryCount})`
  });
  const finalErr = new Error(
    `Request failed after ${NETWORK_CONFIG.MAX_RETRIES} attempts`
  );
  attachErrorDetails(finalErr, item.lastError);
  cleanup(requestId);
  item.reject(finalErr);
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function handleRetry(config: AxiosRequestConfig, error: AxiosError) {
  const requestId = getRequestIdentifier(config);
  const currentRetryCount = state.retryCountMap.get(requestId) ?? 0;

  if (currentRetryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    logForAdmin({
      message: `Max retries exceeded: ${requestId} (attempts: ${currentRetryCount})`
    });
    cleanup(requestId);
    return Promise.reject(error);
  }
  if (state.retryQueue.size >= NETWORK_CONFIG.MAX_QUEUE) {
    logForAdmin({
      message: `Retry queue is full; dropping request ${requestId}`
    });
    state.retryCountMap.delete(requestId);

    (error as DroppableError).dropped = true;
    return Promise.reject(error);
  }
  if (isSizeAbort(error)) {
    logForAdmin({
      message: `Size abort detected; failing fast for request ${requestId}`
    });
    return Promise.reject(error);
  }

  if (state.retryMap.has(requestId)) {
    return state.retryMap.get(requestId)!.promise;
  }

  const { promise, resolve, reject } = createDeferredPromise<AxiosResponse>();
  const intCfg = config as InternalAxiosRequestConfig;
  state.retryMap.set(requestId, {
    config: intCfg,
    promise,
    resolve,
    reject,
    timestamp: Date.now(),
    lastError: error
  });
  state.retryQueue.add(requestId);

  processQueue();
  return promise;
}

function cleanup(requestId: string) {
  state.retryQueue.delete(requestId);
  state.retryMap.delete(requestId);
  state.retryCountMap.delete(requestId);
  state.processingRequests.delete(requestId);
}

function attachErrorDetails(targetErr: Error, original?: AxiosError) {
  if (!original) return;
  if (original.response) {
    (targetErr as any).response = original.response;
    (targetErr as any).config = original.config;
    (targetErr as any).code = original.code;
    (targetErr as any).status = original.response.status;
    (targetErr as any).data = original.response.data;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(() => {
      sleepers.delete(t);
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    sleepers.add(t);

    function onAbort() {
      clearTimeout(t);
      sleepers.delete(t);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    signal?.addEventListener('abort', onAbort);
  });
}

export function cancelAllRetries(reason = 'nav change') {
  for (const id of state.retryQueue) {
    const item = state.retryMap.get(id);
    if (item) {
      item.reject(new axios.CanceledError(reason));
      state.retryMap.delete(id);
    }
    cleanup(id);
  }
  for (const t of sleepers) clearTimeout(t);
  sleepers.clear();
}

function isSizeAbort(err: AxiosError) {
  return (
    axios.isCancel(err) &&
    (err.message === 'max-bytes-exceeded' ||
      (err as any).cause === 'max-bytes-exceeded')
  );
}

export default axiosInstance;
