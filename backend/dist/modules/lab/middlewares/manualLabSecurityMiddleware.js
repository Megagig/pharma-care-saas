"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSecurityHeaders = exports.detectSuspiciousActivity = exports.generateCSRFToken = exports.csrfProtection = exports.validatePDFAccess = exports.validatePDFToken = exports.generateSecurePDFToken = exports.sanitizeInput = exports.enhancedPDFAccessRateLimit = exports.enhancedOrderCreationRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const xss_1 = __importDefault(require("xss"));
const securityMetrics = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of securityMetrics.entries()) {
        if (now > value.resetTime) {
            securityMetrics.delete(key);
        }
    }
}, 10 * 60 * 1000);
exports.enhancedOrderCreationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        if (req.user?.role === 'owner')
            return 20;
        if (req.user?.role === 'pharmacist')
            return 15;
        const userId = req.user?._id?.toString();
        if (userId) {
            const metrics = securityMetrics.get(userId);
            if (metrics?.suspiciousActivity) {
                return 5;
            }
        }
        return 10;
    },
    message: (req) => ({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many order creation attempts. Please try again later.',
        retryAfter: Math.ceil(15 * 60),
        userId: req.user?._id
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?._id?.toString() || req.ip || 'anonymous';
    },
    skip: (req) => {
        return false;
    },
    handler: (req, res) => {
        const userId = req.user?._id?.toString();
        if (userId) {
            updateSecurityMetrics(userId, 'orderCreationLimit');
        }
        logger_1.default.warn('Order creation rate limit exceeded', {
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            service: 'manual-lab-security'
        });
        res.status(429).json({
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many order creation attempts. Please try again later.',
            retryAfter: Math.ceil(15 * 60),
            userId: req.user?._id
        });
    }
});
exports.enhancedPDFAccessRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: (req) => {
        const userId = req.user?._id?.toString();
        if (userId) {
            const metrics = securityMetrics.get(userId);
            if (metrics?.suspiciousActivity) {
                return 10;
            }
        }
        return 30;
    },
    message: {
        success: false,
        code: 'PDF_ACCESS_RATE_LIMIT_EXCEEDED',
        message: 'Too many PDF access attempts. Please try again later.',
        retryAfter: Math.ceil(5 * 60)
    },
    keyGenerator: (req) => {
        return req.user?._id?.toString() || req.ip || 'anonymous';
    },
    handler: (req, res) => {
        const userId = req.user?._id?.toString();
        if (userId) {
            updateSecurityMetrics(userId, 'pdfAccessLimit');
        }
        logger_1.default.warn('PDF access rate limit exceeded', {
            userId,
            orderId: req.params.orderId,
            ip: req.ip,
            service: 'manual-lab-security'
        });
        res.status(429).json({
            success: false,
            code: 'PDF_ACCESS_RATE_LIMIT_EXCEEDED',
            message: 'Too many PDF access attempts. Please try again later.',
            retryAfter: Math.ceil(5 * 60)
        });
    }
});
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Input sanitization failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: req.originalUrl,
            service: 'manual-lab-security'
        });
        res.status(400).json({
            success: false,
            code: 'INPUT_SANITIZATION_ERROR',
            message: 'Invalid input detected'
        });
    }
};
exports.sanitizeInput = sanitizeInput;
const generateSecurePDFToken = (orderId, userId, expiresIn = 3600) => {
    const payload = {
        orderId,
        userId,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        iat: Math.floor(Date.now() / 1000),
        type: 'pdf_access'
    };
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto_1.default.createHmac('sha256', secret).update(token).digest('hex');
    return `${token}.${signature}`;
};
exports.generateSecurePDFToken = generateSecurePDFToken;
const validatePDFToken = (token) => {
    try {
        const [tokenPart, signature] = token.split('.');
        if (!tokenPart || !signature) {
            return { valid: false, error: 'Invalid token format' };
        }
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(tokenPart).digest('hex');
        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid token signature' };
        }
        const payload = JSON.parse(Buffer.from(tokenPart, 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && now > payload.exp) {
            return { valid: false, error: 'Token expired' };
        }
        if (payload.type !== 'pdf_access') {
            return { valid: false, error: 'Invalid token type' };
        }
        return { valid: true, payload };
    }
    catch (error) {
        return { valid: false, error: 'Token validation failed' };
    }
};
exports.validatePDFToken = validatePDFToken;
const validatePDFAccess = (req, res, next) => {
    const token = req.query.token || req.headers['x-pdf-token'];
    if (!token) {
        return res.status(401).json({
            success: false,
            code: 'PDF_TOKEN_REQUIRED',
            message: 'PDF access token is required'
        });
    }
    const validation = (0, exports.validatePDFToken)(token);
    if (!validation.valid) {
        logger_1.default.warn('Invalid PDF access token', {
            error: validation.error,
            userId: req.user?._id,
            orderId: req.params.orderId,
            ip: req.ip,
            service: 'manual-lab-security'
        });
        return res.status(401).json({
            success: false,
            code: 'INVALID_PDF_TOKEN',
            message: validation.error || 'Invalid PDF access token'
        });
    }
    if (validation.payload.userId !== req.user?._id?.toString()) {
        return res.status(403).json({
            success: false,
            code: 'PDF_TOKEN_USER_MISMATCH',
            message: 'PDF token does not match requesting user'
        });
    }
    if (validation.payload.orderId !== req.params.orderId?.toUpperCase()) {
        return res.status(403).json({
            success: false,
            code: 'PDF_TOKEN_ORDER_MISMATCH',
            message: 'PDF token does not match requested order'
        });
    }
    req.pdfToken = validation.payload;
    next();
    return;
};
exports.validatePDFAccess = validatePDFAccess;
const csrfProtection = (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        logger_1.default.warn('CSRF token validation failed', {
            userId: req.user?._id,
            method: req.method,
            url: req.originalUrl,
            hasToken: !!csrfToken,
            hasSessionToken: !!sessionToken,
            service: 'manual-lab-security'
        });
        return res.status(403).json({
            success: false,
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed'
        });
    }
    next();
};
exports.csrfProtection = csrfProtection;
const generateCSRFToken = (req, res, next) => {
    if (!req.session) {
        return next();
    }
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto_1.default.randomBytes(32).toString('hex');
    }
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
    next();
};
exports.generateCSRFToken = generateCSRFToken;
const detectSuspiciousActivity = (req, res, next) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        return next();
    }
    const now = Date.now();
    const metrics = getOrCreateSecurityMetrics(userId);
    if (metrics.lastActivity && (now - metrics.lastActivity) < 500) {
        metrics.suspiciousActivity = true;
        logger_1.default.warn('Rapid requests detected', {
            userId,
            timeDiff: now - metrics.lastActivity,
            url: req.originalUrl,
            service: 'manual-lab-security'
        });
    }
    const userAgent = req.get('User-Agent') || '';
    if (userAgent.toLowerCase().includes('bot') ||
        userAgent.toLowerCase().includes('crawler') ||
        userAgent.toLowerCase().includes('script')) {
        metrics.suspiciousActivity = true;
        logger_1.default.warn('Bot-like user agent detected', {
            userId,
            userAgent,
            service: 'manual-lab-security'
        });
    }
    metrics.lastActivity = now;
    securityMetrics.set(userId, metrics);
    if (metrics.suspiciousActivity && metrics.failedAttempts > 5) {
        return res.status(429).json({
            success: false,
            code: 'SUSPICIOUS_ACTIVITY_BLOCKED',
            message: 'Account temporarily blocked due to suspicious activity'
        });
    }
    next();
};
exports.detectSuspiciousActivity = detectSuspiciousActivity;
const setSecurityHeaders = (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (req.originalUrl.includes('/pdf')) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; object-src 'none'; frame-ancestors 'none';");
        res.setHeader('X-Download-Options', 'noopen');
    }
    next();
};
exports.setSecurityHeaders = setSecurityHeaders;
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? (0, xss_1.default)(obj) : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const cleanKey = (0, xss_1.default)(key);
        sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
}
function getOrCreateSecurityMetrics(userId) {
    let metrics = securityMetrics.get(userId);
    if (!metrics) {
        const now = Date.now();
        metrics = {
            pdfAccessCount: 0,
            orderCreationCount: 0,
            failedAttempts: 0,
            lastActivity: now,
            suspiciousActivity: false,
            resetTime: now + (60 * 60 * 1000)
        };
        securityMetrics.set(userId, metrics);
    }
    return metrics;
}
function updateSecurityMetrics(userId, event) {
    const metrics = getOrCreateSecurityMetrics(userId);
    switch (event) {
        case 'orderCreationLimit':
            metrics.orderCreationCount++;
            metrics.failedAttempts++;
            break;
        case 'pdfAccessLimit':
            metrics.pdfAccessCount++;
            metrics.failedAttempts++;
            break;
        case 'suspiciousActivity':
            metrics.suspiciousActivity = true;
            metrics.failedAttempts++;
            break;
    }
    if (metrics.failedAttempts > 3) {
        metrics.suspiciousActivity = true;
    }
    securityMetrics.set(userId, metrics);
}
exports.default = {
    enhancedOrderCreationRateLimit: exports.enhancedOrderCreationRateLimit,
    enhancedPDFAccessRateLimit: exports.enhancedPDFAccessRateLimit,
    sanitizeInput: exports.sanitizeInput,
    generateSecurePDFToken: exports.generateSecurePDFToken,
    validatePDFToken: exports.validatePDFToken,
    validatePDFAccess: exports.validatePDFAccess,
    csrfProtection: exports.csrfProtection,
    generateCSRFToken: exports.generateCSRFToken,
    detectSuspiciousActivity: exports.detectSuspiciousActivity,
    setSecurityHeaders: exports.setSecurityHeaders
};
//# sourceMappingURL=manualLabSecurityMiddleware.js.map