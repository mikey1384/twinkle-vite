import axios from 'axios';
import URL from '~/constants/URL';
// import { userIdRef } from '~/constants/state';

let isOnline = navigator.onLine;
let failedQueue: any[] = [];
let isRetrying = false;

window.addEventListener('online', () => {
  isOnline = true;
  retryFailedRequests();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

const MIN_TIMEOUT = 3000;
const MAX_TIMEOUT = 60000;

const axiosInstance = axios.create({
  timeout: MIN_TIMEOUT,
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
  const isApiRequest = config.url?.startsWith(URL as string);

  if (isApiRequest) {
    const retryCount = config.__retryCount || 0;
    config.timeout = Math.min(
      MIN_TIMEOUT * Math.pow(2, retryCount),
      MAX_TIMEOUT
    );

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
    /*
    if (userIdRef.current === 5) {
      alert(
        `Error Details:\nStatus: ${error?.response?.status}\nMessage: ${error?.message}\nURL: ${error?.config?.url}`
      );
    }
    */
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    const isApiRequest = config.url.startsWith(URL);

    if (isApiRequest) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount >= 3) {
        return Promise.reject(error);
      }

      if (
        error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error')
      ) {
        config.__retryCount += 1;

        if (!isOnline) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ config, resolve, reject });
          });
        } else {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              axiosInstance(config).then(resolve).catch(reject);
            }, 2000);
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
