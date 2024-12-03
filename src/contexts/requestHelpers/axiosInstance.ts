import axios, { AxiosResponse } from 'axios';
import URL from '~/constants/URL';

interface RequestItem {
  config: any;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  retryCount: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 1000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000
};

const retryQueue = new Set<string>();
const processingRequests = new Map<string, boolean>();
const requestMap = new Map<string, RequestItem>();

const BATCH_SIZE = 5;
const BATCH_INTERVAL = 1000;

// Add constant for cache busting parameter name
const CACHE_BUSTER_PARAM = '_cb';

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}
function getRequestIdentifier(config: any): string {
  // Remove only the cache busting parameter while preserving other query params
  const url =
    config.url?.replace(new RegExp(`[?&]${CACHE_BUSTER_PARAM}=\\d+`), '') || '';
  return `${config.method}-${url}`;
}
const axiosInstance = axios.create({
  headers: {
    Priority: 'u=1'
  }
});

axiosInstance.interceptors.request.use((config: any) => {
  if (!config) {
    config = {};
  }
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (!isApiRequest || !isGetRequest) {
    return config;
  }

  const requestId = getRequestIdentifier(config);

  const {
    promise,
    resolve: newResolve,
    reject: newReject
  } = createDeferredPromise<AxiosResponse>();

  if (!requestMap.has(requestId)) {
    requestMap.set(requestId, {
      config,
      promise,
      resolve: newResolve,
      reject: newReject,
      retryCount: 0
    });
  }
  if (!config.timeout) {
    config.timeout = NETWORK_CONFIG.MIN_TIMEOUT + Math.random() * 10000;
  }

  const separator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}${CACHE_BUSTER_PARAM}=${Date.now()}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const isGetRequest = response.config.method?.toLowerCase() === 'get';
    if (!isGetRequest) {
      return response;
    }

    const requestId = getRequestIdentifier(response.config);
    const retryItem = requestMap.get(requestId);
    if (retryItem) {
      retryItem.resolve(response);
    }
    cleanup(requestId);
    return response;
  },
  (error) => {
    if (!error?.config) {
      error.config = {};
    }
    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    // Immediately reject if not a GET request or not an API request
    if (!isGetRequest || !isApiRequest) {
      return Promise.reject(error);
    }

    const requestId = getRequestIdentifier(config);
    processingRequests.delete(requestId);
    const request = requestMap.get(requestId);
    if (!request) {
      return Promise.reject(error);
    }

    // Log all errors for debugging
    logWithTimestamp(`❌ Request error for ${requestId}`, {
      errorCode: error.code,
      errorMessage: error.message,
      status: error.response?.status,
      timeout: config.timeout
    });

    // Handle timeout errors more gracefully
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logWithTimestamp(`⏱️ Request ${requestId} timed out, attempting retry`);
      const retryCount = request.retryCount || 0;
      if (retryCount < NETWORK_CONFIG.MAX_RETRIES) {
        return handleRetry(config);
      } else {
        logWithTimestamp(
          `🛑 Request ${requestId} has reached max retries, rejecting`,
          { retryCount }
        );
      }
    }

    cleanup(requestId);
    return Promise.reject(error);
  }
);

function handleRetry(config: any) {
  const requestId = getRequestIdentifier(config);
  const request = requestMap.get(requestId)!;
  const retryCount = request.retryCount || 0;
  const nextRetryCount = retryCount + 1;

  logWithTimestamp(
    `🔄 Request ${requestId} failed, scheduling retry attempt ${nextRetryCount}/${NETWORK_CONFIG.MAX_RETRIES}`
  );

  // Check if request is already in queue
  if (retryQueue.has(requestId)) {
    logWithTimestamp(`⚠️ Request ${requestId} already in retry queue`);
    return requestMap.get(requestId)!.promise;
  }

  const { promise, resolve, reject } = createDeferredPromise<AxiosResponse>();

  requestMap.set(requestId, {
    config,
    promise,
    resolve,
    reject,
    retryCount: nextRetryCount
  });
  retryQueue.add(requestId);

  processQueue();
  return promise;
}

async function processQueue() {
  try {
    const batch = Array.from(retryQueue).slice(0, BATCH_SIZE);
    if (batch.length === 0) return;

    batch.forEach((requestId) => retryQueue.delete(requestId));

    for (const requestId of batch) {
      const request = requestMap.get(requestId)!;
      processRetryItem(requestId, request).catch((error) =>
        logWithTimestamp('Error processing retry item:', error)
      );
    }

    if (retryQueue.size > 0) {
      setTimeout(processQueue, BATCH_INTERVAL);
    }
  } catch (error) {
    logWithTimestamp('Error processing retry queue:', error);
  }
}

async function processRetryItem(requestId: string, request: RequestItem) {
  if (processingRequests.get(requestId)) {
    logWithTimestamp(`⚠️ Request ${requestId} already processing`);
    return;
  }
  const retryCount = request.retryCount || 0;
  const newRetryCount = retryCount + 1;
  request.retryCount = newRetryCount;

  const { resolve, reject } = request;
  const config = { ...request.config };

  const delay = getRetryDelay(newRetryCount);
  function getRetryDelay(retryCount: number) {
    const baseDelay = NETWORK_CONFIG.RETRY_DELAY;
    const jitter = Math.random() * 5000;
    const incrementedDelay = baseDelay + retryCount * jitter;
    return Math.min(incrementedDelay, NETWORK_CONFIG.MAX_TIMEOUT + jitter);
  }

  setTimeout(async () => {
    try {
      processingRequests.set(requestId, true);
      logWithTimestamp(`🔄 Processing retry for ${requestId}`, {
        attempt: newRetryCount,
        queueLength: retryQueue.size,
        timeout: config.timeout
      });

      const timeout = getTimeout(newRetryCount);
      config.timeout = timeout;

      logWithTimestamp(`📤 Retrying request ${requestId}`, {
        timeout,
        queueLength: retryQueue.size
      });
      const response = await axiosInstance(config);
      logWithTimestamp(`✅ Request ${requestId} succeeded!`);
      resolve(response);
    } catch (error: any) {
      const request = requestMap.get(requestId)!;
      const retryCount = request.retryCount || 0;
      logWithTimestamp(`❌ Retry attempt failed for ${requestId}`, {
        error: error.message,
        attempt: retryCount,
        timeout: config.timeout
      });
      if (retryCount < NETWORK_CONFIG.MAX_RETRIES) {
        logWithTimestamp(`↪️ Requeueing ${requestId} for another attempt`);
        retryQueue.add(requestId);
      } else {
        logWithTimestamp(
          `🛑 Request ${requestId} failed permanently after ${NETWORK_CONFIG.MAX_RETRIES} attempts`
        );
        reject(error);
      }
    } finally {
      cleanup(requestId);
      processingRequests.delete(requestId);
    }
  }, delay);
}

function cleanup(requestId: string) {
  retryQueue.delete(requestId);
  requestMap.delete(requestId);
  processingRequests.delete(requestId);
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

function getTimeout(retryCount: number) {
  const jitter = Math.random() * 5000;
  const baseTimeout = NETWORK_CONFIG.MIN_TIMEOUT + retryCount * jitter;
  return Math.min(baseTimeout, NETWORK_CONFIG.MAX_TIMEOUT + jitter);
}

export default axiosInstance;
