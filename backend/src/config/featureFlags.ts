/**
 * Feature Flag Configuration for Manual Lab Order Workflow
 * Enables gradual rollout and quick rollback capabilities
 */

export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    environments: string[];
    dependencies?: string[];
    metadata?: Record<string, any>;
}

export const MANUAL_LAB_FEATURE_FLAGS: Record<string, FeatureFlag> = {
    // Core manual lab functionality
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

    // PDF generation and requisitions
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

    // QR/Barcode scanning
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

    // AI interpretation
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

    // FHIR integration
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

    // Mobile optimizations
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

    // Advanced security features
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

    // Performance optimizations
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

    // Notification system
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

    // Analytics and reporting
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

/**
 * Feature flag evaluation service
 */
export class FeatureFlagService {
    private static instance: FeatureFlagService;
    private flags: Map<string, FeatureFlag> = new Map();

    private constructor() {
        // Initialize with default flags
        Object.values(MANUAL_LAB_FEATURE_FLAGS).forEach(flag => {
            this.flags.set(flag.key, flag);
        });
    }

    public static getInstance(): FeatureFlagService {
        if (!FeatureFlagService.instance) {
            FeatureFlagService.instance = new FeatureFlagService();
        }
        return FeatureFlagService.instance;
    }

    /**
     * Check if a feature is enabled for a user/context
     */
    public isEnabled(
        flagKey: string,
        context?: {
            userId?: string;
            workplaceId?: string;
            environment?: string;
            userAgent?: string;
        }
    ): boolean {
        const flag = this.flags.get(flagKey);
        if (!flag) {
            console.warn(`Feature flag '${flagKey}' not found`);
            return false;
        }

        // Check if flag is globally disabled
        if (!flag.enabled) {
            return false;
        }

        // Check environment
        const currentEnv = context?.environment || process.env.NODE_ENV || 'development';
        if (!flag.environments.includes(currentEnv)) {
            return false;
        }

        // Check dependencies
        if (flag.dependencies) {
            for (const dependency of flag.dependencies) {
                if (!this.isEnabled(dependency, context)) {
                    return false;
                }
            }
        }

        // Check rollout percentage
        if (flag.rolloutPercentage < 100) {
            const hash = this.hashContext(flagKey, context);
            const bucket = hash % 100;
            return bucket < flag.rolloutPercentage;
        }

        return true;
    }

    /**
     * Get all enabled features for a context
     */
    public getEnabledFeatures(context?: {
        userId?: string;
        workplaceId?: string;
        environment?: string;
        userAgent?: string;
    }): string[] {
        const enabledFeatures: string[] = [];

        for (const [key, flag] of this.flags) {
            if (this.isEnabled(key, context)) {
                enabledFeatures.push(key);
            }
        }

        return enabledFeatures;
    }

    /**
     * Update a feature flag
     */
    public updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
        const existingFlag = this.flags.get(flagKey);
        if (!existingFlag) {
            throw new Error(`Feature flag '${flagKey}' not found`);
        }

        const updatedFlag = { ...existingFlag, ...updates };
        this.flags.set(flagKey, updatedFlag);
    }

    /**
     * Get feature flag configuration
     */
    public getFlag(flagKey: string): FeatureFlag | undefined {
        return this.flags.get(flagKey);
    }

    /**
     * Hash context for consistent rollout
     */
    private hashContext(flagKey: string, context?: any): number {
        const contextString = JSON.stringify({
            flag: flagKey,
            userId: context?.userId,
            workplaceId: context?.workplaceId
        });

        let hash = 0;
        for (let i = 0; i < contextString.length; i++) {
            const char = contextString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash);
    }
}

/**
 * Middleware to inject feature flags into request context
 */
export const injectFeatureFlags = (req: any, res: any, next: any) => {
    const featureFlagService = FeatureFlagService.getInstance();

    const context = {
        userId: req.user?._id?.toString(),
        workplaceId: req.user?.workplaceId?.toString(),
        environment: process.env.NODE_ENV,
        userAgent: req.get('User-Agent')
    };

    req.featureFlags = {
        isEnabled: (flagKey: string) => featureFlagService.isEnabled(flagKey, context),
        getEnabledFeatures: () => featureFlagService.getEnabledFeatures(context),
        getFlag: (flagKey: string) => featureFlagService.getFlag(flagKey)
    };

    next();
};

/**
 * Express middleware to check feature flag before route execution
 */
export const requireFeatureFlag = (flagKey: string) => {
    return (req: any, res: any, next: any) => {
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

export default FeatureFlagService;