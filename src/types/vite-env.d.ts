interface ImportMetaEnv {
  [key: string]: string | boolean | undefined;
  VITE_API_URL: string;
  // Add any other Vite environment variables you are using
}

interface ImportMeta {
  env: ImportMetaEnv;
}
