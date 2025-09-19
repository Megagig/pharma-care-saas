export interface ApiKeyConfig {
    id: string;
    name: string;
    service: 'openrouter' | 'rxnorm' | 'openfda' | 'fhir' | 'loinc';
    keyValue: string;
    encryptedValue: string;
    createdAt: Date;
    lastUsed?: Date;
    expiresAt?: Date;
    rotationInterval: number;
    isActive: boolean;
    usageCount: number;
    maxUsage?: number;
    environment: 'development' | 'staging' | 'production';
}
export interface KeyRotationResult {
    success: boolean;
    oldKeyId: string;
    newKeyId: string;
    rotatedAt: Date;
    error?: string;
}
export interface KeyUsageMetrics {
    keyId: string;
    service: string;
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    lastUsed?: Date;
    averageResponseTime: number;
    errorRate: number;
}
declare class ApiKeyManagementService {
    private readonly encryptionKey;
    private readonly algorithm;
    private apiKeys;
    constructor();
    private generateEncryptionKey;
    private initializeDefaultKeys;
    addApiKey(config: {
        name: string;
        service: ApiKeyConfig['service'];
        keyValue: string;
        rotationInterval?: number;
        maxUsage?: number;
        expiresAt?: Date;
        environment?: ApiKeyConfig['environment'];
    }): string;
    getApiKey(service: ApiKeyConfig['service']): string | null;
    private encryptKey;
    private decryptKey;
    private isKeyExpired;
    needsRotation(keyId: string): boolean;
    rotateApiKey(keyId: string, newKeyValue: string): Promise<KeyRotationResult>;
    private trackKeyUsage;
    getKeyUsageMetrics(keyId: string): KeyUsageMetrics | null;
    getAllApiKeys(): Array<Omit<ApiKeyConfig, 'keyValue' | 'encryptedValue'>>;
    getKeysNeedingRotation(): Array<Omit<ApiKeyConfig, 'keyValue' | 'encryptedValue'>>;
    deactivateApiKey(keyId: string): boolean;
    deleteApiKey(keyId: string): boolean;
    validateApiKeyFormat(service: ApiKeyConfig['service'], keyValue: string): {
        isValid: boolean;
        errors: string[];
    };
    testApiKey(keyId: string): Promise<{
        success: boolean;
        responseTime: number;
        error?: string;
    }>;
    getServiceHealthStatus(): Record<ApiKeyConfig['service'], {
        hasActiveKey: boolean;
        keyCount: number;
        needsRotation: boolean;
        lastTested?: Date;
        isHealthy: boolean;
    }>;
    cleanupExpiredKeys(): number;
}
declare const _default: ApiKeyManagementService;
export default _default;
//# sourceMappingURL=apiKeyManagementService.d.ts.map