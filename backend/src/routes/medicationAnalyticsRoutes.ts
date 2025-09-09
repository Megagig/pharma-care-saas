import express from 'express';
import { auth } from '../middlewares/auth';
import {
  getEnhancedAdherenceAnalytics,
  getPrescriptionPatternAnalytics,
  getMedicationInteractionAnalytics,
} from '../controllers/medicationAnalyticsController';
import { validatePatientId } from '../validators/commonValidators';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Enhanced analytics endpoints
router.get(
  '/adherence/:patientId',
  validatePatientId,
  getEnhancedAdherenceAnalytics
);
router.get(
  '/prescriptions/:patientId',
  validatePatientId,
  getPrescriptionPatternAnalytics
);
router.get(
  '/interactions/:patientId',
  validatePatientId,
  getMedicationInteractionAnalytics
);

export default router;
