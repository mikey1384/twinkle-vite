import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import URL from '~/constants/URL';
import { logForAdmin } from '~/helpers';

interface RetryItem {
  config: AxiosRequestConfig;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  lastError?: any;
}

interface NetworkConfig {
  MIN_TIMEOUT: number;
  MAX_TIMEOUT: number;
  RETRY_DELAY: number;
  MAX_RETRIES: number;
  MAX_TOTAL_DURATION: number;
  BATCH_SIZE: number;
  BATCH_INTERVAL: number;
}

const NETWORK_CONFIG: NetworkConfig = {
  MIN_TIMEOUT: 5000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000,
  BATCH_SIZE: 5,
  BATCH_INTERVAL: 1000
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
    message: `Retry attempt ${retryCount + 1}: ${config.method} ${
      config.url
    } (requestId: ${requestId}, totalRetries: ${state.retryCountMap.get(
      requestId
    )})`
  });
}

function getRequestIdentifier(config: AxiosRequestConfig): string {
  return `${config.method}-${config.url}-${JSON.stringify(
    config.data || {}
  )}-${JSON.stringify(config.params || {})}`;
}

function createApiRequestConfig(
  config: AxiosRequestConfig
): AxiosRequestConfig {
  const requestId = getRequestIdentifier(config);
  const retryCount = state.retryCountMap.get(requestId) || 0;

  const minTimeout = config.timeout || NETWORK_CONFIG.MIN_TIMEOUT;
  return {
    ...config,
    timeout: getTimeout(retryCount, minTimeout)
  };
}

const axiosInstance = axios.create({
  headers: { Priority: 'u=1', Urgency: 'u=1' }
});

axiosInstance.interceptors.request.use((config: any = {}) => {
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  return isApiRequest && isGetRequest ? createApiRequestConfig(config) : config;
});

axiosInstance.interceptors.response.use(handleSuccessfulResponse, (error) => {
  const config = error?.config || {};
  const isGetRequest = config.method?.toLowerCase() === 'get';
  const isApiRequest = config.url?.startsWith(URL);

  if (!isGetRequest || !isApiRequest || !isRetryableError(error)) {
    return Promise.reject(error);
  }
  return handleRetry(config, error);
});

function handleSuccessfulResponse(response: AxiosResponse) {
  const requestId = getRequestIdentifier(response.config);
  state.retryCountMap.delete(requestId);

  if (state.retryMap.has(requestId)) {
    const retryItem = state.retryMap.get(requestId)!;
    cleanup(requestId);
    retryItem.resolve(response);
  }

  return response;
}

// ADDED 429 and 503 to nonRetryable
function isRetryableError(error: any): boolean {
  if (!error.response) {
    // Network errors, timeouts, etc.
    return true;
  }

  const status = error.response.status;
  const nonRetryableCodes = [
    400, // Bad Request
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    422, // Unprocessable Entity
    429, // Too Many Requests -> often means rate-limit
    503 // Service Unavailable -> avoid hammering
  ];

  return !nonRetryableCodes.includes(status);
}

