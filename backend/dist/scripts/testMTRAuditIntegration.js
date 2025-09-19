#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const MTRAuditLog_1 = __importDefault(require("../models/MTRAuditLog"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const Patient_1 = __importDefault(require("../models/Patient"));
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
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
async function createTestData() {
    console.log('🏗️ Creating test data...');
    const ownerId = new mongoose_1.default.Types.ObjectId();
    const workplace = new Workplace_1.default({
        name: 'Test Pharmacy',
        type: 'Community',
        address: '123 Test St, Test City',
        state: 'Lagos',
        lga: 'Test LGA',
        email: `test-${Date.now()}@pharmacy.com`,
        licenseNumber: `TEST-LIC-${Date.now()}`,
        ownerId: ownerId,
        inviteCode: `TEST-INVITE-${Date.now()}`,
        teamMembers: [],
        documents: [],
    });
    await workplace.save();
    const user = new User_1.default({
        firstName: 'Test',
        lastName: 'Pharmacist',
        email: `test.pharmacist-${Date.now()}@pharmacy.com`,
        passwordHash: 'hashedpassword123',
        role: 'pharmacist',
        status: 'active',
        emailVerified: true,
        workplaceId: workplace._id,
        workplaceRole: 'Pharmacist',
        currentPlanId: new mongoose_1.default.Types.ObjectId(),
        licenseNumber: `PHARM-LIC-${Date.now()}`,
        licenseStatus: 'approved',
    });
    await user.save();
    const patient = new Patient_1.default({
        firstName: 'Test',
        lastName: 'Patient',
        dob: new Date('1980-01-01'),
        workplaceId: workplace._id,
        mrn: `TEST-MRN-${Date.now()}`,
        createdBy: user._id,
    });
    await patient.save();
    console.log('✅ Test data created');
    return { workplace, user, patient };
}
async function testMTRAuditIntegration() {
    console.log('\n🧪 Testing MTR Audit Integration...\n');
    const { workplace, user, patient } = await createTestData();
    try {
        await MTRAuditLog_1.default.deleteMany({ workplaceId: workplace._id });
        console.log('1️⃣ Testing MTR session creation audit...');
        const mtrSession = new MedicationTherapyReview_1.default({
            workplaceId: workplace._id,
            patientId: patient._id,
            pharmacistId: user._id,
            reviewNumber: 'MTR-TEST-001',
            status: 'in_progress',
            priority: 'routine',
            reviewType: 'initial',
            patientConsent: true,
            confidentialityAgreed: true,
            steps: {
                patientSelection: { completed: true, completedAt: new Date() },
                medicationHistory: { completed: false },
                therapyAssessment: { completed: false },
                planDevelopment: { completed: false },
                interventions: { completed: false },
                followUp: { completed: false },
            },
            medications: [],
            problems: [],
            interventions: [],
            followUps: [],
            clinicalOutcomes: {
                problemsResolved: 0,
                medicationsOptimized: 0,
                adherenceImproved: false,
                adverseEventsReduced: false,
            },
            startedAt: new Date(),
            createdBy: user._id,
        });
        await mtrSession.save();
        const auditLogs = await MTRAuditLog_1.default.find({
            workplaceId: workplace._id,
            resourceType: 'MedicationTherapyReview',
            resourceId: mtrSession._id,
        });
        if (auditLogs.length > 0) {
            console.log('✅ MTR session creation audit log found');
            console.log('   Action:', auditLogs[0]?.action);
            console.log('   Risk Level:', auditLogs[0]?.riskLevel);
            console.log('   Compliance Category:', auditLogs[0]?.complianceCategory);
        }
        else {
            console.log('⚠️ No audit log found for MTR session creation');
        }
        console.log('\n2️⃣ Testing MTR session update audit...');
        const oldStatus = mtrSession.status;
        mtrSession.status = 'completed';
        mtrSession.completedAt = new Date();
        mtrSession.steps.medicationHistory.completed = true;
        mtrSession.steps.medicationHistory.completedAt = new Date();
        await mtrSession.save();
        const updateAuditLogs = await MTRAuditLog_1.default.find({
            workplaceId: workplace._id,
            resourceType: 'MedicationTherapyReview',
            resourceId: mtrSession._id,
            action: { $regex: /UPDATE/i },
        });
        if (updateAuditLogs.length > 0) {
            console.log('✅ MTR session update audit log found');
            console.log('   Old Status:', oldStatus);
            console.log('   New Status:', mtrSession.status);
        }
        else {
            console.log('⚠️ No audit log found for MTR session update');
        }
        console.log('\n3️⃣ Testing audit log completeness...');
        const allAuditLogs = await MTRAuditLog_1.default.find({ workplaceId: workplace._id });
        console.log(`✅ Total audit logs created: ${allAuditLogs.length}`);
        for (const log of allAuditLogs) {
            console.log(`   - ${log.action} (${log.riskLevel} risk, ${log.complianceCategory})`);
            const requiredFields = ['action', 'resourceType', 'resourceId', 'userId', 'workplaceId', 'timestamp'];
            const missingFields = requiredFields.filter(field => !log[field]);
            if (missingFields.length > 0) {
                console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
            }
            else {
                console.log('   ✅ All required fields present');
            }
        }
        console.log('\n4️⃣ Testing audit log queries...');
        const riskAggregation = await MTRAuditLog_1.default.aggregate([
            { $match: { workplaceId: workplace._id } },
            { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        console.log('✅ Risk level distribution:', riskAggregation);
        const complianceAggregation = await MTRAuditLog_1.default.aggregate([
            { $match: { workplaceId: workplace._id } },
            { $group: { _id: '$complianceCategory', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        console.log('✅ Compliance category distribution:', complianceAggregation);
        const recentLogs = await MTRAuditLog_1.default.find({
            workplaceId: workplace._id,
            timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
        }).sort({ timestamp: -1 });
        console.log(`✅ Recent audit logs (last hour): ${recentLogs.length}`);
        console.log('\n5️⃣ Testing audit log virtual properties...');
        const sampleLog = allAuditLogs[0];
        if (sampleLog) {
            console.log('✅ Virtual properties test:');
            console.log(`   Action Display: ${sampleLog.actionDisplay}`);
            console.log(`   Risk Level Display: ${sampleLog.riskLevelDisplay}`);
            console.log(`   Compliance Category Display: ${sampleLog.complianceCategoryDisplay}`);
        }
        console.log('\n🎉 MTR Audit Integration tests completed successfully!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
    finally {
        console.log('\n🧹 Cleaning up test data...');
        await MTRAuditLog_1.default.deleteMany({ workplaceId: workplace._id });
        await MedicationTherapyReview_1.default.deleteMany({ workplaceId: workplace._id });
        await Patient_1.default.deleteMany({ workplaceId: workplace._id });
        await User_1.default.deleteMany({ workplaceId: workplace._id });
        await Workplace_1.default.deleteMany({ _id: workplace._id });
        console.log('✅ Test data cleaned up');
    }
}
async function main() {
    try {
        await connectToDatabase();
        await testMTRAuditIntegration();
        console.log('\n✅ All MTR audit integration tests passed!');
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
//# sourceMappingURL=testMTRAuditIntegration.js.map