import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import URL from '~/constants/URL';

interface RetryQueueItem {
  config: CustomAxiosRequestConfig;
  requestId: string;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  __retryCount?: number;
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
let isOnline = navigator.onLine;

const handleOffline = () => {
  isOnline = false;
};

const handleOnline = () => {
  isOnline = true;
};

window.addEventListener('offline', handleOffline);
window.addEventListener('online', handleOnline);

window.addEventListener('beforeunload', () => {
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
});

const retryQueue: RetryQueueItem[] = [];

let requestCounter = 0;

function getUniqueTimestamp() {
  const timestamp = Date.now();
  requestCounter = (requestCounter + 1) % 1000;
  return timestamp * 1000 + requestCounter;
}

function getRequestIdentifier(config: CustomAxiosRequestConfig): string {
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

  const retryCount = config.__retryCount || 0;
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (isGetRequest) {
    config.timeout = Math.min(
      NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1),
      NETWORK_CONFIG.MAX_TIMEOUT
    );
  }

  if (config.cache !== 'force-cache') {
    config.params = {
      ...config.params,
      _: Date.now()
    };
  }

  if (!isOnline) {
    return Promise.reject(new Error('No internet connection'));
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.config) {
      error.config = {};
    }
    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    if (!config.url?.startsWith(URL) || !isGetRequest) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount < NETWORK_CONFIG.MAX_RETRIES) {
      const requestId = getRequestIdentifier(config);

      const existingRetry = retryQueue.find(
        (item) => item.requestId === requestId
      );
      if (existingRetry) {
        return existingRetry.promise;
      }

      let promiseResolve: (value: AxiosResponse) => void;
      let promiseReject: (reason?: any) => void;
      const promise = new Promise<AxiosResponse>((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });

      retryQueue.push({
        config: config as CustomAxiosRequestConfig,
        requestId,
        promise,
        resolve: promiseResolve!,
        reject: promiseReject!,
        timestamp: getUniqueTimestamp()
      });

      processQueue();

      return promise;
    }

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

  while (retryQueue.length > 0 && now - retryQueue[0].timestamp > MAX_AGE) {
    const item = retryQueue.shift()!;
    item.reject(new Error('Request timeout - exceeded maximum retry duration'));
  }
}

function isRetryableError(error: unknown): error is AxiosError {
  if (!axios.isAxiosError(error)) return true; // Network errors

  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    (error.response &&
      (error.response.status >= 500 || error.response.status === 429))
  );
}

let processingScheduled = false;

async function processQueue() {
  if (processingScheduled) return;
  processingScheduled = true;
  try {
    cleanupOldRequests();

    const nextItem = retryQueue[0];
    if (!nextItem) {
      processingScheduled = false;
      return;
    }

    if (activeRetries >= MAX_CONCURRENT_RETRIES) {
      processingScheduled = true;
      setTimeout(() => {
        processingScheduled = false;
        processQueue();
      }, NETWORK_CONFIG.CONCURRENT_DELAY);
      return;
    }

    retryQueue.shift();
    activeRetries++;
    const { config, resolve, reject, requestId } = nextItem;

    try {
      await new Promise((r) =>
        setTimeout(r, getRetryDelay(config.__retryCount || 0))
      );
      config.__retryCount = (config.__retryCount || 0) + 1;
      const response = await axiosInstance(config);
      resolve(response);
    } catch (error) {
      if (
        (config.__retryCount || 0) < NETWORK_CONFIG.MAX_RETRIES &&
        isRetryableError(error)
      ) {
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
          timestamp: getUniqueTimestamp()
        });
      } else {
        reject(error);
      }
    } finally {
      activeRetries--;
      setTimeout(() => {
        processingScheduled = false;
        processQueue();
      }, 0);
    }
  } catch (error) {
    console.error('Error processing retry queue:', error);
  } finally {
    processingScheduled = false;
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
