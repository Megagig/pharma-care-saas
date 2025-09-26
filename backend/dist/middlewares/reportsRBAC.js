"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceWorkspaceIsolation = exports.validateDataAccess = exports.requireExportPermission = exports.requireScheduleAccess = exports.requireTemplateAccess = exports.requireReportAccess = void 0;
const rbac_1 = require("./rbac");
const ReportTemplate_1 = __importDefault(require("../models/ReportTemplate"));
const ReportSchedule_1 = __importDefault(require("../models/ReportSchedule"));
const ReportAuditLog_1 = __importDefault(require("../models/ReportAuditLog"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
const requireReportAccess = (reportType) => {
    return async (req, res, next) => {
        try {
            const targetReportType = reportType || req.params.reportType || req.body.reportType;
            if (!targetReportType) {
                return next();
            }
            const reportPermissions = {
                'patient-outcomes': ['view_patient_outcomes', 'view_clinical_data'],
                'pharmacist-interventions': ['view_pharmacist_performance', 'view_intervention_data'],
                'therapy-effectiveness': ['view_therapy_metrics', 'view_clinical_data'],
                'quality-improvement': ['view_quality_metrics', 'view_operational_data'],
                'regulatory-compliance': ['view_compliance_reports', 'view_audit_data'],
                'cost-effectiveness': ['view_financial_reports', 'view_cost_data'],
                'trend-forecasting': ['view_trend_analysis', 'view_analytics_data'],
                'operational-efficiency': ['view_operational_metrics', 'view_performance_data'],
                'medication-inventory': ['view_inventory_reports', 'view_medication_data'],
                'patient-demographics': ['view_patient_demographics', 'view_demographic_data'],
                'adverse-events': ['view_safety_reports', 'view_clinical_data']
            };
            const requiredPermissions = reportPermissions[targetReportType] || ['view_reports'];
            let hasPermission = false;
            let grantedPermission = '';
            for (const permission of requiredPermissions) {
                try {
                    const dynamicCheck = (0, rbac_1.requireDynamicPermission)(permission, {
                        enableLegacyFallback: true,
                        enableSuggestions: false
                    });
                    let permissionGranted = false;
                    const mockRes = {
                        status: () => ({ json: () => { } }),
                        json: () => { }
                    };
                    const mockNext = () => {
                        permissionGranted = true;
                    };
                    await dynamicCheck(req, mockRes, mockNext);
                    if (permissionGranted) {
                        hasPermission = true;
                        grantedPermission = permission;
                        break;
                    }
                }
                catch (error) {
                    logger_1.default.debug(`Permission check failed for ${permission}:`, error);
                    continue;
                }
            }
            if (!hasPermission) {
                await ReportAuditLog_1.default.logEvent({
                    eventType: 'UNAUTHORIZED_ACCESS',
                    reportType: targetReportType,
                    userId: req.user._id,
                    workplaceId: req.user.workplaceId,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    eventDetails: {
                        action: 'ACCESS',
                        resource: 'REPORT',
                        resourceId: targetReportType,
                        success: false,
                        errorMessage: 'Insufficient permissions for report type'
                    },
                    compliance: {
                        dataAccessed: ['REPORT_METADATA'],
                        sensitiveData: false,
                        anonymized: true,
                        encryptionUsed: true
                    },
                    riskScore: 60,
                    flagged: true,
                    flagReason: 'UNAUTHORIZED_ACCESS'
                });
                res.status(403).json({
                    success: false,
                    message: `Access denied for report type: ${targetReportType}`,
                    code: 'REPORT_ACCESS_DENIED',
                    reportType: targetReportType,
                    requiredPermissions,
                    userPermissions: req.user?.permissions || []
                });
                return;
            }
            await ReportAuditLog_1.default.logEvent({
                eventType: 'REPORT_VIEWED',
                reportType: targetReportType,
                userId: req.user._id,
                workplaceId: req.user.workplaceId,
                sessionId: req.sessionID,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                eventDetails: {
                    action: 'ACCESS',
                    resource: 'REPORT',
                    resourceId: targetReportType,
                    success: true
                },
                compliance: {
                    dataAccessed: ['REPORT_METADATA'],
                    sensitiveData: false,
                    anonymized: true,
                    encryptionUsed: true,
                    accessJustification: `User has ${grantedPermission} permission`
                },
                riskScore: 10
            });
            next();
        }
        catch (error) {
            logger_1.default.error('Report access check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify report access permissions',
                code: 'REPORT_ACCESS_CHECK_ERROR'
            });
        }
    };
};
exports.requireReportAccess = requireReportAccess;
const requireTemplateAccess = (action = 'view') => {
    return async (req, res, next) => {
        try {
            const templateId = req.params.templateId || req.body.templateId;
            if (!templateId) {
                return next();
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(templateId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid template ID format',
                    code: 'INVALID_TEMPLATE_ID'
                });
                return;
            }
            const template = await ReportTemplate_1.default.findById(templateId);
            if (!template) {
                res.status(404).json({
                    success: false,
                    message: 'Template not found',
                    code: 'TEMPLATE_NOT_FOUND'
                });
                return;
            }
            if (template.workplaceId.toString() !== req.user.workplaceId.toString() && !template.isPublic) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: Template belongs to different workspace',
                    code: 'TEMPLATE_WORKSPACE_MISMATCH'
                });
                return;
            }
            const userPermissions = template.permissions[action] || [];
            const userRole = req.user.role;
            const userWorkplaceRole = req.user.workplaceRole;
            let hasAccess = false;
            if (userRole === 'super_admin') {
                hasAccess = true;
            }
            else if (template.createdBy.toString() === req.user._id.toString()) {
                hasAccess = true;
            }
            else if (template.isPublic && action === 'view') {
                hasAccess = true;
            }
            else if (userPermissions.length === 0 ||
                userPermissions.includes(userRole) ||
                userPermissions.includes(userWorkplaceRole) ||
                userPermissions.includes('all')) {
                hasAccess = true;
            }
            if (!hasAccess) {
                await ReportAuditLog_1.default.logEvent({
                    eventType: 'UNAUTHORIZED_ACCESS',
                    reportType: template.reportType,
                    templateId: template._id,
                    userId: req.user._id,
                    workplaceId: req.user.workplaceId,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    eventDetails: {
                        action: action.toUpperCase(),
                        resource: 'TEMPLATE',
                        resourceId: templateId,
                        success: false,
                        errorMessage: `Insufficient permissions for template ${action}`
                    },
                    compliance: {
                        dataAccessed: ['TEMPLATE_METADATA'],
                        sensitiveData: false,
                        anonymized: true,
                        encryptionUsed: true
                    },
                    riskScore: 40,
                    flagged: true,
                    flagReason: 'UNAUTHORIZED_ACCESS'
                });
                res.status(403).json({
                    success: false,
                    message: `Access denied: Insufficient permissions to ${action} template`,
                    code: 'TEMPLATE_ACCESS_DENIED',
                    templateId,
                    action,
                    requiredPermissions: userPermissions
                });
                return;
            }
            await ReportAuditLog_1.default.logEvent({
                eventType: action === 'view' ? 'TEMPLATE_VIEWED' : 'TEMPLATE_MODIFIED',
                reportType: template.reportType,
                templateId: template._id,
                userId: req.user._id,
                workplaceId: req.user.workplaceId,
                sessionId: req.sessionID,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                eventDetails: {
                    action: action.toUpperCase(),
                    resource: 'TEMPLATE',
                    resourceId: templateId,
                    success: true
                },
                compliance: {
                    dataAccessed: ['TEMPLATE_DATA'],
                    sensitiveData: false,
                    anonymized: true,
                    encryptionUsed: true,
                    accessJustification: `User has ${action} permission for template`
                },
                riskScore: action === 'view' ? 5 : 15
            });
            if (action === 'view') {
                await template.incrementViewCount();
            }
            req.template = template;
            next();
        }
        catch (error) {
            logger_1.default.error('Template access check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify template access permissions',
                code: 'TEMPLATE_ACCESS_CHECK_ERROR'
            });
        }
    };
};
exports.requireTemplateAccess = requireTemplateAccess;
const requireScheduleAccess = (action = 'view') => {
    return async (req, res, next) => {
        try {
            const scheduleId = req.params.scheduleId || req.body.scheduleId;
            if (!scheduleId) {
                return next();
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID format',
                    code: 'INVALID_SCHEDULE_ID'
                });
                return;
            }
            const schedule = await ReportSchedule_1.default.findById(scheduleId);
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
                return;
            }
            if (schedule.workplaceId.toString() !== req.user.workplaceId.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: Schedule belongs to different workspace',
                    code: 'SCHEDULE_WORKSPACE_MISMATCH'
                });
                return;
            }
            const userPermissions = schedule.permissions[action] || [];
            const userRole = req.user.role;
            const userWorkplaceRole = req.user.workplaceRole;
            let hasAccess = false;
            if (userRole === 'super_admin') {
                hasAccess = true;
            }
            else if (schedule.createdBy.toString() === req.user._id.toString()) {
                hasAccess = true;
            }
            else if (userPermissions.length === 0 ||
                userPermissions.includes(userRole) ||
                userPermissions.includes(userWorkplaceRole) ||
                userPermissions.includes('all')) {
                hasAccess = true;
            }
            if (!hasAccess) {
                await ReportAuditLog_1.default.logEvent({
                    eventType: 'UNAUTHORIZED_ACCESS',
                    reportType: schedule.reportType,
                    scheduleId: schedule._id,
                    userId: req.user._id,
                    workplaceId: req.user.workplaceId,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    eventDetails: {
                        action: action.toUpperCase(),
                        resource: 'SCHEDULE',
                        resourceId: scheduleId,
                        success: false,
                        errorMessage: `Insufficient permissions for schedule ${action}`
                    },
                    compliance: {
                        dataAccessed: ['SCHEDULE_METADATA'],
                        sensitiveData: false,
                        anonymized: true,
                        encryptionUsed: true
                    },
                    riskScore: 45,
                    flagged: true,
                    flagReason: 'UNAUTHORIZED_ACCESS'
                });
                res.status(403).json({
                    success: false,
                    message: `Access denied: Insufficient permissions to ${action} schedule`,
                    code: 'SCHEDULE_ACCESS_DENIED',
                    scheduleId,
                    action,
                    requiredPermissions: userPermissions
                });
                return;
            }
            await ReportAuditLog_1.default.logEvent({
                eventType: action === 'view' ? 'SCHEDULE_VIEWED' : 'SCHEDULE_MODIFIED',
                reportType: schedule.reportType,
                scheduleId: schedule._id,
                userId: req.user._id,
                workplaceId: req.user.workplaceId,
                sessionId: req.sessionID,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                eventDetails: {
                    action: action.toUpperCase(),
                    resource: 'SCHEDULE',
                    resourceId: scheduleId,
                    success: true
                },
                compliance: {
                    dataAccessed: ['SCHEDULE_DATA'],
                    sensitiveData: false,
                    anonymized: true,
                    encryptionUsed: true,
                    accessJustification: `User has ${action} permission for schedule`
                },
                riskScore: action === 'view' ? 5 : 20
            });
            req.schedule = schedule;
            next();
        }
        catch (error) {
            logger_1.default.error('Schedule access check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify schedule access permissions',
                code: 'SCHEDULE_ACCESS_CHECK_ERROR'
            });
        }
    };
};
exports.requireScheduleAccess = requireScheduleAccess;
const requireExportPermission = (req, res, next) => {
    const exportFormat = req.query.format || req.body.format || 'pdf';
    const reportType = req.params.reportType || req.body.reportType;
    const exportPermissions = {
        'pdf': ['export_reports'],
        'csv': ['export_data', 'export_reports'],
        'excel': ['export_data', 'export_reports'],
        'json': ['export_raw_data', 'export_data']
    };
    const requiredPermissions = exportPermissions[exportFormat] || ['export_reports'];
    const permissionCheck = (0, rbac_1.requirePermission)(requiredPermissions[0], {
        useDynamicRBAC: true,
        enableLegacyFallback: true
    });
    permissionCheck(req, res, (error) => {
        if (error) {
            return next(error);
        }
        ReportAuditLog_1.default.logEvent({
            eventType: 'REPORT_EXPORTED',
            reportType,
            userId: req.user._id,
            workplaceId: req.user.workplaceId,
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            eventDetails: {
                action: 'EXPORT',
                resource: 'REPORT',
                resourceId: reportType,
                exportFormat: exportFormat,
                success: true
            },
            compliance: {
                dataAccessed: ['REPORT_DATA'],
                sensitiveData: true,
                anonymized: false,
                encryptionUsed: true,
                accessJustification: `User has ${requiredPermissions[0]} permission`
            },
            riskScore: 25
        }).catch(error => {
            logger_1.default.error('Failed to log export event:', error);
        });
        next();
    });
};
exports.requireExportPermission = requireExportPermission;
const validateDataAccess = async (req, res, next) => {
    try {
        const filters = req.query;
        const reportType = req.params.reportType || req.body.reportType;
        const dataTypes = [];
        let sensitiveData = false;
        const reportDataMapping = {
            'patient-outcomes': { types: ['PATIENT_DATA', 'CLINICAL_DATA'], sensitive: true },
            'pharmacist-interventions': { types: ['PHARMACIST_DATA', 'PERFORMANCE_DATA'], sensitive: false },
            'therapy-effectiveness': { types: ['CLINICAL_DATA', 'MEDICATION_DATA'], sensitive: true },
            'quality-improvement': { types: ['OPERATIONAL_DATA', 'PERFORMANCE_DATA'], sensitive: false },
            'regulatory-compliance': { types: ['AUDIT_DATA', 'COMPLIANCE_DATA'], sensitive: true },
            'cost-effectiveness': { types: ['FINANCIAL_DATA'], sensitive: true },
            'trend-forecasting': { types: ['ANALYTICS_DATA'], sensitive: false },
            'operational-efficiency': { types: ['OPERATIONAL_DATA', 'PERFORMANCE_DATA'], sensitive: false },
            'medication-inventory': { types: ['MEDICATION_DATA', 'INVENTORY_DATA'], sensitive: false },
            'patient-demographics': { types: ['DEMOGRAPHIC_DATA'], sensitive: true },
            'adverse-events': { types: ['CLINICAL_DATA', 'SAFETY_DATA'], sensitive: true }
        };
        const reportData = reportDataMapping[reportType];
        if (reportData) {
            dataTypes.push(...reportData.types);
            sensitiveData = reportData.sensitive;
        }
        if (filters.patientId && filters.patientId !== 'system') {
            dataTypes.push('PATIENT_DATA');
            sensitiveData = true;
            const patientAccessCheck = (0, rbac_1.requirePermission)('view_patient_data', {
                useDynamicRBAC: true
            });
            let hasPatientAccess = false;
            const mockRes = {
                status: () => ({ json: () => { } }),
                json: () => { }
            };
            const mockNext = () => {
                hasPatientAccess = true;
            };
            await patientAccessCheck(req, mockRes, mockNext);
            if (!hasPatientAccess) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions to view patient-specific data',
                    code: 'PATIENT_DATA_ACCESS_DENIED'
                });
                return;
            }
        }
        await ReportAuditLog_1.default.logEvent({
            eventType: 'DATA_ACCESS',
            reportType,
            userId: req.user._id,
            workplaceId: req.user.workplaceId,
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            eventDetails: {
                action: 'ACCESS',
                resource: 'DATA',
                filters,
                success: true
            },
            compliance: {
                dataAccessed: dataTypes,
                sensitiveData,
                anonymized: !filters.patientId || filters.patientId === 'system',
                encryptionUsed: true,
                accessJustification: 'User has appropriate permissions for data access'
            },
            riskScore: sensitiveData ? 30 : 10
        });
        req.dataContext = {
            dataTypes,
            sensitiveData,
            anonymized: !filters.patientId || filters.patientId === 'system'
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Data access validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate data access permissions',
            code: 'DATA_ACCESS_VALIDATION_ERROR'
        });
    }
};
exports.validateDataAccess = validateDataAccess;
const enforceWorkspaceIsolation = (req, res, next) => {
    const originalQuery = req.query;
    req.query = {
        ...originalQuery,
        workplaceId: req.user.workplaceId
    };
    if (originalQuery.workplaceId && originalQuery.workplaceId !== req.user.workplaceId) {
        logger_1.default.warn('Attempted cross-workspace data access', {
            userId: req.user._id,
            userWorkspace: req.user.workplaceId,
            requestedWorkspace: originalQuery.workplaceId,
            ip: req.ip
        });
        ReportAuditLog_1.default.logEvent({
            eventType: 'UNAUTHORIZED_ACCESS',
            userId: req.user._id,
            workplaceId: req.user.workplaceId,
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            eventDetails: {
                action: 'ACCESS',
                resource: 'DATA',
                success: false,
                errorMessage: 'Attempted cross-workspace data access'
            },
            compliance: {
                dataAccessed: ['WORKSPACE_DATA'],
                sensitiveData: true,
                anonymized: false,
                encryptionUsed: true
            },
            riskScore: 80,
            flagged: true,
            flagReason: 'SUSPICIOUS_ACTIVITY'
        }).catch(error => {
            logger_1.default.error('Failed to log security violation:', error);
        });
        res.status(403).json({
            success: false,
            message: 'Access denied: Cannot access data from different workspace',
            code: 'WORKSPACE_ISOLATION_VIOLATION'
        });
        return;
    }
    next();
};
exports.enforceWorkspaceIsolation = enforceWorkspaceIsolation;
exports.default = {
    requireReportAccess: exports.requireReportAccess,
    requireTemplateAccess: exports.requireTemplateAccess,
    requireScheduleAccess: exports.requireScheduleAccess,
    requireExportPermission: exports.requireExportPermission,
    validateDataAccess: exports.validateDataAccess,
    enforceWorkspaceIsolation: exports.enforceWorkspaceIsolation
};
//# sourceMappingURL=reportsRBAC.js.map