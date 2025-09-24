"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEncryptionError = exports.validateEncryptionCompliance = exports.decryptMessageContent = exports.encryptMessageContent = void 0;
const encryptionService_1 = require("../services/encryptionService");
const logger_1 = __importDefault(require("../utils/logger"));
const encryptMessageContent = async (req, res, next) => {
    try {
        const { body } = req;
        if (!body || body._encrypted) {
            return next();
        }
        const requiresEncryption = shouldEncryptContent(req);
        if (!requiresEncryption) {
            return next();
        }
        let keyId = req.encryptionContext?.keyId;
        if (!keyId) {
            keyId = encryptionService_1.encryptionService.getCurrentKeyId() || undefined;
            if (!keyId) {
                keyId = await encryptionService_1.encryptionService.generateEncryptionKey();
            }
        }
        if (body.content && typeof body.content === 'object') {
            if (body.content.text && typeof body.content.text === 'string') {
                body.content.text = await encryptionService_1.encryptionService.encryptMessage(body.content.text, keyId);
                body.content._encrypted = true;
                body.content._encryptionKeyId = keyId;
            }
            if (body.content.clinicalNotes && typeof body.content.clinicalNotes === 'string') {
                body.content.clinicalNotes = await encryptionService_1.encryptionService.encryptMessage(body.content.clinicalNotes, keyId);
            }
        }
        if (body.text && typeof body.text === 'string') {
            body.text = await encryptionService_1.encryptionService.encryptMessage(body.text, keyId);
            body._encrypted = true;
            body._encryptionKeyId = keyId;
        }
        req.encryptionContext = {
            keyId,
            requiresEncryption: true,
            patientId: body.patientId || req.params.patientId,
            conversationId: body.conversationId || req.params.conversationId
        };
        logger_1.default.debug('Message content encrypted', {
            keyId,
            patientId: req.encryptionContext.patientId,
            conversationId: req.encryptionContext.conversationId,
            hasTextContent: !!body.content?.text || !!body.text
        });
        next();
    }
    catch (error) {
        logger_1.default.error('Encryption middleware error', {
            error: error instanceof Error ? error.message : error,
            path: req.path,
            method: req.method
        });
        res.status(500).json({
            success: false,
            error: 'Message encryption failed',
            code: 'ENCRYPTION_ERROR'
        });
    }
};
exports.encryptMessageContent = encryptMessageContent;
const decryptMessageContent = async (req, res, next) => {
    try {
        const originalJson = res.json;
        res.json = function (body) {
            if (body && typeof body === 'object') {
                decryptResponseData(body)
                    .then((decryptedBody) => {
                    originalJson.call(this, decryptedBody);
                })
                    .catch((error) => {
                    logger_1.default.error('Response decryption error', { error });
                    originalJson.call(this, {
                        success: false,
                        error: 'Message decryption failed',
                        code: 'DECRYPTION_ERROR'
                    });
                });
            }
            else {
                originalJson.call(this, body);
            }
            return this;
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Decryption middleware error', {
            error: error instanceof Error ? error.message : error,
            path: req.path,
            method: req.method
        });
        next(error);
    }
};
exports.decryptMessageContent = decryptMessageContent;
function shouldEncryptContent(req) {
    const { body, path, method } = req;
    if (req.encryptionContext?.requiresEncryption) {
        return true;
    }
    if (path.includes('/api/messages') || path.includes('/api/conversations')) {
        return true;
    }
    if (body.patientId || req.params.patientId) {
        return true;
    }
    if (body.content?.text || body.text) {
        const sensitiveKeywords = [
            'patient', 'diagnosis', 'medication', 'treatment', 'condition',
            'symptom', 'allergy', 'prescription', 'therapy', 'clinical'
        ];
        const textContent = (body.content?.text || body.text || '').toLowerCase();
        return sensitiveKeywords.some(keyword => textContent.includes(keyword));
    }
    return false;
}
async function decryptResponseData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return Promise.all(data.map(item => decryptResponseData(item)));
    }
    const result = { ...data };
    if (result.content && typeof result.content === 'object') {
        if (result.content._encrypted && result.content.text) {
            try {
                result.content.text = await encryptionService_1.encryptionService.decryptMessage(result.content.text, result.content._encryptionKeyId);
                delete result.content._encrypted;
                delete result.content._encryptionKeyId;
            }
            catch (error) {
                logger_1.default.warn('Failed to decrypt message content', {
                    error: error instanceof Error ? error.message : error,
                    messageId: result._id
                });
            }
        }
        if (result.content.clinicalNotes && result.content._encrypted) {
            try {
                result.content.clinicalNotes = await encryptionService_1.encryptionService.decryptMessage(result.content.clinicalNotes, result.content._encryptionKeyId);
            }
            catch (error) {
                logger_1.default.warn('Failed to decrypt clinical notes', {
                    error: error instanceof Error ? error.message : error,
                    messageId: result._id
                });
            }
        }
    }
    if (result._encrypted && result.text) {
        try {
            result.text = await encryptionService_1.encryptionService.decryptMessage(result.text, result._encryptionKeyId);
            delete result._encrypted;
            delete result._encryptionKeyId;
        }
        catch (error) {
            logger_1.default.warn('Failed to decrypt text content', {
                error: error instanceof Error ? error.message : error,
                messageId: result._id
            });
        }
    }
    for (const key in result) {
        if (result.hasOwnProperty(key) && typeof result[key] === 'object') {
            result[key] = await decryptResponseData(result[key]);
        }
    }
    return result;
}
const validateEncryptionCompliance = (req, res, next) => {
    try {
        const { body, path } = req;
        if (body.patientId || req.params.patientId) {
            if (!body._encrypted && !body.content?._encrypted) {
                logger_1.default.warn('Patient data transmitted without encryption', {
                    path,
                    patientId: body.patientId || req.params.patientId,
                    hasContent: !!body.content || !!body.text
                });
            }
        }
        if (body._encryptionKeyId) {
            const needsRotation = encryptionService_1.encryptionService.needsRotation(body._encryptionKeyId);
            if (needsRotation) {
                logger_1.default.info('Encryption key needs rotation', {
                    keyId: body._encryptionKeyId,
                    path
                });
            }
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Encryption compliance validation error', {
            error: error instanceof Error ? error.message : error,
            path: req.path
        });
        next();
    }
};
exports.validateEncryptionCompliance = validateEncryptionCompliance;
const handleEncryptionError = (error, req, res, next) => {
    if (error.message.includes('Encryption') || error.message.includes('Decryption')) {
        logger_1.default.error('Encryption service error', {
            error: error.message,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({
            success: false,
            error: 'Secure communication service temporarily unavailable',
            code: 'ENCRYPTION_SERVICE_ERROR',
            timestamp: new Date().toISOString()
        });
    }
    else {
        next(error);
    }
};
exports.handleEncryptionError = handleEncryptionError;
//# sourceMappingURL=encryptionMiddleware.js.map