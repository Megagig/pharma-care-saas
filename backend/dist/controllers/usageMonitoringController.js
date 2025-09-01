"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageComparison = exports.recalculateUsageStats = exports.getUsageAlerts = exports.getUsageAnalytics = exports.getWorkspaceUsageStats = void 0;
const WorkspaceStatsService_1 = __importDefault(require("../services/WorkspaceStatsService"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const usageLimits_1 = require("../middlewares/usageLimits");
const logger_1 = __importDefault(require("../utils/logger"));
const getWorkspaceUsageStats = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { workspace, limits } = req.workspaceContext;
        const usageWithLimits = await WorkspaceStatsService_1.default.getUsageWithLimits(workspace._id, limits);
        const usageTrends = await getUsageTrends(workspace._id);
        res.json({
            success: true,
            data: {
                workspace: {
                    id: workspace._id,
                    name: workspace.name,
                    subscriptionStatus: workspace.subscriptionStatus
                },
                usage: usageWithLimits.usage,
                stats: usageWithLimits.stats,
                trends: usageTrends,
                lastUpdated: usageWithLimits.stats.lastUpdated
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting workspace usage stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage statistics'
        });
    }
};
exports.getWorkspaceUsageStats = getWorkspaceUsageStats;
const getUsageAnalytics = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        if (req.user?.workplaceRole !== 'Owner' && req.user?.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can access usage analytics'
            });
            return;
        }
        const { workspace, limits, plan } = req.workspaceContext;
        const analytics = await generateUsageAnalytics(workspace._id, limits, plan);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting usage analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage analytics'
        });
    }
};
exports.getUsageAnalytics = getUsageAnalytics;
const getUsageAlerts = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { workspace, limits } = req.workspaceContext;
        const usageStats = await (0, usageLimits_1.getWorkspaceUsageStats)(workspace, limits);
        const alerts = generateUsageAlerts(usageStats);
        res.json({
            success: true,
            data: {
                alerts,
                totalAlerts: alerts.length,
                criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
                warningAlerts: alerts.filter(alert => alert.severity === 'warning').length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting usage alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage alerts'
        });
    }
};
exports.getUsageAlerts = getUsageAlerts;
const recalculateUsageStats = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        if (req.user?.workplaceRole !== 'Owner' && req.user?.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can trigger usage recalculation'
            });
            return;
        }
        const result = await WorkspaceStatsService_1.default.recalculateUsageStats(req.workspaceContext.workspace._id);
        res.json({
            success: true,
            message: 'Usage statistics recalculated successfully',
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error recalculating usage stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recalculate usage statistics'
        });
    }
};
exports.recalculateUsageStats = recalculateUsageStats;
const getUsageComparison = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { workspace, limits, plan } = req.workspaceContext;
        const allPlans = await SubscriptionPlan_1.default.find({ isActive: true })
            .sort({ priceNGN: 1 });
        const currentUsage = await WorkspaceStatsService_1.default.getUsageStats(workspace._id);
        const tierRanking = {
            'free_trial': 0,
            'basic': 1,
            'pro': 2,
            'pharmily': 3,
            'network': 4,
            'enterprise': 5
        };
        const comparison = allPlans.map(planOption => {
            const planLimits = {
                patients: planOption.features.patientLimit,
                users: planOption.features.teamSize,
                storage: null,
                apiCalls: null
            };
            const currentTierRank = plan ? tierRanking[plan.tier] || 0 : 0;
            const planTierRank = tierRanking[planOption.tier] || 0;
            const canUpgrade = planTierRank > currentTierRank;
            return {
                plan: {
                    id: planOption._id,
                    name: planOption.name,
                    tier: planOption.tier,
                    priceNGN: planOption.priceNGN,
                    canUpgrade
                },
                limits: planLimits,
                usage: {
                    patients: {
                        current: currentUsage.patientsCount,
                        limit: planLimits.patients,
                        withinLimit: planLimits.patients === null || currentUsage.patientsCount <= planLimits.patients,
                        percentage: planLimits.patients ? Math.round((currentUsage.patientsCount / planLimits.patients) * 100) : null
                    },
                    users: {
                        current: currentUsage.usersCount,
                        limit: planLimits.users,
                        withinLimit: planLimits.users === null || currentUsage.usersCount <= planLimits.users,
                        percentage: planLimits.users ? Math.round((currentUsage.usersCount / planLimits.users) * 100) : null
                    },
                    storage: {
                        current: currentUsage.storageUsed || 0,
                        limit: planLimits.storage,
                        withinLimit: planLimits.storage === null || (currentUsage.storageUsed || 0) <= planLimits.storage,
                        percentage: planLimits.storage ? Math.round(((currentUsage.storageUsed || 0) / planLimits.storage) * 100) : null
                    }
                }
            };
        });
        res.json({
            success: true,
            data: {
                currentPlan: plan?.name || 'Unknown',
                currentUsage,
                planComparison: comparison,
                recommendedPlan: getRecommendedPlan(comparison, currentUsage)
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting usage comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage comparison'
        });
    }
};
exports.getUsageComparison = getUsageComparison;
async function getUsageTrends(workspaceId) {
    try {
        const currentStats = await WorkspaceStatsService_1.default.getUsageStats(workspaceId);
        return {
            patients: {
                current: currentStats.patientsCount,
                trend: 'stable',
                changePercent: 0
            },
            users: {
                current: currentStats.usersCount,
                trend: 'stable',
                changePercent: 0
            },
            storage: {
                current: currentStats.storageUsed || 0,
                trend: 'stable',
                changePercent: 0
            }
        };
    }
    catch (error) {
        logger_1.default.error('Error getting usage trends:', error);
        return {};
    }
}
async function generateUsageAnalytics(workspaceId, limits, plan) {
    try {
        const usageWithLimits = await WorkspaceStatsService_1.default.getUsageWithLimits(workspaceId, limits);
        const trends = await getUsageTrends(workspaceId);
        return {
            summary: {
                planName: plan?.name || 'Unknown',
                subscriptionTier: plan?.tier || 'unknown',
                totalResources: Object.keys(usageWithLimits.usage).length,
                resourcesAtWarning: Object.values(usageWithLimits.usage).filter((resource) => resource.percentage && resource.percentage >= 90).length,
                resourcesAtLimit: Object.values(usageWithLimits.usage).filter((resource) => resource.percentage && resource.percentage >= 100).length
            },
            usage: usageWithLimits.usage,
            trends,
            recommendations: generateUsageRecommendations(usageWithLimits.usage, plan),
            lastUpdated: usageWithLimits.stats.lastUpdated
        };
    }
    catch (error) {
        logger_1.default.error('Error generating usage analytics:', error);
        throw error;
    }
}
function generateUsageAlerts(usageStats) {
    const alerts = [];
    Object.entries(usageStats).forEach(([resource, stats]) => {
        if (stats.isAtLimit) {
            alerts.push({
                id: `${resource}_limit_exceeded`,
                resource,
                severity: 'critical',
                type: 'limit_exceeded',
                message: `${resource} limit exceeded (${stats.currentUsage}/${stats.limit})`,
                currentUsage: stats.currentUsage,
                limit: stats.limit,
                percentage: Math.round((stats.currentUsage / stats.limit) * 100),
                actionRequired: true,
                suggestedAction: 'Upgrade your plan to increase limits',
                createdAt: new Date()
            });
        }
        else if (stats.isAtWarning) {
            alerts.push({
                id: `${resource}_warning`,
                resource,
                severity: 'warning',
                type: 'approaching_limit',
                message: `${resource} usage is approaching limit (${stats.currentUsage}/${stats.limit})`,
                currentUsage: stats.currentUsage,
                limit: stats.limit,
                percentage: Math.round((stats.currentUsage / stats.limit) * 100),
                actionRequired: false,
                suggestedAction: 'Consider upgrading your plan soon',
                createdAt: new Date()
            });
        }
    });
    return alerts.sort((a, b) => {
        if (a.severity !== b.severity) {
            return a.severity === 'critical' ? -1 : 1;
        }
        return b.percentage - a.percentage;
    });
}
function generateUsageRecommendations(usage, plan) {
    const recommendations = [];
    Object.entries(usage).forEach(([resource, stats]) => {
        if (stats.percentage && stats.percentage >= 80) {
            recommendations.push({
                resource,
                type: 'upgrade_suggestion',
                message: `Consider upgrading your plan to avoid ${resource} limits`,
                priority: stats.percentage >= 95 ? 'high' : 'medium',
                currentUsage: stats.current,
                currentLimit: stats.limit
            });
        }
    });
    return recommendations;
}
function getRecommendedPlan(comparison, currentUsage) {
    const suitablePlans = comparison.filter(plan => {
        return plan.usage.patients.withinLimit &&
            plan.usage.users.withinLimit &&
            plan.usage.storage.withinLimit;
    });
    if (suitablePlans.length === 0) {
        return null;
    }
    return suitablePlans.reduce((cheapest, current) => {
        return current.plan.priceNGN < cheapest.plan.priceNGN ? current : cheapest;
    });
}
//# sourceMappingURL=usageMonitoringController.js.map