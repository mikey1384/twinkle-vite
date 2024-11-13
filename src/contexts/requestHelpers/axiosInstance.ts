import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import URL from '~/constants/URL';

// Define interfaces
interface RetryQueueItem {
  config: CustomAxiosRequestConfig;
  requestId: string;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  __retryCount?: number;
}

// Constants
const NETWORK_CONFIG = {
  MIN_TIMEOUT: 2000,
  MAX_TIMEOUT: 30000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 5
} as const;

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
    const isPostOrPutRequest = /post|put/i.test(config.method);

    if (!isPostOrPutRequest) {
      config.timeout = Math.min(
        NETWORK_CONFIG.MIN_TIMEOUT * (1 + retryCount),
        NETWORK_CONFIG.MAX_TIMEOUT
      );
    }

    config.params = {
      ...config.params,
      _: Date.now()
    };

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
    if (!config || !config.url?.startsWith(URL)) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    if (
      (error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error')) &&
      config.__retryCount < NETWORK_CONFIG.MAX_RETRIES
    ) {
      config.__retryCount += 1;

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
        reject: promiseReject!
      });

      processQueue();

      return promise;
    }

    return Promise.reject(error);
  }
);

async function processQueue() {
  if (retryQueue.length === 0) return;

  const { config, resolve, reject, requestId } = retryQueue.shift()!;
  try {
    await new Promise((r) => setTimeout(r, NETWORK_CONFIG.RETRY_DELAY));
    const response = await axiosInstance(config);
    resolve(response);
  } catch (error) {
    if (
      config.__retryCount &&
      config.__retryCount < NETWORK_CONFIG.MAX_RETRIES
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
        reject: promiseReject!
      });
    } else {
      reject(error);
    }
  }

  await processQueue();
}

export default axiosInstance;
