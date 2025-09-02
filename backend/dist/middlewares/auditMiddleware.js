"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuditData = exports.auditHighRiskActivity = exports.auditPatientAccess = exports.auditMTRActivity = exports.auditLogger = exports.auditTimer = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auditService_1 = __importDefault(require("../services/auditService"));
const auditTimer = (req, res, next) => {
    req.startTime = Date.now();
    next();
};
exports.auditTimer = auditTimer;
const auditLogger = (options = {}) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        let responseData;
        let statusCode;
        res.json = function (data) {
            responseData = data;
            statusCode = res.statusCode;
            return originalJson.call(this, data);
        };
        const originalStatus = res.status;
        res.status = function (code) {
            statusCode = code;
            return originalStatus.call(this, code);
        };
        next();
        res.on('finish', async () => {
            try {
                if (!req.user)
                    return;
                const context = auditService_1.default.createAuditContext(req);
                const duration = req.startTime ? Date.now() - req.startTime : undefined;
                const action = req.auditData?.action ||
                    options.action ||
                    generateActionFromRequest(req);
                const resourceType = req.auditData?.resourceType ||
                    options.resourceType ||
                    determineResourceType(req.path);
                if (options.skipSuccessLog && statusCode >= 200 && statusCode < 300) {
                    return;
                }
                const resourceIdStr = req.auditData?.resourceId ||
                    req.params.id ||
                    req.params.patientId ||
                    req.params.reviewId ||
                    context.userId.toString();
                const complianceCategory = req.auditData?.complianceCategory || options.complianceCategory;
                const riskLevel = req.auditData?.riskLevel || options.riskLevel;
                const auditData = {
                    action,
                    resourceType: resourceType,
                    resourceId: new mongoose_1.default.Types.ObjectId(resourceIdStr),
                    patientId: req.auditData?.patientId ? new mongoose_1.default.Types.ObjectId(req.auditData.patientId) :
                        req.params.patientId ? new mongoose_1.default.Types.ObjectId(req.params.patientId) : undefined,
                    reviewId: req.auditData?.reviewId ? new mongoose_1.default.Types.ObjectId(req.auditData.reviewId) :
                        req.params.id ? new mongoose_1.default.Types.ObjectId(req.params.id) : undefined,
                    oldValues: req.auditData?.oldValues,
                    newValues: req.auditData?.newValues,
                    details: {
                        ...req.auditData?.details,
                        requestBody: sanitizeRequestBody(req.body),
                        queryParams: req.query,
                        statusCode,
                        success: statusCode >= 200 && statusCode < 300,
                    },
                    errorMessage: statusCode >= 400 ? getErrorMessage(responseData) : undefined,
                    duration,
                    complianceCategory: complianceCategory,
                    riskLevel: riskLevel,
                };
                await auditService_1.default.logActivity(context, auditData);
            }
            catch (error) {
                console.error('Failed to log audit activity:', error);
            }
        });
    };
};
exports.auditLogger = auditLogger;
const auditMTRActivity = (action) => {
    return (0, exports.auditLogger)({
        action,
        resourceType: 'MedicationTherapyReview',
        complianceCategory: 'clinical_documentation',
    });
};
exports.auditMTRActivity = auditMTRActivity;
const auditPatientAccess = (action) => {
    return (0, exports.auditLogger)({
        action,
        resourceType: 'Patient',
        complianceCategory: 'data_access',
        riskLevel: 'medium',
    });
};
exports.auditPatientAccess = auditPatientAccess;
const auditHighRiskActivity = (action, resourceType) => {
    return (0, exports.auditLogger)({
        action,
        resourceType,
        riskLevel: 'high',
        complianceCategory: 'system_security',
    });
};
exports.auditHighRiskActivity = auditHighRiskActivity;
const setAuditData = (req, data) => {
    req.auditData = { ...req.auditData, ...data };
};
exports.setAuditData = setAuditData;
function generateActionFromRequest(req) {
    const method = req.method;
    const path = req.path;
    if (path.includes('/mtr')) {
        if (method === 'POST' && path.endsWith('/mtr'))
            return 'CREATE_MTR_SESSION';
        if (method === 'PUT' && path.includes('/mtr/'))
            return 'UPDATE_MTR_SESSION';
        if (method === 'DELETE' && path.includes('/mtr/'))
            return 'DELETE_MTR_SESSION';
        if (method === 'GET' && path.includes('/mtr/'))
            return 'VIEW_MTR_SESSION';
        if (path.includes('/problems')) {
            if (method === 'POST')
                return 'CREATE_MTR_PROBLEM';
            if (method === 'PUT')
                return 'UPDATE_MTR_PROBLEM';
            if (method === 'DELETE')
                return 'DELETE_MTR_PROBLEM';
            return 'VIEW_MTR_PROBLEMS';
        }
        if (path.includes('/interventions')) {
            if (method === 'POST')
                return 'CREATE_MTR_INTERVENTION';
            if (method === 'PUT')
                return 'UPDATE_MTR_INTERVENTION';
            if (method === 'DELETE')
                return 'DELETE_MTR_INTERVENTION';
            return 'VIEW_MTR_INTERVENTIONS';
        }
        if (path.includes('/followups')) {
            if (method === 'POST')
                return 'CREATE_MTR_FOLLOWUP';
            if (method === 'PUT')
                return 'UPDATE_MTR_FOLLOWUP';
            if (method === 'DELETE')
                return 'DELETE_MTR_FOLLOWUP';
            return 'VIEW_MTR_FOLLOWUPS';
        }
    }
    if (path.includes('/patients')) {
        if (method === 'POST')
            return 'CREATE_PATIENT';
        if (method === 'PUT')
            return 'UPDATE_PATIENT';
        if (method === 'DELETE')
            return 'DELETE_PATIENT';
        return 'VIEW_PATIENT';
    }
    if (path.includes('/auth')) {
        if (path.includes('/login'))
            return 'LOGIN';
        if (path.includes('/logout'))
            return 'LOGOUT';
        if (path.includes('/register'))
            return 'REGISTER';
    }
    if (path.includes('/audit')) {
        if (path.includes('/export'))
            return 'EXPORT_AUDIT_DATA';
        if (path.includes('/compliance-report'))
            return 'ACCESS_COMPLIANCE_REPORT';
        return 'VIEW_AUDIT_LOGS';
    }
    return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}
function determineResourceType(path) {
    if (path.includes('/mtr'))
        return 'MedicationTherapyReview';
    if (path.includes('/patients'))
        return 'Patient';
    if (path.includes('/users'))
        return 'User';
    if (path.includes('/audit'))
        return 'User';
    return 'User';
}
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 5000) {
        return { _truncated: true, _originalSize: jsonString.length };
    }
    return sanitized;
}
function getErrorMessage(responseData) {
    if (!responseData)
        return undefined;
    if (typeof responseData === 'string')
        return responseData;
    if (responseData.message)
        return responseData.message;
    if (responseData.error)
        return responseData.error;
    if (responseData.errors && Array.isArray(responseData.errors)) {
        return responseData.errors.join(', ');
    }
    return 'Unknown error';
}
exports.default = {
    auditTimer: exports.auditTimer,
    auditLogger: exports.auditLogger,
    auditMTRActivity: exports.auditMTRActivity,
    auditPatientAccess: exports.auditPatientAccess,
    auditHighRiskActivity: exports.auditHighRiskActivity,
    setAuditData: exports.setAuditData,
};
//# sourceMappingURL=auditMiddleware.js.map