interface ImportMetaEnv {
  [key: string]: string | boolean | undefined;
  VITE_API_URL: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
