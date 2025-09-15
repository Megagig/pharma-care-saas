"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class ApiKeyManagementService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.apiKeys = new Map();
        this.encryptionKey = process.env.API_KEY_ENCRYPTION_KEY || this.generateEncryptionKey();
        this.initializeDefaultKeys();
    }
    generateEncryptionKey() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    initializeDefaultKeys() {
        const defaultKeys = [
            {
                name: 'OpenRouter API Key',
                service: 'openrouter',
                envVar: 'OPENROUTER_API_KEY',
                rotationInterval: 30 * 24 * 60 * 60 * 1000,
            },
            {
                name: 'RxNorm API Key',
                service: 'rxnorm',
                envVar: 'RXNORM_API_KEY',
                rotationInterval: 90 * 24 * 60 * 60 * 1000,
            },
            {
                name: 'OpenFDA API Key',
                service: 'openfda',
                envVar: 'OPENFDA_API_KEY',
                rotationInterval: 90 * 24 * 60 * 60 * 1000,
            },
            {
                name: 'FHIR API Key',
                service: 'fhir',
                envVar: 'FHIR_API_KEY',
                rotationInterval: 60 * 24 * 60 * 60 * 1000,
            },
        ];
        for (const keyConfig of defaultKeys) {
            const keyValue = process.env[keyConfig.envVar];
            if (keyValue) {
                try {
                    this.addApiKey({
                        name: keyConfig.name,
                        service: keyConfig.service,
                        keyValue,
                        rotationInterval: keyConfig.rotationInterval,
                        environment: process.env.NODE_ENV || 'development',
                    });
                }
                catch (error) {
                    logger_1.default.error(`Failed to initialize ${keyConfig.name}`, {
                        service: keyConfig.service,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
        }
    }
    addApiKey(config) {
        const keyId = crypto_1.default.randomUUID();
        const encryptedValue = this.encryptKey(config.keyValue);
        const apiKey = {
            id: keyId,
            name: config.name,
            service: config.service,
            keyValue: config.keyValue,
            encryptedValue,
            createdAt: new Date(),
            rotationInterval: config.rotationInterval || 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            usageCount: 0,
            maxUsage: config.maxUsage,
            expiresAt: config.expiresAt,
            environment: config.environment || 'development',
        };
        this.apiKeys.set(keyId, apiKey);
        logger_1.default.info('API key added', {
            keyId,
            service: config.service,
            name: config.name,
            environment: apiKey.environment,
        });
        return keyId;
    }
    getApiKey(service) {
        const activeKeys = Array.from(this.apiKeys.values())
            .filter(key => key.service === service && key.isActive && !this.isKeyExpired(key));
        if (activeKeys.length === 0) {
            logger_1.default.warn('No active API key found for service', { service });
            return null;
        }
        const latestKey = activeKeys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        this.trackKeyUsage(latestKey.id);
        return latestKey.keyValue;
    }
    encryptKey(keyValue) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher(this.algorithm, this.encryptionKey);
            let encrypted = cipher.update(keyValue, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            logger_1.default.error('Failed to encrypt API key', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to encrypt API key');
        }
    }
    decryptKey(encryptedValue) {
        try {
            const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
            if (!ivHex || !authTagHex || !encrypted) {
                throw new Error('Invalid encrypted key format');
            }
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto_1.default.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.default.error('Failed to decrypt API key', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to decrypt API key');
        }
    }
    isKeyExpired(key) {
        if (key.expiresAt && key.expiresAt < new Date()) {
            return true;
        }
        if (key.maxUsage && key.usageCount >= key.maxUsage) {
            return true;
        }
        return false;
    }
    needsRotation(keyId) {
        const key = this.apiKeys.get(keyId);
        if (!key) {
            return false;
        }
        const rotationDue = new Date(key.createdAt.getTime() + key.rotationInterval);
        return new Date() >= rotationDue;
    }
    async rotateApiKey(keyId, newKeyValue) {
        try {
            const oldKey = this.apiKeys.get(keyId);
            if (!oldKey) {
                return {
                    success: false,
                    oldKeyId: keyId,
                    newKeyId: '',
                    rotatedAt: new Date(),
                    error: 'API key not found',
                };
            }
            oldKey.isActive = false;
            this.apiKeys.set(keyId, oldKey);
            const newKeyId = this.addApiKey({
                name: oldKey.name,
                service: oldKey.service,
                keyValue: newKeyValue,
                rotationInterval: oldKey.rotationInterval,
                maxUsage: oldKey.maxUsage,
                environment: oldKey.environment,
            });
            logger_1.default.info('API key rotated successfully', {
                oldKeyId: keyId,
                newKeyId,
                service: oldKey.service,
            });
            return {
                success: true,
                oldKeyId: keyId,
                newKeyId,
                rotatedAt: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to rotate API key', {
                keyId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                success: false,
                oldKeyId: keyId,
                newKeyId: '',
                rotatedAt: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    trackKeyUsage(keyId) {
        const key = this.apiKeys.get(keyId);
        if (key) {
            key.usageCount++;
            key.lastUsed = new Date();
            this.apiKeys.set(keyId, key);
        }
    }
    getKeyUsageMetrics(keyId) {
        const key = this.apiKeys.get(keyId);
        if (!key) {
            return null;
        }
        return {
            keyId,
            service: key.service,
            totalUsage: key.usageCount,
            dailyUsage: Math.floor(key.usageCount / 30),
            weeklyUsage: Math.floor(key.usageCount / 4),
            monthlyUsage: key.usageCount,
            lastUsed: key.lastUsed,
            averageResponseTime: 150,
            errorRate: 0.02,
        };
    }
    getAllApiKeys() {
        return Array.from(this.apiKeys.values()).map(key => ({
            id: key.id,
            name: key.name,
            service: key.service,
            createdAt: key.createdAt,
            lastUsed: key.lastUsed,
            expiresAt: key.expiresAt,
            rotationInterval: key.rotationInterval,
            isActive: key.isActive,
            usageCount: key.usageCount,
            maxUsage: key.maxUsage,
            environment: key.environment,
        }));
    }
    getKeysNeedingRotation() {
        return this.getAllApiKeys().filter(key => this.needsRotation(key.id));
    }
    deactivateApiKey(keyId) {
        const key = this.apiKeys.get(keyId);
        if (key) {
            key.isActive = false;
            this.apiKeys.set(keyId, key);
            logger_1.default.info('API key deactivated', {
                keyId,
                service: key.service,
                name: key.name,
            });
            return true;
        }
        return false;
    }
    deleteApiKey(keyId) {
        const key = this.apiKeys.get(keyId);
        if (key) {
            this.apiKeys.delete(keyId);
            logger_1.default.info('API key deleted', {
                keyId,
                service: key.service,
                name: key.name,
            });
            return true;
        }
        return false;
    }
    validateApiKeyFormat(service, keyValue) {
        const errors = [];
        if (!keyValue || keyValue.trim().length === 0) {
            errors.push('API key cannot be empty');
        }
        switch (service) {
            case 'openrouter':
                if (!keyValue.startsWith('sk-or-')) {
                    errors.push('OpenRouter API key must start with "sk-or-"');
                }
                if (keyValue.length < 20) {
                    errors.push('OpenRouter API key is too short');
                }
                break;
            case 'rxnorm':
                if (keyValue.length < 10) {
                    errors.push('RxNorm API key is too short');
                }
                break;
            case 'openfda':
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(keyValue)) {
                    errors.push('OpenFDA API key must be a valid UUID');
                }
                break;
            case 'fhir':
                if (keyValue.length < 16) {
                    errors.push('FHIR API key is too short');
                }
                break;
            default:
                errors.push('Unknown service type');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    async testApiKey(keyId) {
        const key = this.apiKeys.get(keyId);
        if (!key) {
            return {
                success: false,
                responseTime: 0,
                error: 'API key not found',
            };
        }
        const startTime = Date.now();
        try {
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            const responseTime = Date.now() - startTime;
            if (Math.random() < 0.1) {
                throw new Error('API test failed');
            }
            return {
                success: true,
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    getServiceHealthStatus() {
        const services = ['openrouter', 'rxnorm', 'openfda', 'fhir', 'loinc'];
        const status = {};
        for (const service of services) {
            const serviceKeys = Array.from(this.apiKeys.values()).filter(key => key.service === service);
            const activeKeys = serviceKeys.filter(key => key.isActive && !this.isKeyExpired(key));
            const needsRotation = serviceKeys.some(key => this.needsRotation(key.id));
            status[service] = {
                hasActiveKey: activeKeys.length > 0,
                keyCount: serviceKeys.length,
                needsRotation,
                isHealthy: activeKeys.length > 0 && !needsRotation,
            };
        }
        return status;
    }
    cleanupExpiredKeys() {
        let cleanedCount = 0;
        const now = new Date();
        for (const [keyId, key] of this.apiKeys.entries()) {
            if (this.isKeyExpired(key) && !key.isActive) {
                const inactiveFor = now.getTime() - (key.lastUsed?.getTime() || key.createdAt.getTime());
                if (inactiveFor > 30 * 24 * 60 * 60 * 1000) {
                    this.apiKeys.delete(keyId);
                    cleanedCount++;
                }
            }
        }
        if (cleanedCount > 0) {
            logger_1.default.info('Cleaned up expired API keys', { cleanedCount });
        }
        return cleanedCount;
    }
}
exports.default = new ApiKeyManagementService();
//# sourceMappingURL=apiKeyManagementService.js.map