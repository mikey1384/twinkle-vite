// vite.config.js
import react from "file:///Users/mikey/Developer/twinkle-vite/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig, splitVendorChunkPlugin } from "file:///Users/mikey/Developer/twinkle-vite/node_modules/vite/dist/node/index.js";
import { NodeGlobalsPolyfillPlugin } from "file:///Users/mikey/Developer/twinkle-vite/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
import { resolve } from "path";
import inject from "file:///Users/mikey/Developer/twinkle-vite/node_modules/@rollup/plugin-inject/dist/es/index.js";
var __vite_injected_original_dirname = "/Users/mikey/Developer/twinkle-vite";
var vite_config_default = defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  server: {
    port: "3000"
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
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
    global: "window",
    "process.env": {}
  },
  resolve: {
    alias: {
      "~": resolve(__vite_injected_original_dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      plugins: [inject({ Buffer: ["buffer", "Buffer"], process: "process" })]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWlrZXkvRGV2ZWxvcGVyL3R3aW5rbGUtdml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL21pa2V5L0RldmVsb3Blci90d2lua2xlLXZpdGUvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21pa2V5L0RldmVsb3Blci90d2lua2xlLXZpdGUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBzcGxpdFZlbmRvckNodW5rUGx1Z2luIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBOb2RlR2xvYmFsc1BvbHlmaWxsUGx1Z2luIH0gZnJvbSAnQGVzYnVpbGQtcGx1Z2lucy9ub2RlLWdsb2JhbHMtcG9seWZpbGwnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IGluamVjdCBmcm9tICdAcm9sbHVwL3BsdWdpbi1pbmplY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgc3BsaXRWZW5kb3JDaHVua1BsdWdpbigpXSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogJzMwMDAnXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcydcbiAgICAgIH0sXG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4oe1xuICAgICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICAgICAgYnVmZmVyOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICBdXG4gICAgfVxuICB9LFxuICBkZWZpbmU6IHtcbiAgICBnbG9iYWw6ICd3aW5kb3cnLFxuICAgICdwcm9jZXNzLmVudic6IHt9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ34nOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIHBsdWdpbnM6IFtpbmplY3QoeyBCdWZmZXI6IFsnYnVmZmVyJywgJ0J1ZmZlciddLCBwcm9jZXNzOiAncHJvY2VzcycgfSldXG4gICAgfVxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlIsT0FBTyxXQUFXO0FBQzdTLFNBQVMsY0FBYyw4QkFBOEI7QUFDckQsU0FBUyxpQ0FBaUM7QUFDMUMsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sWUFBWTtBQUpuQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLHVCQUF1QixDQUFDO0FBQUEsRUFDM0MsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLDBCQUEwQjtBQUFBLFVBQ3hCLFNBQVM7QUFBQSxVQUNULFFBQVE7QUFBQSxRQUNWLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxJQUNSLGVBQWUsQ0FBQztBQUFBLEVBQ2xCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsU0FBUyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsVUFBVSxRQUFRLEdBQUcsU0FBUyxVQUFVLENBQUMsQ0FBQztBQUFBLElBQ3hFO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
