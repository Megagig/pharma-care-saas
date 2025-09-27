#!/usr/bin/env node

/**
 * Performance Targets Validation Script
 * Validates all performance targets and creates comprehensive benchmarks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Performance targets from requirements
const PERFORMANCE_TARGETS = {
  lighthouse: {
    performance: 90, // Lighthouse Performance ≥ 90 desktop
    accessibility: 95,
    bestPractices: 90,
    seo: 90,
  },
  webVitals: {
    lcp: 2500, // 30% improvement target (baseline: ~3500ms)
    tti: 3000, // 30% improvement target (baseline: ~4300ms)
    fcp: 1800, // First Contentful Paint
    cls: 0.1,  // Cumulative Layout Shift
    fid: 100,  // First Input Delay
  },
  api: {
    p50: 140, // 30% improvement target (baseline: ~200ms)
    p95: 350, // 30% improvement target (baseline: ~500ms)
    p99: 700, // 30% improvement target (baseline: ~1000ms)
  },
  theme: {
    switchTime: 16, // Sub-16ms theme switching
    consistency: 5, // Standard deviation threshold
  },
  bundle: {
    totalGzip: 500 * 1024, // 500KB total
    chunkGzip: 200 * 1024, // 200KB per chunk
    mainChunk: 150 * 1024, // 150KB main chunk
  },
};

class PerformanceValidator {
  constructor() {
    this.results = {
      timestamp: Date.now(),
      targets: PERFORMANCE_TARGETS,
      validations: [],
      summary: {
        totalTargets: 0,
        metTargets: 0,
        failedTargets: 0,
        overallScore: 0,
        compliance: false,
      },
      benchmarks: {},
      recommendations: [],
    };
    
    this.baselineData = this.loadBaseline();
  }

  loadBaseline() {
    const baselinePath = 'PERF_BASELINE.md';
    if (fs.existsSync(baselinePath)) {
      try {
        const content = fs.readFileSync(baselinePath, 'utf8');
        return this.parseBaselineData(content);
      } catch (error) {
        console.warn('Could not load baseline data:', error.message);
      }
    }
    
    // Default baseline values
    return {
      lighthouse: { performance: 65, lcp: 3500, tti: 4300 },
      api: { p50: 200, p95: 500, p99: 1000 },
      bundle: { totalGzip: 650 * 1024 },
    };
  }

  parseBaselineData(content) {
    const baseline = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Parse baseline metrics from markdown
      const match = line.match(/\*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const [, key, value] = match;
        const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
        if (!isNaN(numValue)) {
          baseline[key.toLowerCase().replace(/\s+/g, '_')] = numValue;
        }
      }
    });
    
    return baseline;
  }

  async validateLighthousePerformance() {
    console.log('🏠 Validating Lighthouse performance targets...');
    
    try {
      // Run Lighthouse CI
      const output = execSync('npm run lighthouse', { 
        encoding: 'utf8',
        timeout: 300000, // 5 minutes
        cwd: 'frontend',
      });
      
      const lighthouseResults = this.parseLighthouseResults(output);
      
      // Validate each Lighthouse metric
      Object.entries(PERFORMANCE_TARGETS.lighthouse).forEach(([metric, target]) => {
        const actual = lighthouseResults[metric] || 0;
        const passed = actual >= target;
        
        this.results.validations.push({
          category: 'lighthouse',
          metric: `Lighthouse ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
          target,
          actual,
          passed,
          improvement: this.calculateImprovement(actual, this.baselineData.lighthouse?.[metric]),
        });
      });
      
      // Validate Web Vitals from Lighthouse
      if (lighthouseResults.lcp) {
        this.results.validations.push({
          category: 'webVitals',
          metric: 'Largest Contentful Paint (LCP)',
          target: PERFORMANCE_TARGETS.webVitals.lcp,
          actual: lighthouseResults.lcp,
          passed: lighthouseResults.lcp <= PERFORMANCE_TARGETS.webVitals.lcp,
          improvement: this.calculateImprovement(lighthouseResults.lcp, this.baselineData.lighthouse?.lcp, true),
        });
      }
      
      console.log('✅ Lighthouse validation completed');
      
    } catch (error) {
      console.error('❌ Lighthouse validation failed:', error.message);
      this.addFailedValidation('lighthouse', 'Lighthouse Performance', 'Could not run Lighthouse');
    }
  }

  parseLighthouseResults(output) {
    // Parse Lighthouse CI output
    const results = {};
    
    try {
      // Look for JSON output or parse text output
      const jsonMatch = output.match(/\{[\s\S]*"categories"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        results.performance = Math.round(data.categories?.performance?.score * 100);
        results.accessibility = Math.round(data.categories?.accessibility?.score * 100);
        results.bestPractices = Math.round(data.categories?.['best-practices']?.score * 100);
        results.seo = Math.round(data.categories?.seo?.score * 100);
        
        // Extract Web Vitals
        if (data.audits) {
          results.lcp = data.audits['largest-contentful-paint']?.numericValue;
          results.fcp = data.audits['first-contentful-paint']?.numericValue;
          results.cls = data.audits['cumulative-layout-shift']?.numericValue;
          results.tti = data.audits['interactive']?.numericValue;
        }
      } else {
        // Parse text output
        const performanceMatch = output.match(/Performance:\s*(\d+)/);
        if (performanceMatch) results.performance = parseInt(performanceMatch[1]);
        
        const accessibilityMatch = output.match(/Accessibility:\s*(\d+)/);
        if (accessibilityMatch) results.accessibility = parseInt(accessibilityMatch[1]);
      }
    } catch (error) {
      console.warn('Could not parse Lighthouse results:', error.message);
    }
    
    return results;
  }

  async validateApiPerformance() {
    console.log('🌐 Validating API performance targets...');
    
    try {
      // Run API load test to get performance metrics
      const output = execSync('../scripts/run-load-tests.sh api', { 
        encoding: 'utf8',
        timeout: 600000, // 10 minutes
      });
      
      const apiResults = this.parseApiResults(output);
      
      // Validate API performance targets
      Object.entries(PERFORMANCE_TARGETS.api).forEach(([metric, target]) => {
        const actual = apiResults[metric] || 0;
        const passed = actual <= target;
        
        this.results.validations.push({
          category: 'api',
          metric: `API ${metric.toUpperCase()} Latency`,
          target,
          actual,
          passed,
          improvement: this.calculateImprovement(actual, this.baselineData.api?.[metric], true),
        });
      });
      
      console.log('✅ API performance validation completed');
      
    } catch (error) {
      console.error('❌ API performance validation failed:', error.message);
      this.addFailedValidation('api', 'API Performance', 'Could not run API load test');
    }
  }

  parseApiResults(output) {
    const results = {};
    
    // Parse k6 output for performance metrics
    const p50Match = output.match(/http_req_duration.*p\(50\)=([0-9.]+)ms/);
    if (p50Match) results.p50 = parseFloat(p50Match[1]);
    
    const p95Match = output.match(/http_req_duration.*p\(95\)=([0-9.]+)ms/);
    if (p95Match) results.p95 = parseFloat(p95Match[1]);
    
    const p99Match = output.match(/http_req_duration.*p\(99\)=([0-9.]+)ms/);
    if (p99Match) results.p99 = parseFloat(p99Match[1]);
    
    return results;
  }

  async validateThemePerformance() {
    console.log('🎨 Validating theme switching performance targets...');
    
    try {
      // Run theme performance tests
      const output = execSync('npm run test:theme:performance -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 120000, // 2 minutes
        cwd: 'frontend',
      });
      
      const themeResults = this.parseThemeResults(output);
      
      // Validate theme switching time
      this.results.validations.push({
        category: 'theme',
        metric: 'Theme Switch Time',
        target: PERFORMANCE_TARGETS.theme.switchTime,
        actual: themeResults.averageTime || 0,
        passed: (themeResults.averageTime || Infinity) <= PERFORMANCE_TARGETS.theme.switchTime,
        improvement: null, // No baseline for theme switching
      });
      
      // Validate consistency
      this.results.validations.push({
        category: 'theme',
        metric: 'Theme Switch Consistency',
        target: PERFORMANCE_TARGETS.theme.consistency,
        actual: themeResults.standardDeviation || 0,
        passed: (themeResults.standardDeviation || Infinity) <= PERFORMANCE_TARGETS.theme.consistency,
        improvement: null,
      });
      
      console.log('✅ Theme performance validation completed');
      
    } catch (error) {
      console.error('❌ Theme performance validation failed:', error.message);
      this.addFailedValidation('theme', 'Theme Performance', 'Could not run theme tests');
    }
  }

  parseThemeResults(output) {
    const results = {};
    
    try {
      const data = JSON.parse(output);
      
      // Extract theme performance metrics from test results
      if (data.testResults) {
        data.testResults.forEach(suite => {
          suite.assertionResults.forEach(test => {
            if (test.title.includes('theme toggle')) {
              // Extract timing data from test
              const timingMatch = test.title.match(/(\d+\.?\d*)ms/);
              if (timingMatch) {
                results.averageTime = parseFloat(timingMatch[1]);
              }
            }
          });
        });
      }
    } catch (error) {
      console.warn('Could not parse theme test results:', error.message);
    }
    
    return results;
  }

  async validateBundleSize() {
    console.log('📦 Validating bundle size targets...');
    
    try {
      // Run bundle analysis
      const output = execSync('npm run bundle:size', { 
        encoding: 'utf8',
        timeout: 120000, // 2 minutes
        cwd: 'frontend',
      });
      
      const bundleResults = this.parseBundleResults(output);
      
      // Validate total bundle size
      this.results.validations.push({
        category: 'bundle',
        metric: 'Total Bundle Size (Gzipped)',
        target: PERFORMANCE_TARGETS.bundle.totalGzip,
        actual: bundleResults.totalGzip || 0,
        passed: (bundleResults.totalGzip || Infinity) <= PERFORMANCE_TARGETS.bundle.totalGzip,
        improvement: this.calculateImprovement(bundleResults.totalGzip, this.baselineData.bundle?.totalGzip, true),
      });
      
      // Validate main chunk size
      if (bundleResults.mainChunk) {
        this.results.validations.push({
          category: 'bundle',
          metric: 'Main Chunk Size (Gzipped)',
          target: PERFORMANCE_TARGETS.bundle.mainChunk,
          actual: bundleResults.mainChunk,
          passed: bundleResults.mainChunk <= PERFORMANCE_TARGETS.bundle.mainChunk,
          improvement: null,
        });
      }
      
      console.log('✅ Bundle size validation completed');
      
    } catch (error) {
      console.error('❌ Bundle size validation failed:', error.message);
      this.addFailedValidation('bundle', 'Bundle Size', 'Could not analyze bundle');
    }
  }

  parseBundleResults(output) {
    const results = {};
    
    // Parse bundle size output
    const totalMatch = output.match(/Total.*?(\d+(?:\.\d+)?)\s*KB/i);
    if (totalMatch) {
      results.totalGzip = parseFloat(totalMatch[1]) * 1024; // Convert KB to bytes
    }
    
    const mainMatch = output.match(/main.*?(\d+(?:\.\d+)?)\s*KB/i);
    if (mainMatch) {
      results.mainChunk = parseFloat(mainMatch[1]) * 1024;
    }
    
    return results;
  }

  calculateImprovement(actual, baseline, lowerIsBetter = false) {
    if (!baseline || !actual) return null;
    
    const improvement = lowerIsBetter 
      ? ((baseline - actual) / baseline) * 100
      : ((actual - baseline) / baseline) * 100;
    
    return Math.round(improvement * 10) / 10; // Round to 1 decimal place
  }

  addFailedValidation(category, metric, error) {
    this.results.validations.push({
      category,
      metric,
      target: 'N/A',
      actual: 'Error',
      passed: false,
      error,
    });
  }

  generateBenchmarks() {
    console.log('📊 Generating performance benchmarks...');
    
    // Create benchmarks from current results
    this.results.benchmarks = {
      timestamp: Date.now(),
      lighthouse: {},
      api: {},
      theme: {},
      bundle: {},
      webVitals: {},
    };
    
    // Extract benchmarks from validations
    this.results.validations.forEach(validation => {
      if (validation.passed && validation.actual !== 'Error') {
        this.results.benchmarks[validation.category][validation.metric] = {
          value: validation.actual,
          target: validation.target,
          improvement: validation.improvement,
          status: 'met',
        };
      }
    });
    
    // Add historical comparison if available
    const historicalPath = 'performance-benchmarks.json';
    if (fs.existsSync(historicalPath)) {
      try {
        const historical = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
        this.results.benchmarks.historical = historical;
        this.results.benchmarks.trend = this.calculateTrend(historical);
      } catch (error) {
        console.warn('Could not load historical benchmarks:', error.message);
      }
    }
    
    // Save current benchmarks
    fs.writeFileSync(historicalPath, JSON.stringify(this.results.benchmarks, null, 2));
    
    console.log('✅ Benchmarks generated and saved');
  }

  calculateTrend(historical) {
    const trends = {};
    
    // Compare current results with historical data
    Object.entries(this.results.benchmarks).forEach(([category, metrics]) => {
      if (category === 'historical' || category === 'timestamp') return;
      
      const historicalCategory = historical[category];
      if (!historicalCategory) return;
      
      Object.entries(metrics).forEach(([metric, data]) => {
        const historicalValue = historicalCategory[metric]?.value;
        if (historicalValue && data.value) {
          const change = ((data.value - historicalValue) / historicalValue) * 100;
          
          trends[`${category}.${metric}`] = {
            change: Math.round(change * 10) / 10,
            direction: change > 0 ? 'increased' : change < 0 ? 'decreased' : 'stable',
            status: Math.abs(change) < 5 ? 'stable' : Math.abs(change) < 15 ? 'moderate' : 'significant',
          };
        }
      });
    });
    
    return trends;
  }

  generateRecommendations() {
    console.log('💡 Generating performance recommendations...');
    
    const failedValidations = this.results.validations.filter(v => !v.passed);
    
    failedValidations.forEach(validation => {
      switch (validation.category) {
        case 'lighthouse':
          if (validation.metric.includes('Performance')) {
            this.results.recommendations.push({
              category: 'lighthouse',
              priority: 'high',
              title: 'Improve Lighthouse Performance Score',
              description: `Current score: ${validation.actual}, Target: ${validation.target}`,
              actions: [
                'Optimize images and use modern formats (WebP, AVIF)',
                'Implement code splitting and lazy loading',
                'Minimize and compress JavaScript and CSS',
                'Use a CDN for static assets',
                'Optimize Critical Rendering Path',
              ],
            });
          }
          break;
          
        case 'api':
          this.results.recommendations.push({
            category: 'api',
            priority: 'high',
            title: `Optimize API ${validation.metric}`,
            description: `Current: ${validation.actual}ms, Target: ${validation.target}ms`,
            actions: [
              'Implement database query optimization',
              'Add Redis caching for frequently accessed data',
              'Use connection pooling',
              'Optimize database indexes',
              'Consider API response compression',
            ],
          });
          break;
          
        case 'theme':
          this.results.recommendations.push({
            category: 'theme',
            priority: 'medium',
            title: 'Optimize Theme Switching Performance',
            description: `Current: ${validation.actual}ms, Target: ${validation.target}ms`,
            actions: [
              'Use CSS custom properties for theme variables',
              'Minimize DOM manipulations during theme switch',
              'Preload theme-specific CSS',
              'Use CSS containment for isolated components',
              'Optimize theme transition animations',
            ],
          });
          break;
          
        case 'bundle':
          this.results.recommendations.push({
            category: 'bundle',
            priority: 'medium',
            title: 'Reduce Bundle Size',
            description: `Current: ${Math.round(validation.actual / 1024)}KB, Target: ${Math.round(validation.target / 1024)}KB`,
            actions: [
              'Implement tree shaking to remove unused code',
              'Use dynamic imports for code splitting',
              'Optimize third-party dependencies',
              'Enable gzip/brotli compression',
              'Analyze and remove duplicate dependencies',
            ],
          });
          break;
      }
    });
    
    // Add general recommendations
    this.results.recommendations.push({
      category: 'general',
      priority: 'low',
      title: 'Continuous Performance Monitoring',
      description: 'Maintain performance standards over time',
      actions: [
        'Set up automated performance testing in CI/CD',
        'Monitor Core Web Vitals in production',
        'Regular performance audits and reviews',
        'Performance budgets enforcement',
        'User experience monitoring',
      ],
    });
    
    console.log(`💡 Generated ${this.results.recommendations.length} recommendations`);
  }

  calculateSummary() {
    const totalTargets = this.results.validations.length;
    const metTargets = this.results.validations.filter(v => v.passed).length;
    const failedTargets = totalTargets - metTargets;
    const overallScore = totalTargets > 0 ? Math.round((metTargets / totalTargets) * 100) : 0;
    
    this.results.summary = {
      totalTargets,
      metTargets,
      failedTargets,
      overallScore,
      compliance: failedTargets === 0,
    };
  }

  generateReport() {
    console.log('📄 Generating performance validation report...');
    
    const reportDir = 'performance-validation-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate JSON report
    const jsonPath = path.join(reportDir, `performance-validation-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlPath = path.join(reportDir, `performance-validation-${timestamp}.html`);
    const htmlContent = this.generateHtmlReport();
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Generate markdown summary
    const mdPath = path.join(reportDir, `performance-validation-${timestamp}.md`);
    const mdContent = this.generateMarkdownReport();
    fs.writeFileSync(mdPath, mdContent);
    
    console.log('📄 Reports generated:');
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  Markdown: ${mdPath}`);
    
    return { jsonPath, htmlPath, mdPath };
  }

  generateHtmlReport() {
    const { summary, validations, recommendations } = this.results;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.excellent { color: #28a745; }
        .score.good { color: #17a2b8; }
        .score.warning { color: #ffc107; }
        .score.danger { color: #dc3545; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .validations { margin: 20px 0; }
        .validation { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid; }
        .validation.passed { border-left-color: #28a745; background: #f8fff9; }
        .validation.failed { border-left-color: #dc3545; background: #fff8f8; }
        .recommendations { margin: 20px 0; }
        .recommendation { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation.high { border-left: 4px solid #dc3545; }
        .recommendation.medium { border-left: 4px solid #ffc107; }
        .recommendation.low { border-left: 4px solid #17a2b8; }
        .actions { margin-top: 10px; }
        .actions li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Validation Report</h1>
        <p><strong>Generated:</strong> ${new Date(this.results.timestamp).toLocaleString()}</p>
        <p><strong>Overall Compliance:</strong> ${summary.compliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}</p>
    </div>

    <div class="score ${this.getScoreClass(summary.overallScore)}">
        ${summary.overallScore}/100
        <div style="font-size: 18px; margin-top: 10px;">Performance Score</div>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value" style="color: #28a745;">${summary.metTargets}</div>
            <div class="metric-label">Targets Met</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #dc3545;">${summary.failedTargets}</div>
            <div class="metric-label">Targets Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.totalTargets}</div>
            <div class="metric-label">Total Targets</div>
        </div>
    </div>

    <h2>Validation Results</h2>
    <div class="validations">
        ${validations.map(v => `
            <div class="validation ${v.passed ? 'passed' : 'failed'}">
                <strong>${v.metric}</strong><br>
                Target: ${v.target} | Actual: ${v.actual} | Status: ${v.passed ? '✅ PASS' : '❌ FAIL'}
                ${v.improvement !== null ? `<br>Improvement: ${v.improvement > 0 ? '+' : ''}${v.improvement}%` : ''}
                ${v.error ? `<br>Error: ${v.error}` : ''}
            </div>
        `).join('')}
    </div>

    <h2>Recommendations</h2>
    <div class="recommendations">
        ${recommendations.map(r => `
            <div class="recommendation ${r.priority}">
                <h3>${r.title} (${r.priority.toUpperCase()} Priority)</h3>
                <p>${r.description}</p>
                <div class="actions">
                    <strong>Actions:</strong>
                    <ul>
                        ${r.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  generateMarkdownReport() {
    const { summary, validations, recommendations } = this.results;
    
    let md = `# Performance Validation Report\n\n`;
    md += `**Generated:** ${new Date(this.results.timestamp).toLocaleString()}\n`;
    md += `**Overall Score:** ${summary.overallScore}/100\n`;
    md += `**Compliance:** ${summary.compliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Targets Met:** ${summary.metTargets}\n`;
    md += `- **Targets Failed:** ${summary.failedTargets}\n`;
    md += `- **Total Targets:** ${summary.totalTargets}\n\n`;
    
    md += `## Validation Results\n\n`;
    validations.forEach(v => {
      md += `### ${v.metric}\n`;
      md += `- **Target:** ${v.target}\n`;
      md += `- **Actual:** ${v.actual}\n`;
      md += `- **Status:** ${v.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      if (v.improvement !== null) {
        md += `- **Improvement:** ${v.improvement > 0 ? '+' : ''}${v.improvement}%\n`;
      }
      if (v.error) {
        md += `- **Error:** ${v.error}\n`;
      }
      md += `\n`;
    });
    
    md += `## Recommendations\n\n`;
    recommendations.forEach(r => {
      md += `### ${r.title} (${r.priority.toUpperCase()} Priority)\n`;
      md += `${r.description}\n\n`;
      md += `**Actions:**\n`;
      r.actions.forEach(action => {
        md += `- ${action}\n`;
      });
      md += `\n`;
    });
    
    return md;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  printSummary() {
    const { summary } = this.results;
    
    console.log('\n📊 Performance Validation Summary');
    console.log('==================================');
    console.log(`Overall Score: ${summary.overallScore}/100`);
    console.log(`Targets Met: ${summary.metTargets}/${summary.totalTargets}`);
    console.log(`Compliance: ${summary.compliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    
    if (summary.failedTargets > 0) {
      console.log('\n❌ Failed Targets:');
      this.results.validations
        .filter(v => !v.passed)
        .forEach(v => {
          console.log(`  - ${v.metric}: ${v.actual} (target: ${v.target})`);
        });
    }
    
    console.log(`\n💡 Generated ${this.results.recommendations.length} recommendations`);
    console.log('');
  }

  async run() {
    console.log('🚀 Starting performance targets validation...\n');
    
    try {
      // Run all validations
      await this.validateLighthousePerformance();
      await this.validateApiPerformance();
      await this.validateThemePerformance();
      await this.validateBundleSize();
      
      // Generate analysis
      this.generateBenchmarks();
      this.generateRecommendations();
      this.calculateSummary();
      
      // Generate reports
      const reports = this.generateReport();
      
      // Print summary
      this.printSummary();
      
      // Exit with appropriate code
      if (this.results.summary.compliance) {
        console.log('🎉 All performance targets met!');
        process.exit(0);
      } else {
        console.log('⚠️  Some performance targets not met. Check the report for details.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Performance validation failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new PerformanceValidator();
  validator.run().catch(console.error);
}

module.exports = PerformanceValidator;