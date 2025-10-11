/**
 * Comprehensive test script for audit log export functionality
 * Tests the complete flow from backend to frontend
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  // Replace with actual test credentials
  email: 'owner@test.com',
  password: 'testpassword',
};

let authToken = '';
let workplaceId = '';

/**
 * Login and get auth token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testConfig.email,
      password: testConfig.password,
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      workplaceId = response.data.data.user.workplaceId;
      console.log('✅ Login successful');
      console.log(`   Workplace ID: ${workplaceId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test fetching audit logs
 */
async function testGetAuditLogs() {
  try {
    console.log('\n📋 Testing GET /api/workspace/team/audit...');
    const response = await axios.get(`${API_BASE_URL}/workspace/team/audit`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10,
      },
    });

    if (response.data.success) {
      console.log('✅ Audit logs fetched successfully');
      console.log(`   Total logs: ${response.data.data.pagination.total}`);
      console.log(`   Logs in response: ${response.data.data.logs.length}`);
      
      if (response.data.data.logs.length > 0) {
        const firstLog = response.data.data.logs[0];
        console.log(`   Sample log: ${firstLog.action} (${firstLog.category})`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to fetch audit logs:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test exporting audit logs to CSV
 */
async function testExportAuditLogs() {
  try {
    console.log('\n📥 Testing GET /api/workspace/team/audit/export...');
    
    // Test with date range filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const response = await axios.get(`${API_BASE_URL}/workspace/team/audit/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      responseType: 'text', // Important for CSV
    });

    if (response.status === 200) {
      console.log('✅ Audit logs exported successfully');
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Disposition: ${response.headers['content-disposition']}`);
      console.log(`   CSV size: ${response.data.length} bytes`);
      
      // Check CSV structure
      const lines = response.data.split('\n');
      console.log(`   CSV lines: ${lines.length}`);
      
      if (lines.length > 0) {
        console.log(`   CSV headers: ${lines[0]}`);
      }
      
      if (lines.length > 1) {
        console.log(`   Sample row: ${lines[1].substring(0, 100)}...`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to export audit logs:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test export with various filters
 */
async function testExportWithFilters() {
  try {
    console.log('\n🔍 Testing export with filters...');
    
    const filters = [
      { name: 'Category filter', params: { category: 'member' } },
      { name: 'Severity filter', params: { severity: 'high' } },
      { name: 'Action filter', params: { action: 'member_suspended' } },
    ];
    
    for (const filter of filters) {
      console.log(`\n   Testing ${filter.name}...`);
      const response = await axios.get(`${API_BASE_URL}/workspace/team/audit/export`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: filter.params,
        responseType: 'text',
      });
      
      if (response.status === 200) {
        const lines = response.data.split('\n');
        console.log(`   ✅ ${filter.name}: ${lines.length - 1} records`);
      } else {
        console.log(`   ❌ ${filter.name}: Failed`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to test filters:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test export with large dataset
 */
async function testLargeDatasetExport() {
  try {
    console.log('\n📊 Testing export with large dataset...');
    
    const response = await axios.get(`${API_BASE_URL}/workspace/team/audit/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'text',
      timeout: 30000, // 30 second timeout for large exports
    });

    if (response.status === 200) {
      const lines = response.data.split('\n');
      const recordCount = lines.length - 1; // Subtract header row
      
      console.log('✅ Large dataset export successful');
      console.log(`   Total records: ${recordCount}`);
      console.log(`   CSV size: ${(response.data.length / 1024).toFixed(2)} KB`);
      
      // Performance check
      if (recordCount > 1000) {
        console.log('   ⚠️  Large dataset detected (>1000 records)');
        console.log('   Consider implementing pagination or streaming for better performance');
      }
      
      return true;
    }
    return false;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Export timeout - dataset too large');
    } else {
      console.error('❌ Failed to export large dataset:', error.response?.data?.message || error.message);
    }
    return false;
  }
}

/**
 * Test CSV format validation
 */
async function testCSVFormat() {
  try {
    console.log('\n✅ Testing CSV format validation...');
    
    const response = await axios.get(`${API_BASE_URL}/workspace/team/audit/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'text',
    });

    if (response.status === 200) {
      const csv = response.data;
      const lines = csv.split('\n');
      
      // Check headers
      const expectedHeaders = [
        'Timestamp',
        'Action',
        'Category',
        'Actor Name',
        'Actor Email',
        'Target Name',
        'Target Email',
        'Severity',
        'IP Address',
        'Reason',
        'Before',
        'After',
      ];
      
      const actualHeaders = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      console.log('   Checking CSV headers...');
      let headersValid = true;
      for (const header of expectedHeaders) {
        if (!actualHeaders.includes(header)) {
          console.log(`   ❌ Missing header: ${header}`);
          headersValid = false;
        }
      }
      
      if (headersValid) {
        console.log('   ✅ All expected headers present');
      }
      
      // Check data rows
      if (lines.length > 1) {
        console.log('   Checking data row format...');
        const dataRow = lines[1];
        const fields = dataRow.split(',');
        
        if (fields.length === expectedHeaders.length) {
          console.log('   ✅ Data row has correct number of fields');
        } else {
          console.log(`   ❌ Data row field count mismatch: expected ${expectedHeaders.length}, got ${fields.length}`);
        }
      }
      
      return headersValid;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to validate CSV format:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Audit Log Export Tests\n');
  console.log('='.repeat(60));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Run tests
  const results = {
    getAuditLogs: await testGetAuditLogs(),
    exportAuditLogs: await testExportAuditLogs(),
    exportWithFilters: await testExportWithFilters(),
    largeDatasetExport: await testLargeDatasetExport(),
    csvFormat: await testCSVFormat(),
  };
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Audit log export functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
