import axios, { AxiosRequestConfig } from 'axios';
import URL from '~/constants/URL';
import pLimit from 'p-limit';

interface RetryConfig {
  retryCount: number;
  lastAttemptTime: number;
  startTime: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 5000, // Initial timeout in milliseconds
  MAX_TIMEOUT: 120000, // Maximum timeout in milliseconds
  RETRY_DELAY: 2000,
  MAX_RETRIES: 15,
  MAX_TOTAL_DURATION: 5 * 60 * 1000
} as const;

const axiosInstance = axios.create({
  // Remove the global timeout; we'll set it per request
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'u=1'
  }
});

const limit = pLimit(2);

// Map to store the state associated with each request identifier
const requestStateMap = new Map<string, RetryConfig>();

// Set to keep track of pending requests
const pendingRequests = new Set<string>();

function simpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash >>> 0; // Ensure positive integer
}

function getRequestIdentifier(config: AxiosRequestConfig): string {
  const method = config.method || 'get';
  const url = config.url || '';
  const paramsString = config.params ? JSON.stringify(config.params) : '';
  const paramsHash = simpleHash(paramsString);
  return `${method}-${url}-${paramsHash}`;
}

function addFreshRequestParams(config: AxiosRequestConfig) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  // Add timestamp to URL params
  const separator = config.url!.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_t=${timestamp}&_rid=${randomId}`;

  // Also add to headers for good measure
  config.headers = {
    ...config.headers,
    'X-Fresh-Request': `${timestamp}-${randomId}`
  };

  return config;
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
    // Throw a non-retryable error indicating that the request has expired
    const error = new Error('Request expired');
    (error as any).code = 'REQUEST_EXPIRED';
    return Promise.reject(error);
  }

  // Mark the request as pending
  pendingRequests.add(requestIdentifier);

  // Initialize retry configuration
  const timestamp = Date.now();
  const retryConfig: RetryConfig = {
    retryCount: 0,
    lastAttemptTime: timestamp,
    startTime: timestamp
  };

  requestStateMap.set(requestIdentifier, retryConfig);

  // Set the initial timeout
  config.timeout = getTimeoutForRetry(retryConfig.retryCount);

  return config;
});

// Modify the response interceptor
axiosInstance.interceptors.response.use(
  async (response: any) => {
    const config = response.config;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    if (isApiRequest && isGetRequest) {
      const requestIdentifier = getRequestIdentifier(config);

      // Remove the request from pendingRequests
      pendingRequests.delete(requestIdentifier);

      // Clean up the request state
      requestStateMap.delete(requestIdentifier);

      return response;
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
    const retryConfig = requestStateMap.get(requestIdentifier);

    if (!retryConfig) {
      // No state found for this request, reject the error
      // Clean up pendingRequests just in case
      pendingRequests.delete(requestIdentifier);
      return Promise.reject(error);
    }

    // Check if the error is due to a timeout
    const isTimeoutError = error.code === 'ECONNABORTED';

    const totalDuration = Date.now() - retryConfig.startTime;
    if (
      retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
      totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
    ) {
      // Clean up the request state and pendingRequests
      requestStateMap.delete(requestIdentifier);
      pendingRequests.delete(requestIdentifier);

      return Promise.reject(error);
    }

    // Increase the retry count and schedule the next retry
    retryConfig.retryCount += 1;
    retryConfig.lastAttemptTime = Date.now();

    console.log(
      `[Retry System] Attempting retry #${retryConfig.retryCount} for request:`,
      {
        requestIdentifier,
        error: error.message,
        retryConfig,
        isTimeoutError
      }
    );

    const delay = getRetryDelay(retryConfig.retryCount);

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Add fresh parameters
    const newConfig = addFreshRequestParams({ ...config });

    // Update the timeout in the newConfig
    newConfig.timeout = getTimeoutForRetry(retryConfig.retryCount);

    // Update the request state
    requestStateMap.set(requestIdentifier, retryConfig);

    try {
      const response = await limitedAxiosInstance.request(newConfig);
      return response;
    } catch (err) {
      // The error will be caught by the interceptor again
      return Promise.reject(err);
    }
  }
);

export default limitedAxiosInstance;
