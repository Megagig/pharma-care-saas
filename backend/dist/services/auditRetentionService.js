"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRetentionService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const rbacAuditService_1 = require("./rbacAuditService");
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zlib = __importStar(require("zlib"));
class AuditRetentionService {
    constructor() {
        this.retentionPolicies = new Map();
        this.archiveJobs = new Map();
        this.DEFAULT_POLICIES = [
            {
                category: 'rbac_management',
                retentionDays: 2555,
                archiveAfterDays: 365,
                compressionEnabled: true,
                exportFormat: 'json',
                archiveLocation: process.env.AUDIT_ARCHIVE_PATH || './archives/audit'
            },
            {
                category: 'security_monitoring',
                retentionDays: 2555,
                archiveAfterDays: 180,
                compressionEnabled: true,
                exportFormat: 'json',
                archiveLocation: process.env.AUDIT_ARCHIVE_PATH || './archives/audit'
            },
            {
                category: 'access_control',
                retentionDays: 1825,
                archiveAfterDays: 365,
                compressionEnabled: true,
                exportFormat: 'json',
                archiveLocation: process.env.AUDIT_ARCHIVE_PATH || './archives/audit'
            },
            {
                category: 'clinical_documentation',
                retentionDays: 3650,
                archiveAfterDays: 730,
                compressionEnabled: true,
                exportFormat: 'json',
                archiveLocation: process.env.AUDIT_ARCHIVE_PATH || './archives/audit'
            },
            {
                category: 'general',
                retentionDays: 1095,
                archiveAfterDays: 365,
                compressionEnabled: true,
                exportFormat: 'json',
                archiveLocation: process.env.AUDIT_ARCHIVE_PATH || './archives/audit'
            }
        ];
    }
    static getInstance() {
        if (!AuditRetentionService.instance) {
            AuditRetentionService.instance = new AuditRetentionService();
            AuditRetentionService.instance.initializeDefaultPolicies();
        }
        return AuditRetentionService.instance;
    }
    initializeDefaultPolicies() {
        this.DEFAULT_POLICIES.forEach(policy => {
            this.retentionPolicies.set(policy.category, policy);
        });
    }
    setRetentionPolicy(policy) {
        this.retentionPolicies.set(policy.category, policy);
    }
    getRetentionPolicy(category) {
        return this.retentionPolicies.get(category) || this.retentionPolicies.get('general');
    }
    getAllRetentionPolicies() {
        return Array.from(this.retentionPolicies.values());
    }
    async runRetentionCleanup() {
        const results = {
            totalProcessed: 0,
            totalArchived: 0,
            totalDeleted: 0,
            jobResults: []
        };
        for (const [category, policy] of this.retentionPolicies.entries()) {
            try {
                const result = await this.runCategoryRetention(category, policy);
                results.totalProcessed += result.recordsProcessed;
                results.totalArchived += result.recordsArchived;
                results.totalDeleted += result.recordsDeleted;
                results.jobResults.push({ category, result });
            }
            catch (error) {
                console.error(`Error running retention for category ${category}:`, error);
                results.jobResults.push({
                    category,
                    result: { error: error instanceof Error ? error.message : 'Unknown error' }
                });
            }
        }
        return results;
    }
    async runCategoryRetention(category, policy) {
        const jobId = `retention_${category}_${Date.now()}`;
        const job = {
            id: jobId,
            category,
            startDate: new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - policy.archiveAfterDays * 24 * 60 * 60 * 1000),
            status: 'running',
            recordsProcessed: 0,
            recordsArchived: 0,
            recordsDeleted: 0,
            createdAt: new Date()
        };
        this.archiveJobs.set(jobId, job);
        try {
            const archiveResult = await this.archiveOldRecords(category, policy, job);
            job.recordsArchived = archiveResult.recordsArchived;
            job.archiveFilePath = archiveResult.archiveFilePath;
            const deleteResult = await this.deleteExpiredRecords(category, policy);
            job.recordsDeleted = deleteResult.recordsDeleted;
            job.recordsProcessed = job.recordsArchived + job.recordsDeleted;
            job.status = 'completed';
            job.completedAt = new Date();
            await rbacAuditService_1.RBACSecurityAuditService.logPermissionChange({
                userId: new mongoose_1.default.Types.ObjectId(),
                action: 'AUDIT_RETENTION_EXECUTED',
                securityContext: {
                    riskScore: 10,
                    anomalyDetected: false
                }
            });
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.completedAt = new Date();
            console.error(`Retention job ${jobId} failed:`, error);
        }
        return job;
    }
    async archiveOldRecords(category, policy, job) {
        const archiveDate = new Date(Date.now() - policy.archiveAfterDays * 24 * 60 * 60 * 1000);
        const recordsToArchive = await AuditLog_1.AuditLog.find({
            complianceCategory: category,
            timestamp: { $lt: archiveDate },
            archived: { $ne: true }
        }).lean();
        if (recordsToArchive.length === 0) {
            return { recordsArchived: 0, archiveFilePath: '' };
        }
        const archiveDir = path.resolve(policy.archiveLocation);
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${category}_${timestamp}_${job.id}.${policy.exportFormat}`;
        const archiveFilePath = path.join(archiveDir, filename);
        let exportData;
        if (policy.exportFormat === 'csv') {
            exportData = await rbacAuditService_1.RBACSecurityAuditService.exportRBACLogs({
                startDate: job.startDate,
                endDate: archiveDate,
                format: 'csv',
                includeSecurityContext: true
            });
        }
        else {
            exportData = JSON.stringify(recordsToArchive, null, 2);
        }
        if (policy.compressionEnabled) {
            const compressedData = zlib.gzipSync(exportData);
            fs.writeFileSync(`${archiveFilePath}.gz`, compressedData);
        }
        else {
            fs.writeFileSync(archiveFilePath, exportData);
        }
        await AuditLog_1.AuditLog.updateMany({
            _id: { $in: recordsToArchive.map(r => r._id) }
        }, {
            $set: {
                archived: true,
                archivedAt: new Date(),
                archiveFilePath: policy.compressionEnabled ? `${archiveFilePath}.gz` : archiveFilePath
            }
        });
        return {
            recordsArchived: recordsToArchive.length,
            archiveFilePath: policy.compressionEnabled ? `${archiveFilePath}.gz` : archiveFilePath
        };
    }
    async deleteExpiredRecords(category, policy) {
        const expirationDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
        const deleteResult = await AuditLog_1.AuditLog.deleteMany({
            complianceCategory: category,
            timestamp: { $lt: expirationDate },
            archived: true
        });
        return { recordsDeleted: deleteResult.deletedCount || 0 };
    }
    getArchiveJob(jobId) {
        return this.archiveJobs.get(jobId);
    }
    getAllArchiveJobs() {
        return Array.from(this.archiveJobs.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async restoreArchivedRecords(archiveFilePath, category) {
        try {
            if (!fs.existsSync(archiveFilePath)) {
                throw new Error('Archive file not found');
            }
            let fileContent;
            if (archiveFilePath.endsWith('.gz')) {
                const compressedData = fs.readFileSync(archiveFilePath);
                fileContent = zlib.gunzipSync(compressedData).toString();
            }
            else {
                fileContent = fs.readFileSync(archiveFilePath, 'utf8');
            }
            let records;
            if (archiveFilePath.includes('.csv')) {
                throw new Error('CSV restoration not implemented yet');
            }
            else {
                records = JSON.parse(fileContent);
            }
            const recordsToRestore = records.map(record => {
                const { archived, archivedAt, archiveFilePath, ...cleanRecord } = record;
                return cleanRecord;
            });
            await AuditLog_1.AuditLog.insertMany(recordsToRestore);
            await rbacAuditService_1.RBACSecurityAuditService.logPermissionChange({
                userId: new mongoose_1.default.Types.ObjectId(),
                action: 'AUDIT_RECORDS_RESTORED',
                securityContext: {
                    riskScore: 20,
                    anomalyDetected: false
                }
            });
            return { recordsRestored: recordsToRestore.length };
        }
        catch (error) {
            console.error('Error restoring archived records:', error);
            throw error;
        }
    }
    async getRetentionStatistics() {
        const [totalRecords, archivedRecords, recordsByCategory, oldestRecord, newestRecord] = await Promise.all([
            AuditLog_1.AuditLog.countDocuments(),
            AuditLog_1.AuditLog.countDocuments({ archived: true }),
            AuditLog_1.AuditLog.aggregate([
                {
                    $group: {
                        _id: '$complianceCategory',
                        total: { $sum: 1 },
                        archived: {
                            $sum: { $cond: [{ $eq: ['$archived', true] }, 1, 0] }
                        }
                    }
                }
            ]),
            AuditLog_1.AuditLog.findOne({}, 'timestamp').sort({ timestamp: 1 }).lean(),
            AuditLog_1.AuditLog.findOne({}, 'timestamp').sort({ timestamp: -1 }).lean()
        ]);
        const categoryStats = recordsByCategory.reduce((acc, item) => {
            acc[item._id] = {
                total: item.total,
                archived: item.archived
            };
            return acc;
        }, {});
        const archiveJobs = Array.from(this.archiveJobs.values());
        const jobStats = {
            total: archiveJobs.length,
            completed: archiveJobs.filter(job => job.status === 'completed').length,
            failed: archiveJobs.filter(job => job.status === 'failed').length,
            running: archiveJobs.filter(job => job.status === 'running').length
        };
        return {
            totalRecords,
            archivedRecords,
            recordsByCategory: categoryStats,
            oldestRecord: oldestRecord?.timestamp || null,
            newestRecord: newestRecord?.timestamp || null,
            archiveJobs: jobStats
        };
    }
    scheduleRetentionCleanup(intervalHours = 24) {
        const intervalMs = intervalHours * 60 * 60 * 1000;
        setInterval(async () => {
            try {
                console.log('Running scheduled audit retention cleanup...');
                const result = await this.runRetentionCleanup();
                console.log('Retention cleanup completed:', result);
            }
            catch (error) {
                console.error('Scheduled retention cleanup failed:', error);
            }
        }, intervalMs);
        console.log(`Audit retention cleanup scheduled every ${intervalHours} hours`);
    }
    cleanupOldArchiveJobs(daysToKeep = 90) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        for (const [jobId, job] of this.archiveJobs.entries()) {
            if (job.completedAt && job.completedAt < cutoffDate) {
                this.archiveJobs.delete(jobId);
            }
        }
    }
}
exports.AuditRetentionService = AuditRetentionService;
exports.default = AuditRetentionService;
//# sourceMappingURL=auditRetentionService.js.map