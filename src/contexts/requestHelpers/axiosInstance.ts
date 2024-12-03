import axios, { AxiosResponse } from 'axios';
import URL from '~/constants/URL';

interface RequestItem {
  config: any;
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  retryCount: number;
  timestamp: number; // Add timestamp for tracking request age
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 3000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 20,
  MAX_TOTAL_DURATION: 5 * 60 * 1000
} as const;

const processingRequests = new Map<string, boolean>();
const requestMap = new Map<string, RequestItem>();

const CACHE_BUSTER_PARAM = '_cb';

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function getRequestIdentifier(config: any): string {
  // Remove cache buster while preserving other query params
  const url =
    config.url?.replace(new RegExp(`[?&]${CACHE_BUSTER_PARAM}=\\d+`), '') || '';
  return `${config.method}-${url}-${JSON.stringify(config.data || {})}`;
}

const axiosInstance = axios.create({
  headers: {
    Priority: 'u=1',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

axiosInstance.interceptors.request.use((config: any) => {
  if (!config) config = {};

  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (!isApiRequest || !isGetRequest) return config;

  const requestId = getRequestIdentifier(config);
  const existingRequest = requestMap.get(requestId);

  if (!existingRequest) {
    const { promise, resolve, reject } = createDeferredPromise<AxiosResponse>();
    requestMap.set(requestId, {
      config,
      promise,
      resolve,
      reject,
      retryCount: 0,
      timestamp: Date.now()
    });
  }

  // Set initial timeout with jitter
  if (!config.timeout) {
    config.timeout = NETWORK_CONFIG.MIN_TIMEOUT + Math.random() * 2000;
  }

  // Add cache buster
  const separator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}${CACHE_BUSTER_PARAM}=${Date.now()}`;

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const requestId = getRequestIdentifier(response.config);
    const request = requestMap.get(requestId);
    if (request) {
      request.resolve(response);
    }
    cleanup(requestId);
    return response;
  },
  async (error) => {
    if (!error?.config) error.config = {};

    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    if (!isGetRequest || !isApiRequest) {
      return Promise.reject(error);
    }

    const requestId = getRequestIdentifier(config);
    const request = requestMap.get(requestId);

    if (!request) {
      return Promise.reject(error);
    }

    logWithTimestamp(`❌ Request error for ${requestId}`, {
      errorCode: error.code,
      errorMessage: error.message,
      status: error.response?.status,
      timeout: config.timeout
    });

    // Check request age
    if (Date.now() - request.timestamp > NETWORK_CONFIG.MAX_TOTAL_DURATION) {
      logWithTimestamp(`🕒 Request ${requestId} exceeded maximum duration`);
      cleanup(requestId);
      return Promise.reject(error);
    }

    if (request.retryCount >= NETWORK_CONFIG.MAX_RETRIES) {
      logWithTimestamp(`🛑 Request ${requestId} reached max retries`);
      cleanup(requestId);
      return Promise.reject(error);
    }

    // Attempt retry
    processingRequests.delete(requestId);
    return processRetryItem(requestId, request);
  }
);

async function processRetryItem(
  requestId: string,
  request: RequestItem
): Promise<AxiosResponse> {
  if (processingRequests.get(requestId)) {
    return request.promise;
  }

  request.retryCount++;
  const config = { ...request.config };
  const delay = getRetryDelay(request.retryCount);

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        processingRequests.set(requestId, true);
        config.timeout = getTimeout(request.retryCount);

        logWithTimestamp(`🔄 Retrying request ${requestId}`, {
          attempt: request.retryCount,
          timeout: config.timeout
        });

        const response = await axiosInstance(config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

function cleanup(requestId: string) {
  requestMap.delete(requestId);
  processingRequests.delete(requestId);
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

function getRetryDelay(retryCount: number) {
  const baseDelay = NETWORK_CONFIG.RETRY_DELAY;
  const jitter = Math.random() * 2000;
  return Math.min(baseDelay * retryCount + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

function getTimeout(retryCount: number) {
  const jitter = Math.random() * 2000;
  const baseTimeout = NETWORK_CONFIG.MIN_TIMEOUT * (retryCount + 1);
  return Math.min(baseTimeout + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

export default axiosInstance;
