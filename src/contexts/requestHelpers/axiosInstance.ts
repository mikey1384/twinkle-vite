import axios, { AxiosResponse } from 'axios';
import URL from '~/constants/URL';

interface RetryItem {
  config: any;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 5000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000 // 5 minutes total
} as const;

let activeRetries = 0;
const retryLock = new Set<string>();

const retryQueue = new Set<string>();
const retryMap = new Map<string, RetryItem>();
const processingRequests = new Map<string, boolean>();
const retryCountMap = new Map<string, number>();
const timeoutMap = new Map<string, number>();

const BATCH_SIZE = 5;
const BATCH_INTERVAL = 1000;

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}
function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
}
const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'u=1'
  }
});

axiosInstance.interceptors.request.use((config: any) => {
  if (!config) {
    config = {};
  }
  const isApiRequest = config.url?.startsWith(URL);
  if (!isApiRequest) return config;

  const requestId = getRequestIdentifier(config);
  const retryCount = retryCountMap.get(requestId) || 0;
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (isGetRequest) {
    const timeout = getTimeout(retryCount);
    timeoutMap.set(requestId, timeout);
    config.timeout = timeout;
  }

  config.headers = {
    ...config.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Request-Time': Date.now().toString(),
    Priority: 'u=1'
  };

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const requestId = getRequestIdentifier(response.config);

    // Clean up maps
    retryCountMap.delete(requestId);
    timeoutMap.delete(requestId);

    // If this request was being retried, clean it up and resolve
    if (retryMap.has(requestId)) {
      logWithTimestamp(
        `🧹 Cleaning up pending retry for successful request: ${requestId}`
      );
      const retryItem = retryMap.get(requestId)!;
      retryMap.delete(requestId);
      retryQueue.delete(requestId);
      retryItem.resolve(response);
    }

    return response;
  },
  (error) => {
    if (!error?.config) {
      error.config = {};
    }
    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const requestId = getRequestIdentifier(config);

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

      // Don't immediately clean up - let the retry mechanism handle it
      if (
        !retryQueue.has(requestId) &&
        isGetRequest &&
        config.url?.startsWith(URL)
      ) {
        const retryCount = retryCountMap.get(requestId) || 0;
        if (retryCount < NETWORK_CONFIG.MAX_RETRIES) {
          return handleRetry(config, error);
        }
      }
    }

    if (!config.url?.startsWith(URL) || !isGetRequest) {
      return Promise.reject(error);
    }

    return handleRetry(config, error);
  }
);

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

  // Clean up old requests
  for (const requestId of retryQueue) {
    const item = retryMap.get(requestId)!;
    if (now - item.timestamp > MAX_AGE) {
      retryQueue.delete(requestId);
      retryMap.delete(requestId);
      retryCountMap.delete(requestId);
      timeoutMap.delete(requestId);
      processingRequests.delete(requestId);
      item.reject(
        new Error('Request timeout - exceeded maximum retry duration')
      );
    }
  }
}

async function processQueue() {
  try {
    cleanupOldRequests();
    resetActiveRetries();

    // Get first BATCH_SIZE requestIds from queue
    const batch = Array.from(retryQueue).slice(0, BATCH_SIZE);
    if (batch.length === 0) return;

    // Remove processed requestIds from queue
    batch.forEach((requestId) => retryQueue.delete(requestId));

    // Process each request independently
    for (const requestId of batch) {
      const item = retryMap.get(requestId)!;
      processRetryItem(requestId, item).catch((error) =>
        logWithTimestamp('Error processing retry item:', error)
      );
    }

    // Schedule next batch if there are more items
    if (retryQueue.size > 0) {
      setTimeout(processQueue, BATCH_INTERVAL);
    }
  } catch (error) {
    logWithTimestamp('Error processing retry queue:', error);
  }
}

