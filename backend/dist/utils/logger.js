"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.addCorrelationId = exports.patientEngagementLogger = void 0;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const structuredFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
    const correlationId = info.correlationId || 'unknown';
    const logEntry = {
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        service: info.service || 'pharma-care-api',
        correlationId,
        ...info,
    };
    delete logEntry.timestamp;
    delete logEntry.level;
    delete logEntry.message;
    delete logEntry.service;
    return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        service: info.service || 'pharma-care-api',
        correlationId,
        ...logEntry,
    });
}));
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: structuredFormat,
    defaultMeta: { service: 'pharma-care-api' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'patient-engagement.log'),
            level: 'info',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json(), winston.format((info) => {
                if (info.module && typeof info.module === 'string' &&
                    ['appointment', 'followup', 'reminder', 'schedule', 'integration'].includes(info.module)) {
                    return info;
                }
                return false;
            })()),
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'performance.log'),
            level: 'info',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 3,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json(), winston.format((info) => {
                if (info.duration || info.responseTime || info.operation) {
                    return info;
                }
                return false;
            })()),
        }),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf((info) => {
            const { timestamp, level, message, ...meta } = info;
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }))
    }));
}
exports.patientEngagementLogger = {
    appointment: (operation, data) => {
        logger.info(`Appointment ${operation}`, {
            module: 'appointment',
            operation,
            ...data,
        });
    },
    followUp: (operation, data) => {
        logger.info(`FollowUp ${operation}`, {
            module: 'followup',
            operation,
            ...data,
        });
    },
    reminder: (operation, data) => {
        logger.info(`Reminder ${operation}`, {
            module: 'reminder',
            operation,
            ...data,
        });
    },
    schedule: (operation, data) => {
        logger.info(`Schedule ${operation}`, {
            module: 'schedule',
            operation,
            ...data,
        });
    },
    integration: (operation, data) => {
        logger.info(`Integration ${operation}`, {
            module: 'integration',
            operation,
            ...data,
        });
    },
    performance: (operation, duration, data = {}) => {
        logger.info(`Performance ${operation}`, {
            operation,
            duration,
            responseTime: duration,
            ...data,
        });
    },
    error: (operation, error, data = {}) => {
        logger.error(`Error in ${operation}`, {
            operation,
            error: error.message,
            stack: error.stack,
            ...data,
        });
    },
    business: (event, data) => {
        logger.info(`Business Event: ${event}`, {
            event,
            eventType: 'business',
            ...data,
        });
    },
    security: (event, data) => {
        logger.warn(`Security Event: ${event}`, {
            event,
            eventType: 'security',
            ...data,
        });
    },
};
const addCorrelationId = (req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] ||
        req.headers['x-request-id'] ||
        Math.random().toString(36).substr(2, 9);
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
};
exports.addCorrelationId = addCorrelationId;
const createChildLogger = (correlationId, context = {}) => {
    return logger.child({
        correlationId,
        ...context,
    });
};
exports.createChildLogger = createChildLogger;
exports.default = logger;
//# sourceMappingURL=logger.js.map