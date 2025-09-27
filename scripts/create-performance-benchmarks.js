#!/usr/bin/env node

/**
 * Performance Benchmarks Creation Script
 * Creates comprehensive performance benchmarks for tracking improvements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceBenchmarkCreator {
  constructor() {
    this.benchmarks = {
      metadata: {
        timestamp: Date.now(),
        version: '1.0.0',
        environment: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        targets: {
          lighthouse: { performance: 90, lcp: 2500, tti: 3000 },
          api: { p50: 140, p95: 350 },
          theme: { switchTime: 16 },
          bundle: { totalGzip: 500 * 1024 },
        },
      },
      current: {},
      historical: [],
      trends: {},
      improvements: {},
    };
    
    this.loadHistoricalData();
  }

  loadHistoricalData() {
    const historicalPath = 'performance-benchmarks.json';
    if (fs.existsSync(historicalPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
        this.benchmarks.historical = data.historical || [];
        this.benchmarks.trends = data.trends || {};
      } catch (error) {
        console.warn('Could not load historical benchmarks:', error.message);
      }
    }
  }

  async measureLighthousePerformance() {
    console.log('🏠 Measuring Lighthouse performance...');
    
    try {
      // Run Lighthouse for desktop
      const desktopOutput = execSync('npx lighthouse http://localhost:5173 --preset=desktop --output=json --quiet', {
        encoding: 'utf8',
        timeout: 300000,
        cwd: 'frontend',
      });
      
      const desktopData = JSON.parse(desktopOutput);
      
      // Run Lighthouse for mobile
      const mobileOutput = execSync('npx lighthouse http://localhost:5173 --output=json --quiet', {
        encoding: 'utf8',
        timeout: 300000,
        cwd: 'frontend',
      });
      
      const mobileData = JSON.parse(mobileOutput);
      
      this.benchmarks.current.lighthouse = {
        desktop: {
          performance: Math.round(desktopData.categories.performance.score * 100),
          accessibility: Math.round(desktopData.categories.accessibility.score * 100),
          bestPractices: Math.round(desktopData.categories['best-practices'].score * 100),
          seo: Math.round(desktopData.categories.seo.score * 100),
          lcp: desktopData.audits['largest-contentful-paint'].numericValue,
          fcp: desktopData.audits['first-contentful-paint'].numericValue,
          tti: desktopData.audits.interactive.numericValue,
          cls: desktopData.audits['cumulative-layout-shift'].numericValue,
          fid: desktopData.audits['max-potential-fid']?.numericValue || 0,
        },
        mobile: {
          performance: Math.round(mobileData.categories.performance.score * 100),
          accessibility: Math.round(mobileData.categories.accessibility.score * 100),
          bestPractices: Math.round(mobileData.categories['best-practices'].score * 100),
          seo: Math.round(mobileData.categories.seo.score * 100),
          lcp: mobileData.audits['largest-contentful-paint'].numericValue,
          fcp: mobileData.audits['first-contentful-paint'].numericValue,
          tti: mobileData.audits.interactive.numericValue,
          cls: mobileData.audits['cumulative-layout-shift'].numericValue,
          fid: mobileData.audits['max-potential-fid']?.numericValue || 0,
        },
      };
      
      console.log('✅ Lighthouse benchmarks captured');
      
    } catch (error) {
      console.error('❌ Lighthouse benchmarking failed:', error.message);
      this.benchmarks.current.lighthouse = { error: error.message };
    }
  }

  async measureApiPerformance() {
    console.log('🌐 Measuring API performance...');
    
    try {
      // Run a quick API performance test
      const testScript = `
        const axios = require('axios');
        const baseURL = 'http://localhost:3001';
        
        async function measureEndpoint(endpoint) {
          const times = [];
          for (let i = 0; i < 10; i++) {
            const start = Date.now();
            try {
              await axios.get(baseURL + endpoint, { timeout: 5000 });
              times.push(Date.now() - start);
            } catch (error) {
              times.push(5000); // Timeout value
            }
          }
          
          times.sort((a, b) => a - b);
          return {
            p50: times[Math.floor(times.length * 0.5)],
            p95: times[Math.floor(times.length * 0.95)],
            p99: times[Math.floor(times.length * 0.99)],
            avg: times.reduce((sum, t) => sum + t, 0) / times.length,
          };
        }
        
        async function main() {
          const endpoints = ['/api/health', '/api/patients', '/api/analytics'];
          const results = {};
          
          for (const endpoint of endpoints) {
            results[endpoint] = await measureEndpoint(endpoint);
          }
          
          console.log(JSON.stringify(results));
        }
        
        main().catch(console.error);
      `;
      
      fs.writeFileSync('/tmp/api-benchmark.js', testScript);
      
      const output = execSync('node /tmp/api-benchmark.js', {
        encoding: 'utf8',
        timeout: 60000,
      });
      
      const apiResults = JSON.parse(output);
      
      // Calculate overall API performance
      const allTimes = Object.values(apiResults).reduce((acc, endpoint) => {
        acc.p50.push(endpoint.p50);
        acc.p95.push(endpoint.p95);
        acc.p99.push(endpoint.p99);
        return acc;
      }, { p50: [], p95: [], p99: [] });
      
      this.benchmarks.current.api = {
        overall: {
          p50: Math.round(allTimes.p50.reduce((sum, t) => sum + t, 0) / allTimes.p50.length),
          p95: Math.round(allTimes.p95.reduce((sum, t) => sum + t, 0) / allTimes.p95.length),
          p99: Math.round(allTimes.p99.reduce((sum, t) => sum + t, 0) / allTimes.p99.length),
        },
        endpoints: apiResults,
      };
      
      // Clean up
      fs.unlinkSync('/tmp/api-benchmark.js');
      
      console.log('✅ API benchmarks captured');
      
    } catch (error) {
      console.error('❌ API benchmarking failed:', error.message);
      this.benchmarks.current.api = { error: error.message };
    }
  }

  async measureThemePerformance() {
    console.log('🎨 Measuring theme switching performance...');
    
    try {
      // Create a simple theme performance test
      const testScript = `
        const { chromium } = require('playwright');
        
        async function measureThemeSwitch() {
          const browser = await chromium.launch();
          const page = await browser.newPage();
          
          await page.goto('http://localhost:5173');
          await page.waitForLoadState('networkidle');
          
          const times = [];
          const themes = ['light', 'dark'];
          
          for (let i = 0; i < 10; i++) {
            const theme = themes[i % 2];
            
            const start = Date.now();
            
            await page.evaluate((themeName) => {
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(themeName);
              document.documentElement.setAttribute('data-theme', themeName);
            }, theme);
            
            await page.waitForFunction(
              (expectedTheme) => document.documentElement.classList.contains(expectedTheme),
              theme,
              { timeout: 1000 }
            );
            
            times.push(Date.now() - start);
            await page.waitForTimeout(50);
          }
          
          await browser.close();
          
          times.sort((a, b) => a - b);
          const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
          const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
          
          return {
            average: Math.round(avg * 10) / 10,
            min: times[0],
            max: times[times.length - 1],
            standardDeviation: Math.round(Math.sqrt(variance) * 10) / 10,
            p95: times[Math.floor(times.length * 0.95)],
          };
        }
        
        measureThemeSwitch().then(console.log).catch(console.error);
      `;
      
      fs.writeFileSync('/tmp/theme-benchmark.js', testScript);
      
      const output = execSync('node /tmp/theme-benchmark.js', {
        encoding: 'utf8',
        timeout: 120000,
      });
      
      this.benchmarks.current.theme = JSON.parse(output);
      
      // Clean up
      fs.unlinkSync('/tmp/theme-benchmark.js');
      
      console.log('✅ Theme performance benchmarks captured');
      
    } catch (error) {
      console.error('❌ Theme benchmarking failed:', error.message);
      this.benchmarks.current.theme = { error: error.message };
    }
  }

  async measureBundleSize() {
    console.log('📦 Measuring bundle size...');
    
    try {
      // Build the project
      execSync('npm run build', {
        cwd: 'frontend',
        timeout: 300000,
      });
      
      // Analyze bundle
      const distPath = path.join('frontend', 'dist');
      const assetsPath = path.join(distPath, 'assets');
      
      if (!fs.existsSync(assetsPath)) {
        throw new Error('Build assets not found');
      }
      
      const files = fs.readdirSync(assetsPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      
      let totalSize = 0;
      let totalGzipSize = 0;
      const chunks = {};
      
      // Calculate sizes (simplified - in real scenario would use gzip)
      [...jsFiles, ...cssFiles].forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        const gzipSize = Math.round(size * 0.3); // Approximate gzip compression
        
        totalSize += size;
        totalGzipSize += gzipSize;
        
        chunks[file] = {
          size,
          gzipSize,
          type: file.endsWith('.js') ? 'javascript' : 'css',
        };
      });
      
      this.benchmarks.current.bundle = {
        total: {
          size: totalSize,
          gzipSize: totalGzipSize,
        },
        chunks,
        javascript: {
          count: jsFiles.length,
          size: jsFiles.reduce((sum, f) => sum + chunks[f].size, 0),
          gzipSize: jsFiles.reduce((sum, f) => sum + chunks[f].gzipSize, 0),
        },
        css: {
          count: cssFiles.length,
          size: cssFiles.reduce((sum, f) => sum + chunks[f].size, 0),
          gzipSize: cssFiles.reduce((sum, f) => sum + chunks[f].gzipSize, 0),
        },
      };
      
      console.log('✅ Bundle size benchmarks captured');
      
    } catch (error) {
      console.error('❌ Bundle size benchmarking failed:', error.message);
      this.benchmarks.current.bundle = { error: error.message };
    }
  }

  calculateTrends() {
    console.log('📈 Calculating performance trends...');
    
    if (this.benchmarks.historical.length === 0) {
      console.log('No historical data available for trend analysis');
      return;
    }
    
    const latest = this.benchmarks.historical[this.benchmarks.historical.length - 1];
    const current = this.benchmarks.current;
    
    this.benchmarks.trends = {
      lighthouse: this.calculateCategoryTrend(latest.lighthouse, current.lighthouse),
      api: this.calculateCategoryTrend(latest.api, current.api),
      theme: this.calculateCategoryTrend(latest.theme, current.theme),
      bundle: this.calculateCategoryTrend(latest.bundle, current.bundle),
    };
    
    console.log('✅ Trends calculated');
  }

  calculateCategoryTrend(historical, current) {
    if (!historical || !current || historical.error || current.error) {
      return { status: 'no_data' };
    }
    
    const trends = {};
    
    // Compare numeric values
    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'number' && typeof historical[key] === 'number') {
        const change = ((current[key] - historical[key]) / historical[key]) * 100;
        trends[key] = {
          change: Math.round(change * 10) / 10,
          direction: change > 0 ? 'increased' : change < 0 ? 'decreased' : 'stable',
          status: Math.abs(change) < 2 ? 'stable' : Math.abs(change) < 10 ? 'moderate' : 'significant',
        };
      }
    });
    
    return trends;
  }

  calculateImprovements() {
    console.log('📊 Calculating improvements from baseline...');
    
    const targets = this.benchmarks.metadata.targets;
    const current = this.benchmarks.current;
    
    this.benchmarks.improvements = {
      lighthouse: {
        desktop: this.calculateMetricImprovements(current.lighthouse?.desktop, {
          performance: { target: targets.lighthouse.performance, higherIsBetter: true },
          lcp: { target: targets.lighthouse.lcp, higherIsBetter: false },
          tti: { target: targets.lighthouse.tti, higherIsBetter: false },
        }),
      },
      api: this.calculateMetricImprovements(current.api?.overall, {
        p50: { target: targets.api.p50, higherIsBetter: false },
        p95: { target: targets.api.p95, higherIsBetter: false },
      }),
      theme: this.calculateMetricImprovements(current.theme, {
        average: { target: targets.theme.switchTime, higherIsBetter: false },
      }),
      bundle: this.calculateMetricImprovements(current.bundle?.total, {
        gzipSize: { target: targets.bundle.totalGzip, higherIsBetter: false },
      }),
    };
    
    console.log('✅ Improvements calculated');
  }

  calculateMetricImprovements(metrics, targets) {
    if (!metrics) return {};
    
    const improvements = {};
    
    Object.entries(targets).forEach(([metric, config]) => {
      if (metrics[metric] !== undefined) {
        const actual = metrics[metric];
        const target = config.target;
        const met = config.higherIsBetter ? actual >= target : actual <= target;
        
        improvements[metric] = {
          actual,
          target,
          met,
          difference: config.higherIsBetter ? actual - target : target - actual,
          percentage: Math.round(((config.higherIsBetter ? actual / target : target / actual) - 1) * 100),
        };
      }
    });
    
    return improvements;
  }

  saveHistoricalData() {
    console.log('💾 Saving historical benchmark data...');
    
    // Add current benchmarks to historical data
    this.benchmarks.historical.push({
      timestamp: this.benchmarks.metadata.timestamp,
      ...this.benchmarks.current,
    });
    
    // Keep only last 30 entries
    if (this.benchmarks.historical.length > 30) {
      this.benchmarks.historical = this.benchmarks.historical.slice(-30);
    }
    
    // Save to file
    const benchmarkPath = 'performance-benchmarks.json';
    fs.writeFileSync(benchmarkPath, JSON.stringify(this.benchmarks, null, 2));
    
    console.log(`✅ Benchmarks saved to ${benchmarkPath}`);
  }

  generateReport() {
    console.log('📄 Generating benchmark report...');
    
    const reportDir = 'performance-benchmark-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate detailed report
    const report = {
      metadata: this.benchmarks.metadata,
      summary: this.generateSummary(),
      current: this.benchmarks.current,
      improvements: this.benchmarks.improvements,
      trends: this.benchmarks.trends,
      recommendations: this.generateRecommendations(),
    };
    
    // Save JSON report
    const jsonPath = path.join(reportDir, `benchmark-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const mdPath = path.join(reportDir, `benchmark-report-${timestamp}.md`);
    const mdContent = this.generateMarkdownReport(report);
    fs.writeFileSync(mdPath, mdContent);
    
    console.log('📄 Benchmark reports generated:');
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
    
    return { jsonPath, mdPath };
  }

  generateSummary() {
    const current = this.benchmarks.current;
    const targets = this.benchmarks.metadata.targets;
    
    return {
      lighthouse: {
        desktopPerformance: current.lighthouse?.desktop?.performance || 0,
        targetMet: (current.lighthouse?.desktop?.performance || 0) >= targets.lighthouse.performance,
      },
      api: {
        p95Latency: current.api?.overall?.p95 || 0,
        targetMet: (current.api?.overall?.p95 || Infinity) <= targets.api.p95,
      },
      theme: {
        averageTime: current.theme?.average || 0,
        targetMet: (current.theme?.average || Infinity) <= targets.theme.switchTime,
      },
      bundle: {
        totalGzipSize: current.bundle?.total?.gzipSize || 0,
        targetMet: (current.bundle?.total?.gzipSize || Infinity) <= targets.bundle.totalGzip,
      },
    };
  }

  generateRecommendations() {
    const improvements = this.benchmarks.improvements;
    const recommendations = [];
    
    // Lighthouse recommendations
    if (improvements.lighthouse?.desktop?.performance && !improvements.lighthouse.desktop.performance.met) {
      recommendations.push({
        category: 'lighthouse',
        priority: 'high',
        title: 'Improve Lighthouse Performance Score',
        current: improvements.lighthouse.desktop.performance.actual,
        target: improvements.lighthouse.desktop.performance.target,
        actions: [
          'Optimize images and use modern formats',
          'Implement code splitting',
          'Minimize JavaScript execution time',
          'Optimize Critical Rendering Path',
        ],
      });
    }
    
    // API recommendations
    if (improvements.api?.p95 && !improvements.api.p95.met) {
      recommendations.push({
        category: 'api',
        priority: 'high',
        title: 'Optimize API Response Times',
        current: improvements.api.p95.actual,
        target: improvements.api.p95.target,
        actions: [
          'Implement database query optimization',
          'Add caching layers',
          'Optimize database indexes',
          'Use connection pooling',
        ],
      });
    }
    
    // Theme recommendations
    if (improvements.theme?.average && !improvements.theme.average.met) {
      recommendations.push({
        category: 'theme',
        priority: 'medium',
        title: 'Optimize Theme Switching Performance',
        current: improvements.theme.average.actual,
        target: improvements.theme.average.target,
        actions: [
          'Use CSS custom properties',
          'Minimize DOM manipulations',
          'Preload theme assets',
          'Optimize CSS transitions',
        ],
      });
    }
    
    // Bundle recommendations
    if (improvements.bundle?.gzipSize && !improvements.bundle.gzipSize.met) {
      recommendations.push({
        category: 'bundle',
        priority: 'medium',
        title: 'Reduce Bundle Size',
        current: Math.round(improvements.bundle.gzipSize.actual / 1024),
        target: Math.round(improvements.bundle.gzipSize.target / 1024),
        actions: [
          'Implement tree shaking',
          'Use dynamic imports',
          'Optimize dependencies',
          'Enable compression',
        ],
      });
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    let md = `# Performance Benchmark Report\n\n`;
    md += `**Generated:** ${new Date(report.metadata.timestamp).toLocaleString()}\n\n`;
    
    md += `## Summary\n\n`;
    Object.entries(report.summary).forEach(([category, data]) => {
      md += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      Object.entries(data).forEach(([key, value]) => {
        if (key.includes('targetMet')) {
          md += `- **Target Met:** ${value ? '✅ Yes' : '❌ No'}\n`;
        } else {
          md += `- **${key}:** ${value}\n`;
        }
      });
      md += `\n`;
    });
    
    md += `## Current Benchmarks\n\n`;
    Object.entries(report.current).forEach(([category, data]) => {
      if (data.error) {
        md += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
        md += `❌ Error: ${data.error}\n\n`;
      } else {
        md += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
        md += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n`;
      }
    });
    
    md += `## Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      md += `### ${rec.title} (${rec.priority.toUpperCase()} Priority)\n`;
      md += `- **Current:** ${rec.current}\n`;
      md += `- **Target:** ${rec.target}\n`;
      md += `- **Actions:**\n`;
      rec.actions.forEach(action => {
        md += `  - ${action}\n`;
      });
      md += `\n`;
    });
    
    return md;
  }

  printSummary() {
    const summary = this.generateSummary();
    
    console.log('\n📊 Performance Benchmark Summary');
    console.log('=================================');
    
    Object.entries(summary).forEach(([category, data]) => {
      console.log(`\n${category.toUpperCase()}:`);
      Object.entries(data).forEach(([key, value]) => {
        if (key.includes('targetMet')) {
          console.log(`  Target Met: ${value ? '✅' : '❌'}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
    
    console.log('');
  }

  async run() {
    console.log('🚀 Creating performance benchmarks...\n');
    
    try {
      // Measure all performance aspects
      await this.measureLighthousePerformance();
      await this.measureApiPerformance();
      await this.measureThemePerformance();
      await this.measureBundleSize();
      
      // Calculate analysis
      this.calculateTrends();
      this.calculateImprovements();
      
      // Save and report
      this.saveHistoricalData();
      const reports = this.generateReport();
      
      // Print summary
      this.printSummary();
      
      console.log('🎉 Performance benchmarks created successfully!');
      
    } catch (error) {
      console.error('💥 Benchmark creation failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new PerformanceBenchmarkCreator();
  creator.run().catch(console.error);
}

module.exports = PerformanceBenchmarkCreator;