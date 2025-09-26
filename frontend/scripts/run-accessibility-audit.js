#!/usr/bin/env node

/**
 * Comprehensive Accessibility Audit Runner
 * Runs automated and manual accessibility tests and generates detailed reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIT_CONFIG = {
  outputDir: 'test-results/accessibility',
  reportFile: 'accessibility-audit-report.md',
  jsonReportFile: 'accessibility-audit-results.json',
  browsers: ['chromium', 'firefox', 'webkit'],
  themes: ['light', 'dark'],
  pages: [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Clinical Notes', url: '/clinical-notes' },
    { name: 'Patients', url: '/patients' },
    { name: 'Reports', url: '/reports' },
    { name: 'Admin Dashboard', url: '/admin' },
    { name: 'MTR Dashboard', url: '/mtr' },
    { name: 'Diagnostics', url: '/diagnostics' }
  ]
};

class AccessibilityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        violations: [],
        warnings: []
      },
      detailed: {
        axeCore: {},
        keyboardNavigation: {},
        screenReader: {},
        colorContrast: {},
        focusManagement: {}
      }
    };
    
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    const outputPath = path.join(process.cwd(), AUDIT_CONFIG.outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }

  async runFullAudit() {
    console.log('🔍 Starting Comprehensive Accessibility Audit...\n');
    
    try {
      // 1. Run automated axe-core tests
      await this.runAxeCoreTests();
      
      // 2. Run keyboard navigation tests
      await this.runKeyboardNavigationTests();
      
      // 3. Run screen reader compatibility tests
      await this.runScreenReaderTests();
      
      // 4. Run color contrast tests
      await this.runColorContrastTests();
      
      // 5. Run focus management tests
      await this.runFocusManagementTests();
      
      // 6. Generate comprehensive report
      await this.generateReport();
      
      console.log('✅ Accessibility audit completed successfully!');
      console.log(`📊 Report generated: ${AUDIT_CONFIG.outputDir}/${AUDIT_CONFIG.reportFile}`);
      
    } catch (error) {
      console.error('❌ Accessibility audit failed:', error.message);
      process.exit(1);
    }
  }

  async runAxeCoreTests() {
    console.log('🔧 Running axe-core automated tests...');
    
    try {
      const command = `npx playwright test e2e/migration/accessibility-audit.spec.ts --grep "Automated axe-core Testing" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      this.results.detailed.axeCore = this.parsePlaywrightResults(output);
      this.results.summary.totalTests += this.results.detailed.axeCore.totalTests || 0;
      this.results.summary.passedTests += this.results.detailed.axeCore.passedTests || 0;
      this.results.summary.failedTests += this.results.detailed.axeCore.failedTests || 0;
      
      console.log('✅ axe-core tests completed');
    } catch (error) {
      console.error('❌ axe-core tests failed:', error.message);
      this.results.detailed.axeCore = { error: error.message };
    }
  }

  async runKeyboardNavigationTests() {
    console.log('⌨️  Running keyboard navigation tests...');
    
    try {
      const command = `npx playwright test e2e/migration/accessibility-audit.spec.ts --grep "Keyboard Navigation Testing" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      this.results.detailed.keyboardNavigation = this.parsePlaywrightResults(output);
      this.results.summary.totalTests += this.results.detailed.keyboardNavigation.totalTests || 0;
      this.results.summary.passedTests += this.results.detailed.keyboardNavigation.passedTests || 0;
      this.results.summary.failedTests += this.results.detailed.keyboardNavigation.failedTests || 0;
      
      console.log('✅ Keyboard navigation tests completed');
    } catch (error) {
      console.error('❌ Keyboard navigation tests failed:', error.message);
      this.results.detailed.keyboardNavigation = { error: error.message };
    }
  }

  async runScreenReaderTests() {
    console.log('🔊 Running screen reader compatibility tests...');
    
    try {
      const command = `npx playwright test e2e/migration/accessibility-audit.spec.ts --grep "Screen Reader Compatibility" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      this.results.detailed.screenReader = this.parsePlaywrightResults(output);
      this.results.summary.totalTests += this.results.detailed.screenReader.totalTests || 0;
      this.results.summary.passedTests += this.results.detailed.screenReader.passedTests || 0;
      this.results.summary.failedTests += this.results.detailed.screenReader.failedTests || 0;
      
      console.log('✅ Screen reader tests completed');
    } catch (error) {
      console.error('❌ Screen reader tests failed:', error.message);
      this.results.detailed.screenReader = { error: error.message };
    }
  }

  async runColorContrastTests() {
    console.log('🎨 Running color contrast tests...');
    
    try {
      const command = `npx playwright test e2e/migration/accessibility-audit.spec.ts --grep "Color Contrast Testing" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      this.results.detailed.colorContrast = this.parsePlaywrightResults(output);
      this.results.summary.totalTests += this.results.detailed.colorContrast.totalTests || 0;
      this.results.summary.passedTests += this.results.detailed.colorContrast.passedTests || 0;
      this.results.summary.failedTests += this.results.detailed.colorContrast.failedTests || 0;
      
      console.log('✅ Color contrast tests completed');
    } catch (error) {
      console.error('❌ Color contrast tests failed:', error.message);
      this.results.detailed.colorContrast = { error: error.message };
    }
  }

  async runFocusManagementTests() {
    console.log('🎯 Running focus management tests...');
    
    try {
      const command = `npx playwright test e2e/migration/accessibility-audit.spec.ts --grep "Focus Management Testing" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      this.results.detailed.focusManagement = this.parsePlaywrightResults(output);
      this.results.summary.totalTests += this.results.detailed.focusManagement.totalTests || 0;
      this.results.summary.passedTests += this.results.detailed.focusManagement.passedTests || 0;
      this.results.summary.failedTests += this.results.detailed.focusManagement.failedTests || 0;
      
      console.log('✅ Focus management tests completed');
    } catch (error) {
      console.error('❌ Focus management tests failed:', error.message);
      this.results.detailed.focusManagement = { error: error.message };
    }
  }

  parsePlaywrightResults(output) {
    try {
      const results = JSON.parse(output);
      return {
        totalTests: results.stats?.total || 0,
        passedTests: results.stats?.passed || 0,
        failedTests: results.stats?.failed || 0,
        duration: results.stats?.duration || 0,
        tests: results.tests || []
      };
    } catch (error) {
      return { error: 'Failed to parse test results' };
    }
  }

  async generateReport() {
    console.log('📊 Generating accessibility audit report...');
    
    const reportContent = this.generateMarkdownReport();
    const jsonReport = JSON.stringify(this.results, null, 2);
    
    // Write markdown report
    const reportPath = path.join(AUDIT_CONFIG.outputDir, AUDIT_CONFIG.reportFile);
    fs.writeFileSync(reportPath, reportContent);
    
    // Write JSON report
    const jsonReportPath = path.join(AUDIT_CONFIG.outputDir, AUDIT_CONFIG.jsonReportFile);
    fs.writeFileSync(jsonReportPath, jsonReport);
    
    console.log(`📄 Markdown report: ${reportPath}`);
    console.log(`📄 JSON report: ${jsonReportPath}`);
  }

  generateMarkdownReport() {
    const { summary, detailed } = this.results;
    const successRate = summary.totalTests > 0 ? 
      ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0;

    return `# Comprehensive Accessibility Audit Report

## Executive Summary

**Audit Date:** ${new Date(this.results.timestamp).toLocaleString()}
**Total Tests:** ${summary.totalTests}
**Passed Tests:** ${summary.passedTests}
**Failed Tests:** ${summary.failedTests}
**Success Rate:** ${successRate}%

## WCAG 2.1 AA Compliance Status

${summary.failedTests === 0 ? '✅ **COMPLIANT**' : '❌ **NON-COMPLIANT**'} - ${summary.failedTests} violations found

## Test Categories

### 1. Automated axe-core Testing
${this.generateCategoryReport(detailed.axeCore, 'Automated accessibility scanning using axe-core')}

### 2. Keyboard Navigation Testing
${this.generateCategoryReport(detailed.keyboardNavigation, 'Manual keyboard navigation and interaction testing')}

### 3. Screen Reader Compatibility
${this.generateCategoryReport(detailed.screenReader, 'ARIA attributes and screen reader compatibility testing')}

### 4. Color Contrast Testing
${this.generateCategoryReport(detailed.colorContrast, 'WCAG 2.1 AA color contrast ratio validation')}

### 5. Focus Management Testing
${this.generateCategoryReport(detailed.focusManagement, 'Focus trapping, restoration, and skip link testing')}

## Detailed Findings

### Critical Issues
${this.generateIssuesList(summary.violations, 'critical')}

### Warnings
${this.generateIssuesList(summary.warnings, 'warning')}

## Recommendations

### Immediate Actions Required
${summary.failedTests > 0 ? `
- Fix ${summary.failedTests} failing accessibility tests
- Review and address all critical violations
- Implement proper ARIA attributes where missing
- Ensure keyboard navigation works for all interactive elements
` : '- No immediate actions required - all tests passing ✅'}

### Best Practices
- Regularly run accessibility audits during development
- Include accessibility testing in CI/CD pipeline
- Train development team on WCAG 2.1 AA guidelines
- Implement automated accessibility testing tools

## Testing Environment

- **Browsers Tested:** ${AUDIT_CONFIG.browsers.join(', ')}
- **Themes Tested:** ${AUDIT_CONFIG.themes.join(', ')}
- **Pages Tested:** ${AUDIT_CONFIG.pages.map(p => p.name).join(', ')}

## Next Steps

1. Address all failing tests identified in this report
2. Implement fixes for critical accessibility violations
3. Re-run audit to verify fixes
4. Schedule regular accessibility audits (monthly recommended)
5. Consider manual testing with actual assistive technologies

---

*This report was generated automatically by the Accessibility Audit Runner*
*For questions or support, contact the development team*
`;
  }

  generateCategoryReport(categoryData, description) {
    if (categoryData.error) {
      return `
**Status:** ❌ Error
**Description:** ${description}
**Error:** ${categoryData.error}
`;
    }

    const passed = categoryData.passedTests || 0;
    const failed = categoryData.failedTests || 0;
    const total = categoryData.totalTests || 0;
    const status = failed === 0 ? '✅ Passed' : '❌ Failed';

    return `
**Status:** ${status}
**Description:** ${description}
**Tests:** ${passed}/${total} passed
**Duration:** ${categoryData.duration || 0}ms
`;
  }

  generateIssuesList(issues, type) {
    if (!issues || issues.length === 0) {
      return `No ${type} issues found ✅`;
    }

    return issues.map(issue => `- ${issue.description} (${issue.page})`).join('\n');
  }
}

// CLI execution
if (require.main === module) {
  const auditor = new AccessibilityAuditor();
  auditor.runFullAudit().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

module.exports = AccessibilityAuditor;