"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceConcurrentSessionLimit = exports.sessionManagementEndpoints = exports.getUserActiveSessions = exports.terminateAllUserSessions = exports.terminateSession = exports.validateSession = exports.validateUserSession = exports.createUserSession = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
const activeSessionsStore = new Map();
const sessionSecurityStore = new Map();
const SESSION_CONFIG = {
    maxConcurrentSessions: 5,
    sessionTimeout: 24 * 60 * 60 * 1000,
    inactivityTimeout: 2 * 60 * 60 * 1000,
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    deviceFingerprintRequired: true,
};
setInterval(() => {
    const now = Date.now();
    for (const [userId, sessions] of activeSessionsStore.entries()) {
        const activeSessions = {};
        let hasActiveSessions = false;
        for (const [sessionId, session] of Object.entries(sessions)) {
            const isExpired = now - session.lastActivity > SESSION_CONFIG.sessionTimeout;
            const isInactive = now - session.lastActivity > SESSION_CONFIG.inactivityTimeout;
            if (!isExpired && !isInactive && session.isActive) {
                activeSessions[sessionId] = session;
                hasActiveSessions = true;
            }
            else {
                logger_1.default.info('Session expired/inactive', {
                    userId,
                    sessionId,
                    reason: isExpired ? 'expired' : 'inactive',
                    lastActivity: new Date(session.lastActivity).toISOString(),
                    service: 'communication-session',
                });
            }
        }
        if (hasActiveSessions) {
            activeSessionsStore.set(userId, activeSessions);
        }
        else {
            activeSessionsStore.delete(userId);
        }
    }
    for (const [userId, security] of sessionSecurityStore.entries()) {
        if (security.lockExpires && now > security.lockExpires) {
            sessionSecurityStore.delete(userId);
        }
    }
}, 10 * 60 * 1000);
const generateDeviceFingerprint = (req) => {
    const components = [
        req.get('User-Agent') || '',
        req.get('Accept-Language') || '',
        req.get('Accept-Encoding') || '',
        req.connection.remoteAddress || req.ip || '',
    ];
    return crypto_1.default
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex')
        .substring(0, 16);
};
const createUserSession = (userId, sessionId, req) => {
    const now = Date.now();
    const deviceFingerprint = generateDeviceFingerprint(req);
    const sessionData = {
        userId,
        sessionId,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        createdAt: now,
        lastActivity: now,
        isActive: true,
        deviceFingerprint,
    };
    const userSessions = activeSessionsStore.get(userId) || {};
    const activeSessions = Object.values(userSessions).filter((s) => s.isActive);
    if (activeSessions.length >= SESSION_CONFIG.maxConcurrentSessions) {
        const oldestSession = activeSessions.reduce((oldest, current) => current.lastActivity < oldest.lastActivity ? current : oldest);
        logger_1.default.info('Removing oldest session due to limit', {
            userId,
            removedSessionId: oldestSession.sessionId,
            newSessionId: sessionId,
            service: 'communication-session',
        });
        delete userSessions[oldestSession.sessionId];
    }
    userSessions[sessionId] = sessionData;
    activeSessionsStore.set(userId, userSessions);
    logger_1.default.info('New session created', {
        userId,
        sessionId,
        deviceFingerprint,
        ipAddress: sessionData.ipAddress,
        service: 'communication-session',
    });
    return sessionData;
};
exports.createUserSession = createUserSession;
const validateUserSession = (userId, sessionId, req) => {
    const userSessions = activeSessionsStore.get(userId);
    if (!userSessions) {
        return { isValid: false, reason: 'no_sessions' };
    }
    const session = userSessions[sessionId];
    if (!session) {
        return { isValid: false, reason: 'session_not_found' };
    }
    if (!session.isActive) {
        return { isValid: false, reason: 'session_inactive' };
    }
    const now = Date.now();
    if (now - session.createdAt > SESSION_CONFIG.sessionTimeout) {
        session.isActive = false;
        return { isValid: false, reason: 'session_expired' };
    }
    if (now - session.lastActivity > SESSION_CONFIG.inactivityTimeout) {
        session.isActive = false;
        return { isValid: false, reason: 'session_inactive_timeout' };
    }
    if (SESSION_CONFIG.deviceFingerprintRequired) {
        const currentFingerprint = generateDeviceFingerprint(req);
        if (session.deviceFingerprint !== currentFingerprint) {
            logger_1.default.warn('Device fingerprint mismatch', {
                userId,
                sessionId,
                expected: session.deviceFingerprint,
                actual: currentFingerprint,
                service: 'communication-session',
            });
            return { isValid: false, reason: 'device_mismatch' };
        }
    }
    const currentIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (session.ipAddress !== currentIP) {
        logger_1.default.warn('IP address changed', {
            userId,
            sessionId,
            originalIP: session.ipAddress,
            currentIP,
            service: 'communication-session',
        });
    }
    session.lastActivity = now;
    userSessions[sessionId] = session;
    activeSessionsStore.set(userId, userSessions);
    return { isValid: true, session };
};
exports.validateUserSession = validateUserSession;
const validateSession = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }
        const sessionId = req.sessionID || req.headers['x-session-id'];
        if (!sessionId) {
            res.status(401).json({
                success: false,
                code: 'SESSION_ID_MISSING',
                message: 'Session ID is required',
            });
            return;
        }
        const security = sessionSecurityStore.get(req.user?._id?.toString() || '');
        if (security?.isLocked &&
            security.lockExpires &&
            Date.now() < security.lockExpires) {
            res.status(423).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                message: 'Account temporarily locked due to security concerns',
                lockExpires: new Date(security.lockExpires).toISOString(),
            });
            return;
        }
        const validation = (0, exports.validateUserSession)(req.user._id.toString(), sessionId, req);
        if (!validation.isValid) {
            const userId = req.user._id.toString();
            const userSecurity = sessionSecurityStore.get(userId) || {
                failedAttempts: 0,
                lastFailedAttempt: 0,
                isLocked: false,
            };
            userSecurity.failedAttempts++;
            userSecurity.lastFailedAttempt = Date.now();
            if (userSecurity.failedAttempts >= SESSION_CONFIG.maxFailedAttempts) {
                userSecurity.isLocked = true;
                userSecurity.lockExpires = Date.now() + SESSION_CONFIG.lockoutDuration;
                logger_1.default.warn('User account locked due to failed session validations', {
                    userId,
                    failedAttempts: userSecurity.failedAttempts,
                    lockExpires: new Date(userSecurity.lockExpires).toISOString(),
                    service: 'communication-session',
                });
            }
            sessionSecurityStore.set(userId, userSecurity);
            res.status(401).json({
                success: false,
                code: 'SESSION_INVALID',
                message: 'Session is invalid or expired',
                reason: validation.reason,
                requiresReauth: true,
            });
            return;
        }
        const userId = req.user._id.toString();
        if (sessionSecurityStore.has(userId)) {
            sessionSecurityStore.delete(userId);
        }
        req.sessionData = validation.session;
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating session:', error);
        res.status(500).json({
            success: false,
            message: 'Session validation failed',
        });
    }
};
exports.validateSession = validateSession;
const terminateSession = (userId, sessionId) => {
    const userSessions = activeSessionsStore.get(userId);
    if (!userSessions || !userSessions[sessionId]) {
        return false;
    }
    userSessions[sessionId].isActive = false;
    delete userSessions[sessionId];
    if (Object.keys(userSessions).length === 0) {
        activeSessionsStore.delete(userId);
    }
    else {
        activeSessionsStore.set(userId, userSessions);
    }
    logger_1.default.info('Session terminated', {
        userId,
        sessionId,
        service: 'communication-session',
    });
    return true;
};
exports.terminateSession = terminateSession;
const terminateAllUserSessions = (userId) => {
    const userSessions = activeSessionsStore.get(userId);
    if (!userSessions) {
        return 0;
    }
    const sessionCount = Object.keys(userSessions).length;
    activeSessionsStore.delete(userId);
    logger_1.default.info('All user sessions terminated', {
        userId,
        sessionCount,
        service: 'communication-session',
    });
    return sessionCount;
};
exports.terminateAllUserSessions = terminateAllUserSessions;
const getUserActiveSessions = (userId) => {
    const userSessions = activeSessionsStore.get(userId);
    if (!userSessions) {
        return [];
    }
    return Object.values(userSessions).filter((session) => session.isActive);
};
exports.getUserActiveSessions = getUserActiveSessions;
exports.sessionManagementEndpoints = {
    getSessions: (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const sessions = (0, exports.getUserActiveSessions)(req.user?._id?.toString() || '');
            const currentSessionId = req.sessionID;
            const sessionInfo = sessions.map((session) => ({
                sessionId: session.sessionId,
                createdAt: new Date(session.createdAt).toISOString(),
                lastActivity: new Date(session.lastActivity).toISOString(),
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                isCurrent: session.sessionId === currentSessionId,
                location: session.location,
            }));
            res.json({
                success: true,
                data: sessionInfo,
                totalSessions: sessions.length,
                maxAllowed: SESSION_CONFIG.maxConcurrentSessions,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting user sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sessions',
            });
        }
    },
    terminateSession: (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const { sessionId } = req.params;
            const currentSessionId = req.sessionID;
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required',
                });
                return;
            }
            if (sessionId === currentSessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot terminate current session',
                });
                return;
            }
            const terminated = (0, exports.terminateSession)(req.user._id.toString(), sessionId);
            if (!terminated) {
                res.status(404).json({
                    success: false,
                    message: 'Session not found',
                });
                return;
            }
            res.json({
                success: true,
                message: 'Session terminated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error terminating session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to terminate session',
            });
        }
    },
    terminateAllOtherSessions: (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const userId = req.user._id.toString();
            const currentSessionId = req.sessionID;
            const userSessions = activeSessionsStore.get(userId);
            if (!userSessions) {
                res.json({
                    success: true,
                    message: 'No other sessions to terminate',
                    terminatedCount: 0,
                });
                return;
            }
            let terminatedCount = 0;
            const remainingSessions = {};
            for (const [sessionId, session] of Object.entries(userSessions)) {
                if (sessionId === currentSessionId) {
                    remainingSessions[sessionId] = session;
                }
                else {
                    terminatedCount++;
                }
            }
            activeSessionsStore.set(userId, remainingSessions);
            logger_1.default.info('All other sessions terminated', {
                userId,
                terminatedCount,
                service: 'communication-session',
            });
            res.json({
                success: true,
                message: `${terminatedCount} sessions terminated successfully`,
                terminatedCount,
            });
        }
        catch (error) {
            logger_1.default.error('Error terminating all other sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to terminate sessions',
            });
        }
    },
};
const enforceConcurrentSessionLimit = (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }
        const userId = req.user._id.toString();
        const sessions = (0, exports.getUserActiveSessions)(userId);
        if (sessions.length >= SESSION_CONFIG.maxConcurrentSessions) {
            res.status(429).json({
                success: false,
                code: 'TOO_MANY_SESSIONS',
                message: 'Maximum concurrent sessions exceeded',
                maxAllowed: SESSION_CONFIG.maxConcurrentSessions,
                currentSessions: sessions.length,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error enforcing session limit:', error);
        next();
    }
};
exports.enforceConcurrentSessionLimit = enforceConcurrentSessionLimit;
exports.default = {
    createUserSession: exports.createUserSession,
    validateUserSession: exports.validateUserSession,
    validateSession: exports.validateSession,
    terminateSession: exports.terminateSession,
    terminateAllUserSessions: exports.terminateAllUserSessions,
    getUserActiveSessions: exports.getUserActiveSessions,
    sessionManagementEndpoints: exports.sessionManagementEndpoints,
    enforceConcurrentSessionLimit: exports.enforceConcurrentSessionLimit,
};
//# sourceMappingURL=communicationSessionManagement.js.map