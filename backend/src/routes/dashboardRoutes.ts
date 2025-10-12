import express from 'express';
import { authWithWorkspace } from '../middlewares/authWithWorkspace';
import { dashboardController } from '../controllers/dashboardController';
import { dashboardCacheMiddleware } from '../middlewares/cacheMiddleware';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authWithWorkspace);

/**
 * @route GET /api/dashboard/overview
 * @desc Get optimized dashboard overview with real workspace data
 * @access Private
 */
router.get('/overview', dashboardCacheMiddleware, dashboardController.getDashboardOverview.bind(dashboardController));

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics with workspace context
 * @access Private
 */
router.get('/stats', dashboardCacheMiddleware, dashboardController.getDashboardStats.bind(dashboardController));

/**
 * @route GET /api/dashboard/charts
 * @desc Get chart data for dashboard
 * @access Private
 */
router.get('/charts', dashboardCacheMiddleware, dashboardController.getChartData.bind(dashboardController));

/**
 * @route GET /api/dashboard/workspace-info
 * @desc Get workspace information for members/owner dashboard
 * @access Private
 */
router.get('/workspace-info', dashboardCacheMiddleware, dashboardController.getWorkspaceInfo.bind(dashboardController));

export default router;