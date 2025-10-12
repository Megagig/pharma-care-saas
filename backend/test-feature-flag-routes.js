/**
 * Test script to verify feature flag routes are accessible
 * This script checks if the routes are properly registered
 */

const http = require('http');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test endpoints
const endpoints = [
  {
    method: 'GET',
    path: '/api/feature-flags',
    description: 'Get all feature flags',
    expectedStatus: [200, 401], // 401 if not authenticated
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    expectedStatus: [200],
  },
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: endpoint.method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const isExpectedStatus = endpoint.expectedStatus.includes(res.statusCode);
        
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: res.statusCode,
          success: isExpectedStatus,
          description: endpoint.description,
          message: isExpectedStatus 
            ? '✓ Route is accessible' 
            : `✗ Unexpected status code: ${res.statusCode}`,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'ERROR',
        success: false,
        description: endpoint.description,
        message: `✗ Connection error: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'TIMEOUT',
        success: false,
        description: endpoint.description,
        message: '✗ Request timeout',
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Feature Flag Routes Accessibility Test');
  console.log('='.repeat(60));
  console.log(`Testing API at: ${API_BASE_URL}`);
  console.log('');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    console.log(`${result.method} ${result.endpoint}`);
    console.log(`  Description: ${result.description}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  ${result.message}`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('✓ All routes are properly registered and accessible!');
  } else {
    console.log('✗ Some routes failed. Please check the server is running.');
    console.log('  Start the server with: npm run dev');
  }
  
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running first
console.log('Checking if backend server is running...');
console.log('If the server is not running, start it with: npm run dev');
console.log('');

setTimeout(() => {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}, 1000);
