import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import URL from '~/constants/URL';

interface RetryItem {
  config: AxiosRequestConfig;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
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
  retryCountMap: new Map<string, number>()
};

function logWithTimestamp(message: string, data?: any) {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
  }
}

function logRetryAttempt(
  requestId: string,
  retryCount: number,
  config: AxiosRequestConfig
) {
  logWithTimestamp(`Retry attempt ${retryCount + 1}:`, {
    method: config.method,
    url: config.url,
    requestId,
    totalRetries: state.retryCountMap.get(requestId)
  });
}

function getRequestIdentifier(config: AxiosRequestConfig): string {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
}

function createApiRequestConfig(
  config: AxiosRequestConfig
): AxiosRequestConfig {
  const requestId = getRequestIdentifier(config);
  const retryCount = state.retryCountMap.get(requestId) || 0;

  return {
    ...config,
    timeout: getTimeout(retryCount),
    headers: {
      ...config.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    }
  };
}

const axiosInstance = axios.create({
  headers: { Priority: 'u=1' }
});

axiosInstance.interceptors.request.use((config: any = {}) => {
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  return isApiRequest && isGetRequest ? createApiRequestConfig(config) : config;
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

axiosInstance.interceptors.response.use(handleSuccessfulResponse, (error) => {
  const config = error?.config || {};
  const isGetRequest = config.method?.toLowerCase() === 'get';
  const isApiRequest = config.url?.startsWith(URL);

  if (!isGetRequest || !isApiRequest) {
    return Promise.reject(error);
  }

  return handleRetry(config, error);
});

function getRetryDelay(retryCount: number) {
  const baseDelay = NETWORK_CONFIG.RETRY_DELAY;
  const incrementedDelay = baseDelay * (retryCount + 1);
  const jitter = Math.random() * 1000;
  return Math.min(incrementedDelay + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

function getTimeout(retryCount: number) {
  const baseTimeout = NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1);
  const jitter = Math.random() * 2000;
  return Math.min(baseTimeout + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

function cleanupOldRequests() {
  const MAX_AGE = NETWORK_CONFIG.MAX_TOTAL_DURATION;
  const now = Date.now();

  for (const requestId of state.retryQueue) {
    const item = state.retryMap.get(requestId)!;
    if (now - item.timestamp > MAX_AGE) {
      state.retryQueue.delete(requestId);
      state.retryMap.delete(requestId);
      state.retryCountMap.delete(requestId);
      state.processingRequests.delete(requestId);
      item.reject(
        new Error('Request timeout - exceeded maximum retry duration')
      );
    }
  }
}

async function processQueue() {
  try {
    cleanupOldRequests();

    // Get first BATCH_SIZE requestIds from queue
    const batch = Array.from(state.retryQueue).slice(
      0,
      NETWORK_CONFIG.BATCH_SIZE
    );
    if (batch.length === 0) return;

    // Remove processed requestIds from queue
    batch.forEach((requestId) => state.retryQueue.delete(requestId));

    // Process each request independently
    for (const requestId of batch) {
      const item = state.retryMap.get(requestId)!;
      processRetryItem(requestId, item).catch((error) =>
        logWithTimestamp('Error processing retry item:', error)
      );
    }

    // Schedule next batch if there are more items
    if (state.retryQueue.size > 0) {
      setTimeout(processQueue, NETWORK_CONFIG.BATCH_INTERVAL);
    }
  } catch (error) {
    logWithTimestamp('Error processing retry queue:', error);
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
    logWithTimestamp(`Max retries reached for request:`, {
      requestId,
      attempts: retryCount
    });
    cleanup(requestId);
    reject(
      new Error(`Request failed after ${NETWORK_CONFIG.MAX_RETRIES} attempts`)
    );
    return;
  }

  logRetryAttempt(requestId, retryCount, config);

  setTimeout(async () => {
    try {
      state.processingRequests.set(requestId, true);
      state.retryCountMap.set(requestId, retryCount + 1);

      const response = await axiosInstance({
        ...addFreshRequestParams(config),
        timeout: getTimeout(retryCount)
      });
      resolve(response);
    } catch (error) {
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
          timestamp: Date.now()
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
    logWithTimestamp(`Max retries exceeded:`, {
      requestId,
      attempts: retryCount
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
    timestamp: Date.now()
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
