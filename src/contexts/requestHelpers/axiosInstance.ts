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

const activeRetryRequests = new Set<string>();
const retryQueue: any[] = [];

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}${JSON.stringify(
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
    if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      config.__retryCount += 1;

      return new Promise((resolve, reject) => {
        const addToQueue = () => {
          const requestId = getRequestIdentifier(config);

          if (activeRetryRequests.has(requestId)) {
            reject(new Error('Request already in retry queue'));
            return;
          }

          if (retryQueue.length < MAX_QUEUE_SIZE) {
            activeRetryRequests.add(requestId);
            retryQueue.push({
              config,
              resolve,
              reject,
              requestId
            });

            if (retryQueue.length === 1) {
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
  if (retryQueue.length === 0) return;

  const { config, resolve, reject, requestId } = retryQueue.shift()!;
  try {
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    const response = await axiosInstance(config);
    resolve(response);
  } catch (error) {
    reject(error);
  } finally {
    activeRetryRequests.delete(requestId);
  }

  await processQueue();
}

export default axiosInstance;
