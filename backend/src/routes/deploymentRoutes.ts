/**
 * Deployment Monitoring Routes
 * 
 * API endpoints for managing deployment monitoring and rollback
 */

import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { rbac } from '../middlewares/rbac';
import DeploymentMonitoringService from '../services/DeploymentMonitoringService';
import FeatureFlagService from '../services/FeatureFlagService';
import logger from '../utils/logger';

const router = Router();

/**
 * Start deployment monitoring
 * POST /api/deployment/start
 */
router.post('/start', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
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

    // Check if deployment is already active
    const existingDeployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);
    if (existingDeployment && existingDeployment.status === 'monitoring') {
      return res.status(409).json({
        success: false,
        message: 'Deployment is already active',
        data: existingDeployment,
      });
    }

    await DeploymentMonitoringService.startDeploymentMonitoring(
      deploymentId,
      rolloutPercentage,
      thresholds
    );

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

    logger.info(`Deployment monitoring started by user ${req.user.id}: ${deploymentId}`);

    res.json({
      success: true,
      message: 'Deployment monitoring started',
      data: deployment,
    });

  } catch (error) {
    logger.error('Error starting deployment monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start deployment monitoring',
      error: error.message,
    });
  }
});

/**
 * Get deployment status
 * GET /api/deployment/:deploymentId/status
 */
router.get('/:deploymentId/status', auth, rbac(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

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

  } catch (error) {
    logger.error('Error getting deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment status',
      error: error.message,
    });
  }
});

/**
 * Get all active deployments
 * GET /api/deployment/active
 */
router.get('/active', auth, rbac(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
  try {
    const deployments = DeploymentMonitoringService.getActiveDeployments();

    res.json({
      success: true,
      data: deployments,
    });

  } catch (error) {
    logger.error('Error getting active deployments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active deployments',
      error: error.message,
    });
  }
});

/**
 * Update rollout percentage
 * PUT /api/deployment/:deploymentId/rollout
 */
router.put('/:deploymentId/rollout', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { percentage } = req.body;

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage must be a number between 0 and 100',
      });
    }

    await DeploymentMonitoringService.updateRolloutPercentage(deploymentId, percentage);

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

    logger.info(`Rollout percentage updated by user ${req.user.id}: ${deploymentId} -> ${percentage}%`);

    res.json({
      success: true,
      message: 'Rollout percentage updated',
      data: deployment,
    });

  } catch (error) {
    logger.error('Error updating rollout percentage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rollout percentage',
      error: error.message,
    });
  }
});

/**
 * Force rollback
 * POST /api/deployment/:deploymentId/rollback
 */
router.post('/:deploymentId/rollback', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rollback reason is required',
      });
    }

    await DeploymentMonitoringService.forceRollback(deploymentId, reason);

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

    logger.info(`Manual rollback executed by user ${req.user.id}: ${deploymentId} - ${reason}`);

    res.json({
      success: true,
      message: 'Rollback executed',
      data: deployment,
    });

  } catch (error) {
    logger.error('Error executing rollback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute rollback',
      error: error.message,
    });
  }
});

/**
 * Complete deployment
 * POST /api/deployment/:deploymentId/complete
 */
router.post('/:deploymentId/complete', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
  try {
    const { deploymentId } = req.params;

    await DeploymentMonitoringService.completeDeployment(deploymentId);

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

    logger.info(`Deployment completed by user ${req.user.id}: ${deploymentId}`);

    res.json({
      success: true,
      message: 'Deployment completed',
      data: deployment,
    });

  } catch (error) {
    logger.error('Error completing deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete deployment',
      error: error.message,
    });
  }
});

/**
 * Get deployment metrics
 * GET /api/deployment/:deploymentId/metrics
 */
router.get('/:deploymentId/metrics', auth, rbac(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const deployment = DeploymentMonitoringService.getDeploymentStatus(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    const metrics = deployment.metrics
      .slice(Number(offset), Number(offset) + Number(limit))
      .reverse(); // Most recent first

    res.json({
      success: true,
      data: {
        metrics,
        total: deployment.metrics.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    });

  } catch (error) {
    logger.error('Error getting deployment metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment metrics',
      error: error.message,
    });
  }
});

/**
 * Get feature flag metrics
 * GET /api/deployment/feature-flags/metrics
 */
router.get('/feature-flags/metrics', auth, rbac(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
  try {
    const metrics = FeatureFlagService.getMetrics();

    res.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    logger.error('Error getting feature flag metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature flag metrics',
      error: error.message,
    });
  }
});

/**
 * Set feature flag override
 * POST /api/deployment/feature-flags/override
 */
router.post('/feature-flags/override', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
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
      await FeatureFlagService.setUserFeatureOverride(
        featureName,
        userId,
        enabled,
        expiresAt ? new Date(expiresAt) : undefined,
        reason
      );
    } else if (workspaceId) {
      await FeatureFlagService.setWorkspaceFeatureOverride(
        featureName,
        workspaceId,
        enabled,
        expiresAt ? new Date(expiresAt) : undefined,
        reason
      );
    }

    logger.info(`Feature flag override set by user ${req.user.id}: ${featureName} = ${enabled}`);

    res.json({
      success: true,
      message: 'Feature flag override set',
    });

  } catch (error) {
    logger.error('Error setting feature flag override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set feature flag override',
      error: error.message,
    });
  }
});

/**
 * Remove feature flag override
 * DELETE /api/deployment/feature-flags/override
 */
router.delete('/feature-flags/override', auth, rbac(['admin', 'deployment_manager']), async (req, res) => {
  try {
    const { featureName, userId, workspaceId } = req.body;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        message: 'Feature name is required',
      });
    }

    await FeatureFlagService.removeFeatureOverride(featureName, userId, workspaceId);

    logger.info(`Feature flag override removed by user ${req.user.id}: ${featureName}`);

    res.json({
      success: true,
      message: 'Feature flag override removed',
    });

  } catch (error) {
    logger.error('Error removing feature flag override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove feature flag override',
      error: error.message,
    });
  }
});

/**
 * Get feature flag overrides
 * GET /api/deployment/feature-flags/overrides
 */
router.get('/feature-flags/overrides', auth, rbac(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
  try {
    const { featureName } = req.query;

    const overrides = await FeatureFlagService.getFeatureOverrides(featureName as string);

    res.json({
      success: true,
      data: overrides,
    });

  } catch (error) {
    logger.error('Error getting feature flag overrides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature flag overrides',
      error: error.message,
    });
  }
});

/**
 * Cleanup old deployments
 * POST /api/deployment/cleanup
 */
router.post('/cleanup', auth, rbac(['admin']), async (req, res) => {
  try {
    DeploymentMonitoringService.cleanup();

    logger.info(`Deployment cleanup executed by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Deployment cleanup completed',
    });

  } catch (error) {
    logger.error('Error during deployment cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup deployments',
      error: error.message,
    });
  }
});

export default router;