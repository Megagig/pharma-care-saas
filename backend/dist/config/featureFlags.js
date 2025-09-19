"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeatureFlag = exports.injectFeatureFlags = exports.FeatureFlagService = exports.MANUAL_LAB_FEATURE_FLAGS = void 0;
exports.MANUAL_LAB_FEATURE_FLAGS = {
    MANUAL_LAB_ORDERS: {
        key: 'manual_lab_orders',
        name: 'Manual Lab Orders',
        description: 'Enable manual lab order creation and management',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production'],
        metadata: {
            version: '1.0.0',
            owner: 'lab-team',
            supportContact: 'lab-support@pharmacare.com'
        }
    },
    MANUAL_LAB_PDF_GENERATION: {
        key: 'manual_lab_pdf_generation',
        name: 'Manual Lab PDF Generation',
        description: 'Enable PDF requisition generation for manual lab orders',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            pdfEngine: 'puppeteer',
            maxFileSize: '5MB'
        }
    },
    MANUAL_LAB_QR_SCANNING: {
        key: 'manual_lab_qr_scanning',
        name: 'Manual Lab QR Scanning',
        description: 'Enable QR/barcode scanning for lab order access',
        enabled: true,
        rolloutPercentage: 90,
        environments: ['development', 'staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            scanningLibrary: 'zxing-js',
            tokenExpiration: '30d'
        }
    },
    MANUAL_LAB_AI_INTERPRETATION: {
        key: 'manual_lab_ai_interpretation',
        name: 'Manual Lab AI Interpretation',
        description: 'Enable AI-powered interpretation of lab results',
        enabled: true,
        rolloutPercentage: 75,
        environments: ['development', 'staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            aiProvider: 'openrouter',
            model: 'deepseek-v3.1',
            maxRetries: 3
        }
    },
    MANUAL_LAB_FHIR_INTEGRATION: {
        key: 'manual_lab_fhir_integration',
        name: 'Manual Lab FHIR Integration',
        description: 'Enable FHIR ServiceRequest and Observation creation',
        enabled: false,
        rolloutPercentage: 25,
        environments: ['development', 'staging'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            fhirVersion: 'R4',
            syncMode: 'async',
            retryPolicy: 'exponential_backoff'
        }
    },
    MANUAL_LAB_MOBILE_FEATURES: {
        key: 'manual_lab_mobile_features',
        name: 'Manual Lab Mobile Features',
        description: 'Enable mobile-optimized interfaces and touch interactions',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            touchTargetSize: '44px',
            swipeGestures: true,
            voiceInput: true
        }
    },
    MANUAL_LAB_ENHANCED_SECURITY: {
        key: 'manual_lab_enhanced_security',
        name: 'Manual Lab Enhanced Security',
        description: 'Enable advanced security monitoring and threat detection',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            threatDetection: true,
            anomalyDetection: true,
            complianceMonitoring: true
        }
    },
    MANUAL_LAB_PERFORMANCE_OPTIMIZATIONS: {
        key: 'manual_lab_performance_optimizations',
        name: 'Manual Lab Performance Optimizations',
        description: 'Enable caching, lazy loading, and performance enhancements',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            caching: true,
            lazyLoading: true,
            virtualScrolling: true,
            imageOptimization: true
        }
    },
    MANUAL_LAB_NOTIFICATIONS: {
        key: 'manual_lab_notifications',
        name: 'Manual Lab Notifications',
        description: 'Enable SMS/email notifications for lab results',
        enabled: false,
        rolloutPercentage: 50,
        environments: ['development', 'staging'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            smsProvider: 'twilio',
            emailProvider: 'sendgrid',
            criticalAlerts: true
        }
    },
    MANUAL_LAB_ANALYTICS: {
        key: 'manual_lab_analytics',
        name: 'Manual Lab Analytics',
        description: 'Enable usage analytics and performance reporting',
        enabled: true,
        rolloutPercentage: 100,
        environments: ['staging', 'production'],
        dependencies: ['manual_lab_orders'],
        metadata: {
            analyticsProvider: 'internal',
            realTimeMetrics: true,
            complianceReporting: true
        }
    }
};
class FeatureFlagService {
    constructor() {
        this.flags = new Map();
        Object.values(exports.MANUAL_LAB_FEATURE_FLAGS).forEach(flag => {
            this.flags.set(flag.key, flag);
        });
    }
    static getInstance() {
        if (!FeatureFlagService.instance) {
            FeatureFlagService.instance = new FeatureFlagService();
        }
        return FeatureFlagService.instance;
    }
    isEnabled(flagKey, context) {
        const flag = this.flags.get(flagKey);
        if (!flag) {
            console.warn(`Feature flag '${flagKey}' not found`);
            return false;
        }
        if (!flag.enabled) {
            return false;
        }
        const currentEnv = context?.environment || process.env.NODE_ENV || 'development';
        if (!flag.environments.includes(currentEnv)) {
            return false;
        }
        if (flag.dependencies) {
            for (const dependency of flag.dependencies) {
                if (!this.isEnabled(dependency, context)) {
                    return false;
                }
            }
        }
        if (flag.rolloutPercentage < 100) {
            const hash = this.hashContext(flagKey, context);
            const bucket = hash % 100;
            return bucket < flag.rolloutPercentage;
        }
        return true;
    }
    getEnabledFeatures(context) {
        const enabledFeatures = [];
        for (const [key, flag] of this.flags) {
            if (this.isEnabled(key, context)) {
                enabledFeatures.push(key);
            }
        }
        return enabledFeatures;
    }
    updateFlag(flagKey, updates) {
        const existingFlag = this.flags.get(flagKey);
        if (!existingFlag) {
            throw new Error(`Feature flag '${flagKey}' not found`);
        }
        const updatedFlag = { ...existingFlag, ...updates };
        this.flags.set(flagKey, updatedFlag);
    }
    getFlag(flagKey) {
        return this.flags.get(flagKey);
    }
    hashContext(flagKey, context) {
        const contextString = JSON.stringify({
            flag: flagKey,
            userId: context?.userId,
            workplaceId: context?.workplaceId
        });
        let hash = 0;
        for (let i = 0; i < contextString.length; i++) {
            const char = contextString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
exports.FeatureFlagService = FeatureFlagService;
const injectFeatureFlags = (req, res, next) => {
    const featureFlagService = FeatureFlagService.getInstance();
    const context = {
        userId: req.user?._id?.toString(),
        workplaceId: req.user?.workplaceId?.toString(),
        environment: process.env.NODE_ENV,
        userAgent: req.get('User-Agent')
    };
    req.featureFlags = {
        isEnabled: (flagKey) => featureFlagService.isEnabled(flagKey, context),
        getEnabledFeatures: () => featureFlagService.getEnabledFeatures(context),
        getFlag: (flagKey) => featureFlagService.getFlag(flagKey)
    };
    next();
};
exports.injectFeatureFlags = injectFeatureFlags;
const requireFeatureFlag = (flagKey) => {
    return (req, res, next) => {
        if (!req.featureFlags?.isEnabled(flagKey)) {
            return res.status(404).json({
                success: false,
                message: 'Feature not available',
                code: 'FEATURE_DISABLED'
            });
        }
        next();
    };
};
exports.requireFeatureFlag = requireFeatureFlag;
exports.default = FeatureFlagService;
//# sourceMappingURL=featureFlags.js.map