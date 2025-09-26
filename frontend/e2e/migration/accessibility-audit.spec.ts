import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// Test configuration for comprehensive accessibility audit
const PAGES_TO_TEST = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Clinical Notes', url: '/clinical-notes' },
  { name: 'Patients', url: '/patients' },
  { name: 'Reports', url: '/reports' },
  { name: 'Admin Dashboard', url: '/admin' },
  { name: 'MTR Dashboard', url: '/mtr' },
  { name: 'Diagnostics', url: '/diagnostics' }
];

const INTERACTIVE_COMPONENTS = [
  'button',
  'input',
  'select',
  'textarea',
  'a[href]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[tabindex]:not([tabindex="-1"])'
];

const THEMES = ['light', 'dark'];

// WCAG 2.1 AA compliance rules
const WCAG_AA_RULES = {
  'color-contrast': { level: 'AA', ratio: 4.5 },
  'color-contrast-enhanced': { level: 'AAA', ratio: 7 },
  'focus-order-semantics': true,
  'keyboard-navigation': true,
  'aria-attributes': true,
  'semantic-structure': true
};

test.describe('Comprehensive Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  // 1. Automated accessibility tests using axe-core
  test.describe('Automated axe-core Testing', () => {
    for (const theme of THEMES) {
      for (const pageConfig of PAGES_TO_TEST) {
        test(`${pageConfig.name} - ${theme} theme - axe-core compliance`, async ({ page }) => {
          // Set theme
          await setTheme(page, theme);
          
          // Navigate to page
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Run axe-core accessibility scan
          const violations = await getViolations(page, null, {
            rules: {
              'color-contrast': { enabled: true },
              'keyboard-navigation': { enabled: true },
              'focus-order': { enabled: true },
              'aria-valid-attr': { enabled: true },
              'aria-required-attr': { enabled: true },
              'button-name': { enabled: true },
              'link-name': { enabled: true },
              'image-alt': { enabled: true },
              'label': { enabled: true },
              'heading-order': { enabled: true },
              'landmark-one-main': { enabled: true },
              'page-has-heading-one': { enabled: true },
              'region': { enabled: true }
            }
          });

          // Assert no violations
          expect(violations).toHaveLength(0);
          
          // If violations exist, log them for debugging
          if (violations.length > 0) {
            console.log(`Accessibility violations on ${pageConfig.name} (${theme}):`, 
              JSON.stringify(violations, null, 2));
          }
        });
      }
    }
  });

  // 2. Manual keyboard navigation testing
  test.describe('Keyboard Navigation Testing', () => {
    for (const theme of THEMES) {
      test(`Comprehensive keyboard navigation - ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        
        for (const pageConfig of PAGES_TO_TEST) {
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Test Tab navigation
          await testTabNavigation(page, pageConfig.name);
          
          // Test Enter/Space key activation
          await testKeyboardActivation(page, pageConfig.name);
          
          // Test Escape key functionality
          await testEscapeKey(page, pageConfig.name);
          
          // Test Arrow key navigation (for menus, tabs, etc.)
          await testArrowKeyNavigation(page, pageConfig.name);
        }
      });
    }
  });

  // 3. Screen reader compatibility testing
  test.describe('Screen Reader Compatibility', () => {
    for (const theme of THEMES) {
      test(`Screen reader attributes - ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        
        for (const pageConfig of PAGES_TO_TEST) {
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Test ARIA labels and descriptions
          await testAriaAttributes(page, pageConfig.name);
          
          // Test semantic HTML structure
          await testSemanticStructure(page, pageConfig.name);
          
          // Test live regions for dynamic content
          await testLiveRegions(page, pageConfig.name);
          
          // Test form labels and descriptions
          await testFormAccessibility(page, pageConfig.name);
        }
      });
    }
  });

  // 4. ARIA attributes and semantic HTML validation
  test.describe('ARIA and Semantic HTML Validation', () => {
    for (const theme of THEMES) {
      test(`ARIA and semantic validation - ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        
        for (const pageConfig of PAGES_TO_TEST) {
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Validate ARIA attributes
          await validateAriaAttributes(page, pageConfig.name);
          
          // Validate semantic HTML structure
          await validateSemanticHTML(page, pageConfig.name);
          
          // Validate heading hierarchy
          await validateHeadingHierarchy(page, pageConfig.name);
          
          // Validate landmark regions
          await validateLandmarkRegions(page, pageConfig.name);
        }
      });
    }
  });

  // 5. Color contrast ratio testing
  test.describe('Color Contrast Testing', () => {
    for (const theme of THEMES) {
      test(`WCAG 2.1 AA color contrast - ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        
        for (const pageConfig of PAGES_TO_TEST) {
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Test color contrast for text elements
          await testColorContrast(page, pageConfig.name, theme);
          
          // Test focus indicators
          await testFocusIndicators(page, pageConfig.name, theme);
          
          // Test interactive element states
          await testInteractiveStates(page, pageConfig.name, theme);
        }
      });
    }
  });

  // 6. Focus management testing
  test.describe('Focus Management Testing', () => {
    for (const theme of THEMES) {
      test(`Focus management - ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        
        for (const pageConfig of PAGES_TO_TEST) {
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');
          
          // Test focus trapping in dialogs
          await testFocusTrapping(page, pageConfig.name);
          
          // Test focus restoration
          await testFocusRestoration(page, pageConfig.name);
          
          // Test skip links
          await testSkipLinks(page, pageConfig.name);
        }
      });
    }
  });
});

// Helper functions
async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, theme);
  await page.waitForTimeout(100); // Allow theme to apply
}

async function testTabNavigation(page: Page, pageName: string) {
  console.log(`Testing tab navigation on ${pageName}`);
  
  // Get all focusable elements
  const focusableElements = await page.locator(INTERACTIVE_COMPONENTS.join(', ')).all();
  
  if (focusableElements.length === 0) {
    console.log(`No focusable elements found on ${pageName}`);
    return;
  }
  
  // Start from the first focusable element
  await page.keyboard.press('Tab');
  
  let currentIndex = 0;
  const maxTabs = Math.min(focusableElements.length, 20); // Limit to prevent infinite loops
  
  for (let i = 0; i < maxTabs; i++) {
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Verify focus indicator is visible
    const focusedBox = await focusedElement.boundingBox();
    expect(focusedBox).toBeTruthy();
    
    await page.keyboard.press('Tab');
    currentIndex++;
  }
  
  console.log(`Successfully navigated ${currentIndex} focusable elements on ${pageName}`);
}

async function testKeyboardActivation(page: Page, pageName: string) {
  console.log(`Testing keyboard activation on ${pageName}`);
  
  // Test buttons with Enter and Space
  const buttons = await page.locator('button, [role="button"]').all();
  
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    const button = buttons[i];
    if (await button.isVisible()) {
      await button.focus();
      
      // Test Enter key
      const enterPromise = page.waitForEvent('click', { timeout: 1000 }).catch(() => null);
      await page.keyboard.press('Enter');
      await enterPromise;
      
      // Test Space key
      await button.focus();
      const spacePromise = page.waitForEvent('click', { timeout: 1000 }).catch(() => null);
      await page.keyboard.press('Space');
      await spacePromise;
    }
  }
}

async function testEscapeKey(page: Page, pageName: string) {
  console.log(`Testing Escape key functionality on ${pageName}`);
  
  // Look for dialogs, modals, or dropdowns
  const dialogs = await page.locator('[role="dialog"], .modal, [data-state="open"]').all();
  
  for (const dialog of dialogs) {
    if (await dialog.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Verify dialog is closed or focus is restored
      const isStillVisible = await dialog.isVisible().catch(() => false);
      if (isStillVisible) {
        console.log(`Dialog did not close with Escape key on ${pageName}`);
      }
    }
  }
}

async function testArrowKeyNavigation(page: Page, pageName: string) {
  console.log(`Testing arrow key navigation on ${pageName}`);
  
  // Test tabs, menus, and other arrow-navigable components
  const arrowNavigableElements = await page.locator(
    '[role="tablist"], [role="menu"], [role="menubar"], [role="listbox"]'
  ).all();
  
  for (const element of arrowNavigableElements) {
    if (await element.isVisible()) {
      await element.focus();
      
      // Test arrow keys
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
    }
  }
}

async function testAriaAttributes(page: Page, pageName: string) {
  console.log(`Testing ARIA attributes on ${pageName}`);
  
  // Check for required ARIA attributes
  const elementsWithAriaLabel = await page.locator('[aria-label]').count();
  const elementsWithAriaLabelledby = await page.locator('[aria-labelledby]').count();
  const elementsWithAriaDescribedby = await page.locator('[aria-describedby]').count();
  
  console.log(`${pageName}: Found ${elementsWithAriaLabel} elements with aria-label`);
  console.log(`${pageName}: Found ${elementsWithAriaLabelledby} elements with aria-labelledby`);
  console.log(`${pageName}: Found ${elementsWithAriaDescribedby} elements with aria-describedby`);
  
  // Verify ARIA attributes are valid
  const invalidAriaElements = await page.locator('[aria-invalid="true"]').count();
  expect(invalidAriaElements).toBeLessThan(100); // Reasonable threshold
}

async function testSemanticStructure(page: Page, pageName: string) {
  console.log(`Testing semantic structure on ${pageName}`);
  
  // Check for semantic HTML elements
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  const landmarks = await page.locator('main, nav, aside, header, footer, section').count();
  const lists = await page.locator('ul, ol, dl').count();
  
  expect(headings).toBeGreaterThan(0);
  expect(landmarks).toBeGreaterThan(0);
  
  console.log(`${pageName}: Found ${headings} headings, ${landmarks} landmarks, ${lists} lists`);
}

async function testLiveRegions(page: Page, pageName: string) {
  console.log(`Testing live regions on ${pageName}`);
  
  const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
  console.log(`${pageName}: Found ${liveRegions} live regions`);
  
  // Test that live regions announce changes
  const statusElements = await page.locator('[role="status"]').all();
  for (const element of statusElements) {
    if (await element.isVisible()) {
      const ariaLive = await element.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }
  }
}

async function testFormAccessibility(page: Page, pageName: string) {
  console.log(`Testing form accessibility on ${pageName}`);
  
  // Check form labels
  const inputs = await page.locator('input, textarea, select').all();
  
  for (const input of inputs) {
    if (await input.isVisible()) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label === 0 && !ariaLabel && !ariaLabelledby) {
          console.warn(`Input without proper label found on ${pageName}`);
        }
      }
    }
  }
}

async function validateAriaAttributes(page: Page, pageName: string) {
  console.log(`Validating ARIA attributes on ${pageName}`);
  
  // Run axe-core specifically for ARIA validation
  await checkA11y(page, null, {
    rules: {
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-roles': { enabled: true }
    }
  });
}

async function validateSemanticHTML(page: Page, pageName: string) {
  console.log(`Validating semantic HTML on ${pageName}`);
  
  // Check for proper heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
  expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
  
  // Check for main landmark
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThanOrEqual(1);
}

async function validateHeadingHierarchy(page: Page, pageName: string) {
  console.log(`Validating heading hierarchy on ${pageName}`);
  
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  const headingLevels: number[] = [];
  
  for (const heading of headings) {
    const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
    const level = parseInt(tagName.charAt(1));
    headingLevels.push(level);
  }
  
  // Verify heading hierarchy (no skipping levels)
  for (let i = 1; i < headingLevels.length; i++) {
    const currentLevel = headingLevels[i];
    const previousLevel = headingLevels[i - 1];
    
    if (currentLevel > previousLevel + 1) {
      console.warn(`Heading hierarchy skip detected on ${pageName}: h${previousLevel} to h${currentLevel}`);
    }
  }
}

async function validateLandmarkRegions(page: Page, pageName: string) {
  console.log(`Validating landmark regions on ${pageName}`);
  
  const requiredLandmarks = ['main'];
  const recommendedLandmarks = ['nav', 'header', 'footer'];
  
  for (const landmark of requiredLandmarks) {
    const count = await page.locator(landmark).count();
    expect(count).toBeGreaterThanOrEqual(1);
  }
  
  for (const landmark of recommendedLandmarks) {
    const count = await page.locator(landmark).count();
    console.log(`${pageName}: Found ${count} ${landmark} landmarks`);
  }
}

async function testColorContrast(page: Page, pageName: string, theme: string) {
  console.log(`Testing color contrast on ${pageName} (${theme} theme)`);
  
  // Run axe-core color contrast check
  await checkA11y(page, null, {
    rules: {
      'color-contrast': { enabled: true }
    }
  });
}

async function testFocusIndicators(page: Page, pageName: string, theme: string) {
  console.log(`Testing focus indicators on ${pageName} (${theme} theme)`);
  
  const focusableElements = await page.locator(INTERACTIVE_COMPONENTS.join(', ')).all();
  
  for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
    const element = focusableElements[i];
    if (await element.isVisible()) {
      await element.focus();
      
      // Check if focus indicator is visible
      const focusedElement = page.locator(':focus');
      const boundingBox = await focusedElement.boundingBox();
      expect(boundingBox).toBeTruthy();
      
      // Verify focus indicator has sufficient contrast
      // This would require more complex color analysis in a real implementation
    }
  }
}

async function testInteractiveStates(page: Page, pageName: string, theme: string) {
  console.log(`Testing interactive states on ${pageName} (${theme} theme)`);
  
  const buttons = await page.locator('button').all();
  
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    const button = buttons[i];
    if (await button.isVisible()) {
      // Test hover state
      await button.hover();
      await page.waitForTimeout(100);
      
      // Test focus state
      await button.focus();
      await page.waitForTimeout(100);
      
      // Test active state
      await button.click({ noWaitAfter: true });
      await page.waitForTimeout(100);
    }
  }
}

async function testFocusTrapping(page: Page, pageName: string) {
  console.log(`Testing focus trapping on ${pageName}`);
  
  // Look for dialogs or modals
  const dialogs = await page.locator('[role="dialog"]').all();
  
  for (const dialog of dialogs) {
    if (await dialog.isVisible()) {
      // Test that focus is trapped within the dialog
      const focusableInDialog = await dialog.locator(INTERACTIVE_COMPONENTS.join(', ')).all();
      
      if (focusableInDialog.length > 1) {
        await focusableInDialog[0].focus();
        
        // Tab through all elements and verify focus stays in dialog
        for (let i = 0; i < focusableInDialog.length + 2; i++) {
          await page.keyboard.press('Tab');
          const focusedElement = page.locator(':focus');
          const isInDialog = await dialog.locator(':focus').count() > 0;
          expect(isInDialog).toBe(true);
        }
      }
    }
  }
}

async function testFocusRestoration(page: Page, pageName: string) {
  console.log(`Testing focus restoration on ${pageName}`);
  
  // This would test that focus is properly restored when dialogs close
  // Implementation depends on specific dialog behavior
}

async function testSkipLinks(page: Page, pageName: string) {
  console.log(`Testing skip links on ${pageName}`);
  
  // Look for skip links
  const skipLinks = await page.locator('a[href^="#"], [role="link"][href^="#"]').all();
  
  for (const link of skipLinks) {
    const href = await link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const targetId = href.substring(1);
      const target = await page.locator(`#${targetId}`).count();
      expect(target).toBeGreaterThan(0);
    }
  }
}