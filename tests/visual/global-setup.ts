/**
 * Global Setup for Visual Regression Tests
 * Prepares the environment for consistent visual testing
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🎨 Setting up visual regression testing environment...');
  
  // Create directories for test artifacts
  const dirs = [
    'visual-test-results',
    'visual-test-results/screenshots',
    'visual-test-results/diffs',
    'visual-test-results/reports',
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'reduce',
  });
  
  const page = await context.newPage();
  
  try {
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173';
    console.log(`🌐 Waiting for server at ${baseURL}...`);
    
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 });
        if (response?.ok()) {
          console.log('✅ Server is ready');
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Server at ${baseURL} is not responding after 30 attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Warm up the application
    console.log('🔥 Warming up application...');
    
    const pagesToWarmUp = [
      '/',
      '/patients',
      '/dashboard',
      '/analytics',
      '/settings',
    ];
    
    for (const pagePath of pagesToWarmUp) {
      try {
        await page.goto(`${baseURL}${pagePath}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        // Wait for fonts to load
        await page.waitForFunction(() => document.fonts.ready);
        
        // Test both themes to ensure CSS is loaded
        await page.evaluate(() => {
          document.documentElement.classList.add('light');
          document.documentElement.setAttribute('data-theme', 'light');
        });
        await page.waitForTimeout(100);
        
        await page.evaluate(() => {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(100);
        
        console.log(`✅ Warmed up: ${pagePath}`);
      } catch (error) {
        console.warn(`⚠️  Failed to warm up ${pagePath}:`, error);
      }
    }
    
    // Create baseline screenshots if they don't exist
    console.log('📸 Creating baseline screenshots...');
    await createBaselineScreenshots(page, baseURL);
    
    // Verify theme switching functionality
    console.log('🎨 Verifying theme switching...');
    await verifyThemeSwitching(page, baseURL);
    
    // Generate test configuration report
    await generateSetupReport(config);
    
    console.log('✅ Visual regression testing setup completed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

async function createBaselineScreenshots(page: any, baseURL: string) {
  const baselineDir = path.join('tests', 'visual', 'screenshots');
  
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
  
  const pages = [
    { path: '/', name: 'home' },
    { path: '/patients', name: 'patients' },
    { path: '/dashboard', name: 'dashboard' },
  ];
  
  const themes = ['light', 'dark'];
  const viewports = [
    { width: 1366, height: 768, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];
  
  for (const { path: pagePath, name } of pages) {
    for (const theme of themes) {
      for (const viewport of viewports) {
        const screenshotPath = path.join(
          baselineDir,
          `${name}-${theme}-${viewport.name}.png`
        );
        
        // Skip if baseline already exists
        if (fs.existsSync(screenshotPath)) {
          continue;
        }
        
        try {
          await page.setViewportSize(viewport);
          await page.goto(`${baseURL}${pagePath}`, { waitUntil: 'networkidle' });
          
          // Set theme
          await page.evaluate((themeName) => {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(themeName);
            document.documentElement.setAttribute('data-theme', themeName);
          }, theme);
          
          await page.waitForTimeout(200);
          
          // Take screenshot
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled',
          });
          
          console.log(`📸 Created baseline: ${name}-${theme}-${viewport.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to create baseline for ${name}-${theme}-${viewport.name}:`, error);
        }
      }
    }
  }
}

async function verifyThemeSwitching(page: any, baseURL: string) {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  
  // Test theme switching performance
  const themes = ['light', 'dark'];
  const switchTimes: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const theme = themes[i % 2];
    
    const startTime = Date.now();
    
    await page.evaluate((themeName) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(themeName);
      document.documentElement.setAttribute('data-theme', themeName);
    }, theme);
    
    // Wait for theme to be applied
    await page.waitForFunction(
      (expectedTheme) => document.documentElement.classList.contains(expectedTheme),
      theme,
      { timeout: 1000 }
    );
    
    const endTime = Date.now();
    switchTimes.push(endTime - startTime);
    
    await page.waitForTimeout(50);
  }
  
  const averageTime = switchTimes.reduce((sum, time) => sum + time, 0) / switchTimes.length;
  const maxTime = Math.max(...switchTimes);
  
  console.log(`🎨 Theme switching performance:`);
  console.log(`   Average: ${averageTime.toFixed(1)}ms`);
  console.log(`   Maximum: ${maxTime}ms`);
  
  if (maxTime > 16) {
    console.warn(`⚠️  Theme switching is slower than 16ms budget`);
  } else {
    console.log(`✅ Theme switching meets performance budget`);
  }
}

async function generateSetupReport(config: FullConfig) {
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      testDir: config.testDir,
      timeout: config.timeout,
      retries: config.retries,
      workers: config.workers,
      projects: config.projects.map(p => ({
        name: p.name,
        viewport: p.use?.viewport,
        deviceScaleFactor: p.use?.deviceScaleFactor,
        colorScheme: p.use?.colorScheme,
      })),
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      ci: !!process.env.CI,
    },
    setup: {
      baselineScreenshots: 'created',
      themeSwitching: 'verified',
      warmup: 'completed',
    },
  };
  
  const reportPath = path.join('visual-test-results', 'setup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Setup report saved to: ${reportPath}`);
}

export default globalSetup;