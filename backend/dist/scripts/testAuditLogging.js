#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const auditService_1 = __importDefault(require("../services/auditService"));
const MTRAuditLog_1 = __importDefault(require("../models/MTRAuditLog"));
(0, dotenv_1.config)();
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    }
    catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
async function testAuditLogging() {
    console.log('\n🧪 Testing MTR Audit Logging System...\n');
    const testWorkplaceId = new mongoose_1.default.Types.ObjectId();
    const testUserId = new mongoose_1.default.Types.ObjectId();
    const testPatientId = new mongoose_1.default.Types.ObjectId();
    const testReviewId = new mongoose_1.default.Types.ObjectId();
    const testContext = {
        userId: testUserId,
        workplaceId: testWorkplaceId,
        userRole: 'pharmacist',
        sessionId: 'test-session-123',
        ipAddress: '192.168.1.100',
        userAgent: 'Test User Agent',
        requestMethod: 'POST',
        requestUrl: '/api/mtr',
    };
    try {
        console.log('1️⃣ Testing MTR session creation audit log...');
        const sessionLog = await auditService_1.default.logActivity(testContext, {
            action: 'CREATE_MTR_SESSION',
            resourceType: 'MedicationTherapyReview',
            resourceId: testReviewId,
            patientId: testPatientId,
            reviewId: testReviewId,
            details: {
                reviewNumber: 'MTR-2024-001',
                status: 'in_progress',
                priority: 'routine',
                reviewType: 'initial',
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'medium',
        });
        console.log('✅ MTR session audit log created:', sessionLog._id);
        console.log('\n2️⃣ Testing high-risk activity audit log...');
        const highRiskLog = await auditService_1.default.logActivity(testContext, {
            action: 'DELETE_MTR_SESSION',
            resourceType: 'MedicationTherapyReview',
            resourceId: testReviewId,
            patientId: testPatientId,
            reviewId: testReviewId,
            details: {
                reason: 'Test deletion',
                deletedBy: 'test-user',
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'critical',
        });
        console.log('✅ High-risk activity audit log created:', highRiskLog._id);
        console.log('\n3️⃣ Testing patient access audit log...');
        const accessLog = await auditService_1.default.logPatientAccess(testContext, testPatientId, 'view', {
            accessReason: 'MTR review',
            dataAccessed: ['demographics', 'medications', 'allergies'],
        });
        console.log('✅ Patient access audit log created:', accessLog._id);
        console.log('\n4️⃣ Testing authentication audit log...');
        const authLog = await auditService_1.default.logAuthEvent(testContext, 'LOGIN', {
            loginMethod: 'email',
            deviceInfo: 'Test Device',
            location: 'Test Location',
        });
        console.log('✅ Authentication audit log created:', authLog?._id);
        console.log('\n5️⃣ Testing audit log retrieval with filters...');
        const auditLogs = await MTRAuditLog_1.default.find({
            workplaceId: testWorkplaceId,
            riskLevel: 'critical',
        }).limit(10).sort({ timestamp: -1 });
        console.log(`✅ Retrieved ${auditLogs.length} audit logs`);
        console.log('\n6️⃣ Testing audit summary generation...');
        const summaryStats = await MTRAuditLog_1.default.aggregate([
            { $match: { workplaceId: testWorkplaceId } },
            {
                $group: {
                    _id: null,
                    totalLogs: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    errorCount: {
                        $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalLogs: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    errorCount: 1,
                    errorRate: {
                        $cond: [
                            { $gt: ['$totalLogs', 0] },
                            { $multiply: [{ $divide: ['$errorCount', '$totalLogs'] }, 100] },
                            0,
                        ],
                    },
                },
            },
        ]);
        const summary = summaryStats[0] || { totalLogs: 0, uniqueUserCount: 0, errorRate: 0 };
        console.log('✅ Audit summary generated:', summary);
        console.log('\n7️⃣ Testing audit data export...');
        const exportLogs = await MTRAuditLog_1.default.find({ workplaceId: testWorkplaceId })
            .select('-__v')
            .lean();
        const exportData = JSON.stringify(exportLogs, null, 2);
        console.log('✅ Audit data exported:', {
            recordCount: exportLogs.length,
            dataSize: exportData.length,
        });
        console.log('\n8️⃣ Testing basic audit log queries...');
        const riskCounts = await MTRAuditLog_1.default.aggregate([
            { $match: { workplaceId: testWorkplaceId } },
            { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
        ]);
        console.log('✅ Risk level distribution:', riskCounts);
        const categoryCounts = await MTRAuditLog_1.default.aggregate([
            { $match: { workplaceId: testWorkplaceId } },
            { $group: { _id: '$complianceCategory', count: { $sum: 1 } } },
        ]);
        console.log('✅ Compliance category distribution:', categoryCounts);
        console.log('\n9️⃣ Testing audit log model virtuals...');
        const sampleLog = await MTRAuditLog_1.default.findOne({ workplaceId: testWorkplaceId });
        if (sampleLog) {
            console.log('✅ Virtual fields test:', {
                actionDisplay: sampleLog.actionDisplay,
                riskLevelDisplay: sampleLog.riskLevelDisplay,
                complianceCategoryDisplay: sampleLog.complianceCategoryDisplay,
            });
        }
        console.log('\n🎉 All audit logging tests completed successfully!');
        console.log('\n🧹 Cleaning up test data...');
        await MTRAuditLog_1.default.deleteMany({
            workplaceId: testWorkplaceId,
        });
        console.log('✅ Test data cleaned up');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}
async function main() {
    try {
        await connectToDatabase();
        await testAuditLogging();
        console.log('\n✅ All tests passed! MTR audit logging system is working correctly.');
    }
    catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}
if (require.main === module) {
    main().catch(console.error);
}
exports.default = main;
//# sourceMappingURL=testAuditLogging.js.map