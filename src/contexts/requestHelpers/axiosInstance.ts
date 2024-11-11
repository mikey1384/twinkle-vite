import axios from 'axios';
import URL from '~/constants/URL';
import { userIdRef } from '~/constants/state';

let isOnline = navigator.onLine;
const failedQueue = new Map();
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

function getRequestKey(config: any) {
  return `${config.method}-${config.url}-${JSON.stringify(
    config.data || {}
  )}-${JSON.stringify(config.params || {})}`;
}

async function retryFailedRequests() {
  if (isRetrying || failedQueue.size === 0) return;
  isRetrying = true;

  const queue = new Map(failedQueue);

  for (const [requestKey, { config, resolve, reject }] of queue) {
    try {
      const response = await axiosInstance(config);
      resolve(response);
      failedQueue.delete(requestKey);
    } catch (error) {
      reject(error);
    }
  }

  isRetrying = false;
}

axiosInstance.interceptors.request.use(async (config: any) => {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  const isSlowConnection =
    connection?.effectiveType === '2g' ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.saveData;

  if (isSlowConnection && pendingRequests >= MAX_CONCURRENT_REQUESTS) {
    if (userIdRef.current === 5) {
      alert('isSlowConnection && pendingRequests >= MAX_CONCURRENT_REQUESTS');
    }
    return new Promise((resolve) => {
      const delayTime = 1000;
      if (config.timeout) {
        config.timeout += delayTime;
      }
      setTimeout(() => resolve(config), delayTime);
    });
  }

  pendingRequests++;

  const isApiRequest = config.url?.startsWith(URL);

  if (isApiRequest) {
    const retryCount = config.__retryCount || 0;
    const isPostRequest = config.method?.toLowerCase() === 'post';
    const isPutRequest = config.method?.toLowerCase() === 'put';

    if (!isPostRequest && !isPutRequest) {
      const baseTimeout = isSlowConnection ? 5000 : MIN_TIMEOUT;
      config.timeout = Math.min(
        baseTimeout * Math.pow(2, retryCount),
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
            const requestKey = getRequestKey(config);
            if (!failedQueue.has(requestKey)) {
              failedQueue.set(requestKey, { config, resolve, reject });
            }
          });
        } else {
          return new Promise((resolve, reject) => {
            const retryDelay = Math.min(
              1000 * Math.pow(1.5, config.__retryCount),
              10000
            );
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
