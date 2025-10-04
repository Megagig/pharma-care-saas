"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rbac_1 = __importDefault(require("../middlewares/rbac"));
const DeploymentMonitoringService_1 = __importDefault(require("../services/DeploymentMonitoringService"));
const FeatureFlagService_1 = __importDefault(require("../services/FeatureFlagService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/start', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { deploymentId, rolloutPercentage, thresholds } = req.body;
        if (!deploymentId) {
            return res.status(400).json({
                success: false,
                message: 'Deployment ID is required',
            });
        }
        if (rolloutPercentage < 0 || rolloutPercentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Rollout percentage must be between 0 and 100',
            });
        }
        const existingDeployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        if (existingDeployment && existingDeployment.status === 'monitoring') {
            return res.status(409).json({
                success: false,
                message: 'Deployment is already active',
                data: existingDeployment,
            });
        }
        await DeploymentMonitoringService_1.default.startDeploymentMonitoring(deploymentId, rolloutPercentage, thresholds);
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        logger_1.default.info(`Deployment monitoring started by user ${req.user.id}: ${deploymentId}`);
        res.json({
            success: true,
            message: 'Deployment monitoring started',
            data: deployment,
        });
    }
    catch (error) {
        logger_1.default.error('Error starting deployment monitoring:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start deployment monitoring',
            error: error.message,
        });
    }
});
router.get('/:deploymentId/status', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found',
            });
        }
        res.json({
            success: true,
            data: deployment,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting deployment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get deployment status',
            error: error.message,
        });
    }
});
router.get('/active', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const deployments = DeploymentMonitoringService_1.default.getActiveDeployments();
        res.json({
            success: true,
            data: deployments,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting active deployments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get active deployments',
            error: error.message,
        });
    }
});
router.put('/:deploymentId/rollout', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { percentage } = req.body;
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be a number between 0 and 100',
            });
        }
        await DeploymentMonitoringService_1.default.updateRolloutPercentage(deploymentId, percentage);
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        logger_1.default.info(`Rollout percentage updated by user ${req.user.id}: ${deploymentId} -> ${percentage}%`);
        res.json({
            success: true,
            message: 'Rollout percentage updated',
            data: deployment,
        });
    }
    catch (error) {
        logger_1.default.error('Error updating rollout percentage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rollout percentage',
            error: error.message,
        });
    }
});
router.post('/:deploymentId/rollback', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rollback reason is required',
            });
        }
        await DeploymentMonitoringService_1.default.forceRollback(deploymentId, reason);
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        logger_1.default.info(`Manual rollback executed by user ${req.user.id}: ${deploymentId} - ${reason}`);
        res.json({
            success: true,
            message: 'Rollback executed',
            data: deployment,
        });
    }
    catch (error) {
        logger_1.default.error('Error executing rollback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute rollback',
            error: error.message,
        });
    }
});
router.post('/:deploymentId/complete', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { deploymentId } = req.params;
        await DeploymentMonitoringService_1.default.completeDeployment(deploymentId);
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        logger_1.default.info(`Deployment completed by user ${req.user.id}: ${deploymentId}`);
        res.json({
            success: true,
            message: 'Deployment completed',
            data: deployment,
        });
    }
    catch (error) {
        logger_1.default.error('Error completing deployment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete deployment',
            error: error.message,
        });
    }
});
router.get('/:deploymentId/metrics', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const deployment = DeploymentMonitoringService_1.default.getDeploymentStatus(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found',
            });
        }
        const metrics = deployment.metrics
            .slice(Number(offset), Number(offset) + Number(limit))
            .reverse();
        res.json({
            success: true,
            data: {
                metrics,
                total: deployment.metrics.length,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting deployment metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get deployment metrics',
            error: error.message,
        });
    }
});
router.get('/feature-flags/metrics', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const metrics = FeatureFlagService_1.default.getMetrics();
        res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting feature flag metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feature flag metrics',
            error: error.message,
        });
    }
});
router.post('/feature-flags/override', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { featureName, userId, workspaceId, enabled, expiresAt, reason } = req.body;
        if (!featureName || typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Feature name and enabled status are required',
            });
        }
        if (!userId && !workspaceId) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or workspaceId must be provided',
            });
        }
        if (userId) {
            await FeatureFlagService_1.default.setUserFeatureOverride(featureName, userId, enabled, expiresAt ? new Date(expiresAt) : undefined, reason);
        }
        else if (workspaceId) {
            await FeatureFlagService_1.default.setWorkspaceFeatureOverride(featureName, workspaceId, enabled, expiresAt ? new Date(expiresAt) : undefined, reason);
        }
        logger_1.default.info(`Feature flag override set by user ${req.user.id}: ${featureName} = ${enabled}`);
        res.json({
            success: true,
            message: 'Feature flag override set',
        });
    }
    catch (error) {
        logger_1.default.error('Error setting feature flag override:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set feature flag override',
            error: error.message,
        });
    }
});
router.delete('/feature-flags/override', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { featureName, userId, workspaceId } = req.body;
        if (!featureName) {
            return res.status(400).json({
                success: false,
                message: 'Feature name is required',
            });
        }
        await FeatureFlagService_1.default.removeFeatureOverride(featureName, userId, workspaceId);
        logger_1.default.info(`Feature flag override removed by user ${req.user.id}: ${featureName}`);
        res.json({
            success: true,
            message: 'Feature flag override removed',
        });
    }
    catch (error) {
        logger_1.default.error('Error removing feature flag override:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove feature flag override',
            error: error.message,
        });
    }
});
router.get('/feature-flags/overrides', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const { featureName } = req.query;
        const overrides = await FeatureFlagService_1.default.getFeatureOverrides(featureName);
        res.json({
            success: true,
            data: overrides,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting feature flag overrides:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feature flag overrides',
            error: error.message,
        });
    }
});
router.post('/cleanup', auth_1.auth, rbac_1.default.requireRole('admin'), async (req, res) => {
    try {
        DeploymentMonitoringService_1.default.cleanup();
        logger_1.default.info(`Deployment cleanup executed by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Deployment cleanup completed',
        });
    }
    catch (error) {
        logger_1.default.error('Error during deployment cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup deployments',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=deploymentRoutes.js.map