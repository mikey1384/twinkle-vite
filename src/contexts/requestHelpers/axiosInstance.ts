import axios from 'axios';

// Create axios instance with default configurations
const axiosInstance = axios.create({
  timeout: 60000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

// Utility function for delay
function delay(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add request interceptor
axiosInstance.interceptors.request.use(async (config) => {
  // Add timestamp to prevent caching
  config.params = {
    ...config.params,
    _: Date.now()
  };

  // Verify online status before making request
  if (!navigator.onLine) {
    return Promise.reject(new Error('No internet connection'));
  }

  return config;
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount >= 3) {
      // Reject the error after 3 retries
      return Promise.reject(error);
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      console.log('Network error detected, retrying request...');
      config.__retryCount += 1;
      await delay(1000);

      if (navigator.onLine) {
        return axiosInstance(config);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
