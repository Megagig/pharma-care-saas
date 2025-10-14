#!/usr/bin/env node

/**
 * Integration test to verify clinical intervention frontend-backend communication
 * This script tests the key endpoints to ensure data flows correctly
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
        'X-Super-Admin-Test': 'true' // For development testing
    }
};

async function testEndpoint(name, url, options = {}) {
    console.log(`\n🧪 Testing ${name}...`);
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...TEST_CONFIG,
            ...options
        });
        
        const data = await response.json();
        
        console.log(`✅ ${name} - Status: ${response.status}`);
        console.log(`   Response structure:`, {
            success: data.success,
            hasData: !!data.data,
            dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
            hasPagination: !!(data.data && data.data.pagination),
            message: data.message
        });
        
        return { success: true, data, status: response.status };
    } catch (error) {
        console.log(`❌ ${name} - Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting Clinical Intervention Communication Tests\n');
    
    const tests = [
        {
            name: 'Health Check',
            url: '/clinical-interventions/health'
        },
        {
            name: 'Get Interventions (List)',
            url: '/clinical-interventions?page=1&limit=10'
        },
        {
            name: 'Get Category Counts',
            url: '/clinical-interventions/analytics/categories'
        },
        {
            name: 'Get Priority Distribution',
            url: '/clinical-interventions/analytics/priorities'
        },
        {
            name: 'Check Duplicates',
            url: '/clinical-interventions/check-duplicates?patientId=507f1f77bcf86cd799439011&category=drug_therapy_problem'
        },
        {
            name: 'Search Interventions',
            url: '/clinical-interventions/search?q=test'
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testEndpoint(test.name, test.url, test.options);
        results.push({ ...test, ...result });
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(test => {
            console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    // Test response structure consistency
    console.log('\n🔍 Response Structure Analysis:');
    const successfulTests = results.filter(r => r.success && r.data);
    
    successfulTests.forEach(test => {
        const { data } = test;
        console.log(`\n${test.name}:`);
        console.log(`   - Has 'success' field: ${!!data.success}`);
        console.log(`   - Has 'data' field: ${!!data.data}`);
        console.log(`   - Has 'message' field: ${!!data.message}`);
        console.log(`   - Data structure: ${Array.isArray(data.data) ? 'array' : typeof data.data}`);
        
        if (data.data && data.data.pagination) {
            console.log(`   - Has pagination: ✅`);
        }
    });
    
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests, testEndpoint };