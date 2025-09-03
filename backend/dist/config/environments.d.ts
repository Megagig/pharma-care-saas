export type Environment = 'development' | 'staging' | 'production' | 'test';
export interface DatabaseConfig {
    uri: string;
    options: {
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTimeMS: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        bufferMaxEntries: number;
        bufferCommands: boolean;
    };
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    lazyConnect: boolean;
}
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
    rateLimiting: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
    };
    cors: {
        origin: string | string[];
        credentials: boolean;
        optionsSuccessStatus: number;
    };
}
export interface PerformanceConfig {
    enableCaching: boolean;
    cacheDefaultTTL: number;
    enableCompression: boolean;
    enableMetrics: boolean;
    enableProfiling: boolean;
    maxRequestSize: string;
    requestTimeout: number;
}
export interface FeatureFlags {
    enableClinicalInterventions: boolean;
    enableAdvancedReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableAuditLogging: boolean;
    enableNotifications: boolean;
    enableMTRIntegration: boolean;
    enableBulkOperations: boolean;
    enableExportFeatures: boolean;
}
export interface LoggingConfig {
    level: string;
    format: 'json' | 'simple';
    enableFileLogging: boolean;
    enableConsoleLogging: boolean;
    maxFiles: number;
    maxSize: string;
}
export interface EnvironmentConfig {
    environment: Environment;
    port: number;
    database: DatabaseConfig;
    redis: RedisConfig;
    security: SecurityConfig;
    performance: PerformanceConfig;
    featureFlags: FeatureFlags;
    logging: LoggingConfig;
    monitoring: {
        enableHealthChecks: boolean;
        enableMetrics: boolean;
        enableTracing: boolean;
        metricsPort: number;
    };
    deployment: {
        version: string;
        buildNumber: string;
        deployedAt: string;
        gitCommit: string;
    };
}
export declare const getCurrentEnvironment: () => Environment;
export declare const getConfig: () => EnvironmentConfig;
export declare const validateEnvironmentConfig: (config: EnvironmentConfig) => void;
export declare const logConfigSummary: (config: EnvironmentConfig) => void;
export declare const config: EnvironmentConfig;
//# sourceMappingURL=environments.d.ts.map