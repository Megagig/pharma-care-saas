#!/usr/bin/env node

/**
 * Lighthouse Accessibility Audit Runner
 * Runs Lighthouse accessibility audits on all pages and generates reports
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const LIGHTHOUSE_CONFIG = {
  outputDir: 'test-results/lighthouse',
  pages: [
    { name: 'Dashboard', url: 'http://localhost:5173/dashboard' },
    { name: 'Clinical Notes', url: 'http://localhost:5173/clinical-notes' },
    { name: 'Patients', url: 'http://localhost:5173/patients' },
    { name: 'Reports', url: 'http://localhost:5173/reports' },
    { name: 'Admin Dashboard', url: 'http://localhost:5173/admin' },
    { name: 'MTR Dashboard', url: 'http://localhost:5173/mtr' },
    { name: 'Diagnostics', url: 'http://localhost:5173/diagnostics' }
  ],
  themes: ['light', 'dark'],
  options: {
    onlyCategories: ['accessibility'],
    output: 'json',
    port: 0, // Use random port
    logLevel: 'info',
    disableDeviceEmulation: false,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  }
};

class LighthouseAccessibilityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAudits: 0,
        averageScore: 0,
        passedAudits: 0,
        failedAudits: 0,
        violations: []
      },
      detailed: {}
    };
    
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    const outputPath = path.join(process.cwd(), LIGHTHOUSE_CONFIG.outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }

  async runLighthouseAudit() {
    console.log('🚨 Starting Lighthouse Accessibility Audit...\n');
    
    let chrome;
    try {
      // Launch Chrome
      chrome = await chromeLauncher.launch({
        chromeFlags: LIGHTHOUSE_CONFIG.options.chromeFlags
      });
      
      const options = {
        ...LIGHTHOUSE_CONFIG.options,
        port: chrome.port
      };

      // Run audits for each page and theme combination
      for (const theme of LIGHTHOUSE_CONFIG.themes) {
        console.log(`\n🎨 Testing ${theme} theme...`);
        
        for (const page of LIGHTHOUSE_CONFIG.pages) {
          console.log(`  📄 Auditing ${page.name}...`);
          
          try {
            const result = await this.auditPage(page, theme, options);
            this.processResult(result, page, theme);
          } catch (error) {
            console.error(`    ❌ Failed to audit ${page.name}: ${error.message}`);
            this.recordError(page, theme, error);
          }
        }
      }

      // Generate comprehensive report
      await this.generateReport();
      
      console.log('\n✅ Lighthouse accessibility audit completed!');
      console.log(`📊 Report generated: ${LIGHTHOUSE_CONFIG.outputDir}/lighthouse-accessibility-report.md`);
      
    } catch (error) {
      console.error('❌ Lighthouse audit failed:', error.message);
      throw error;
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  async auditPage(page, theme, options) {
    // Set theme by injecting script
    const themeScript = `
      document.documentElement.classList.toggle('dark', '${theme}' === 'dark');
      localStorage.setItem('theme', '${theme}');
    `;

    const config = {
      extends: 'lighthouse:default',
      settings: {
        ...options,
        beforePass: themeScript
      }
    };

    const runnerResult = await lighthouse(page.url, options, config);
    return runnerResult;
  }

  processResult(result, page, theme) {
    const accessibilityCategory = result.lhr.categories.accessibility;
    const auditResults = result.lhr.audits;
    
    const pageKey = `${page.name}_${theme}`;
    
    this.results.detailed[pageKey] = {
      page: page.name,
      theme: theme,
      url: page.url,
      score: accessibilityCategory.score,
      scoreDisplayMode: accessibilityCategory.scoreDisplayMode,
      audits: this.extractAccessibilityAudits(auditResults),
      violations: this.extractViolations(auditResults),
      timestamp: new Date().toISOString()
    };

    // Update summary
    this.results.summary.totalAudits++;
    if (accessibilityCategory.score >= 0.9) {
      this.results.summary.passedAudits++;
    } else {
      this.results.summary.failedAudits++;
    }

    console.log(`    📊 Score: ${Math.round(accessibilityCategory.score * 100)}/100`);
  }

  extractAccessibilityAudits(audits) {
    const accessibilityAudits = {};
    
    // Key accessibility audits to track
    const keyAudits = [
      'color-contrast',
      'image-alt',
      'label',
      'link-name',
      'button-name',
      'document-title',
      'html-has-lang',
      'html-lang-valid',
      'meta-viewport',
      'aria-valid-attr',
      'aria-valid-attr-value',
      'aria-required-attr',
      'aria-roles',
      'aria-command-name',
      'aria-hidden-body',
      'aria-hidden-focus',
      'aria-input-field-name',
      'aria-meter-name',
      'aria-progressbar-name',
      'aria-required-children',
      'aria-required-parent',
      'aria-roledescription',
      'aria-toggle-field-name',
      'aria-tooltip-name',
      'aria-treeitem-name',
      'bypass',
      'definition-list',
      'dlitem',
      'duplicate-id-active',
      'duplicate-id-aria',
      'form-field-multiple-labels',
      'frame-title',
      'heading-order',
      'input-image-alt',
      'label-content-name-mismatch',
      'landmark-one-main',
      'list',
      'listitem',
      'meta-refresh',
      'object-alt',
      'role-img-alt',
      'scrollable-region-focusable',
      'skip-link',
      'tabindex',
      'table-fake-caption',
      'td-headers-attr',
      'th-has-data-cells',
      'valid-lang',
      'video-caption'
    ];

    keyAudits.forEach(auditId => {
      if (audits[auditId]) {
        const audit = audits[auditId];
        accessibilityAudits[auditId] = {
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          displayValue: audit.displayValue,
          details: audit.details
        };
      }
    });

    return accessibilityAudits;
  }

  extractViolations(audits) {
    const violations = [];
    
    Object.values(audits).forEach(audit => {
      if (audit.score !== null && audit.score < 1) {
        violations.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          impact: this.getImpactLevel(audit.score),
          details: audit.details
        });
      }
    });

    return violations;
  }

  getImpactLevel(score) {
    if (score === 0) return 'critical';
    if (score < 0.5) return 'serious';
    if (score < 0.9) return 'moderate';
    return 'minor';
  }

  recordError(page, theme, error) {
    const pageKey = `${page.name}_${theme}`;
    this.results.detailed[pageKey] = {
      page: page.name,
      theme: theme,
      url: page.url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    this.results.summary.totalAudits++;
    this.results.summary.failedAudits++;
  }

  async generateReport() {
    console.log('\n📊 Generating Lighthouse accessibility report...');
    
    // Calculate average score
    const scores = Object.values(this.results.detailed)
      .filter(result => result.score !== undefined)
      .map(result => result.score);
    
    this.results.summary.averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    const reportContent = this.generateMarkdownReport();
    const jsonReport = JSON.stringify(this.results, null, 2);
    
    // Write markdown report
    const reportPath = path.join(LIGHTHOUSE_CONFIG.outputDir, 'lighthouse-accessibility-report.md');
    fs.writeFileSync(reportPath, reportContent);
    
    // Write JSON report
    const jsonReportPath = path.join(LIGHTHOUSE_CONFIG.outputDir, 'lighthouse-accessibility-results.json');
    fs.writeFileSync(jsonReportPath, jsonReport);
    
    // Generate individual page reports
    await this.generateIndividualReports();
    
    console.log(`📄 Main report: ${reportPath}`);
    console.log(`📄 JSON data: ${jsonReportPath}`);
  }

  generateMarkdownReport() {
    const { summary, detailed } = this.results;
    const averageScore = Math.round(summary.averageScore * 100);

    return `# Lighthouse Accessibility Audit Report

## Executive Summary

**Audit Date:** ${new Date(this.results.timestamp).toLocaleString()}
**Total Audits:** ${summary.totalAudits}
**Passed Audits:** ${summary.passedAudits} (≥90% score)
**Failed Audits:** ${summary.failedAudits} (<90% score)
**Average Score:** ${averageScore}/100

## Overall Compliance Status

${summary.failedAudits === 0 ? '✅ **EXCELLENT**' : averageScore >= 90 ? '🟡 **GOOD**' : '❌ **NEEDS IMPROVEMENT**'} - Average accessibility score: ${averageScore}%

## Page-by-Page Results

${this.generatePageResults()}

## Common Issues Found

${this.generateCommonIssues()}

## Detailed Audit Results

${this.generateDetailedResults()}

## Recommendations

### High Priority
${this.generateHighPriorityRecommendations()}

### Medium Priority
${this.generateMediumPriorityRecommendations()}

### Best Practices
- Maintain accessibility score above 90%
- Run Lighthouse audits in CI/CD pipeline
- Test with actual screen readers
- Follow WCAG 2.1 AA guidelines
- Regular accessibility training for team

## Testing Configuration

- **Pages Tested:** ${LIGHTHOUSE_CONFIG.pages.length}
- **Themes Tested:** ${LIGHTHOUSE_CONFIG.themes.join(', ')}
- **Lighthouse Version:** Latest
- **Chrome Flags:** ${LIGHTHOUSE_CONFIG.options.chromeFlags.join(', ')}

---

*Generated by Lighthouse Accessibility Auditor*
`;
  }

  generatePageResults() {
    const results = Object.values(this.results.detailed);
    
    return results.map(result => {
      if (result.error) {
        return `### ${result.page} (${result.theme})
**Status:** ❌ Error
**Error:** ${result.error}
`;
      }

      const score = Math.round(result.score * 100);
      const status = score >= 90 ? '✅' : score >= 70 ? '🟡' : '❌';
      
      return `### ${result.page} (${result.theme})
**Score:** ${status} ${score}/100
**Violations:** ${result.violations.length}
**URL:** ${result.url}
`;
    }).join('\n');
  }

  generateCommonIssues() {
    const allViolations = Object.values(this.results.detailed)
      .filter(result => result.violations)
      .flatMap(result => result.violations);

    const issueCount = {};
    allViolations.forEach(violation => {
      issueCount[violation.id] = (issueCount[violation.id] || 0) + 1;
    });

    const sortedIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    if (sortedIssues.length === 0) {
      return 'No common issues found ✅';
    }

    return sortedIssues.map(([issueId, count]) => {
      const sampleViolation = allViolations.find(v => v.id === issueId);
      return `- **${sampleViolation.title}** (${count} occurrences) - ${sampleViolation.description}`;
    }).join('\n');
  }

  generateDetailedResults() {
    return Object.values(this.results.detailed)
      .filter(result => !result.error)
      .map(result => {
        const score = Math.round(result.score * 100);
        const criticalViolations = result.violations.filter(v => v.impact === 'critical');
        const seriousViolations = result.violations.filter(v => v.impact === 'serious');
        
        return `#### ${result.page} (${result.theme}) - ${score}/100

**Critical Issues:** ${criticalViolations.length}
**Serious Issues:** ${seriousViolations.length}
**Total Violations:** ${result.violations.length}

${result.violations.slice(0, 5).map(v => 
  `- **${v.title}** (${v.impact}) - ${v.description}`
).join('\n')}
`;
      }).join('\n');
  }

  generateHighPriorityRecommendations() {
    const criticalIssues = Object.values(this.results.detailed)
      .filter(result => result.violations)
      .flatMap(result => result.violations)
      .filter(violation => violation.impact === 'critical');

    if (criticalIssues.length === 0) {
      return 'No critical issues found ✅';
    }

    const uniqueIssues = [...new Set(criticalIssues.map(issue => issue.id))];
    return uniqueIssues.slice(0, 5).map(issueId => {
      const issue = criticalIssues.find(v => v.id === issueId);
      return `- Fix ${issue.title}: ${issue.description}`;
    }).join('\n');
  }

  generateMediumPriorityRecommendations() {
    const seriousIssues = Object.values(this.results.detailed)
      .filter(result => result.violations)
      .flatMap(result => result.violations)
      .filter(violation => violation.impact === 'serious');

    if (seriousIssues.length === 0) {
      return 'No serious issues found ✅';
    }

    const uniqueIssues = [...new Set(seriousIssues.map(issue => issue.id))];
    return uniqueIssues.slice(0, 5).map(issueId => {
      const issue = seriousIssues.find(v => v.id === issueId);
      return `- Improve ${issue.title}: ${issue.description}`;
    }).join('\n');
  }

  async generateIndividualReports() {
    for (const [key, result] of Object.entries(this.results.detailed)) {
      if (!result.error) {
        const individualReport = this.generateIndividualPageReport(result);
        const filePath = path.join(LIGHTHOUSE_CONFIG.outputDir, `${key}-report.md`);
        fs.writeFileSync(filePath, individualReport);
      }
    }
  }

  generateIndividualPageReport(result) {
    const score = Math.round(result.score * 100);
    
    return `# ${result.page} (${result.theme}) - Lighthouse Accessibility Report

**Score:** ${score}/100
**URL:** ${result.url}
**Audit Date:** ${new Date(result.timestamp).toLocaleString()}

## Violations (${result.violations.length})

${result.violations.map(violation => `
### ${violation.title} (${violation.impact})

**Score:** ${Math.round(violation.score * 100)}/100
**Description:** ${violation.description}

${violation.details ? '**Details:** ' + JSON.stringify(violation.details, null, 2) : ''}
`).join('\n')}

## Passed Audits

${Object.values(result.audits)
  .filter(audit => audit.score === 1)
  .map(audit => `- ✅ ${audit.title}`)
  .join('\n')}
`;
  }
}

// CLI execution
if (require.main === module) {
  const auditor = new LighthouseAccessibilityAuditor();
  auditor.runLighthouseAudit().catch(error => {
    console.error('Lighthouse audit failed:', error);
    process.exit(1);
  });
}

module.exports = LighthouseAccessibilityAuditor;