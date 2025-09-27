import React, { useEffect } from 'react';
import { useTheme } from '../../stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Optimized ThemeProvider component that initializes the theme system
 * and provides theme context to the entire application with performance monitoring
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { 
    initializeTheme, 
    isInitialized, 
    resolvedTheme, 
    getPerformanceReport,
    isPerformanceOptimal 
  } = useTheme();

  useEffect(() => {
    // Initialize theme system with performance tracking
    const startTime = performance.now();
    
    initializeTheme();
    
    const endTime = performance.now();
    const initDuration = endTime - startTime;
    
    // Log initialization performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Theme system initialized in ${initDuration.toFixed(2)}ms`);
      
      // Log performance report after a short delay
      setTimeout(() => {
        const report = getPerformanceReport();
        console.log('Theme Performance Report:', report);
        
        if (!isPerformanceOptimal()) {
          console.warn('Theme performance is not optimal. Average toggle time should be <16ms');
        }
      }, 1000);
    }
  }, [initializeTheme, getPerformanceReport, isPerformanceOptimal]);

  // Sync with inline script theme application (avoid duplicate DOM manipulation)
  useEffect(() => {
    if (isInitialized) {
      const initialTheme = (window as any).__INITIAL_THEME__;
      
      // Only apply theme if it wasn't already applied by inline script
      if (!initialTheme || initialTheme.resolved !== resolvedTheme) {
        const root = document.documentElement;
        
        // Use optimized class manipulation
        if (resolvedTheme === 'dark') {
          root.classList.remove('light');
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
        
        root.setAttribute('data-theme', resolvedTheme);
        root.style.setProperty('--theme-mode', resolvedTheme);
      }
    }
  }, [resolvedTheme, isInitialized]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isInitialized) {
      // Monitor theme performance every 30 seconds
      const interval = setInterval(() => {
        const report = getPerformanceReport();
        
        if (report.totalToggles > 0) {
          console.log('Theme Performance Update:', {
            averageToggleTime: `${report.averageTime.toFixed(2)}ms`,
            lastToggleTime: report.lastTime ? `${report.lastTime.toFixed(2)}ms` : 'N/A',
            totalToggles: report.totalToggles,
            optimalPerformance: report.optimalPerformance,
            slowToggles: report.slowToggles
          });
          
          if (report.slowToggles > 0) {
            console.warn(`${report.slowToggles} theme toggles exceeded 16ms target`);
          }
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isInitialized, getPerformanceReport]);

  return <>{children}</>;
};

export default ThemeProvider;
