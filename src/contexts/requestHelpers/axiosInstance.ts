import axios, {
  AxiosResponse,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders
} from 'axios';
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
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000,
  BATCH_SIZE: 5,
  BATCH_INTERVAL: 1000,
  MAX_QUEUE: 200
};

const state = {
  retryQueue: new Set<string>(),
  retryMap: new Map<string, RetryItem>(),
  processingRequests: new Map<string, boolean>(),
  retryCountMap: new Map<string, number>(),
  isQueueProcessing: false
};

function logRetryAttempt(
  requestId: string,
  retryCount: number,
  config: AxiosRequestConfig
) {
  logForAdmin({
    message: `Retry attempt ${retryCount}: ${config.method} ${config.url} (requestId: ${requestId})`
  });
}

/**
 * Removes any `_t` and `_rid` parameters we add for "cache-busting"
 * so that each retry does NOT produce a different requestId.
 */
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

  const minTimeout = config.timeout ?? NETWORK_CONFIG.MIN_TIMEOUT;
  return {
    ...config,
    timeout: getTimeout(retryCount, minTimeout),
    headers:
      config.headers instanceof AxiosHeaders
        ? new AxiosHeaders(config.headers.toJSON())
        : new AxiosHeaders(config.headers ?? {})
  };
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

function isRetryableError(error: AxiosError<any>): boolean {
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

  const delay = NETWORK_CONFIG.RETRY_DELAY * (retryCount + 1);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
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

function getTimeout(
  retryCount: number,
  minTimeout: number = NETWORK_CONFIG.MIN_TIMEOUT
) {
  const timeout = minTimeout * (retryCount + 1);
  const jitter = Math.random() * 2000;
  return Math.min(timeout + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

async function processQueue() {
  if (state.isQueueProcessing) return;
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

    await Promise.all(
      batch.map(async (requestId) => {
        const item = state.retryMap.get(requestId);
        if (!item) return;
        try {
          await processRetryItem(requestId, item);
        } catch (error) {
          logForAdmin({
            message: `Error processing retry item [${requestId}]: ${error}`
          });
        }
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

  try {
    let retryCount = state.retryCountMap.get(requestId) ?? 0;
    if (retryCount > NETWORK_CONFIG.MAX_RETRIES) {
      failOutMaxRetries(requestId, item, retryCount);
      return;
    }

    retryCount += 1;
    state.retryCountMap.set(requestId, retryCount);

    if (retryCount > NETWORK_CONFIG.MAX_RETRIES) {
      failOutMaxRetries(requestId, item, retryCount);
      return;
    }

    logRetryAttempt(requestId, retryCount, item.config);

    const delay = getRetryDelay(retryCount - 1, item.lastError);
    await sleep(delay);

    const finalConfig = {
      ...addFreshRequestParams(item.config),
      timeout: getTimeout(
        retryCount - 1,
        item.config.timeout ?? NETWORK_CONFIG.MIN_TIMEOUT
      )
    };

    const response = await axiosInstance(finalConfig);
    item.resolve(response);
  } catch (error: any) {
    item.lastError = error?.isAxiosError ? error : undefined;

    const nextRetryCount = (state.retryCountMap.get(requestId) ?? 0) + 1;
    if (nextRetryCount <= NETWORK_CONFIG.MAX_RETRIES) {
      state.retryCountMap.set(requestId, nextRetryCount);

      // update timestamp so we don't exceed MAX_TOTAL_DURATION
      state.retryMap.set(requestId, {
        ...item,
        timestamp: Date.now(),
        lastError: item.lastError
      });

      state.retryQueue.add(requestId);
      processQueue();
      return;
    }

    failOutMaxRetries(requestId, item, nextRetryCount);
  } finally {
    state.processingRequests.delete(requestId);
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

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
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
}

export default axiosInstance;
