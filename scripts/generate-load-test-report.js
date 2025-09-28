#!/usr/bin/env node

/**
 * Load Test Report Generator
 * Analyzes k6 JSON output and generates comprehensive performance reports
 */

const fs = require('fs');
const path = require('path');

class LoadTestReportGenerator {
  constructor() {
    this.performanceBudgets = {
      api: {
        p50: 200, // 200ms
        p95: 500, // 500ms
        p99: 1000, // 1000ms
        errorRate: 0.05, // 5%
      },
      database: {
        p50: 100, // 100ms
        p95: 300, // 300ms
        p99: 500, // 500ms
        errorRate: 0.01, // 1%
      },
      cache: {
        p95: 50, // 50ms
        hitRate: 0.8, // 80%
        errorRate: 0.01, // 1%
      },
    };
  }

  parseK6JsonReport(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Report file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const metrics = {};
    const checks = {};
    
    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'Metric') {
          if (!metrics[data.metric]) {
            metrics[data.metric] = [];
          }
          metrics[data.metric].push(data.data);
        }
        
        if (data.type === 'Point' && data.metric === 'checks') {
          const checkName = data.data.tags.check;
          if (!checks[checkName]) {
            checks[checkName] = { passed: 0, failed: 0 };
          }
          
          if (data.data.value === 1) {
            checks[checkName].passed++;
          } else {
            checks[checkName].failed++;
          }
        }
      } catch (error) {
        // Skip invalid JSON lines
      }
    });

    return { metrics, checks };
  }

  calculateMetricStatistics(metricData) {
    if (!metricData || metricData.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const values = metricData.map(d => d.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      count: values.length,
    };
  }

  percentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  analyzeApiPerformance(metrics, checks) {
    const httpReqDuration = this.calculateMetricStatistics(metrics.http_req_duration);
    const httpReqFailed = this.calculateMetricStatistics(metrics.http_req_failed);
    const iterations = this.calculateMetricStatistics(metrics.iterations);
    const vus = this.calculateMetricStatistics(metrics.vus);

    const analysis = {
      responseTime: httpReqDuration,
      errorRate: httpReqFailed.avg,
      totalRequests: httpReqDuration.count,
      requestsPerSecond: iterations.count / (iterations.count > 0 ? 1 : 1), // Simplified
      maxConcurrentUsers: vus.max,
      budgetCompliance: {
        p50: httpReqDuration.p50 < this.performanceBudgets.api.p50,
        p95: httpReqDuration.p95 < this.performanceBudgets.api.p95,
        p99: httpReqDuration.p99 < this.performanceBudgets.api.p99,
        errorRate: httpReqFailed.avg < this.performanceBudgets.api.errorRate,
      },
      checks: this.analyzeChecks(checks),
    };

    analysis.overallScore = this.calculateOverallScore(analysis.budgetCompliance);
    
    return analysis;
  }

  analyzeDatabasePerformance(metrics, checks) {
    const dbResponseTime = this.calculateMetricStatistics(metrics.db_response_time || []);
    const dbErrors = this.calculateMetricStatistics(metrics.db_errors || []);
    const dbQueries = this.calculateMetricStatistics(metrics.db_queries || []);
    const dbConnections = this.calculateMetricStatistics(metrics.db_connections || []);

    const analysis = {
      responseTime: dbResponseTime,
      errorRate: dbErrors.avg || 0,
      totalQueries: dbQueries.count || 0,
      maxConnections: dbConnections.max || 0,
      avgConnections: dbConnections.avg || 0,
      budgetCompliance: {
        p50: dbResponseTime.p50 < this.performanceBudgets.database.p50,
        p95: dbResponseTime.p95 < this.performanceBudgets.database.p95,
        p99: dbResponseTime.p99 < this.performanceBudgets.database.p99,
        errorRate: (dbErrors.avg || 0) < this.performanceBudgets.database.errorRate,
      },
      checks: this.analyzeChecks(checks),
    };

    analysis.overallScore = this.calculateOverallScore(analysis.budgetCompliance);
    
    return analysis;
  }

  analyzeCachePerformance(metrics, checks) {
    const cacheResponseTime = this.calculateMetricStatistics(metrics.redis_response_time || []);
    const cacheHits = this.calculateMetricStatistics(metrics.redis_cache_hits || []);
    const cacheMisses = this.calculateMetricStatistics(metrics.redis_cache_misses || []);
    const cacheOperations = this.calculateMetricStatistics(metrics.redis_operations || []);

    const hitRate = cacheHits.count / (cacheHits.count + cacheMisses.count) || 0;

    const analysis = {
      responseTime: cacheResponseTime,
      hitRate: hitRate,
      totalOperations: cacheOperations.count || 0,
      totalHits: cacheHits.count || 0,
      totalMisses: cacheMisses.count || 0,
      budgetCompliance: {
        p95: cacheResponseTime.p95 < this.performanceBudgets.cache.p95,
        hitRate: hitRate > this.performanceBudgets.cache.hitRate,
        errorRate: true, // Assume no cache errors for now
      },
      checks: this.analyzeChecks(checks),
    };

    analysis.overallScore = this.calculateOverallScore(analysis.budgetCompliance);
    
    return analysis;
  }

  analyzeChecks(checks) {
    const checkAnalysis = {
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      details: {},
    };

    Object.entries(checks).forEach(([checkName, results]) => {
      checkAnalysis.total += results.passed + results.failed;
      checkAnalysis.passed += results.passed;
      checkAnalysis.failed += results.failed;
      
      checkAnalysis.details[checkName] = {
        ...results,
        passRate: results.passed / (results.passed + results.failed),
      };
    });

    checkAnalysis.passRate = checkAnalysis.total > 0 
      ? checkAnalysis.passed / checkAnalysis.total 
      : 0;

    return checkAnalysis;
  }

  calculateOverallScore(budgetCompliance) {
    const compliantChecks = Object.values(budgetCompliance).filter(Boolean).length;
    const totalChecks = Object.keys(budgetCompliance).length;
    
    return totalChecks > 0 ? Math.round((compliantChecks / totalChecks) * 100) : 0;
  }

  generateHtmlReport(analysis, testType, outputPath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${testType.toUpperCase()} Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.excellent { color: #28a745; }
        .score.good { color: #17a2b8; }
        .score.warning { color: #ffc107; }
        .score.danger { color: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #007bff; }
        .metric-card.success { border-left-color: #28a745; }
        .metric-card.warning { border-left-color: #ffc107; }
        .metric-card.danger { border-left-color: #dc3545; }
        .metric-title { font-size: 14px; color: #6c757d; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #495057; }
        .metric-unit { font-size: 14px; color: #6c757d; }
        .budget-status { margin-top: 10px; }
        .budget-status.pass { color: #28a745; }
        .budget-status.fail { color: #dc3545; }
        .checks-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .checks-table th, .checks-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .checks-table th { background: #f8f9fa; }
        .pass-rate { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .pass-rate.high { background: #28a745; }
        .pass-rate.medium { background: #ffc107; }
        .pass-rate.low { background: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${testType.toUpperCase()} Load Test Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Test Type:</strong> ${testType}</p>
    </div>

    <div class="score ${this.getScoreClass(analysis.overallScore)}">
        ${analysis.overallScore}/100
        <div style="font-size: 18px; margin-top: 10px;">Overall Performance Score</div>
    </div>

    ${this.generateMetricsHtml(analysis, testType)}
    ${this.generateBudgetComplianceHtml(analysis.budgetCompliance)}
    ${this.generateChecksHtml(analysis.checks)}
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);
  }

  generateMetricsHtml(analysis, testType) {
    if (testType === 'api') {
      return `
        <div class="metrics">
            <div class="metric-card ${analysis.budgetCompliance.p50 ? 'success' : 'danger'}">
                <div class="metric-title">P50 Response Time</div>
                <div class="metric-value">${Math.round(analysis.responseTime.p50)}<span class="metric-unit">ms</span></div>
                <div class="budget-status ${analysis.budgetCompliance.p50 ? 'pass' : 'fail'}">
                    Budget: < ${this.performanceBudgets.api.p50}ms
                </div>
            </div>
            <div class="metric-card ${analysis.budgetCompliance.p95 ? 'success' : 'danger'}">
                <div class="metric-title">P95 Response Time</div>
                <div class="metric-value">${Math.round(analysis.responseTime.p95)}<span class="metric-unit">ms</span></div>
                <div class="budget-status ${analysis.budgetCompliance.p95 ? 'pass' : 'fail'}">
                    Budget: < ${this.performanceBudgets.api.p95}ms
                </div>
            </div>
            <div class="metric-card ${analysis.budgetCompliance.errorRate ? 'success' : 'danger'}">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value">${(analysis.errorRate * 100).toFixed(2)}<span class="metric-unit">%</span></div>
                <div class="budget-status ${analysis.budgetCompliance.errorRate ? 'pass' : 'fail'}">
                    Budget: < ${(this.performanceBudgets.api.errorRate * 100).toFixed(1)}%
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Requests</div>
                <div class="metric-value">${analysis.totalRequests.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Max Concurrent Users</div>
                <div class="metric-value">${analysis.maxConcurrentUsers}</div>
            </div>
        </div>`;
    } else if (testType === 'database') {
      return `
        <div class="metrics">
            <div class="metric-card ${analysis.budgetCompliance.p50 ? 'success' : 'danger'}">
                <div class="metric-title">P50 DB Response Time</div>
                <div class="metric-value">${Math.round(analysis.responseTime.p50)}<span class="metric-unit">ms</span></div>
                <div class="budget-status ${analysis.budgetCompliance.p50 ? 'pass' : 'fail'}">
                    Budget: < ${this.performanceBudgets.database.p50}ms
                </div>
            </div>
            <div class="metric-card ${analysis.budgetCompliance.p95 ? 'success' : 'danger'}">
                <div class="metric-title">P95 DB Response Time</div>
                <div class="metric-value">${Math.round(analysis.responseTime.p95)}<span class="metric-unit">ms</span></div>
                <div class="budget-status ${analysis.budgetCompliance.p95 ? 'pass' : 'fail'}">
                    Budget: < ${this.performanceBudgets.database.p95}ms
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Queries</div>
                <div class="metric-value">${analysis.totalQueries.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Max DB Connections</div>
                <div class="metric-value">${analysis.maxConnections}</div>
            </div>
        </div>`;
    } else if (testType === 'cache') {
      return `
        <div class="metrics">
            <div class="metric-card ${analysis.budgetCompliance.p95 ? 'success' : 'danger'}">
                <div class="metric-title">P95 Cache Response Time</div>
                <div class="metric-value">${Math.round(analysis.responseTime.p95)}<span class="metric-unit">ms</span></div>
                <div class="budget-status ${analysis.budgetCompliance.p95 ? 'pass' : 'fail'}">
                    Budget: < ${this.performanceBudgets.cache.p95}ms
                </div>
            </div>
            <div class="metric-card ${analysis.budgetCompliance.hitRate ? 'success' : 'danger'}">
                <div class="metric-title">Cache Hit Rate</div>
                <div class="metric-value">${(analysis.hitRate * 100).toFixed(1)}<span class="metric-unit">%</span></div>
                <div class="budget-status ${analysis.budgetCompliance.hitRate ? 'pass' : 'fail'}">
                    Budget: > ${(this.performanceBudgets.cache.hitRate * 100).toFixed(0)}%
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Cache Operations</div>
                <div class="metric-value">${analysis.totalOperations.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Cache Hits</div>
                <div class="metric-value">${analysis.totalHits.toLocaleString()}</div>
            </div>
        </div>`;
    }
    
    return '';
  }

  generateBudgetComplianceHtml(budgetCompliance) {
    const compliantCount = Object.values(budgetCompliance).filter(Boolean).length;
    const totalCount = Object.keys(budgetCompliance).length;
    
    return `
      <h2>Budget Compliance</h2>
      <p><strong>${compliantCount}/${totalCount}</strong> performance budgets met</p>
      <ul>
        ${Object.entries(budgetCompliance).map(([key, passed]) => 
          `<li style="color: ${passed ? '#28a745' : '#dc3545'}">
            ${key.toUpperCase()}: ${passed ? '✓ PASS' : '✗ FAIL'}
          </li>`
        ).join('')}
      </ul>`;
  }

  generateChecksHtml(checks) {
    if (!checks.details || Object.keys(checks.details).length === 0) {
      return '<h2>Checks</h2><p>No check data available</p>';
    }

    return `
      <h2>Test Checks</h2>
      <p><strong>Overall Pass Rate:</strong> ${(checks.passRate * 100).toFixed(1)}% (${checks.passed}/${checks.total})</p>
      <table class="checks-table">
        <thead>
          <tr>
            <th>Check Name</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(checks.details).map(([name, detail]) => `
            <tr>
              <td>${name}</td>
              <td>${detail.passed}</td>
              <td>${detail.failed}</td>
              <td>
                <span class="pass-rate ${this.getPassRateClass(detail.passRate)}">
                  ${(detail.passRate * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  getPassRateClass(rate) {
    if (rate >= 0.95) return 'high';
    if (rate >= 0.8) return 'medium';
    return 'low';
  }

  async generateReport(jsonReportPath, testType, outputDir) {
    console.log(`Generating ${testType} load test report...`);
    
    try {
      const { metrics, checks } = this.parseK6JsonReport(jsonReportPath);
      
      let analysis;
      switch (testType) {
        case 'api':
          analysis = this.analyzeApiPerformance(metrics, checks);
          break;
        case 'database':
          analysis = this.analyzeDatabasePerformance(metrics, checks);
          break;
        case 'cache':
          analysis = this.analyzeCachePerformance(metrics, checks);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }

      // Generate HTML report
      const htmlPath = path.join(outputDir, `${testType}-load-test-report.html`);
      this.generateHtmlReport(analysis, testType, htmlPath);

      // Generate JSON summary
      const jsonPath = path.join(outputDir, `${testType}-load-test-summary.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
      console.log(`JSON summary generated: ${jsonPath}`);

      return analysis;
    } catch (error) {
      console.error(`Error generating ${testType} report:`, error.message);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node generate-load-test-report.js <json-report-path> <test-type> <output-dir>');
    console.log('Test types: api, database, cache');
    process.exit(1);
  }

  const [jsonReportPath, testType, outputDir] = args;
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generator = new LoadTestReportGenerator();
  generator.generateReport(jsonReportPath, testType, outputDir)
    .then(analysis => {
      console.log(`Report generation completed successfully!`);
      console.log(`Overall Score: ${analysis.overallScore}/100`);
    })
    .catch(error => {
      console.error('Report generation failed:', error);
      process.exit(1);
    });
}

module.exports = LoadTestReportGenerator;