"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auditService_1 = require("../../../services/auditService");
const logger_1 = __importDefault(require("../../../utils/logger"));
class ManualLabAuditService {
    static async logOrderCreation(context, order, pdfGenerated = false, generationTime) {
        try {
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_ORDER_CREATED',
                resourceType: 'Patient',
                resourceId: order._id,
                patientId: order.patientId,
                details: {
                    orderId: order.orderId,
                    testCount: order.tests.length,
                    testCodes: order.tests.map(t => t.code),
                    priority: order.priority,
                    indication: order.indication,
                    consentObtained: order.consentObtained,
                    consentTimestamp: order.consentTimestamp,
                    pdfGenerated,
                    pdfGenerationTime: generationTime,
                    locationId: order.locationId,
                    requisitionUrl: order.requisitionFormUrl,
                    barcodeGenerated: !!order.barcodeData
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: order.priority === 'stat' ? 'high' : 'medium'
            });
            logger_1.default.info('Manual lab order creation audited', {
                orderId: order.orderId,
                patientId: order.patientId,
                workplaceId: context.workspaceId,
                userId: context.userId,
                testCount: order.tests.length,
                service: 'manual-lab-audit'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to audit order creation', {
                orderId: order.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logPDFAccess(context, auditData) {
        try {
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_PDF_ACCESSED',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: auditData.patientId,
                details: {
                    orderId: auditData.orderId,
                    fileName: auditData.fileName,
                    fileSize: auditData.fileSize,
                    downloadMethod: auditData.downloadMethod,
                    accessDuration: auditData.accessDuration,
                    userAgent: auditData.userAgent,
                    referrer: auditData.referrer,
                    timestamp: new Date(),
                    sessionId: context.sessionId
                },
                complianceCategory: 'data_access',
                riskLevel: auditData.downloadMethod === 'direct_link' ? 'medium' : 'low'
            });
            await this.trackPDFAccessPattern(context, auditData);
            logger_1.default.info('Manual lab PDF access audited', {
                orderId: auditData.orderId,
                fileName: auditData.fileName,
                downloadMethod: auditData.downloadMethod,
                userId: context.userId,
                service: 'manual-lab-audit'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to audit PDF access', {
                orderId: auditData.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logResultEntry(context, result, auditData) {
        try {
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_RESULTS_ENTERED',
                resourceType: 'Patient',
                resourceId: result._id,
                patientId: auditData.patientId,
                details: {
                    orderId: auditData.orderId,
                    resultId: result._id,
                    testCount: auditData.testCount,
                    abnormalResultCount: auditData.abnormalResultCount,
                    criticalResultCount: auditData.criticalResultCount,
                    entryDuration: auditData.entryDuration,
                    validationErrors: auditData.validationErrors,
                    aiProcessingTriggered: auditData.aiProcessingTriggered,
                    enteredBy: result.enteredBy,
                    enteredAt: result.enteredAt,
                    hasReviewNotes: !!result.reviewNotes,
                    interpretationCount: result.interpretation.length
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: auditData.criticalResultCount > 0 ? 'critical' :
                    auditData.abnormalResultCount > 0 ? 'high' : 'medium'
            });
            for (const value of result.values) {
                await this.logIndividualTestResult(context, auditData.orderId, value);
            }
            logger_1.default.info('Manual lab result entry audited', {
                orderId: auditData.orderId,
                resultId: result._id,
                testCount: auditData.testCount,
                abnormalCount: auditData.abnormalResultCount,
                criticalCount: auditData.criticalResultCount,
                service: 'manual-lab-audit'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to audit result entry', {
                orderId: auditData.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logResultModification(context, orderId, oldValues, newValues, modificationReason) {
        try {
            const changedFields = this.getChangedFields(oldValues, newValues);
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_RESULTS_MODIFIED',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: context.patientId,
                oldValues,
                newValues,
                changedFields,
                details: {
                    orderId,
                    modificationReason,
                    changedFieldCount: changedFields.length,
                    modifiedBy: context.userId,
                    modifiedAt: new Date(),
                    requiresReview: changedFields.some(field => ['numericValue', 'stringValue', 'interpretation'].includes(field))
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: 'high'
            });
            logger_1.default.warn('Manual lab result modification audited', {
                orderId,
                changedFields,
                modificationReason,
                userId: context.userId,
                service: 'manual-lab-audit'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to audit result modification', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logStatusChange(context, orderId, oldStatus, newStatus, statusChangeReason) {
        try {
            const isValidTransition = this.validateStatusTransition(oldStatus, newStatus);
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_ORDER_STATUS_CHANGED',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: context.patientId,
                oldValues: { status: oldStatus },
                newValues: { status: newStatus },
                changedFields: ['status'],
                details: {
                    orderId,
                    oldStatus,
                    newStatus,
                    statusChangeReason,
                    isValidTransition,
                    changedBy: context.userId,
                    changedAt: new Date(),
                    workflowCompliant: isValidTransition
                },
                complianceCategory: 'workflow_compliance',
                riskLevel: isValidTransition ? 'low' : 'high'
            });
            if (!isValidTransition) {
                logger_1.default.warn('Invalid status transition detected', {
                    orderId,
                    oldStatus,
                    newStatus,
                    userId: context.userId,
                    service: 'manual-lab-audit'
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to audit status change', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logTokenResolution(context, orderId, tokenType, success, errorReason) {
        try {
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_TOKEN_RESOLVED',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: context.patientId,
                details: {
                    orderId,
                    tokenType,
                    success,
                    errorReason,
                    resolvedBy: context.userId,
                    resolvedAt: new Date(),
                    sessionId: context.sessionId
                },
                complianceCategory: 'data_access',
                riskLevel: success ? 'low' : 'medium'
            });
            logger_1.default.info('Token resolution audited', {
                orderId,
                tokenType,
                success,
                userId: context.userId,
                service: 'manual-lab-audit'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to audit token resolution', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async generateComplianceReport(reportData) {
        try {
            const { logs, total } = await auditService_1.AuditService.getAuditLogs({
                startDate: reportData.dateRange.start.toISOString(),
                endDate: reportData.dateRange.end.toISOString(),
                action: 'MANUAL_LAB_'
            });
            const complianceMetrics = this.analyzeComplianceMetrics(logs);
            const report = {
                reportId: new mongoose_1.default.Types.ObjectId(),
                workplaceId: reportData.workplaceId,
                reportType: reportData.reportType,
                dateRange: reportData.dateRange,
                generatedAt: new Date(),
                summary: {
                    totalAuditLogs: total,
                    totalOrders: reportData.totalOrders,
                    totalResults: reportData.totalResults,
                    pdfAccesses: reportData.pdfAccesses,
                    complianceScore: complianceMetrics.complianceScore,
                    riskScore: complianceMetrics.riskScore
                },
                metrics: complianceMetrics,
                violations: complianceMetrics.violations,
                recommendations: this.generateComplianceRecommendations(complianceMetrics)
            };
            await auditService_1.AuditService.logActivity({
                userId: new mongoose_1.default.Types.ObjectId(),
                workplaceId: reportData.workplaceId,
                userRole: 'system'
            }, {
                action: 'MANUAL_LAB_COMPLIANCE_REPORT_GENERATED',
                resourceType: 'System',
                resourceId: report.reportId,
                details: {
                    reportType: reportData.reportType,
                    dateRange: reportData.dateRange,
                    totalLogs: total,
                    complianceScore: complianceMetrics.complianceScore
                },
                complianceCategory: 'system_security',
                riskLevel: 'low'
            });
            return report;
        }
        catch (error) {
            logger_1.default.error('Failed to generate compliance report', {
                workplaceId: reportData.workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
            throw error;
        }
    }
    static async trackPDFAccessPattern(context, auditData) {
        try {
            const recentAccesses = await auditService_1.AuditService.getAuditLogs({
                userId: context.userId,
                action: 'MANUAL_LAB_PDF_ACCESSED',
                startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString()
            });
            const accessCount = recentAccesses.total;
            const uniqueOrders = new Set(recentAccesses.logs.map(log => log.details?.orderId)).size;
            if (accessCount > 50 || (accessCount > 10 && uniqueOrders < 3)) {
                await auditService_1.AuditService.logActivity(context, {
                    action: 'MANUAL_LAB_SUSPICIOUS_PDF_ACCESS_PATTERN',
                    resourceType: 'System',
                    resourceId: context.userId,
                    details: {
                        accessCount,
                        uniqueOrders,
                        timeWindow: '1 hour',
                        currentAccess: auditData,
                        flaggedReason: accessCount > 50 ? 'high_volume' : 'low_diversity'
                    },
                    complianceCategory: 'system_security',
                    riskLevel: 'high'
                });
                logger_1.default.warn('Suspicious PDF access pattern detected', {
                    userId: context.userId,
                    accessCount,
                    uniqueOrders,
                    service: 'manual-lab-audit'
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to track PDF access pattern', {
                userId: context.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static async logIndividualTestResult(context, orderId, testValue) {
        try {
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_INDIVIDUAL_TEST_RESULT',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: context.patientId,
                details: {
                    orderId,
                    testCode: testValue.testCode,
                    testName: testValue.testName,
                    hasNumericValue: testValue.numericValue !== undefined,
                    hasStringValue: testValue.stringValue !== undefined,
                    unit: testValue.unit,
                    abnormalFlag: testValue.abnormalFlag,
                    hasComment: !!testValue.comment,
                    enteredAt: new Date()
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: testValue.abnormalFlag ? 'medium' : 'low'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to log individual test result', {
                orderId,
                testCode: testValue.testCode,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit'
            });
        }
    }
    static validateStatusTransition(oldStatus, newStatus) {
        const validTransitions = {
            'requested': ['sample_collected', 'cancelled'],
            'sample_collected': ['result_awaited', 'cancelled'],
            'result_awaited': ['completed', 'cancelled'],
            'completed': ['referred'],
            'cancelled': [],
            'referred': []
        };
        return validTransitions[oldStatus]?.includes(newStatus) || false;
    }
    static getChangedFields(oldValues, newValues) {
        const changedFields = [];
        if (!oldValues || !newValues)
            return changedFields;
        const allKeys = new Set([
            ...Object.keys(oldValues),
            ...Object.keys(newValues)
        ]);
        for (const key of allKeys) {
            if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                changedFields.push(key);
            }
        }
        return changedFields;
    }
    static analyzeComplianceMetrics(logs) {
        const metrics = {
            totalLogs: logs.length,
            orderCreations: 0,
            resultEntries: 0,
            pdfAccesses: 0,
            statusChanges: 0,
            violations: [],
            riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            complianceScore: 100,
            riskScore: 0
        };
        for (const log of logs) {
            if (log.action.includes('ORDER_CREATED'))
                metrics.orderCreations++;
            if (log.action.includes('RESULTS_ENTERED'))
                metrics.resultEntries++;
            if (log.action.includes('PDF_ACCESSED'))
                metrics.pdfAccesses++;
            if (log.action.includes('STATUS_CHANGED'))
                metrics.statusChanges++;
            if (log.riskLevel) {
                metrics.riskDistribution[log.riskLevel]++;
            }
            if (log.riskLevel === 'high' || log.riskLevel === 'critical') {
                metrics.violations.push({
                    logId: log._id,
                    action: log.action,
                    timestamp: log.timestamp,
                    riskLevel: log.riskLevel,
                    details: log.details
                });
            }
        }
        const violationPenalty = metrics.violations.length * 5;
        const riskPenalty = (metrics.riskDistribution.high * 2) + (metrics.riskDistribution.critical * 5);
        metrics.complianceScore = Math.max(0, 100 - violationPenalty - riskPenalty);
        metrics.riskScore = ((metrics.riskDistribution.low * 1) +
            (metrics.riskDistribution.medium * 2) +
            (metrics.riskDistribution.high * 4) +
            (metrics.riskDistribution.critical * 8)) / metrics.totalLogs;
        return metrics;
    }
    static generateComplianceRecommendations(metrics) {
        const recommendations = [];
        if (metrics.complianceScore < 80) {
            recommendations.push('Compliance score is below acceptable threshold. Review workflow processes.');
        }
        if (metrics.violations.length > 10) {
            recommendations.push('High number of compliance violations detected. Implement additional training.');
        }
        if (metrics.riskScore > 3) {
            recommendations.push('High risk activities detected. Consider implementing additional security measures.');
        }
        if (metrics.pdfAccesses > metrics.orderCreations * 5) {
            recommendations.push('Unusually high PDF access ratio. Monitor for potential data exfiltration.');
        }
        if (recommendations.length === 0) {
            recommendations.push('Compliance metrics are within acceptable ranges. Continue monitoring.');
        }
        return recommendations;
    }
}
exports.default = ManualLabAuditService;
//# sourceMappingURL=manualLabAuditService.js.map