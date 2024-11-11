import axios from 'axios';
import URL from '~/constants/URL';
// import { userIdRef } from '~/constants/state';

let isOnline = navigator.onLine;
let failedQueue: any[] = [];
let isRetrying = false;
let pendingRequests = 0;
const MAX_CONCURRENT_REQUESTS = 4;

window.addEventListener('online', () => {
  isOnline = true;
  retryFailedRequests();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

const MIN_TIMEOUT = 2000;
const MAX_TIMEOUT = 120000;

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

async function retryFailedRequests() {
  if (isRetrying || failedQueue.length === 0) return;
  isRetrying = true;

  const queue = [...failedQueue];
  failedQueue = [];

  for (const { config, resolve, reject } of queue) {
    try {
      const response = await axiosInstance(config);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }

  isRetrying = false;
}

axiosInstance.interceptors.request.use(async (config: any) => {
  const connection = (navigator as any).connection;
  const isSlowConnection =
    connection?.type === 'cellular' || connection?.saveData;

  if (isSlowConnection && pendingRequests >= MAX_CONCURRENT_REQUESTS) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(config), 1000);
    });
  }
  pendingRequests++;

  const isApiRequest = config.url?.startsWith(URL as string);

  if (isApiRequest) {
    const isPostRequest = config.method?.toLowerCase() === 'post';
    const isPutRequest = config.method?.toLowerCase() === 'put';

    if (!isPostRequest && !isPutRequest) {
      const retryCount = config.__retryCount || 0;
      const baseTimeout = MIN_TIMEOUT;

      config.timeout = Math.min(
        baseTimeout * Math.pow(2.5, retryCount),
        MAX_TIMEOUT
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
  (response) => {
    pendingRequests--;
    return response;
  },
  (error) => {
    pendingRequests--;
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    const isApiRequest = config.url.startsWith(URL);

    if (isApiRequest) {
      config.__retryCount = config.__retryCount || 0;

      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        console.log('Request timed out, attempting retry...', {
          url: config.url,
          retryCount: config.__retryCount,
          timeout: config.timeout
        });
      }

      if (config.__retryCount >= 3) {
        console.log('Max retries reached', {
          url: config.url,
          finalTimeout: config.timeout
        });
        return Promise.reject(error);
      }

      if (
        error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error') ||
        error.message.includes('timeout')
      ) {
        config.__retryCount += 1;

        if (!isOnline) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ config, resolve, reject });
          });
        } else {
          return new Promise((resolve, reject) => {
            const retryDelay = Math.min(
              2000 * Math.pow(2, config.__retryCount),
              10000
            );
            console.log(`Retrying request in ${retryDelay}ms...`);
            setTimeout(() => {
              axiosInstance(config).then(resolve).catch(reject);
            }, retryDelay);
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    isOnline = navigator.onLine;
    if (isOnline) {
      retryFailedRequests();
    }
  }
});

export default axiosInstance;
