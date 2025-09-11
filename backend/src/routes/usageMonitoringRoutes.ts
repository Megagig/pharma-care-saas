import express from 'express';
import {
   getWorkspaceUsageStats,
   getUsageAnalytics,
   getUsageAlerts,
   recalculateUsageStats,
   getUsageComparison,
} from '../controllers/usageMonitoringController';
import { authWithWorkspace } from '../middlewares/authWithWorkspace';
import { requirePermission } from '../middlewares/rbac';

const router = express.Router();

// Apply workspace authentication to all routes
router.use(authWithWorkspace);

/**
 * @route GET /api/usage/stats
 * @desc Get current workspace usage statistics
 * @access Private (All workspace members)
 */
router.get('/stats', getWorkspaceUsageStats);

/**
 * @route GET /api/usage/analytics
 * @desc Get detailed usage analytics (owners only)
 * @access Private (Workspace owners only)
 */
router.get(
   '/analytics',
   requirePermission('workspace.analytics'),
   getUsageAnalytics
);

/**
 * @route GET /api/usage/alerts
 * @desc Get usage alerts and warnings
 * @access Private (All workspace members)
 */
router.get('/alerts', getUsageAlerts);

/**
 * @route POST /api/usage/recalculate
 * @desc Manually trigger usage statistics recalculation
 * @access Private (Workspace owners only)
 */
router.post(
   '/recalculate',
   requirePermission('workspace.manage'),
   recalculateUsageStats
);

/**
 * @route GET /api/usage/comparison
 * @desc Get usage comparison with available plans
 * @access Private (All workspace members)
 */
router.get('/comparison', getUsageComparison);

export default router;
