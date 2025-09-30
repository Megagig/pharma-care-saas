"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mtrErrors_1 = require("../utils/mtrErrors");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        console.warn('Error occurred after response was sent:', err.message);
        return;
    }
    if ((0, mtrErrors_1.isMTRError)(err)) {
        const severity = (0, mtrErrors_1.getMTRErrorSeverity)(err);
        const recovery = (0, mtrErrors_1.getMTRErrorRecovery)(err);
        const logLevel = severity === mtrErrors_1.MTRErrorSeverity.CRITICAL ? 'error' :
            severity === mtrErrors_1.MTRErrorSeverity.HIGH ? 'warn' : 'info';
        logger_1.default[logLevel]('MTR Error occurred', {
            errorType: err.errorType,
            message: err.message,
            statusCode: err.statusCode,
            severity,
            details: err.details,
            userId: req.user?.id,
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: err.timestamp,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
        res.status(err.statusCode).json({
            success: false,
            error: {
                type: err.errorType,
                message: err.message,
                details: err.details,
                severity,
                recovery,
                timestamp: err.timestamp,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
        return;
    }
    console.error(err.stack);
    logger_1.default.error('Non-MTR Error occurred', {
        message: err.message,
        name: err.name,
        statusCode: err.statusCode,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            success: false,
            error: {
                type: 'SyntaxError',
                message: 'Invalid JSON format in request body',
                timestamp: new Date().toISOString()
            }
        });
        return;
    }
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        res.status(404).json({
            success: false,
            error: {
                type: 'CastError',
                message,
                timestamp: new Date().toISOString()
            }
        });
        return;
    }
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        res.status(400).json({
            success: false,
            error: {
                type: 'DuplicateKeyError',
                message,
                timestamp: new Date().toISOString()
            }
        });
        return;
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        res.status(400).json({
            success: false,
            error: {
                type: 'ValidationError',
                message,
                timestamp: new Date().toISOString()
            }
        });
        return;
    }
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            type: 'InternalServerError',
            message: err.message || 'Server Error',
            timestamp: new Date().toISOString()
        }
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map