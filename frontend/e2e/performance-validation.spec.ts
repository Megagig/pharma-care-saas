import { test, expect, devices } from '@playwright/test';

/**
 * Performance validation tests for MUI to shadcn migration
 * Tests performance on low-end devices and slow networks
 */

// Low-end device configurations
const lowEndDevices = [
  {
    name: 'Low-end Mobile',
    ...devices['Galaxy S5'],
    cpu: { rate: 4 }, // 4x CPU slowdown
  },
  {
    name: 'Low-end Desktop',
    viewport: { width: 1024, height: 768 },
    cpu: { rate: 2 }, // 2x CPU slowdown
  }
];

// Network conditions
const networkConditions = {
  'Slow 3G': {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500kb/s
    uploadThroughput: 500 * 1024 / 8,
    latency: 400,
  },
  'Fast 3G': {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6Mb/s
    uploadThroughput: 750 * 1024 / 8,
    latency: 150,
  }
};

test.describe('Performance Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test('should load application within performance thresholds on low-end mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...lowEndDevices[0],
    });
    
    const page = await context.newPage();
    
    // Set slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds on low-end device
    expect(loadTime).toBeLessThan(5000);
    
    // Check if main content is visible
    await expect(page.locator('[data-testid="main-content"], main, .dashboard')).toBeVisible();
    
    await context.close();
  });

  test('should toggle theme quickly on low-end devices', async ({ browser }) => {
    for (const device of lowEndDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find theme toggle button
      const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"], button:has-text("theme")').first();
      
      if (await themeToggle.count() > 0) {
        const startTime = Date.now();
        
        await themeToggle.click();
        
        // Wait for theme change to complete
        await page.waitForFunction(() => {
          return document.documentElement.classList.contains('dark') || 
                 document.documentElement.classList.contains('light');
        });
        
        const toggleTime = Date.now() - startTime;
        
        // Theme toggle should complete within 100ms even on low-end devices
        expect(toggleTime).toBeLessThan(100);
        
        console.log(`Theme toggle time on ${device.name}: ${toggleTime}ms`);
      }
      
      await context.close();
    }
  });

  test('should handle slow network conditions gracefully', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async route => {
      // Add random delay between 200-800ms
      const delay = Math.random() * 600 + 200;
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });

    const startTime = Date.now();
    
    await page.goto('/');
    
    // Should show loading state
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner').first();
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds on slow network
    expect(loadTime).toBeLessThan(10000);
    
    // Main content should be visible
    await expect(page.locator('[data-testid="main-content"], main, .dashboard')).toBeVisible();
  });

  test('should maintain responsive design on various screen sizes', async ({ browser }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }, // Small desktop
      { width: 1920, height: 1080 }, // Full HD
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if navigation is accessible
      const nav = page.locator('nav, [role="navigation"], .sidebar, .navbar').first();
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
      
      // Check if main content is visible and not overflowing
      const main = page.locator('main, [role="main"], .main-content').first();
      if (await main.count() > 0) {
        const boundingBox = await main.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
      
      console.log(`Responsive test passed for ${viewport.width}x${viewport.height}`);
      
      await context.close();
    }
  });

  test('should handle form interactions efficiently on low-end devices', async ({ browser }) => {
    const context = await browser.newContext({
      ...lowEndDevices[0],
    });
    
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for forms on the page
    const forms = await page.locator('form').count();
    
    if (forms > 0) {
      const form = page.locator('form').first();
      
      // Find input fields
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        const startTime = Date.now();
        
        // Fill first input
        const firstInput = inputs.first();
        await firstInput.click();
        await firstInput.fill('test input');
        
        const interactionTime = Date.now() - startTime;
        
        // Form interaction should be responsive even on low-end devices
        expect(interactionTime).toBeLessThan(500);
        
        console.log(`Form interaction time: ${interactionTime}ms`);
      }
    }
    
    await context.close();
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // First Input Delay (simulated)
        document.addEventListener('click', (event) => {
          vitals.fid = performance.now() - event.timeStamp;
        }, { once: true });
        
        // Wait for measurements
        setTimeout(() => {
          resolve(vitals);
        }, 3000);
      });
    });
    
    console.log('Core Web Vitals:', vitals);
    
    // Validate Core Web Vitals thresholds
    if (vitals.fcp) {
      expect(vitals.fcp).toBeLessThan(2000); // FCP < 2s
    }
    
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(4000); // LCP < 4s
    }
    
    if (vitals.cls !== undefined) {
      expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);
      
      // Perform some interactions
      const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"], button:has-text("theme")').first();
      
      if (await themeToggle.count() > 0) {
        // Toggle theme multiple times
        for (let i = 0; i < 5; i++) {
          await themeToggle.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Measure memory after interactions
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (finalMemory) {
        console.log('Final memory usage:', finalMemory);
        
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
        
        // Memory increase should be reasonable (less than 50% for basic interactions)
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    }
  });

  test('should handle concurrent theme toggles without performance degradation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"], button:has-text("theme")').first();
    
    if (await themeToggle.count() > 0) {
      const startTime = Date.now();
      
      // Perform rapid theme toggles
      const togglePromises = [];
      for (let i = 0; i < 10; i++) {
        togglePromises.push(themeToggle.click());
      }
      
      await Promise.all(togglePromises);
      
      const totalTime = Date.now() - startTime;
      
      console.log(`10 rapid theme toggles completed in: ${totalTime}ms`);
      
      // Should handle rapid toggles efficiently
      expect(totalTime).toBeLessThan(1000); // 1 second for 10 toggles
      
      // Page should still be responsive
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Bundle Size Impact Tests', () => {
  test('should load with acceptable bundle size', async ({ page }) => {
    // Navigate and measure network requests
    const requests = [];
    
    page.on('request', request => {
      if (request.resourceType() === 'script' || request.resourceType() === 'stylesheet') {
        requests.push({
          url: request.url(),
          type: request.resourceType()
        });
      }
    });
    
    const responses = [];
    page.on('response', response => {
      if (response.request().resourceType() === 'script' || response.request().resourceType() === 'stylesheet') {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.request().resourceType()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('Resource requests:', requests.length);
    console.log('Resource responses:', responses.length);
    
    // Log bundle information
    const jsResponses = responses.filter(r => r.type === 'script');
    const cssResponses = responses.filter(r => r.type === 'stylesheet');
    
    console.log(`JavaScript files: ${jsResponses.length}`);
    console.log(`CSS files: ${cssResponses.length}`);
    
    // Should not have excessive number of chunks
    expect(jsResponses.length).toBeLessThan(20);
    expect(cssResponses.length).toBeLessThan(10);
  });
});