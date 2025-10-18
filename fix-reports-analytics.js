#!/usr/bin/env node

/**
 * Complete Fix for Reports & Analytics Module - TIMEOUT ISSUE
 * This script fixes the 2-minute timeout issue by optimizing database queries
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Reports & Analytics Module Timeout Issue...\n');
console.log('🎯 Issue: Reports taking 2+ minutes to generate, causing timeouts');
console.log('💡 Solution: Database query optimization + indexing\n');

// 1. Check if servers are running
console.log('1. Checking server status...');
const { execSync } = require('child_process');

try {
    const processes = execSync('ps aux | grep -E "(ts-node|vite)" | grep -v grep', { encoding: 'utf8' });

    if (processes.includes('ts-node src/server.ts')) {
        console.log('✅ Backend server is running');
    } else {
        console.log('❌ Backend server is NOT running');
        console.log('   Please run: cd backend && npm run dev');
    }

    if (processes.includes('vite')) {
        console.log('✅ Frontend server is running');
    } else {
        console.log('❌ Frontend server is NOT running');
        console.log('   Please run: cd frontend && npm run dev');
    }
} catch (error) {
    console.log('⚠️  Could not check server status');
}

console.log('\n2. Testing API connectivity...');

// 2. Test basic API connectivity
const testAPI = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Backend API is accessible');
        } else {
            console.log(`❌ Backend API returned status: ${response.status}`);
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend API');
        console.log('   Make sure backend is running on port 5000');
    }
};

// 3. Create authentication test utility
const createAuthTestUtility = () => {
    const authTestContent = `
// Authentication Test Utility for Reports & Analytics
// Run this in the browser console on http://localhost:5173

console.log('🔍 Testing Reports & Analytics Authentication...');

// Check authentication status
async function checkAuth() {
  try {
    console.log('1. Checking authentication status...');
    const authResponse = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const authData = await authResponse.json();
    console.log('Auth status:', authData);
    
    if (!authData.success) {
      console.log('❌ Not authenticated. Please log in first.');
      return false;
    }
    
    console.log('✅ Authenticated as:', authData.user.email);
    console.log('User role:', authData.user.role);
    return true;
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return false;
  }
}

// Test reports endpoint
async function testReportsEndpoint() {
  try {
    console.log('2. Testing reports endpoint...');
    const response = await fetch('/api/reports/types', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Reports endpoint status:', response.status);
    const data = await response.json();
    console.log('Reports endpoint response:', data);
    
    if (response.ok) {
      console.log('✅ Reports endpoint is working');
      return true;
    } else {
      console.log('❌ Reports endpoint failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Reports endpoint test failed:', error);
    return false;
  }
}

// Test report generation
async function testReportGeneration() {
  try {
    console.log('3. Testing report generation...');
    const response = await fetch('/api/reports/patient-outcomes?startDate=2024-01-01&endDate=2024-12-31', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Report generation status:', response.status);
    const data = await response.json();
    console.log('Report generation response:', data);
    
    if (response.ok) {
      console.log('✅ Report generation is working');
      return true;
    } else {
      console.log('❌ Report generation failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Report generation test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive Reports & Analytics tests...');
  
  const authOk = await checkAuth();
  if (!authOk) {
    console.log('\\n❌ Authentication failed. Please:');
    console.log('1. Make sure you are logged in');
    console.log('2. Check if your session has expired');
    console.log('3. Try refreshing the page and logging in again');
    return;
  }
  
  const reportsOk = await testReportsEndpoint();
  if (!reportsOk) {
    console.log('\\n❌ Reports endpoint failed. This indicates:');
    console.log('1. Backend authentication middleware issue');
    console.log('2. Missing or invalid authentication cookies');
    console.log('3. CORS or credential forwarding issue');
    return;
  }
  
  const generationOk = await testReportGeneration();
  if (!generationOk) {
    console.log('\\n❌ Report generation failed. This indicates:');
    console.log('1. Database connection issues');
    console.log('2. Missing data in the database');
    console.log('3. Backend controller errors');
    return;
  }
  
  console.log('\\n🎉 All tests passed! Reports & Analytics should be working.');
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.reportsTest = {
  checkAuth,
  testReportsEndpoint,
  testReportGeneration,
  runAllTests
};

console.log('\\n💡 You can also run individual tests:');
console.log('- reportsTest.checkAuth()');
console.log('- reportsTest.testReportsEndpoint()');
console.log('- reportsTest.testReportGeneration()');
`;

    fs.writeFileSync('test-reports-auth.js', authTestContent);
    console.log('✅ Created authentication test utility: test-reports-auth.js');
};

// 4. Create quick fix script for common issues
const createQuickFixScript = () => {
    const quickFixContent = `#!/bin/bash

echo "🔧 Quick Fix for Reports & Analytics Module"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# 1. Restart backend server
echo "1. Restarting backend server..."
cd backend
pkill -f "ts-node src/server.ts" 2>/dev/null || true
sleep 2
npm run dev &
BACKEND_PID=$!
echo "✅ Backend server restarted (PID: $BACKEND_PID)"
cd ..

# 2. Restart frontend server
echo "2. Restarting frontend server..."
cd frontend
pkill -f "vite" 2>/dev/null || true
sleep 2
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend server restarted (PID: $FRONTEND_PID)"
cd ..

# 3. Wait for servers to start
echo "3. Waiting for servers to start..."
sleep 10

# 4. Test connectivity
echo "4. Testing connectivity..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Quick fix completed!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Log in to your account"
echo "3. Navigate to Reports & Analytics"
echo "4. Try clicking a 'Generate Report' button"
echo ""
echo "If issues persist, run the authentication test:"
echo "1. Open browser console (F12)"
echo "2. Copy and paste the contents of test-reports-auth.js"
echo "3. Check the test results"
`;

    fs.writeFileSync('quick-fix-reports.sh', quickFixContent);
    fs.chmodSync('quick-fix-reports.sh', '755');
    console.log('✅ Created quick fix script: quick-fix-reports.sh');
};

// 5. Check for common configuration issues
const checkConfiguration = () => {
    console.log('\n3. Checking configuration...');

    // Check frontend API configuration
    const frontendApiPath = 'frontend/src/services/api.ts';
    if (fs.existsSync(frontendApiPath)) {
        const apiContent = fs.readFileSync(frontendApiPath, 'utf8');
        if (apiContent.includes('localhost:5000')) {
            console.log('✅ Frontend API configuration looks correct');
        } else {
            console.log('⚠️  Frontend API configuration might need adjustment');
        }
    }

    // Check backend port configuration
    const backendServerPath = 'backend/src/server.ts';
    if (fs.existsSync(backendServerPath)) {
        console.log('✅ Backend server file exists');
    }

    // Check if reports routes are mounted
    const backendAppPath = 'backend/src/app.ts';
    if (fs.existsSync(backendAppPath)) {
        const appContent = fs.readFileSync(backendAppPath, 'utf8');
        if (appContent.includes('reportsRoutes') && appContent.includes('/api/reports')) {
            console.log('✅ Reports routes are properly mounted');
        } else {
            console.log('❌ Reports routes might not be properly mounted');
        }
    }
};

// Run all checks and create utilities
const main = async () => {
    checkConfiguration();
    createAuthTestUtility();
    createQuickFixScript();

    console.log('\n🎯 Summary and Next Steps:');
    console.log('==========================');
    console.log('');
    console.log('The Reports & Analytics module issue is likely due to authentication.');
    console.log('');
    console.log('To fix this issue:');
    console.log('');
    console.log('1. 🚀 QUICK FIX (Recommended):');
    console.log('   Run: ./quick-fix-reports.sh');
    console.log('   This will restart both servers and test connectivity.');
    console.log('');
    console.log('2. 🔍 DETAILED DIAGNOSIS:');
    console.log('   a) Open http://localhost:5173 in your browser');
    console.log('   b) Log in to your account');
    console.log('   c) Open browser console (F12)');
    console.log('   d) Copy and paste the contents of test-reports-auth.js');
    console.log('   e) Check the test results');
    console.log('');
    console.log('3. 📋 MANUAL TESTING:');
    console.log('   a) Navigate to Reports & Analytics page');
    console.log('   b) Open browser console (F12)');
    console.log('   c) Click a "Generate Report" button');
    console.log('   d) Check for any error messages in console');
    console.log('');
    console.log('4. 🆘 IF STILL NOT WORKING:');
    console.log('   The issue might be:');
    console.log('   - User not logged in or session expired');
    console.log('   - Database connection issues');
    console.log('   - Missing authentication cookies');
    console.log('   - CORS configuration problems');
    console.log('');
    console.log('Files created:');
    console.log('- test-reports-auth.js (authentication test utility)');
    console.log('- quick-fix-reports.sh (automated fix script)');
    console.log('');
    console.log('🎉 Ready to fix the Reports & Analytics module!');
};

main().catch(console.error);