import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for MUI to shadcn/ui migration
 * 
 * These tests capture screenshots of components in both light and dark themes
 * to ensure visual consistency during the migration process.
 */

test.describe('Migration Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the component showcase page
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('Theme Switching', () => {
    test('should maintain visual consistency when switching themes', async ({ page }) => {
      // Test light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      
      await page.waitForTimeout(500); // Allow theme transition to complete
      
      // Take screenshot in light theme
      await expect(page).toHaveScreenshot('light-theme-homepage.png', {
        fullPage: true,
        animations: 'disabled',
      });
      
      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      await page.waitForTimeout(500); // Allow theme transition to complete
      
      // Take screenshot in dark theme
      await expect(page).toHaveScreenshot('dark-theme-homepage.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should have fast theme toggle performance', async ({ page }) => {
      // Find theme toggle button (adjust selector based on your implementation)
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      
      if (await themeToggle.isVisible()) {
        // Measure theme toggle performance
        const startTime = Date.now();
        
        await themeToggle.click();
        
        // Wait for theme change to complete
        await page.waitForFunction(() => {
          return document.documentElement.classList.contains('dark') || 
                 !document.documentElement.classList.contains('dark');
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Theme toggle should complete within 100ms (including network latency)
        expect(duration).toBeLessThan(100);
      }
    });
  });

  test.describe('Component Migration', () => {
    test('should render buttons consistently across themes', async ({ page }) => {
      // Navigate to buttons showcase (adjust URL based on your setup)
      const buttonsExist = await page.locator('button').first().isVisible();
      
      if (buttonsExist) {
        // Light theme buttons
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
        
        await expect(page.locator('button').first()).toHaveScreenshot('button-light.png');
        
        // Dark theme buttons
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        await expect(page.locator('button').first()).toHaveScreenshot('button-dark.png');
      }
    });

    test('should render form inputs consistently', async ({ page }) => {
      const inputsExist = await page.locator('input').first().isVisible();
      
      if (inputsExist) {
        // Test input fields in both themes
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
        
        await expect(page.locator('input').first()).toHaveScreenshot('input-light.png');
        
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        await expect(page.locator('input').first()).toHaveScreenshot('input-dark.png');
      }
    });

    test('should render cards consistently', async ({ page }) => {
      const cardsExist = await page.locator('[class*="card"]').first().isVisible();
      
      if (cardsExist) {
        // Test cards in both themes
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
        
        await expect(page.locator('[class*="card"]').first()).toHaveScreenshot('card-light.png');
        
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        await expect(page.locator('[class*="card"]').first()).toHaveScreenshot('card-dark.png');
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Test both themes on each viewport
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
        
        await expect(page).toHaveScreenshot(`${viewport.name}-light.png`, {
          fullPage: true,
          animations: 'disabled',
        });
        
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        await expect(page).toHaveScreenshot(`${viewport.name}-dark.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      // Take screenshots for comparison across browsers
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      
      await expect(page).toHaveScreenshot(`${browserName}-light.png`, {
        fullPage: true,
        animations: 'disabled',
      });
      
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      await expect(page).toHaveScreenshot(`${browserName}-dark.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should have acceptable bundle size after migration', async ({ page }) => {
      // Monitor network requests to check bundle size
      const responses: any[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length'],
            status: response.status(),
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that main bundle is not excessively large
      const mainBundle = responses.find(r => r.url.includes('index') && r.url.includes('.js'));
      
      if (mainBundle && mainBundle.size) {
        const sizeInMB = parseInt(mainBundle.size) / (1024 * 1024);
        
        // Bundle should be reasonable size (adjust threshold as needed)
        expect(sizeInMB).toBeLessThan(5); // 5MB threshold
      }
    });

    test('should have fast page load times', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });
  });
});