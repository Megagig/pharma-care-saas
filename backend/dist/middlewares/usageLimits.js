"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUsageStats = exports.getWorkspaceUsageStats = exports.updateUsageAfterDeletion = exports.updateUsageAfterCreation = exports.warnOnUsageLimit = exports.enforceMultipleLimits = exports.enforcePlanLimit = void 0;
const WorkspaceStatsService_1 = __importDefault(require("../services/WorkspaceStatsService"));
const logger_1 = __importDefault(require("../utils/logger"));
const enforcePlanLimit = (resource) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded. Ensure authWithWorkspace middleware is used.',
                });
                return;
            }
            if (req.user.role === 'super_admin') {
                return next();
            }
            const usageResult = await checkUsageLimit(req.workspaceContext.workspace, req.workspaceContext.limits, resource);
            if (usageResult.isAtLimit) {
                res.status(409).json({
                    success: false,
                    message: `${resource} limit exceeded`,
                    code: 'USAGE_LIMIT_EXCEEDED',
                    currentUsage: usageResult.currentUsage,
                    limit: usageResult.limit,
                    upgradeRequired: true,
                    suggestedPlan: usageResult.suggestedPlan,
                    upgradeUrl: '/subscriptions/upgrade',
                });
                return;
            }
            if (usageResult.isAtWarning) {
                res.setHeader('X-Usage-Warning', 'true');
                res.setHeader('X-Usage-Current', usageResult.currentUsage.toString());
                res.setHeader('X-Usage-Limit', (usageResult.limit || 'unlimited').toString());
                res.setHeader('X-Usage-Percentage', Math.round((usageResult.currentUsage / (usageResult.limit || 1)) * 100).toString());
            }
            req.usageInfo = usageResult;
            next();
        }
        catch (error) {
            logger_1.default.error('Usage limit middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Usage limit check failed',
            });
        }
    };
};
exports.enforcePlanLimit = enforcePlanLimit;
const enforceMultipleLimits = (...resources) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded',
                });
                return;
            }
            if (req.user.role === 'super_admin') {
                return next();
            }
            const limitResults = {};
            let hasLimitExceeded = false;
            let hasWarning = false;
            for (const resource of resources) {
                const usageResult = await checkUsageLimit(req.workspaceContext.workspace, req.workspaceContext.limits, resource);
                limitResults[resource] = usageResult;
                if (usageResult.isAtLimit) {
                    hasLimitExceeded = true;
                }
                if (usageResult.isAtWarning) {
                    hasWarning = true;
                }
            }
            if (hasLimitExceeded) {
                const exceededResources = Object.entries(limitResults)
                    .filter(([, result]) => result.isAtLimit)
                    .map(([resource]) => resource);
                res.status(409).json({
                    success: false,
                    message: `Resource limits exceeded: ${exceededResources.join(', ')}`,
                    code: 'MULTIPLE_LIMITS_EXCEEDED',
                    limitResults,
                    upgradeRequired: true,
                    upgradeUrl: '/subscriptions/upgrade',
                });
                return;
            }
            if (hasWarning) {
                res.setHeader('X-Usage-Warning', 'true');
                res.setHeader('X-Usage-Details', JSON.stringify(limitResults));
            }
            req.usageInfo = limitResults;
            next();
        }
        catch (error) {
            logger_1.default.error('Multiple usage limits middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Usage limit check failed',
            });
        }
    };
};
exports.enforceMultipleLimits = enforceMultipleLimits;
const warnOnUsageLimit = (resource) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.workspaceContext) {
                return next();
            }
            if (req.user.role === 'super_admin') {
                return next();
            }
            const usageResult = await checkUsageLimit(req.workspaceContext.workspace, req.workspaceContext.limits, resource);
            res.setHeader('X-Usage-Current', usageResult.currentUsage.toString());
            res.setHeader('X-Usage-Limit', (usageResult.limit || 'unlimited').toString());
            if (usageResult.isAtWarning || usageResult.isAtLimit) {
                res.setHeader('X-Usage-Warning', 'true');
                res.setHeader('X-Usage-Percentage', Math.round((usageResult.currentUsage / (usageResult.limit || 1)) * 100).toString());
                if (usageResult.isAtLimit) {
                    res.setHeader('X-Usage-Exceeded', 'true');
                }
            }
            req.usageInfo = usageResult;
            next();
        }
        catch (error) {
            logger_1.default.error('Usage warning middleware error:', error);
            next();
        }
    };
};
exports.warnOnUsageLimit = warnOnUsageLimit;
async function checkUsageLimit(workspace, limits, resource) {
    if (!workspace || !limits) {
        return {
            allowed: true,
            currentUsage: 0,
            limit: null,
            isAtWarning: false,
            isAtLimit: false,
        };
    }
    const limit = limits[resource];
    if (limit === null || limit === undefined) {
        return {
            allowed: true,
            currentUsage: await getCurrentUsage(workspace, resource),
            limit: null,
            isAtWarning: false,
            isAtLimit: false,
        };
    }
    const currentUsage = await getCurrentUsage(workspace, resource);
    const warningThreshold = Math.floor(limit * 0.9);
    const isAtWarning = currentUsage >= warningThreshold;
    const isAtLimit = currentUsage >= limit;
    return {
        allowed: !isAtLimit,
        currentUsage,
        limit,
        warningThreshold,
        isAtWarning,
        isAtLimit,
        upgradeRequired: isAtLimit,
        suggestedPlan: getSuggestedPlan(resource, currentUsage),
    };
}
async function getCurrentUsage(workspace, resource) {
    try {
        const stats = await WorkspaceStatsService_1.default.getUsageStats(workspace._id);
        switch (resource) {
            case 'patients':
                return stats?.patientsCount || 0;
            case 'users':
                return stats?.usersCount || 0;
            case 'locations':
                return workspace.locations?.length || 0;
            case 'storage':
                return stats?.storageUsed || 0;
            case 'apiCalls':
                return stats?.apiCallsThisMonth || 0;
            default:
                logger_1.default.warn(`Unknown resource type for usage check: ${resource}`);
                return 0;
        }
    }
    catch (error) {
        logger_1.default.error(`Error getting current usage for ${resource}:`, error);
        const stats = workspace.stats;
        switch (resource) {
            case 'patients':
                return stats?.patientsCount || 0;
            case 'users':
                return stats?.usersCount || 0;
            case 'locations':
                return workspace.locations?.length || 0;
            case 'storage':
                return stats?.storageUsed || 0;
            case 'apiCalls':
                return stats?.apiCallsThisMonth || 0;
            default:
                return 0;
        }
    }
}
function getSuggestedPlan(resource, currentUsage) {
    if (resource === 'patients') {
        if (currentUsage <= 100)
            return 'basic';
        if (currentUsage <= 500)
            return 'pro';
        if (currentUsage <= 2000)
            return 'pharmily';
        return 'network';
    }
    if (resource === 'users') {
        if (currentUsage <= 1)
            return 'basic';
        if (currentUsage <= 5)
            return 'pro';
        if (currentUsage <= 20)
            return 'pharmily';
        return 'network';
    }
    if (resource === 'locations') {
        if (currentUsage <= 1)
            return 'pro';
        return 'network';
    }
    return 'pro';
}
const updateUsageAfterCreation = (resource, delta = 1) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.workspaceContext?.workspace) {
                WorkspaceStatsService_1.default.updateUsageStats({
                    workspaceId: req.workspaceContext.workspace._id,
                    resource: resource,
                    delta,
                    operation: 'increment'
                }).catch(error => {
                    logger_1.default.error(`Failed to update usage stats for ${resource}:`, error);
                });
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.updateUsageAfterCreation = updateUsageAfterCreation;
const updateUsageAfterDeletion = (resource, delta = 1) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.workspaceContext?.workspace) {
                WorkspaceStatsService_1.default.updateUsageStats({
                    workspaceId: req.workspaceContext.workspace._id,
                    resource: resource,
                    delta,
                    operation: 'decrement'
                }).catch(error => {
                    logger_1.default.error(`Failed to update usage stats for ${resource}:`, error);
                });
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.updateUsageAfterDeletion = updateUsageAfterDeletion;
const getWorkspaceUsageStats = async (workspace, limits) => {
    const resources = ['patients', 'users', 'locations', 'storage', 'apiCalls'];
    const stats = {};
    for (const resource of resources) {
        stats[resource] = await checkUsageLimit(workspace, limits, resource);
    }
    return stats;
};
exports.getWorkspaceUsageStats = getWorkspaceUsageStats;
const attachUsageStats = async (req, res, next) => {
    try {
        if (req.workspaceContext?.workspace && req.workspaceContext?.limits) {
            const usageStats = await (0, exports.getWorkspaceUsageStats)(req.workspaceContext.workspace, req.workspaceContext.limits);
            res.locals.usageStats = usageStats;
            const totalResources = Object.keys(usageStats).length;
            const warningResources = Object.values(usageStats).filter(stat => stat.isAtWarning).length;
            const limitedResources = Object.values(usageStats).filter(stat => stat.isAtLimit).length;
            res.setHeader('X-Usage-Summary', JSON.stringify({
                totalResources,
                warningResources,
                limitedResources,
                hasWarnings: warningResources > 0,
                hasLimits: limitedResources > 0,
            }));
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Usage stats middleware error:', error);
        next();
    }
};
exports.attachUsageStats = attachUsageStats;
exports.default = {
    enforcePlanLimit: exports.enforcePlanLimit,
    enforceMultipleLimits: exports.enforceMultipleLimits,
    warnOnUsageLimit: exports.warnOnUsageLimit,
    attachUsageStats: exports.attachUsageStats,
    updateUsageAfterCreation: exports.updateUsageAfterCreation,
    updateUsageAfterDeletion: exports.updateUsageAfterDeletion,
    getWorkspaceUsageStats: exports.getWorkspaceUsageStats,
};
//# sourceMappingURL=usageLimits.js.map