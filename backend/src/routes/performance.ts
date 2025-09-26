import express from 'express';
import { performanceController } from '../controllers/performanceController';
import { auth } from '../middlewares/auth';
// import { requirePermission } from '../middlewares/permission';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Apply admin permission requirement to all routes
// router.use(requirePermission('system:admin'));

/**
 * @route GET /api/admin/performance/cache
 * @desc Get cache performance metrics
 * @access Admin
 */
router.get('/cache', performanceController.getCacheMetrics.bind(performanceController));

/**
 * @route GET /api/admin/performance/database
 * @desc Get database optimization report
 * @access Admin
 */
router.get('/database', performanceController.getDatabaseReport.bind(performanceController));

/**
 * @route GET /api/admin/performance/queries
 * @desc Get query performance statistics
 * @access Admin
 */
router.get('/queries', performanceController.getQueryStats.bind(performanceController));

/**
 * @route GET /api/admin/performance/overview
 * @desc Get comprehensive performance overview
 * @access Admin
 */
router.get('/overview', performanceController.getPerformanceOverview.bind(performanceController));

/**
 * @route POST /api/admin/performance/cache/check
 * @desc Check cache consistency
 * @access Admin
 */
router.post('/cache/check', performanceController.checkCacheConsistency.bind(performanceController));

/**
 * @route POST /api/admin/performance/cache/clear
 * @desc Clear all cache
 * @access Admin
 */
router.post('/cache/clear', performanceController.clearCache.bind(performanceController));

/**
 * @route POST /api/admin/performance/cache/warm
 * @desc Warm cache for specific users/roles
 * @access Admin
 */
router.post('/cache/warm', performanceController.warmCache.bind(performanceController));

/**
 * @route POST /api/admin/performance/database/optimize
 * @desc Initialize database optimizations
 * @access Admin
 */
router.post('/database/optimize', performanceController.initializeDatabaseOptimizations.bind(performanceController));

export default router;