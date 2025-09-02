import express from 'express';
import MigrationDashboardController from '../controllers/migrationDashboardController';
import { requireSuperAdmin } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for migration operations
const migrationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many migration requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const executionRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit migration executions to 3 per hour
    message: {
        success: false,
        message: 'Migration execution rate limit exceeded. Please wait before trying again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// All migration dashboard routes require super admin access
router.use(requireSuperAdmin);

/**
 * @route   GET /api/migration/status
 * @desc    Get migration status overview
 * @access  Super Admin
 */
router.get('/status', MigrationDashboardController.getStatus);

/**
 * @route   GET /api/migration/metrics
 * @desc    Get detailed migration metrics
 * @access  Super Admin
 */
router.get('/metrics', MigrationDashboardController.getMetrics);

/**
 * @route   GET /api/migration/progress
 * @desc    Get real-time migration progress
 * @access  Super Admin
 */
router.get('/progress', MigrationDashboardController.getProgress);

/**
 * @route   GET /api/migration/health
 * @desc    Get migration health check
 * @access  Super Admin
 */
router.get('/health', MigrationDashboardController.getHealthCheck);

/**
 * @route   POST /api/migration/validate
 * @desc    Run migration validation
 * @access  Super Admin
 */
router.post('/validate', migrationRateLimit, MigrationDashboardController.runValidation);

/**
 * @route   GET /api/migration/alerts
 * @desc    Get migration alerts
 * @access  Super Admin
 */
router.get('/alerts', MigrationDashboardController.getAlerts);

/**
 * @route   POST /api/migration/alerts/:alertId/resolve
 * @desc    Resolve a migration alert
 * @access  Super Admin
 */
router.post('/alerts/:alertId/resolve', MigrationDashboardController.resolveAlert);

/**
 * @route   POST /api/migration/report
 * @desc    Generate migration report
 * @access  Super Admin
 */
router.post('/report', migrationRateLimit, MigrationDashboardController.generateReport);

/**
 * @route   POST /api/migration/dry-run
 * @desc    Run migration dry run
 * @access  Super Admin
 */
router.post('/dry-run', migrationRateLimit, MigrationDashboardController.runDryRun);

/**
 * @route   POST /api/migration/execute
 * @desc    Execute migration with monitoring
 * @access  Super Admin
 */
router.post('/execute', executionRateLimit, MigrationDashboardController.executeMigration);

/**
 * @route   POST /api/migration/rollback
 * @desc    Execute migration rollback
 * @access  Super Admin
 */
router.post('/rollback', executionRateLimit, MigrationDashboardController.executeRollback);

export default router;