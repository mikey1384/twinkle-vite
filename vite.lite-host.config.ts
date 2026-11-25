// Builds the lite host (src/liteHost/react) on its own: one JS file and one
// CSS file with content hashes, plus current.json naming them. Uploaded to
// the sites bucket as _lumine/host/* by scripts/lumine-app-hosting-infra.mjs
// and shared (cached) by every app.
//   LUMINE_HOST_API_URL=https://api.example npx vite build --config vite.lite-host.config.ts
// The API address is baked in here (VITE_URL, as constants/URL.ts reads it):
// LUMINE_HOST_API_URL, else the website's own VITE_URL for this mode.
import react from '@vitejs/plugin-react-swc';
import inject from '@rollup/plugin-inject';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'node:fs';

function currentManifest(): Plugin {
  return {
    name: 'lumine-lite-host-manifest',
    apply: 'build',
    enforce: 'post',
    writeBundle(_options, bundle) {
      const files = Object.keys(bundle);
      const script = files.find((name) => /^host\.[\w-]+\.js$/.test(name));
      const style = files.find((name) => /^host\.[\w-]+\.css$/.test(name));
      if (!script || !style) throw new Error(`lite host: missing host js/css in ${files.join(', ')}`);
      writeFileSync(
        resolve(__dirname, 'dist-lite-host/current.json'),
        JSON.stringify({ script: `/_lumine/host/${script}`, style: `/_lumine/host/${style}` }, null, 2)
      );
    }
  };
}

// Website modules the lite host swaps for its own small versions (same
// exports), so Twinkle's boxes come without the whole website around them.
export const LITE_HOST_SHIMS: Record<string, string> = {
  'src/components/ErrorBoundary.tsx': 'src/liteHost/react/shims/ErrorBoundary.tsx'
};

function liteHostShims(): Plugin {
  const map = new Map(
    Object.entries(LITE_HOST_SHIMS).map(([from, to]) => [resolve(__dirname, from), resolve(__dirname, to)])
  );
  return {
    name: 'lumine-lite-host-shims',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer.includes('/src/liteHost/react/shims/')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      const target = resolved && map.get(resolved.id.split('?')[0]);
      return target || null;
    }
  };
}

export default defineConfig(({ mode }) => {
  // As vite.config.ts does for builds: a .env NODE_ENV=development would
  // otherwise make the React plugin emit dev-only JSX (jsxDEV).
  process.env.NODE_ENV = 'production';
  const env = loadEnv(mode, process.cwd(), '');
  process.env.VITE_USER_NODE_ENV = '';
  const apiUrl = process.env.LUMINE_HOST_API_URL || env.VITE_URL || '';
  if (!/^https?:\/\/[^/]+$/.test(apiUrl)) {
    throw new Error(`lite host: set LUMINE_HOST_API_URL (an origin), got "${apiUrl}"`);
  }
  const appVersion = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version;
  return {
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
      'react-sanitized-html': resolve(__dirname, 'src/shims/react-sanitized-html.tsx'),
      buffer: 'buffer/',
      util: 'util/'
    }
  },
  define: {
    global: 'window',
    __APP_VERSION__: JSON.stringify(appVersion),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': { NODE_ENV: 'production' },
    'import.meta.env.VITE_URL': JSON.stringify(apiUrl),
    'import.meta.env.VITE_SITE_URL': JSON.stringify(apiUrl)
  },
  publicDir: false,
  build: {
    outDir: 'dist-lite-host',
    emptyOutDir: true,
    target: 'es2019',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/liteHost/react/main.tsx'),
      plugins: [inject({ Buffer: ['buffer', 'Buffer'], process: 'process' })],
      output: {
        format: 'iife',
        entryFileNames: 'host.[hash].js',
        assetFileNames: 'host.[hash][extname]',
        inlineDynamicImports: true
      }
    }
  },
  plugins: [liteHostShims(), react(), currentManifest()]
  };
});
