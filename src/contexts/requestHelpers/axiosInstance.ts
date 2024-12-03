import axios, { AxiosRequestConfig } from 'axios';
import URL from '~/constants/URL';
import pLimit from 'p-limit';

interface RetryConfig {
  retryCount: number;
  lastAttemptTime: number;
  startTime: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 5000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 15,
  MAX_TOTAL_DURATION: 5 * 60 * 1000
} as const;

const axiosInstance = axios.create({
  // No global timeout; we'll set it per request
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'u=1'
  }
});

const limit = pLimit(2);

// Set to keep track of pending requests
const pendingRequests = new Set<string>();

// Maps to store configurations for each requestIdentifier
const requestConfigMap = new Map<string, AxiosRequestConfig>();
const retryConfigMap = new Map<string, RetryConfig>();

function getRequestIdentifier(config: AxiosRequestConfig): string {
  const method = config.method || 'get';
  const url = config.url || '';
  const paramsString = config.params ? JSON.stringify(config.params) : '';
  return `${method}-${url}-${paramsString}`;
}

function getRetryDelay(retryCount: number) {
  const baseDelay = NETWORK_CONFIG.RETRY_DELAY;
  const maxDelay = NETWORK_CONFIG.MAX_TIMEOUT;
  const delay = Math.min(baseDelay * (1 + retryCount), maxDelay);
  const jitter = Math.random() * 3000;
  return delay + jitter;
}

function getTimeoutForRetry(retryCount: number) {
  const baseTimeout = NETWORK_CONFIG.MIN_TIMEOUT;
  const maxTimeout = NETWORK_CONFIG.MAX_TIMEOUT;
  const timeout = Math.min(baseTimeout * (1 + retryCount), maxTimeout);
  const jitter = Math.random() * 3000;
  return timeout + jitter;
}

// Wrap axiosInstance methods with concurrency limiter
const limitedAxiosInstance: any = {
  ...axiosInstance,
  request: (config: any) => limit(() => axiosInstance.request(config)),
  get: (url: any, config: any) => limit(() => axiosInstance.get(url, config)),
  delete: (url: any, config: any) =>
    limit(() => axiosInstance.delete(url, config)),
  head: (url: any, config: any) => limit(() => axiosInstance.head(url, config)),
  options: (url: any, config: any) =>
    limit(() => axiosInstance.options(url, config)),
  post: (url: any, data: any, config: any) =>
    limit(() => axiosInstance.post(url, data, config)),
  put: (url: any, data: any, config: any) =>
    limit(() => axiosInstance.put(url, data, config)),
  patch: (url: any, data: any, config: any) =>
    limit(() => axiosInstance.patch(url, data, config))
  // If you use other methods, make sure to wrap them as well
};

// Modify the request interceptor
axiosInstance.interceptors.request.use((config: any) => {
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (!isApiRequest || !isGetRequest) {
    return config;
  }

  const requestIdentifier = getRequestIdentifier(config);

  // Check if a request with the same identifier is already pending
  if (pendingRequests.has(requestIdentifier)) {
    // Throw a non-retryable error indicating that the request is already pending
    const error = new Error('Request already pending');
    (error as any).code = 'REQUEST_PENDING';
    return Promise.reject(error);
  }

  // Store the original config in requestConfigMap if not already stored
  if (!requestConfigMap.has(requestIdentifier)) {
    requestConfigMap.set(requestIdentifier, { ...config });
  }

  // Initialize retryConfig and store it in retryConfigMap if not already stored
  if (!retryConfigMap.has(requestIdentifier)) {
    const timestamp = Date.now();
    const retryConfig: RetryConfig = {
      retryCount: 0,
      lastAttemptTime: timestamp,
      startTime: timestamp
    };

    retryConfigMap.set(requestIdentifier, retryConfig);
  }

  // Mark the request as pending
  pendingRequests.add(requestIdentifier);

  // Retrieve the retryConfig
  const retryConfig = retryConfigMap.get(requestIdentifier)!;

  // Set the timeout for the request
  config.timeout = getTimeoutForRetry(retryConfig.retryCount);

  return config;
});

// Modify the response interceptor
axiosInstance.interceptors.response.use(
  (response: any) => {
    const config = response.config;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    if (isApiRequest && isGetRequest) {
      const requestIdentifier = getRequestIdentifier(config);

      // Remove the request from pendingRequests
      pendingRequests.delete(requestIdentifier);
      // Clean up the Map entries
      requestConfigMap.delete(requestIdentifier);
      retryConfigMap.delete(requestIdentifier);
    }

    return response;
  },
  async (error) => {
    const config = error.config;
    const isGetRequest = config?.method?.toLowerCase() === 'get';
    const isApiRequest = config?.url?.startsWith(URL);

    if (!isApiRequest || !isGetRequest) {
      return Promise.reject(error);
    }

    const requestIdentifier = getRequestIdentifier(config);

    const retryConfig = retryConfigMap.get(requestIdentifier);
    pendingRequests.delete(requestIdentifier);

    if (!retryConfig) {
      return Promise.reject(error);
    }

    const totalDuration = Date.now() - retryConfig.startTime;
    if (
      retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
      totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
    ) {
      // Clean up
      pendingRequests.delete(requestIdentifier);
      requestConfigMap.delete(requestIdentifier);
      retryConfigMap.delete(requestIdentifier);
      return Promise.reject(error);
    }

    // Increase the retry count and update last attempt time
    retryConfig.retryCount += 1;
    retryConfig.lastAttemptTime = Date.now();

    // Update the retryConfig in the Map
    retryConfigMap.set(requestIdentifier, retryConfig);

    console.log(`[Retry System] Attempting retry for request:`, {
      requestIdentifier,
      error: error.message,
      retryConfig,
      isTimeoutError: error.code === 'ECONNABORTED'
    });

    const delay = getRetryDelay(retryConfig.retryCount);

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retrieve the original config from requestConfigMap
    const originalConfig = requestConfigMap.get(requestIdentifier);

    if (!originalConfig) {
      pendingRequests.delete(requestIdentifier);
      retryConfigMap.delete(requestIdentifier);
      return Promise.reject(error);
    }

    // Clone the original config to avoid mutations
    const newConfig = { ...originalConfig };
    // Update the timeout
    newConfig.timeout = getTimeoutForRetry(retryConfig.retryCount);

    // Important: Use the base axiosInstance for retries, not the limited one
    try {
      const response = await axiosInstance.request(newConfig);
      // Clean up after successful retry
      pendingRequests.delete(requestIdentifier);
      requestConfigMap.delete(requestIdentifier);
      retryConfigMap.delete(requestIdentifier);
      return response;
    } catch (err) {
      // Let the error propagate to be caught by the interceptor again
      return Promise.reject(err);
    }
  }
);

export default limitedAxiosInstance;
