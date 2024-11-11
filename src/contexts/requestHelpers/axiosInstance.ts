import axios from 'axios';
import URL from '~/constants/URL';
// import { userIdRef } from '~/constants/state';

let isOnline = navigator.onLine;

window.addEventListener('offline', () => {
  isOnline = false;
});

const MIN_TIMEOUT = 2000;
const MAX_TIMEOUT = 30000;
const MAX_QUEUE_SIZE = 5;
const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;

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
  (response) => response,
  async (error) => {
    const { config } = error;
    if (!config || !config.url?.startsWith(URL)) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;
    if (
      (error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error')) &&
      config.__retryCount < MAX_RETRIES
    ) {
      config.__retryCount += 1;

      return new Promise((resolve, reject) => {
        const addToQueue = () => {
          if (retryQueue.length < MAX_QUEUE_SIZE) {
            retryQueue.push({
              config,
              resolve,
              reject
            });

            if (!isProcessingQueue) {
              processQueue();
            }
          } else {
            setTimeout(() => addToQueue(), RETRY_DELAY);
          }
        };
        addToQueue();
      });
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
    } catch (error) {
      reject(error);
    }
  }

  isProcessingQueue = false;
}

export default axiosInstance;
