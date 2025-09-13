"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const diagnosticAuditService_1 = __importDefault(require("./diagnosticAuditService"));
const MTRAuditLog_1 = __importDefault(require("../../../models/MTRAuditLog"));
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
class ComplianceReportingService {
    constructor() {
        this.dataRetentionPolicies = [
            {
                recordType: 'diagnostic_request',
                retentionPeriod: 2555,
                archivalRequired: true,
                deletionMethod: 'soft',
                legalHold: false,
                regulatoryBasis: ['HIPAA', 'FDA 21 CFR Part 11']
            },
            {
                recordType: 'diagnostic_result',
                retentionPeriod: 2555,
                archivalRequired: true,
                deletionMethod: 'soft',
                legalHold: false,
                regulatoryBasis: ['HIPAA', 'FDA 21 CFR Part 11']
            },
            {
                recordType: 'audit_log',
                retentionPeriod: 1095,
                archivalRequired: true,
                deletionMethod: 'hard',
                legalHold: false,
                regulatoryBasis: ['HIPAA', 'SOX']
            },
            {
                recordType: 'ai_model_output',
                retentionPeriod: 2555,
                archivalRequired: true,
                deletionMethod: 'crypto_shred',
                legalHold: false,
                regulatoryBasis: ['FDA 21 CFR Part 11', 'EU AI Act']
            }
        ];
    }
    async generateRegulatoryReport(workplaceId, reportType, startDate, endDate, generatedBy) {
        try {
            const reportId = new mongoose_1.Types.ObjectId().toString();
            logger_1.default.info('Generating regulatory compliance report', {
                reportId,
                workplaceId,
                reportType,
                period: { startDate, endDate }
            });
            const [auditEvents, dataGovernance, auditTrail, securityMetrics, aiGovernance] = await Promise.all([
                this.getAuditEvents(workplaceId, startDate, endDate),
                this.analyzeDataGovernance(workplaceId, startDate, endDate),
                this.analyzeAuditTrail(workplaceId, startDate, endDate),
                this.analyzeSecurityMetrics(workplaceId, startDate, endDate),
                this.analyzeAIGovernance(workplaceId, startDate, endDate)
            ]);
            const complianceScore = this.calculateComplianceScore(dataGovernance, auditTrail, securityMetrics, aiGovernance);
            const recommendations = this.generateRecommendations(reportType, dataGovernance, auditTrail, securityMetrics, aiGovernance);
            const executiveSummary = {
                complianceScore,
                criticalIssues: recommendations.filter(r => r.priority === 'critical').length,
                recommendations: recommendations.slice(0, 5).map(r => r.description),
                overallStatus: complianceScore >= 90 ? 'compliant' :
                    complianceScore >= 70 ? 'needs_attention' : 'non_compliant'
            };
            const report = {
                reportId,
                workplaceId,
                reportType,
                period: { startDate, endDate },
                generatedAt: new Date(),
                generatedBy,
                executiveSummary,
                dataGovernance,
                auditTrail,
                securityMetrics,
                aiGovernance,
                recommendations
            };
            await diagnosticAuditService_1.default.logAuditEvent({
                eventType: 'data_export',
                entityType: 'diagnostic_request',
                entityId: reportId,
                userId: generatedBy,
                workplaceId,
                details: {
                    reportType,
                    complianceScore,
                    criticalIssues: executiveSummary.criticalIssues
                },
                timestamp: new Date(),
                severity: 'medium'
            });
            return report;
        }
        catch (error) {
            logger_1.default.error('Error generating regulatory report:', error);
            throw new Error('Failed to generate regulatory compliance report');
        }
    }
    async analyzeDataGovernance(workplaceId, startDate, endDate) {
        const diagnosticRequests = await DiagnosticRequest_1.default.countDocuments({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            isDeleted: false
        });
        const diagnosticResults = await DiagnosticResult_1.default.countDocuments({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            isDeleted: false
        });
        const totalRecords = diagnosticRequests + diagnosticResults;
        const nearExpiryDate = new Date();
        nearExpiryDate.setDate(nearExpiryDate.getDate() - (2555 - 90));
        const recordsNearingExpiry = await DiagnosticRequest_1.default.countDocuments({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            createdAt: { $lte: nearExpiryDate },
            isDeleted: false
        });
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - 2555);
        const expiredRecords = await DiagnosticRequest_1.default.countDocuments({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            createdAt: { $lte: expiryDate },
            isDeleted: false
        });
        return {
            dataRetentionCompliance: {
                totalRecords,
                recordsWithinPolicy: totalRecords - expiredRecords,
                recordsNearingExpiry,
                expiredRecords,
                orphanedRecords: 0
            },
            dataClassification: {
                phi: diagnosticRequests + diagnosticResults,
                pii: diagnosticRequests,
                sensitive: diagnosticResults,
                public: 0
            },
            accessControls: {
                totalUsers: 0,
                privilegedUsers: 0,
                inactiveUsers: 0,
                usersWithExcessivePermissions: 0
            }
        };
    }
    async analyzeAuditTrail(workplaceId, startDate, endDate) {
        const auditLogs = await MTRAuditLog_1.default.find({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            timestamp: { $gte: startDate, $lte: endDate }
        });
        const totalLogs = auditLogs.length;
        const completeLogsCount = auditLogs.filter(log => log.action && log.resourceType && log.userId && log.timestamp).length;
        return {
            completeness: totalLogs > 0 ? (completeLogsCount / totalLogs) * 100 : 100,
            integrity: 95,
            availability: 99,
            nonRepudiation: 90
        };
    }
    async analyzeSecurityMetrics(workplaceId, startDate, endDate) {
        const securityEvents = await MTRAuditLog_1.default.find({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            timestamp: { $gte: startDate, $lte: endDate },
            $or: [
                { action: 'FAILED_LOGIN' },
                { action: 'security_violation' },
                { riskLevel: 'critical' }
            ]
        });
        return {
            accessViolations: securityEvents.filter(e => e.action === 'security_violation').length,
            dataBreaches: 0,
            unauthorizedAccess: securityEvents.filter(e => e.riskLevel === 'critical').length,
            failedLogins: securityEvents.filter(e => e.action === 'FAILED_LOGIN').length,
            suspiciousActivities: securityEvents.filter(e => e.details?.suspicious === true).length
        };
    }
    async analyzeAIGovernance(workplaceId, startDate, endDate) {
        const aiEvents = await MTRAuditLog_1.default.find({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            timestamp: { $gte: startDate, $lte: endDate },
            action: { $regex: /ai_analysis/ }
        });
        const totalAIRequests = aiEvents.length;
        const requestsWithConsent = aiEvents.filter(e => e.details?.regulatoryContext?.consentObtained === true).length;
        return {
            modelTransparency: 85,
            biasDetection: 90,
            explainabilityScore: 80,
            consentCompliance: totalAIRequests > 0 ? (requestsWithConsent / totalAIRequests) * 100 : 100,
            dataMinimization: 75
        };
    }
    calculateComplianceScore(dataGovernance, auditTrail, securityMetrics, aiGovernance) {
        const weights = {
            dataRetention: 0.25,
            auditTrail: 0.25,
            security: 0.25,
            aiGovernance: 0.25
        };
        const dataRetentionScore = dataGovernance.dataRetentionCompliance.expiredRecords === 0 ? 100 :
            Math.max(0, 100 - (dataGovernance.dataRetentionCompliance.expiredRecords /
                dataGovernance.dataRetentionCompliance.totalRecords) * 100);
        const auditScore = (auditTrail.completeness + auditTrail.integrity +
            auditTrail.availability + auditTrail.nonRepudiation) / 4;
        const securityScore = Math.max(0, 100 - (securityMetrics.accessViolations * 10 +
            securityMetrics.dataBreaches * 50 +
            securityMetrics.unauthorizedAccess * 20));
        const aiScore = aiGovernance ? (aiGovernance.modelTransparency + aiGovernance.biasDetection +
            aiGovernance.explainabilityScore + aiGovernance.consentCompliance +
            aiGovernance.dataMinimization) / 5 : 100;
        return Math.round(dataRetentionScore * weights.dataRetention +
            auditScore * weights.auditTrail +
            securityScore * weights.security +
            aiScore * weights.aiGovernance);
    }
    generateRecommendations(reportType, dataGovernance, auditTrail, securityMetrics, aiGovernance) {
        const recommendations = [];
        if (dataGovernance.dataRetentionCompliance.expiredRecords > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'Data Retention',
                description: `${dataGovernance.dataRetentionCompliance.expiredRecords} records exceed retention policy`,
                remediation: 'Implement automated data archival and deletion processes',
                timeline: '30 days',
                impact: 'Regulatory non-compliance risk'
            });
        }
        if (auditTrail.completeness < 95) {
            recommendations.push({
                priority: 'high',
                category: 'Audit Trail',
                description: `Audit trail completeness is ${auditTrail.completeness.toFixed(1)}%`,
                remediation: 'Review and enhance audit logging coverage',
                timeline: '60 days',
                impact: 'Compliance monitoring gaps'
            });
        }
        if (securityMetrics.accessViolations > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Security',
                description: `${securityMetrics.accessViolations} access violations detected`,
                remediation: 'Strengthen access controls and monitoring',
                timeline: '45 days',
                impact: 'Data security risk'
            });
        }
        if (aiGovernance && aiGovernance.consentCompliance < 100) {
            recommendations.push({
                priority: 'critical',
                category: 'AI Governance',
                description: `AI consent compliance is ${aiGovernance.consentCompliance.toFixed(1)}%`,
                remediation: 'Implement mandatory consent validation for all AI processing',
                timeline: '15 days',
                impact: 'AI ethics and legal compliance'
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    async detectAnomalies(workplaceId, lookbackDays = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - lookbackDays);
        const auditEvents = await this.getAuditEvents(workplaceId, startDate, new Date());
        const anomalies = [];
        const userActivityMap = new Map();
        auditEvents.forEach(event => {
            const userId = event.userId || 'unknown';
            userActivityMap.set(userId, (userActivityMap.get(userId) || 0) + 1);
        });
        const avgActivity = Array.from(userActivityMap.values()).reduce((a, b) => a + b, 0) / userActivityMap.size;
        const threshold = avgActivity * 3;
        userActivityMap.forEach((activity, userId) => {
            if (activity > threshold) {
                anomalies.push({
                    anomalyId: new mongoose_1.Types.ObjectId().toString(),
                    detectedAt: new Date(),
                    anomalyType: 'user_behavior',
                    severity: activity > threshold * 2 ? 'critical' : 'high',
                    description: `User ${userId} has ${activity} activities (${(activity / avgActivity).toFixed(1)}x average)`,
                    affectedEntities: [userId],
                    riskScore: Math.min(100, (activity / avgActivity) * 20),
                    recommendedActions: [
                        'Review user access permissions',
                        'Investigate recent user activities',
                        'Consider temporary access restriction'
                    ],
                    falsePositiveProbability: 0.15
                });
            }
        });
        const afterHoursEvents = auditEvents.filter(event => {
            const hour = new Date(event.timestamp).getHours();
            return hour < 6 || hour > 22;
        });
        if (afterHoursEvents.length > auditEvents.length * 0.1) {
            anomalies.push({
                anomalyId: new mongoose_1.Types.ObjectId().toString(),
                detectedAt: new Date(),
                anomalyType: 'time_pattern',
                severity: 'medium',
                description: `${afterHoursEvents.length} activities detected outside business hours`,
                affectedEntities: [...new Set(afterHoursEvents.map(e => e.userId))],
                riskScore: (afterHoursEvents.length / auditEvents.length) * 100,
                recommendedActions: [
                    'Review after-hours access policies',
                    'Implement time-based access controls',
                    'Monitor after-hours activities more closely'
                ],
                falsePositiveProbability: 0.25
            });
        }
        return anomalies;
    }
    async getAuditEvents(workplaceId, startDate, endDate) {
        const results = await diagnosticAuditService_1.default.searchAuditEvents({
            workplaceId,
            startDate,
            endDate,
            limit: 10000
        });
        return results.events;
    }
    getDataRetentionPolicies() {
        return [...this.dataRetentionPolicies];
    }
    updateDataRetentionPolicy(recordType, policy) {
        const index = this.dataRetentionPolicies.findIndex(p => p.recordType === recordType);
        if (index >= 0) {
            this.dataRetentionPolicies[index] = {
                ...this.dataRetentionPolicies[index],
                ...policy,
                recordType
            };
        }
        else {
            this.dataRetentionPolicies.push({
                recordType,
                retentionPeriod: 2555,
                archivalRequired: true,
                deletionMethod: 'soft',
                legalHold: false,
                regulatoryBasis: ['HIPAA'],
                ...policy
            });
        }
    }
}
exports.default = new ComplianceReportingService();
//# sourceMappingURL=complianceReportingService.js.map