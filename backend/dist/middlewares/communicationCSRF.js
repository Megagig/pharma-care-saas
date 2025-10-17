"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lightweightCSRFProtection = exports.comprehensiveCSRFProtection = exports.enforceSameSite = exports.validateOrigin = exports.setCSRFCookie = exports.doubleSubmitCSRF = exports.provideCSRFToken = exports.requireCSRFToken = exports.validateCSRFToken = exports.generateCSRFToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
const csrfTokenStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of csrfTokenStore.entries()) {
        if (now > value.expires) {
            csrfTokenStore.delete(key);
        }
    }
}, 10 * 60 * 1000);
const generateCSRFToken = (userId, sessionId) => {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const key = `${userId}_${sessionId || "default"}`;
    csrfTokenStore.set(key, {
        token,
        expires: Date.now() + 60 * 60 * 1000,
        userId,
    });
    return token;
};
exports.generateCSRFToken = generateCSRFToken;
const validateCSRFToken = (userId, token, sessionId) => {
    const key = `${userId}_${sessionId || "default"}`;
    const storedData = csrfTokenStore.get(key);
    if (!storedData) {
        return false;
    }
    if (Date.now() > storedData.expires) {
        csrfTokenStore.delete(key);
        return false;
    }
    return storedData.token === token && storedData.userId === userId;
};
exports.validateCSRFToken = validateCSRFToken;
const requireCSRFToken = (req, res, next) => {
    try {
        if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            return next();
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (req.user.role === 'super_admin' || req.isAdmin === true) {
            logger_1.default.info("CSRF validation skipped for super admin", {
                userId: req.user._id,
                method: req.method,
                url: req.originalUrl,
                service: "communication-csrf",
            });
            return next();
        }
        const csrfToken = req.headers["x-csrf-token"] ||
            req.headers["csrf-token"] ||
            req.body._csrf ||
            req.query._csrf;
        if (!csrfToken) {
            logger_1.default.warn("CSRF token missing", {
                userId: req.user._id,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                service: "communication-csrf",
            });
            res.status(403).json({
                success: false,
                code: "CSRF_TOKEN_MISSING",
                message: "CSRF token is required for this operation",
            });
            return;
        }
        const sessionId = req.sessionID;
        const userId = req.user._id.toString();
        let isValid = (0, exports.validateCSRFToken)(userId, csrfToken, sessionId);
        if (!isValid && sessionId) {
            isValid = (0, exports.validateCSRFToken)(userId, csrfToken, undefined);
        }
        if (!isValid) {
            logger_1.default.warn("Invalid CSRF token", {
                userId: req.user._id,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                providedToken: typeof csrfToken === "string"
                    ? csrfToken.substring(0, 8) + "..."
                    : "invalid",
                hasSessionId: !!sessionId,
                service: "communication-csrf",
            });
            res.status(403).json({
                success: false,
                code: "CSRF_TOKEN_INVALID",
                message: "Invalid or expired CSRF token",
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error("Error validating CSRF token:", error);
        res.status(500).json({
            success: false,
            message: "CSRF validation failed",
        });
    }
};
exports.requireCSRFToken = requireCSRFToken;
const provideCSRFToken = (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const sessionId = req.sessionID;
        const token = (0, exports.generateCSRFToken)(req.user._id.toString(), sessionId);
        res.cookie("csrf-token", token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        });
        res.json({
            success: true,
            csrfToken: token,
            expires: Date.now() + 60 * 60 * 1000,
        });
    }
    catch (error) {
        logger_1.default.error("Error providing CSRF token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate CSRF token",
        });
    }
};
exports.provideCSRFToken = provideCSRFToken;
const doubleSubmitCSRF = (req, res, next) => {
    try {
        if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            return next();
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const cookieToken = req.cookies["csrf-token"];
        const headerToken = req.headers["x-csrf-token"] || req.body._csrf;
        if (!cookieToken || !headerToken) {
            res.status(403).json({
                success: false,
                code: "CSRF_TOKENS_MISSING",
                message: "CSRF tokens are required (cookie and header/body)",
            });
            return;
        }
        if (cookieToken !== headerToken) {
            logger_1.default.warn("CSRF token mismatch", {
                userId: req.user._id,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                service: "communication-csrf",
            });
            res.status(403).json({
                success: false,
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF tokens do not match",
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error("Error in double submit CSRF:", error);
        res.status(500).json({
            success: false,
            message: "CSRF validation failed",
        });
    }
};
exports.doubleSubmitCSRF = doubleSubmitCSRF;
const setCSRFCookie = (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }
        if (!req.cookies["csrf-token"]) {
            const token = crypto_1.default.randomBytes(32).toString("hex");
            res.cookie("csrf-token", token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000,
            });
        }
        next();
    }
    catch (error) {
        logger_1.default.error("Error setting CSRF cookie:", error);
        next();
    }
};
exports.setCSRFCookie = setCSRFCookie;
const validateOrigin = (req, res, next) => {
    try {
        if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            return next();
        }
        const origin = req.headers.origin || req.headers.referer;
        const host = req.headers.host;
        if (!origin) {
            logger_1.default.warn("Missing origin header", {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                service: "communication-csrf",
            });
            res.status(403).json({
                success: false,
                code: "ORIGIN_MISSING",
                message: "Origin header is required",
            });
            return;
        }
        let originHost;
        try {
            originHost = new URL(origin).host;
        }
        catch {
            res.status(403).json({
                success: false,
                code: "INVALID_ORIGIN",
                message: "Invalid origin format",
            });
            return;
        }
        if (originHost !== host) {
            logger_1.default.warn("Origin mismatch", {
                method: req.method,
                url: req.originalUrl,
                origin: originHost,
                host,
                ip: req.ip,
                service: "communication-csrf",
            });
            res.status(403).json({
                success: false,
                code: "ORIGIN_MISMATCH",
                message: "Origin does not match host",
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error("Error validating origin:", error);
        res.status(500).json({
            success: false,
            message: "Origin validation failed",
        });
    }
};
exports.validateOrigin = validateOrigin;
const enforceSameSite = (req, res, next) => {
    try {
        next();
    }
    catch (error) {
        logger_1.default.error("Error enforcing SameSite:", error);
        next();
    }
};
exports.enforceSameSite = enforceSameSite;
exports.comprehensiveCSRFProtection = [
    exports.enforceSameSite,
    exports.validateOrigin,
    exports.setCSRFCookie,
    exports.requireCSRFToken,
];
exports.lightweightCSRFProtection = [exports.validateOrigin, exports.doubleSubmitCSRF];
exports.default = {
    generateCSRFToken: exports.generateCSRFToken,
    validateCSRFToken: exports.validateCSRFToken,
    requireCSRFToken: exports.requireCSRFToken,
    provideCSRFToken: exports.provideCSRFToken,
    doubleSubmitCSRF: exports.doubleSubmitCSRF,
    setCSRFCookie: exports.setCSRFCookie,
    validateOrigin: exports.validateOrigin,
    enforceSameSite: exports.enforceSameSite,
    comprehensiveCSRFProtection: exports.comprehensiveCSRFProtection,
    lightweightCSRFProtection: exports.lightweightCSRFProtection,
};
//# sourceMappingURL=communicationCSRF.js.map