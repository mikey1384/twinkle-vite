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

// Map to keep track of pending requests and their Promises
const pendingRequests = new Map<string, Promise<any>>();

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

// Wrap axiosInstance methods with concurrency limiter and deduplication
const limitedAxiosInstance: any = {
  ...axiosInstance,
  request: (config: any) =>
    makeLimitedRequest(config, (cfg: any) => axiosInstance.request(cfg)),
  get: (url: any, config: any) =>
    makeLimitedRequest({ method: 'get', url, ...config }, (cfg: any) =>
      axiosInstance.get(url, cfg)
    ),
  delete: (url: any, config: any) =>
    makeLimitedRequest({ method: 'delete', url, ...config }, (cfg: any) =>
      axiosInstance.delete(url, cfg)
    ),
  head: (url: any, config: any) =>
    makeLimitedRequest({ method: 'head', url, ...config }, (cfg: any) =>
      axiosInstance.head(url, cfg)
    ),
  options: (url: any, config: any) =>
    makeLimitedRequest({ method: 'options', url, ...config }, (cfg: any) =>
      axiosInstance.options(url, cfg)
    ),
  post: (url: any, data: any, config: any) =>
    makeLimitedRequest({ method: 'post', url, data, ...config }, (cfg: any) =>
      axiosInstance.post(url, data, cfg)
    ),
  put: (url: any, data: any, config: any) =>
    makeLimitedRequest({ method: 'put', url, data, ...config }, (cfg: any) =>
      axiosInstance.put(url, data, cfg)
    ),
  patch: (url: any, data: any, config: any) =>
    makeLimitedRequest({ method: 'patch', url, data, ...config }, (cfg: any) =>
      axiosInstance.patch(url, data, cfg)
    )
};

function makeLimitedRequest(
  config: AxiosRequestConfig,
  requestFunction: (config: AxiosRequestConfig) => Promise<any>
): Promise<any> {
  const requestIdentifier = getRequestIdentifier(config);

  // If the request is already pending, return the existing Promise
  if (pendingRequests.has(requestIdentifier)) {
    return pendingRequests.get(requestIdentifier)!;
  }

  // Store the original config for retries
  if (!requestConfigMap.has(requestIdentifier)) {
    requestConfigMap.set(requestIdentifier, { ...config });
  }

  if (!retryConfigMap.has(requestIdentifier)) {
    const timestamp = Date.now();
    retryConfigMap.set(requestIdentifier, {
      retryCount: 0,
      lastAttemptTime: timestamp,
      startTime: timestamp
    });
  }

  async function executeRequest() {
    try {
      const response = await requestFunction(config);
      // Only store successful responses in pendingRequests
      pendingRequests.set(requestIdentifier, Promise.resolve(response));
      // Clean up retry-related maps
      requestConfigMap.delete(requestIdentifier);
      retryConfigMap.delete(requestIdentifier);
      return response;
    } catch (error: any) {
      const retryConfig = retryConfigMap.get(requestIdentifier);
      if (!retryConfig) {
        throw error;
      }

      const isApiRequest = config.url?.startsWith(URL as string);
      const isGetRequest = config.method?.toLowerCase() === 'get';

      if (!isApiRequest || !isGetRequest) {
        throw error;
      }

      const totalDuration = Date.now() - retryConfig.startTime;
      if (
        retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
        totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
      ) {
        // Clean up maps
        requestConfigMap.delete(requestIdentifier);
        retryConfigMap.delete(requestIdentifier);
        throw error;
      }

      // Increase retry count and update last attempt time
      retryConfig.retryCount += 1;
      retryConfig.lastAttemptTime = Date.now();
      retryConfigMap.set(requestIdentifier, retryConfig);

      console.log(`[Retry System] Attempting retry for request:`, {
        requestIdentifier,
        error: error.message,
        retryConfig,
        isTimeoutError: error.code === 'ECONNABORTED'
      });

      const delay = getRetryDelay(retryConfig.retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Update the config with new timeout
      config.timeout = getTimeoutForRetry(retryConfig.retryCount);

      // Try again with the updated config
      return executeRequest();
    }
  }

  return limit(() => executeRequest());
}

// Modify the request interceptor
axiosInstance.interceptors.request.use((config: any) => {
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  if (!isApiRequest || !isGetRequest) {
    return config;
  }

  const requestIdentifier = getRequestIdentifier(config);

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

  // Retrieve the retryConfig
  const retryConfig = retryConfigMap.get(requestIdentifier)!;

  // Set the timeout for the request
  config.timeout = getTimeoutForRetry(retryConfig.retryCount);

  return config;
});

// Remove retry logic from axiosInstance.interceptors.response
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error) => Promise.reject(error)
);

export default limitedAxiosInstance;
