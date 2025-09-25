import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests for MUI to shadcn/ui migration
 * 
 * These tests ensure that accessibility is maintained or improved
 * during the migration from MUI to shadcn/ui components.
 */

test.describe('Migration Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass axe accessibility tests in light theme', async ({ page }) => {
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      
      await page.waitForTimeout(500);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass axe accessibility tests in dark theme', async ({ page }) => {
      // Ensure dark theme is active
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      await page.waitForTimeout(500);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should maintain color contrast ratios', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through interactive elements', async ({ page }) => {
      // Find all interactive elements
      const interactiveElements = await page.locator(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      ).all();
      
      if (interactiveElements.length > 0) {
        // Start from the first element
        await page.keyboard.press('Tab');
        
        // Navigate through all interactive elements
        for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
          const focusedElement = await page.locator(':focus').first();
          
          // Verify element is visible and focusable
          await expect(focusedElement).toBeVisible();
          
          // Move to next element
          await page.keyboard.press('Tab');
        }
      }
    });

    test('should support reverse tab navigation', async ({ page }) => {
      const interactiveElements = await page.locator(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      ).all();
      
      if (interactiveElements.length > 1) {
        // Navigate to the last element first
        for (let i = 0; i < interactiveElements.length; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Then navigate backwards
        await page.keyboard.press('Shift+Tab');
        
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should handle Enter and Space key activation', async ({ page }) => {
      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        if (await button.isVisible()) {
          await button.focus();
          
          // Test Enter key activation
          const buttonText = await button.textContent();
          await page.keyboard.press('Enter');
          
          // Verify button is still focusable after activation
          await expect(button).toBeFocused();
          
          // Test Space key activation
          await page.keyboard.press('Space');
          await expect(button).toBeFocused();
        }
      }
    });

    test('should handle Escape key for modals and dropdowns', async ({ page }) => {
      // Look for modal triggers or dropdown triggers
      const modalTriggers = await page.locator('[data-testid*="modal"], [data-testid*="dialog"]').all();
      const dropdownTriggers = await page.locator('[data-testid*="dropdown"], [data-testid*="menu"]').all();
      
      // Test modal escape behavior
      for (const trigger of modalTriggers.slice(0, 2)) {
        if (await trigger.isVisible()) {
          await trigger.click();
          await page.waitForTimeout(300);
          
          // Press Escape to close
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          
          // Modal should be closed (adjust selector based on your implementation)
          const modal = page.locator('[role="dialog"]').first();
          if (await modal.isVisible()) {
            await expect(modal).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for proper button roles and labels
      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 5)) {
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();
          
          // Button should have either aria-label or text content
          expect(ariaLabel || textContent?.trim()).toBeTruthy();
        }
      }
      
      // Check for proper input labels
      const inputs = await page.locator('input').all();
      
      for (const input of inputs.slice(0, 5)) {
        if (await input.isVisible()) {
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const id = await input.getAttribute('id');
          
          // Input should have proper labeling
          const hasLabel = ariaLabel || ariaLabelledBy || 
            (id && await page.locator(`label[for="${id}"]`).isVisible());
          
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length > 0) {
        let previousLevel = 0;
        
        for (const heading of headings) {
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const currentLevel = parseInt(tagName.charAt(1));
          
          // Heading levels should not skip (e.g., h1 -> h3)
          if (previousLevel > 0) {
            expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
          }
          
          previousLevel = currentLevel;
        }
      }
    });

    test('should have proper form validation messages', async ({ page }) => {
      const forms = await page.locator('form').all();
      
      for (const form of forms.slice(0, 2)) {
        if (await form.isVisible()) {
          const inputs = await form.locator('input[required]').all();
          
          for (const input of inputs.slice(0, 3)) {
            // Try to submit form with empty required field
            await input.focus();
            await input.fill('');
            
            // Look for validation message
            const inputId = await input.getAttribute('id');
            const ariaDescribedBy = await input.getAttribute('aria-describedby');
            
            if (ariaDescribedBy) {
              const errorMessage = page.locator(`#${ariaDescribedBy}`);
              // Error message should be associated with input
              expect(await errorMessage.isVisible() || await input.getAttribute('aria-invalid')).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      const interactiveElements = await page.locator(
        'button, input, select, textarea, a[href]'
      ).all();
      
      for (const element of interactiveElements.slice(0, 5)) {
        if (await element.isVisible()) {
          await element.focus();
          
          // Check if element has focus styles
          const focusedElement = await page.locator(':focus').first();
          await expect(focusedElement).toBe(element);
          
          // Verify focus is visible (this is a basic check)
          const computedStyle = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth,
              boxShadow: style.boxShadow,
            };
          });
          
          // Element should have some form of focus indicator
          const hasFocusIndicator = 
            computedStyle.outline !== 'none' ||
            computedStyle.outlineWidth !== '0px' ||
            computedStyle.boxShadow !== 'none';
          
          expect(hasFocusIndicator).toBeTruthy();
        }
      }
    });

    test('should trap focus in modals', async ({ page }) => {
      const modalTriggers = await page.locator('[data-testid*="modal"], [data-testid*="dialog"]').all();
      
      for (const trigger of modalTriggers.slice(0, 1)) {
        if (await trigger.isVisible()) {
          await trigger.click();
          await page.waitForTimeout(500);
          
          const modal = page.locator('[role="dialog"]').first();
          
          if (await modal.isVisible()) {
            // Find focusable elements within modal
            const modalFocusableElements = await modal.locator(
              'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            ).all();
            
            if (modalFocusableElements.length > 1) {
              // Focus should be trapped within modal
              await page.keyboard.press('Tab');
              const focusedElement = await page.locator(':focus').first();
              
              // Focused element should be within modal
              const isWithinModal = await modal.locator(':focus').count() > 0;
              expect(isWithinModal).toBeTruthy();
            }
            
            // Close modal
            await page.keyboard.press('Escape');
          }
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have appropriate touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const touchTargets = await page.locator('button, a[href], input, select').all();
      
      for (const target of touchTargets.slice(0, 10)) {
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // Touch targets should be at least 44x44 pixels (WCAG guideline)
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });
});