function getRetryDelay(retryCount: number) {
  const baseDelay = NETWORK_CONFIG.RETRY_DELAY;
  const incrementedDelay = baseDelay * (retryCount + 1);
  const jitter = Math.random() * 1000;
  return Math.min(incrementedDelay + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

function getTimeout(
  retryCount: number,
  minTimeout: number = NETWORK_CONFIG.MIN_TIMEOUT
) {
  const baseTimeout = minTimeout * (retryCount + 1);
  const jitter = Math.random() * 2000;
  return Math.min(baseTimeout + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

async function processQueue() {
  if (state.isQueueProcessing) return;
  state.isQueueProcessing = true;

  try {
    cleanupOldRequests();

    // Get first BATCH_SIZE requestIds from queue
    const batch = Array.from(state.retryQueue).slice(
      0,
      NETWORK_CONFIG.BATCH_SIZE
    );
    if (batch.length === 0) {
      state.isQueueProcessing = false;
      return;
    }

    // Remove processed requestIds from queue
    batch.forEach((requestId) => state.retryQueue.delete(requestId));

    // Process each request independently
    for (const requestId of batch) {
      const item = state.retryMap.get(requestId)!;
      processRetryItem(requestId, item).catch((error) =>
        logForAdmin({
          message: `Error processing retry item: ${error}`
        })
      );
    }

    if (state.retryQueue.size > 0) {
      setTimeout(() => {
        state.isQueueProcessing = false;
        processQueue();
      }, NETWORK_CONFIG.BATCH_INTERVAL);
    } else {
      state.isQueueProcessing = false;
    }
  } catch (error) {
    logForAdmin({
      message: `Error processing retry queue: ${error}`
    });
    state.isQueueProcessing = false;
  }
}

function cleanupOldRequests() {
  const MAX_AGE = NETWORK_CONFIG.MAX_TOTAL_DURATION;
  const now = Date.now();

  for (const requestId of state.retryQueue) {
    const item = state.retryMap.get(requestId)!;
    if (now - item.timestamp > MAX_AGE) {
      const timeoutErr = new Error(
        'Request timeout - exceeded maximum retry duration'
      );
      if (item.lastError?.response) {
        (timeoutErr as any).response = item.lastError.response;
        (timeoutErr as any).config = item.lastError.config;
        (timeoutErr as any).code = item.lastError.code;
        (timeoutErr as any).status = item.lastError.response.status;
        (timeoutErr as any).data = item.lastError.response.data;
      }
      cleanup(requestId);
      item.reject(timeoutErr);
    }
  }
}

function addFreshRequestParams(config: AxiosRequestConfig) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_t=${timestamp}&_rid=${randomId}`;
  return config;
}

async function processRetryItem(requestId: string, item: RetryItem) {
  if (state.processingRequests.get(requestId)) return;

  const { resolve, reject } = item;
  const config = { ...item.config };
  const retryCount = state.retryCountMap.get(requestId) || 0;

  if (retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    logForAdmin({
      message: `Max retries reached for request: ${requestId} (attempts: ${retryCount})`
    });
    const finalErr = new Error(
      `Request failed after ${NETWORK_CONFIG.MAX_RETRIES} attempts`
    );
    if (item.lastError?.response) {
      (finalErr as any).response = item.lastError.response;
      (finalErr as any).config = item.lastError.config;
      (finalErr as any).code = item.lastError.code;
      (finalErr as any).status = item.lastError.response.status;
      (finalErr as any).data = item.lastError.response.data;
    }
    cleanup(requestId);
    reject(finalErr);
    return;
  }

  logRetryAttempt(requestId, retryCount, config);

  setTimeout(async () => {
    try {
      state.processingRequests.set(requestId, true);
      state.retryCountMap.set(requestId, retryCount + 1);

      const response = await axiosInstance({
        ...addFreshRequestParams(config),
        timeout: getTimeout(retryCount, config.timeout)
      });
      resolve(response);
    } catch (error) {
      item.lastError = error;
      const currentRetryCount = state.retryCountMap.get(requestId) || 0;
      if (currentRetryCount < NETWORK_CONFIG.MAX_RETRIES - 1) {
        const {
          promise,
          resolve: newResolve,
          reject: newReject
        } = createDeferredPromise<AxiosResponse>();
        state.retryMap.set(requestId, {
          config,
          promise,
          resolve: newResolve,
          reject: newReject,
          timestamp: Date.now(),
          lastError: error
        });
        state.retryQueue.add(requestId);
      } else {
        cleanup(requestId);
        reject(error);
      }
    } finally {
      state.processingRequests.delete(requestId);
    }
  }, getRetryDelay(retryCount));
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

function handleRetry(config: AxiosRequestConfig, error: any) {
  const requestId = getRequestIdentifier(config);
  if (state.retryQueue.has(requestId)) {
    return state.retryMap.get(requestId)!.promise;
  }

  const retryCount = state.retryCountMap.get(requestId) || 0;
  if (retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    logForAdmin({
      message: `Max retries exceeded: ${requestId} (attempts: ${retryCount})`
    });
    cleanup(requestId);
    return Promise.reject(error);
  }

  state.retryCountMap.set(requestId, retryCount + 1);
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

export default axiosInstance;
