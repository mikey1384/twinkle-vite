import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import URL from '~/constants/URL';

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
  MAX_TOTAL_DURATION: 5 * 60 * 1000 // 5 minutes total
} as const;

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'u=1'
  }
});

// Map to store the state associated with each request identifier
const requestStateMap = new Map<string, RetryConfig>();

// Set to keep track of pending requests
const pendingRequests = new Set<string>();

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function getRequestIdentifier(config: AxiosRequestConfig): string {
  const method = config.method || 'get';
  const url = config.url || '';
  const paramsString = config.params
    ? new URLSearchParams(config.params).toString()
    : '';
  const dataString = config.data ? JSON.stringify(config.data) : '';
  return `${method}-${url}-${paramsString}-${dataString}`;
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
  const delay = baseDelay * (1 + retryCount); // Linear backoff
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

// Logging utility functions
function logRequestStart(config: AxiosRequestConfig) {
  logWithTimestamp('📤 Request', {
    method: config.method,
    url: config.url
  });
}

function logRequestSuccess(response: AxiosResponse) {
  logWithTimestamp('📥 Success', {
    method: response.config.method,
    url: response.config.url,
    status: response.status
  });
}

function logRequestError(error: any) {
  logWithTimestamp('❌ Error', {
    method: error.config?.method,
    url: error.config?.url,
    status: error.response?.status,
    message: error.message
  });
}

// Add a request interceptor
axiosInstance.interceptors.request.use((config: any) => {
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  // Log all requests
  logRequestStart(config);

  if (!isApiRequest || !isGetRequest) {
    return config;
  }

  const requestIdentifier = getRequestIdentifier(config);

  // Check if a request with the same identifier is already pending
  if (pendingRequests.has(requestIdentifier)) {
    // A request with this identifier is already pending
    logWithTimestamp('⚠️ Duplicate request detected, throwing error', {
      requestIdentifier
    });
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

  return config;
});

axiosInstance.interceptors.response.use(
  async (response: any) => {
    const config = response.config;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    // Log successful response
    logRequestSuccess(response);

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

    // Log error
    logRequestError(error);

    if (!isApiRequest || !isGetRequest) {
      return Promise.reject(error);
    }

    const requestIdentifier = getRequestIdentifier(config);
    const retryConfig = requestStateMap.get(requestIdentifier);

    // Remove the request from pendingRequests
    pendingRequests.delete(requestIdentifier);

    if (!retryConfig) {
      // No state found for this request, reject the error
      return Promise.reject(error);
    }

    const totalDuration = Date.now() - retryConfig.startTime;
    if (
      retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
      totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
    ) {
      logWithTimestamp('🛑 Max retries exceeded', {
        requestIdentifier,
        retryCount: retryConfig.retryCount
      });

      // Clean up the request state
      requestStateMap.delete(requestIdentifier);

      return Promise.reject(error);
    }

    retryConfig.retryCount += 1;
    retryConfig.lastAttemptTime = Date.now();

    const delay = getRetryDelay(retryConfig.retryCount);

    logWithTimestamp(`🔄 Retrying request ${requestIdentifier} in ${delay}ms`, {
      attempt: retryConfig.retryCount
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Add fresh parameters
    const newConfig = addFreshRequestParams({ ...config });

    // Ensure that we carry over the request state
    requestStateMap.set(requestIdentifier, retryConfig);

    try {
      const response = await axiosInstance(newConfig);
      return response;
    } catch (err) {
      // The error will be caught by the interceptor again
      return Promise.reject(err);
    }
  }
);

export default axiosInstance;
