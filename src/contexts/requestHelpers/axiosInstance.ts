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
  MIN_TIMEOUT: 2000,
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

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
}

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'high',
    'X-Priority': 'high'
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
    Priority: 'high',
    'X-Priority': 'high'
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
      console.log(
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

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.log(
        `⏱️ Request ${requestId} timed out, cleaning up processing state`
      );
      processingRequests.delete(requestId);
      decrementActiveRetries(requestId);

      // Clean up any existing retry
      if (retryQueue.has(requestId)) {
        console.log(`🧹 Removing retry for timed out request: ${requestId}`);
        retryQueue.delete(requestId);
        retryMap.delete(requestId);
      }
    }

    if (!config.url?.startsWith(URL) || !isGetRequest) {
      return Promise.reject(error);
    }

    const retryCount = retryCountMap.get(requestId) || 0;

    if (retryCount < NETWORK_CONFIG.MAX_RETRIES) {
      retryCountMap.set(requestId, retryCount + 1);
      console.log(
        `🔄 Request ${requestId} failed, attempt ${retryCount + 1}/${
          NETWORK_CONFIG.MAX_RETRIES
        }`,
        {
          error: error.message,
          status: error.response?.status
        }
      );

      // Check if request is already in queue
      if (retryQueue.has(requestId)) {
        console.log(`⏳ Request ${requestId} already in retry queue`);
        return retryMap.get(requestId)!.promise;
      }

      let promiseResolve: (value: AxiosResponse) => void;
      let promiseReject: (reason?: any) => void;
      const promise = new Promise<AxiosResponse>((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });

      retryMap.set(requestId, {
        config,
        promise,
        resolve: promiseResolve!,
        reject: promiseReject!,
        timestamp: Date.now()
      });
      retryQueue.add(requestId);

      processQueue();
      return promise;
    }

    retryCountMap.delete(requestId);
    timeoutMap.delete(requestId);
    return Promise.reject(error);
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
  const jitter = Math.random() * 2000; // Add up to 2 seconds of jitter
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
        console.error('Error processing retry item:', error)
      );
    }

    // Schedule next batch if there are more items
    if (retryQueue.size > 0) {
      setTimeout(processQueue, BATCH_INTERVAL);
    }
  } catch (error) {
    console.error('Error processing retry queue:', error);
  }
}

async function processRetryItem(requestId: string, item: RetryItem) {
  if (processingRequests.get(requestId)) {
    console.log(`⚠️ Request ${requestId} already processing`);
    return;
  }

  const { config, resolve, reject } = item;
  const retryCount = retryCountMap.get(requestId) || 0;

  // Add early check for max retries
  if (retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
    console.log(
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

      console.log(`🔄 Processing retry for ${requestId}`, {
        attempt: retryCount + 1,
        queueLength: retryQueue.size,
        activeRetries
      });

      retryCountMap.set(requestId, retryCount + 1);
      const timeout = getTimeout(retryCount);
      config.timeout = timeout;
      timeoutMap.set(requestId, timeout);

      console.log(`📤 Retrying request ${requestId}`, {
        timeout,
        activeRetries,
        queueLength: retryQueue.size
      });
      const response = await axiosInstance(config);
      console.log(`✅ Request ${requestId} succeeded!`);
      resolve(response);
    } catch (error: any) {
      console.log(`❌ Retry attempt failed for ${requestId}`, {
        error: error.message,
        attempt: retryCount + 1
      });

      // Update retry count check to use the current value
      const currentRetryCount = retryCountMap.get(requestId) || 0;
      if (currentRetryCount < NETWORK_CONFIG.MAX_RETRIES - 1) {
        // Subtract 1 to account for the next attempt
        console.log(`↪️ Requeueing ${requestId} for another attempt`);
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
        console.log(
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
    console.log(
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

export default axiosInstance;
