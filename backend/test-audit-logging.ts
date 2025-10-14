import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import UnifiedAuditLog from './src/models/UnifiedAuditLog.js';
import User from './src/models/User.js';

const testAuditLogging = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment variables');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check existing logs
        const count = await UnifiedAuditLog.countDocuments();
        console.log(`\n📊 Total audit logs in database: ${count}`);

        if (count > 0) {
            const latestLogs = await UnifiedAuditLog.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('activityType action description userDetails timestamp success');

            console.log('\n📝 Latest 5 audit logs:');
            latestLogs.forEach((log: any, index: number) => {
                console.log(`\n${index + 1}. ${log.activityType} - ${log.action}`);
                console.log(`   User: ${log.userDetails?.email || 'Unknown'}`);
                console.log(`   Description: ${log.description}`);
                console.log(`   Success: ${log.success}`);
                console.log(`   Time: ${log.timestamp}`);
            });
        } else {
            console.log('\n⚠️  No audit logs found in database');
        }

        // Test creating a sample audit log
        console.log('\n🧪 Testing audit log creation...');

        const testUser = await User.findOne().select('_id firstName lastName email role workplaceId');

        if (!testUser) {
            console.log('❌ No users found in database.');
            process.exit(0);
        }

        console.log(`   Using test user: ${testUser.email}`);

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
        if (testLog.userDetails?.email) {
            console.log(`   User: ${testLog.userDetails.firstName} ${testLog.userDetails.lastName} (${testLog.userDetails.email})`);
        }

        const newCount = await UnifiedAuditLog.countDocuments();
        console.log(`\n📊 Total audit logs now: ${newCount}`);

        console.log('\n✅ Test completed successfully!');
        console.log('\n💡 Refresh the Audit Trail page to see the new log');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

testAuditLogging();
