"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackFeatureUsage = exports.requireFeatureAccess = exports.gateAccess = exports.loadFeatureFlag = void 0;
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const loadFeatureFlag = (featureKey) => {
    return async (req, res, next) => {
        try {
            const featureFlag = await FeatureFlag_1.default.findOne({
                key: featureKey,
                isActive: true,
            });
            if (!featureFlag) {
                return res.status(404).json({
                    success: false,
                    message: 'Feature not available or has been disabled',
                    feature: featureKey,
                });
            }
            req.featureFlag = featureFlag;
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error loading feature flag configuration',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    };
};
exports.loadFeatureFlag = loadFeatureFlag;
const gateAccess = () => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.subscription || !req.featureFlag) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Missing required context.',
                });
            }
            const user = req.user;
            const subscription = req.subscription;
            const featureFlag = req.featureFlag;
            if (user.role === 'super_admin') {
                return next();
            }
            if (!featureFlag.allowedTiers.includes(subscription.tier)) {
                return res.status(403).json({
                    success: false,
                    message: `This feature is not available in your ${subscription.tier} plan`,
                    currentPlan: subscription.tier,
                    requiredPlans: featureFlag.allowedTiers,
                    feature: featureFlag.name,
                    upgradeRequired: true,
                });
            }
            if (featureFlag.allowedRoles.length > 0) {
                const userRole = user.role;
                if (!featureFlag.allowedRoles.includes(userRole)) {
                    return res.status(403).json({
                        success: false,
                        message: `This feature is not available for ${userRole} role`,
                        currentRole: userRole,
                        requiredRoles: featureFlag.allowedRoles,
                        feature: featureFlag.name,
                    });
                }
            }
            if (featureFlag.customRules) {
                if (featureFlag.customRules.requiredLicense &&
                    ['pharmacist', 'intern_pharmacist'].includes(user.role) &&
                    user.licenseStatus !== 'approved') {
                    return res.status(403).json({
                        success: false,
                        message: 'This feature requires a verified license',
                        licenseStatus: user.licenseStatus,
                        requiresAction: 'license_verification',
                        feature: featureFlag.name,
                    });
                }
                if (featureFlag.customRules.maxUsers && user.teamMembers) {
                    const teamSize = user.teamMembers.length + 1;
                    if (teamSize > featureFlag.customRules.maxUsers) {
                        return res.status(403).json({
                            success: false,
                            message: `Your team size (${teamSize}) exceeds the limit for this feature (${featureFlag.customRules.maxUsers})`,
                            currentTeamSize: teamSize,
                            maxAllowed: featureFlag.customRules.maxUsers,
                            feature: featureFlag.name,
                            upgradeRequired: true,
                        });
                    }
                }
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error evaluating feature access',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    };
};
exports.gateAccess = gateAccess;
const requireFeatureAccess = (featureKey) => {
    return [(0, exports.loadFeatureFlag)(featureKey), (0, exports.gateAccess)()];
};
exports.requireFeatureAccess = requireFeatureAccess;
const trackFeatureUsage = (featureKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.subscription) {
                return next();
            }
            const subscription = req.subscription;
            const metricIndex = subscription.usageMetrics.findIndex((metric) => metric.feature === featureKey);
            if (metricIndex !== -1) {
                const metric = subscription.usageMetrics[metricIndex];
                if (metric) {
                    metric.count = (metric.count || 0) + 1;
                    metric.lastUpdated = new Date();
                }
            }
            else {
                subscription.usageMetrics.push({
                    feature: featureKey,
                    count: 1,
                    lastUpdated: new Date(),
                });
            }
            await subscription.save();
            next();
        }
        catch (error) {
            console.error('Feature usage tracking error:', error);
            next();
        }
    };
};
exports.trackFeatureUsage = trackFeatureUsage;
//# sourceMappingURL=featureFlagMiddleware.js.map