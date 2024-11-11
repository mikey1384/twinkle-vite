import axios from 'axios';
import URL from '~/constants/URL';

let isOnline = navigator.onLine;

window.addEventListener('offline', () => {
  isOnline = false;
});

const MIN_TIMEOUT = 2000;
const MAX_TIMEOUT = 30000;
const RETRY_DELAY = 2000;
const MAX_RETRIES = 5;

const retryQueue: any[] = [];
let isProcessingQueue = false;

function getRequestIdentifier(config: any) {
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
      config.timeout = Math.min(MIN_TIMEOUT * (1 + retryCount), MAX_TIMEOUT);
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
      config.__retryCount < MAX_RETRIES
    ) {
      config.__retryCount += 1;

      const requestId = getRequestIdentifier(config);

      // Check if request is already in the queue
      const existingRetry = retryQueue.find(
        (item) => item.requestId === requestId
      );
      if (existingRetry) {
        return existingRetry.promise;
      }

      let promiseResolve, promiseReject;
      const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });

      retryQueue.push({
        config,
        requestId,
        promise,
        resolve: promiseResolve,
        reject: promiseReject
      });

      if (!isProcessingQueue) {
        processQueue();
      }

      return promise;
    }

    return Promise.reject(error);
  }
);

async function processQueue() {
  isProcessingQueue = true;

  while (retryQueue.length > 0) {
    const { config, resolve, reject, requestId } = retryQueue.shift();
    try {
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      const response = await axiosInstance(config);
      resolve(response);
    } catch (error) {
      if (config.__retryCount < MAX_RETRIES) {
        retryQueue.push({ config, requestId, resolve, reject });
      } else {
        reject(error);
      }
    }
  }

  isProcessingQueue = false;
}

export default axiosInstance;
