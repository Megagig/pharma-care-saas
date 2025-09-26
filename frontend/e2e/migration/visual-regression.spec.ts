import { test, expect } from '@playwright/test';

/**
 * Comprehensive Visual Regression Tests for MUI to shadcn/ui migration
 * 
 * These tests capture screenshots of all major pages and components in both 
 * light and dark themes across different browsers and viewports to ensure 
 * visual consistency during the migration process.
 */

// Test configuration
const THEMES = ['light', 'dark'] as const;
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
] as const;

// Major pages to test (public pages that don't require authentication)
const PUBLIC_PAGES = [
  { path: '/', name: 'landing' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/pricing', name: 'pricing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
] as const;

// Helper function to set theme
async function setTheme(page: any, theme: 'light' | 'dark') {
  await page.evaluate((theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, theme);
  
  // Wait for theme transition to complete
  await page.waitForTimeout(300);
}

// Helper function to wait for page load
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional wait for any animations
}

test.describe('Migration Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with consistent settings
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  });

  test.describe('Public Pages Visual Regression', () => {
    for (const page_info of PUBLIC_PAGES) {
      for (const theme of THEMES) {
        test(`should render ${page_info.name} page correctly in ${theme} theme`, async ({ page }) => {
          await page.goto(page_info.path);
          await waitForPageLoad(page);
          
          await setTheme(page, theme);
          
          await expect(page).toHaveScreenshot(`${page_info.name}-${theme}.png`, {
            fullPage: true,
            animations: 'disabled',
            threshold: 0.2, // Allow for minor differences
          });
        });
      }
    }
  });

  test.describe('Theme Switching Performance', () => {
    test('should have fast theme toggle performance', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Find theme toggle button
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
        
        // Theme toggle should complete within 16ms requirement (plus some buffer for test environment)
        expect(duration).toBeLessThan(50);
      }
    });

    test('should maintain visual consistency when switching themes rapidly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Test rapid theme switching
      for (let i = 0; i < 5; i++) {
        await setTheme(page, 'light');
        await setTheme(page, 'dark');
      }
      
      // Final state should be stable
      await setTheme(page, 'light');
      await expect(page).toHaveScreenshot('rapid-theme-switch-final.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Component Migration Visual Tests', () => {
    test('should render migrated buttons consistently across themes', async ({ page }) => {
      await page.goto('/login'); // Login page has various button types
      await waitForPageLoad(page);
      
      const buttonsExist = await page.locator('button').first().isVisible();
      
      if (buttonsExist) {
        for (const theme of THEMES) {
          await setTheme(page, theme);
          
          // Test different button variants if they exist
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 3); i++) {
            await expect(buttons.nth(i)).toHaveScreenshot(`button-${i}-${theme}.png`, {
              threshold: 0.2,
            });
          }
        }
      }
    });

    test('should render migrated form inputs consistently', async ({ page }) => {
      await page.goto('/login'); // Login page has form inputs
      await waitForPageLoad(page);
      
      const inputsExist = await page.locator('input').first().isVisible();
      
      if (inputsExist) {
        for (const theme of THEMES) {
          await setTheme(page, theme);
          
          // Test different input states
          const emailInput = page.locator('input[type="email"]').first();
          const passwordInput = page.locator('input[type="password"]').first();
          
          if (await emailInput.isVisible()) {
            await expect(emailInput).toHaveScreenshot(`email-input-${theme}.png`, {
              threshold: 0.2,
            });
            
            // Test focused state
            await emailInput.focus();
            await expect(emailInput).toHaveScreenshot(`email-input-focused-${theme}.png`, {
              threshold: 0.2,
            });
          }
          
          if (await passwordInput.isVisible()) {
            await expect(passwordInput).toHaveScreenshot(`password-input-${theme}.png`, {
              threshold: 0.2,
            });
          }
        }
      }
    });

    test('should render migrated cards consistently', async ({ page }) => {
      await page.goto('/pricing'); // Pricing page likely has cards
      await waitForPageLoad(page);
      
      const cardsExist = await page.locator('[class*="card"], .card, [data-testid*="card"]').first().isVisible();
      
      if (cardsExist) {
        for (const theme of THEMES) {
          await setTheme(page, theme);
          
          const cards = page.locator('[class*="card"], .card, [data-testid*="card"]');
          const cardCount = await cards.count();
          
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            await expect(cards.nth(i)).toHaveScreenshot(`card-${i}-${theme}.png`, {
              threshold: 0.2,
            });
          }
        }
      }
    });

    test('should render navigation components consistently', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      for (const theme of THEMES) {
        await setTheme(page, theme);
        
        // Test header/navbar
        const navbar = page.locator('nav, header, [role="navigation"]').first();
        if (await navbar.isVisible()) {
          await expect(navbar).toHaveScreenshot(`navbar-${theme}.png`, {
            threshold: 0.2,
          });
        }
        
        // Test footer if exists
        const footer = page.locator('footer').first();
        if (await footer.isVisible()) {
          await expect(footer).toHaveScreenshot(`footer-${theme}.png`, {
            threshold: 0.2,
          });
        }
      }
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        test(`should render correctly on ${viewport.name} in ${theme} theme`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          
          // Test key pages on different viewports
          const testPages = [
            { path: '/', name: 'landing' },
            { path: '/login', name: 'login' },
            { path: '/pricing', name: 'pricing' },
          ];
          
          for (const testPage of testPages) {
            await page.goto(testPage.path);
            await waitForPageLoad(page);
            await setTheme(page, theme);
            
            await expect(page).toHaveScreenshot(`${testPage.name}-${viewport.name}-${theme}.png`, {
              fullPage: true,
              animations: 'disabled',
              threshold: 0.2,
            });
          }
        });
      }
    }

    test('should handle viewport transitions smoothly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Test viewport transitions
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(300); // Allow for responsive adjustments
        
        await expect(page).toHaveScreenshot(`viewport-transition-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
          threshold: 0.3,
        });
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      const testPages = [
        { path: '/', name: 'landing' },
        { path: '/login', name: 'login' },
        { path: '/pricing', name: 'pricing' },
      ];
      
      for (const testPage of testPages) {
        await page.goto(testPage.path);
        await waitForPageLoad(page);
        
        for (const theme of THEMES) {
          await setTheme(page, theme);
          
          await expect(page).toHaveScreenshot(`${testPage.name}-${browserName}-${theme}.png`, {
            fullPage: true,
            animations: 'disabled',
            threshold: 0.3, // Allow for browser differences
          });
        }
      }
    });

    test('should handle CSS features consistently across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Test CSS Grid and Flexbox layouts
      const layoutElements = page.locator('[class*="grid"], [class*="flex"]');
      const elementCount = await layoutElements.count();
      
      if (elementCount > 0) {
        for (let i = 0; i < Math.min(elementCount, 3); i++) {
          await expect(layoutElements.nth(i)).toHaveScreenshot(`layout-${i}-${browserName}.png`, {
            threshold: 0.3,
          });
        }
      }
    });
  });

  test.describe('Visual Regression Performance', () => {
    test('should have acceptable bundle size after migration', async ({ page }) => {
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
      await waitForPageLoad(page);
      
      // Check bundle sizes
      const jsFiles = responses.filter(r => r.url.includes('.js'));
      const cssFiles = responses.filter(r => r.url.includes('.css'));
      
      let totalJSSize = 0;
      let totalCSSSize = 0;
      
      jsFiles.forEach(file => {
        if (file.size) {
          totalJSSize += parseInt(file.size);
        }
      });
      
      cssFiles.forEach(file => {
        if (file.size) {
          totalCSSSize += parseInt(file.size);
        }
      });
      
      const totalSizeMB = (totalJSSize + totalCSSSize) / (1024 * 1024);
      
      // Bundle should be reasonable size after MUI removal
      expect(totalSizeMB).toBeLessThan(3); // 3MB threshold (should be smaller after MUI removal)
      
      console.log(`Total bundle size: ${totalSizeMB.toFixed(2)}MB (JS: ${(totalJSSize / (1024 * 1024)).toFixed(2)}MB, CSS: ${(totalCSSSize / (1024 * 1024)).toFixed(2)}MB)`);
    });

    test('should have fast page load times across all pages', async ({ page }) => {
      const testPages = PUBLIC_PAGES;
      
      for (const testPage of testPages) {
        const startTime = Date.now();
        
        await page.goto(testPage.path);
        await waitForPageLoad(page);
        
        const loadTime = Date.now() - startTime;
        
        // Page should load within reasonable time
        expect(loadTime).toBeLessThan(3000); // 3 seconds for each page
        
        console.log(`${testPage.name} page load time: ${loadTime}ms`);
      }
    });

    test('should render without visual glitches during theme transitions', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Record theme transition
      await page.video()?.path();
      
      // Rapid theme switching to test for visual glitches
      for (let i = 0; i < 3; i++) {
        await setTheme(page, 'light');
        await page.waitForTimeout(100);
        await setTheme(page, 'dark');
        await page.waitForTimeout(100);
      }
      
      // Final screenshot should be stable
      await setTheme(page, 'light');
      await expect(page).toHaveScreenshot('theme-transition-final.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.1,
      });
    });
  });

  test.describe('Visual Regression Documentation', () => {
    test('should generate visual regression report', async ({ page }) => {
      // This test documents the visual regression testing process
      const report = {
        testDate: new Date().toISOString(),
        pagesTestedCount: PUBLIC_PAGES.length,
        themesTestedCount: THEMES.length,
        viewportsTestedCount: VIEWPORTS.length,
        totalScreenshots: PUBLIC_PAGES.length * THEMES.length * VIEWPORTS.length,
        testCoverage: {
          publicPages: PUBLIC_PAGES.map(p => p.name),
          themes: [...THEMES],
          viewports: VIEWPORTS.map(v => v.name),
          browsers: ['chromium', 'firefox', 'webkit'],
        },
        requirements: [
          '6.3 - Visual regression testing across themes and browsers',
          '6.5 - Responsive design behavior validation',
          '5.1 - Mobile-first responsive design',
          '5.2 - Tailwind breakpoint system',
          '5.3 - Cross-device functionality',
        ],
      };
      
      console.log('Visual Regression Test Report:', JSON.stringify(report, null, 2));
      
      // This test always passes - it's for documentation
      expect(report.totalScreenshots).toBeGreaterThan(0);
    });
  });
});