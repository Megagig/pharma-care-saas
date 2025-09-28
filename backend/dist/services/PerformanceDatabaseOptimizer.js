"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class PerformanceDatabaseOptimizer {
    constructor() { }
    static getInstance() {
        if (!PerformanceDatabaseOptimizer.instance) {
            PerformanceDatabaseOptimizer.instance = new PerformanceDatabaseOptimizer();
        }
        return PerformanceDatabaseOptimizer.instance;
    }
    async createAllOptimizedIndexes() {
        const startTime = Date.now();
        const results = [];
        logger_1.default.info('Starting comprehensive database index optimization');
        try {
            const indexCreationPromises = [
                this.createPatientIndexes(),
                this.createClinicalNotesIndexes(),
                this.createMedicationIndexes(),
                this.createUserIndexes(),
                this.createWorkspaceIndexes(),
                this.createAuditLogIndexes(),
                this.createMTRIndexes(),
                this.createClinicalInterventionIndexes(),
                this.createCommunicationIndexes(),
                this.createNotificationIndexes(),
                this.createReportsIndexes(),
            ];
            const allResults = await Promise.allSettled(indexCreationPromises);
            allResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(...result.value);
                }
                else {
                    logger_1.default.error(`Index creation failed for collection group ${index}:`, result.reason);
                }
            });
            const executionTime = Date.now() - startTime;
            const successfulIndexes = results.filter(r => r.created).length;
            const failedIndexes = results.filter(r => !r.created).length;
            const summary = {
                totalIndexes: results.length,
                successfulIndexes,
                failedIndexes,
                results,
                executionTime,
                timestamp: new Date(),
            };
            logger_1.default.info('Database index optimization completed', {
                totalIndexes: summary.totalIndexes,
                successful: successfulIndexes,
                failed: failedIndexes,
                executionTime: `${executionTime}ms`,
            });
            return summary;
        }
        catch (error) {
            logger_1.default.error('Error during database optimization:', error);
            throw error;
        }
    }
    async createPatientIndexes() {
        const results = [];
        try {
            const Patient = mongoose_1.default.model('Patient');
            const indexes = [
                { workspaceId: 1, createdAt: -1 },
                { workspaceId: 1, updatedAt: -1 },
                { workspaceId: 1, 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 },
                { workspaceId: 1, 'personalInfo.lastName': 1, 'personalInfo.firstName': 1 },
                { workspaceId: 1, 'contactInfo.email': 1 },
                { workspaceId: 1, 'contactInfo.phone': 1 },
                { workspaceId: 1, 'medicalInfo.medicalRecordNumber': 1 },
                { workspaceId: 1, 'identifiers.value': 1, 'identifiers.type': 1 },
                { workspaceId: 1, 'personalInfo.dateOfBirth': 1 },
                { workspaceId: 1, 'personalInfo.gender': 1 },
                { workspaceId: 1, 'medicalInfo.primaryPhysician': 1 },
                { workspaceId: 1, status: 1, updatedAt: -1 },
                { workspaceId: 1, isActive: 1, updatedAt: -1 },
                { workspaceId: 1, 'insuranceInfo.primaryInsurance.provider': 1 },
                { workspaceId: 1, 'insuranceInfo.primaryInsurance.policyNumber': 1 },
                { workspaceId: 1, '$**': 'text' },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('patients', Patient.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating patient indexes:', error);
        }
        return results;
    }
    async createClinicalNotesIndexes() {
        const results = [];
        try {
            const ClinicalNote = mongoose_1.default.model('ClinicalNote');
            const indexes = [
                { patientId: 1, createdAt: -1 },
                { patientId: 1, updatedAt: -1 },
                { patientId: 1, noteType: 1, createdAt: -1 },
                { workspaceId: 1, createdAt: -1 },
                { workspaceId: 1, patientId: 1, createdAt: -1 },
                { authorId: 1, createdAt: -1 },
                { workspaceId: 1, authorId: 1, createdAt: -1 },
                { workspaceId: 1, noteType: 1, createdAt: -1 },
                { workspaceId: 1, category: 1, createdAt: -1 },
                { workspaceId: 1, status: 1, createdAt: -1 },
                { patientId: 1, status: 1, createdAt: -1 },
                { workspaceId: 1, dateOfService: -1 },
                { patientId: 1, dateOfService: -1 },
                { workspaceId: 1, priority: 1, createdAt: -1 },
                { patientId: 1, priority: 1, createdAt: -1 },
                { workspaceId: 1, templateId: 1, createdAt: -1 },
                { workspaceId: 1, '$**': 'text' },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('clinicalnotes', ClinicalNote.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating clinical notes indexes:', error);
        }
        return results;
    }
    async createMedicationIndexes() {
        const results = [];
        try {
            const Medication = mongoose_1.default.model('Medication');
            const indexes = [
                { patientId: 1, isActive: 1 },
                { patientId: 1, createdAt: -1 },
                { patientId: 1, status: 1, createdAt: -1 },
                { workspaceId: 1, isActive: 1 },
                { workspaceId: 1, createdAt: -1 },
                { rxcui: 1 },
                { workspaceId: 1, rxcui: 1 },
                { patientId: 1, rxcui: 1 },
                { workspaceId: 1, 'medication.name': 1 },
                { patientId: 1, 'medication.name': 1 },
                { workspaceId: 1, prescriberId: 1, createdAt: -1 },
                { patientId: 1, prescriberId: 1 },
                { patientId: 1, startDate: -1 },
                { patientId: 1, endDate: -1 },
                { workspaceId: 1, startDate: -1 },
                { workspaceId: 1, 'medication.type': 1, isActive: 1 },
                { patientId: 1, 'medication.category': 1, isActive: 1 },
                { patientId: 1, 'dosage.strength': 1, isActive: 1 },
                { patientId: 1, 'dosage.frequency': 1, isActive: 1 },
                { 'medication.drugClass': 1, isActive: 1 },
                { patientId: 1, 'medication.drugClass': 1, isActive: 1 },
                { patientId: 1, 'adherence.lastReported': -1 },
                { workspaceId: 1, 'adherence.adherenceRate': 1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('medications', Medication.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating medication indexes:', error);
        }
        return results;
    }
    async createUserIndexes() {
        const results = [];
        try {
            const User = mongoose_1.default.model('User');
            const indexes = [
                { email: 1 },
                { workspaceId: 1, email: 1 },
                { workspaceId: 1, role: 1 },
                { workspaceId: 1, role: 1, isActive: 1 },
                { workspaceId: 1, isActive: 1, createdAt: -1 },
                { isActive: 1, lastLoginAt: -1 },
                { workspaceId: 1, firstName: 1, lastName: 1 },
                { workspaceId: 1, lastName: 1, firstName: 1 },
                { workspaceId: 1, licenseNumber: 1 },
                { workspaceId: 1, profession: 1, isActive: 1 },
                { workspaceId: 1, department: 1, isActive: 1 },
                { workspaceId: 1, supervisor: 1 },
                { 'sessions.token': 1 },
                { 'sessions.expiresAt': 1 },
                { invitationToken: 1 },
                { invitationExpiresAt: 1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('users', User.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating user indexes:', error);
        }
        return results;
    }
    async createWorkspaceIndexes() {
        const results = [];
        try {
            const Workplace = mongoose_1.default.model('Workplace');
            const indexes = [
                { isActive: 1, createdAt: -1 },
                { name: 1, isActive: 1 },
                { ownerId: 1, isActive: 1 },
                { 'admins.userId': 1 },
                { 'subscription.planId': 1, isActive: 1 },
                { 'subscription.status': 1, isActive: 1 },
                { 'subscription.expiresAt': 1 },
                { 'settings.timezone': 1 },
                { 'settings.features': 1 },
                { licenseType: 1, isActive: 1 },
                { complianceStatus: 1, isActive: 1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('workplaces', Workplace.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating workspace indexes:', error);
        }
        return results;
    }
    async createAuditLogIndexes() {
        const results = [];
        try {
            const AuditLog = mongoose_1.default.model('AuditLog');
            const indexes = [
                { timestamp: -1 },
                { workspaceId: 1, timestamp: -1 },
                { userId: 1, timestamp: -1 },
                { workspaceId: 1, userId: 1, timestamp: -1 },
                { action: 1, timestamp: -1 },
                { workspaceId: 1, action: 1, timestamp: -1 },
                { resourceType: 1, resourceId: 1, timestamp: -1 },
                { workspaceId: 1, resourceType: 1, timestamp: -1 },
                { severity: 1, timestamp: -1 },
                { category: 1, timestamp: -1 },
                { workspaceId: 1, category: 1, timestamp: -1 },
                { ipAddress: 1, timestamp: -1 },
                { sessionId: 1, timestamp: -1 },
                { result: 1, timestamp: -1 },
                { workspaceId: 1, result: 1, timestamp: -1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('auditlogs', AuditLog.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating audit log indexes:', error);
        }
        return results;
    }
    async createMTRIndexes() {
        const results = [];
        try {
            const MTR = mongoose_1.default.model('MedicationTherapyReview');
            const indexes = [
                { patientId: 1, createdAt: -1 },
                { patientId: 1, status: 1, createdAt: -1 },
                { workspaceId: 1, createdAt: -1 },
                { workspaceId: 1, status: 1, createdAt: -1 },
                { pharmacistId: 1, createdAt: -1 },
                { workspaceId: 1, pharmacistId: 1, createdAt: -1 },
                { reviewType: 1, createdAt: -1 },
                { workspaceId: 1, reviewType: 1, createdAt: -1 },
                { reviewDate: -1 },
                { nextReviewDate: -1 },
                { workspaceId: 1, nextReviewDate: -1 },
                { priority: 1, createdAt: -1 },
                { workspaceId: 1, priority: 1, createdAt: -1 },
                { completedAt: -1 },
                { workspaceId: 1, completedAt: -1 },
                { followUpRequired: 1, nextReviewDate: -1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('medicationtherapyreviews', MTR.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating MTR indexes:', error);
        }
        return results;
    }
    async createClinicalInterventionIndexes() {
        const results = [];
        try {
            const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
            const indexes = [
                { patientId: 1, createdAt: -1 },
                { patientId: 1, status: 1, createdAt: -1 },
                { workspaceId: 1, createdAt: -1 },
                { workspaceId: 1, status: 1, createdAt: -1 },
                { interventionType: 1, createdAt: -1 },
                { workspaceId: 1, interventionType: 1, createdAt: -1 },
                { priority: 1, createdAt: -1 },
                { severity: 1, createdAt: -1 },
                { workspaceId: 1, priority: 1, severity: 1 },
                { pharmacistId: 1, createdAt: -1 },
                { providerId: 1, createdAt: -1 },
                { workspaceId: 1, pharmacistId: 1, createdAt: -1 },
                { outcome: 1, createdAt: -1 },
                { resolvedAt: -1 },
                { workspaceId: 1, outcome: 1, resolvedAt: -1 },
                { followUpRequired: 1, followUpDate: -1 },
                { workspaceId: 1, followUpRequired: 1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('clinicalinterventions', ClinicalIntervention.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating clinical intervention indexes:', error);
        }
        return results;
    }
    async createCommunicationIndexes() {
        const results = [];
        try {
            const Message = mongoose_1.default.model('Message');
            const indexes = [
                { conversationId: 1, createdAt: -1 },
                { conversationId: 1, messageType: 1, createdAt: -1 },
                { workspaceId: 1, createdAt: -1 },
                { senderId: 1, createdAt: -1 },
                { recipientId: 1, createdAt: -1 },
                { workspaceId: 1, senderId: 1, createdAt: -1 },
                { recipientId: 1, isRead: 1, createdAt: -1 },
                { conversationId: 1, isRead: 1 },
                { messageType: 1, createdAt: -1 },
                { priority: 1, createdAt: -1 },
                { workspaceId: 1, messageType: 1, createdAt: -1 },
                { patientId: 1, createdAt: -1 },
                { workspaceId: 1, patientId: 1, createdAt: -1 },
                { hasAttachments: 1, createdAt: -1 },
                { 'attachments.fileType': 1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('messages', Message.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating communication indexes:', error);
        }
        return results;
    }
    async createNotificationIndexes() {
        const results = [];
        try {
            const Notification = mongoose_1.default.model('Notification');
            const indexes = [
                { userId: 1, createdAt: -1 },
                { userId: 1, isRead: 1, createdAt: -1 },
                { workspaceId: 1, createdAt: -1 },
                { workspaceId: 1, userId: 1, createdAt: -1 },
                { type: 1, createdAt: -1 },
                { category: 1, createdAt: -1 },
                { workspaceId: 1, type: 1, createdAt: -1 },
                { priority: 1, createdAt: -1 },
                { userId: 1, priority: 1, isRead: 1 },
                { deliveryStatus: 1, createdAt: -1 },
                { scheduledFor: -1 },
                { expiresAt: -1 },
                { patientId: 1, createdAt: -1 },
                { userId: 1, patientId: 1, createdAt: -1 },
            ];
            for (const indexSpec of indexes) {
                const result = await this.createSingleIndex('notifications', Notification.collection, indexSpec);
                results.push(result);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating notification indexes:', error);
        }
        return results;
    }
    async createReportsIndexes() {
        const results = [];
        try {
            const reportModels = ['Report', 'ReportTemplate', 'ReportSchedule'];
            for (const modelName of reportModels) {
                try {
                    const ReportModel = mongoose_1.default.model(modelName);
                    const indexes = [
                        { workspaceId: 1, createdAt: -1 },
                        { reportType: 1, createdAt: -1 },
                        { workspaceId: 1, reportType: 1, createdAt: -1 },
                        { createdBy: 1, createdAt: -1 },
                        { workspaceId: 1, createdBy: 1, createdAt: -1 },
                        { status: 1, createdAt: -1 },
                        { workspaceId: 1, status: 1, createdAt: -1 },
                        { dateRange: 1, createdAt: -1 },
                        { generatedAt: -1 },
                        { workspaceId: 1, generatedAt: -1 },
                        { isScheduled: 1, nextRunDate: -1 },
                        { workspaceId: 1, isScheduled: 1 },
                    ];
                    for (const indexSpec of indexes) {
                        const result = await this.createSingleIndex(modelName.toLowerCase() + 's', ReportModel.collection, indexSpec);
                        results.push(result);
                    }
                }
                catch (error) {
                    continue;
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error creating report indexes:', error);
        }
        return results;
    }
    async createSingleIndex(collectionName, collection, indexSpec) {
        const startTime = Date.now();
        try {
            await collection.createIndex(indexSpec, {
                background: true,
                name: this.generateIndexName(indexSpec)
            });
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Created index on ${collectionName}:`, {
                indexSpec,
                executionTime: `${executionTime}ms`
            });
            return {
                collection: collectionName,
                indexSpec,
                created: true,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            if (error.code === 85) {
                logger_1.default.debug(`Index already exists on ${collectionName}:`, indexSpec);
                return {
                    collection: collectionName,
                    indexSpec,
                    created: false,
                    error: 'Index already exists',
                    executionTime,
                };
            }
            logger_1.default.warn(`Failed to create index on ${collectionName}:`, {
                indexSpec,
                error: error.message,
                executionTime: `${executionTime}ms`
            });
            return {
                collection: collectionName,
                indexSpec,
                created: false,
                error: error.message,
                executionTime,
            };
        }
    }
    generateIndexName(indexSpec) {
        const keys = Object.keys(indexSpec);
        const name = keys
            .map(key => {
            const direction = indexSpec[key];
            if (direction === 1)
                return key;
            if (direction === -1)
                return `${key}_desc`;
            if (direction === 'text')
                return `${key}_text`;
            return `${key}_${direction}`;
        })
            .join('_');
        return name.length > 120 ? name.substring(0, 120) : name;
    }
    async analyzeExistingIndexes() {
        try {
            const db = mongoose_1.default.connection.db;
            const collections = await db.listCollections().toArray();
            let totalIndexes = 0;
            const unusedIndexes = [];
            const recommendations = [];
            for (const collection of collections) {
                try {
                    const coll = db.collection(collection.name);
                    const indexes = await coll.indexes();
                    totalIndexes += indexes.length;
                    logger_1.default.debug(`Collection ${collection.name} has ${indexes.length} indexes`);
                }
                catch (error) {
                    logger_1.default.warn(`Failed to analyze indexes for collection ${collection.name}:`, error);
                }
            }
            return {
                collections: collections.map(c => c.name),
                totalIndexes,
                unusedIndexes,
                recommendations,
            };
        }
        catch (error) {
            logger_1.default.error('Error analyzing existing indexes:', error);
            throw error;
        }
    }
    async dropUnusedIndexes(dryRun = true) {
        const droppedIndexes = [];
        const errors = [];
        try {
            logger_1.default.info(`${dryRun ? 'Analyzing' : 'Dropping'} unused indexes`);
            return {
                droppedIndexes,
                errors,
            };
        }
        catch (error) {
            logger_1.default.error('Error dropping unused indexes:', error);
            throw error;
        }
    }
}
exports.default = PerformanceDatabaseOptimizer;
//# sourceMappingURL=PerformanceDatabaseOptimizer.js.map