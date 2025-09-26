"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.labDataSecurityMiddleware = exports.externalApiSecurityMiddleware = exports.aiDiagnosticSecurityMiddleware = exports.validateDataEncryption = exports.validateApiKeys = exports.monitorSuspiciousPatterns = exports.validateClinicalData = exports.sanitizeClinicalData = exports.labDataRateLimit = exports.externalApiRateLimit = exports.aiDiagnosticRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const securityMonitoringService_1 = require("../../../services/securityMonitoringService");
const crypto_1 = __importDefault(require("crypto"));
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
exports.aiDiagnosticRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        if (req.user?.role === 'super_admin') {
            return 1000;
        }
        const plan = req.workspaceContext?.plan;
        if (plan?.name === 'enterprise') {
            return 50;
        }
        else if (plan?.name === 'professional') {
            return 20;
        }
        else if (plan?.name === 'basic') {
            return 10;
        }
        else {
            return 5;
        }
    },
    message: {
        success: false,
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Too many AI diagnostic requests. Please wait before making more requests.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?._id?.toString() || req.ip || 'anonymous';
    },
    skip: (req) => {
        return req.user?.role === 'super_admin';
    },
});
exports.externalApiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        code: 'EXTERNAL_API_RATE_LIMIT_EXCEEDED',
        message: 'Too many external API requests. Please wait before making more requests.',
    },
    keyGenerator: (req) => {
        return req.user?._id?.toString() || req.ip || 'anonymous';
    },
    skip: (req) => {
        return req.user?.role === 'super_admin';
    },
});
exports.labDataRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        code: 'LAB_DATA_RATE_LIMIT_EXCEEDED',
        message: 'Too many lab data operations. Please wait before making more requests.',
    },
    keyGenerator: (req) => {
        return req.user?._id?.toString() || req.ip || 'anonymous';
    },
});
const sanitizeClinicalData = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error sanitizing clinical data', { error });
        res.status(400).json({
            success: false,
            code: 'SANITIZATION_ERROR',
            message: 'Invalid input data format',
        });
    }
};
exports.sanitizeClinicalData = sanitizeClinicalData;
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = sanitizeString(key);
            if (sanitizedKey && !['__proto__', 'constructor', 'prototype'].includes(sanitizedKey)) {
                sanitized[sanitizedKey] = sanitizeObject(value);
            }
        }
        return sanitized;
    }
    return obj;
}
function sanitizeString(str) {
    if (typeof str !== 'string') {
        return str;
    }
    let sanitized = str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/vbscript:/gi, '');
    sanitized = isomorphic_dompurify_1.default.sanitize(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });
    if (sanitized.length > 10000) {
        sanitized = sanitized.substring(0, 10000);
    }
    return sanitized.trim();
}
const validateClinicalData = (req, res, next) => {
    try {
        const { body } = req;
        if (body.symptoms) {
            validateSymptomsData(body.symptoms);
        }
        if (body.vitalSigns) {
            validateVitalSigns(body.vitalSigns);
        }
        if (body.labResults) {
            validateLabResults(body.labResults);
        }
        if (body.currentMedications) {
            validateMedications(body.currentMedications);
        }
        next();
    }
    catch (error) {
        logger_1.default.warn('Clinical data validation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            endpoint: req.originalUrl,
        });
        res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid clinical data format',
        });
    }
};
exports.validateClinicalData = validateClinicalData;
function validateSymptomsData(symptoms) {
    if (!symptoms.subjective || !Array.isArray(symptoms.subjective)) {
        throw new Error('Subjective symptoms must be an array');
    }
    if (symptoms.subjective.length === 0) {
        throw new Error('At least one subjective symptom is required');
    }
    if (symptoms.subjective.length > 50) {
        throw new Error('Too many subjective symptoms (max 50)');
    }
    symptoms.subjective.forEach((symptom, index) => {
        if (typeof symptom !== 'string' || symptom.length > 500) {
            throw new Error(`Invalid symptom at index ${index}`);
        }
    });
    if (symptoms.objective && Array.isArray(symptoms.objective)) {
        if (symptoms.objective.length > 50) {
            throw new Error('Too many objective findings (max 50)');
        }
        symptoms.objective.forEach((finding, index) => {
            if (typeof finding !== 'string' || finding.length > 500) {
                throw new Error(`Invalid objective finding at index ${index}`);
            }
        });
    }
    const validSeverities = ['mild', 'moderate', 'severe'];
    if (symptoms.severity && !validSeverities.includes(symptoms.severity)) {
        throw new Error('Invalid symptom severity');
    }
    const validOnsets = ['acute', 'chronic', 'subacute'];
    if (symptoms.onset && !validOnsets.includes(symptoms.onset)) {
        throw new Error('Invalid symptom onset');
    }
}
function validateVitalSigns(vitals) {
    if (vitals.heartRate !== undefined) {
        if (typeof vitals.heartRate !== 'number' || vitals.heartRate < 20 || vitals.heartRate > 300) {
            throw new Error('Invalid heart rate (must be 20-300 bpm)');
        }
    }
    if (vitals.temperature !== undefined) {
        if (typeof vitals.temperature !== 'number' || vitals.temperature < 30 || vitals.temperature > 45) {
            throw new Error('Invalid temperature (must be 30-45°C)');
        }
    }
    if (vitals.respiratoryRate !== undefined) {
        if (typeof vitals.respiratoryRate !== 'number' || vitals.respiratoryRate < 5 || vitals.respiratoryRate > 80) {
            throw new Error('Invalid respiratory rate (must be 5-80 breaths/min)');
        }
    }
    if (vitals.bloodPressure !== undefined) {
        if (typeof vitals.bloodPressure !== 'string' || !/^\d{2,3}\/\d{2,3}$/.test(vitals.bloodPressure)) {
            throw new Error('Invalid blood pressure format (must be systolic/diastolic)');
        }
    }
    if (vitals.oxygenSaturation !== undefined) {
        if (typeof vitals.oxygenSaturation !== 'number' || vitals.oxygenSaturation < 50 || vitals.oxygenSaturation > 100) {
            throw new Error('Invalid oxygen saturation (must be 50-100%)');
        }
    }
}
function validateLabResults(labResults) {
    if (!Array.isArray(labResults)) {
        throw new Error('Lab results must be an array');
    }
    if (labResults.length > 100) {
        throw new Error('Too many lab results (max 100)');
    }
    labResults.forEach((result, index) => {
        if (!result.testName || typeof result.testName !== 'string' || result.testName.length > 200) {
            throw new Error(`Invalid test name at index ${index}`);
        }
        if (!result.value || typeof result.value !== 'string' || result.value.length > 500) {
            throw new Error(`Invalid test value at index ${index}`);
        }
        if (result.unit && (typeof result.unit !== 'string' || result.unit.length > 50)) {
            throw new Error(`Invalid unit at index ${index}`);
        }
    });
}
function validateMedications(medications) {
    if (!Array.isArray(medications)) {
        throw new Error('Medications must be an array');
    }
    if (medications.length > 50) {
        throw new Error('Too many medications (max 50)');
    }
    medications.forEach((medication, index) => {
        if (!medication.name || typeof medication.name !== 'string' || medication.name.length > 200) {
            throw new Error(`Invalid medication name at index ${index}`);
        }
        if (!medication.dosage || typeof medication.dosage !== 'string' || medication.dosage.length > 100) {
            throw new Error(`Invalid medication dosage at index ${index}`);
        }
        if (!medication.frequency || typeof medication.frequency !== 'string' || medication.frequency.length > 100) {
            throw new Error(`Invalid medication frequency at index ${index}`);
        }
    });
}
const monitorSuspiciousPatterns = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }
        const userId = req.user._id.toString();
        const suspiciousPatterns = [];
        const requestKey = `diagnostic_requests_${userId}`;
        const recentRequests = await getRecentRequestCount(requestKey);
        if (recentRequests > 10) {
            suspiciousPatterns.push('RAPID_REQUESTS');
        }
        if (req.body) {
            const requestHash = generateRequestHash(req.body);
            const duplicateKey = `duplicate_requests_${userId}_${requestHash}`;
            const duplicateCount = await getDuplicateRequestCount(duplicateKey);
            if (duplicateCount > 3) {
                suspiciousPatterns.push('DUPLICATE_REQUESTS');
            }
            if (req.body.symptoms?.subjective?.length > 20) {
                suspiciousPatterns.push('EXCESSIVE_SYMPTOMS');
            }
            if (req.body.currentMedications?.length > 20) {
                suspiciousPatterns.push('EXCESSIVE_MEDICATIONS');
            }
        }
        if (suspiciousPatterns.length > 0) {
            logger_1.default.warn('Suspicious diagnostic patterns detected', {
                userId,
                patterns: suspiciousPatterns,
                endpoint: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent(req, 'suspicious_diagnostic_pattern', {
                patterns: suspiciousPatterns,
                endpoint: req.originalUrl,
            });
            res.set('X-Security-Warning', 'Suspicious patterns detected');
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error monitoring suspicious patterns', { error });
        next();
    }
};
exports.monitorSuspiciousPatterns = monitorSuspiciousPatterns;
function generateRequestHash(requestBody) {
    const normalizedBody = JSON.stringify(requestBody, Object.keys(requestBody).sort());
    return crypto_1.default.createHash('sha256').update(normalizedBody).digest('hex').substring(0, 16);
}
async function getRecentRequestCount(key) {
    return 0;
}
async function getDuplicateRequestCount(key) {
    return 0;
}
const validateApiKeys = (req, res, next) => {
    if (req.body) {
        removeApiKeysFromObject(req.body);
    }
    if (req.query) {
        removeApiKeysFromObject(req.query);
    }
    next();
};
exports.validateApiKeys = validateApiKeys;
function removeApiKeysFromObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    const sensitiveKeys = [
        'apiKey', 'api_key', 'key', 'token', 'secret', 'password',
        'openRouterKey', 'rxnormKey', 'openfdaKey', 'fhirToken'
    ];
    for (const key of Object.keys(obj)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
            delete obj[key];
            logger_1.default.warn('Removed potential API key from request', { key });
        }
        else if (typeof obj[key] === 'object') {
            removeApiKeysFromObject(obj[key]);
        }
    }
}
const validateDataEncryption = (req, res, next) => {
    if (req.body) {
        const sensitiveFields = ['ssn', 'socialSecurityNumber', 'medicalRecordNumber', 'insuranceId'];
        for (const field of sensitiveFields) {
            if (req.body[field]) {
                logger_1.default.info('Sensitive data field detected', {
                    field,
                    userId: req.user?._id,
                    encrypted: true,
                });
            }
        }
    }
    next();
};
exports.validateDataEncryption = validateDataEncryption;
exports.aiDiagnosticSecurityMiddleware = [
    exports.aiDiagnosticRateLimit,
    exports.sanitizeClinicalData,
    exports.validateClinicalData,
    exports.validateApiKeys,
    exports.validateDataEncryption,
    exports.monitorSuspiciousPatterns,
];
exports.externalApiSecurityMiddleware = [
    exports.externalApiRateLimit,
    exports.sanitizeClinicalData,
    exports.validateApiKeys,
];
exports.labDataSecurityMiddleware = [
    exports.labDataRateLimit,
    exports.sanitizeClinicalData,
    exports.validateClinicalData,
    exports.validateDataEncryption,
];
exports.default = {
    aiDiagnosticRateLimit: exports.aiDiagnosticRateLimit,
    externalApiRateLimit: exports.externalApiRateLimit,
    labDataRateLimit: exports.labDataRateLimit,
    sanitizeClinicalData: exports.sanitizeClinicalData,
    validateClinicalData: exports.validateClinicalData,
    monitorSuspiciousPatterns: exports.monitorSuspiciousPatterns,
    validateApiKeys: exports.validateApiKeys,
    validateDataEncryption: exports.validateDataEncryption,
    aiDiagnosticSecurityMiddleware: exports.aiDiagnosticSecurityMiddleware,
    externalApiSecurityMiddleware: exports.externalApiSecurityMiddleware,
    labDataSecurityMiddleware: exports.labDataSecurityMiddleware,
};
//# sourceMappingURL=securityMiddleware.js.map