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
  config: AxiosRequestConfig;
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
  MIN_TIMEOUT: 5000,
  MAX_TIMEOUT: 30_000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000,
  BATCH_SIZE: 5,
  BATCH_INTERVAL: 1000,
  MAX_QUEUE: 200
};

const conn = (typeof navigator !== 'undefined' && navigator.connection) as any;

// (3) Guard navigator.connection access in isVerySlow
const isVerySlow = () =>
  (conn && ['slow-2g', '2g'].includes(conn.effectiveType)) ?? false;

let limiter = pLimit(3); // Declare as let

function applyBandwidthPreset(slow: boolean) {
  NETWORK_CONFIG.BATCH_SIZE = slow ? 1 : 5;
  NETWORK_CONFIG.BATCH_INTERVAL = slow ? 3000 : 1000;
  NETWORK_CONFIG.MAX_QUEUE = slow ? 50 : 200;
  limiter = pLimit(slow ? 1 : 3); // recreate
}

if (typeof window !== 'undefined') {
  applyBandwidthPreset(!!isVerySlow());
}

// react to later network changes (user drives into Wi-Fi / back to Edge)
conn?.addEventListener?.('change', () => applyBandwidthPreset(!!isVerySlow()));

const state = {
  retryQueue: new Set<string>(),
  retryMap: new Map<string, RetryItem>(),
  processingRequests: new Map<string, boolean>(),
  retryCountMap: new Map<string, number>(),
  isQueueProcessing: false,
  isOffline: false
};

const sleepers = new Set<ReturnType<typeof setTimeout>>();

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

  const wantsBinary =
    apiConfig.responseType === 'blob' ||
    apiConfig.responseType === 'arraybuffer';

  const maxBytes = !wantsBinary ? resolveMaxBytes(apiConfig) : undefined;

  if (maxBytes !== undefined && typeof window !== 'undefined') {
    apiConfig.onDownloadProgress = (e: AxiosProgressEvent) => {
      if (e.loaded > maxBytes) {
        ((e as unknown as ProgressEvent).target as XMLHttpRequest)?.abort?.();
      }
    };
  }
  return apiConfig;
}

function resolveMaxBytes(c: InternalAxiosRequestConfig): number | undefined {
  const requested = c.meta?.maxBytes;
  if (typeof requested === 'number') {
    if (!isFinite(requested) || requested <= 0) return undefined; // turn guard off
    return requested;
  }
  return defaultMaxBytesForLink();
}

const axiosInstance = axios.create({
  headers: { Priority: 'u=1', Urgency: 'u=1' }
});

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
  return response;
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
  return typeof navigator !== 'undefined' && navigator.connection
    ? (navigator.connection as any).effectiveType
    : undefined;
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

  const BASE = NETWORK_CONFIG.RETRY_DELAY;
  const CAP = NETWORK_CONFIG.MAX_TIMEOUT;
  const jitter = Math.random() * 500;
  return Math.min(BASE * Math.pow(2, retryCount) + jitter, CAP);
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
  const CAP = NETWORK_CONFIG.MAX_TIMEOUT;
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
  const abortCtl = new AbortController();

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
    await sleep(delay, abortCtl.signal);

    const finalConfig = {
      ...addFreshRequestParams(item.config),
      timeout: getTimeout(retryCount - 1)
    };

    const response = await axios(finalConfig);
    item.resolve(response);
  } catch (error: any) {
    item.lastError = error?.isAxiosError ? error : undefined;

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
    abortCtl.abort();
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

  // If we're already retrying the same requestId, return the in-flight promise
  if (state.retryMap.has(requestId)) {
    return state.retryMap.get(requestId)!.promise;
  }

  // Otherwise, enqueue a new RetryItem
  const { promise, resolve, reject } = createDeferredPromise<AxiosResponse>();
  state.retryMap.set(requestId, {
    config,
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
      resolve();
    }, ms);
    sleepers.add(t);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      sleepers.delete(t);
    });
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

export default axiosInstance;
