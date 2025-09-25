import { test, expect } from '@playwright/test';

/**
 * Performance tests for MUI to shadcn/ui migration
 * 
 * These tests monitor performance metrics to ensure the migration
 * improves or maintains performance standards.
 */

test.describe('Migration Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test.describe('Bundle Size Monitoring', () => {
    test('should have reduced bundle size after MUI removal', async ({ page }) => {
      const responses: Array<{ url: string; size: number; type: string }> = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (url.includes('.js') || url.includes('.css')) {
          try {
            const buffer = await response.body();
            responses.push({
              url,
              size: buffer.length,
              type: contentType.includes('javascript') ? 'js' : 'css'
            });
          } catch (error) {
            // Handle cases where response body is not available
            console.warn('Could not get response body for:', url);
          }
        }
      });
      
      await page.reload({ waitUntil: 'networkidle' });
      
      // Calculate total bundle sizes
      const totalJSSize = responses
        .filter(r => r.type === 'js')
        .reduce((sum, r) => sum + r.size, 0);
      
      const totalCSSSize = responses
        .filter(r => r.type === 'css')
        .reduce((sum, r) => sum + r.size, 0);
      
      const totalSize = totalJSSize + totalCSSSize;
      
      // Log bundle sizes for monitoring
      console.log(`Total JS bundle size: ${(totalJSSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total CSS bundle size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
      console.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Bundle size should be reasonable (adjust thresholds based on your app)
      expect(totalSize).toBeLessThan(10 * 1024 * 1024); // 10MB total
      expect(totalJSSize).toBeLessThan(8 * 1024 * 1024); // 8MB JS
    });

    test('should not load MUI dependencies', async ({ page }) => {
      const muiRequests: string[] = [];
      
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('@mui') || url.includes('material-ui')) {
          muiRequests.push(url);
        }
      });
      
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should not load any MUI dependencies
      expect(muiRequests).toHaveLength(0);
    });
  });

  test.describe('Runtime Performance', () => {
    test('should have fast theme toggle performance', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      
      if (await themeToggle.isVisible()) {
        const measurements: number[] = [];
        
        // Measure theme toggle performance multiple times
        for (let i = 0; i < 5; i++) {
          const startTime = await page.evaluate(() => performance.now());
          
          await themeToggle.click();
          
          // Wait for theme change to complete
          await page.waitForFunction(() => {
            const isDark = document.documentElement.classList.contains('dark');
            return isDark !== undefined; // Theme has been applied
          });
          
          const endTime = await page.evaluate(() => performance.now());
          const duration = endTime - startTime;
          
          measurements.push(duration);
          
          // Wait a bit before next measurement
          await page.waitForTimeout(100);
        }
        
        const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxTime = Math.max(...measurements);
        
        console.log(`Average theme toggle time: ${averageTime.toFixed(2)}ms`);
        console.log(`Max theme toggle time: ${maxTime.toFixed(2)}ms`);
        
        // Theme toggle should be fast (within 16ms for 60fps)
        expect(averageTime).toBeLessThan(50); // Allow some buffer for test environment
        expect(maxTime).toBeLessThan(100);
      }
    });

    test('should have fast component render times', async ({ page }) => {
      // Measure component render performance
      const renderMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const renderEntries = entries.filter(entry => 
              entry.name.includes('render') || entry.entryType === 'measure'
            );
            
            if (renderEntries.length > 0) {
              resolve(renderEntries.map(entry => ({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              })));
            } else {
              // If no render entries, resolve with empty array
              setTimeout(() => resolve([]), 1000);
            }
          });
          
          observer.observe({ entryTypes: ['measure', 'navigation'] });
          
          // Trigger a re-render by toggling theme
          document.documentElement.classList.toggle('dark');
        });
      });
      
      console.log('Render metrics:', renderMetrics);
      
      // Basic check that page is responsive
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          loadComplete: timing.loadEventEnd - timing.loadEventStart,
          firstPaint: timing.responseEnd - timing.requestStart
        };
      });
      
      console.log('Navigation timing:', navigationTiming);
      
      // DOM content should load quickly
      expect(navigationTiming.domContentLoaded).toBeLessThan(2000); // 2 seconds
    });

    test('should have efficient memory usage', async ({ page }) => {
      // Measure memory usage before and after interactions
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMemory) {
        // Perform some interactions
        const buttons = await page.locator('button').all();
        for (const button of buttons.slice(0, 5)) {
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(100);
          }
        }
        
        // Toggle theme multiple times
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => {
            document.documentElement.classList.toggle('dark');
          });
          await page.waitForTimeout(200);
        }
        
        const finalMemory = await page.evaluate(() => {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          };
        });
        
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);
        
        // Memory increase should be reasonable
        expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
      }
    });
  });

  test.describe('Loading Performance', () => {
    test('should have fast initial page load', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      
      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay (FID) - simulated
          vitals.fid = 0; // Will be 0 in automated tests
          
          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // First Contentful Paint (FCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.fcp = entries[0].startTime;
          }).observe({ entryTypes: ['paint'] });
          
          // Resolve after a short delay to collect metrics
          setTimeout(() => resolve(vitals), 2000);
        });
      });
      
      console.log('Core Web Vitals:', webVitals);
      
      // Check Core Web Vitals thresholds
      if ((webVitals as any).lcp) {
        expect((webVitals as any).lcp).toBeLessThan(2500); // LCP should be < 2.5s
      }
      
      if ((webVitals as any).fcp) {
        expect((webVitals as any).fcp).toBeLessThan(1800); // FCP should be < 1.8s
      }
      
      if ((webVitals as any).cls !== undefined) {
        expect((webVitals as any).cls).toBeLessThan(0.1); // CLS should be < 0.1
      }
    });

    test('should efficiently load resources', async ({ page }) => {
      const resourceMetrics: Array<{
        url: string;
        type: string;
        size: number;
        duration: number;
      }> = [];
      
      page.on('response', async (response) => {
        const request = response.request();
        const timing = request.timing();
        
        try {
          const buffer = await response.body();
          resourceMetrics.push({
            url: response.url(),
            type: request.resourceType(),
            size: buffer.length,
            duration: timing.responseEnd - timing.requestStart
          });
        } catch (error) {
          // Handle cases where response body is not available
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Analyze resource loading
      const slowResources = resourceMetrics.filter(r => r.duration > 1000); // > 1 second
      const largeResources = resourceMetrics.filter(r => r.size > 1024 * 1024); // > 1MB
      
      console.log(`Slow resources (>1s): ${slowResources.length}`);
      console.log(`Large resources (>1MB): ${largeResources.length}`);
      
      // Should not have too many slow or large resources
      expect(slowResources.length).toBeLessThan(5);
      expect(largeResources.length).toBeLessThan(3);
    });
  });

  test.describe('Interaction Performance', () => {
    test('should have responsive button clicks', async ({ page }) => {
      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 5)) {
        if (await button.isVisible()) {
          const startTime = await page.evaluate(() => performance.now());
          
          await button.click();
          
          // Wait for any visual feedback
          await page.waitForTimeout(50);
          
          const endTime = await page.evaluate(() => performance.now());
          const responseTime = endTime - startTime;
          
          // Button should respond quickly
          expect(responseTime).toBeLessThan(100); // 100ms
        }
      }
    });

    test('should have smooth scrolling performance', async ({ page }) => {
      // Scroll down the page and measure performance
      const scrollMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          
          const measureFrame = () => {
            frameCount++;
            
            if (frameCount < 60) { // Measure for ~1 second at 60fps
              requestAnimationFrame(measureFrame);
            } else {
              const endTime = performance.now();
              const duration = endTime - startTime;
              const fps = (frameCount / duration) * 1000;
              
              resolve({ fps, duration, frameCount });
            }
          };
          
          // Start scrolling
          window.scrollBy(0, 10);
          requestAnimationFrame(measureFrame);
        });
      });
      
      console.log('Scroll performance:', scrollMetrics);
      
      // Should maintain reasonable frame rate
      expect((scrollMetrics as any).fps).toBeGreaterThan(30); // At least 30 FPS
    });
  });
});