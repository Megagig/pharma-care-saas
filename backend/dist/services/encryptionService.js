"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.keyLength = 32;
        this.ivLength = 16;
        this.hmacAlgorithm = 'sha256';
        this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000;
        this.keys = new Map();
        this.currentKeyId = null;
        this.initializeDefaultKey();
    }
    initializeDefaultKey() {
        try {
            const defaultKeyId = 'default-key-' + Date.now();
            const defaultKey = crypto_1.default.randomBytes(this.keyLength);
            const defaultHmacKey = crypto_1.default.randomBytes(this.keyLength);
            this.keys.set(defaultKeyId, {
                key: defaultKey,
                hmacKey: defaultHmacKey,
                createdAt: new Date(),
                isActive: true
            });
            this.currentKeyId = defaultKeyId;
            logger_1.default.info('Encryption service initialized with default key', {
                keyId: defaultKeyId,
                algorithm: this.algorithm
            });
        }
        catch (error) {
            logger_1.default.error('Failed to initialize encryption service', { error });
            throw new Error('Encryption service initialization failed');
        }
    }
    async generateEncryptionKey() {
        try {
            const keyId = 'key-' + crypto_1.default.randomUUID();
            const key = crypto_1.default.randomBytes(this.keyLength);
            const hmacKey = crypto_1.default.randomBytes(this.keyLength);
            this.keys.set(keyId, {
                key,
                hmacKey,
                createdAt: new Date(),
                isActive: true
            });
            logger_1.default.info('New encryption key generated', {
                keyId,
                algorithm: this.algorithm,
                keyLength: this.keyLength
            });
            return keyId;
        }
        catch (error) {
            logger_1.default.error('Failed to generate encryption key', { error });
            throw new Error('Key generation failed');
        }
    }
    async rotateEncryptionKey(conversationId) {
        try {
            const newKeyId = await this.generateEncryptionKey();
            this.keys.forEach((keyData, keyId) => {
                if (keyData.isActive && keyId !== newKeyId) {
                    keyData.isActive = false;
                }
            });
            this.currentKeyId = newKeyId;
            logger_1.default.info('Encryption key rotated', {
                conversationId,
                newKeyId,
                rotatedAt: new Date()
            });
            return newKeyId;
        }
        catch (error) {
            logger_1.default.error('Failed to rotate encryption key', {
                error,
                conversationId
            });
            throw new Error('Key rotation failed');
        }
    }
    async encryptMessage(content, keyId) {
        try {
            if (!content || content.trim().length === 0) {
                throw new Error('Content cannot be empty');
            }
            const useKeyId = keyId || this.currentKeyId;
            if (!useKeyId) {
                throw new Error('No encryption key available');
            }
            const keyData = this.keys.get(useKeyId);
            if (!keyData) {
                throw new Error(`Encryption key not found: ${useKeyId}`);
            }
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const cipher = crypto_1.default.createCipheriv(this.algorithm, keyData.key, iv);
            let encrypted = cipher.update(content, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const hmac = crypto_1.default.createHmac(this.hmacAlgorithm, keyData.hmacKey);
            hmac.update(iv);
            hmac.update(encrypted);
            hmac.update(useKeyId);
            const authTag = hmac.digest();
            const result = {
                iv: iv.toString('base64'),
                data: encrypted.toString('base64'),
                authTag: authTag.toString('base64'),
                keyId: useKeyId,
                algorithm: this.algorithm,
                timestamp: new Date().toISOString()
            };
            logger_1.default.debug('Message encrypted successfully', {
                keyId: useKeyId,
                contentLength: content.length,
                encryptedLength: encrypted.length
            });
            return Buffer.from(JSON.stringify(result)).toString('base64');
        }
        catch (error) {
            logger_1.default.error('Failed to encrypt message', {
                error: error instanceof Error ? error.message : error,
                keyId
            });
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async decryptMessage(encryptedContent, keyId) {
        try {
            if (!encryptedContent || encryptedContent.trim().length === 0) {
                throw new Error('Encrypted content cannot be empty');
            }
            let encryptedData;
            try {
                const decodedContent = Buffer.from(encryptedContent, 'base64').toString('utf8');
                encryptedData = JSON.parse(decodedContent);
            }
            catch (parseError) {
                throw new Error('Invalid encrypted data format');
            }
            const useKeyId = keyId || encryptedData.keyId;
            if (!useKeyId) {
                throw new Error('No decryption key ID available');
            }
            const keyData = this.keys.get(useKeyId);
            if (!keyData) {
                throw new Error(`Decryption key not found: ${useKeyId}`);
            }
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const encrypted = Buffer.from(encryptedData.data, 'base64');
            const authTag = Buffer.from(encryptedData.authTag, 'base64');
            const hmac = crypto_1.default.createHmac(this.hmacAlgorithm, keyData.hmacKey);
            hmac.update(iv);
            hmac.update(encrypted);
            hmac.update(useKeyId);
            const expectedAuthTag = hmac.digest();
            if (!crypto_1.default.timingSafeEqual(authTag, expectedAuthTag)) {
                throw new Error('Authentication failed - data may have been tampered with');
            }
            const decipher = crypto_1.default.createDecipheriv(encryptedData.algorithm || this.algorithm, keyData.key, iv);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const result = decrypted.toString('utf8');
            logger_1.default.debug('Message decrypted successfully', {
                keyId: useKeyId,
                decryptedLength: result.length
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to decrypt message', {
                error: error instanceof Error ? error.message : error,
                keyId
            });
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    needsRotation(keyId) {
        const keyData = this.keys.get(keyId);
        if (!keyData) {
            return true;
        }
        const keyAge = Date.now() - keyData.createdAt.getTime();
        return keyAge > this.keyRotationInterval;
    }
    getCurrentKeyId() {
        return this.currentKeyId;
    }
    validateKey(keyId) {
        const keyData = this.keys.get(keyId);
        return keyData !== undefined;
    }
    cleanupOldKeys(retentionDays = 2555) {
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        let cleanedCount = 0;
        this.keys.forEach((keyData, keyId) => {
            if (!keyData.isActive && keyData.createdAt < cutoffDate) {
                this.keys.delete(keyId);
                cleanedCount++;
            }
        });
        if (cleanedCount > 0) {
            logger_1.default.info('Cleaned up old encryption keys', {
                cleanedCount,
                retentionDays,
                cutoffDate
            });
        }
    }
    getStats() {
        const activeKeys = Array.from(this.keys.values()).filter(k => k.isActive).length;
        const totalKeys = this.keys.size;
        return {
            algorithm: this.algorithm,
            keyLength: this.keyLength,
            activeKeys,
            totalKeys,
            currentKeyId: this.currentKeyId,
            keyRotationInterval: this.keyRotationInterval
        };
    }
}
exports.EncryptionService = EncryptionService;
exports.encryptionService = new EncryptionService();
//# sourceMappingURL=encryptionService.js.map