/**
 * Playwright Configuration for Visual Regression Testing
 * Optimized for theme switching and visual consistency tests
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  
  // Global test timeout
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    // Visual comparison threshold
    threshold: 0.2, // 20% difference threshold
    // Screenshot comparison mode
    mode: 'strict',
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'visual-test-results' }],
    ['json', { outputFile: 'visual-test-results/results.json' }],
    ['junit', { outputFile: 'visual-test-results/junit.xml' }],
  ],
  
  // Global test settings
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Browser settings
    headless: true,
    
    // Screenshot settings
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video recording
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },
    
    // Trace collection
    trace: 'retain-on-failure',
    
    // Disable animations for consistent screenshots
    reducedMotion: 'reduce',
    
    // Color scheme
    colorScheme: 'light',
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'America/New_York',
  },

  // Test projects for different browsers and viewports
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1366, height: 768 },
      },
    },
    
    // High-resolution desktop
    {
      name: 'chromium-desktop-2x',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      },
    },
    
    // Tablet devices
    {
      name: 'tablet-portrait',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'tablet-landscape',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 },
      },
    },
    
    // Mobile devices
    {
      name: 'mobile-portrait',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 12 landscape'],
        viewport: { width: 667, height: 375 },
      },
    },
    
    // Theme-specific projects
    {
      name: 'dark-theme-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'light-theme-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        colorScheme: 'light',
      },
    },
  ],

  // Development server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/visual/global-setup.ts'),
  globalTeardown: require.resolve('./tests/visual/global-teardown.ts'),
});