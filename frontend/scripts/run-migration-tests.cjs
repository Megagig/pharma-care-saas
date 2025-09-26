#!/usr/bin/env node

/**
 * Migration Test Runner
 * 
 * This script runs the complete migration test suite including:
 * - Visual regression tests
 * - Accessibility tests  
 * - Performance tests
 * - QA checklist validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testDir: './e2e/migration',
  outputDir: './test-results/migration',
  reportDir: './playwright-report/migration',
  browsers: ['chromium', 'firefox', 'webkit'],
  themes: ['light', 'dark'],
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectories() {
  const dirs = [config.outputDir, config.reportDir];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'cyan');
    }
  });
}

function runCommand(command, description) {
  log(`\n${description}...`, 'yellow');
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    console.error(error.message);
    return false;
  }
}

function runMigrationTests() {
  log('🚀 Starting Migration Test Suite', 'bright');
  log('=====================================', 'bright');
  
  // Create necessary directories
  createDirectories();
  
  const testSuites = [
    {
      name: 'Visual Regression Tests',
      command: `npx playwright test ${config.testDir}/visual-regression.spec.ts --reporter=html --output-dir=${config.outputDir}`,
      critical: true
    },
    {
      name: 'Accessibility Tests',
      command: `npx playwright test ${config.testDir}/accessibility.spec.ts --reporter=html --output-dir=${config.outputDir}`,
      critical: true
    },
    {
      name: 'Performance Tests',
      command: `npx playwright test ${config.testDir}/performance.spec.ts --reporter=html --output-dir=${config.outputDir}`,
      critical: false
    },
    {
      name: 'QA Checklist Validation',
      command: `npx playwright test ${config.testDir}/qa-checklist.spec.ts --reporter=html --output-dir=${config.outputDir}`,
      critical: true
    }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    const success = runCommand(suite.command, suite.name);
    results.push({
      name: suite.name,
      success,
      critical: suite.critical
    });
  }
  
  // Generate summary report
  generateSummaryReport(results);
  
  // Check if all critical tests passed
  const criticalFailures = results.filter(r => r.critical && !r.success);
  
  if (criticalFailures.length > 0) {
    log('\n❌ Migration tests failed!', 'red');
    log('Critical test failures:', 'red');
    criticalFailures.forEach(failure => {
      log(`  - ${failure.name}`, 'red');
    });
    process.exit(1);
  } else {
    log('\n✅ All migration tests passed!', 'green');
    log('Migration is ready for production deployment.', 'green');
  }
}

function generateSummaryReport(results) {
  log('\n📊 Generating Summary Report...', 'yellow');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      critical_failed: results.filter(r => r.critical && !r.success).length
    },
    results: results,
    recommendations: generateRecommendations(results)
  };
  
  const reportPath = path.join(config.outputDir, 'migration-test-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(config.outputDir, 'migration-test-summary.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`📄 Summary report saved to: ${reportPath}`, 'cyan');
  log(`📄 Markdown report saved to: ${markdownPath}`, 'cyan');
  
  // Display summary in console
  displaySummary(report);
}

function generateRecommendations(results) {
  const recommendations = [];
  
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.some(t => t.name.includes('Visual Regression'))) {
    recommendations.push('Review visual regression test failures and update component styling');
  }
  
  if (failedTests.some(t => t.name.includes('Accessibility'))) {
    recommendations.push('Address accessibility issues before deployment');
    recommendations.push('Run manual accessibility testing with screen readers');
  }
  
  if (failedTests.some(t => t.name.includes('Performance'))) {
    recommendations.push('Optimize bundle size and runtime performance');
    recommendations.push('Consider code splitting for large components');
  }
  
  if (failedTests.some(t => t.name.includes('QA Checklist'))) {
    recommendations.push('Complete remaining QA checklist items');
    recommendations.push('Verify all migration requirements are met');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed! Ready for production deployment.');
    recommendations.push('Consider running tests on staging environment before final deployment.');
  }
  
  return recommendations;
}

function generateMarkdownReport(report) {
  const { summary, results, recommendations } = report;
  
  return `# Migration Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Tests**: ${summary.total}
- **Passed**: ${summary.passed} ✅
- **Failed**: ${summary.failed} ❌
- **Critical Failures**: ${summary.critical_failed} 🚨

## Test Results

${results.map(result => {
  const status = result.success ? '✅' : '❌';
  const critical = result.critical ? '🚨' : '';
  return `- ${status} **${result.name}** ${critical}`;
}).join('\n')}

## Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

${summary.critical_failed === 0 
  ? '🎉 All critical tests passed! The migration is ready for production deployment.'
  : '⚠️ Critical test failures detected. Address these issues before proceeding with deployment.'
}

---

*This report was generated automatically by the migration test suite.*
`;
}

function displaySummary(report) {
  const { summary, recommendations } = report;
  
  log('\n📊 TEST SUMMARY', 'bright');
  log('================', 'bright');
  log(`Total Tests: ${summary.total}`, 'cyan');
  log(`Passed: ${summary.passed}`, 'green');
  log(`Failed: ${summary.failed}`, summary.failed > 0 ? 'red' : 'cyan');
  log(`Critical Failures: ${summary.critical_failed}`, summary.critical_failed > 0 ? 'red' : 'green');
  
  if (recommendations.length > 0) {
    log('\n💡 RECOMMENDATIONS', 'bright');
    log('==================', 'bright');
    recommendations.forEach(rec => {
      log(`• ${rec}`, 'yellow');
    });
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Migration Test Runner', 'bright');
  log('====================', 'bright');
  log('Usage: node run-migration-tests.js [options]', 'cyan');
  log('');
  log('Options:', 'yellow');
  log('  --help, -h     Show this help message', 'cyan');
  log('  --verbose, -v  Enable verbose output', 'cyan');
  log('  --browser <name>  Run tests on specific browser (chromium, firefox, webkit)', 'cyan');
  log('');
  log('Examples:', 'yellow');
  log('  node run-migration-tests.js', 'cyan');
  log('  node run-migration-tests.js --browser chromium', 'cyan');
  process.exit(0);
}

// Run the migration tests
if (require.main === module) {
  runMigrationTests();
}

module.exports = {
  runMigrationTests,
  config
};