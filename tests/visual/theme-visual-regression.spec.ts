/**
 * Theme Visual Regression Tests
 * Tests visual consistency and layout stability during theme switching
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1366, height: 768, name: 'laptop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' },
];

const PAGES_TO_TEST = [
  { path: '/', name: 'home' },
  { path: '/patients', name: 'patients' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/analytics', name: 'analytics' },
  { path: '/settings', name: 'settings' },
];

const THEMES = ['light', 'dark'];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  THEME_SWITCH_MAX_TIME: 16, // 16ms (1 frame at 60fps)
  LAYOUT_SHIFT_THRESHOLD: 0.1, // CLS threshold
  VISUAL_DIFF_THRESHOLD: 0.2, // 20% visual difference threshold
};

test.describe('Theme Visual Regression Tests', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      // Disable animations for consistent screenshots
      reducedMotion: 'reduce',
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Disable animations and transitions for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });

    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Test theme switching visual consistency across different viewports
  VIEWPORTS.forEach(viewport => {
    test(`Theme switching visual consistency - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      for (const pageConfig of PAGES_TO_TEST) {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');
        
        // Test both theme transitions
        for (let i = 0; i < THEMES.length; i++) {
          const currentTheme = THEMES[i];
          const nextTheme = THEMES[(i + 1) % THEMES.length];
          
          // Set initial theme
          await setTheme(page, currentTheme);
          await page.waitForTimeout(100); // Allow theme to settle
          
          // Take screenshot before theme switch
          const beforeScreenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled',
          });
          
          // Measure theme switch performance
          const startTime = Date.now();
          
          // Switch theme
          await setTheme(page, nextTheme);
          
          // Wait for theme switch to complete
          await page.waitForFunction(
            (theme) => document.documentElement.classList.contains(theme),
            nextTheme,
            { timeout: 1000 }
          );
          
          const endTime = Date.now();
          const switchDuration = endTime - startTime;
          
          // Verify theme switch performance
          expect(switchDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX_TIME);
          
          // Take screenshot after theme switch
          const afterScreenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled',
          });
          
          // Compare screenshots for visual regression
          await expect(page).toHaveScreenshot(
            `${pageConfig.name}-${nextTheme}-${viewport.name}.png`,
            {
              fullPage: true,
              animations: 'disabled',
              threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
            }
          );
          
          // Verify no layout shifts occurred
          await verifyNoLayoutShifts(page);
          
          // Verify theme-specific elements are visible
          await verifyThemeElements(page, nextTheme);
        }
      }
    });
  });

  // Test theme switching with different user interactions
  test('Theme switching during user interactions', async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // Test theme switching while scrolling
    await page.evaluate(() => window.scrollTo(0, 500));
    await setTheme(page, 'dark');
    await page.waitForTimeout(100);
    
    await expect(page).toHaveScreenshot('patients-dark-while-scrolling.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
    });

    // Test theme switching with modal open
    const modalTrigger = page.locator('[data-testid="add-patient-button"]');
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForSelector('[data-testid="patient-modal"]', { state: 'visible' });
      
      await setTheme(page, 'light');
      await page.waitForTimeout(100);
      
      await expect(page).toHaveScreenshot('patients-modal-light-theme.png', {
        animations: 'disabled',
        threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
      });
    }

    // Test theme switching with dropdown open
    const dropdownTrigger = page.locator('[data-testid="filter-dropdown"]');
    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForSelector('[data-testid="dropdown-menu"]', { state: 'visible' });
      
      await setTheme(page, 'dark');
      await page.waitForTimeout(100);
      
      await expect(page).toHaveScreenshot('patients-dropdown-dark-theme.png', {
        animations: 'disabled',
        threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
      });
    }
  });

  // Test theme switching across different component states
  test('Theme switching with component states', async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    
    const componentStates = [
      { path: '/patients', state: 'loading', action: async () => {
        // Simulate loading state
        await page.evaluate(() => {
          const loadingElement = document.createElement('div');
          loadingElement.setAttribute('data-testid', 'loading-spinner');
          loadingElement.textContent = 'Loading...';
          document.body.appendChild(loadingElement);
        });
      }},
      { path: '/patients', state: 'error', action: async () => {
        // Simulate error state
        await page.evaluate(() => {
          const errorElement = document.createElement('div');
          errorElement.setAttribute('data-testid', 'error-message');
          errorElement.textContent = 'Error loading data';
          errorElement.style.color = 'red';
          document.body.appendChild(errorElement);
        });
      }},
      { path: '/patients', state: 'empty', action: async () => {
        // Simulate empty state
        await page.evaluate(() => {
          const emptyElement = document.createElement('div');
          emptyElement.setAttribute('data-testid', 'empty-state');
          emptyElement.textContent = 'No patients found';
          document.body.appendChild(emptyElement);
        });
      }},
    ];

    for (const { path, state, action } of componentStates) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Set up component state
      await action();
      await page.waitForTimeout(100);
      
      // Test theme switching in this state
      for (const theme of THEMES) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        await expect(page).toHaveScreenshot(
          `${path.replace('/', '')}-${state}-${theme}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
          }
        );
      }
    }
  });

  // Test theme switching performance under stress
  test('Theme switching performance stress test', async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const switchTimes: number[] = [];
    const themes = ['light', 'dark'];
    
    // Perform rapid theme switches
    for (let i = 0; i < 10; i++) {
      const theme = themes[i % 2];
      
      const startTime = Date.now();
      await setTheme(page, theme);
      
      // Wait for theme to be applied
      await page.waitForFunction(
        (expectedTheme) => document.documentElement.classList.contains(expectedTheme),
        theme,
        { timeout: 1000 }
      );
      
      const endTime = Date.now();
      const switchTime = endTime - startTime;
      switchTimes.push(switchTime);
      
      // Verify performance threshold
      expect(switchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX_TIME);
      
      // Small delay between switches
      await page.waitForTimeout(10);
    }

    // Verify consistent performance
    const averageTime = switchTimes.reduce((sum, time) => sum + time, 0) / switchTimes.length;
    const maxTime = Math.max(...switchTimes);
    
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX_TIME * 0.75);
    expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX_TIME);
    
    // Take final screenshot to verify visual integrity
    await expect(page).toHaveScreenshot('dashboard-after-stress-test.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
    });
  });

  // Test cross-browser theme consistency
  test('Cross-browser theme consistency', async () => {
    // This test would run across different browsers
    // For now, we'll test different rendering scenarios
    
    await page.setViewportSize({ width: 1366, height: 768 });
    
    const renderingTests = [
      { name: 'high-dpi', deviceScaleFactor: 2 },
      { name: 'standard-dpi', deviceScaleFactor: 1 },
    ];

    for (const { name, deviceScaleFactor } of renderingTests) {
      // Create new context with different DPI
      const testContext = await context.browser()!.newContext({
        deviceScaleFactor,
        reducedMotion: 'reduce',
      });
      
      const testPage = await testContext.newPage();
      
      // Disable animations
      await testPage.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      });

      await testPage.goto('/');
      await testPage.waitForLoadState('networkidle');
      
      for (const theme of THEMES) {
        await setTheme(testPage, theme);
        await testPage.waitForTimeout(100);
        
        await expect(testPage).toHaveScreenshot(
          `home-${theme}-${name}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            threshold: PERFORMANCE_THRESHOLDS.VISUAL_DIFF_THRESHOLD,
          }
        );
      }
      
      await testPage.close();
      await testContext.close();
    }
  });
});

// Helper functions
async function setTheme(page: Page, theme: string) {
  await page.evaluate((themeName) => {
    // Simulate theme switching logic
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeName);
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Trigger theme change event if theme store exists
    if (window.themeStore) {
      window.themeStore.setTheme(themeName);
    }
    
    // Update CSS custom properties
    document.documentElement.style.setProperty('--theme-mode', themeName);
  }, theme);
}

async function verifyNoLayoutShifts(page: Page) {
  // Check for layout shifts using Performance Observer
  const layoutShifts = await page.evaluate(() => {
    return new Promise((resolve) => {
      const shifts: any[] = [];
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              shifts.push({
                value: (entry as any).value,
                hadRecentInput: (entry as any).hadRecentInput,
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Wait for a short period to collect shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(shifts);
        }, 100);
      } else {
        resolve([]);
      }
    });
  });

  // Calculate cumulative layout shift
  const cls = (layoutShifts as any[])
    .filter(shift => !shift.hadRecentInput)
    .reduce((sum, shift) => sum + shift.value, 0);

  expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.LAYOUT_SHIFT_THRESHOLD);
}

async function verifyThemeElements(page: Page, theme: string) {
  // Verify theme-specific elements are properly styled
  const themeClass = await page.evaluate(() => 
    document.documentElement.className
  );
  
  expect(themeClass).toContain(theme);
  
  // Verify theme attribute
  const themeAttribute = await page.getAttribute('html', 'data-theme');
  expect(themeAttribute).toBe(theme);
  
  // Verify CSS custom property
  const cssThemeMode = await page.evaluate(() => 
    getComputedStyle(document.documentElement).getPropertyValue('--theme-mode')
  );
  
  expect(cssThemeMode.trim()).toBe(theme);
  
  // Verify theme-specific colors are applied
  const backgroundColor = await page.evaluate(() => 
    getComputedStyle(document.body).backgroundColor
  );
  
  // Background should be different for light vs dark themes
  if (theme === 'dark') {
    // Dark theme should have dark background
    expect(backgroundColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const [, r, g, b] = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || [];
    const brightness = (parseInt(r) + parseInt(g) + parseInt(b)) / 3;
    expect(brightness).toBeLessThan(128); // Should be dark
  } else {
    // Light theme should have light background
    expect(backgroundColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const [, r, g, b] = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || [];
    const brightness = (parseInt(r) + parseInt(g) + parseInt(b)) / 3;
    expect(brightness).toBeGreaterThan(200); // Should be light
  }
}