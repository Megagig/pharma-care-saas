import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(`Rewriting path: ${path}`);
          return path;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('PROXY ERROR:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('PROXY SENDING REQUEST:');
            console.log(`  Method: ${req.method}`);
            console.log(`  URL: ${req.url}`);
            console.log(`  Headers: ${JSON.stringify(proxyReq.getHeaders())}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('PROXY RECEIVED RESPONSE:');
            console.log(`  URL: ${req.url}`);
            console.log(`  Status: ${proxyRes.statusCode}`);
            console.log(`  Content-Type: ${proxyRes.headers['content-type']}`);
          });
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
