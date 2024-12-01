import axios, { AxiosResponse } from 'axios';
import URL from '~/constants/URL';

interface RetryQueueItem {
  config: any;
  requestId: string;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 2000,
  MAX_TIMEOUT: 30000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000 // 5 minutes total
} as const;

let activeRetries = 0;
const retryLock = new Set<string>();

const retryQueue: RetryQueueItem[] = [];
const processingRequests = new Map<string, boolean>();
const retryCountMap = new Map<string, number>();
const timeoutMap = new Map<string, number>();

const BATCH_SIZE = 3; // Process max 3 retries at once
const BATCH_INTERVAL = 1000; // Wait 1s between batches

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
}

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
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
    'X-Request-Time': Date.now().toString()
  };

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const requestId = getRequestIdentifier(response.config);
    retryCountMap.delete(requestId);
    timeoutMap.delete(requestId);
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

      const existingRetry = retryQueue.find(
        (item) => item.requestId === requestId
      );
      if (existingRetry) {
        console.log(`⏳ Request ${requestId} already in retry queue`);
        return existingRetry.promise;
      }

      let promiseResolve: (value: AxiosResponse) => void;
      let promiseReject: (reason?: any) => void;
      const promise = new Promise<AxiosResponse>((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });

      retryQueue.push({
        config,
        requestId,
        promise,
        resolve: promiseResolve!,
        reject: promiseReject!,
        timestamp: Date.now()
      });

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

  // Add request start time tracking
  const requestTimes = new Map<string, number>();

  // More accurate stuck detection
  for (const [requestId, isProcessing] of processingRequests.entries()) {
    const startTime = requestTimes.get(requestId) || now;
    const isStuck = isProcessing && now - startTime > MAX_AGE;
    const isOrphaned =
      isProcessing && !retryQueue.some((item) => item.requestId === requestId);

    if (isStuck || isOrphaned) {
      console.log(
        `🧹 Cleaning up ${isStuck ? 'stuck' : 'orphaned'} request: ${requestId}`
      );
      processingRequests.delete(requestId);
      retryCountMap.delete(requestId);
      timeoutMap.delete(requestId);
      decrementActiveRetries(requestId);
    }
  }

  // Original cleanup code
  const expiredIndex = retryQueue.findIndex(
    (item) => now - item.timestamp > MAX_AGE
  );

  if (expiredIndex !== -1) {
    const expiredItem = retryQueue.splice(expiredIndex, 1)[0];
    const requestId = expiredItem.requestId;
    retryCountMap.delete(requestId);
    timeoutMap.delete(requestId);
    processingRequests.delete(requestId);
    expiredItem.reject(
      new Error('Request timeout - exceeded maximum retry duration')
    );
  }
}

async function processQueue() {
  try {
    cleanupOldRequests();
    resetActiveRetries();

    // Process requests in batches
    const batch = retryQueue.slice(0, BATCH_SIZE);
    if (batch.length === 0) return;

    const promises = batch.map(async (item) => {
      if (processingRequests.get(item.requestId)) {
        console.log(`⚠️ Request ${item.requestId} already processing`);
        return;
      }

      processingRequests.set(item.requestId, true);
      incrementActiveRetries(item.requestId);

      // Destructure everything we need at the top level so it's available in catch
      const { config, resolve, reject, requestId } = item;
      const retryCount = retryCountMap.get(requestId) || 0;

      try {
        console.log(`🔄 Processing retry for ${requestId}`, {
          attempt: retryCount + 1,
          queueLength: retryQueue.length,
          activeRetries
        });

        const delay = getRetryDelay(retryCount);
        console.log(`⏳ Waiting ${delay}ms before retrying ${requestId}`);
        await new Promise((r) => setTimeout(r, delay));

        retryCountMap.set(requestId, retryCount + 1);
        const timeout = getTimeout(retryCount);
        config.timeout = timeout;
        timeoutMap.set(requestId, timeout);

        console.log(`📤 Retrying request ${requestId}`, {
          timeout,
          activeRetries,
          queueLength: retryQueue.length
        });
        const response = await axiosInstance(config);
        console.log(
          `✅ Request ${requestId} succeeded after ${retryCount + 1} attempts`
        );
        resolve(response);
      } catch (error: any) {
        console.log(`❌ Retry attempt failed for ${requestId}`, {
          error: error.message,
          attempt: retryCount + 1
        });

        if ((retryCountMap.get(requestId) || 0) < NETWORK_CONFIG.MAX_RETRIES) {
          console.log(`↪️ Requeueing ${requestId} for another attempt`);
          const {
            promise,
            resolve: newResolve,
            reject: newReject
          } = createDeferredPromise<AxiosResponse>();

          retryQueue.push({
            config,
            requestId,
            promise,
            resolve: newResolve,
            reject: newReject,
            timestamp: Date.now()
          });
        } else {
          console.log(
            `🛑 Request ${requestId} failed permanently after ${NETWORK_CONFIG.MAX_RETRIES} attempts`
          );
          reject(error);
        }
      } finally {
        decrementActiveRetries(requestId);
        processingRequests.delete(requestId);
      }
    });

    await Promise.all(promises);

    // Wait before processing next batch
    if (retryQueue.length > 0) {
      setTimeout(processQueue, BATCH_INTERVAL);
    }
  } catch (error) {
    console.error('Error processing retry queue:', error);
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
