"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.auditPatientAccess = exports.auditMTRActivity = exports.auditTimer = exports.createManualAuditLog = exports.auditIntervention = exports.logAuditTrail = exports.captureAuditData = void 0;
const auditService_1 = require("../services/auditService");
const captureAuditData = (action, complianceCategory, riskLevel) => {
    return (req, res, next) => {
        req.originalBody = { ...req.body };
        req.auditData = {
            action,
            complianceCategory,
            riskLevel,
            details: {
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query,
                body: req.body
            }
        };
        next();
    };
};
exports.captureAuditData = captureAuditData;
const logAuditTrail = async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (req.auditData) {
            req.auditData.details.responseStatus = res.statusCode;
            req.auditData.details.responseData = body;
            if (body?.data?._id) {
                req.auditData.interventionId = body.data._id;
            }
            else if (req.params.id) {
                req.auditData.interventionId = req.params.id;
            }
            if (req.method === 'PUT' || req.method === 'PATCH') {
                req.auditData.changedFields = Object.keys(req.body || {});
                req.auditData.oldValues = req.originalBody;
                req.auditData.newValues = req.body;
            }
            if (req.user?.id) {
                auditService_1.AuditService.createAuditLog({
                    action: req.auditData.action,
                    userId: req.user.id,
                    interventionId: req.auditData.interventionId,
                    details: req.auditData.details,
                    riskLevel: req.auditData.riskLevel,
                    complianceCategory: req.auditData.complianceCategory,
                    changedFields: req.auditData.changedFields,
                    oldValues: req.auditData.oldValues,
                    newValues: req.auditData.newValues,
                    workspaceId: req.user?.workplaceId?.toString()
                }, req).catch(error => {
                    console.error('Failed to create audit log:', error);
                });
            }
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.logAuditTrail = logAuditTrail;
const auditIntervention = (action) => {
    const complianceCategory = getComplianceCategoryForAction(action);
    const riskLevel = getRiskLevelForAction(action);
    return [
        (0, exports.captureAuditData)(action, complianceCategory, riskLevel),
        exports.logAuditTrail
    ];
};
exports.auditIntervention = auditIntervention;
function getComplianceCategoryForAction(action) {
    const categoryMap = {
        'INTERVENTION_CREATED': 'clinical_documentation',
        'INTERVENTION_UPDATED': 'clinical_documentation',
        'INTERVENTION_DELETED': 'data_integrity',
        'INTERVENTION_REVIEWED': 'quality_assurance',
        'INTERVENTION_APPROVED': 'quality_assurance',
        'INTERVENTION_REJECTED': 'quality_assurance',
        'INTERVENTION_COMPLETED': 'patient_care',
        'INTERVENTION_CANCELLED': 'workflow_management',
        'INTERVENTION_ASSIGNED': 'workflow_management',
        'INTERVENTION_ESCALATED': 'risk_management',
        'MEDICATION_CHANGED': 'medication_safety',
        'DOSAGE_MODIFIED': 'medication_safety',
        'ALLERGY_UPDATED': 'patient_privacy',
        'CONTRAINDICATION_FLAGGED': 'medication_safety',
        'RISK_ASSESSMENT_UPDATED': 'risk_management',
        'PATIENT_DATA_ACCESSED': 'patient_privacy',
        'EXPORT_PERFORMED': 'data_integrity',
        'REPORT_GENERATED': 'regulatory_compliance'
    };
    return categoryMap[action] || 'workflow_management';
}
function getRiskLevelForAction(action) {
    const riskMap = {
        'INTERVENTION_DELETED': 'critical',
        'PATIENT_DATA_ACCESSED': 'critical',
        'MEDICATION_CHANGED': 'high',
        'DOSAGE_MODIFIED': 'high',
        'CONTRAINDICATION_FLAGGED': 'high',
        'INTERVENTION_ESCALATED': 'high',
        'INTERVENTION_UPDATED': 'medium',
        'INTERVENTION_REJECTED': 'medium',
        'ALLERGY_UPDATED': 'medium',
        'RISK_ASSESSMENT_UPDATED': 'medium',
        'INTERVENTION_CREATED': 'low',
        'INTERVENTION_REVIEWED': 'low',
        'INTERVENTION_APPROVED': 'low',
        'INTERVENTION_COMPLETED': 'low'
    };
    return riskMap[action] || 'low';
}
const createManualAuditLog = async (req, action, details, options) => {
    if (!req.user?.id) {
        console.warn('Cannot create audit log: No user in request');
        return;
    }
    try {
        await auditService_1.AuditService.createAuditLog({
            action,
            userId: req.user.id,
            interventionId: options?.interventionId,
            details,
            riskLevel: options?.riskLevel,
            complianceCategory: options?.complianceCategory || getComplianceCategoryForAction(action),
            workspaceId: req.user?.workplaceId?.toString()
        }, req);
    }
    catch (error) {
        console.error('Failed to create manual audit log:', error);
    }
};
exports.createManualAuditLog = createManualAuditLog;
const auditTimer = (action) => {
    return (req, res, next) => {
        const startTime = Date.now();
        req.auditStartTime = startTime;
        const originalEnd = res.end;
        res.end = function (...args) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            if (req.user?.id) {
                auditService_1.AuditService.createAuditLog({
                    action: `${action}_TIMING`,
                    userId: req.user.id,
                    details: {
                        duration,
                        startTime: new Date(startTime),
                        endTime: new Date(endTime),
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode
                    },
                    complianceCategory: 'system_performance',
                    riskLevel: duration > 5000 ? 'medium' : 'low'
                }, req).catch(error => {
                    console.error('Failed to create timing audit log:', error);
                });
            }
            return originalEnd.apply(this, args);
        };
        next();
    };
};
exports.auditTimer = auditTimer;
const auditMTRActivity = (activityType) => {
    return async (req, res, next) => {
        try {
            if (req.user?.id) {
                await auditService_1.AuditService.createAuditLog({
                    action: `MTR_${activityType.toUpperCase()}`,
                    userId: req.user.id,
                    details: {
                        activityType,
                        sessionId: req.params.sessionId || req.body.sessionId,
                        stepId: req.params.stepId || req.body.stepId,
                        method: req.method,
                        url: req.originalUrl,
                        params: req.params,
                        query: req.query
                    },
                    complianceCategory: 'clinical_documentation',
                    riskLevel: 'medium'
                }, req);
            }
        }
        catch (error) {
            console.error('Failed to create MTR activity audit log:', error);
        }
        next();
    };
};
exports.auditMTRActivity = auditMTRActivity;
const auditPatientAccess = async (req, res, next) => {
    try {
        const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
        if (req.user?.id && patientId) {
            await auditService_1.AuditService.createAuditLog({
                action: 'PATIENT_DATA_ACCESSED',
                userId: req.user.id,
                details: {
                    patientId,
                    accessType: 'mtr_review',
                    method: req.method,
                    url: req.originalUrl,
                    timestamp: new Date()
                },
                complianceCategory: 'patient_privacy',
                riskLevel: 'high'
            }, req);
        }
    }
    catch (error) {
        console.error('Failed to create patient access audit log:', error);
    }
    next();
};
exports.auditPatientAccess = auditPatientAccess;
const auditLogger = (action, complianceCategory) => {
    return async (req, res, next) => {
        try {
            if (req.user?.id) {
                await auditService_1.AuditService.createAuditLog({
                    action,
                    userId: req.user.id,
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        params: req.params,
                        query: req.query,
                        body: req.method !== 'GET' ? req.body : undefined,
                        timestamp: new Date()
                    },
                    complianceCategory: complianceCategory || getComplianceCategoryForAction(action),
                    riskLevel: getRiskLevelForAction(action)
                }, req);
            }
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
        next();
    };
};
exports.auditLogger = auditLogger;
//# sourceMappingURL=auditMiddleware.js.map