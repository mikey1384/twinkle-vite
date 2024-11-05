import request from 'axios';

// Create axios instance with default configurations
const axiosInstance = request.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0'
  },
  // Prevent cached responses
  params: {
    _: Date.now()
  }
});

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
    if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      // Handle timeout or network errors
      console.log('Network error detected, checking connection...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (navigator.onLine) {
        // Retry the request
        const config = error.config;
        return axiosInstance(config);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
