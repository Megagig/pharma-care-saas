export interface DeploymentEnvironment {
    name: 'development' | 'staging' | 'production';
    apiEndpoints: {
        openRouter: string;
        rxNorm: string;
        openFDA: string;
        fhir: string;
        loinc: string;
    };
    aiConfig: {
        model: string;
        maxTokens: number;
        temperature: number;
        timeout: number;
        retryAttempts: number;
        rateLimits: {
            requestsPerMinute: number;
            tokensPerHour: number;
        };
    };
    cacheConfig: {
        enabled: boolean;
        maxSize: number;
        defaultTTL: number;
        redisUrl?: string;
    };
    databaseConfig: {
        connectionPoolSize: number;
        queryTimeout: number;
        indexingStrategy: 'background' | 'foreground';
    };
    securityConfig: {
        encryptionEnabled: boolean;
        auditLogging: boolean;
        rateLimitingEnabled: boolean;
        ipWhitelist?: string[];
    };
    monitoringConfig: {
        metricsEnabled: boolean;
        healthCheckInterval: number;
        alertThresholds: {
            responseTime: number;
            errorRate: number;
            memoryUsage: number;
        };
    };
    featureFlags: {
        aiDiagnostics: boolean;
        labIntegration: boolean;
        drugInteractions: boolean;
        fhirIntegration: boolean;
        advancedAnalytics: boolean;
    };
}
declare class DeploymentConfigManager {
    private currentEnvironment;
    private config;
    constructor();
    private detectEnvironment;
    private loadEnvironmentConfig;
    private getBaseConfiguration;
    private getEnvironmentOverrides;
    private validateConfiguration;
    getConfig(): DeploymentEnvironment;
    getAIConfig(): {
        model: string;
        maxTokens: number;
        temperature: number;
        timeout: number;
        retryAttempts: number;
        rateLimits: {
            requestsPerMinute: number;
            tokensPerHour: number;
        };
    };
    getCacheConfig(): {
        enabled: boolean;
        maxSize: number;
        defaultTTL: number;
        redisUrl?: string;
    };
    getDatabaseConfig(): {
        connectionPoolSize: number;
        queryTimeout: number;
        indexingStrategy: "background" | "foreground";
    };
    getSecurityConfig(): {
        encryptionEnabled: boolean;
        auditLogging: boolean;
        rateLimitingEnabled: boolean;
        ipWhitelist?: string[];
    };
    getMonitoringConfig(): {
        metricsEnabled: boolean;
        healthCheckInterval: number;
        alertThresholds: {
            responseTime: number;
            errorRate: number;
            memoryUsage: number;
        };
    };
    getFeatureFlags(): {
        aiDiagnostics: boolean;
        labIntegration: boolean;
        drugInteractions: boolean;
        fhirIntegration: boolean;
        advancedAnalytics: boolean;
    };
    isFeatureEnabled(feature: keyof DeploymentEnvironment['featureFlags']): boolean;
    getEnvironment(): DeploymentEnvironment['name'];
    isProduction(): boolean;
    isDevelopment(): boolean;
    getApiEndpoint(service: keyof DeploymentEnvironment['apiEndpoints']): string;
    updateConfig(updates: Partial<DeploymentEnvironment>): void;
    exportConfig(): string;
    getConfigSummary(): {
        environment: string;
        aiModel: string;
        cacheEnabled: boolean;
        securityEnabled: boolean;
        monitoringEnabled: boolean;
        enabledFeatures: string[];
    };
    validateExternalServices(): Promise<{
        service: string;
        status: 'healthy' | 'unhealthy' | 'unknown';
        responseTime?: number;
        error?: string;
    }[]>;
}
declare const _default: DeploymentConfigManager;
export default _default;
//# sourceMappingURL=deploymentConfig.d.ts.map