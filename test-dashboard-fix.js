#!/usr/bin/env node

/**
 * Test script to verify dashboard data population fix
 * Tests both super admin and regular user scenarios
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
    // Super admin test (using development bypass)
    superAdmin: {
        headers: {
            'X-Super-Admin-Test': 'true'
        }
    },
    // Regular user test (you'll need to provide actual auth token)
    regularUser: {
        headers: {
            // Add actual user token here for testing
            // 'Authorization': 'Bearer YOUR_USER_TOKEN_HERE'
        }
    }
};

async function testDashboardEndpoint(endpoint, config, userType) {
    try {
        console.log(`\n🧪 Testing ${endpoint} for ${userType}...`);
        
        const response = await axios.get(`${API_BASE}${endpoint}`, config);
        
        if (response.data?.success) {
            console.log(`✅ ${endpoint}: Success`);
            
            if (response.data.data) {
                const data = response.data.data;
                
                // Check stats
                if (data.stats) {
                    const stats = data.stats;
                    const totalData = (stats.totalPatients || 0) + 
                                    (stats.totalClinicalNotes || 0) + 
                                    (stats.totalMedications || 0) + 
                                    (stats.totalMTRs || 0);
                    
                    console.log(`   📊 Stats:`, {
                        patients: stats.totalPatients || 0,
                        notes: stats.totalClinicalNotes || 0,
                        medications: stats.totalMedications || 0,
                        mtrs: stats.totalMTRs || 0,
                        total: totalData
                    });
                    
                    if (totalData > 0) {
                        console.log(`   ✅ Dashboard has real data!`);
                    } else {
                        console.log(`   ⚠️  Dashboard shows no data`);
                    }
                }
                
                // Check workspace info for regular users
                if (data.workspace) {
                    console.log(`   🏢 Workspace: ${data.workspace.name || 'Unknown'}`);
                }
                
                // Check system stats for super admin
                if (data.systemStats) {
                    const systemStats = data.systemStats;
                    console.log(`   🌐 System Stats:`, {
                        workspaces: systemStats.totalWorkspaces || 0,
                        users: systemStats.totalUsers || 0,
                        patients: systemStats.totalPatients || 0
                    });
                }
            }
        } else {
            console.log(`❌ ${endpoint}: Failed - ${response.data?.message}`);
        }
        
        return response.data;
        
    } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
        if (error.response?.data) {
            console.log(`   Response:`, error.response.data);
        }
        return null;
    }
}

async function testDebugEndpoint(config, userType) {
    try {
        console.log(`\n🔍 Testing debug endpoint for ${userType}...`);
        
        const response = await axios.get(`${API_BASE}/dashboard/debug`, config);
        
        if (response.data?.success) {
            const debug = response.data.debug;
            
            console.log(`✅ Debug endpoint: Success`);
            console.log(`   👤 User:`, {
                id: debug.user.id,
                email: debug.user.email,
                role: debug.user.role,
                workplaceId: debug.user.workplaceId
            });
            
            if (debug.workplace) {
                console.log(`   🏢 Workplace:`, {
                    id: debug.workplace._id,
                    name: debug.workplace.name
                });
            } else {
                console.log(`   ❌ No workplace found`);
            }
            
            console.log(`   📊 Data in workspace:`, debug.dataInWorkspace);
            
            const totalData = debug.dataInWorkspace.patients + 
                            debug.dataInWorkspace.notes + 
                            debug.dataInWorkspace.medications;
            
            if (totalData > 0) {
                console.log(`   ✅ Workspace has data - dashboard should show it`);
            } else {
                console.log(`   ⚠️  Workspace has no data`);
                
                if (debug.systemOverview.totalPatients > 0) {
                    console.log(`   ℹ️  System has data in other workspaces`);
                    console.log(`   🔍 Check if user should be in different workspace`);
                }
            }
        } else {
            console.log(`❌ Debug endpoint failed:`, response.data?.message);
        }
        
    } catch (error) {
        console.log(`❌ Debug endpoint error:`, error.message);
        if (error.response?.data) {
            console.log(`   Response:`, error.response.data);
        }
    }
}

async function runTests() {
    console.log('🎯 Dashboard Data Population Fix Test');
    console.log('====================================');
    
    // Test super admin dashboard
    console.log('\n🌐 Testing Super Admin Dashboard:');
    console.log('=================================');
    
    await testDashboardEndpoint('/super-admin/dashboard/overview', TEST_CONFIG.superAdmin, 'Super Admin');
    await testDebugEndpoint(TEST_CONFIG.superAdmin, 'Super Admin');
    
    // Test regular user dashboard
    console.log('\n👤 Testing Regular User Dashboard:');
    console.log('==================================');
    
    if (TEST_CONFIG.regularUser.headers.Authorization) {
        await testDashboardEndpoint('/dashboard/overview', TEST_CONFIG.regularUser, 'Regular User');
        await testDebugEndpoint(TEST_CONFIG.regularUser, 'Regular User');
    } else {
        console.log('⚠️  Skipping regular user tests - no auth token provided');
        console.log('   To test regular users:');
        console.log('   1. Login as a regular user in the frontend');
        console.log('   2. Get the auth token from browser dev tools');
        console.log('   3. Add it to TEST_CONFIG.regularUser.headers.Authorization');
        console.log('   4. Run this script again');
    }
    
    // Test endpoints that should work for both
    console.log('\n🔧 Testing Common Endpoints:');
    console.log('============================');
    
    await testDashboardEndpoint('/dashboard/stats', TEST_CONFIG.superAdmin, 'Super Admin');
    
    console.log('\n🏁 Test Summary:');
    console.log('================');
    console.log('✅ If super admin shows system-wide data: Super admin dashboard working');
    console.log('✅ If regular user shows workspace data: Regular user dashboard working');
    console.log('❌ If regular user shows no data but workspace has data: Issue with filtering');
    console.log('⚠️  If regular user shows no data and workspace is empty: User needs data');
    
    console.log('\n🔍 Next Steps:');
    console.log('==============');
    console.log('1. Check browser console for debug information');
    console.log('2. Use debug button (🔍) in development dashboard');
    console.log('3. Verify user workspace assignments in database');
    console.log('4. Check if data exists but has wrong workplaceId');
}

// Run the tests
runTests().catch(console.error);