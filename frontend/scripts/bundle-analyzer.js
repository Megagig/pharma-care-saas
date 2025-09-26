#!/usr/bin/env node

/**
 * Bundle Size Analyzer for MUI to shadcn Migration
 * Analyzes bundle size before and after MUI removal
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      beforeMigration: null,
      afterMigration: null,
      comparison: null,
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

  parseSize(sizeStr) {
    const units = { B: 1, K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^([0-9.]+)([BKMG]?)$/);
    if (!match) return 0;
    
    const [, size, unit] = match;
    return parseFloat(size) * (units[unit] || 1);
  }

  formatSize(bytes) {
    const units = ['B', 'K', 'M', 'G'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  async analyzeBundleSize() {
    this.log('📦 Analyzing current bundle size...');
    
    try {
      // Clean and build
      this.log('Cleaning previous build...');
      execSync('rm -rf dist', { cwd: projectRoot });
      
      this.log('Building for production...');
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
      
      // Get detailed bundle information
      const bundleInfo = await this.getBundleInfo();
      
      this.results.afterMigration = {
        ...bundleInfo,
        timestamp: new Date().toISOString()
      };
      
      this.log(`✅ Bundle analysis complete`, 'success');
      this.log(`   Total size: ${bundleInfo.totalSize}`, 'info');
      this.log(`   JS size: ${bundleInfo.jsSize}`, 'info');
      this.log(`   CSS size: ${bundleInfo.cssSize}`, 'info');
      
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async getBundleInfo() {
    const distPath = join(projectRoot, 'dist');
    
    if (!existsSync(distPath)) {
      throw new Error('Build directory not found');
    }

    // Get total size
    const totalSizeOutput = execSync('du -sh dist/', { cwd: projectRoot, encoding: 'utf8' });
    const totalSize = totalSizeOutput.split('\t')[0];

    // Get JS files
    let jsFiles = [];
    let jsSize = '0B';
    try {
      const jsOutput = execSync('find dist -name "*.js" -exec du -h {} \\;', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });
      jsFiles = jsOutput.split('\n').filter(line => line.trim()).map(line => {
        const [size, path] = line.split('\t');
        return { size, path: path.replace(distPath + '/', ''), bytes: this.parseSize(size) };
      });
      
      const totalJsBytes = jsFiles.reduce((sum, file) => sum + file.bytes, 0);
      jsSize = this.formatSize(totalJsBytes);
    } catch (e) {
      this.log('No JS files found or error reading JS files', 'warning');
    }

    // Get CSS files
    let cssFiles = [];
    let cssSize = '0B';
    try {
      const cssOutput = execSync('find dist -name "*.css" -exec du -h {} \\;', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });
      cssFiles = cssOutput.split('\n').filter(line => line.trim()).map(line => {
        const [size, path] = line.split('\t');
        return { size, path: path.replace(distPath + '/', ''), bytes: this.parseSize(size) };
      });
      
      const totalCssBytes = cssFiles.reduce((sum, file) => sum + file.bytes, 0);
      cssSize = this.formatSize(totalCssBytes);
    } catch (e) {
      this.log('No CSS files found or error reading CSS files', 'warning');
    }

    // Get asset files
    let assetFiles = [];
    try {
      const assetOutput = execSync('find dist -type f ! -name "*.js" ! -name "*.css" ! -name "*.html" -exec du -h {} \\;', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      });
      assetFiles = assetOutput.split('\n').filter(line => line.trim()).map(line => {
        const [size, path] = line.split('\t');
        return { size, path: path.replace(distPath + '/', ''), bytes: this.parseSize(size) };
      });
    } catch (e) {
      // Assets are optional
    }

    return {
      totalSize,
      totalBytes: this.parseSize(totalSize),
      jsSize,
      jsBytes: jsFiles.reduce((sum, file) => sum + file.bytes, 0),
      cssSize,
      cssBytes: cssFiles.reduce((sum, file) => sum + file.bytes, 0),
      jsFiles,
      cssFiles,
      assetFiles,
      fileCount: {
        js: jsFiles.length,
        css: cssFiles.length,
        assets: assetFiles.length,
        total: jsFiles.length + cssFiles.length + assetFiles.length
      }
    };
  }

  loadBaselineData() {
    const baselinePath = join(projectRoot, 'bundle-baseline.json');
    
    if (existsSync(baselinePath)) {
      try {
        const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
        this.results.beforeMigration = baseline;
        this.log('📊 Loaded baseline bundle data', 'info');
        return true;
      } catch (error) {
        this.log(`⚠️ Could not load baseline data: ${error.message}`, 'warning');
      }
    } else {
      this.log('📊 No baseline data found - this will be the new baseline', 'info');
    }
    
    return false;
  }

  saveBaseline() {
    const baselinePath = join(projectRoot, 'bundle-baseline.json');
    
    if (this.results.afterMigration) {
      writeFileSync(baselinePath, JSON.stringify(this.results.afterMigration, null, 2));
      this.log(`💾 Saved bundle baseline to ${baselinePath}`, 'success');
    }
  }

  compareWithBaseline() {
    if (!this.results.beforeMigration || !this.results.afterMigration) {
      this.log('⚠️ Cannot compare - missing baseline or current data', 'warning');
      return;
    }

    const before = this.results.beforeMigration;
    const after = this.results.afterMigration;

    const comparison = {
      totalSize: {
        before: before.totalSize,
        after: after.totalSize,
        change: after.totalBytes - before.totalBytes,
        changePercent: ((after.totalBytes - before.totalBytes) / before.totalBytes) * 100
      },
      jsSize: {
        before: before.jsSize,
        after: after.jsSize,
        change: after.jsBytes - before.jsBytes,
        changePercent: ((after.jsBytes - before.jsBytes) / before.jsBytes) * 100
      },
      cssSize: {
        before: before.cssSize,
        after: after.cssSize,
        change: after.cssBytes - before.cssBytes,
        changePercent: before.cssBytes > 0 ? ((after.cssBytes - before.cssBytes) / before.cssBytes) * 100 : 0
      },
      fileCount: {
        before: before.fileCount.total,
        after: after.fileCount.total,
        change: after.fileCount.total - before.fileCount.total
      }
    };

    this.results.comparison = comparison;

    this.log('📊 Bundle Size Comparison:', 'info');
    this.log(`   Total: ${before.totalSize} → ${after.totalSize} (${this.formatSize(comparison.totalSize.change)}, ${comparison.totalSize.changePercent.toFixed(1)}%)`, 
      comparison.totalSize.change < 0 ? 'success' : 'warning');
    this.log(`   JS: ${before.jsSize} → ${after.jsSize} (${this.formatSize(comparison.jsSize.change)}, ${comparison.jsSize.changePercent.toFixed(1)}%)`, 
      comparison.jsSize.change < 0 ? 'success' : 'warning');
    this.log(`   CSS: ${before.cssSize} → ${after.cssSize} (${this.formatSize(comparison.cssSize.change)}, ${comparison.cssSize.changePercent.toFixed(1)}%)`, 
      comparison.cssSize.change < 0 ? 'success' : 'warning');
  }

  analyzeDependencyImpact() {
    this.log('🔍 Analyzing dependency impact...');
    
    try {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
      
      const muiDeps = Object.keys(packageJson.dependencies || {})
        .filter(dep => dep.startsWith('@mui/') || dep.startsWith('@emotion/'));
      
      const shadcnDeps = Object.keys(packageJson.dependencies || {})
        .filter(dep => dep.startsWith('@radix-ui/') || dep === 'lucide-react' || dep === 'class-variance-authority');

      const analysis = {
        muiDependencies: muiDeps,
        shadcnDependencies: shadcnDeps,
        muiCount: muiDeps.length,
        shadcnCount: shadcnDeps.length,
        migrationComplete: muiDeps.length === 0
      };

      this.results.dependencyAnalysis = analysis;

      this.log(`   MUI dependencies: ${analysis.muiCount}`, analysis.muiCount === 0 ? 'success' : 'warning');
      this.log(`   shadcn/Radix dependencies: ${analysis.shadcnCount}`, 'info');
      
      if (analysis.muiCount > 0) {
        this.log('   Remaining MUI deps:', 'warning');
        muiDeps.forEach(dep => this.log(`     - ${dep}`, 'warning'));
      }

    } catch (error) {
      this.log(`❌ Dependency analysis failed: ${error.message}`, 'error');
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.comparison) {
      const { comparison } = this.results;
      
      if (comparison.totalSize.changePercent > 5) {
        recommendations.push('Bundle size increased by more than 5% - consider code splitting or tree shaking optimization');
      }
      
      if (comparison.jsSize.changePercent > 10) {
        recommendations.push('JavaScript bundle size increased significantly - review new dependencies and implement lazy loading');
      }
      
      if (comparison.totalSize.change < 0) {
        recommendations.push('Great! Bundle size decreased - migration is providing size benefits');
      }
    }

    if (this.results.dependencyAnalysis?.muiCount > 0) {
      recommendations.push('Complete MUI dependency removal to maximize bundle size reduction');
    }

    if (this.results.afterMigration?.fileCount.js > 10) {
      recommendations.push('Consider implementing code splitting to reduce the number of JavaScript chunks');
    }

    this.results.recommendations = recommendations;
  }

  generateReport() {
    this.log('📋 Generating bundle analysis report...');
    
    const reportPath = join(projectRoot, 'BUNDLE_ANALYSIS_REPORT.md');
    const jsonReportPath = join(projectRoot, 'bundle-analysis-report.json');
    
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
    
    return `# Bundle Size Analysis Report

**Generated:** ${results.timestamp}

## Current Bundle Size

${results.afterMigration ? `
- **Total Size:** ${results.afterMigration.totalSize}
- **JavaScript:** ${results.afterMigration.jsSize}
- **CSS:** ${results.afterMigration.cssSize}
- **File Count:** ${results.afterMigration.fileCount.total} files

### JavaScript Files
${results.afterMigration.jsFiles.map(file => `- \`${file.path}\`: ${file.size}`).join('\n')}

### CSS Files
${results.afterMigration.cssFiles.map(file => `- \`${file.path}\`: ${file.size}`).join('\n')}
` : 'Current bundle data not available'}

## Comparison with Baseline

${results.comparison ? `
| Metric | Before | After | Change | Change % |
|--------|--------|-------|--------|----------|
| Total Size | ${results.comparison.totalSize.before} | ${results.comparison.totalSize.after} | ${this.formatSize(results.comparison.totalSize.change)} | ${results.comparison.totalSize.changePercent.toFixed(1)}% |
| JavaScript | ${results.comparison.jsSize.before} | ${results.comparison.jsSize.after} | ${this.formatSize(results.comparison.jsSize.change)} | ${results.comparison.jsSize.changePercent.toFixed(1)}% |
| CSS | ${results.comparison.cssSize.before} | ${results.comparison.cssSize.after} | ${this.formatSize(results.comparison.cssSize.change)} | ${results.comparison.cssSize.changePercent.toFixed(1)}% |
| File Count | ${results.comparison.fileCount.before} | ${results.comparison.fileCount.after} | ${results.comparison.fileCount.change} | - |
` : 'No baseline data available for comparison'}

## Dependency Analysis

${results.dependencyAnalysis ? `
- **Migration Status:** ${results.dependencyAnalysis.migrationComplete ? '✅ Complete' : '⚠️ In Progress'}
- **MUI Dependencies:** ${results.dependencyAnalysis.muiCount}
- **shadcn/Radix Dependencies:** ${results.dependencyAnalysis.shadcnCount}

${results.dependencyAnalysis.muiCount > 0 ? `
### Remaining MUI Dependencies
${results.dependencyAnalysis.muiDependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}

### shadcn/Radix Dependencies
${results.dependencyAnalysis.shadcnDependencies.map(dep => `- ${dep}`).join('\n')}
` : 'Dependency analysis not available'}

## Recommendations

${results.recommendations.length > 0 ? 
  results.recommendations.map(rec => `- ${rec}`).join('\n') : 
  '- Bundle size is optimized and within acceptable ranges'
}

## Performance Impact

${results.comparison ? `
The migration has resulted in a **${results.comparison.totalSize.changePercent > 0 ? 'increase' : 'decrease'}** of **${Math.abs(results.comparison.totalSize.changePercent).toFixed(1)}%** in total bundle size.

${results.comparison.totalSize.changePercent < 0 ? 
  '✅ This is a positive outcome - the migration has reduced bundle size.' : 
  results.comparison.totalSize.changePercent < 5 ? 
    '✅ Bundle size increase is within acceptable limits (<5%).' : 
    '⚠️ Bundle size increase exceeds 5% - optimization recommended.'
}
` : 'Performance impact analysis requires baseline data'}

---
*Report generated by Bundle Analyzer*
`;
  }

  async run() {
    this.log('🚀 Starting Bundle Size Analysis', 'info');
    this.log('=' .repeat(50), 'info');

    // Load baseline if available
    this.loadBaselineData();

    // Analyze current bundle
    await this.analyzeBundleSize();

    // Compare with baseline
    this.compareWithBaseline();

    // Analyze dependencies
    this.analyzeDependencyImpact();

    // Generate recommendations
    this.generateRecommendations();

    // Generate reports
    this.generateReport();

    // Save new baseline if this is the first run
    if (!this.results.beforeMigration) {
      this.saveBaseline();
    }

    this.log('=' .repeat(50), 'info');
    this.log('🏁 Bundle Analysis Complete', 'info');

    if (this.results.comparison && this.results.comparison.totalSize.changePercent > 10) {
      this.log('⚠️ Significant bundle size increase detected', 'warning');
      return false;
    }

    this.log('✅ Bundle analysis completed successfully', 'success');
    return true;
  }
}

// Run the analyzer
const analyzer = new BundleAnalyzer();
analyzer.run().catch(error => {
  console.error('❌ Bundle analysis failed:', error);
  process.exit(1);
});