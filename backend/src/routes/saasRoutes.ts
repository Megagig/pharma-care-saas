import { Router } from 'express';
import saasOverviewRoutes from './saasOverviewRoutes';
import saasUserManagementRoutes from './saasUserManagementRoutes';
import saasFeatureFlagsRoutes from './saasFeatureFlagsRoutes';
import saasSecurityRoutes from './saasSecurityRoutes';

const router = Router();

/**
 * SaaS Settings Module Routes
 * 
 * This module provides comprehensive system administration and configuration
 * interfaces for super administrators. All routes require super admin privileges.
 * 
 * Route Structure:
 * - /api/admin/saas/overview/* - System overview, metrics, and health monitoring
 * - /api/admin/saas/users/* - User management with RBAC operations
 * - /api/admin/saas/feature-flags/* - Feature flag management with targeting rules
 * - /api/admin/saas/security/* - Security settings and audit capabilities
 */

// System Overview Routes
router.use('/overview', saasOverviewRoutes);

// User Management Routes
router.use('/users', saasUserManagementRoutes);

// Feature Flags Management Routes
router.use('/feature-flags', saasFeatureFlagsRoutes);

// Security Management Routes
router.use('/security', saasSecurityRoutes);

export default router;