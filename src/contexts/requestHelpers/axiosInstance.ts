import axios from 'axios';
import URL from '~/constants/URL';
// import { userIdRef } from '~/constants/state';

let isOnline = navigator.onLine;

window.addEventListener('offline', () => {
  isOnline = false;
});

const MIN_TIMEOUT = 2000;
const MAX_TIMEOUT = 30000;
const MAX_QUEUE_SIZE = 100;
const RETRY_DELAY = 2000;

const retryQueue: any[] = [];
let isProcessingQueue = false;

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

axiosInstance.interceptors.request.use(async (config: any) => {
  const isApiRequest = config.url?.startsWith(URL);

  if (isApiRequest) {
    const retryCount = config.__retryCount || 0;
    const isPostRequest = config.method?.toLowerCase() === 'post';
    const isPutRequest = config.method?.toLowerCase() === 'put';
    if (!isPostRequest && !isPutRequest) {
      const baseTimeout = MIN_TIMEOUT;
      config.timeout = Math.min(baseTimeout * (1 + retryCount), MAX_TIMEOUT);
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
  async (error) => {
    const { config } = error;
    if (!config || !config.url?.startsWith(URL)) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount >= 5) {
      return Promise.reject(error);
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      config.__retryCount += 1;

      if (retryQueue.length < MAX_QUEUE_SIZE) {
        return new Promise((resolve, reject) => {
          retryQueue.push({
            config,
            resolve,
            reject
          });

          if (!isProcessingQueue) {
            processQueue();
          }
        });
      }

      return Promise.reject(new Error('Retry queue is full'));
    }

    return Promise.reject(error);
  }
);

async function processQueue() {
  isProcessingQueue = true;

  while (retryQueue.length > 0) {
    const { config, resolve, reject } = retryQueue.shift()!;
    try {
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      const response = await axiosInstance(config);
      resolve(response);
    } catch (err) {
      if (config.__retryCount < 5) {
        retryQueue.push({ config, resolve, reject });
      } else {
        reject(err);
      }
    }
  }

  isProcessingQueue = false;
}

export default axiosInstance;
