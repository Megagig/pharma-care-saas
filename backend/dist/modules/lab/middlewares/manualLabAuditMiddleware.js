"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorCompliance = exports.auditManualLabOperation = exports.auditTokenResolution = exports.auditStatusChange = exports.auditResultEntry = exports.auditPDFAccess = void 0;
const manualLabAuditService_1 = __importDefault(require("../services/manualLabAuditService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const auditPDFAccess = (req, res, next) => {
    const startTime = Date.now();
    const orderId = req.params.orderId;
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = Date.now();
        const accessDuration = endTime - startTime;
        setImmediate(async () => {
            try {
                if (res.statusCode === 200 && req.user) {
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
                    let downloadMethod = 'direct_link';
                    const referrer = req.get('Referer') || '';
                    if (referrer.includes('scan')) {
                        downloadMethod = referrer.includes('qr') ? 'qr_scan' : 'barcode_scan';
                    }
                    await manualLabAuditService_1.default.logPDFAccess(auditContext, {
                        orderId,
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
                            userId: req.user._id,
                            workplaceId: req.user.workplaceId,
                            userRole: req.user.role,
                            sessionId: req.sessionID,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent'),
                            requestMethod: req.method,
                            requestUrl: req.originalUrl
                        };
                        const abnormalCount = result.values?.filter((v) => v.abnormalFlag).length || 0;
                        const criticalCount = result.criticalResults?.length || 0;
                        await manualLabAuditService_1.default.logResultEntry(auditContext, result, {
                            orderId,
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
    let originalStatus;
    setImmediate(async () => {
        try {
            if (req.params.orderId) {
            }
        }
        catch (error) {
            logger_1.default.error('Failed to capture original status', {
                orderId: req.params.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-audit-middleware'
            });
        }
    });
    const originalJson = res.json;
    res.json = function (body) {
        setImmediate(async () => {
            try {
                if (res.statusCode === 200 && req.user && body.success) {
                    const order = body.data?.order;
                    if (order && req.body?.status) {
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
                        await manualLabAuditService_1.default.logStatusChange(auditContext, req.params.orderId, originalStatus || 'unknown', req.body.status, req.body.notes);
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Failed to audit status change in middleware', {
                    orderId: req.params.orderId,
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
                        userId: req.user._id,
                        workplaceId: req.user.workplaceId,
                        userRole: req.user.role,
                        sessionId: req.sessionID,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        requestMethod: req.method,
                        requestUrl: req.originalUrl
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
    return (req, res, next) => {
        const startTime = Date.now();
        logger_1.default.info('Manual lab operation started', {
            operationType,
            orderId: req.params.orderId,
            userId: req.user?._id,
            method: req.method,
            url: req.originalUrl,
            service: 'manual-lab-audit-middleware'
        });
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
                    await manualLabAuditService_1.default.logActivity(auditContext, {
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
exports.default = {
    auditPDFAccess: exports.auditPDFAccess,
    auditResultEntry: exports.auditResultEntry,
    auditStatusChange: exports.auditStatusChange,
    auditTokenResolution: exports.auditTokenResolution,
    auditManualLabOperation: exports.auditManualLabOperation,
    monitorCompliance: exports.monitorCompliance
};
//# sourceMappingURL=manualLabAuditMiddleware.js.map