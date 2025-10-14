#!/usr/bin/env node

/**
 * CORS Fix Verification Script
 * Tests if the backend properly handles CORS requests from the production frontend
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const FRONTEND_ORIGIN = 'https://PharmaPilot-nttq.onrender.com';

console.log('🔍 Testing CORS configuration...');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend Origin: ${FRONTEND_ORIGIN}`);
console.log('');

// Test endpoints that were failing
const testEndpoints = [
  '/api/auth/login',
  '/api/alerts/performance',
  '/api/analytics/web-vitals'
];

async function testCorsEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BACKEND_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS', // Preflight request
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = client.request(options, (res) => {
      const headers = res.headers;
      
      resolve({
        endpoint,
        statusCode: res.statusCode,
        allowOrigin: headers['access-control-allow-origin'],
        allowMethods: headers['access-control-allow-methods'],
        allowHeaders: headers['access-control-allow-headers'],
        allowCredentials: headers['access-control-allow-credentials'],
        success: res.statusCode === 200 && 
                (headers['access-control-allow-origin'] === FRONTEND_ORIGIN || 
                 headers['access-control-allow-origin'] === '*')
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        error: error.message,
        success: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        error: 'Request timeout',
        success: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing CORS preflight requests...\n');
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing ${endpoint}...`);
    
    try {
      const result = await testCorsEndpoint(endpoint);
      
      if (result.success) {
        console.log('✅ CORS test passed');
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Allow-Origin: ${result.allowOrigin}`);
        console.log(`   Allow-Methods: ${result.allowMethods}`);
        console.log(`   Allow-Credentials: ${result.allowCredentials}`);
      } else {
        console.log('❌ CORS test failed');
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        } else {
          console.log(`   Status: ${result.statusCode}`);
          console.log(`   Allow-Origin: ${result.allowOrigin || 'Not set'}`);
        }
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
    
    console.log('');
  }
}

// Test health endpoint first
async function testHealth() {
  return new Promise((resolve) => {
    const url = new URL('/api/health', BACKEND_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET'
    };

    const req = client.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('Checking if backend is running...');
  const isHealthy = await testHealth();
  
  if (!isHealthy) {
    console.log('❌ Backend is not responding.');
    console.log('   If testing locally: Start the backend with: npm run dev (in backend directory)');
    console.log('   If testing production: The backend might be deployed elsewhere');
    console.log('   Current backend URL:', BACKEND_URL);
    
    // Try to provide helpful guidance
    if (BACKEND_URL.includes('localhost')) {
      console.log('\n💡 To start the backend locally:');
      console.log('   cd backend && npm run dev');
    } else {
      console.log('\n💡 Testing against production backend...');
      console.log('   Make sure the production backend is deployed and running');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Backend is running\n');
  await runTests();
  
  console.log('🔧 If tests are still failing, make sure to:');
  console.log('   1. Restart the backend server');
  console.log('   2. Check that FRONTEND_URL environment variable is set correctly');
  console.log('   3. Verify the production frontend URL is correct');
  console.log('   4. Clear browser cache and try again');
}

main().catch(console.error);