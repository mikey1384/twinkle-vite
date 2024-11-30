import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
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
  MAX_RETRIES: 5
} as const;

const MAX_CONCURRENT_RETRIES = 5;
let activeRetries = 0;
let isOnline = navigator.onLine;

window.addEventListener('offline', () => {
  isOnline = false;
});

window.addEventListener('online', () => {
  isOnline = true;
});

const retryQueue: RetryQueueItem[] = [];

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
  const isApiRequest = config.url?.startsWith(URL);

  if (isApiRequest) {
    const retryCount = config.__retryCount || 0;
    const isGetRequest = config.method?.toLowerCase() === 'get';

    if (isGetRequest) {
      config.timeout = Math.min(
        NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1),
        NETWORK_CONFIG.MAX_TIMEOUT
      );
    }

    if (isApiRequest && config.cache !== 'force-cache') {
      config.params = {
        ...config.params,
        _: Date.now()
      };
    }

    if (!isOnline) {
      return Promise.reject(new Error('No internet connection'));
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    if (!config || !config.url?.startsWith(URL) || !isGetRequest) {
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
        timestamp: Date.now()
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
  const MAX_AGE = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();

  while (retryQueue.length > 0 && now - retryQueue[0].timestamp > MAX_AGE) {
    const item = retryQueue.shift()!;
    item.reject(new Error('Request timeout - exceeded maximum retry duration'));
  }
}

function isRetryableError(error: any) {
  const isRetryable =
    !error.response ||
    error.code === 'ECONNABORTED' ||
    (error.response &&
      (error.response.status >= 500 || error.response.status === 429));
  return isRetryable;
}

async function processQueue() {
  cleanupOldRequests();
  if (retryQueue.length === 0) return;

  if (activeRetries >= MAX_CONCURRENT_RETRIES) {
    setTimeout(() => processQueue(), NETWORK_CONFIG.RETRY_DELAY);
    return;
  }

  activeRetries++;
  const { config, resolve, reject, requestId } = retryQueue.shift()!;

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
      let promiseResolve: (value: AxiosResponse) => void;
      let promiseReject: (reason?: any) => void;
      const newPromise = new Promise<AxiosResponse>((res, rej) => {
        promiseResolve = res;
        promiseReject = rej;
      });

      retryQueue.push({
        config,
        requestId,
        promise: newPromise,
        resolve: promiseResolve!,
        reject: promiseReject!,
        timestamp: Date.now()
      });
    } else {
      reject(error);
    }
  } finally {
    activeRetries--;
    processQueue();
  }
}

export default axiosInstance;
