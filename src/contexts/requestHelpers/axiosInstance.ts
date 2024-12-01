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
  CONCURRENT_DELAY: 10000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000 // 5 minutes total
} as const;

const MAX_CONCURRENT_RETRIES = 5;
let activeRetries = 0;

const retryQueue: RetryQueueItem[] = [];
const processingRequests = new Map<string, boolean>();
const retryCountMap = new Map<string, number>();
const timeoutMap = new Map<string, number>();

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(
    config.params || {}
  )}-${JSON.stringify(config.data || {})}`;
}

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
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
    const timeout = Math.min(
      NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1),
      NETWORK_CONFIG.MAX_TIMEOUT
    );
    timeoutMap.set(requestId, timeout);
    config.timeout = timeout;
  }

  if (config.cache !== 'force-cache') {
    config.params = {
      ...config.params,
      _: Date.now()
    };
  }

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
    if (!config.url?.startsWith(URL) || !isGetRequest) {
      return Promise.reject(error);
    }

    const requestId = getRequestIdentifier(config);
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

function cleanupOldRequests() {
  const MAX_AGE = NETWORK_CONFIG.MAX_TOTAL_DURATION;
  const now = Date.now();
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

    const nextItem = retryQueue[0];
    if (!nextItem) {
      return;
    }

    if (activeRetries >= MAX_CONCURRENT_RETRIES) {
      console.log(
        `⏸️ Queue processing paused: ${activeRetries}/${MAX_CONCURRENT_RETRIES} active retries`
      );
      return;
    }

    if (processingRequests.get(nextItem.requestId)) {
      console.log(`⚠️ Request ${nextItem.requestId} already processing`);
      return;
    }

    retryQueue.shift();
    processingRequests.set(nextItem.requestId, true);
    activeRetries++;

    const { config, resolve, reject, requestId } = nextItem;
    const retryCount = retryCountMap.get(requestId) || 0;
    console.log(`🔄 Processing retry for ${requestId}`, {
      attempt: retryCount + 1,
      queueLength: retryQueue.length,
      activeRetries
    });

    try {
      const delay = getRetryDelay(retryCount);
      console.log(`⏳ Waiting ${delay}ms before retrying ${requestId}`);
      await new Promise((r) => setTimeout(r, delay));

      retryCountMap.set(requestId, retryCount + 1);
      const timeout = Math.min(
        NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1),
        NETWORK_CONFIG.MAX_TIMEOUT
      );
      config.timeout = timeout;
      timeoutMap.set(requestId, timeout);

      console.log(`📤 Retrying request ${requestId}`, { timeout });
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
      activeRetries--;
      processingRequests.delete(requestId);
      processQueue();
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

export default axiosInstance;
