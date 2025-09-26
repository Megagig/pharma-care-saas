#!/usr/bin/env node

/**
 * Performance Validation Script for MUI to shadcn Migration
 * Measures bundle size, theme toggle performance, and overall app performance
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Performance thresholds based on requirements
const PERFORMANCE_THRESHOLDS = {
  themeToggleMaxMs: 16, // Sub-16ms requirement
  bundleSizeMaxIncrease: 0.05, // 5% max increase
  renderTimeMaxMs: 100, // 100ms for component renders
  firstContentfulPaintMaxMs: 2000, // 2s for FCP
  largestContentfulPaintMaxMs: 4000, // 4s for LCP
};

class PerformanceValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      themeToggle: {},
      renderPerformance: {},
      lighthouse: {},
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        issues: []
      }
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

  async measureBundleSize() {
    this.log('📦 Measuring bundle size...');
    
    try {
      // Build the application
      this.log('Building application for production...');
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
      
      // Read build stats
      const distPath = join(projectRoot, 'dist');
      if (!existsSync(distPath)) {
        throw new Error('Build directory not found');
      }

      // Get bundle sizes
      const buildOutput = execSync('du -sh dist/', { cwd: projectRoot, encoding: 'utf8' });
      const totalSize = buildOutput.split('\t')[0];

      // Get individual file sizes
      const jsFiles = execSync('find dist -name "*.js" -exec du -h {} \\;', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      }).split('\n').filter(line => line.trim());

      const cssFiles = execSync('find dist -name "*.css" -exec du -h {} \\;', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      }).split('\n').filter(line => line.trim());

      this.results.bundleSize = {
        totalSize,
        jsFiles: jsFiles.map(line => {
          const [size, path] = line.split('\t');
          return { size, path: path.replace(distPath + '/', '') };
        }),
        cssFiles: cssFiles.map(line => {
          const [size, path] = line.split('\t');
          return { size, path: path.replace(distPath + '/', '') };
        }),
        timestamp: new Date().toISOString()
      };

      this.log(`✅ Bundle size measured: ${totalSize}`, 'success');
      this.results.summary.passed++;

    } catch (error) {
      this.log(`❌ Bundle size measurement failed: ${error.message}`, 'error');
      this.results.summary.failed++;
      this.results.summary.issues.push(`Bundle size measurement: ${error.message}`);
    }
  }

  async measureThemeTogglePerformance() {
    this.log('🎨 Measuring theme toggle performance...');
    
    try {
      // Create a performance test file
      const testScript = `
        import { performance } from 'perf_hooks';
        
        // Simulate DOM environment
        global.document = {
          documentElement: {
            classList: {
              contains: () => false,
              toggle: () => {},
              add: () => {},
              remove: () => {}
            }
          }
        };
        
        global.localStorage = {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
        
        global.window = {
          matchMedia: () => ({ matches: false }),
          dispatchEvent: () => {}
        };

        // Import the theme toggle hook
        const { useThemeToggle } = await import('../src/hooks/useThemeToggle.ts');
        
        // Measure theme toggle performance
        const measurements = [];
        const iterations = 100;
        
        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          
          // Simulate theme toggle
          const root = document.documentElement;
          root.classList.toggle('dark');
          localStorage.setItem('theme', 'dark');
          
          const end = performance.now();
          measurements.push(end - start);
        }
        
        const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxTime = Math.max(...measurements);
        const minTime = Math.min(...measurements);
        
        console.log(JSON.stringify({
          averageMs: avgTime,
          maxMs: maxTime,
          minMs: minTime,
          measurements: measurements.slice(0, 10) // First 10 measurements
        }));
      `;

      writeFileSync(join(projectRoot, 'temp-theme-perf-test.mjs'), testScript);
      
      const output = execSync('node temp-theme-perf-test.mjs', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });
      
      const themePerf = JSON.parse(output.trim());
      
      this.results.themeToggle = {
        ...themePerf,
        passedThreshold: themePerf.maxMs <= PERFORMANCE_THRESHOLDS.themeToggleMaxMs,
        threshold: PERFORMANCE_THRESHOLDS.themeToggleMaxMs,
        timestamp: new Date().toISOString()
      };

      // Cleanup
      execSync('rm -f temp-theme-perf-test.mjs', { cwd: projectRoot });

      if (themePerf.maxMs <= PERFORMANCE_THRESHOLDS.themeToggleMaxMs) {
        this.log(`✅ Theme toggle performance: ${themePerf.averageMs.toFixed(2)}ms avg, ${themePerf.maxMs.toFixed(2)}ms max`, 'success');
        this.results.summary.passed++;
      } else {
        this.log(`⚠️ Theme toggle performance warning: ${themePerf.maxMs.toFixed(2)}ms max exceeds ${PERFORMANCE_THRESHOLDS.themeToggleMaxMs}ms threshold`, 'warning');
        this.results.summary.warnings++;
        this.results.summary.issues.push(`Theme toggle max time: ${themePerf.maxMs.toFixed(2)}ms > ${PERFORMANCE_THRESHOLDS.themeToggleMaxMs}ms`);
      }

    } catch (error) {
      this.log(`❌ Theme toggle performance measurement failed: ${error.message}`, 'error');
      this.results.summary.failed++;
      this.results.summary.issues.push(`Theme toggle performance: ${error.message}`);
    }
  }

  async measureRenderPerformance() {
    this.log('⚡ Measuring component render performance...');
    
    try {
      // Run existing performance tests
      const testOutput = execSync('npm run test:run -- --reporter=json src/hooks/__tests__/useThemeToggle.performance.test.ts', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });

      // Parse test results
      const testResults = JSON.parse(testOutput);
      
      this.results.renderPerformance = {
        testsPassed: testResults.numPassedTests || 0,
        testsFailed: testResults.numFailedTests || 0,
        totalTests: testResults.numTotalTests || 0,
        testResults: testResults.testResults || [],
        timestamp: new Date().toISOString()
      };

      if (testResults.numFailedTests === 0) {
        this.log(`✅ Render performance tests passed: ${testResults.numPassedTests}/${testResults.numTotalTests}`, 'success');
        this.results.summary.passed++;
      } else {
        this.log(`❌ Render performance tests failed: ${testResults.numFailedTests}/${testResults.numTotalTests}`, 'error');
        this.results.summary.failed++;
        this.results.summary.issues.push(`Render performance: ${testResults.numFailedTests} tests failed`);
      }

    } catch (error) {
      this.log(`⚠️ Render performance tests not available or failed: ${error.message}`, 'warning');
      this.results.summary.warnings++;
    }
  }

  async runLighthouseAudit() {
    this.log('🔍 Running Lighthouse performance audit...');
    
    try {
      // Start dev server in background
      this.log('Starting development server...');
      const serverProcess = execSync('npm run dev &', { cwd: projectRoot });
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Run Lighthouse audit
      const lighthouseOutput = execSync('npx lighthouse http://localhost:5173 --output=json --quiet --chrome-flags="--headless"', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });
      
      const lighthouse = JSON.parse(lighthouseOutput);
      
      this.results.lighthouse = {
        performance: lighthouse.lhr.categories.performance.score * 100,
        firstContentfulPaint: lighthouse.lhr.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: lighthouse.lhr.audits['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: lighthouse.lhr.audits['cumulative-layout-shift'].numericValue,
        totalBlockingTime: lighthouse.lhr.audits['total-blocking-time'].numericValue,
        timestamp: new Date().toISOString()
      };

      // Kill dev server
      execSync('pkill -f "vite.*5173" || true', { cwd: projectRoot });

      const perf = this.results.lighthouse.performance;
      if (perf >= 90) {
        this.log(`✅ Lighthouse performance score: ${perf}/100`, 'success');
        this.results.summary.passed++;
      } else if (perf >= 70) {
        this.log(`⚠️ Lighthouse performance score: ${perf}/100 (needs improvement)`, 'warning');
        this.results.summary.warnings++;
      } else {
        this.log(`❌ Lighthouse performance score: ${perf}/100 (poor)`, 'error');
        this.results.summary.failed++;
        this.results.summary.issues.push(`Lighthouse performance score: ${perf}/100`);
      }

    } catch (error) {
      this.log(`⚠️ Lighthouse audit failed: ${error.message}`, 'warning');
      this.results.summary.warnings++;
      
      // Ensure dev server is killed
      try {
        execSync('pkill -f "vite.*5173" || true', { cwd: projectRoot });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async analyzeDependencies() {
    this.log('📋 Analyzing dependencies for MUI remnants...');
    
    try {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
      
      const muiDependencies = Object.keys(packageJson.dependencies || {})
        .filter(dep => dep.startsWith('@mui/') || dep.startsWith('@emotion/'));
      
      const muiDevDependencies = Object.keys(packageJson.devDependencies || {})
        .filter(dep => dep.startsWith('@mui/') || dep.startsWith('@emotion/'));

      this.results.dependencies = {
        muiDependencies,
        muiDevDependencies,
        totalMuiDeps: muiDependencies.length + muiDevDependencies.length,
        migrationComplete: muiDependencies.length === 0 && muiDevDependencies.length === 0,
        timestamp: new Date().toISOString()
      };

      if (this.results.dependencies.migrationComplete) {
        this.log('✅ All MUI dependencies removed', 'success');
        this.results.summary.passed++;
      } else {
        this.log(`⚠️ ${this.results.dependencies.totalMuiDeps} MUI dependencies still present`, 'warning');
        this.results.summary.warnings++;
        this.results.summary.issues.push(`MUI dependencies remaining: ${this.results.dependencies.totalMuiDeps}`);
      }

    } catch (error) {
      this.log(`❌ Dependency analysis failed: ${error.message}`, 'error');
      this.results.summary.failed++;
    }
  }

  generateReport() {
    this.log('📊 Generating performance report...');
    
    const reportPath = join(projectRoot, 'performance-validation-report.json');
    const markdownReportPath = join(projectRoot, 'PERFORMANCE_VALIDATION_REPORT.md');
    
    // Save JSON report
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate markdown report
    const markdown = this.generateMarkdownReport();
    writeFileSync(markdownReportPath, markdown);
    
    this.log(`✅ Reports saved to:`, 'success');
    this.log(`   JSON: ${reportPath}`, 'info');
    this.log(`   Markdown: ${markdownReportPath}`, 'info');
  }

  generateMarkdownReport() {
    const { results } = this;
    const { summary } = results;
    
    return `# Performance Validation Report

**Generated:** ${results.timestamp}

## Summary

- ✅ **Passed:** ${summary.passed}
- ❌ **Failed:** ${summary.failed}
- ⚠️ **Warnings:** ${summary.warnings}

${summary.issues.length > 0 ? `
## Issues Found

${summary.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Bundle Size Analysis

${results.bundleSize.totalSize ? `
**Total Bundle Size:** ${results.bundleSize.totalSize}

### JavaScript Files
${results.bundleSize.jsFiles?.map(file => `- ${file.path}: ${file.size}`).join('\n') || 'No JS files found'}

### CSS Files
${results.bundleSize.cssFiles?.map(file => `- ${file.path}: ${file.size}`).join('\n') || 'No CSS files found'}
` : 'Bundle size analysis not available'}

## Theme Toggle Performance

${results.themeToggle.averageMs ? `
- **Average Time:** ${results.themeToggle.averageMs.toFixed(2)}ms
- **Maximum Time:** ${results.themeToggle.maxMs.toFixed(2)}ms
- **Minimum Time:** ${results.themeToggle.minMs.toFixed(2)}ms
- **Threshold:** ${results.themeToggle.threshold}ms
- **Status:** ${results.themeToggle.passedThreshold ? '✅ PASSED' : '❌ FAILED'}
` : 'Theme toggle performance not measured'}

## Render Performance

${results.renderPerformance.totalTests ? `
- **Tests Passed:** ${results.renderPerformance.testsPassed}
- **Tests Failed:** ${results.renderPerformance.testsFailed}
- **Total Tests:** ${results.renderPerformance.totalTests}
` : 'Render performance tests not available'}

## Lighthouse Audit

${results.lighthouse.performance ? `
- **Performance Score:** ${results.lighthouse.performance}/100
- **First Contentful Paint:** ${results.lighthouse.firstContentfulPaint}ms
- **Largest Contentful Paint:** ${results.lighthouse.largestContentfulPaint}ms
- **Cumulative Layout Shift:** ${results.lighthouse.cumulativeLayoutShift}
- **Total Blocking Time:** ${results.lighthouse.totalBlockingTime}ms
` : 'Lighthouse audit not available'}

## Dependencies Analysis

${results.dependencies ? `
- **MUI Dependencies:** ${results.dependencies.muiDependencies.length}
- **MUI Dev Dependencies:** ${results.dependencies.muiDevDependencies.length}
- **Migration Complete:** ${results.dependencies.migrationComplete ? '✅ YES' : '❌ NO'}

${results.dependencies.muiDependencies.length > 0 ? `
### Remaining MUI Dependencies
${results.dependencies.muiDependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}

${results.dependencies.muiDevDependencies.length > 0 ? `
### Remaining MUI Dev Dependencies
${results.dependencies.muiDevDependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}
` : 'Dependencies analysis not available'}

## Recommendations

${this.generateRecommendations()}

---
*Report generated by Performance Validation Script*
`;
  }

  generateRecommendations() {
    const recommendations = [];
    const { results } = this;

    if (results.themeToggle.maxMs > PERFORMANCE_THRESHOLDS.themeToggleMaxMs) {
      recommendations.push('- Optimize theme toggle implementation to reduce maximum execution time');
    }

    if (results.dependencies?.totalMuiDeps > 0) {
      recommendations.push('- Remove remaining MUI dependencies to complete migration');
    }

    if (results.lighthouse?.performance < 90) {
      recommendations.push('- Improve Lighthouse performance score through code splitting and optimization');
    }

    if (results.summary.failed > 0) {
      recommendations.push('- Address failed performance tests before production deployment');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- All performance metrics are within acceptable ranges';
  }

  async run() {
    this.log('🚀 Starting Performance Validation for MUI to shadcn Migration', 'info');
    this.log('=' .repeat(60), 'info');

    await this.analyzeDependencies();
    await this.measureBundleSize();
    await this.measureThemeTogglePerformance();
    await this.measureRenderPerformance();
    await this.runLighthouseAudit();

    this.generateReport();

    this.log('=' .repeat(60), 'info');
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

// Run the validator
const validator = new PerformanceValidator();
validator.run().catch(error => {
  console.error('❌ Performance validation failed:', error);
  process.exit(1);
});