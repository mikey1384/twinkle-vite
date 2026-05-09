const URL =
  import.meta.env.VITE_URL ||
  import.meta.env.VITE_SITE_URL ||
  (import.meta.env.PROD
    ? 'https://api.twinkle.network'
    : 'http://localhost:3500');

export default URL;
