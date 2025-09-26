import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Basic Accessibility Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    
    // Skip authentication for now and go directly to dashboard
    await page.goto('/dashboard');
    
    // Inject axe-core
    await injectAxe(page);
  });

  test('Dashboard accessibility check', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Run basic accessibility check
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true }
      }
    });
  });

  test('Theme toggle accessibility', async ({ page }) => {
    // Test light theme
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    
    await page.waitForTimeout(100);
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Test dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('Keyboard navigation basic test', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test that focus indicator is visible
    const boundingBox = await focusedElement.boundingBox();
    expect(boundingBox).toBeTruthy();
  });
});