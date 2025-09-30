"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../utils/logger"));
class DeploymentConfigManager {
    constructor() {
        this.currentEnvironment = this.detectEnvironment();
        this.config = this.loadEnvironmentConfig();
        this.validateConfiguration();
    }
    detectEnvironment() {
        const nodeEnv = process.env.NODE_ENV?.toLowerCase();
        if (nodeEnv === 'production') {
            return 'production';
        }
        else if (nodeEnv === 'staging') {
            return 'staging';
        }
        else {
            return 'development';
        }
    }
    loadEnvironmentConfig() {
        const baseConfig = this.getBaseConfiguration();
        const envOverrides = this.getEnvironmentOverrides();
        return {
            ...baseConfig,
            ...envOverrides,
            name: this.currentEnvironment,
        };
    }
    getBaseConfiguration() {
        return {
            apiEndpoints: {
                openRouter: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
                rxNorm: process.env.RXNORM_API_URL || 'https://rxnav.nlm.nih.gov/REST',
                openFDA: process.env.OPENFDA_API_URL || 'https://api.fda.gov',
                fhir: process.env.FHIR_API_URL || 'https://hapi.fhir.org/baseR4',
                loinc: process.env.LOINC_API_URL || 'https://fhir.loinc.org',
            },
            aiConfig: {
                model: process.env.AI_MODEL || 'deepseek/deepseek-chat-v3.1',
                maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
                temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
                timeout: parseInt(process.env.AI_TIMEOUT || '300000'),
                retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS || '3'),
                rateLimits: {
                    requestsPerMinute: parseInt(process.env.AI_REQUESTS_PER_MINUTE || '60'),
                    tokensPerHour: parseInt(process.env.AI_TOKENS_PER_HOUR || '100000'),
                },
            },
            cacheConfig: {
                enabled: process.env.CACHE_ENABLED !== 'false',
                maxSize: parseInt(process.env.CACHE_MAX_SIZE || '104857600'),
                defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600000'),
                redisUrl: process.env.REDIS_URL,
            },
            databaseConfig: {
                connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
                queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
                indexingStrategy: process.env.DB_INDEXING_STRATEGY || 'background',
            },
            securityConfig: {
                encryptionEnabled: process.env.ENCRYPTION_ENABLED !== 'false',
                auditLogging: process.env.AUDIT_LOGGING !== 'false',
                rateLimitingEnabled: process.env.RATE_LIMITING_ENABLED !== 'false',
                ipWhitelist: process.env.IP_WHITELIST?.split(','),
            },
            monitoringConfig: {
                metricsEnabled: process.env.METRICS_ENABLED !== 'false',
                healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
                alertThresholds: {
                    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '5000'),
                    errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.05'),
                    memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.8'),
                },
            },
            featureFlags: {
                aiDiagnostics: process.env.FEATURE_AI_DIAGNOSTICS !== 'false',
                labIntegration: process.env.FEATURE_LAB_INTEGRATION !== 'false',
                drugInteractions: process.env.FEATURE_DRUG_INTERACTIONS !== 'false',
                fhirIntegration: process.env.FEATURE_FHIR_INTEGRATION === 'true',
                advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
            },
        };
    }
    getEnvironmentOverrides() {
        switch (this.currentEnvironment) {
            case 'development':
                return {
                    aiConfig: {
                        model: 'deepseek/deepseek-chat-v3.1',
                        maxTokens: 2000,
                        temperature: 0.2,
                        timeout: 30000,
                        retryAttempts: 2,
                        rateLimits: {
                            requestsPerMinute: 30,
                            tokensPerHour: 50000,
                        },
                    },
                    cacheConfig: {
                        enabled: true,
                        maxSize: 52428800,
                        defaultTTL: 1800000,
                    },
                    databaseConfig: {
                        connectionPoolSize: 5,
                        queryTimeout: 15000,
                        indexingStrategy: 'foreground',
                    },
                    monitoringConfig: {
                        metricsEnabled: true,
                        healthCheckInterval: 60000,
                        alertThresholds: {
                            responseTime: 10000,
                            errorRate: 0.1,
                            memoryUsage: 0.9,
                        },
                    },
                };
            case 'staging':
                return {
                    aiConfig: {
                        model: 'deepseek/deepseek-chat-v3.1',
                        maxTokens: 3000,
                        temperature: 0.1,
                        timeout: 45000,
                        retryAttempts: 3,
                        rateLimits: {
                            requestsPerMinute: 45,
                            tokensPerHour: 75000,
                        },
                    },
                    cacheConfig: {
                        enabled: true,
                        maxSize: 104857600,
                        defaultTTL: 3600000,
                    },
                    databaseConfig: {
                        connectionPoolSize: 8,
                        queryTimeout: 25000,
                        indexingStrategy: 'background',
                    },
                    monitoringConfig: {
                        metricsEnabled: true,
                        healthCheckInterval: 30000,
                        alertThresholds: {
                            responseTime: 7000,
                            errorRate: 0.07,
                            memoryUsage: 0.85,
                        },
                    },
                };
            case 'production':
                return {
                    aiConfig: {
                        model: 'deepseek/deepseek-chat-v3.1',
                        maxTokens: 4000,
                        temperature: 0.1,
                        timeout: 300000,
                        retryAttempts: 3,
                        rateLimits: {
                            requestsPerMinute: 60,
                            tokensPerHour: 100000,
                        },
                    },
                    cacheConfig: {
                        enabled: true,
                        maxSize: 209715200,
                        defaultTTL: 3600000,
                    },
                    databaseConfig: {
                        connectionPoolSize: 15,
                        queryTimeout: 30000,
                        indexingStrategy: 'background',
                    },
                    securityConfig: {
                        encryptionEnabled: true,
                        auditLogging: true,
                        rateLimitingEnabled: true,
                    },
                    monitoringConfig: {
                        metricsEnabled: true,
                        healthCheckInterval: 15000,
                        alertThresholds: {
                            responseTime: 5000,
                            errorRate: 0.05,
                            memoryUsage: 0.8,
                        },
                    },
                };
            default:
                return {};
        }
    }
    validateConfiguration() {
        const errors = [];
        if (!this.config.apiEndpoints.openRouter) {
            errors.push('OpenRouter API URL is required');
        }
        if (this.config.aiConfig.maxTokens <= 0) {
            errors.push('AI max tokens must be greater than 0');
        }
        if (this.config.aiConfig.temperature < 0 || this.config.aiConfig.temperature > 2) {
            errors.push('AI temperature must be between 0 and 2');
        }
        if (this.config.cacheConfig.enabled && this.config.cacheConfig.maxSize <= 0) {
            errors.push('Cache max size must be greater than 0 when cache is enabled');
        }
        if (this.config.databaseConfig.connectionPoolSize <= 0) {
            errors.push('Database connection pool size must be greater than 0');
        }
        const thresholds = this.config.monitoringConfig.alertThresholds;
        if (thresholds.errorRate < 0 || thresholds.errorRate > 1) {
            errors.push('Error rate threshold must be between 0 and 1');
        }
        if (thresholds.memoryUsage < 0 || thresholds.memoryUsage > 1) {
            errors.push('Memory usage threshold must be between 0 and 1');
        }
        if (errors.length > 0) {
            logger_1.default.error('Configuration validation failed', { errors });
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
        logger_1.default.info('Configuration validated successfully', {
            environment: this.currentEnvironment,
            aiModel: this.config.aiConfig.model,
            cacheEnabled: this.config.cacheConfig.enabled,
            metricsEnabled: this.config.monitoringConfig.metricsEnabled,
        });
    }
    getConfig() {
        return { ...this.config };
    }
    getAIConfig() {
        return { ...this.config.aiConfig };
    }
    getCacheConfig() {
        return { ...this.config.cacheConfig };
    }
    getDatabaseConfig() {
        return { ...this.config.databaseConfig };
    }
    getSecurityConfig() {
        return { ...this.config.securityConfig };
    }
    getMonitoringConfig() {
        return { ...this.config.monitoringConfig };
    }
    getFeatureFlags() {
        return { ...this.config.featureFlags };
    }
    isFeatureEnabled(feature) {
        return this.config.featureFlags[feature];
    }
    getEnvironment() {
        return this.currentEnvironment;
    }
    isProduction() {
        return this.currentEnvironment === 'production';
    }
    isDevelopment() {
        return this.currentEnvironment === 'development';
    }
    getApiEndpoint(service) {
        return this.config.apiEndpoints[service];
    }
    updateConfig(updates) {
        if (this.isProduction()) {
            logger_1.default.warn('Attempted to update configuration in production environment');
            return;
        }
        this.config = { ...this.config, ...updates };
        logger_1.default.info('Configuration updated', { updates });
    }
    exportConfig() {
        const exportData = {
            environment: this.currentEnvironment,
            config: this.config,
            timestamp: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
    }
    getConfigSummary() {
        const enabledFeatures = Object.entries(this.config.featureFlags)
            .filter(([, enabled]) => enabled)
            .map(([feature]) => feature);
        return {
            environment: this.currentEnvironment,
            aiModel: this.config.aiConfig.model,
            cacheEnabled: this.config.cacheConfig.enabled,
            securityEnabled: this.config.securityConfig.encryptionEnabled,
            monitoringEnabled: this.config.monitoringConfig.metricsEnabled,
            enabledFeatures,
        };
    }
    async validateExternalServices() {
        const services = Object.entries(this.config.apiEndpoints);
        const results = [];
        for (const [serviceName, endpoint] of services) {
            try {
                const startTime = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${endpoint}/health`, {
                    method: 'GET',
                    signal: controller.signal,
                }).catch(() => null);
                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                results.push({
                    service: serviceName,
                    status: response?.ok ? 'healthy' : 'unhealthy',
                    responseTime,
                });
            }
            catch (error) {
                results.push({
                    service: serviceName,
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return results;
    }
}
exports.default = new DeploymentConfigManager();
//# sourceMappingURL=deploymentConfig.js.map