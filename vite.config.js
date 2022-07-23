import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { resolve } from 'path';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [react()],
  server: {
    port: '3000'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
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
  },
  build: {
    rollupOptions: {
      plugins: [inject({ Buffer: ['buffer', 'Buffer'], process: 'process' })]
    }
  }
});
