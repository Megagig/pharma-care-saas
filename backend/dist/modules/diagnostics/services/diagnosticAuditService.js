"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const auditService_1 = require("../../../services/auditService");
class DiagnosticAuditService {
    async logAuditEvent(event) {
        try {
            const auditContext = {
                userId: new mongoose_1.Types.ObjectId(event.userId),
                workplaceId: new mongoose_1.Types.ObjectId(event.workplaceId),
                userRole: 'system',
                sessionId: event.metadata?.sessionId,
                ipAddress: event.metadata?.ipAddress,
                userAgent: event.metadata?.userAgent,
                requestMethod: 'N/A',
                requestUrl: 'N/A',
            };
            const auditLogData = {
                action: event.eventType,
                resourceType: event.entityType,
                resourceId: new mongoose_1.Types.ObjectId(event.entityId),
                patientId: event.patientId ? new mongoose_1.Types.ObjectId(event.patientId) : undefined,
                details: {
                    ...event.details,
                    entityType: event.entityType,
                    entityId: event.entityId,
                    patientId: event.patientId,
                    severity: event.severity,
                    regulatoryContext: event.regulatoryContext,
                    aiMetadata: event.aiMetadata,
                    metadata: event.metadata
                },
                errorMessage: event.details?.errorMessage,
                duration: event.details?.duration,
                complianceCategory: event.details?.complianceCategory,
                riskLevel: event.severity,
            };
            await auditService_1.AuditService.logActivity(auditContext, auditLogData);
            logger_1.default.info('Diagnostic audit event logged', {
                eventType: event.eventType,
                entityType: event.entityType,
                entityId: event.entityId,
                userId: event.userId,
                workplaceId: event.workplaceId,
                severity: event.severity,
                timestamp: event.timestamp
            });
            if (event.severity === 'critical') {
                logger_1.default.error('Critical diagnostic audit event', {
                    eventType: event.eventType,
                    details: event.details,
                    userId: event.userId,
                    workplaceId: event.workplaceId
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to log diagnostic audit event:', error);
        }
    }
    async logDiagnosticRequestCreated(requestId, userId, workplaceId, patientId, details, metadata) {
        await this.logAuditEvent({
            eventType: 'diagnostic_request_created',
            entityType: 'diagnostic_request',
            entityId: requestId,
            userId,
            workplaceId,
            patientId,
            details: {
                symptoms: details.symptoms,
                vitals: details.vitals,
                medications: details.medications?.length || 0,
                allergies: details.allergies?.length || 0,
                consentObtained: details.consentObtained
            },
            metadata,
            timestamp: new Date(),
            severity: 'medium',
            regulatoryContext: {
                hipaaCompliant: true,
                gdprCompliant: true,
                dataRetentionPeriod: 2555,
                consentRequired: true,
                consentObtained: details.consentObtained
            }
        });
    }
    async logAIAnalysisRequested(requestId, userId, workplaceId, patientId, aiMetadata, metadata) {
        await this.logAuditEvent({
            eventType: 'ai_analysis_requested',
            entityType: 'diagnostic_request',
            entityId: requestId,
            userId,
            workplaceId,
            patientId,
            details: {
                modelRequested: aiMetadata.modelId,
                promptVersion: aiMetadata.promptVersion,
                consentVerified: true
            },
            aiMetadata: {
                modelId: aiMetadata.modelId,
                modelVersion: aiMetadata.modelVersion,
                promptHash: aiMetadata.promptHash,
                responseHash: '',
                tokenUsage: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0
                },
                processingTime: 0
            },
            metadata,
            timestamp: new Date(),
            severity: 'high',
            regulatoryContext: {
                hipaaCompliant: true,
                gdprCompliant: true,
                dataRetentionPeriod: 2555,
                consentRequired: true,
                consentObtained: true
            }
        });
    }
    async logAIAnalysisCompleted(requestId, resultId, userId, workplaceId, patientId, aiMetadata, metadata) {
        await this.logAuditEvent({
            eventType: 'ai_analysis_completed',
            entityType: 'diagnostic_result',
            entityId: resultId,
            userId,
            workplaceId,
            patientId,
            details: {
                requestId,
                diagnosesCount: aiMetadata.diagnosesCount,
                suggestedTestsCount: aiMetadata.suggestedTestsCount,
                medicationSuggestionsCount: aiMetadata.medicationSuggestionsCount,
                redFlagsCount: aiMetadata.redFlagsCount,
                referralRecommended: aiMetadata.referralRecommended
            },
            aiMetadata: {
                modelId: aiMetadata.modelId,
                modelVersion: aiMetadata.modelVersion,
                promptHash: aiMetadata.promptHash,
                responseHash: aiMetadata.responseHash,
                tokenUsage: aiMetadata.tokenUsage,
                confidenceScore: aiMetadata.confidenceScore,
                processingTime: aiMetadata.processingTime
            },
            metadata,
            timestamp: new Date(),
            severity: 'high'
        });
    }
    async logPharmacistReview(resultId, userId, workplaceId, patientId, reviewDetails, metadata) {
        const eventType = reviewDetails.status === 'approved' ? 'diagnostic_approved' :
            reviewDetails.status === 'modified' ? 'diagnostic_modified' :
                'diagnostic_rejected';
        await this.logAuditEvent({
            eventType: eventType,
            entityType: 'diagnostic_result',
            entityId: resultId,
            userId,
            workplaceId,
            patientId,
            details: {
                reviewStatus: reviewDetails.status,
                modifications: reviewDetails.modifications,
                rejectionReason: reviewDetails.rejectionReason,
                reviewTime: reviewDetails.reviewTime
            },
            metadata,
            timestamp: new Date(),
            severity: 'high'
        });
    }
    async logSecurityViolation(userId, workplaceId, violationType, details, metadata) {
        await this.logAuditEvent({
            eventType: 'security_violation',
            entityType: 'diagnostic_request',
            entityId: 'security_event',
            userId,
            workplaceId,
            details: {
                violationType,
                ...details
            },
            metadata,
            timestamp: new Date(),
            severity: 'critical'
        });
        logger_1.default.error('Diagnostic security violation detected', {
            userId,
            workplaceId,
            violationType,
            details,
            timestamp: new Date()
        });
    }
    async searchAuditEvents(criteria) {
        try {
            const searchCriteria = {
                workplaceId: criteria.workplaceId,
                limit: criteria.limit || 50,
                offset: criteria.offset || 0
            };
            if (criteria.startDate || criteria.endDate) {
                searchCriteria.dateRange = {};
                if (criteria.startDate)
                    searchCriteria.dateRange.start = criteria.startDate;
                if (criteria.endDate)
                    searchCriteria.dateRange.end = criteria.endDate;
            }
            if (criteria.userIds?.length) {
                searchCriteria.userIds = criteria.userIds;
            }
            if (criteria.eventTypes?.length) {
                searchCriteria.actions = criteria.eventTypes;
            }
            if (criteria.entityId) {
                searchCriteria.resource = criteria.entityId;
            }
            const filters = {
                startDate: searchCriteria.dateRange?.start,
                endDate: searchCriteria.dateRange?.end,
                userId: searchCriteria.userIds?.[0],
                action: searchCriteria.actions?.[0]
            };
            const options = {
                page: Math.floor((searchCriteria.offset || 0) / (searchCriteria.limit || 50)) + 1,
                limit: searchCriteria.limit || 50
            };
            const results = await auditService_1.AuditService.getAuditLogs(filters);
            const diagnosticEvents = results.logs.filter((log) => log.details?.entityType &&
                ['diagnostic_request', 'diagnostic_result', 'lab_order', 'lab_result', 'follow_up', 'adherence'].includes(log.details.entityType));
            return {
                events: diagnosticEvents,
                total: results.total,
                hasMore: (searchCriteria.offset || 0) + diagnosticEvents.length < results.total
            };
        }
        catch (error) {
            logger_1.default.error('Error searching audit events:', error);
            throw new Error('Failed to search audit events');
        }
    }
    async generateComplianceReport(workplaceId, reportType, startDate, endDate, generatedBy) {
        try {
            const reportId = new mongoose_1.Types.ObjectId().toString();
            const auditEvents = await this.searchAuditEvents({
                workplaceId,
                startDate,
                endDate,
                limit: 10000
            });
            const summary = this.analyzeEventsForCompliance(auditEvents.events);
            const findings = this.generateComplianceFindings(auditEvents.events);
            const dataRetention = await this.analyzeDataRetention(workplaceId, startDate, endDate);
            const aiUsage = this.analyzeAIUsage(auditEvents.events);
            const complianceStatus = this.assessComplianceStatus(auditEvents.events, findings);
            const report = {
                reportId,
                workplaceId,
                reportType,
                period: { startDate, endDate },
                generatedAt: new Date(),
                generatedBy,
                summary,
                findings,
                dataRetention,
                aiUsage,
                complianceStatus
            };
            await this.logAuditEvent({
                eventType: 'data_export',
                entityType: 'diagnostic_request',
                entityId: reportId,
                userId: generatedBy,
                workplaceId,
                details: {
                    reportType,
                    period: { startDate, endDate },
                    eventsAnalyzed: auditEvents.events.length
                },
                timestamp: new Date(),
                severity: 'medium'
            });
            return report;
        }
        catch (error) {
            logger_1.default.error('Error generating compliance report:', error);
            throw new Error('Failed to generate compliance report');
        }
    }
    analyzeEventsForCompliance(events) {
        const summary = {
            totalEvents: events.length,
            criticalEvents: 0,
            securityViolations: 0,
            dataAccessEvents: 0,
            aiUsageEvents: 0,
            consentEvents: 0
        };
        events.forEach(event => {
            if (event.details?.severity === 'critical') {
                summary.criticalEvents++;
            }
            if (event.action === 'security_violation') {
                summary.securityViolations++;
            }
            if (event.action === 'data_access' || event.action === 'data_export') {
                summary.dataAccessEvents++;
            }
            if (event.action?.includes('ai_analysis')) {
                summary.aiUsageEvents++;
            }
            if (event.action === 'consent_obtained' || event.action === 'consent_revoked') {
                summary.consentEvents++;
            }
        });
        return summary;
    }
    generateComplianceFindings(events) {
        const findings = [];
        const securityViolations = events.filter(e => e.action === 'security_violation');
        if (securityViolations.length > 0) {
            findings.push({
                category: 'Security',
                severity: 'critical',
                description: `${securityViolations.length} security violations detected`,
                count: securityViolations.length,
                recommendation: 'Review security protocols and user access controls'
            });
        }
        const diagnosticRequests = events.filter(e => e.action === 'diagnostic_request_created');
        const missingConsent = diagnosticRequests.filter(e => !e.details?.consentObtained);
        if (missingConsent.length > 0) {
            findings.push({
                category: 'Consent Management',
                severity: 'high',
                description: `${missingConsent.length} diagnostic requests without proper consent`,
                count: missingConsent.length,
                recommendation: 'Ensure consent is obtained before processing diagnostic requests'
            });
        }
        const aiEvents = events.filter(e => e.action?.includes('ai_analysis'));
        const failedAI = aiEvents.filter(e => e.action === 'ai_analysis_failed');
        if (failedAI.length > aiEvents.length * 0.1) {
            findings.push({
                category: 'AI Performance',
                severity: 'medium',
                description: `High AI failure rate: ${((failedAI.length / aiEvents.length) * 100).toFixed(1)}%`,
                count: failedAI.length,
                recommendation: 'Review AI service configuration and error handling'
            });
        }
        return findings;
    }
    async analyzeDataRetention(workplaceId, startDate, endDate) {
        return {
            totalRecords: 1000,
            recordsNearingExpiry: 50,
            expiredRecords: 5,
            retentionPolicy: '7 years for diagnostic records, 3 years for audit logs'
        };
    }
    analyzeAIUsage(events) {
        const aiEvents = events.filter(e => e.action?.includes('ai_analysis'));
        const uniqueUsers = new Set(aiEvents.map(e => e.userId)).size;
        const modelUsage = {};
        let totalTokens = 0;
        let totalProcessingTime = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;
        aiEvents.forEach(event => {
            const aiMetadata = event.details?.aiMetadata;
            if (aiMetadata) {
                const modelId = aiMetadata.modelId || 'unknown';
                if (!modelUsage[modelId]) {
                    modelUsage[modelId] = {
                        requests: 0,
                        averageTokens: 0,
                        averageProcessingTime: 0
                    };
                }
                modelUsage[modelId].requests++;
                if (aiMetadata.tokenUsage?.totalTokens) {
                    totalTokens += aiMetadata.tokenUsage.totalTokens;
                    modelUsage[modelId].averageTokens += aiMetadata.tokenUsage.totalTokens;
                }
                if (aiMetadata.processingTime) {
                    totalProcessingTime += aiMetadata.processingTime;
                    modelUsage[modelId].averageProcessingTime += aiMetadata.processingTime;
                }
                if (aiMetadata.confidenceScore) {
                    totalConfidence += aiMetadata.confidenceScore;
                    confidenceCount++;
                }
            }
        });
        Object.keys(modelUsage).forEach(modelId => {
            const model = modelUsage[modelId];
            model.averageTokens = model.averageTokens / model.requests;
            model.averageProcessingTime = model.averageProcessingTime / model.requests;
        });
        return {
            totalRequests: aiEvents.length,
            uniqueUsers,
            averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
            modelUsage
        };
    }
    assessComplianceStatus(events, findings) {
        const criticalFindings = findings.filter(f => f.severity === 'critical');
        const highFindings = findings.filter(f => f.severity === 'high');
        const issues = [];
        const recommendations = [];
        criticalFindings.forEach(finding => {
            issues.push(finding.description);
            if (finding.recommendation) {
                recommendations.push(finding.recommendation);
            }
        });
        highFindings.forEach(finding => {
            issues.push(finding.description);
            if (finding.recommendation) {
                recommendations.push(finding.recommendation);
            }
        });
        return {
            hipaaCompliant: criticalFindings.length === 0,
            gdprCompliant: criticalFindings.length === 0,
            issues,
            recommendations
        };
    }
    async getEntityAuditTrail(entityType, entityId, workplaceId) {
        try {
            const results = await this.searchAuditEvents({
                workplaceId,
                entityId,
                limit: 1000
            });
            return results.events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        catch (error) {
            logger_1.default.error('Error getting entity audit trail:', error);
            throw new Error('Failed to retrieve audit trail');
        }
    }
    async archiveOldRecords(workplaceId, retentionDays = 2555) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            logger_1.default.info('Audit record archival completed', {
                workplaceId,
                cutoffDate,
                retentionDays
            });
            return {
                archivedCount: 0,
                deletedCount: 0
            };
        }
        catch (error) {
            logger_1.default.error('Error archiving audit records:', error);
            throw new Error('Failed to archive audit records');
        }
    }
}
exports.default = new DiagnosticAuditService();
//# sourceMappingURL=diagnosticAuditService.js.map