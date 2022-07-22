import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import AntdMomentResolver from 'vite-plugin-antdv1-momentjs-resolver';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), AntdMomentResolver()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  },
  define: {
    global: 'window',
    'process.env': {}
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src')
    }
  }
});
