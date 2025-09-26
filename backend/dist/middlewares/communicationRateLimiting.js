"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spamDetection = exports.adaptiveCommunicationRateLimit = exports.burstProtection = exports.createAdvancedUserRateLimit = exports.searchRateLimit = exports.fileUploadRateLimit = exports.conversationRateLimit = exports.messageRateLimit = exports.createCommunicationRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("../utils/logger"));
const communicationRateLimitStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of communicationRateLimitStore.entries()) {
        if (now > value.resetTime) {
            communicationRateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
const createCommunicationRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: (req) => {
            if (req.user?.role === 'super_admin') {
                return 10000;
            }
            const userRole = req.user?.role || 'default';
            return (options.limits[userRole] ||
                options.limits.default);
        },
        message: {
            success: false,
            code: 'COMMUNICATION_RATE_LIMIT_EXCEEDED',
            message: options.message ||
                'Too many communication requests. Please try again later.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        keyGenerator: options.keyGenerator ||
            ((req) => {
                return req.user?._id?.toString() || req.ip || 'anonymous';
            }),
        skip: (req) => {
            return req.user?.role === 'super_admin';
        },
        handler: (req, res) => {
            logger_1.default.warn('Communication rate limit exceeded', {
                userId: req.user?._id,
                userRole: req.user?.role,
                ip: req.ip,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                service: 'communication-rate-limiting',
            });
            return res.status(429).json({
                success: false,
                code: 'COMMUNICATION_RATE_LIMIT_EXCEEDED',
                message: options.message ||
                    'Too many communication requests. Please try again later.',
                retryAfter: Math.ceil(options.windowMs / 1000),
            });
        },
    });
};
exports.createCommunicationRateLimiter = createCommunicationRateLimiter;
exports.messageRateLimit = (0, exports.createCommunicationRateLimiter)({
    windowMs: 60 * 1000,
    limits: {
        pharmacist: 100,
        doctor: 100,
        patient: 30,
        pharmacy_team: 60,
        intern_pharmacist: 60,
        default: 20,
    },
    message: 'Too many messages sent. Please slow down to maintain conversation quality.',
    skipSuccessfulRequests: false,
});
exports.conversationRateLimit = (0, exports.createCommunicationRateLimiter)({
    windowMs: 15 * 60 * 1000,
    limits: {
        pharmacist: 20,
        doctor: 20,
        patient: 5,
        pharmacy_team: 10,
        intern_pharmacist: 10,
        default: 3,
    },
    message: 'Too many conversations created. Please wait before creating more.',
});
exports.fileUploadRateLimit = (0, exports.createCommunicationRateLimiter)({
    windowMs: 10 * 60 * 1000,
    limits: {
        pharmacist: 50,
        doctor: 50,
        patient: 20,
        pharmacy_team: 30,
        intern_pharmacist: 30,
        default: 10,
    },
    message: 'Too many files uploaded. Please wait before uploading more files.',
});
exports.searchRateLimit = (0, exports.createCommunicationRateLimiter)({
    windowMs: 5 * 60 * 1000,
    limits: {
        pharmacist: 100,
        doctor: 100,
        patient: 30,
        pharmacy_team: 60,
        intern_pharmacist: 60,
        default: 20,
    },
    message: 'Too many search requests. Please wait before searching again.',
});
const createAdvancedUserRateLimit = (options) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required for rate limiting',
            });
        }
        if (req.user?.role === 'super_admin') {
            return next();
        }
        const userId = req.user._id.toString();
        const now = Date.now();
        let userActivity = communicationRateLimitStore.get(userId);
        if (!userActivity || now > userActivity.resetTime) {
            userActivity = {
                count: 0,
                resetTime: now + options.windowMs,
                messageCount: 0,
                conversationCount: 0,
                fileUploadCount: 0,
            };
            communicationRateLimitStore.set(userId, userActivity);
        }
        let exceeded = false;
        let limitType = '';
        let currentCount = 0;
        let maxCount = 0;
        switch (options.activityType) {
            case 'message':
                currentCount = userActivity.messageCount;
                maxCount = options.maxMessages;
                limitType = 'message';
                if (currentCount >= maxCount)
                    exceeded = true;
                else
                    userActivity.messageCount++;
                break;
            case 'conversation':
                currentCount = userActivity.conversationCount;
                maxCount = options.maxConversations;
                limitType = 'conversation';
                if (currentCount >= maxCount)
                    exceeded = true;
                else
                    userActivity.conversationCount++;
                break;
            case 'file_upload':
                currentCount = userActivity.fileUploadCount;
                maxCount = options.maxFileUploads;
                limitType = 'file upload';
                if (currentCount >= maxCount)
                    exceeded = true;
                else
                    userActivity.fileUploadCount++;
                break;
        }
        if (exceeded) {
            const retryAfter = Math.ceil((userActivity.resetTime - now) / 1000);
            logger_1.default.warn(`User ${limitType} rate limit exceeded`, {
                userId,
                userRole: req.user.role,
                activityType: options.activityType,
                currentCount,
                maxCount,
                retryAfter,
                service: 'communication-rate-limiting',
            });
            res.set('Retry-After', retryAfter.toString());
            res.set('X-RateLimit-Limit', maxCount.toString());
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', new Date(userActivity.resetTime).toISOString());
            return res.status(429).json({
                success: false,
                code: `USER_${limitType
                    .toUpperCase()
                    .replace(' ', '_')}_RATE_LIMIT_EXCEEDED`,
                message: `Too many ${limitType}s. Please wait ${retryAfter} seconds before trying again.`,
                retryAfter,
                currentCount,
                maxCount,
            });
        }
        communicationRateLimitStore.set(userId, userActivity);
        res.set('X-RateLimit-Limit', maxCount.toString());
        res.set('X-RateLimit-Remaining', (maxCount - currentCount - 1).toString());
        res.set('X-RateLimit-Reset', new Date(userActivity.resetTime).toISOString());
        next();
    };
};
exports.createAdvancedUserRateLimit = createAdvancedUserRateLimit;
const burstProtection = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    if (req.user?.role === 'super_admin') {
        return next();
    }
    const userId = req.user._id.toString();
    const now = Date.now();
    const burstKey = `burst_${userId}`;
    const userBurstData = communicationRateLimitStore.get(burstKey) || {
        count: 0,
        resetTime: now + 10000,
        messageCount: 0,
        conversationCount: 0,
        fileUploadCount: 0,
    };
    if (now > userBurstData.resetTime) {
        userBurstData.count = 0;
        userBurstData.resetTime = now + 10000;
    }
    userBurstData.count++;
    const burstLimit = req.user?.role === 'pharmacy_outlet' ? 3 : 5;
    if (userBurstData.count > burstLimit) {
        logger_1.default.warn('Message burst detected', {
            userId,
            userRole: req.user.role,
            burstCount: userBurstData.count,
            burstLimit,
            service: 'communication-rate-limiting',
        });
        communicationRateLimitStore.set(burstKey, userBurstData);
        return res.status(429).json({
            success: false,
            code: 'MESSAGE_BURST_DETECTED',
            message: 'Please slow down. You are sending messages too quickly.',
            retryAfter: Math.ceil((userBurstData.resetTime - now) / 1000),
        });
    }
    communicationRateLimitStore.set(burstKey, userBurstData);
    next();
};
exports.burstProtection = burstProtection;
const adaptiveCommunicationRateLimit = (baseLimit) => {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const userId = req.user._id.toString();
        const userActivity = communicationRateLimitStore.get(userId);
        if (userActivity) {
            const totalActivity = userActivity.messageCount +
                userActivity.conversationCount +
                userActivity.fileUploadCount;
            if (totalActivity > baseLimit * 0.8) {
                const adjustedLimit = Math.max(1, Math.floor(baseLimit * 0.5));
                req.adaptiveRateLimit = adjustedLimit;
                logger_1.default.info('Adaptive rate limit applied', {
                    userId,
                    userRole: req.user.role,
                    totalActivity,
                    baseLimit,
                    adjustedLimit,
                    service: 'communication-rate-limiting',
                });
            }
        }
        next();
    };
};
exports.adaptiveCommunicationRateLimit = adaptiveCommunicationRateLimit;
const spamDetection = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    if (req.user.role === 'super_admin') {
        return next();
    }
    const content = req.body.content?.text || req.body.message || '';
    const userId = req.user._id.toString();
    const spamPatterns = [
        /(.)\1{10,}/,
        /^[A-Z\s!]{20,}$/,
        /(https?:\/\/[^\s]+){3,}/,
        /(\b\w+\b.*?){1,}\1{5,}/,
    ];
    const isSpam = spamPatterns.some((pattern) => pattern.test(content));
    if (isSpam) {
        logger_1.default.warn('Potential spam message detected', {
            userId,
            userRole: req.user.role,
            contentLength: content.length,
            content: content.substring(0, 100),
            service: 'communication-rate-limiting',
        });
        req.potentialSpam = true;
    }
    next();
};
exports.spamDetection = spamDetection;
exports.default = {
    createCommunicationRateLimiter: exports.createCommunicationRateLimiter,
    messageRateLimit: exports.messageRateLimit,
    conversationRateLimit: exports.conversationRateLimit,
    fileUploadRateLimit: exports.fileUploadRateLimit,
    searchRateLimit: exports.searchRateLimit,
    createAdvancedUserRateLimit: exports.createAdvancedUserRateLimit,
    burstProtection: exports.burstProtection,
    adaptiveCommunicationRateLimit: exports.adaptiveCommunicationRateLimit,
    spamDetection: exports.spamDetection,
};
//# sourceMappingURL=communicationRateLimiting.js.map