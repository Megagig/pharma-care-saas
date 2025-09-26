"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.logConfigSummary = exports.validateEnvironmentConfig = exports.getConfig = exports.getCurrentEnvironment = void 0;
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("../utils/logger"));
(0, dotenv_1.config)();
const getCurrentEnvironment = () => {
    const env = process.env.NODE_ENV;
    if (!['development', 'staging', 'production', 'test'].includes(env)) {
        logger_1.default.warn(`Invalid NODE_ENV: ${env}, defaulting to development`);
        return 'development';
    }
    return env;
};
exports.getCurrentEnvironment = getCurrentEnvironment;
const developmentConfig = {
    environment: 'development',
    port: parseInt(process.env.PORT || '5000'),
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmatech_dev',
        options: {
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        },
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
        jwtExpiresIn: '24h',
        bcryptRounds: 10,
        rateLimiting: {
            windowMs: 15 * 60 * 1000,
            max: 1000,
            skipSuccessfulRequests: false,
        },
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true,
            optionsSuccessStatus: 200,
        },
    },
    performance: {
        enableCaching: true,
        cacheDefaultTTL: 300,
        enableCompression: true,
        enableMetrics: true,
        enableProfiling: true,
        maxRequestSize: '10mb',
        requestTimeout: 30000,
    },
    featureFlags: {
        enableClinicalInterventions: true,
        enableAdvancedReporting: true,
        enablePerformanceMonitoring: true,
        enableAuditLogging: true,
        enableNotifications: true,
        enableMTRIntegration: true,
        enableBulkOperations: true,
        enableExportFeatures: true,
    },
    logging: {
        level: 'debug',
        format: 'simple',
        enableFileLogging: true,
        enableConsoleLogging: true,
        maxFiles: 5,
        maxSize: '10m',
    },
    monitoring: {
        enableHealthChecks: true,
        enableMetrics: true,
        enableTracing: false,
        metricsPort: 9090,
    },
    deployment: {
        version: process.env.APP_VERSION || '1.0.0-dev',
        buildNumber: process.env.BUILD_NUMBER || 'local',
        deployedAt: new Date().toISOString(),
        gitCommit: process.env.GIT_COMMIT || 'unknown',
    },
};
const stagingConfig = {
    ...developmentConfig,
    environment: 'staging',
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmatech_staging',
        options: {
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        },
    },
    security: {
        ...developmentConfig.security,
        jwtSecret: process.env.JWT_SECRET || 'staging-secret-key',
        rateLimiting: {
            windowMs: 15 * 60 * 1000,
            max: 500,
            skipSuccessfulRequests: true,
        },
        cors: {
            origin: process.env.FRONTEND_URL?.split(',') || ['https://staging.pharmatech.com'],
            credentials: true,
            optionsSuccessStatus: 200,
        },
    },
    logging: {
        level: 'info',
        format: 'json',
        enableFileLogging: true,
        enableConsoleLogging: true,
        maxFiles: 10,
        maxSize: '50m',
    },
    monitoring: {
        enableHealthChecks: true,
        enableMetrics: true,
        enableTracing: true,
        metricsPort: 9090,
    },
};
const productionConfig = {
    ...stagingConfig,
    environment: 'production',
    database: {
        uri: process.env.MONGODB_URI,
        options: {
            maxPoolSize: 20,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        },
    },
    security: {
        ...stagingConfig.security,
        jwtSecret: process.env.JWT_SECRET,
        bcryptRounds: 12,
        rateLimiting: {
            windowMs: 15 * 60 * 1000,
            max: 100,
            skipSuccessfulRequests: true,
        },
        cors: {
            origin: process.env.FRONTEND_URL?.split(',') || ['https://app.pharmatech.com'],
            credentials: true,
            optionsSuccessStatus: 200,
        },
    },
    performance: {
        ...stagingConfig.performance,
        enableProfiling: false,
        requestTimeout: 15000,
    },
    featureFlags: {
        enableClinicalInterventions: true,
        enableAdvancedReporting: true,
        enablePerformanceMonitoring: true,
        enableAuditLogging: true,
        enableNotifications: true,
        enableMTRIntegration: true,
        enableBulkOperations: false,
        enableExportFeatures: true,
    },
    logging: {
        level: 'warn',
        format: 'json',
        enableFileLogging: true,
        enableConsoleLogging: false,
        maxFiles: 30,
        maxSize: '100m',
    },
};
const testConfig = {
    ...developmentConfig,
    environment: 'test',
    port: parseInt(process.env.TEST_PORT || '5001'),
    database: {
        uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/pharmatech_test',
        options: {
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 10000,
            serverSelectionTimeoutMS: 2000,
            socketTimeoutMS: 10000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        },
    },
    performance: {
        ...developmentConfig.performance,
        enableCaching: false,
        enableMetrics: false,
        enableProfiling: false,
    },
    logging: {
        level: 'error',
        format: 'simple',
        enableFileLogging: false,
        enableConsoleLogging: false,
        maxFiles: 1,
        maxSize: '1m',
    },
    monitoring: {
        enableHealthChecks: false,
        enableMetrics: false,
        enableTracing: false,
        metricsPort: 9091,
    },
};
const getConfig = () => {
    const environment = (0, exports.getCurrentEnvironment)();
    switch (environment) {
        case 'development':
            return developmentConfig;
        case 'staging':
            return stagingConfig;
        case 'production':
            return productionConfig;
        case 'test':
            return testConfig;
        default:
            logger_1.default.warn(`Unknown environment: ${environment}, using development config`);
            return developmentConfig;
    }
};
exports.getConfig = getConfig;
const validateEnvironmentConfig = (config) => {
    const requiredVars = [
        { key: 'JWT_SECRET', value: config.security.jwtSecret, env: ['production', 'staging'] },
        { key: 'MONGODB_URI', value: config.database.uri, env: ['production', 'staging'] },
    ];
    const missingVars = requiredVars
        .filter(({ env }) => env.includes(config.environment))
        .filter(({ value }) => !value || value === 'dev-secret-key' || value === 'staging-secret-key')
        .map(({ key }) => key);
    if (missingVars.length > 0) {
        const error = `Missing required environment variables for ${config.environment}: ${missingVars.join(', ')}`;
        logger_1.default.error(error);
        throw new Error(error);
    }
    logger_1.default.info(`Environment configuration validated for ${config.environment}`);
};
exports.validateEnvironmentConfig = validateEnvironmentConfig;
const logConfigSummary = (config) => {
    const summary = {
        environment: config.environment,
        port: config.port,
        database: {
            host: config.database.uri.split('@')[1]?.split('/')[0] || 'localhost',
            poolSize: config.database.options.maxPoolSize,
        },
        redis: {
            host: config.redis.host,
            port: config.redis.port,
            db: config.redis.db,
        },
        features: config.featureFlags,
        logging: {
            level: config.logging.level,
            format: config.logging.format,
        },
        deployment: config.deployment,
    };
    logger_1.default.info('Application configuration:', summary);
};
exports.logConfigSummary = logConfigSummary;
exports.config = (0, exports.getConfig)();
(0, exports.validateEnvironmentConfig)(exports.config);
(0, exports.logConfigSummary)(exports.config);
//# sourceMappingURL=environments.js.map