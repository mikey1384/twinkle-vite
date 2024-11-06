import axios from 'axios';

let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
});

window.addEventListener('offline', () => {
  isOnline = false;
});

const axiosInstance = axios.create({
  timeout: 60000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

function delay(retryCount: number) {
  const backoffDelay = Math.pow(2, retryCount) * 1000;
  return new Promise((resolve) => setTimeout(resolve, backoffDelay));
}

axiosInstance.interceptors.request.use(async (config) => {
  config.params = {
    ...config.params,
    _: Date.now()
  };

  if (!isOnline) {
    return Promise.reject(new Error('No internet connection'));
  }

  return config;
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      config.__retryCount += 1;

      const backoffDelay = Math.pow(2, config.__retryCount) * 1000;
      console.log(
        `Network error detected, retrying request in ${backoffDelay} ms...`
      );
      await delay(config.__retryCount);

      if (isOnline) {
        return axiosInstance(config);
      } else {
        return Promise.reject(new Error('No internet connection'));
      }
    }

    return Promise.reject(error);
  }
);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    isOnline = navigator.onLine;
  }
});

export default axiosInstance;
