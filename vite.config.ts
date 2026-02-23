import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import inject from '@rollup/plugin-inject';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/stockfish.js/stockfish.wasm.js',
          dest: ''
        },
        {
          src: 'node_modules/stockfish.js/stockfish.wasm',
          dest: ''
        },
        {
          src: 'node_modules/stockfish.js/stockfish.js',
          dest: ''
        }
      ]
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
      'react-sanitized-html': resolve(__dirname, 'src/shims/react-sanitized-html.tsx'),
      buffer: 'buffer/',
      util: 'util/'
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
    sourcemap: true
  }
});
