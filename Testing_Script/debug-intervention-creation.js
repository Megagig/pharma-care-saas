#!/usr/bin/env node

/**
 * Debug script to test clinical intervention creation
 * This script simulates the exact API call made by the frontend
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Test data that matches the form structure
const testInterventionData = {
    patientId: '507f1f77bcf86cd799439011', // Valid ObjectId format
    category: 'drug_therapy_problem',
    priority: 'medium',
    issueDescription: 'Test intervention from debug script',
    strategies: [],
    estimatedDuration: 7,
    relatedMTRId: null,
    relatedDTPIds: []
};

async function debugCreateIntervention() {
    console.log('🔍 Debugging Clinical Intervention Creation\n');
    
    console.log('🌍 Environment Info:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`   Is Development: ${isDevelopment}`);
    console.log(`   API URL: ${API_BASE_URL}`);
    
    console.log('\n📋 Test Data:');
    console.log(JSON.stringify(testInterventionData, null, 2));
    
    console.log('\n🚀 Making API Request...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/clinical-interventions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Super-Admin-Test': 'true' // For development testing
            },
            body: JSON.stringify(testInterventionData)
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        const responseData = await response.json();
        
        console.log('\n📄 Response Data:');
        console.log(JSON.stringify(responseData, null, 2));
        
        if (response.ok && responseData.success) {
            console.log('\n✅ SUCCESS: Intervention created successfully!');
            console.log(`   Intervention ID: ${responseData.data?._id}`);
            console.log(`   Intervention Number: ${responseData.data?.interventionNumber}`);
            
            // Test if we can retrieve it
            if (responseData.data?._id) {
                console.log('\n🔍 Verifying creation by fetching the intervention...');
                const getResponse = await fetch(`${API_BASE_URL}/clinical-interventions/${responseData.data._id}`, {
                    headers: {
                        'X-Super-Admin-Test': 'true'
                    }
                });
                
                const getData = await getResponse.json();
                console.log(`   Fetch Status: ${getResponse.status}`);
                console.log(`   Found in DB: ${getData.success ? 'YES' : 'NO'}`);
                
                if (getData.success) {
                    console.log(`   DB Data: ${JSON.stringify(getData.data, null, 2)}`);
                }
            }
            
        } else {
            console.log('\n❌ FAILED: Intervention creation failed');
            console.log(`   Error: ${responseData.message || responseData.error}`);
            
            if (responseData.error?.details) {
                console.log(`   Details: ${JSON.stringify(responseData.error.details, null, 2)}`);
            }
        }
        
    } catch (error) {
        console.log('\n💥 NETWORK ERROR:');
        console.log(`   ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
}

// Test the health endpoint first
async function testHealthEndpoint() {
    console.log('🏥 Testing Health Endpoint...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/clinical-interventions/health`, {
            headers: {
                'X-Super-Admin-Test': 'true'
            }
        });
        
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Health: ${data.status || 'Unknown'}`);
        console.log(`   Module: ${data.module || 'Unknown'}`);
        
        return response.ok;
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Test authentication
async function testAuth() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/clinical-interventions`, {
            headers: {
                'X-Super-Admin-Test': 'true'
            }
        });
        
        console.log(`   Auth Status: ${response.status}`);
        
        if (response.status === 401) {
            console.log('   ❌ Authentication failed');
            return false;
        } else if (response.status === 200) {
            console.log('   ✅ Authentication successful');
            return true;
        } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    console.log('🧪 Clinical Intervention Creation Debug Tool\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
    
    // Step 1: Test health
    const healthOk = await testHealthEndpoint();
    if (!healthOk) {
        console.log('\n❌ Health check failed. Is the server running?');
        process.exit(1);
    }
    
    // Step 2: Test auth
    const authOk = await testAuth();
    if (!authOk) {
        console.log('\n❌ Authentication failed. Check server configuration.');
        process.exit(1);
    }
    
    // Step 3: Test creation
    console.log('\n' + '='.repeat(50));
    await debugCreateIntervention();
    
    console.log('\n🏁 Debug complete!');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Debug script failed:', error);
        process.exit(1);
    });
}

module.exports = { debugCreateIntervention, testHealthEndpoint, testAuth };