import axios from 'axios';
import URL from '~/constants/URL';

interface RetryConfig {
  retryCount: number;
  lastAttemptTime: number;
}

const NETWORK_CONFIG = {
  MIN_TIMEOUT: 5000,
  MAX_TIMEOUT: 120000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 15,
  MAX_TOTAL_DURATION: 5 * 60 * 1000
} as const;

const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Priority: 'u=1'
  }
});

const requestRetryMap = new Map<string, RetryConfig>();

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function getRequestIdentifier(config: any): string {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
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
  const delay = baseDelay * (1 + retryCount); // Exponential backoff
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, NETWORK_CONFIG.MAX_TIMEOUT);
}

// Add new logging utility functions at the top after the imports
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

axiosInstance.interceptors.request.use((config: any) => {
  if (!config) {
    config = {};
  }
  const isApiRequest = config.url?.startsWith(URL);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  // Log all requests
  logRequestStart(config);

  // Only apply special handling for GET requests to API
  if (!isApiRequest || !isGetRequest) {
    return config;
  }

  config.headers = {
    ...config.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Request-Time': Date.now().toString(),
    Priority: 'u=1'
  };

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const isGetRequest = response.config.method?.toLowerCase() === 'get';

    // Log successful response
    logRequestSuccess(response);

    if (!isGetRequest) {
      return response;
    }

    const requestId = getRequestIdentifier(response.config);
    requestRetryMap.delete(requestId);

    return response;
  },
  async (error) => {
    // Log error immediately
    logRequestError(error);

    if (!error?.config) {
      error.config = {};
    }
    const { config } = error;
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const isApiRequest = config.url?.startsWith(URL);

    if (!isGetRequest || !isApiRequest) {
      return Promise.reject(error);
    }

    const requestId = getRequestIdentifier(config);
    const retryConfig = requestRetryMap.get(requestId) || {
      retryCount: 0,
      lastAttemptTime: Date.now()
    };

    const totalDuration = Date.now() - retryConfig.lastAttemptTime;
    if (
      retryConfig.retryCount >= NETWORK_CONFIG.MAX_RETRIES ||
      totalDuration >= NETWORK_CONFIG.MAX_TOTAL_DURATION
    ) {
      logWithTimestamp('🛑 Max retries exceeded', {
        requestId,
        retryCount: retryConfig.retryCount
      });
      requestRetryMap.delete(requestId);
      return Promise.reject(error);
    }

    retryConfig.retryCount += 1;
    requestRetryMap.set(requestId, retryConfig);

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
      return Promise.reject(err);
    }
  }
);

export default axiosInstance;
