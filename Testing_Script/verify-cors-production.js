#!/usr/bin/env node

/**
 * Production CORS Verification Script
 * Tests CORS configuration against the actual production backend
 */

const https = require('https');

const PRODUCTION_BACKEND = 'https://PharmaPilot-nttq.onrender.com'; // Update this with your actual backend URL
const FRONTEND_ORIGIN = 'https://PharmaPilot-nttq.onrender.com';

console.log('🔍 Testing CORS configuration against production backend...');
console.log(`Backend URL: ${PRODUCTION_BACKEND}`);
console.log(`Frontend Origin: ${FRONTEND_ORIGIN}`);
console.log('');

// Test the specific endpoints that were failing
const testEndpoints = [
  '/api/auth/login',
  '/api/alerts/performance', 
  '/api/analytics/web-vitals',
  '/api/health' // Basic health check
];

async function testProductionCors(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, PRODUCTION_BACKEND);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'OPTIONS', // Preflight request
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = https.request(options, (res) => {
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

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        endpoint,
        error: 'Request timeout - backend might not be deployed yet',
        success: false
      });
    });

    req.end();
  });
}

async function testProductionHealth() {
  return new Promise((resolve) => {
    const url = new URL('/api/health', PRODUCTION_BACKEND);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runProductionTests() {
  console.log('Checking if production backend is running...');
  const isHealthy = await testProductionHealth();
  
  if (!isHealthy) {
    console.log('❌ Production backend is not responding.');
    console.log('   This could mean:');
    console.log('   1. Backend is not deployed yet');
    console.log('   2. Backend is starting up (Render cold start)');
    console.log('   3. Backend URL is incorrect');
    console.log('   4. Backend has crashed');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Check your Render dashboard for backend deployment status');
    console.log('   2. Check backend logs for any errors');
    console.log('   3. Verify the backend URL is correct');
    return;
  }
  
  console.log('✅ Production backend is running\n');
  console.log('Testing CORS preflight requests...\n');
  
  let allPassed = true;
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing ${endpoint}...`);
    
    try {
      const result = await testProductionCors(endpoint);
      
      if (result.success) {
        console.log('✅ CORS test passed');
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Allow-Origin: ${result.allowOrigin}`);
        console.log(`   Allow-Methods: ${result.allowMethods}`);
        console.log(`   Allow-Credentials: ${result.allowCredentials}`);
      } else {
        console.log('❌ CORS test failed');
        allPassed = false;
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        } else {
          console.log(`   Status: ${result.statusCode}`);
          console.log(`   Allow-Origin: ${result.allowOrigin || 'Not set'}`);
        }
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
      allPassed = false;
    }
    
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 All CORS tests passed! Your production deployment should work correctly.');
    console.log('');
    console.log('✅ Next steps:');
    console.log('   1. Clear your browser cache');
    console.log('   2. Try logging in to your production app');
    console.log('   3. Check browser console for any remaining errors');
  } else {
    console.log('❌ Some CORS tests failed. The backend deployment may need to be updated.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the backend has been redeployed with the CORS fixes');
    console.log('   2. Check that environment variables are set correctly in production');
    console.log('   3. Verify the frontend URL in the backend CORS configuration');
  }
}

runProductionTests().catch(console.error);