import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
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
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          
          // Feature chunks
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils': ['date-fns', 'dayjs', 'dompurify'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
    exclude: ['lucide-react'],
  },
});
