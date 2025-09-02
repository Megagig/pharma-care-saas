"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abuseDetection = exports.generalRateLimiters = exports.subscriptionRateLimiters = exports.invitationRateLimiters = exports.createUserRateLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const userRateLimitStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userRateLimitStore.entries()) {
        if (now > value.resetTime) {
            userRateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
const createRateLimiter = (options) => {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: options.message || 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        keyGenerator: options.keyGenerator,
        skip: (req) => {
            if (options.bypassSuperAdmin && req.user?.role === 'super_admin') {
                return true;
            }
            return false;
        },
    });
    return limiter;
};
exports.createRateLimiter = createRateLimiter;
const createUserRateLimiter = (options) => {
    return (req, res, next) => {
        if (options.bypassSuperAdmin && req.user?.role === 'super_admin') {
            return next();
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'Authentication required for rate limiting',
            });
        }
        const userId = req.user._id.toString();
        const now = Date.now();
        const windowStart = now - options.windowMs;
        let userLimit = userRateLimitStore.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            userLimit = {
                count: 0,
                resetTime: now + options.windowMs,
            };
            userRateLimitStore.set(userId, userLimit);
        }
        if (userLimit.count >= options.max) {
            const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
            res.set('Retry-After', retryAfter.toString());
            res.set('X-RateLimit-Limit', options.max.toString());
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
            return res.status(429).json({
                success: false,
                code: 'USER_RATE_LIMIT_EXCEEDED',
                message: options.message || 'Too many requests from this user. Please try again later.',
                retryAfter,
            });
        }
        userLimit.count++;
        userRateLimitStore.set(userId, userLimit);
        res.set('X-RateLimit-Limit', options.max.toString());
        res.set('X-RateLimit-Remaining', (options.max - userLimit.count).toString());
        res.set('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
        next();
    };
};
exports.createUserRateLimiter = createUserRateLimiter;
exports.invitationRateLimiters = {
    createInvitation: (0, exports.createRateLimiter)({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many invitation creation requests from this IP. Please try again later.',
        bypassSuperAdmin: true,
        keyGenerator: (req) => {
            return req.ip || req.connection.remoteAddress || 'unknown';
        },
    }),
    createInvitationUser: (0, exports.createUserRateLimiter)({
        windowMs: 60 * 60 * 1000,
        max: 20,
        message: 'Too many invitations created. Please wait before creating more invitations.',
        bypassSuperAdmin: true,
    }),
    validateInvitation: (0, exports.createRateLimiter)({
        windowMs: 5 * 60 * 1000,
        max: 50,
        message: 'Too many invitation validation requests. Please try again later.',
        bypassSuperAdmin: false,
    }),
    acceptInvitation: (0, exports.createRateLimiter)({
        windowMs: 10 * 60 * 1000,
        max: 5,
        message: 'Too many invitation acceptance attempts. Please try again later.',
        bypassSuperAdmin: false,
    }),
};
exports.subscriptionRateLimiters = {
    subscriptionChange: (0, exports.createRateLimiter)({
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: 'Too many subscription change requests. Please try again later.',
        bypassSuperAdmin: true,
    }),
    subscriptionChangeUser: (0, exports.createUserRateLimiter)({
        windowMs: 24 * 60 * 60 * 1000,
        max: 3,
        message: 'Too many subscription changes today. Please contact support if you need assistance.',
        bypassSuperAdmin: true,
    }),
    paymentAttempt: (0, exports.createRateLimiter)({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many payment attempts. Please try again later.',
        bypassSuperAdmin: true,
    }),
};
exports.generalRateLimiters = {
    api: (0, exports.createRateLimiter)({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Too many API requests. Please try again later.',
        bypassSuperAdmin: true,
        skipSuccessfulRequests: true,
    }),
    sensitive: (0, exports.createRateLimiter)({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: 'Too many sensitive operation requests. Please try again later.',
        bypassSuperAdmin: true,
    }),
    auth: (0, exports.createRateLimiter)({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: 'Too many authentication attempts. Please try again later.',
        bypassSuperAdmin: false,
        skipSuccessfulRequests: true,
    }),
};
exports.abuseDetection = {
    invitationSpam: (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const userId = req.user._id.toString();
        const now = Date.now();
        const key = `invitation_spam_${userId}`;
        let spamData = userRateLimitStore.get(key);
        if (!spamData || now > spamData.resetTime) {
            spamData = {
                count: 0,
                resetTime: now + (5 * 60 * 1000),
            };
        }
        spamData.count++;
        userRateLimitStore.set(key, spamData);
        if (spamData.count > 5) {
            console.warn(`Potential invitation spam detected for user ${userId}:`, {
                userId,
                count: spamData.count,
                timeWindow: '5 minutes',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
        }
        next();
    },
    suspiciousLogin: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        next();
    },
};
exports.default = {
    createRateLimiter: exports.createRateLimiter,
    createUserRateLimiter: exports.createUserRateLimiter,
    invitationRateLimiters: exports.invitationRateLimiters,
    subscriptionRateLimiters: exports.subscriptionRateLimiters,
    generalRateLimiters: exports.generalRateLimiters,
    abuseDetection: exports.abuseDetection,
};
//# sourceMappingURL=rateLimiting.js.map