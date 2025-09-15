"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRegulatoryContext = exports.setAIMetadata = exports.setAuditData = exports.auditDataExport = exports.auditDataAccess = exports.auditHighRiskActivity = exports.auditPharmacistReview = exports.auditAIProcessing = exports.auditDiagnosticRequest = exports.diagnosticAuditLogger = exports.auditTimer = void 0;
const diagnosticAuditService_1 = __importDefault(require("../services/diagnosticAuditService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const auditTimer = (req, res, next) => {
    req.startTime = Date.now();
    const requestData = {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        timestamp: req.startTime
    };
    req.requestHash = crypto_1.default
        .createHash('sha256')
        .update(JSON.stringify(requestData))
        .digest('hex');
    next();
};
exports.auditTimer = auditTimer;
const diagnosticAuditLogger = (options = {}) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        const originalSend = res.send;
        res.json = function (body) {
            res.locals.responseBody = body;
            return originalJson.call(this, body);
        };
        res.send = function (body) {
            res.locals.responseBody = body;
            return originalSend.call(this, body);
        };
        next();
        res.on('finish', async () => {
            try {
                if (!req.user)
                    return;
                const duration = req.startTime ? Date.now() - req.startTime : undefined;
                const responseBody = res.locals.responseBody;
                const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                const isError = res.statusCode >= 400;
                if (options.skipSuccessLog && isSuccess)
                    return;
                const eventType = req.auditData?.eventType ||
                    options.eventType ||
                    generateEventTypeFromRequest(req);
                const entityType = req.auditData?.entityType ||
                    options.entityType ||
                    determineEntityType(req.path);
                const entityId = req.auditData?.entityId ||
                    req.params.id ||
                    req.params.requestId ||
                    req.params.resultId ||
                    extractEntityIdFromResponse(responseBody);
                const patientId = req.auditData?.patientId ||
                    req.params.patientId ||
                    req.body?.patientId ||
                    extractPatientIdFromResponse(responseBody);
                const severity = req.auditData?.severity ||
                    options.severity ||
                    determineSeverity(req, res, isError);
                if (options.requireConsent) {
                    const consentObtained = req.body?.consentObtained ||
                        req.auditData?.details?.consentObtained;
                    if (!consentObtained) {
                        await diagnosticAuditService_1.default.logSecurityViolation(req.user.id.toString(), req.user.workplaceId.toString(), 'missing_consent', {
                            eventType,
                            entityType,
                            entityId,
                            requestPath: req.path,
                            requestMethod: req.method
                        }, {
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent'),
                            requestId: req.headers['x-request-id'],
                            requestHash: req.requestHash
                        });
                        return;
                    }
                }
                const auditDetails = {
                    ...req.auditData?.details,
                    requestMethod: req.method,
                    requestPath: req.path,
                    requestQuery: sanitizeQuery(req.query),
                    requestBody: sanitizeRequestBody(req.body),
                    responseStatus: res.statusCode,
                    responseTime: duration,
                    requestHash: req.requestHash,
                    userAgent: req.get('User-Agent'),
                    contentType: req.get('Content-Type'),
                    contentLength: req.get('Content-Length'),
                    referer: req.get('Referer')
                };
                if (isError && responseBody?.error) {
                    auditDetails.errorCode = responseBody.error.code;
                    auditDetails.errorMessage = responseBody.error.message;
                }
                if (options.aiProcessing && req.auditData?.aiMetadata) {
                    auditDetails.aiMetadata = req.auditData.aiMetadata;
                }
                const regulatoryContext = {
                    hipaaCompliant: true,
                    gdprCompliant: true,
                    dataRetentionPeriod: getRetentionPeriod(entityType),
                    consentRequired: options.requireConsent || false,
                    consentObtained: req.body?.consentObtained || false,
                    ...req.auditData?.regulatoryContext
                };
                await diagnosticAuditService_1.default.logAuditEvent({
                    eventType: eventType,
                    entityType: entityType,
                    entityId: entityId || 'unknown',
                    userId: req.user.id.toString(),
                    workplaceId: req.user.workplaceId.toString(),
                    patientId,
                    details: auditDetails,
                    metadata: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        apiVersion: req.get('API-Version') || '1.0',
                        requestId: req.headers['x-request-id']
                    },
                    timestamp: new Date(),
                    severity,
                    regulatoryContext,
                    aiMetadata: req.auditData?.aiMetadata
                });
                if (severity === 'critical' || severity === 'high') {
                    logger_1.default.warn('High-risk diagnostic activity detected', {
                        eventType,
                        entityType,
                        entityId,
                        userId: req.user.id.toString(),
                        workplaceId: req.user.workplaceId.toString(),
                        severity,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Failed to log diagnostic audit event:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    userId: req.user?.id,
                    workplaceId: req.user?.workplaceId,
                    path: req.path,
                    method: req.method
                });
            }
        });
    };
};
exports.diagnosticAuditLogger = diagnosticAuditLogger;
exports.auditDiagnosticRequest = (0, exports.diagnosticAuditLogger)({
    eventType: 'diagnostic_request_created',
    entityType: 'diagnostic_request',
    severity: 'medium',
    requireConsent: true
});
exports.auditAIProcessing = (0, exports.diagnosticAuditLogger)({
    eventType: 'ai_analysis_requested',
    entityType: 'diagnostic_request',
    severity: 'high',
    requireConsent: true,
    aiProcessing: true
});
exports.auditPharmacistReview = (0, exports.diagnosticAuditLogger)({
    eventType: 'pharmacist_review_completed',
    entityType: 'diagnostic_result',
    severity: 'high'
});
const auditHighRiskActivity = (eventType, entityType) => {
    return (0, exports.diagnosticAuditLogger)({
        eventType,
        entityType,
        severity: 'critical'
    });
};
exports.auditHighRiskActivity = auditHighRiskActivity;
exports.auditDataAccess = (0, exports.diagnosticAuditLogger)({
    eventType: 'data_access',
    severity: 'medium'
});
exports.auditDataExport = (0, exports.diagnosticAuditLogger)({
    eventType: 'data_export',
    severity: 'high'
});
const setAuditData = (req, data) => {
    req.auditData = { ...req.auditData, ...data };
};
exports.setAuditData = setAuditData;
const setAIMetadata = (req, aiMetadata) => {
    if (!req.auditData)
        req.auditData = {};
    req.auditData.aiMetadata = aiMetadata;
};
exports.setAIMetadata = setAIMetadata;
const setRegulatoryContext = (req, regulatoryContext) => {
    if (!req.auditData)
        req.auditData = {};
    req.auditData.regulatoryContext = regulatoryContext;
};
exports.setRegulatoryContext = setRegulatoryContext;
function generateEventTypeFromRequest(req) {
    const method = req.method;
    const path = req.path;
    if (method === 'POST' && path.includes('/diagnostics')) {
        if (path.includes('/retry'))
            return 'diagnostic_request_retried';
        if (path.includes('/approve'))
            return 'diagnostic_approved';
        if (path.includes('/reject'))
            return 'diagnostic_rejected';
        return 'diagnostic_request_created';
    }
    if (method === 'GET' && path.includes('/diagnostics')) {
        if (path.includes('/dashboard'))
            return 'dashboard_accessed';
        if (path.includes('/history'))
            return 'patient_history_accessed';
        if (path.includes('/pending-reviews'))
            return 'pending_reviews_accessed';
        return 'diagnostic_data_accessed';
    }
    if (method === 'PUT' && path.includes('/diagnostics')) {
        return 'diagnostic_updated';
    }
    if (method === 'DELETE' && path.includes('/diagnostics')) {
        return 'diagnostic_cancelled';
    }
    return `${method.toLowerCase()}_${path.split('/').pop() || 'unknown'}`;
}
function determineEntityType(path) {
    if (path.includes('/diagnostics')) {
        if (path.includes('/results'))
            return 'diagnostic_result';
        if (path.includes('/lab'))
            return 'lab_order';
        return 'diagnostic_request';
    }
    if (path.includes('/audit'))
        return 'audit_log';
    if (path.includes('/compliance'))
        return 'compliance_report';
    return 'unknown';
}
function determineSeverity(req, res, isError) {
    if (isError) {
        if (res.statusCode >= 500)
            return 'critical';
        if (res.statusCode >= 400)
            return 'high';
    }
    if (req.method === 'DELETE')
        return 'critical';
    if (req.method === 'POST' && req.path.includes('/ai'))
        return 'high';
    if (req.method === 'POST')
        return 'medium';
    return 'low';
}
function getRetentionPeriod(entityType) {
    const retentionPolicies = {
        'diagnostic_request': 2555,
        'diagnostic_result': 2555,
        'lab_order': 2555,
        'lab_result': 2555,
        'audit_log': 1095,
        'compliance_report': 2555
    };
    return retentionPolicies[entityType] || 2555;
}
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = { ...body };
    const sensitiveFields = [
        'password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'
    ];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
            sanitized[key] = sanitized[key].substring(0, 1000) + '... [TRUNCATED]';
        }
    });
    return sanitized;
}
function sanitizeQuery(query) {
    if (!query || typeof query !== 'object')
        return query;
    const sanitized = { ...query };
    const sensitiveParams = ['token', 'apiKey', 'secret', 'password'];
    sensitiveParams.forEach(param => {
        if (sanitized[param]) {
            sanitized[param] = '[REDACTED]';
        }
    });
    return sanitized;
}
function extractEntityIdFromResponse(responseBody) {
    if (!responseBody || typeof responseBody !== 'object')
        return undefined;
    if (responseBody.data?.id)
        return responseBody.data.id;
    if (responseBody.data?._id)
        return responseBody.data._id;
    if (responseBody.data?.request?.id)
        return responseBody.data.request.id;
    if (responseBody.data?.request?._id)
        return responseBody.data.request._id;
    if (responseBody.id)
        return responseBody.id;
    if (responseBody._id)
        return responseBody._id;
    return undefined;
}
function extractPatientIdFromResponse(responseBody) {
    if (!responseBody || typeof responseBody !== 'object')
        return undefined;
    if (responseBody.data?.patientId)
        return responseBody.data.patientId;
    if (responseBody.data?.request?.patientId)
        return responseBody.data.request.patientId;
    if (responseBody.patientId)
        return responseBody.patientId;
    return undefined;
}
exports.default = {
    auditTimer: exports.auditTimer,
    diagnosticAuditLogger: exports.diagnosticAuditLogger,
    auditDiagnosticRequest: exports.auditDiagnosticRequest,
    auditAIProcessing: exports.auditAIProcessing,
    auditPharmacistReview: exports.auditPharmacistReview,
    auditHighRiskActivity: exports.auditHighRiskActivity,
    auditDataAccess: exports.auditDataAccess,
    auditDataExport: exports.auditDataExport,
    setAuditData: exports.setAuditData,
    setAIMetadata: exports.setAIMetadata,
    setRegulatoryContext: exports.setRegulatoryContext
};
//# sourceMappingURL=auditMiddleware.js.map