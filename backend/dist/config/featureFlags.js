"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeatureFlag = exports.injectFeatureFlags = exports.FeatureFlagService = exports.FEATURE_FLAG_CATEGORIES = exports.FEATURE_FLAG_DESCRIPTIONS = exports.getDefaultFeatureFlags = exports.getFeatureFlagStatus = exports.validateFeatureFlags = exports.getPerformanceFeatureFlags = void 0;
const getPerformanceFeatureFlags = () => {
    return {
        themeOptimization: process.env.FEATURE_THEME_OPTIMIZATION === 'true',
        bundleOptimization: process.env.FEATURE_BUNDLE_OPTIMIZATION === 'true',
        apiCaching: process.env.FEATURE_API_CACHING === 'true',
        databaseOptimization: process.env.FEATURE_DATABASE_OPTIMIZATION === 'true',
        performanceMonitoring: process.env.FEATURE_PERFORMANCE_MONITORING === 'true',
        cursorPagination: process.env.FEATURE_CURSOR_PAGINATION === 'true',
        backgroundJobs: process.env.FEATURE_BACKGROUND_JOBS === 'true',
        serviceWorker: process.env.FEATURE_SERVICE_WORKER === 'true',
        virtualization: process.env.FEATURE_VIRTUALIZATION === 'true',
        reactQueryOptimization: process.env.FEATURE_REACT_QUERY_OPTIMIZATION === 'true',
        rolloutPercentage: parseInt(process.env.FEATURE_ROLLOUT_PERCENTAGE || '0', 10),
        internalTesting: process.env.FEATURE_INTERNAL_TESTING === 'true',
        betaUsers: process.env.FEATURE_BETA_USERS === 'true',
    };
};
exports.getPerformanceFeatureFlags = getPerformanceFeatureFlags;
const validateFeatureFlags = (flags) => {
    const errors = [];
    if (flags.rolloutPercentage < 0 || flags.rolloutPercentage > 100) {
        errors.push('Rollout percentage must be between 0 and 100');
    }
    if (flags.apiCaching && !flags.performanceMonitoring) {
        errors.push('API caching requires performance monitoring to be enabled');
    }
    if (flags.backgroundJobs && !flags.apiCaching) {
        errors.push('Background jobs require API caching to be enabled');
    }
    if (flags.cursorPagination && !flags.databaseOptimization) {
        errors.push('Cursor pagination requires database optimization to be enabled');
    }
    return errors;
};
exports.validateFeatureFlags = validateFeatureFlags;
const getFeatureFlagStatus = () => {
    const flags = (0, exports.getPerformanceFeatureFlags)();
    const errors = (0, exports.validateFeatureFlags)(flags);
    return {
        flags,
        valid: errors.length === 0,
        errors,
        lastUpdated: new Date().toISOString(),
    };
};
exports.getFeatureFlagStatus = getFeatureFlagStatus;
const getDefaultFeatureFlags = (environment) => {
    switch (environment) {
        case 'development':
            return {
                themeOptimization: true,
                bundleOptimization: true,
                apiCaching: true,
                databaseOptimization: true,
                performanceMonitoring: true,
                cursorPagination: true,
                backgroundJobs: false,
                serviceWorker: false,
                virtualization: true,
                reactQueryOptimization: true,
                rolloutPercentage: 100,
                internalTesting: true,
                betaUsers: false,
            };
        case 'staging':
            return {
                themeOptimization: true,
                bundleOptimization: true,
                apiCaching: true,
                databaseOptimization: true,
                performanceMonitoring: true,
                cursorPagination: true,
                backgroundJobs: true,
                serviceWorker: true,
                virtualization: true,
                reactQueryOptimization: true,
                rolloutPercentage: 100,
                internalTesting: false,
                betaUsers: true,
            };
        case 'production':
            return {
                themeOptimization: false,
                bundleOptimization: false,
                apiCaching: false,
                databaseOptimization: false,
                performanceMonitoring: true,
                cursorPagination: false,
                backgroundJobs: false,
                serviceWorker: false,
                virtualization: false,
                reactQueryOptimization: false,
                rolloutPercentage: 0,
                internalTesting: false,
                betaUsers: false,
            };
        default:
            return {
                performanceMonitoring: true,
                rolloutPercentage: 0,
            };
    }
};
exports.getDefaultFeatureFlags = getDefaultFeatureFlags;
exports.FEATURE_FLAG_DESCRIPTIONS = {
    themeOptimization: 'Enables zero-flicker theme switching with inline scripts and CSS variables',
    bundleOptimization: 'Enables code splitting, lazy loading, and bundle size optimizations',
    apiCaching: 'Enables Redis-based API response caching for improved performance',
    databaseOptimization: 'Enables optimized database indexes and query improvements',
    performanceMonitoring: 'Enables Web Vitals collection and performance monitoring',
    cursorPagination: 'Enables cursor-based pagination for better performance with large datasets',
    backgroundJobs: 'Enables BullMQ background job processing for heavy operations',
    serviceWorker: 'Enables service worker for offline functionality and caching',
    virtualization: 'Enables virtualized lists and tables for better performance with large datasets',
    reactQueryOptimization: 'Enables optimized React Query configuration and caching strategies',
};
exports.FEATURE_FLAG_CATEGORIES = {
    core: ['themeOptimization', 'bundleOptimization', 'performanceMonitoring'],
    backend: ['apiCaching', 'databaseOptimization', 'cursorPagination', 'backgroundJobs'],
    frontend: ['virtualization', 'reactQueryOptimization', 'serviceWorker'],
};
const FeatureFlagService_1 = __importDefault(require("../services/FeatureFlagService"));
exports.FeatureFlagService = FeatureFlagService_1.default;
const injectFeatureFlags = (req, res, next) => {
    try {
        const flags = (0, exports.getPerformanceFeatureFlags)();
        req.featureFlags = flags;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.injectFeatureFlags = injectFeatureFlags;
const requireFeatureFlag = (featureName) => {
    return (req, res, next) => {
        try {
            const flags = req.featureFlags || (0, exports.getPerformanceFeatureFlags)();
            if (flags[featureName]) {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: `Feature '${featureName}' is not enabled`,
                    code: 'FEATURE_NOT_ENABLED'
                });
            }
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireFeatureFlag = requireFeatureFlag;
//# sourceMappingURL=featureFlags.js.map