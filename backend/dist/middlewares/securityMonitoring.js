"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorDataAccess = exports.monitorPermissionChanges = exports.detectAnomalies = exports.adaptiveRateLimit = exports.monitorSecurityEvents = exports.validateSession = exports.monitorSuspiciousUsers = exports.blockSuspiciousIPs = void 0;
const securityMonitoringService_1 = require("../services/securityMonitoringService");
const logger_1 = __importDefault(require("../utils/logger"));
const blockSuspiciousIPs = (req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    if (securityMonitoringService_1.securityMonitoringService.isIPBlocked(ipAddress)) {
        logger_1.default.warn('Blocked request from suspicious IP', {
            ipAddress,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            service: 'security-monitoring',
        });
        res.status(403).json({
            success: false,
            code: 'IP_BLOCKED',
            message: 'Access denied. Your IP address has been blocked due to suspicious activity.',
        });
        return;
    }
    next();
};
exports.blockSuspiciousIPs = blockSuspiciousIPs;
const monitorSuspiciousUsers = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    const suspiciousScore = securityMonitoringService_1.securityMonitoringService.getUserSuspiciousScore(req.user._id.toString());
    if (suspiciousScore > 8) {
        logger_1.default.warn('High suspicion user detected', {
            userId: req.user._id,
            suspiciousScore,
            url: req.originalUrl,
            service: 'security-monitoring',
        });
        res.status(403).json({
            success: false,
            code: 'ACCOUNT_FLAGGED',
            message: 'Your account has been flagged for suspicious activity. Please contact support.',
            suspiciousScore,
        });
        return;
    }
    else if (suspiciousScore > 5) {
        res.set('X-Security-Warning', 'Account under monitoring');
        logger_1.default.info('Suspicious user activity monitored', {
            userId: req.user._id,
            suspiciousScore,
            url: req.originalUrl,
            service: 'security-monitoring',
        });
    }
    next();
};
exports.monitorSuspiciousUsers = monitorSuspiciousUsers;
const validateSession = async (req, res, next) => {
    if (!req.user || !req.sessionID) {
        return next();
    }
    try {
        const isValid = await securityMonitoringService_1.securityMonitoringService.validateUserSession(req.user._id, req.sessionID);
        if (!isValid) {
            logger_1.default.warn('Invalid session detected', {
                userId: req.user._id,
                sessionId: req.sessionID,
                url: req.originalUrl,
                service: 'security-monitoring',
            });
            res.status(401).json({
                success: false,
                code: 'SESSION_INVALID',
                message: 'Your session is no longer valid. Please log in again.',
                requiresReauth: true,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating session', {
            error: error?.message || 'Unknown error',
            userId: req.user._id,
            sessionId: req.sessionID,
            service: 'security-monitoring',
        });
        next();
    }
};
exports.validateSession = validateSession;
const monitorSecurityEvents = (eventType) => {
    return async (req, res, next) => {
        next();
        setImmediate(async () => {
            try {
                await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent(req, eventType, {
                    statusCode: res.statusCode,
                    requestBody: req.body,
                    query: req.query,
                    params: req.params,
                });
            }
            catch (error) {
                logger_1.default.error('Error monitoring security event', {
                    error: error?.message || 'Unknown error',
                    eventType,
                    userId: req.user?._id,
                    service: 'security-monitoring',
                });
            }
        });
    };
};
exports.monitorSecurityEvents = monitorSecurityEvents;
const adaptiveRateLimit = (baseLimit) => {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const suspiciousScore = securityMonitoringService_1.securityMonitoringService.getUserSuspiciousScore(req.user._id.toString());
        const adjustedLimit = Math.max(1, Math.floor(baseLimit * (1 - suspiciousScore / 10)));
        req.adaptiveRateLimit = adjustedLimit;
        if (suspiciousScore > 3) {
            logger_1.default.info('Adaptive rate limit applied', {
                userId: req.user._id,
                suspiciousScore,
                baseLimit,
                adjustedLimit,
                service: 'security-monitoring',
            });
        }
        next();
    };
};
exports.adaptiveRateLimit = adaptiveRateLimit;
const detectAnomalies = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    const anomalies = [];
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || 'unknown';
    if (userAgent.toLowerCase().includes('bot') ||
        userAgent.toLowerCase().includes('crawler') ||
        userAgent.toLowerCase().includes('spider')) {
        anomalies.push('bot_user_agent');
    }
    const lastRequestTime = req.lastRequestTime;
    const currentTime = Date.now();
    if (lastRequestTime && (currentTime - lastRequestTime) < 100) {
        anomalies.push('rapid_requests');
    }
    req.lastRequestTime = currentTime;
    if (req.originalUrl.includes('admin') && req.user.role !== 'super_admin') {
        anomalies.push('unauthorized_admin_access');
    }
    if (anomalies.length > 0) {
        logger_1.default.warn('Request anomalies detected', {
            userId: req.user._id,
            anomalies,
            userAgent,
            ipAddress,
            url: req.originalUrl,
            service: 'security-monitoring',
        });
        setImmediate(async () => {
            try {
                await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent(req, 'anomaly_detected', {
                    anomalies,
                    userAgent,
                    ipAddress,
                });
            }
            catch (error) {
                logger_1.default.error('Error analyzing anomaly', {
                    error: error?.message || 'Unknown error',
                    userId: req.user?._id,
                    service: 'security-monitoring',
                });
            }
        });
    }
    next();
};
exports.detectAnomalies = detectAnomalies;
const monitorPermissionChanges = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    const originalPermissions = req.user.permissions || [];
    const originalRole = req.user.role;
    const originalJson = res.json;
    res.json = function (body) {
        if (req.originalUrl.includes('role') ||
            req.originalUrl.includes('permission') ||
            req.method === 'PUT' || req.method === 'PATCH') {
            setImmediate(async () => {
                try {
                    await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent(req, 'permission_change', {
                        originalPermissions,
                        originalRole,
                        statusCode: res.statusCode,
                        responseBody: body,
                    });
                }
                catch (error) {
                    logger_1.default.error('Error monitoring permission change', {
                        error: error?.message || 'Unknown error',
                        userId: req.user?._id,
                        service: 'security-monitoring',
                    });
                }
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.monitorPermissionChanges = monitorPermissionChanges;
const monitorDataAccess = (resourceType) => {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        let accessType = 'read';
        switch (req.method) {
            case 'POST':
                accessType = 'create';
                break;
            case 'PUT':
            case 'PATCH':
                accessType = 'update';
                break;
            case 'DELETE':
                accessType = 'delete';
                break;
            default:
                accessType = 'read';
        }
        res.on('finish', () => {
            setImmediate(async () => {
                try {
                    await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent(req, 'data_access', {
                        resourceType,
                        accessType,
                        resourceId: req.params.id,
                        statusCode: res.statusCode,
                        successful: res.statusCode < 400,
                    });
                }
                catch (error) {
                    logger_1.default.error('Error monitoring data access', {
                        error: error?.message || 'Unknown error',
                        userId: req.user?._id,
                        resourceType,
                        accessType,
                        service: 'security-monitoring',
                    });
                }
            });
        });
        next();
    };
};
exports.monitorDataAccess = monitorDataAccess;
exports.default = {
    blockSuspiciousIPs: exports.blockSuspiciousIPs,
    monitorSuspiciousUsers: exports.monitorSuspiciousUsers,
    validateSession: exports.validateSession,
    monitorSecurityEvents: exports.monitorSecurityEvents,
    adaptiveRateLimit: exports.adaptiveRateLimit,
    detectAnomalies: exports.detectAnomalies,
    monitorPermissionChanges: exports.monitorPermissionChanges,
    monitorDataAccess: exports.monitorDataAccess,
};
//# sourceMappingURL=securityMonitoring.js.map