"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorCompliance = exports.auditManualLabOperation = exports.auditTokenResolution = exports.auditStatusChange = exports.auditResultEntry = exports.auditPDFAccess = void 0;
const manualLabAuditService_1 = __importDefault(require("../services/manualLabAuditService"));
const manualLabSecurityService_1 = __importDefault(require("../services/manualLabSecurityService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const auditService_1 = require("../../../services/auditService");
const auditPDFAccess = (req, res, next) => {
    const startTime = Date.now();
    const orderId = req.params.orderId;
    if (!orderId) {
        res.status(400).json({
            success: false,
            message: 'Order ID is required',
            code: 'VALIDATION_ERROR',
        });
        return;
    }
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = Date.now();
        const accessDuration = endTime - startTime;
        setImmediate(async () => {
            try {
                if (res.statusCode === 200 && req.user) {
                    const auditContext = {
                        userId: req.user._id.toString(),
                        workspaceId: req.user.workplaceId.toString(),
                        sessionId: req.sessionID,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    };
                    let downloadMethod = 'direct_link';
                    const referrer = req.get('Referer') || '';
                    if (referrer.includes('scan')) {
                        downloadMethod = referrer.includes('qr') ? 'qr_scan' : 'barcode_scan';
                    }
                    await manualLabAuditService_1.default.logPDFAccess(auditContext, {
                        orderId: orderId,
                        patientId: req.body?.patientId || req.query?.patientId,
                        fileName: `lab_requisition_${orderId}.pdf`,
                        fileSize: Buffer.isBuffer(body) ? body.length : 0,
                        downloadMethod,
                        accessDuration,
                        userAgent: req.get('User-Agent'),
                        referrer: req.get('Referer')
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Failed to audit PDF access in middleware', {
                    orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab-audit-middleware'
                });
            }
        });
        return originalSend.call(this, body);
    };
    next();
};
exports.auditPDFAccess = auditPDFAccess;
const auditResultEntry = (req, res, next) => {
    const startTime = Date.now();
    const orderId = req.params.orderId;
    const originalJson = res.json;
    res.json = function (body) {
        const endTime = Date.now();
        const entryDuration = endTime - startTime;
        setImmediate(async () => {
            try {
                if (res.statusCode === 201 && req.user && body.success) {
                    const result = body.data?.result;
                    if (result) {
                        const auditContext = {
                            userId: req.user._id.toString(),
                            workspaceId: req.user.workplaceId.toString(),
                            sessionId: req.sessionID,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        };
                        const abnormalCount = result.values?.filter((v) => v.abnormalFlag).length || 0;
                        const criticalCount = result.criticalResults?.length || 0;
                        await manualLabAuditService_1.default.logResultEntry(auditContext, result, {
                            orderId: orderId,
                            patientId: req.body?.patientId,
                            testCount: result.values?.length || 0,
                            abnormalResultCount: abnormalCount,
                            criticalResultCount: criticalCount,
                            entryDuration,
                            validationErrors: req.body?.validationErrors,
                            aiProcessingTriggered: result.aiProcessed || false
                        });
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Failed to audit result entry in middleware', {
                    orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab-audit-middleware'
                });
            }
        });
        return originalJson.call(this, body);
    };
    next();
};
exports.auditResultEntry = auditResultEntry;
const auditStatusChange = (req, res, next) => {
    const orderId = req.params.orderId;
    const { status: newStatus } = req.body;
    const originalJson = res.json;
    res.json = function (body) {
        setImmediate(async () => {
            try {
                if (res.statusCode === 200 && req.user && body.success) {
                    const auditContext = {
                        userId: req.user._id.toString(),
                        workspaceId: req.user.workplaceId.toString(),
                        sessionId: req.sessionID,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    };
                    const { previousStatus } = body.data;
                    await manualLabAuditService_1.default.logStatusChange(auditContext, orderId, previousStatus, newStatus);
                }
            }
            catch (error) {
                logger_1.default.error('Failed to audit status change in middleware', {
                    orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab-audit-middleware'
                });
            }
        });
        return originalJson.call(this, body);
    };
    next();
};
exports.auditStatusChange = auditStatusChange;
const auditTokenResolution = (req, res, next) => {
    const token = req.query.token;
    const originalJson = res.json;
    res.json = function (body) {
        setImmediate(async () => {
            try {
                if (req.user) {
                    const auditContext = {
                        userId: req.user._id.toString(),
                        workspaceId: req.user.workplaceId.toString(),
                        sessionId: req.sessionID,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    };
                    const success = res.statusCode === 200 && body.success;
                    const orderId = body.data?.order?.orderId || 'unknown';
                    const errorReason = !success ? body.error?.message : undefined;
                    let tokenType = 'manual_entry';
                    const userAgent = req.get('User-Agent') || '';
                    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
                        tokenType = 'qr_code';
                    }
                    await manualLabAuditService_1.default.logTokenResolution(auditContext, orderId, tokenType, success, errorReason);
                }
            }
            catch (error) {
                logger_1.default.error('Failed to audit token resolution in middleware', {
                    token: token ? 'present' : 'missing',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab-audit-middleware'
                });
            }
        });
        return originalJson.call(this, body);
    };
    next();
};
exports.auditTokenResolution = auditTokenResolution;
const auditManualLabOperation = (operationType) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        logger_1.default.info('Manual lab operation started', {
            operationType,
            orderId: req.params.orderId,
            userId: req.user?._id,
            method: req.method,
            url: req.originalUrl,
            service: 'manual-lab-audit-middleware'
        });
        if (req.user) {
            try {
                const auditContext = {
                    userId: req.user._id.toString(),
                    workspaceId: req.user.workplaceId.toString(),
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                const threats = await manualLabSecurityService_1.default.analyzeRequest(auditContext, {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                    query: req.query,
                    headers: req.headers
                });
                const criticalThreats = threats.filter(t => t.severity === 'critical');
                if (criticalThreats.length > 0) {
                    logger_1.default.error('Critical security threat detected - blocking request', {
                        userId: req.user._id,
                        threats: criticalThreats,
                        service: 'manual-lab-audit-middleware'
                    });
                    return res.status(403).json({
                        success: false,
                        code: 'SECURITY_THREAT_DETECTED',
                        message: 'Request blocked due to security threat detection'
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Security analysis failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    userId: req.user._id,
                    service: 'manual-lab-audit-middleware'
                });
            }
        }
        const originalJson = res.json;
        res.json = function (body) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logger_1.default.info('Manual lab operation completed', {
                operationType,
                orderId: req.params.orderId,
                userId: req.user?._id,
                statusCode: res.statusCode,
                duration,
                success: body.success,
                service: 'manual-lab-audit-middleware'
            });
            return originalJson.call(this, body);
        };
        next();
        return;
    };
};
exports.auditManualLabOperation = auditManualLabOperation;
const monitorCompliance = (req, res, next) => {
    const violations = [];
    if (!req.get('User-Agent')) {
        violations.push('missing_user_agent');
    }
    if (req.originalUrl.includes('pdf') && !req.get('Referer')) {
        violations.push('direct_pdf_access');
    }
    const lastRequestTime = req.session?.lastManualLabRequest;
    const currentTime = Date.now();
    if (lastRequestTime && (currentTime - lastRequestTime) < 1000) {
        violations.push('rapid_requests');
    }
    if (req.session) {
        req.session.lastManualLabRequest = currentTime;
    }
    if (violations.length > 0) {
        logger_1.default.warn('Compliance violations detected', {
            violations,
            userId: req.user?._id,
            url: req.originalUrl,
            service: 'manual-lab-audit-middleware'
        });
        setImmediate(async () => {
            try {
                if (req.user) {
                    const auditContext = {
                        userId: req.user._id,
                        workplaceId: req.user.workplaceId,
                        userRole: req.user.role,
                        sessionId: req.sessionID,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        requestMethod: req.method,
                        requestUrl: req.originalUrl
                    };
                    await auditService_1.AuditService.logActivity(auditContext, {
                        action: 'MANUAL_LAB_COMPLIANCE_VIOLATION',
                        resourceType: 'System',
                        resourceId: req.user._id,
                        details: {
                            violations,
                            url: req.originalUrl,
                            method: req.method,
                            timestamp: new Date()
                        },
                        complianceCategory: 'workflow_compliance',
                        riskLevel: violations.length > 2 ? 'high' : 'medium'
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Failed to log compliance violation', {
                    violations,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab-audit-middleware'
                });
            }
        });
    }
    next();
};
exports.monitorCompliance = monitorCompliance;
//# sourceMappingURL=manualLabAuditMiddleware.js.map