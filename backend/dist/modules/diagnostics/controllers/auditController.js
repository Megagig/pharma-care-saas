"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDataRetentionPolicy = exports.getDataRetentionPolicies = exports.exportAuditVisualization = exports.advancedAuditSearch = exports.getAuditVisualization = exports.detectAuditAnomalies = exports.generateRegulatoryReport = exports.exportAuditData = exports.archiveAuditRecords = exports.getAuditStatistics = exports.logSecurityViolation = exports.generateComplianceReport = exports.getEntityAuditTrail = exports.searchAuditEvents = void 0;
const diagnosticAuditService_1 = __importDefault(require("../services/diagnosticAuditService"));
const complianceReportingService_1 = __importDefault(require("../services/complianceReportingService"));
const auditVisualizationService_1 = __importDefault(require("../services/auditVisualizationService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const searchAuditEvents = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate, eventTypes, entityTypes, userIds, patientIds, severity, entityId, searchText, limit, offset } = req.query;
        const criteria = {
            workplaceId: workplaceId.toString(),
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        };
        if (startDate)
            criteria.startDate = new Date(startDate);
        if (endDate)
            criteria.endDate = new Date(endDate);
        if (eventTypes)
            criteria.eventTypes = eventTypes.split(',');
        if (entityTypes)
            criteria.entityTypes = entityTypes.split(',');
        if (userIds)
            criteria.userIds = userIds.split(',');
        if (patientIds)
            criteria.patientIds = patientIds.split(',');
        if (severity)
            criteria.severity = severity.split(',');
        if (entityId)
            criteria.entityId = entityId;
        if (searchText)
            criteria.searchText = searchText;
        const results = await diagnosticAuditService_1.default.searchAuditEvents(criteria);
        return res.json({
            success: true,
            data: {
                events: results.events,
                pagination: {
                    total: results.total,
                    limit: criteria.limit,
                    offset: criteria.offset,
                    hasMore: results.hasMore
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error searching audit events:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUDIT_SEARCH_ERROR',
                message: 'Failed to search audit events',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.searchAuditEvents = searchAuditEvents;
const getEntityAuditTrail = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { entityType, entityId } = req.params;
        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Entity type and ID are required'
                }
            });
        }
        const auditTrail = await diagnosticAuditService_1.default.getEntityAuditTrail(entityType, entityId, workplaceId.toString());
        return res.json({
            success: true,
            data: {
                entityType,
                entityId,
                auditTrail
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting entity audit trail:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUDIT_TRAIL_ERROR',
                message: 'Failed to retrieve audit trail',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getEntityAuditTrail = getEntityAuditTrail;
const generateComplianceReport = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId, _id: userId } = req.user;
        const { reportType, startDate, endDate } = req.query;
        if (!reportType || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Report type, start date, and end date are required'
                }
            });
        }
        const validReportTypes = ['hipaa', 'gdpr', 'audit_trail', 'data_access', 'ai_usage'];
        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REPORT_TYPE',
                    message: `Report type must be one of: ${validReportTypes.join(', ')}`
                }
            });
        }
        const report = await diagnosticAuditService_1.default.generateComplianceReport(workplaceId.toString(), reportType, new Date(startDate), new Date(endDate), userId.toString());
        return res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.default.error('Error generating compliance report:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'COMPLIANCE_REPORT_ERROR',
                message: 'Failed to generate compliance report',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.generateComplianceReport = generateComplianceReport;
const logSecurityViolation = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { violationType, details } = req.body;
        if (!violationType) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_VIOLATION_TYPE',
                    message: 'Violation type is required'
                }
            });
        }
        await diagnosticAuditService_1.default.logSecurityViolation(userId.toString(), workplaceId.toString(), violationType, details || {}, {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.headers['x-request-id']
        });
        return res.json({
            success: true,
            message: 'Security violation logged successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error logging security violation:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SECURITY_LOG_ERROR',
                message: 'Failed to log security violation',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.logSecurityViolation = logSecurityViolation;
const getAuditStatistics = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const results = await diagnosticAuditService_1.default.searchAuditEvents({
            workplaceId: workplaceId.toString(),
            startDate,
            endDate: now,
            limit: 10000
        });
        const eventsByType = {};
        const eventsBySeverity = {};
        const eventsByUser = {};
        const dailyActivity = {};
        results.events.forEach(event => {
            const eventType = event.action || 'unknown';
            eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
            const severity = event.details?.severity || 'unknown';
            eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;
            const userId = event.userId?.toString() || 'unknown';
            eventsByUser[userId] = (eventsByUser[userId] || 0) + 1;
            const day = new Date(event.timestamp).toISOString().split('T')[0];
            if (day) {
                dailyActivity[day] = (dailyActivity[day] || 0) + 1;
            }
        });
        const statistics = {
            period: period,
            dateRange: {
                start: startDate,
                end: now
            },
            summary: {
                totalEvents: results.events.length,
                uniqueUsers: Object.keys(eventsByUser).length,
                criticalEvents: eventsBySeverity.critical || 0,
                securityViolations: eventsByType.security_violation || 0
            },
            breakdown: {
                eventsByType: Object.entries(eventsByType)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([type, count]) => ({ type, count })),
                eventsBySeverity: Object.entries(eventsBySeverity)
                    .map(([severity, count]) => ({ severity, count })),
                topUsers: Object.entries(eventsByUser)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([userId, count]) => ({ userId, count })),
                dailyActivity: Object.entries(dailyActivity)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, count]) => ({ date, count }))
            }
        };
        return res.json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting audit statistics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUDIT_STATS_ERROR',
                message: 'Failed to retrieve audit statistics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getAuditStatistics = getAuditStatistics;
