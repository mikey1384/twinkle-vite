import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import eslint from 'vite-plugin-eslint';
import inject from '@rollup/plugin-inject';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'Safari >= 13', 'iOS >= 13'],
      modernPolyfills: true
    }),
    eslint({
      include: ['src/**/*.ts', 'src/**/*.tsx']
    })
  ],
  server: {
    port: 3000
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    global: 'window',
    'process.env': {}
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
      buffer: 'buffer/'
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: 'process'
        })
      ]
    },
    sourcemap: false
  }
});
