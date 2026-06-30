import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import inject from '@rollup/plugin-inject';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function getVercelDeploymentAssetOrigin({
  command,
  vercelUrl
}: {
  command: string;
  vercelUrl?: string;
}): string | null {
  if (command !== 'build') return null;
  const host = String(vercelUrl || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  if (!host) return null;
  return `https://${host}`;
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
    // Guard against NODE_ENV=development in env files. Vite mirrors it through
    // VITE_USER_NODE_ENV and can otherwise emit dev JSX in production builds.
    process.env.VITE_USER_NODE_ENV = '';
  }

  const env =
    command === 'serve' ? loadEnv(mode, process.cwd(), '') : process.env;
  const previewProxyTarget = env.VITE_URL || 'http://localhost:3500';
  const nodeEnv = command === 'build' ? 'production' : 'development';
  const deploymentAssetOrigin = getVercelDeploymentAssetOrigin({
    command,
    vercelUrl: env.VERCEL_URL
  });

  return {
    experimental: deploymentAssetOrigin
      ? {
          renderBuiltUrl(filename, { type }) {
            // Vercel deployments are immutable. Emitting built assets against
            // the deployment URL keeps old tabs from revalidating chunks
            // against the mutable production alias after a newer promotion.
            if (type === 'asset') return `${deploymentAssetOrigin}/${filename}`;
            return undefined;
          }
        }
      : undefined,
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
      port: 3000,
      proxy: {
        '/build/preview': {
          target: previewProxyTarget,
          changeOrigin: true
        },
        '/build/vendor': {
          target: previewProxyTarget,
          changeOrigin: true
        }
      }
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
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'process.env': {
        NODE_ENV: nodeEnv
      }
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        'react-sanitized-html': resolve(
          __dirname,
          'src/shims/react-sanitized-html.tsx'
        ),
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
  };
});
