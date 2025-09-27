import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { webVitalsMonitor } from './utils/WebVitalsMonitor';

// Initialize Web Vitals monitoring
if (process.env.NODE_ENV === 'production' || process.env.VITE_ENABLE_WEB_VITALS === 'true') {
  webVitalsMonitor.enable();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);