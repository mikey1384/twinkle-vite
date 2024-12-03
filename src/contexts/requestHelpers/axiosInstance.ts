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

// Custom request function to handle deduplication and retries
async function customRequest(config: any): Promise<AxiosResponse> {
  const isApiRequest = config.url?.startsWith(URL as string);
  const isGetRequest = config.method?.toLowerCase() === 'get';

  // Log all requests
  logRequestStart(config);

  if (!isApiRequest || !isGetRequest) {
    // For non-API or non-GET requests, proceed normally
    try {
      const response = await axiosInstance(config);
      logRequestSuccess(response);
      return response;
    } catch (error) {
      logRequestError(error);
      throw error;
    }
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
  config.__retryConfig = {
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

  // Start the request process
  await processRequest(config, requestId);

  return promise;
}

// Function to process the request and handle retries
async function processRequest(config: any, requestId: string) {
  const retryConfig: RetryConfig = config.__retryConfig;

  try {
    // Add fresh parameters
    config = addFreshRequestParams(config);

    // Set headers
    config.headers = {
      ...config.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Request-Time': Date.now().toString(),
      Priority: 'u=1'
    };

    // Make the request
    const response = await axiosInstance(config);
    logRequestSuccess(response);

    // Resolve the pending promise
    const pendingRequest = pendingRequests.get(requestId);
    if (pendingRequest) {
      pendingRequest.resolve(response);
      pendingRequests.delete(requestId);
    }
  } catch (error) {
    logRequestError(error);

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
      const pendingRequest = pendingRequests.get(requestId);
      if (pendingRequest) {
        pendingRequest.reject(error);
        pendingRequests.delete(requestId);
      }
      return;
    }

    retryConfig.retryCount += 1;
    retryConfig.lastAttemptTime = Date.now();

    const delay = getRetryDelay(retryConfig.retryCount);

    logWithTimestamp(`🔄 Retrying request ${requestId} in ${delay}ms`, {
      attempt: retryConfig.retryCount
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the request
    await processRequest(config, requestId);
  }
}

export default customRequest;
