// Health Check Script for PharmaCare SaaS Settings Module
const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const config = {
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
  endpoints: [
    {
      name: 'main',
      url: process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health',
      critical: true
    },
    {
      name: 'database',
      url: process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health/database',
      critical: true
    },
    {
      name: 'redis',
      url: process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health/redis',
      critical: false
    }
  ]
};

// Utility function to make HTTP requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(endpoint.url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'HealthCheck/1.0',
        'Accept': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve({
              name: endpoint.name,
              status: 'healthy',
              statusCode: res.statusCode,
              response: response,
              critical: endpoint.critical
            });
          } catch (error) {
            resolve({
              name: endpoint.name,
              status: 'healthy',
              statusCode: res.statusCode,
              response: { message: data },
              critical: endpoint.critical
            });
          }
        } else {
          reject({
            name: endpoint.name,
            status: 'unhealthy',
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`,
            critical: endpoint.critical
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        name: endpoint.name,
        status: 'unhealthy',
        error: error.message,
        critical: endpoint.critical
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        name: endpoint.name,
        status: 'unhealthy',
        error: 'Request timeout',
        critical: endpoint.critical
      });
    });

    req.end();
  });
}

// Retry mechanism
async function checkEndpointWithRetry(endpoint) {
  let lastError;
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const result = await makeRequest(endpoint);
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < config.retries) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  return lastError;
}

// Main health check function
async function performHealthCheck() {
  const results = [];
  let overallHealthy = true;
  
  console.log('Starting health check...');
  
  // Check all endpoints
  for (const endpoint of config.endpoints) {
    try {
      const result = await checkEndpointWithRetry(endpoint);
      results.push(result);
      
      if (result.status === 'unhealthy' && result.critical) {
        overallHealthy = false;
      }
      
      console.log(`${endpoint.name}: ${result.status} (${result.statusCode || 'N/A'})`);
    } catch (error) {
      const errorResult = {
        name: endpoint.name,
        status: 'unhealthy',
        error: error.message,
        critical: endpoint.critical
      };
      
      results.push(errorResult);
      
      if (endpoint.critical) {
        overallHealthy = false;
      }
      
      console.log(`${endpoint.name}: unhealthy - ${error.message}`);
    }
  }
  
  // Summary
  const summary = {
    overall: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    unhealthy: results.filter(r => r.status === 'unhealthy').length,
    critical_failures: results.filter(r => r.status === 'unhealthy' && r.critical).length
  };
  
  console.log('\nHealth Check Summary:');
  console.log(`Overall Status: ${summary.overall}`);
  console.log(`Healthy Checks: ${summary.healthy}/${summary.checks}`);
  console.log(`Critical Failures: ${summary.critical_failures}`);
  
  // Output detailed results if verbose mode
  if (process.env.HEALTH_CHECK_VERBOSE === 'true') {
    console.log('\nDetailed Results:');
    console.log(JSON.stringify(results, null, 2));
  }
  
  return overallHealthy;
}

// Enhanced health check for Docker
async function dockerHealthCheck() {
  try {
    // Quick check for the main application endpoint
    const result = await makeRequest({
      name: 'docker-health',
      url: 'http://localhost:3000/health',
      critical: true
    });
    
    if (result.status === 'healthy') {
      console.log('Docker health check: PASSED');
      process.exit(0);
    } else {
      console.log('Docker health check: FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.log(`Docker health check: FAILED - ${error.error || error.message}`);
    process.exit(1);
  }
}

// Process monitoring
function checkProcessHealth() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // Memory threshold check (1GB)
  const memoryThreshold = 1024 * 1024 * 1024;
  if (memoryUsage.heapUsed > memoryThreshold) {
    console.warn(`High memory usage detected: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  }
  
  // Uptime check (minimum 30 seconds for stability)
  if (uptime < 30) {
    console.warn(`Process recently started: ${uptime}s uptime`);
  }
  
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    uptime: Math.round(uptime),
    pid: process.pid
  };
}

// Main execution
async function main() {
  // Check if running in Docker health check mode
  if (process.argv.includes('--docker')) {
    return dockerHealthCheck();
  }
  
  try {
    // Perform comprehensive health check
    const isHealthy = await performHealthCheck();
    
    // Check process health
    const processHealth = checkProcessHealth();
    console.log('\nProcess Health:');
    console.log(`Memory Usage: ${processHealth.memory.used}MB / ${processHealth.memory.total}MB`);
    console.log(`Uptime: ${processHealth.uptime}s`);
    console.log(`PID: ${processHealth.pid}`);
    
    // Exit with appropriate code
    if (isHealthy) {
      console.log('\n✅ All health checks passed');
      process.exit(0);
    } else {
      console.log('\n❌ Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Health check error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in health check:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in health check:', reason);
  process.exit(1);
});

// Run health check
if (require.main === module) {
  main();
}

module.exports = {
  performHealthCheck,
  checkProcessHealth,
  dockerHealthCheck
};