const archiveAuditRecords = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { retentionDays } = req.body;
        if (!retentionDays || retentionDays < 1) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_RETENTION_PERIOD',
                    message: 'Retention days must be a positive number'
                }
            });
        }
        const result = await diagnosticAuditService_1.default.archiveOldRecords(workplaceId.toString(), parseInt(retentionDays));
        return res.json({
            success: true,
            data: {
                archivedCount: result.archivedCount,
                deletedCount: result.deletedCount,
                message: 'Audit records archived successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error archiving audit records:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'ARCHIVE_ERROR',
                message: 'Failed to archive audit records',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.archiveAuditRecords = archiveAuditRecords;
const exportAuditData = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { startDate, endDate, format = 'json' } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DATE_RANGE',
                    message: 'Start date and end date are required'
                }
            });
        }
        const results = await diagnosticAuditService_1.default.searchAuditEvents({
            workplaceId: workplaceId.toString(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            limit: 10000
        });
        await diagnosticAuditService_1.default.logAuditEvent({
            eventType: 'data_export',
            entityType: 'diagnostic_request',
            entityId: 'audit_export',
            userId,
            workplaceId: workplaceId.toString(),
            details: {
                exportFormat: format,
                recordCount: results.events.length,
                dateRange: { startDate, endDate }
            },
            timestamp: new Date(),
            severity: 'medium'
        });
        if (format === 'csv') {
            const csvHeaders = [
                'Timestamp',
                'Event Type',
                'Entity Type',
                'Entity ID',
                'User ID',
                'Severity',
                'Details'
            ];
            const csvRows = results.events.map(event => [
                new Date(event.timestamp).toISOString(),
                event.action || '',
                event.details?.entityType || '',
                event.details?.entityId || '',
                event.userId || '',
                event.details?.severity || '',
                JSON.stringify(event.details || {})
            ]);
            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="audit_export_${Date.now()}.csv"`);
            res.send(csvContent);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="audit_export_${Date.now()}.json"`);
            res.json({
                exportInfo: {
                    workplaceId: workplaceId.toString(),
                    dateRange: { startDate, endDate },
                    exportedAt: new Date(),
                    exportedBy: userId,
                    recordCount: results.events.length
                },
                auditEvents: results.events
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error exporting audit data:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'EXPORT_ERROR',
                message: 'Failed to export audit data',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.exportAuditData = exportAuditData;
const generateRegulatoryReport = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { reportType, startDate, endDate } = req.query;
        if (!reportType || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Report type, start date, and end date are required'
                }
            });
        }
        const validReportTypes = ['hipaa', 'gdpr', 'fda_21cfr11', 'sox', 'pci_dss'];
        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REPORT_TYPE',
                    message: `Report type must be one of: ${validReportTypes.join(', ')}`
                }
            });
        }
        const report = await complianceReportingService_1.default.generateRegulatoryReport(workplaceId.toString(), reportType, new Date(startDate), new Date(endDate), userId);
        return res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.default.error('Error generating regulatory report:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'REGULATORY_REPORT_ERROR',
                message: 'Failed to generate regulatory compliance report',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.generateRegulatoryReport = generateRegulatoryReport;
const detectAuditAnomalies = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { lookbackDays = 30 } = req.query;
        const anomalies = await complianceReportingService_1.default.detectAnomalies(workplaceId.toString(), parseInt(lookbackDays));
        return res.json({
            success: true,
            data: {
                anomalies,
                detectionPeriod: `${lookbackDays} days`,
                detectedAt: new Date(),
                summary: {
                    totalAnomalies: anomalies.length,
                    criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
                    highRiskAnomalies: anomalies.filter(a => a.severity === 'high').length
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error detecting audit anomalies:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'ANOMALY_DETECTION_ERROR',
                message: 'Failed to detect audit anomalies',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.detectAuditAnomalies = detectAuditAnomalies;
const getAuditVisualization = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DATE_RANGE',
                    message: 'Start date and end date are required'
                }
            });
        }
        const visualizationData = await auditVisualizationService_1.default.generateVisualizationData(workplaceId, new Date(startDate), new Date(endDate));
        return res.json({
            success: true,
            data: visualizationData
        });
    }
    catch (error) {
        logger_1.default.error('Error generating audit visualization:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'VISUALIZATION_ERROR',
                message: 'Failed to generate audit visualization',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getAuditVisualization = getAuditVisualization;
const advancedAuditSearch = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate, userIds, eventTypes, entityTypes, entityIds, riskLevels, searchText, ipAddresses, sessionIds, hasErrors, complianceCategories, page = 1, limit = 50 } = req.query;
        const filters = {
            workplaceId: workplaceId.toString(),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            userIds: userIds ? userIds.split(',') : undefined,
            eventTypes: eventTypes ? eventTypes.split(',') : undefined,
            entityTypes: entityTypes ? entityTypes.split(',') : undefined,
            entityIds: entityIds ? entityIds.split(',') : undefined,
            riskLevels: riskLevels ? riskLevels.split(',') : undefined,
            searchText: searchText,
            ipAddresses: ipAddresses ? ipAddresses.split(',') : undefined,
            sessionIds: sessionIds ? sessionIds.split(',') : undefined,
            hasErrors: hasErrors ? hasErrors === 'true' : undefined,
            complianceCategories: complianceCategories ? complianceCategories.split(',') : undefined
        };
        const results = await auditVisualizationService_1.default.searchAuditEvents(filters, parseInt(page), parseInt(limit));
        return res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        logger_1.default.error('Error performing advanced audit search:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'ADVANCED_SEARCH_ERROR',
                message: 'Failed to perform advanced audit search',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.advancedAuditSearch = advancedAuditSearch;
const exportAuditVisualization = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { startDate, endDate, format = 'json' } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DATE_RANGE',
                    message: 'Start date and end date are required'
                }
            });
        }
        const exportData = await auditVisualizationService_1.default.exportVisualizationData(workplaceId.toString(), new Date(startDate), new Date(endDate), format);
        await diagnosticAuditService_1.default.logAuditEvent({
            eventType: 'data_export',
            entityType: 'diagnostic_request',
            entityId: 'audit_visualization_export',
            userId,
            workplaceId: workplaceId.toString(),
            details: {
                exportFormat: format,
                dateRange: { startDate, endDate },
                exportType: 'audit_visualization'
            },
            timestamp: new Date(),
            severity: 'medium'
        });
        res.setHeader('Content-Type', exportData.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        if (format === 'json') {
            res.json(JSON.parse(exportData.data));
        }
        else {
            res.send(exportData.data);
        }
    }
    catch (error) {
        logger_1.default.error('Error exporting audit visualization:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'EXPORT_VISUALIZATION_ERROR',
                message: 'Failed to export audit visualization',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.exportAuditVisualization = exportAuditVisualization;
const getDataRetentionPolicies = async (req, res) => {
    try {
        const policies = complianceReportingService_1.default.getDataRetentionPolicies();
        return res.json({
            success: true,
            data: {
                policies,
                lastUpdated: new Date(),
                totalPolicies: policies.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting data retention policies:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'RETENTION_POLICIES_ERROR',
                message: 'Failed to retrieve data retention policies',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getDataRetentionPolicies = getDataRetentionPolicies;
const updateDataRetentionPolicy = async (req, res) => {
    try {
        const { recordType } = req.params;
        const policyUpdate = req.body;
        if (!recordType) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_RECORD_TYPE',
                    message: 'Record type is required'
                }
            });
        }
        complianceReportingService_1.default.updateDataRetentionPolicy(recordType, policyUpdate);
        await diagnosticAuditService_1.default.logAuditEvent({
            eventType: 'data_retention_policy_updated',
            entityType: 'diagnostic_request',
            entityId: recordType,
            userId: req.user._id,
            workplaceId: req.user.workplaceId.toString(),
            details: {
                recordType,
                policyUpdate,
                updatedBy: req.user._id
            },
            timestamp: new Date(),
            severity: 'high'
        });
        return res.json({
            success: true,
            message: 'Data retention policy updated successfully',
            data: {
                recordType,
                updatedPolicy: policyUpdate
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error updating data retention policy:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_POLICY_ERROR',
                message: 'Failed to update data retention policy',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.updateDataRetentionPolicy = updateDataRetentionPolicy;
exports.default = {
    searchAuditEvents: exports.searchAuditEvents,
    getEntityAuditTrail: exports.getEntityAuditTrail,
    generateComplianceReport: exports.generateComplianceReport,
    generateRegulatoryReport: exports.generateRegulatoryReport,
    detectAuditAnomalies: exports.detectAuditAnomalies,
    getAuditVisualization: exports.getAuditVisualization,
    advancedAuditSearch: exports.advancedAuditSearch,
    exportAuditVisualization: exports.exportAuditVisualization,
    getDataRetentionPolicies: exports.getDataRetentionPolicies,
    updateDataRetentionPolicy: exports.updateDataRetentionPolicy,
    logSecurityViolation: exports.logSecurityViolation,
    getAuditStatistics: exports.getAuditStatistics,
    archiveAuditRecords: exports.archiveAuditRecords,
    exportAuditData: exports.exportAuditData
};
//# sourceMappingURL=auditController.js.map