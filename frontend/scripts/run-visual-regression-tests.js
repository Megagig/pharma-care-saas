#!/usr/bin/env node

/**
 * Visual Regression Test Runner for MUI to shadcn/ui Migration
 * 
 * This script runs comprehensive visual regression tests across themes,
 * browsers, and viewports to ensure visual consistency during migration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  browsers: ['chromium', 'firefox', 'webkit'],
  themes: ['light', 'dark'],
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ],
  testFiles: [
    'e2e/migration/visual-regression.spec.ts',
    'e2e/migration/authenticated-visual-regression.spec.ts',
  ],
  outputDir: 'test-results/visual-regression',
  reportFile: 'test-results/visual-regression-report.json',
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

function runCommand(command, options = {}) {
  try {
    log(`Running: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options,
    });
    return { success: true, result };
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    return { success: false, error };
  }
}

function generateReport(testResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      passedTests: testResults.filter(t => t.success).length,
      failedTests: testResults.filter(t => !t.success).length,
      skippedTests: testResults.filter(t => t.skipped).length,
    },
    configuration: CONFIG,
    testResults,
    requirements: [
      '6.3 - Visual regression testing across themes and browsers',
      '6.5 - Responsive design behavior validation',
      '5.1 - Mobile-first responsive design',
      '5.2 - Tailwind breakpoint system',
      '5.3 - Cross-device functionality',
    ],
    recommendations: [],
  };

  // Add recommendations based on results
  if (report.summary.failedTests > 0) {
    report.recommendations.push('Review failed visual regression tests and update baselines if changes are intentional');
  }
  
  if (report.summary.skippedTests > 0) {
    report.recommendations.push('Investigate skipped tests - they may indicate authentication or setup issues');
  }

  return report;
}

async function main() {
  log('Starting Visual Regression Test Suite for MUI to shadcn/ui Migration');
  
  // Ensure output directories exist
  ensureDirectoryExists(CONFIG.outputDir);
  ensureDirectoryExists(path.dirname(CONFIG.reportFile));

  const testResults = [];
  let overallSuccess = true;

  // Check if Playwright is installed
  log('Checking Playwright installation...');
  const playwrightCheck = runCommand('npx playwright --version', { stdio: 'pipe' });
  if (!playwrightCheck.success) {
    log('Playwright not found. Installing...', 'warn');
    const installResult = runCommand('npx playwright install');
    if (!installResult.success) {
      log('Failed to install Playwright', 'error');
      process.exit(1);
    }
  }

  // Start development server
  log('Starting development server...');
  const serverProcess = require('child_process').spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    detached: true,
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 10000));

  try {
    // Run visual regression tests for each browser
    for (const browser of CONFIG.browsers) {
      log(`Running visual regression tests on ${browser}...`);
      
      const testCommand = `npx playwright test ${CONFIG.testFiles.join(' ')} --project=${browser} --reporter=json`;
      const result = runCommand(testCommand, { stdio: 'pipe' });
      
      testResults.push({
        browser,
        success: result.success,
        timestamp: new Date().toISOString(),
        command: testCommand,
        skipped: false,
      });

      if (!result.success) {
        overallSuccess = false;
        log(`Visual regression tests failed on ${browser}`, 'error');
      } else {
        log(`Visual regression tests passed on ${browser}`);
      }
    }

    // Run cross-browser comparison tests
    log('Running cross-browser comparison tests...');
    const crossBrowserCommand = 'npx playwright test e2e/migration/visual-regression.spec.ts --grep "Cross-Browser"';
    const crossBrowserResult = runCommand(crossBrowserCommand, { stdio: 'pipe' });
    
    testResults.push({
      browser: 'cross-browser',
      success: crossBrowserResult.success,
      timestamp: new Date().toISOString(),
      command: crossBrowserCommand,
      skipped: false,
    });

    // Generate HTML report
    log('Generating HTML report...');
    runCommand('npx playwright show-report');

    // Generate custom JSON report
    const report = generateReport(testResults);
    fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
    log(`Visual regression report saved to: ${CONFIG.reportFile}`);

    // Print summary
    log('\n=== Visual Regression Test Summary ===');
    log(`Total Tests: ${report.summary.totalTests}`);
    log(`Passed: ${report.summary.passedTests}`);
    log(`Failed: ${report.summary.failedTests}`);
    log(`Skipped: ${report.summary.skippedTests}`);
    
    if (report.recommendations.length > 0) {
      log('\n=== Recommendations ===');
      report.recommendations.forEach(rec => log(`• ${rec}`));
    }

    // Check for visual differences
    const screenshotDir = 'test-results';
    if (fs.existsSync(screenshotDir)) {
      const screenshots = fs.readdirSync(screenshotDir, { recursive: true })
        .filter(file => file.endsWith('.png'));
      
      log(`\n=== Screenshots Generated ===`);
      log(`Total screenshots: ${screenshots.length}`);
      
      // Look for diff images (indicates visual changes)
      const diffImages = screenshots.filter(file => file.includes('-diff'));
      if (diffImages.length > 0) {
        log(`Visual differences detected: ${diffImages.length} diff images`, 'warn');
        log('Review the diff images to determine if changes are intentional');
      }
    }

  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    overallSuccess = false;
  } finally {
    // Clean up server process
    if (serverProcess && !serverProcess.killed) {
      process.kill(-serverProcess.pid);
      log('Development server stopped');
    }
  }

  // Exit with appropriate code
  if (overallSuccess) {
    log('✅ Visual regression tests completed successfully');
    process.exit(0);
  } else {
    log('❌ Visual regression tests completed with failures', 'error');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, cleaning up...', 'warn');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, cleaning up...', 'warn');
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main, CONFIG };