"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommunicationInput = exports.validateEmojiReaction = exports.setCommunicationCSP = exports.preventNoSQLInjection = exports.validateFileUpload = exports.sanitizeSearchQuery = exports.sanitizeConversationData = exports.sanitizeMessageContent = void 0;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const validator_1 = __importDefault(require("validator"));
const logger_1 = __importDefault(require("../utils/logger"));
const sanitizationConfigs = {
    message: {
        allowedTags: ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li'],
        allowedAttributes: {},
        maxLength: 10000,
        stripHtml: false,
    },
    title: {
        allowedTags: [],
        allowedAttributes: {},
        maxLength: 200,
        stripHtml: true,
    },
    search: {
        allowedTags: [],
        allowedAttributes: {},
        maxLength: 100,
        stripHtml: true,
    },
    filename: {
        allowedTags: [],
        allowedAttributes: {},
        maxLength: 255,
        stripHtml: true,
    },
};
const sanitizeContent = (content, config) => {
    if (!content || typeof content !== 'string') {
        return '';
    }
    let sanitized = content;
    sanitized = sanitized.trim();
    if (config.maxLength && sanitized.length > config.maxLength) {
        sanitized = sanitized.substring(0, config.maxLength);
    }
    if (config.stripHtml) {
        sanitized = validator_1.default.stripLow(sanitized);
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    else {
        sanitized = isomorphic_dompurify_1.default.sanitize(sanitized, {
            ALLOWED_TAGS: config.allowedTags || [],
            ALLOWED_ATTR: Object.keys(config.allowedAttributes || {}),
        });
    }
    sanitized = validator_1.default.escape(sanitized);
    sanitized = sanitized.replace(/\0/g, '');
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return sanitized;
};
const sanitizeMessageContent = (req, res, next) => {
    try {
        if (req.body.content) {
            if (req.body.content.text) {
                const originalText = req.body.content.text;
                req.body.content.text = sanitizeContent(originalText, sanitizationConfigs.message);
                if (originalText !== req.body.content.text) {
                    logger_1.default.info('Message content sanitized', {
                        userId: req.user?._id,
                        originalLength: originalText.length,
                        sanitizedLength: req.body.content.text.length,
                        service: 'communication-security',
                    });
                }
            }
            const allowedTypes = [
                'text',
                'file',
                'image',
                'clinical_note',
                'voice_note',
            ];
            if (req.body.content.type &&
                !allowedTypes.includes(req.body.content.type)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid message type',
                    allowedTypes,
                });
                return;
            }
            if (req.body.content.attachments &&
                Array.isArray(req.body.content.attachments)) {
                req.body.content.attachments = req.body.content.attachments.map((attachment) => ({
                    ...attachment,
                    fileName: sanitizeContent(attachment.fileName || '', sanitizationConfigs.filename),
                    mimeType: validator_1.default.escape(attachment.mimeType || ''),
                }));
            }
        }
        if (req.body.reason) {
            req.body.reason = sanitizeContent(req.body.reason, sanitizationConfigs.message);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error sanitizing message content:', error);
        res.status(500).json({
            success: false,
            message: 'Content sanitization failed',
        });
    }
};
exports.sanitizeMessageContent = sanitizeMessageContent;
const sanitizeConversationData = (req, res, next) => {
    try {
        if (req.body.title) {
            req.body.title = sanitizeContent(req.body.title, sanitizationConfigs.title);
        }
        const allowedTypes = [
            'direct',
            'group',
            'patient_query',
            'clinical_consultation',
        ];
        if (req.body.type && !allowedTypes.includes(req.body.type)) {
            res.status(400).json({
                success: false,
                message: 'Invalid conversation type',
                allowedTypes,
            });
            return;
        }
        const allowedPriorities = ['low', 'normal', 'high', 'urgent'];
        if (req.body.priority && !allowedPriorities.includes(req.body.priority)) {
            res.status(400).json({
                success: false,
                message: 'Invalid priority level',
                allowedPriorities,
            });
            return;
        }
        if (req.body.tags && Array.isArray(req.body.tags)) {
            req.body.tags = req.body.tags
                .map((tag) => sanitizeContent(tag, { maxLength: 50, stripHtml: true }))
                .filter((tag) => tag.length > 0)
                .slice(0, 10);
        }
        if (req.body.caseId) {
            req.body.caseId = sanitizeContent(req.body.caseId, {
                maxLength: 100,
                stripHtml: true,
            });
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error sanitizing conversation data:', error);
        res.status(500).json({
            success: false,
            message: 'Conversation data sanitization failed',
        });
    }
};
exports.sanitizeConversationData = sanitizeConversationData;
const sanitizeSearchQuery = (req, res, next) => {
    try {
        if (req.query.q) {
            const originalQuery = req.query.q;
            req.query.q = sanitizeContent(originalQuery, sanitizationConfigs.search);
            const sqlPatterns = [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
                /(--|\/\*|\*\/|;)/,
                /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            ];
            const hasSqlInjection = sqlPatterns.some((pattern) => pattern.test(originalQuery));
            if (hasSqlInjection) {
                logger_1.default.warn('Potential SQL injection in search query', {
                    userId: req.user?._id,
                    query: originalQuery,
                    sanitizedQuery: req.query.q,
                    service: 'communication-security',
                });
                res.status(400).json({
                    success: false,
                    message: 'Invalid search query format',
                });
                return;
            }
        }
        const stringParams = [
            'conversationId',
            'senderId',
            'participantId',
            'fileType',
        ];
        stringParams.forEach((param) => {
            if (req.query[param]) {
                req.query[param] = sanitizeContent(req.query[param], sanitizationConfigs.search);
            }
        });
        if (req.query.tags) {
            const tags = Array.isArray(req.query.tags)
                ? req.query.tags
                : [String(req.query.tags)];
            req.query.tags = tags.map((tag) => {
                const tagString = typeof tag === 'string'
                    ? tag
                    : Array.isArray(tag)
                        ? tag.join(',')
                        : String(tag || '');
                return sanitizeContent(tagString, {
                    maxLength: 50,
                    stripHtml: true,
                });
            });
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error sanitizing search query:', error);
        res.status(500).json({
            success: false,
            message: 'Search query sanitization failed',
        });
    }
};
exports.sanitizeSearchQuery = sanitizeSearchQuery;
const validateFileUpload = (req, res, next) => {
    try {
        const files = req.files;
        if (files && files.length > 0) {
            const allowedMimeTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/plain',
                'text/csv',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            const maxFileSize = 10 * 1024 * 1024;
            const maxTotalSize = 50 * 1024 * 1024;
            let totalSize = 0;
            const invalidFiles = [];
            for (const file of files) {
                if (file.size > maxFileSize) {
                    invalidFiles.push(`${file.originalname}: File too large (max 10MB)`);
                    continue;
                }
                totalSize += file.size;
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    invalidFiles.push(`${file.originalname}: File type not allowed`);
                    continue;
                }
                const sanitizedName = sanitizeContent(file.originalname, sanitizationConfigs.filename);
                if (sanitizedName !== file.originalname) {
                    logger_1.default.info('Filename sanitized', {
                        userId: req.user?._id,
                        original: file.originalname,
                        sanitized: sanitizedName,
                        service: 'communication-security',
                    });
                    file.originalname = sanitizedName;
                }
                const dangerousExtensions = [
                    '.exe',
                    '.bat',
                    '.cmd',
                    '.scr',
                    '.pif',
                    '.com',
                    '.js',
                    '.vbs',
                ];
                const fileExtension = file.originalname
                    .toLowerCase()
                    .substring(file.originalname.lastIndexOf('.'));
                if (dangerousExtensions.includes(fileExtension)) {
                    invalidFiles.push(`${file.originalname}: Executable files not allowed`);
                }
            }
            if (totalSize > maxTotalSize) {
                invalidFiles.push('Total file size exceeds 50MB limit');
            }
            if (invalidFiles.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'File validation failed',
                    errors: invalidFiles,
                    allowedTypes: allowedMimeTypes,
                    maxFileSize: '10MB',
                    maxTotalSize: '50MB',
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating file upload:', error);
        res.status(500).json({
            success: false,
            message: 'File validation failed',
        });
    }
};
exports.validateFileUpload = validateFileUpload;
const preventNoSQLInjection = (req, res, next) => {
    try {
        const sanitizeObject = (obj) => {
            if (obj === null || obj === undefined) {
                return obj;
            }
            if (typeof obj === 'string') {
                return obj.replace(/^\$/, '');
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            if (typeof obj === 'object') {
                const sanitized = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const sanitizedKey = key.replace(/^\$/, '');
                        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
                    }
                }
                return sanitized;
            }
            return obj;
        };
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error preventing NoSQL injection:', error);
        res.status(500).json({
            success: false,
            message: 'Security validation failed',
        });
    }
};
exports.preventNoSQLInjection = preventNoSQLInjection;
const setCommunicationCSP = (req, res, next) => {
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' wss: ws:",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.setCommunicationCSP = setCommunicationCSP;
const validateEmojiReaction = (req, res, next) => {
    try {
        const { emoji } = req.body;
        if (!emoji) {
            res.status(400).json({
                success: false,
                message: 'Emoji is required',
            });
            return;
        }
        const allowedEmojis = [
            '👍',
            '',
            '❤️',
            '😊',
            '😢',
            '😮',
            '😡',
            '🤔',
            '✅',
            '❌',
            '⚠️',
            '🚨',
            '📋',
            '💊',
            '🩺',
            '📊',
        ];
        if (!allowedEmojis.includes(emoji)) {
            res.status(400).json({
                success: false,
                message: 'Invalid emoji reaction',
                allowedEmojis,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating emoji reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Emoji validation failed',
        });
    }
};
exports.validateEmojiReaction = validateEmojiReaction;
const validateCommunicationInput = (req, res, next) => {
    try {
        const attackPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
        ];
        const checkForAttacks = (value) => {
            return attackPatterns.some((pattern) => pattern.test(value));
        };
        const validateValue = (value, path) => {
            if (typeof value === 'string') {
                if (checkForAttacks(value)) {
                    logger_1.default.warn('Potential XSS attack detected', {
                        userId: req.user?._id,
                        path,
                        value: value.substring(0, 100),
                        service: 'communication-security',
                    });
                    return false;
                }
            }
            else if (typeof value === 'object' && value !== null) {
                for (const key in value) {
                    if (!validateValue(value[key], `${path}.${key}`)) {
                        return false;
                    }
                }
            }
            return true;
        };
        if (req.body && !validateValue(req.body, 'body')) {
            res.status(400).json({
                success: false,
                message: 'Invalid input detected',
            });
            return;
        }
        if (req.query && !validateValue(req.query, 'query')) {
            res.status(400).json({
                success: false,
                message: 'Invalid query parameters detected',
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating communication input:', error);
        res.status(500).json({
            success: false,
            message: 'Input validation failed',
        });
    }
};
exports.validateCommunicationInput = validateCommunicationInput;
exports.default = {
    sanitizeMessageContent: exports.sanitizeMessageContent,
    sanitizeConversationData: exports.sanitizeConversationData,
    sanitizeSearchQuery: exports.sanitizeSearchQuery,
    validateFileUpload: exports.validateFileUpload,
    preventNoSQLInjection: exports.preventNoSQLInjection,
    setCommunicationCSP: exports.setCommunicationCSP,
    validateEmojiReaction: exports.validateEmojiReaction,
    validateCommunicationInput: exports.validateCommunicationInput,
};
//# sourceMappingURL=communicationSecurity.js.map