import axios, { AxiosResponse } from 'axios';
import URL from '~/constants/URL';

interface RetryConfig {
  retryCount: number;
  lastAttemptTime: number;
  startTime: number;
}

interface PendingRequest {
  promise: Promise<AxiosResponse>;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
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

const pendingRequests = new Map<string, PendingRequest>();

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(
    config.params || {}
  )}-${JSON.stringify(config.data || {})}`;
}

function addFreshRequestParams(config: any) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  // Add timestamp to URL params
  const separator = config.url.includes('?') ? '&' : '?';
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
function logRequestStart(config: any) {
  logWithTimestamp('📤 Request', {
    method: config.method,
    url: config.url
  });
}

function logRequestSuccess(response: any) {
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

  const requestId = getRequestIdentifier(config);

  if (pendingRequests.has(requestId)) {
    // Duplicate request detected, return the existing promise
    logWithTimestamp(
      '⚠️ Duplicate request detected, returning existing promise',
      { requestId }
    );
    return pendingRequests.get(requestId)!.promise;
  }

  // Initialize retry configuration
  (config as any).__retryConfig = {
    retryCount: 0,
    lastAttemptTime: Date.now(),
    startTime: Date.now()
  } as RetryConfig;

  // Create a promise that will handle the request, retries, and resolve/reject
  let resolvePromise: (value: AxiosResponse) => void;
  let rejectPromise: (reason?: any) => void;
  const promise = new Promise<AxiosResponse>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  pendingRequests.set(requestId, {
    promise,
    resolve: resolvePromise!,
    reject: rejectPromise!
  });

  return config;
});

// Add a response interceptor
axiosInstance.interceptors.response.use(
  async (response) => {
    const config = response.config;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL as string);

    // Log successful response
    logRequestSuccess(response);

    if (isApiRequest && isGetRequest) {
      const requestId = getRequestIdentifier(config);
      const pendingRequest = pendingRequests.get(requestId);
      if (pendingRequest) {
        pendingRequest.resolve(response);
        pendingRequests.delete(requestId);
      }
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

    const requestId = getRequestIdentifier(config);
    const pendingRequest = pendingRequests.get(requestId);

    // Retrieve or initialize retry configuration
    const retryConfig: RetryConfig = (config as any).__retryConfig || {
      retryCount: 0,
      lastAttemptTime: Date.now(),
      startTime: Date.now()
    };

    const totalDuration = Date.now() - retryConfig.startTime;
    if (
      retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
      totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
    ) {
      logWithTimestamp('🛑 Max retries exceeded', {
        requestId,
        retryCount: retryConfig.retryCount
      });

      // Reject the pending promise
      if (pendingRequest) {
        pendingRequest.reject(error);
        pendingRequests.delete(requestId);
      }
      return Promise.reject(error);
    }

    retryConfig.retryCount += 1;
    retryConfig.lastAttemptTime = Date.now();
    (config as any).__retryConfig = retryConfig;

    const delay = getRetryDelay(retryConfig.retryCount);

    logWithTimestamp(`🔄 Retrying request ${requestId} in ${delay}ms`, {
      attempt: retryConfig.retryCount
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Add fresh parameters
    const newConfig = addFreshRequestParams(config);

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
