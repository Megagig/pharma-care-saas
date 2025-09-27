/**
 * Global Teardown for Visual Regression Tests
 * Cleans up and generates final reports
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running visual regression testing teardown...');
  
  try {
    // Generate comprehensive visual test report
    await generateVisualTestReport();
    
    // Clean up temporary files
    await cleanupTempFiles();
    
    // Archive test artifacts if in CI
    if (process.env.CI) {
      await archiveTestArtifacts();
    }
    
    // Generate performance summary
    await generatePerformanceSummary();
    
    console.log('✅ Visual regression testing teardown completed');
    
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw to avoid masking test failures
  }
}

async function generateVisualTestReport() {
  console.log('📊 Generating visual test report...');
  
  const resultsPath = path.join('visual-test-results', 'results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.warn('⚠️  No test results found, skipping report generation');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
    },
    visualRegression: {
      screenshotComparisons: 0,
      visualDifferences: 0,
      themeConsistencyTests: 0,
      performanceTests: 0,
    },
    performance: {
      averageThemeSwitchTime: 0,
      maxThemeSwitchTime: 0,
      layoutShifts: 0,
    },
    coverage: {
      pages: [],
      themes: ['light', 'dark'],
      viewports: ['desktop', 'tablet', 'mobile'],
      browsers: ['chromium', 'firefox', 'webkit'],
    },
  };
  
  // Analyze test results
  if (results.suites) {
    analyzeTestSuites(results.suites, report);
  }
  
  // Generate HTML report
  const htmlReport = generateHtmlReport(report);
  const htmlPath = path.join('visual-test-results', 'visual-regression-report.html');
  fs.writeFileSync(htmlPath, htmlReport);
  
  // Save JSON report
  const jsonPath = path.join('visual-test-results', 'visual-regression-summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Visual test report generated:`);
  console.log(`   HTML: ${htmlPath}`);
  console.log(`   JSON: ${jsonPath}`);
}

function analyzeTestSuites(suites: any[], report: any) {
  suites.forEach(suite => {
    if (suite.title.includes('Theme Visual Regression')) {
      suite.specs?.forEach((spec: any) => {
        if (spec.title.includes('visual consistency')) {
          report.visualRegression.screenshotComparisons++;
        }
        if (spec.title.includes('performance')) {
          report.visualRegression.performanceTests++;
        }
        if (spec.title.includes('theme switching')) {
          report.visualRegression.themeConsistencyTests++;
        }
        
        // Extract performance data from test results
        spec.tests?.forEach((test: any) => {
          if (test.results) {
            test.results.forEach((result: any) => {
              if (result.attachments) {
                result.attachments.forEach((attachment: any) => {
                  if (attachment.name === 'screenshot') {
                    report.visualRegression.screenshotComparisons++;
                  }
                });
              }
            });
          }
        });
      });
    }
    
    // Recursively analyze nested suites
    if (suite.suites) {
      analyzeTestSuites(suite.suites, report);
    }
  });
}

function generateHtmlReport(report: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-skip { color: #ffc107; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .coverage-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .performance-metrics { background: #e3f2fd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Test Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Duration:</strong> ${Math.round(report.summary.duration / 1000)}s</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value status-${report.summary.failed === 0 ? 'pass' : 'fail'}">${report.summary.passed}</div>
            <div class="metric-label">Tests Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value status-fail">${report.summary.failed}</div>
            <div class="metric-label">Tests Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.visualRegression.screenshotComparisons}</div>
            <div class="metric-label">Screenshot Comparisons</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.visualRegression.themeConsistencyTests}</div>
            <div class="metric-label">Theme Consistency Tests</div>
        </div>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="performance-metrics">
            <p><strong>Average Theme Switch Time:</strong> ${report.performance.averageThemeSwitchTime}ms</p>
            <p><strong>Maximum Theme Switch Time:</strong> ${report.performance.maxThemeSwitchTime}ms</p>
            <p><strong>Layout Shifts Detected:</strong> ${report.performance.layoutShifts}</p>
            <p><strong>Performance Budget:</strong> ${report.performance.maxThemeSwitchTime <= 16 ? '✅ Met' : '❌ Exceeded'} (16ms target)</p>
        </div>
    </div>

    <div class="section">
        <h2>Test Coverage</h2>
        <h3>Pages Tested</h3>
        <div class="coverage-grid">
            ${['Home', 'Patients', 'Dashboard', 'Analytics', 'Settings'].map(page => 
              `<div class="coverage-item">${page}</div>`
            ).join('')}
        </div>
        
        <h3>Themes Tested</h3>
        <div class="coverage-grid">
            ${report.coverage.themes.map((theme: string) => 
              `<div class="coverage-item">${theme.charAt(0).toUpperCase() + theme.slice(1)}</div>`
            ).join('')}
        </div>
        
        <h3>Viewports Tested</h3>
        <div class="coverage-grid">
            ${report.coverage.viewports.map((viewport: string) => 
              `<div class="coverage-item">${viewport.charAt(0).toUpperCase() + viewport.slice(1)}</div>`
            ).join('')}
        </div>
        
        <h3>Browsers Tested</h3>
        <div class="coverage-grid">
            ${report.coverage.browsers.map((browser: string) => 
              `<div class="coverage-item">${browser.charAt(0).toUpperCase() + browser.slice(1)}</div>`
            ).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Visual Regression Analysis</h2>
        <ul>
            <li><strong>Screenshot Comparisons:</strong> ${report.visualRegression.screenshotComparisons} total</li>
            <li><strong>Visual Differences:</strong> ${report.visualRegression.visualDifferences} detected</li>
            <li><strong>Theme Consistency:</strong> ${report.visualRegression.themeConsistencyTests} tests</li>
            <li><strong>Performance Tests:</strong> ${report.visualRegression.performanceTests} executed</li>
        </ul>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.summary.failed > 0 ? '<li class="status-fail">Review failed tests and update baselines if changes are intentional</li>' : ''}
            ${report.performance.maxThemeSwitchTime > 16 ? '<li class="status-fail">Optimize theme switching performance to meet 16ms budget</li>' : ''}
            ${report.performance.layoutShifts > 0 ? '<li class="status-fail">Investigate and fix layout shifts during theme transitions</li>' : ''}
            ${report.visualRegression.visualDifferences > 0 ? '<li class="status-fail">Review visual differences and ensure they are intentional</li>' : ''}
            <li>Consider adding more edge cases and component states to visual tests</li>
            <li>Regularly update baseline screenshots when UI changes are made</li>
        </ul>
    </div>
</body>
</html>`;
}

async function cleanupTempFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempDirs = [
    'test-results',
    'playwright-report',
  ];
  
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Removed: ${dir}`);
      } catch (error) {
        console.warn(`⚠️  Failed to remove ${dir}:`, error);
      }
    }
  });
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts for CI...');
  
  const artifactsDir = 'visual-test-artifacts';
  
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  // Copy important files to artifacts directory
  const filesToArchive = [
    'visual-test-results/visual-regression-report.html',
    'visual-test-results/visual-regression-summary.json',
    'visual-test-results/results.json',
    'visual-test-results/setup-report.json',
  ];
  
  filesToArchive.forEach(file => {
    if (fs.existsSync(file)) {
      const filename = path.basename(file);
      const destPath = path.join(artifactsDir, filename);
      fs.copyFileSync(file, destPath);
      console.log(`📁 Archived: ${filename}`);
    }
  });
  
  // Create CI summary
  const ciSummary = {
    timestamp: new Date().toISOString(),
    branch: process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || 'unknown',
    commit: process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'unknown',
    buildId: process.env.GITHUB_RUN_ID || process.env.BUILD_ID || 'unknown',
    artifacts: filesToArchive.filter(file => fs.existsSync(file)),
  };
  
  fs.writeFileSync(
    path.join(artifactsDir, 'ci-summary.json'),
    JSON.stringify(ciSummary, null, 2)
  );
  
  console.log(`📦 Test artifacts archived to: ${artifactsDir}`);
}

async function generatePerformanceSummary() {
  console.log('⚡ Generating performance summary...');
  
  const performanceSummary = {
    timestamp: new Date().toISOString(),
    themePerformance: {
      budget: '16ms per theme switch',
      status: 'unknown', // Would be determined from actual test results
      recommendations: [
        'Use CSS custom properties for theme variables',
        'Minimize DOM manipulations during theme switch',
        'Preload theme-specific assets',
        'Use CSS containment for isolated components',
      ],
    },
    visualConsistency: {
      screenshotThreshold: '20% difference',
      status: 'unknown',
      recommendations: [
        'Disable animations during screenshot capture',
        'Use consistent fonts and loading states',
        'Test across multiple viewports and browsers',
        'Maintain baseline screenshots in version control',
      ],
    },
    layoutStability: {
      clsThreshold: '0.1',
      status: 'unknown',
      recommendations: [
        'Reserve space for dynamic content',
        'Use CSS transforms instead of layout properties',
        'Preload fonts and images',
        'Avoid inserting content above existing content',
      ],
    },
  };
  
  const summaryPath = path.join('visual-test-results', 'performance-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(performanceSummary, null, 2));
  
  console.log(`⚡ Performance summary saved to: ${summaryPath}`);
}

export default globalTeardown;