
import ReactDOM from 'react-dom/client';

import { HelmetProvider } from 'react-helmet-async';

import App from './App';

import './index.css';

import { initThemeSync } from './lib/theme-init';
// Initialize theme before React renders to prevent flicker
initThemeSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);