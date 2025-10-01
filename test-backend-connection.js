#!/usr/bin/env node

/**
 * Simple test to check if the backend is accessible
 */

const API_BASE_URL = 'http://localhost:5000';

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...\n');

  try {
    // Test 1: Basic health check
    console.log('1. Testing basic connectivity...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health/feature-flags`);
    
    if (healthResponse.ok) {
      console.log('✅ Backend is accessible');
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
    }

    // Test 2: Check if reports routes are mounted
    console.log('\n2. Testing reports routes...');
    const reportsResponse = await fetch(`${API_BASE_URL}/api/reports/types`);
    
    console.log('Reports endpoint status:', reportsResponse.status);
    
    if (reportsResponse.status === 401) {
      console.log('⚠️ Authentication required - this is expected');
      console.log('   The reports endpoint exists but requires authentication');
    } else if (reportsResponse.ok) {
      console.log('✅ Reports endpoint is accessible');
      const data = await reportsResponse.json();
      console.log('   Response:', data);
    } else {
      console.log('❌ Reports endpoint failed:', reportsResponse.status);
      const errorText = await reportsResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 3: Check CORS
    console.log('\n3. Testing CORS headers...');
    console.log('   Access-Control-Allow-Origin:', reportsResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('   Access-Control-Allow-Credentials:', reportsResponse.headers.get('Access-Control-Allow-Credentials'));

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your backend server is running: npm run dev (in backend directory)');
    console.log('2. Check that the server is listening on port 5000');
    console.log('3. Verify MongoDB is connected');
  }
}

// Run the test
testBackendConnection();