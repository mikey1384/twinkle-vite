import react from '@vitejs/plugin-react-swc';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { resolve } from 'path';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin(), eslint()],
  server: {
    port: 3000
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
      external: ['@babel/parser']
    },
    sourcemap: true
  }
});
