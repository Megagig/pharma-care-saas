"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptiveCompressionMiddleware = exports.responseSizeMonitoringMiddleware = exports.brotliCompressionMiddleware = exports.intelligentCompressionMiddleware = void 0;
const compression_1 = __importDefault(require("compression"));
const logger_1 = __importDefault(require("../utils/logger"));
const intelligentCompressionMiddleware = (options = {}) => {
    const { threshold = 1024, level = 6, chunkSize = 16 * 1024, } = options;
    const compressionMiddleware = (0, compression_1.default)({
        threshold,
        level,
        chunkSize,
        filter: (req, res) => {
            if (!req.headers['accept-encoding']) {
                return false;
            }
            const contentType = res.getHeader('content-type');
            if (contentType && (contentType.includes('image/') ||
                contentType.includes('video/') ||
                contentType.includes('audio/') ||
                contentType.includes('application/zip') ||
                contentType.includes('application/gzip'))) {
                return false;
            }
            const contentLength = res.getHeader('content-length');
            if (contentLength && parseInt(contentLength) < threshold) {
                return false;
            }
            if (options.filter && !options.filter(req, res)) {
                return false;
            }
            return true;
        },
    });
    return (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;
        res.send = function (data) {
            const originalSize = Buffer.byteLength(data);
            res.setHeader('X-Original-Size', originalSize);
            return originalSend.call(this, data);
        };
        res.json = function (data) {
            const originalSize = Buffer.byteLength(JSON.stringify(data));
            res.setHeader('X-Original-Size', originalSize);
            return originalJson.call(this, data);
        };
        compressionMiddleware(req, res, next);
    };
};
exports.intelligentCompressionMiddleware = intelligentCompressionMiddleware;
const brotliCompressionMiddleware = () => {
    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (acceptEncoding.includes('br')) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Vary', 'Accept-Encoding');
        }
        next();
    };
};
exports.brotliCompressionMiddleware = brotliCompressionMiddleware;
const responseSizeMonitoringMiddleware = () => {
    return (req, res, next) => {
        const startTime = Date.now();
        const originalSend = res.send;
        const originalJson = res.json;
        res.send = function (data) {
            const responseTime = Date.now() - startTime;
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            const responseSize = Buffer.byteLength(dataString);
            const originalSize = res.getHeader('X-Original-Size');
            if (responseSize > 100 * 1024) {
                logger_1.default.warn('Large API response detected', {
                    method: req.method,
                    url: req.originalUrl,
                    responseSize,
                    originalSize: originalSize ? parseInt(originalSize) : responseSize,
                    compressionRatio: originalSize ? (1 - responseSize / parseInt(originalSize)) * 100 : 0,
                    responseTime,
                });
            }
            res.setHeader('X-Response-Time', responseTime);
            res.setHeader('X-Response-Size', responseSize);
            return originalSend.call(this, data);
        };
        res.json = function (data) {
            const responseTime = Date.now() - startTime;
            const jsonString = JSON.stringify(data);
            const responseSize = Buffer.byteLength(jsonString);
            const originalSize = res.getHeader('X-Original-Size');
            if (responseSize > 100 * 1024) {
                logger_1.default.warn('Large JSON API response detected', {
                    method: req.method,
                    url: req.originalUrl,
                    responseSize,
                    originalSize: originalSize ? parseInt(originalSize) : responseSize,
                    compressionRatio: originalSize ? (1 - responseSize / parseInt(originalSize)) * 100 : 0,
                    responseTime,
                    recordCount: Array.isArray(data) ? data.length : (data?.data?.length || 'unknown'),
                });
            }
            res.setHeader('X-Response-Time', responseTime);
            res.setHeader('X-Response-Size', responseSize);
            return originalJson.call(this, data);
        };
        next();
    };
};
exports.responseSizeMonitoringMiddleware = responseSizeMonitoringMiddleware;
const adaptiveCompressionMiddleware = () => {
    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const userAgent = req.headers['user-agent'] || '';
        let compressionLevel = 6;
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            compressionLevel = 8;
        }
        if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
            compressionLevel = 4;
        }
        req.compressionLevel = compressionLevel;
        next();
    };
};
exports.adaptiveCompressionMiddleware = adaptiveCompressionMiddleware;
exports.default = exports.intelligentCompressionMiddleware;
//# sourceMappingURL=compressionMiddleware.js.map