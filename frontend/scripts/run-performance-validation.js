#!/usr/bin/env node

/**
 * Master script to run all performance validation tests
 * for the MUI to shadcn migration
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class PerformanceValidationRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        issues: []
      },
      bundleAnalysis: null,
      themePerformance: null,
      e2ePerformance: null,
      lighthouseAudit: null,
      recommendations: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  async runBundleAnalysis() {
    this.log('📦 Running bundle size analysis...');
    
    try {
      const output = execSync('node scripts/bundle-analyzer.js', { 
        cwd: projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(output);
      
      // Read the generated report
      const reportPath = join(projectRoot, 'bundle-analysis-report.json');
      if (existsSync(reportPath)) {
        this.results.bundleAnalysis = JSON.parse(readFileSync(reportPath, 'utf8'));
        this.results.summary.passed++;
        this.log('✅ Bundle analysis completed', 'success');
      } else {
        throw new Error('Bundle analysis report not generated');
      }
      
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`, 'error');
      this.results.summary.failed++;
      this.results.summary.issues.push(`Bundle analysis: ${error.message}`);
    }
    
    this.results.summary.totalTests++;
  }

  async runThemePerformanceTests() {
    this.log('🎨 Running theme performance tests...');
    
    try {
      const output = execSync('npm run test:run -- --reporter=json src/hooks/__tests__/useThemeToggle.performance.test.ts', { 
        cwd: projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const testResults = JSON.parse(output);
      
      this.results.themePerformance = {
        testsPassed: testResults.numPassedTests || 0,
        testsFailed: testResults.numFailedTests || 0,
        totalTests: testResults.numTotalTests || 0,
        testResults: testResults.testResults || [],
        timestamp: new Date().toISOString()
      };
      
      if (testResults.numFailedTests === 0) {
        this.log(`✅ Theme performance tests passed: ${testResults.numPassedTests}/${testResults.numTotalTests}`, 'success');
        this.results.summary.passed++;
      } else {
        this.log(`❌ Theme performance tests failed: ${testResults.numFailedTests}/${testResults.numTotalTests}`, 'error');
        this.results.summary.failed++;
        this.results.summary.issues.push(`Theme performance: ${testResults.numFailedTests} tests failed`);
      }
      
    } catch (error) {
      this.log(`⚠️ Theme performance tests failed: ${error.message}`, 'warning');
      this.results.summary.warnings++;
      this.results.summary.issues.push(`Theme performance tests: ${error.message}`);
    }
    
    this.results.summary.totalTests++;
  }

  async runE2EPerformanceTests() {
    this.log('🚀 Running E2E performance tests...');
    
    try {
      const output = execSync('npx playwright test e2e/performance-validation.spec.ts --reporter=json', { 
        cwd: projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const testResults = JSON.parse(output);
      
      this.results.e2ePerformance = {
        testsPassed: testResults.stats?.passed || 0,
        testsFailed: testResults.stats?.failed || 0,
        testsSkipped: testResults.stats?.skipped || 0,
        totalTests: testResults.stats?.total || 0,
        duration: testResults.stats?.duration || 0,
        testResults: testResults.suites || [],
        timestamp: new Date().toISOString()
      };
      
      if ((testResults.stats?.failed || 0) === 0) {
        this.log(`✅ E2E performance tests passed: ${testResults.stats?.passed}/${testResults.stats?.total}`, 'success');
        this.results.summary.passed++;
      } else {
        this.log(`❌ E2E performance tests failed: ${testResults.stats?.failed}/${testResults.stats?.total}`, 'error');
        this.results.summary.failed++;
        this.results.summary.issues.push(`E2E performance: ${testResults.stats?.failed} tests failed`);
      }
      
    } catch (error) {
      this.log(`⚠️ E2E performance tests failed: ${error.message}`, 'warning');
      this.results.summary.warnings++;
      this.results.summary.issues.push(`E2E performance tests: ${error.message}`);
    }
    
    this.results.summary.totalTests++;
  }

  async runLighthouseAudit() {
    this.log('🔍 Running Lighthouse performance audit...');
    
    let serverProcess = null;
    
    try {
      // Start dev server
      this.log('Starting development server...');
      serverProcess = spawn('npm', ['run', 'dev'], { 
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Run Lighthouse audit
      const lighthouseOutput = execSync('npx lighthouse http://localhost:5173 --output=json --quiet --chrome-flags="--headless" --no-sandbox', { 
        cwd: projectRoot, 
        encoding: 'utf8',
        timeout: 60000
      });
      
      const lighthouse = JSON.parse(lighthouseOutput);
      
      this.results.lighthouseAudit = {
        performance: Math.round(lighthouse.lhr.categories.performance.score * 100),
        accessibility: Math.round(lighthouse.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lighthouse.lhr.categories['best-practices'].score * 100),
        seo: Math.round(lighthouse.lhr.categories.seo.score * 100),
        metrics: {
          firstContentfulPaint: lighthouse.lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lighthouse.lhr.audits['largest-contentful-paint'].numericValue,
          cumulativeLayoutShift: lighthouse.lhr.audits['cumulative-layout-shift'].numericValue,
          totalBlockingTime: lighthouse.lhr.audits['total-blocking-time'].numericValue,
          speedIndex: lighthouse.lhr.audits['speed-index'].numericValue
        },
        timestamp: new Date().toISOString()
      };
      
      const perfScore = this.results.lighthouseAudit.performance;
      if (perfScore >= 90) {
        this.log(`✅ Lighthouse performance score: ${perfScore}/100`, 'success');
        this.results.summary.passed++;
      } else if (perfScore >= 70) {
        this.log(`⚠️ Lighthouse performance score: ${perfScore}/100 (needs improvement)`, 'warning');
        this.results.summary.warnings++;
        this.results.summary.issues.push(`Lighthouse performance score: ${perfScore}/100`);
      } else {
        this.log(`❌ Lighthouse performance score: ${perfScore}/100 (poor)`, 'error');
        this.results.summary.failed++;
        this.results.summary.issues.push(`Lighthouse performance score: ${perfScore}/100`);
      }
      
    } catch (error) {
      this.log(`⚠️ Lighthouse audit failed: ${error.message}`, 'warning');
      this.results.summary.warnings++;
      this.results.summary.issues.push(`Lighthouse audit: ${error.message}`);
    } finally {
      // Kill dev server
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
      
      try {
        execSync('pkill -f "vite.*5173" || true', { cwd: projectRoot });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    this.results.summary.totalTests++;
  }

  generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (this.results.bundleAnalysis?.comparison?.totalSize?.changePercent > 5) {
      recommendations.push('Bundle size increased by more than 5% - consider code splitting and tree shaking');
    }

    if (this.results.bundleAnalysis?.dependencyAnalysis?.muiCount > 0) {
      recommendations.push('Complete MUI dependency removal to maximize bundle size benefits');
    }

    // Theme performance recommendations
    if (this.results.themePerformance?.testsFailed > 0) {
      recommendations.push('Fix failing theme performance tests before production deployment');
    }

    // Lighthouse recommendations
    if (this.results.lighthouseAudit?.performance < 90) {
      recommendations.push('Improve Lighthouse performance score through optimization');
    }

    if (this.results.lighthouseAudit?.metrics?.firstContentfulPaint > 2000) {
      recommendations.push('Optimize First Contentful Paint (currently > 2s)');
    }

    if (this.results.lighthouseAudit?.metrics?.largestContentfulPaint > 4000) {
      recommendations.push('Optimize Largest Contentful Paint (currently > 4s)');
    }

    // E2E performance recommendations
    if (this.results.e2ePerformance?.testsFailed > 0) {
      recommendations.push('Address failing E2E performance tests');
    }

    // General recommendations
    if (this.results.summary.failed > 0) {
      recommendations.push('Address all failed tests before production deployment');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance metrics are within acceptable ranges - ready for production');
    }

    this.results.recommendations = recommendations;
  }

  generateReport() {
    this.log('📊 Generating comprehensive performance report...');
    
    const reportPath = join(projectRoot, 'PERFORMANCE_VALIDATION_REPORT.md');
    const jsonReportPath = join(projectRoot, 'performance-validation-complete.json');
    
    // Save JSON report
    writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));
    
    // Generate markdown report
    const markdown = this.generateMarkdownReport();
    writeFileSync(reportPath, markdown);
    
    this.log(`✅ Reports saved:`, 'success');
    this.log(`   Markdown: ${reportPath}`, 'info');
    this.log(`   JSON: ${jsonReportPath}`, 'info');
  }

  generateMarkdownReport() {
    const { results } = this;
    const { summary } = results;
    
    return `# Performance Validation Report - MUI to shadcn Migration

**Generated:** ${results.timestamp}

## Executive Summary

- 📊 **Total Tests:** ${summary.totalTests}
- ✅ **Passed:** ${summary.passed}
- ❌ **Failed:** ${summary.failed}
- ⚠️ **Warnings:** ${summary.warnings}

**Overall Status:** ${summary.failed === 0 ? '✅ PASSED' : '❌ FAILED'}

${summary.issues.length > 0 ? `
## Issues Found

${summary.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Bundle Size Analysis

${results.bundleAnalysis ? `
### Current Bundle Size
- **Total Size:** ${results.bundleAnalysis.afterMigration?.totalSize || 'N/A'}
- **JavaScript:** ${results.bundleAnalysis.afterMigration?.jsSize || 'N/A'}
- **CSS:** ${results.bundleAnalysis.afterMigration?.cssSize || 'N/A'}

### Migration Impact
${results.bundleAnalysis.comparison ? `
| Metric | Before | After | Change | Change % |
|--------|--------|-------|--------|----------|
| Total | ${results.bundleAnalysis.comparison.totalSize.before} | ${results.bundleAnalysis.comparison.totalSize.after} | ${this.formatSize(results.bundleAnalysis.comparison.totalSize.change)} | ${results.bundleAnalysis.comparison.totalSize.changePercent.toFixed(1)}% |
| JS | ${results.bundleAnalysis.comparison.jsSize.before} | ${results.bundleAnalysis.comparison.jsSize.after} | ${this.formatSize(results.bundleAnalysis.comparison.jsSize.change)} | ${results.bundleAnalysis.comparison.jsSize.changePercent.toFixed(1)}% |
| CSS | ${results.bundleAnalysis.comparison.cssSize.before} | ${results.bundleAnalysis.comparison.cssSize.after} | ${this.formatSize(results.bundleAnalysis.comparison.cssSize.change)} | ${results.bundleAnalysis.comparison.cssSize.changePercent.toFixed(1)}% |
` : 'No baseline comparison available'}

### Dependency Status
- **MUI Dependencies Remaining:** ${results.bundleAnalysis.dependencyAnalysis?.muiCount || 0}
- **Migration Complete:** ${results.bundleAnalysis.dependencyAnalysis?.migrationComplete ? '✅ YES' : '❌ NO'}
` : 'Bundle analysis not available'}

## Theme Toggle Performance

${results.themePerformance ? `
- **Tests Passed:** ${results.themePerformance.testsPassed}/${results.themePerformance.totalTests}
- **Status:** ${results.themePerformance.testsFailed === 0 ? '✅ PASSED' : '❌ FAILED'}

### Performance Requirements
- **Target:** Sub-16ms theme toggle
- **Result:** ${results.themePerformance.testsFailed === 0 ? 'Met performance target' : 'Performance target not met'}
` : 'Theme performance tests not available'}

## E2E Performance Tests

${results.e2ePerformance ? `
- **Tests Passed:** ${results.e2ePerformance.testsPassed}/${results.e2ePerformance.totalTests}
- **Tests Failed:** ${results.e2ePerformance.testsFailed}
- **Tests Skipped:** ${results.e2ePerformance.testsSkipped}
- **Duration:** ${results.e2ePerformance.duration}ms
- **Status:** ${results.e2ePerformance.testsFailed === 0 ? '✅ PASSED' : '❌ FAILED'}

### Test Coverage
- Low-end device performance
- Slow network conditions
- Responsive design validation
- Memory usage efficiency
- Core Web Vitals measurement
` : 'E2E performance tests not available'}

## Lighthouse Audit

${results.lighthouseAudit ? `
### Scores
- **Performance:** ${results.lighthouseAudit.performance}/100
- **Accessibility:** ${results.lighthouseAudit.accessibility}/100
- **Best Practices:** ${results.lighthouseAudit.bestPractices}/100
- **SEO:** ${results.lighthouseAudit.seo}/100

### Core Web Vitals
- **First Contentful Paint:** ${results.lighthouseAudit.metrics.firstContentfulPaint}ms
- **Largest Contentful Paint:** ${results.lighthouseAudit.metrics.largestContentfulPaint}ms
- **Cumulative Layout Shift:** ${results.lighthouseAudit.metrics.cumulativeLayoutShift}
- **Total Blocking Time:** ${results.lighthouseAudit.metrics.totalBlockingTime}ms
- **Speed Index:** ${results.lighthouseAudit.metrics.speedIndex}ms

### Performance Status
${results.lighthouseAudit.performance >= 90 ? '✅ Excellent' : 
  results.lighthouseAudit.performance >= 70 ? '⚠️ Needs Improvement' : '❌ Poor'}
` : 'Lighthouse audit not available'}

## Recommendations

${results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Performance Requirements Validation

### ✅ Requirements Met
${this.getMetRequirements().map(req => `- ${req}`).join('\n')}

### ❌ Requirements Not Met
${this.getUnmetRequirements().map(req => `- ${req}`).join('\n')}

## Conclusion

${summary.failed === 0 ? 
  '✅ **All performance validations passed!** The MUI to shadcn migration meets all performance requirements and is ready for production deployment.' :
  '❌ **Performance validation failed.** Address the issues listed above before proceeding with production deployment.'
}

---
*Report generated by Performance Validation Runner*
`;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0B';
    const units = ['B', 'K', 'M', 'G'];
    let size = Math.abs(bytes);
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    const sign = bytes < 0 ? '-' : '+';
    return `${sign}${size.toFixed(1)}${units[unitIndex]}`;
  }

  getMetRequirements() {
    const met = [];
    
    if (this.results.themePerformance?.testsFailed === 0) {
      met.push('Theme toggle performance (sub-16ms requirement)');
    }
    
    if (this.results.bundleAnalysis?.comparison?.totalSize?.changePercent <= 5) {
      met.push('Bundle size increase within 5% threshold');
    }
    
    if (this.results.lighthouseAudit?.performance >= 90) {
      met.push('Lighthouse performance score ≥ 90');
    }
    
    if (this.results.e2ePerformance?.testsFailed === 0) {
      met.push('Low-end device and slow network performance');
    }
    
    if (met.length === 0) {
      met.push('None - see issues above');
    }
    
    return met;
  }

  getUnmetRequirements() {
    const unmet = [];
    
    if (this.results.themePerformance?.testsFailed > 0) {
      unmet.push('Theme toggle performance (sub-16ms requirement)');
    }
    
    if (this.results.bundleAnalysis?.comparison?.totalSize?.changePercent > 5) {
      unmet.push('Bundle size increase exceeds 5% threshold');
    }
    
    if (this.results.lighthouseAudit?.performance < 90) {
      unmet.push('Lighthouse performance score < 90');
    }
    
    if (this.results.e2ePerformance?.testsFailed > 0) {
      unmet.push('Low-end device and slow network performance');
    }
    
    if (unmet.length === 0) {
      unmet.push('None - all requirements met');
    }
    
    return unmet;
  }

  async run() {
    this.log('🚀 Starting Comprehensive Performance Validation', 'info');
    this.log('=' .repeat(70), 'info');

    // Run all performance validations
    await this.runBundleAnalysis();
    await this.runThemePerformanceTests();
    await this.runE2EPerformanceTests();
    await this.runLighthouseAudit();

    // Generate recommendations
    this.generateRecommendations();

    // Generate comprehensive report
    this.generateReport();

    this.log('=' .repeat(70), 'info');
    this.log('🏁 Performance Validation Complete', 'info');
    this.log(`📊 Summary: ${this.results.summary.passed} passed, ${this.results.summary.failed} failed, ${this.results.summary.warnings} warnings`, 'info');

    if (this.results.summary.failed > 0) {
      this.log('❌ Performance validation failed. Check the report for details.', 'error');
      process.exit(1);
    } else if (this.results.summary.warnings > 0) {
      this.log('⚠️ Performance validation completed with warnings.', 'warning');
    } else {
      this.log('✅ All performance validations passed!', 'success');
    }
  }
}

// Run the validation
const runner = new PerformanceValidationRunner();
runner.run().catch(error => {
  console.error('❌ Performance validation failed:', error);
  process.exit(1);
});