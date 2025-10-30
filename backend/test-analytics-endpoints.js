const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacycopilot';

// Create a test user and get auth token
async function getAuthToken() {
    try {
        await mongoose.connect(MONGODB_URI);

        // Find an existing user
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ role: { $in: ['Owner', 'Pharmacist'] } });

        if (!user) {
            console.log('❌ No suitable user found for testing');
            return null;
        }

        console.log(`👤 Found test user: ${user.firstName} ${user.lastName} (${user.role})`);

        // Try to login with the user
        const loginResponse = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/login`, {
            email: user.email,
            password: 'password123' // Default password - you may need to adjust this
        });

        if (loginResponse.data.success && loginResponse.data.data.token) {
            console.log('✅ Successfully authenticated');
            return loginResponse.data.data.token;
        }

        console.log('❌ Login failed - trying alternative approach');
        return null;

    } catch (error) {
        console.log('❌ Authentication failed:', error.response?.data?.message || error.message);

        // Alternative: Create a temporary token for testing
        console.log('🔧 Creating temporary test token...');
        const jwt = require('jsonwebtoken');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ role: { $in: ['Owner', 'Pharmacist'] } });

        if (user) {
            const token = jwt.sign(
                {
                    userId: user._id,
                    workplaceId: user.workplaceId,
                    role: user.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );
            console.log('✅ Created temporary test token');
            return token;
        }

        return null;
    }
}

async function testAnalyticsEndpoint(endpoint, token, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${endpoint}${queryString ? '?' + queryString : ''}`;

        console.log(`📊 Testing: ${fullUrl}`);

        const response = await axios.get(`${API_BASE_URL}${fullUrl}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📦 Success: ${response.data.success}`);

        if (response.data.data) {
            const data = response.data.data;
            console.log(`   📈 Data structure:`, Object.keys(data));

            // Log specific analytics data
            if (data.summary) {
                console.log(`   📊 Summary:`, data.summary);
            }

            if (data.overall) {
                console.log(`   📊 Overall:`, data.overall);
            }

            if (data.byType && Array.isArray(data.byType)) {
                console.log(`   📊 By Type: ${data.byType.length} categories`);
            }

            if (data.byStatus && Array.isArray(data.byStatus)) {
                console.log(`   📊 By Status: ${data.byStatus.length} statuses`);
            }

            if (data.trends && data.trends.daily) {
                console.log(`   📊 Daily Trends: ${data.trends.daily.length} days`);
            }
        }

        return { success: true, data: response.data };

    } catch (error) {
        console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   📝 Message: ${error.response?.data?.message || error.message}`);

        if (error.response?.data?.error) {
            console.log(`   🔍 Details:`, error.response.data.error);
        }

        return { success: false, error: error.response?.data || error.message };
    }
}

async function testAllAnalyticsEndpoints(token) {
    console.log('\n🔍 Testing All Analytics Endpoints...\n');

    const testParams = {
        startDate: '2024-10-01',
        endDate: '2024-10-30'
    };

    const endpoints = [
        {
            name: 'Appointment Analytics',
            path: '/appointments/analytics',
            params: testParams
        },
        {
            name: 'Follow-up Analytics',
            path: '/follow-ups/analytics',
            params: testParams
        },
        {
            name: 'Reminder Analytics',
            path: '/reminders/analytics',
            params: testParams
        },
        {
            name: 'Capacity Analytics',
            path: '/schedules/capacity',
            params: testParams
        }
    ];

    const results = {};

    for (const endpoint of endpoints) {
        console.log(`\n📊 ${endpoint.name}`);
        console.log('-'.repeat(40));

        const result = await testAnalyticsEndpoint(endpoint.path, token, endpoint.params);
        results[endpoint.name] = result;

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}

async function testBasicEndpoints(token) {
    console.log('\n🧪 Testing Basic Data Endpoints...\n');

    const endpoints = [
        '/appointments',
        '/appointments/calendar',
        '/follow-ups'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testing ${endpoint}...`);

            const response = await axios.get(`${API_BASE_URL}${endpoint}?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Data count: ${response.data.data?.results?.length || response.data.data?.appointments?.length || 'N/A'}`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
            console.log(`   📝 Message: ${error.response?.data?.message || error.message}`);
        }
    }
}

async function generateSummaryReport(results) {
    console.log('\n📋 Analytics Test Summary Report');
    console.log('='.repeat(50));

    let successCount = 0;
    let totalCount = 0;

    for (const [name, result] of Object.entries(results)) {
        totalCount++;
        if (result.success) {
            successCount++;
            console.log(`✅ ${name}: Working`);
        } else {
            console.log(`❌ ${name}: Failed`);
        }
    }

    console.log(`\n📊 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount / totalCount * 100)}%)`);

    if (successCount === totalCount) {
        console.log('\n🎉 All analytics endpoints are working correctly!');
        console.log('💡 If the frontend is still showing empty data, check:');
        console.log('   - Browser console for JavaScript errors');
        console.log('   - Network tab for failed API requests');
        console.log('   - User permissions in the frontend');
    } else {
        console.log('\n⚠️  Some analytics endpoints are not working.');
        console.log('💡 Check:');
        console.log('   - Database has sample data');
        console.log('   - User has proper permissions');
        console.log('   - Backend logs for detailed errors');
    }
}

async function main() {
    console.log('🚀 Analytics Endpoints Test\n');
    console.log('='.repeat(50));

    // Get authentication token
    console.log('🔐 Getting authentication token...');
    const token = await getAuthToken();

    if (!token) {
        console.log('❌ Could not get authentication token');
        console.log('💡 Make sure you have users in the database and correct credentials');
        process.exit(1);
    }

    // Test basic endpoints first
    await testBasicEndpoints(token);

    // Test analytics endpoints
    const results = await testAllAnalyticsEndpoints(token);

    // Generate summary report
    await generateSummaryReport(results);

    console.log('\n' + '='.repeat(50));
    console.log('✨ Test complete!');

    await mongoose.disconnect();
}

main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});