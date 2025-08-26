import express from 'express';
import { auth, requireAdmin, authorize } from '../middlewares/auth';
import { adminController } from '../controllers/adminController';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/role', adminController.updateUserRole);
router.post('/users/:userId/suspend', adminController.suspendUser);
router.post('/users/:userId/reactivate', adminController.reactivateUser);

// License Management Routes
router.get('/licenses/pending', adminController.getPendingLicenses);
router.post('/licenses/:userId/approve', adminController.approveLicense);
router.post('/licenses/:userId/reject', adminController.rejectLicense);

// Feature Flag Management Routes
router.get('/feature-flags', adminController.getAllFeatureFlags);
router.post('/feature-flags', adminController.createFeatureFlag);
router.put('/feature-flags/:flagId', adminController.updateFeatureFlag);

// System Analytics
router.get('/analytics', adminController.getSystemAnalytics);

export default router;