function addFreshRequestParams(config: any) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  // Add timestamp to URL params
  const separator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_t=${timestamp}&_rid=${randomId}`;

  // Also add to headers for good measure
  config.headers = {
    ...config.headers,
    'X-Fresh-Request': `${timestamp}-${randomId}`
  };

  return config;
}

async function processRetryItem(requestId: string, item: RetryItem) {
  if (processingRequests.get(requestId)) {
    logWithTimestamp(`⚠️ Request ${requestId} already processing`);
    return;
  }

  const { resolve, reject } = item;
  let config = { ...item.config };
  const retryCount = retryCountMap.get(requestId) || 0;

  // Add early check for max retries
  if (retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    logWithTimestamp(
      `🛑 Request ${requestId} has reached max retries (${NETWORK_CONFIG.MAX_RETRIES}), rejecting`
    );
    reject(
      new Error(`Request failed after ${NETWORK_CONFIG.MAX_RETRIES} attempts`)
    );
    cleanup();
    return;
  }

  const delay = getRetryDelay(retryCount);

  setTimeout(async () => {
    try {
      processingRequests.set(requestId, true);
      incrementActiveRetries(requestId);

      // Add fresh request parameters before retrying
      config = addFreshRequestParams(config);
      logWithTimestamp(`🔄 Processing retry for ${requestId}`, {
        attempt: retryCount + 1,
        queueLength: retryQueue.size,
        activeRetries,
        timeout: config.timeout
      });

      retryCountMap.set(requestId, retryCount + 1);
      const timeout = getTimeout(retryCount);
      config.timeout = timeout;
      timeoutMap.set(requestId, timeout);

      logWithTimestamp(`📤 Retrying request ${requestId}`, {
        timeout,
        activeRetries,
        queueLength: retryQueue.size
      });
      const response = await axiosInstance(config);
      logWithTimestamp(`✅ Request ${requestId} succeeded!`);
      resolve(response);
    } catch (error: any) {
      logWithTimestamp(`❌ Retry attempt failed for ${requestId}`, {
        error: error.message,
        attempt: retryCount + 1,
        timeout: config.timeout
      });

      // Update retry count check to use the current value
      const currentRetryCount = retryCountMap.get(requestId) || 0;
      if (currentRetryCount < NETWORK_CONFIG.MAX_RETRIES - 1) {
        // Subtract 1 to account for the next attempt
        logWithTimestamp(`↪️ Requeueing ${requestId} for another attempt`);
        const {
          promise,
          resolve: newResolve,
          reject: newReject
        } = createDeferredPromise<AxiosResponse>();

        retryMap.set(requestId, {
          config,
          promise,
          resolve: newResolve,
          reject: newReject,
          timestamp: Date.now()
        });
        retryQueue.add(requestId);
      } else {
        logWithTimestamp(
          `🛑 Request ${requestId} failed permanently after ${NETWORK_CONFIG.MAX_RETRIES} attempts`
        );
        cleanup();
        reject(error);
      }
    } finally {
      decrementActiveRetries(requestId);
      processingRequests.delete(requestId);
    }
  }, delay);

  function cleanup() {
    retryQueue.delete(requestId);
    retryMap.delete(requestId);
    retryCountMap.delete(requestId);
    timeoutMap.delete(requestId);
    processingRequests.delete(requestId);
    decrementActiveRetries(requestId);
  }
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

// Add a safety check function
function resetActiveRetries() {
  const activeRequests = Array.from(processingRequests.values()).filter(
    Boolean
  ).length;
  if (activeRetries !== activeRequests) {
    logWithTimestamp(
      `⚠️ Fixing activeRetries count: ${activeRetries} -> ${activeRequests}`
    );
    activeRetries = activeRequests;
  }
}

function incrementActiveRetries(requestId: string) {
  if (!retryLock.has(requestId)) {
    retryLock.add(requestId);
    activeRetries++;
  }
}

function decrementActiveRetries(requestId: string) {
  if (retryLock.has(requestId)) {
    retryLock.delete(requestId);
    activeRetries = Math.max(0, activeRetries - 1);
  }
}

// New helper function to handle retries
function handleRetry(config: any, error: any) {
  const requestId = getRequestIdentifier(config);
  const retryCount = retryCountMap.get(requestId) || 0;

  if (retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    logWithTimestamp(
      `🛑 Request ${requestId} has reached max retries, rejecting`,
      { retryCount }
    );
    cleanup(requestId);
    return Promise.reject(error);
  }

  retryCountMap.set(requestId, retryCount + 1);
  logWithTimestamp(
    `🔄 Request ${requestId} failed, scheduling retry ${retryCount + 1}/${
      NETWORK_CONFIG.MAX_RETRIES
    }`
  );

  // Check if request is already in queue
  if (retryQueue.has(requestId)) {
    logWithTimestamp(`⚠️ Request ${requestId} already in retry queue`);
    return retryMap.get(requestId)!.promise;
  }

  const { promise, resolve, reject } = createDeferredPromise<AxiosResponse>();

  retryMap.set(requestId, {
    config,
    promise,
    resolve,
    reject,
    timestamp: Date.now()
  });
  retryQueue.add(requestId);

  processQueue();
  return promise;
}

// New helper function to clean up request state
function cleanup(requestId: string) {
  retryQueue.delete(requestId);
  retryMap.delete(requestId);
  retryCountMap.delete(requestId);
  timeoutMap.delete(requestId);
  processingRequests.delete(requestId);
  decrementActiveRetries(requestId);
}

export default axiosInstance;
