const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const testAuditLogging = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment variables');
            console.log('   Checked: MONGO_URI and MONGODB_URI');
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Get the UnifiedAuditLog model
        const UnifiedAuditLog = mongoose.model('UnifiedAuditLog');

        // Check existing logs
        const count = await UnifiedAuditLog.countDocuments();
        console.log(`\n📊 Total audit logs in database: ${count}`);

        if (count > 0) {
            // Show latest 5 logs
            const latestLogs = await UnifiedAuditLog.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('activityType action description userDetails.email timestamp success');

            console.log('\n📝 Latest 5 audit logs:');
            latestLogs.forEach((log, index) => {
                console.log(`\n${index + 1}. ${log.activityType} - ${log.action}`);
                console.log(`   User: ${log.userDetails?.email || 'Unknown'}`);
                console.log(`   Description: ${log.description}`);
                console.log(`   Success: ${log.success}`);
                console.log(`   Time: ${log.timestamp}`);
            });
        } else {
            console.log('\n⚠️  No audit logs found in database');
            console.log('\n💡 Try the following:');
            console.log('   1. Login to the application');
            console.log('   2. Perform some actions (create patient, update profile, etc.)');
            console.log('   3. Check the audit trail page again');
            console.log('   4. Check backend logs for any errors');
        }

        // Test creating a sample audit log
        console.log('\n🧪 Testing audit log creation...');

        // Find a user to test with
        const User = mongoose.model('User');
        const testUser = await User.findOne().select('_id firstName lastName email role workplaceId');

        if (!testUser) {
            console.log('❌ No users found in database. Please create a user first.');
            process.exit(0);
        }

        console.log(`   Using test user: ${testUser.email}`);

        // Create a test audit log
        const testLog = new UnifiedAuditLog({
            userId: testUser._id,
            workplaceId: testUser.workplaceId,
            activityType: 'authentication',
            action: 'TEST_AUDIT_LOG',
            description: `Test audit log for ${testUser.firstName} ${testUser.lastName}`,
            riskLevel: 'low',
            success: true,
            timestamp: new Date(),
        });

        await testLog.save();
        console.log('✅ Test audit log created successfully!');
        console.log(`   User Details populated: ${testLog.userDetails?.email ? 'YES' : 'NO'}`);
        console.log(`   User: ${testLog.userDetails?.firstName} ${testLog.userDetails?.lastName} (${testLog.userDetails?.email})`);

        // Verify it was saved
        const savedLog = await UnifiedAuditLog.findById(testLog._id);
        if (savedLog) {
            console.log('\n✅ Verification: Log was saved to database');
            console.log(`   ID: ${savedLog._id}`);
            console.log(`   Activity: ${savedLog.activityType} - ${savedLog.action}`);
        }

        // Final count
        const newCount = await UnifiedAuditLog.countDocuments();
        console.log(`\n📊 Total audit logs now: ${newCount}`);

        console.log('\n✅ Test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Refresh the Audit Trail page in your browser');
        console.log('   2. You should see the test log created above');
        console.log('   3. Try logging in with another browser to generate more logs');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

testAuditLogging();
