"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackReportsMigrations = exports.runAllReportsMigrations = exports.validateDataIntegrity = exports.migrateExistingReportData = exports.createDefaultReportTemplates = exports.createReportsIndexes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ReportTemplate_1 = __importDefault(require("../models/ReportTemplate"));
const ReportSchedule_1 = __importDefault(require("../models/ReportSchedule"));
const ReportAuditLog_1 = __importDefault(require("../models/ReportAuditLog"));
const logger_1 = __importDefault(require("../utils/logger"));
const createReportsIndexes = async () => {
    try {
        logger_1.default.info('Creating indexes for Reports & Analytics models...');
        await ReportTemplate_1.default.collection.createIndex({ workplaceId: 1, reportType: 1 });
        await ReportTemplate_1.default.collection.createIndex({ workplaceId: 1, isPublic: 1, isActive: 1 });
        await ReportTemplate_1.default.collection.createIndex({ createdBy: 1, workplaceId: 1 });
        await ReportTemplate_1.default.collection.createIndex({ tags: 1 });
        await ReportTemplate_1.default.collection.createIndex({ category: 1, isActive: 1 });
        await ReportTemplate_1.default.collection.createIndex({ 'usage.viewCount': -1 });
        await ReportTemplate_1.default.collection.createIndex({ createdAt: -1 });
        await ReportTemplate_1.default.collection.createIndex({ name: 'text', description: 'text', tags: 'text' }, { weights: { name: 10, description: 5, tags: 3 } });
        await ReportSchedule_1.default.collection.createIndex({ workplaceId: 1, isActive: 1 });
        await ReportSchedule_1.default.collection.createIndex({ workplaceId: 1, reportType: 1, isActive: 1 });
        await ReportSchedule_1.default.collection.createIndex({ nextRun: 1, isActive: 1 });
        await ReportSchedule_1.default.collection.createIndex({ createdBy: 1, workplaceId: 1 });
        await ReportSchedule_1.default.collection.createIndex({ lastRun: -1 });
        await ReportSchedule_1.default.collection.createIndex({ lastRunStatus: 1, isActive: 1 });
        await ReportSchedule_1.default.collection.createIndex({ priority: 1, nextRun: 1 });
        await ReportSchedule_1.default.collection.createIndex({ tags: 1 });
        await ReportSchedule_1.default.collection.createIndex({
            isActive: 1,
            nextRun: 1,
            priority: -1
        });
        await ReportSchedule_1.default.collection.createIndex({ name: 'text', description: 'text', tags: 'text' }, { weights: { name: 10, description: 5, tags: 3 } });
        await ReportAuditLog_1.default.collection.createIndex({ workplaceId: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ userId: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ eventType: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ reportType: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ 'eventDetails.success': 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ 'compliance.sensitiveData': 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ riskScore: -1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ flagged: 1, reviewStatus: 1 });
        await ReportAuditLog_1.default.collection.createIndex({ ipAddress: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({ sessionId: 1, createdAt: -1 });
        await ReportAuditLog_1.default.collection.createIndex({
            workplaceId: 1,
            eventType: 1,
            createdAt: -1
        });
        await ReportAuditLog_1.default.collection.createIndex({
            workplaceId: 1,
            userId: 1,
            'eventDetails.success': 1,
            createdAt: -1
        });
        await ReportAuditLog_1.default.collection.createIndex({
            workplaceId: 1,
            'compliance.sensitiveData': 1,
            riskScore: -1,
            createdAt: -1
        });
        await ReportAuditLog_1.default.collection.createIndex({
            'eventDetails.errorMessage': 'text',
            'compliance.accessJustification': 'text',
            'reviewNotes': 'text',
            'tags': 'text'
        });
        await ReportAuditLog_1.default.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 });
        logger_1.default.info('Successfully created all indexes for Reports & Analytics models');
        return {
            success: true,
            message: 'All indexes created successfully'
        };
    }
    catch (error) {
        logger_1.default.error('Error creating Reports & Analytics indexes:', error);
        return {
            success: false,
            message: 'Failed to create indexes',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.createReportsIndexes = createReportsIndexes;
const createDefaultReportTemplates = async (workplaceId, userId) => {
    try {
        logger_1.default.info('Creating default report templates...');
        const defaultTemplates = [
            {
                name: 'Patient Outcomes Dashboard',
                description: 'Comprehensive view of patient therapy outcomes and clinical improvements',
                reportType: 'patient-outcomes',
                category: 'Clinical',
                layout: {
                    sections: [
                        {
                            id: 'therapy-effectiveness',
                            type: 'chart',
                            title: 'Therapy Effectiveness by Type',
                            position: { x: 0, y: 0, width: 6, height: 4 },
                            config: { chartType: 'bar' }
                        },
                        {
                            id: 'clinical-improvements',
                            type: 'chart',
                            title: 'Clinical Parameter Improvements',
                            position: { x: 6, y: 0, width: 6, height: 4 },
                            config: { chartType: 'pie' }
                        },
                        {
                            id: 'adverse-events',
                            type: 'chart',
                            title: 'Adverse Event Reduction',
                            position: { x: 0, y: 4, width: 12, height: 3 },
                            config: { chartType: 'line' }
                        }
                    ],
                    theme: {
                        colorPalette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                        fontFamily: 'Inter',
                        fontSize: 14
                    },
                    responsive: true
                },
                filters: [
                    {
                        key: 'dateRange',
                        label: 'Date Range',
                        type: 'date',
                        required: true
                    },
                    {
                        key: 'therapyType',
                        label: 'Therapy Type',
                        type: 'select',
                        required: false
                    }
                ],
                charts: [
                    {
                        id: 'therapy-effectiveness',
                        type: 'bar',
                        title: 'Therapy Effectiveness',
                        dataSource: 'patient-outcomes',
                        config: {
                            xAxis: 'therapyType',
                            yAxis: 'completionRate',
                            showLegend: true,
                            showTooltip: true,
                            animations: true
                        },
                        styling: {
                            width: 500,
                            height: 300,
                            borderRadius: 8,
                            padding: 16
                        }
                    }
                ],
                tables: [],
                createdBy: new mongoose_1.default.Types.ObjectId(userId),
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                isPublic: false,
                isActive: true,
                tags: ['clinical', 'outcomes', 'dashboard'],
                permissions: {
                    view: ['pharmacist', 'admin'],
                    edit: ['admin'],
                    delete: ['admin']
                }
            },
            {
                name: 'Pharmacist Performance Report',
                description: 'Track individual and team pharmacist performance metrics',
                reportType: 'pharmacist-interventions',
                category: 'Performance',
                layout: {
                    sections: [
                        {
                            id: 'intervention-metrics',
                            type: 'chart',
                            title: 'Intervention Acceptance Rates',
                            position: { x: 0, y: 0, width: 8, height: 4 },
                            config: { chartType: 'bar' }
                        },
                        {
                            id: 'performance-kpis',
                            type: 'kpi',
                            title: 'Key Performance Indicators',
                            position: { x: 8, y: 0, width: 4, height: 4 },
                            config: { layout: 'grid' }
                        }
                    ],
                    theme: {
                        colorPalette: ['#059669', '#DC2626', '#D97706', '#7C3AED'],
                        fontFamily: 'Inter',
                        fontSize: 14
                    },
                    responsive: true
                },
                filters: [
                    {
                        key: 'dateRange',
                        label: 'Date Range',
                        type: 'date',
                        required: true
                    },
                    {
                        key: 'pharmacistId',
                        label: 'Pharmacist',
                        type: 'select',
                        required: false
                    }
                ],
                charts: [
                    {
                        id: 'intervention-metrics',
                        type: 'bar',
                        title: 'Intervention Metrics',
                        dataSource: 'pharmacist-interventions',
                        config: {
                            xAxis: 'pharmacistName',
                            yAxis: 'acceptanceRate',
                            showLegend: true,
                            showTooltip: true,
                            animations: true
                        },
                        styling: {
                            width: 600,
                            height: 300,
                            borderRadius: 8,
                            padding: 16
                        }
                    }
                ],
                tables: [],
                createdBy: new mongoose_1.default.Types.ObjectId(userId),
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                isPublic: false,
                isActive: true,
                tags: ['pharmacist', 'performance', 'interventions'],
                permissions: {
                    view: ['pharmacist', 'admin'],
                    edit: ['admin'],
                    delete: ['admin']
                }
            },
            {
                name: 'Cost-Effectiveness Analysis',
                description: 'Financial impact analysis of pharmacy interventions',
                reportType: 'cost-effectiveness',
                category: 'Financial',
                layout: {
                    sections: [
                        {
                            id: 'cost-savings',
                            type: 'chart',
                            title: 'Cost Savings by Intervention Type',
                            position: { x: 0, y: 0, width: 6, height: 4 },
                            config: { chartType: 'waterfall' }
                        },
                        {
                            id: 'roi-analysis',
                            type: 'chart',
                            title: 'Return on Investment',
                            position: { x: 6, y: 0, width: 6, height: 4 },
                            config: { chartType: 'gauge' }
                        }
                    ],
                    theme: {
                        colorPalette: ['#059669', '#DC2626', '#D97706', '#7C3AED'],
                        fontFamily: 'Inter',
                        fontSize: 14
                    },
                    responsive: true
                },
                filters: [
                    {
                        key: 'dateRange',
                        label: 'Date Range',
                        type: 'date',
                        required: true
                    },
                    {
                        key: 'interventionType',
                        label: 'Intervention Type',
                        type: 'multiselect',
                        required: false
                    }
                ],
                charts: [
                    {
                        id: 'cost-savings',
                        type: 'waterfall',
                        title: 'Cost Savings Analysis',
                        dataSource: 'cost-effectiveness',
                        config: {
                            xAxis: 'interventionType',
                            yAxis: 'costSavings',
                            showLegend: true,
                            showTooltip: true,
                            animations: true
                        },
                        styling: {
                            width: 500,
                            height: 300,
                            borderRadius: 8,
                            padding: 16
                        }
                    }
                ],
                tables: [],
                createdBy: new mongoose_1.default.Types.ObjectId(userId),
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                isPublic: false,
                isActive: true,
                tags: ['financial', 'cost-savings', 'roi'],
                permissions: {
                    view: ['admin', 'financial_analyst'],
                    edit: ['admin'],
                    delete: ['admin']
                }
            }
        ];
        const createdTemplates = await ReportTemplate_1.default.insertMany(defaultTemplates);
        logger_1.default.info(`Created ${createdTemplates.length} default report templates`);
        return {
            success: true,
            message: `Successfully created ${createdTemplates.length} default report templates`,
            details: { templateIds: createdTemplates.map(t => t._id) }
        };
    }
    catch (error) {
        logger_1.default.error('Error creating default report templates:', error);
        return {
            success: false,
            message: 'Failed to create default report templates',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.createDefaultReportTemplates = createDefaultReportTemplates;
const migrateExistingReportData = async () => {
    try {
        logger_1.default.info('Migrating existing report data...');
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        const requiredCollections = ['reporttemplates', 'reportschedules', 'reportauditlogs'];
        const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
        if (missingCollections.length > 0) {
            logger_1.default.info(`Creating missing collections: ${missingCollections.join(', ')}`);
            for (const collectionName of missingCollections) {
                await mongoose_1.default.connection.db.createCollection(collectionName);
            }
        }
        logger_1.default.info('Successfully migrated existing report data');
        return {
            success: true,
            message: 'Existing report data migrated successfully',
            details: {
                existingCollections: collectionNames.length,
                createdCollections: missingCollections.length
            }
        };
    }
    catch (error) {
        logger_1.default.error('Error migrating existing report data:', error);
        return {
            success: false,
            message: 'Failed to migrate existing report data',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.migrateExistingReportData = migrateExistingReportData;
const validateDataIntegrity = async () => {
    try {
        logger_1.default.info('Validating data integrity...');
        const templateIndexes = await ReportTemplate_1.default.collection.getIndexes();
        const scheduleIndexes = await ReportSchedule_1.default.collection.getIndexes();
        const auditIndexes = await ReportAuditLog_1.default.collection.getIndexes();
        const requiredTemplateIndexes = ['workplaceId_1_reportType_1', 'name_text_description_text_tags_text'];
        const requiredScheduleIndexes = ['workplaceId_1_isActive_1', 'nextRun_1_isActive_1'];
        const requiredAuditIndexes = ['workplaceId_1_createdAt_-1', 'userId_1_createdAt_-1'];
        const missingIndexes = [];
        for (const indexName of requiredTemplateIndexes) {
            if (!templateIndexes[indexName]) {
                missingIndexes.push(`ReportTemplate.${indexName}`);
            }
        }
        for (const indexName of requiredScheduleIndexes) {
            if (!scheduleIndexes[indexName]) {
                missingIndexes.push(`ReportSchedule.${indexName}`);
            }
        }
        for (const indexName of requiredAuditIndexes) {
            if (!auditIndexes[indexName]) {
                missingIndexes.push(`ReportAuditLog.${indexName}`);
            }
        }
        if (missingIndexes.length > 0) {
            logger_1.default.warn(`Missing indexes: ${missingIndexes.join(', ')}`);
        }
        const templateStats = await ReportTemplate_1.default.collection.stats();
        const scheduleStats = await ReportSchedule_1.default.collection.stats();
        const auditStats = await ReportAuditLog_1.default.collection.stats();
        logger_1.default.info('Data integrity validation completed');
        return {
            success: true,
            message: 'Data integrity validation completed',
            details: {
                missingIndexes: missingIndexes.length,
                collections: {
                    templates: { count: templateStats.count, size: templateStats.size },
                    schedules: { count: scheduleStats.count, size: scheduleStats.size },
                    auditLogs: { count: auditStats.count, size: auditStats.size }
                }
            }
        };
    }
    catch (error) {
        logger_1.default.error('Error validating data integrity:', error);
        return {
            success: false,
            message: 'Failed to validate data integrity',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.validateDataIntegrity = validateDataIntegrity;
const runAllReportsMigrations = async (workplaceId, userId) => {
    try {
        logger_1.default.info('Starting Reports & Analytics migrations...');
        const results = [];
        const indexResult = await (0, exports.createReportsIndexes)();
        results.push(indexResult);
        if (!indexResult.success) {
            throw new Error(`Index creation failed: ${indexResult.message}`);
        }
        const migrationResult = await (0, exports.migrateExistingReportData)();
        results.push(migrationResult);
        if (!migrationResult.success) {
            throw new Error(`Data migration failed: ${migrationResult.message}`);
        }
        if (workplaceId && userId) {
            const templateResult = await (0, exports.createDefaultReportTemplates)(workplaceId, userId);
            results.push(templateResult);
            if (!templateResult.success) {
                logger_1.default.warn(`Default template creation failed: ${templateResult.message}`);
            }
        }
        const validationResult = await (0, exports.validateDataIntegrity)();
        results.push(validationResult);
        if (!validationResult.success) {
            logger_1.default.warn(`Data integrity validation failed: ${validationResult.message}`);
        }
        logger_1.default.info('All Reports & Analytics migrations completed successfully');
        return {
            success: true,
            message: 'All migrations completed successfully',
            details: { results }
        };
    }
    catch (error) {
        logger_1.default.error('Error running Reports & Analytics migrations:', error);
        return {
            success: false,
            message: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.runAllReportsMigrations = runAllReportsMigrations;
const rollbackReportsMigrations = async () => {
    try {
        logger_1.default.info('Rolling back Reports & Analytics migrations...');
        await mongoose_1.default.connection.db.dropCollection('reporttemplates').catch(() => { });
        await mongoose_1.default.connection.db.dropCollection('reportschedules').catch(() => { });
        await mongoose_1.default.connection.db.dropCollection('reportauditlogs').catch(() => { });
        logger_1.default.info('Reports & Analytics migrations rolled back successfully');
        return {
            success: true,
            message: 'Migrations rolled back successfully'
        };
    }
    catch (error) {
        logger_1.default.error('Error rolling back Reports & Analytics migrations:', error);
        return {
            success: false,
            message: 'Rollback failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.rollbackReportsMigrations = rollbackReportsMigrations;
//# sourceMappingURL=reportsMigrations.js.map