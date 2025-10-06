#!/usr/bin/env node

/**
 * Test script to verify the Reports API is working correctly
 */

const API_BASE_URL = 'http://localhost:5000/api';

async function testReportsAPI() {
  console.log('🧪 Testing Reports API...\n');

  try {
    // Test 1: Get available report types
    console.log('1. Testing /api/reports/types endpoint...');
    const typesResponse = await fetch(`${API_BASE_URL}/reports/types`, {
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need proper authentication headers
      }
    });
    
    if (typesResponse.ok) {
      const typesData = await typesResponse.json();
      console.log('✅ Available report types:', typesData.data?.reportTypes?.length || 0);
    } else {
      console.log('❌ Failed to get report types:', typesResponse.status, typesResponse.statusText);
    }

    // Test 2: Get report summary
    console.log('\n2. Testing /api/reports/summary endpoint...');
    const summaryResponse = await fetch(`${API_BASE_URL}/reports/summary?period=30d`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Report summary retrieved successfully');
      console.log('   - Total Reviews:', summaryData.data?.summary?.totalReviews || 0);
      console.log('   - Completion Rate:', summaryData.data?.summary?.completionRate || 0, '%');
    } else {
      console.log('❌ Failed to get report summary:', summaryResponse.status, summaryResponse.statusText);
    }

    // Test 3: Generate a specific report
    console.log('\n3. Testing /api/reports/patient-outcomes endpoint...');
    const reportResponse = await fetch(`${API_BASE_URL}/reports/patient-outcomes?startDate=2024-01-01&endDate=2024-12-31`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (reportResponse.ok) {
      const reportData = await reportResponse.json();
      console.log('✅ Patient outcomes report generated successfully');
      console.log('   - Report Type:', reportData.data?.reportType || 'N/A');
      console.log('   - Generated At:', reportData.data?.generatedAt || 'N/A');
    } else {
      console.log('❌ Failed to generate patient outcomes report:', reportResponse.status, reportResponse.statusText);
      if (reportResponse.status === 401) {
        console.log('   Note: This might be due to authentication requirements');
      }
    }

    console.log('\n🎉 Reports API test completed!');
    console.log('\nNext steps:');
    console.log('1. Start your backend server: npm run dev (in backend directory)');
    console.log('2. Start your frontend server: npm run dev (in frontend directory)');
    console.log('3. Navigate to http://localhost:5173/reports-analytics');
    console.log('4. Click on any report type and then "Generate Report" to see real data');

  } catch (error) {
    console.error('❌ Error testing Reports API:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your backend server is running on port 5000');
    console.log('2. Check that MongoDB is connected');
    console.log('3. Verify that the reports routes are properly mounted');
  }
}

// Run the test
testReportsAPI();