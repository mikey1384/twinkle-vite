/// <reference types="vite/client" />

interface ImportMetaEnv {
  [key: string]: string | boolean | undefined;
  VITE_API_URL: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

// Injected by vite.config.ts `define` from package.json's version.
declare const __APP_VERSION__: string;
