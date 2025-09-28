import express from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientSummary,
  getPatientInterventions,
  searchPatientsWithInterventions,
} from '../controllers/patientController';
import { auth } from '../middlewares/auth';
import {
  requirePatientRead,
  requirePatientCreate,
  requirePatientUpdate,
  requirePatientDelete,
  checkPharmacyAccess,
  checkPatientPlanLimits,
} from '../middlewares/patientRBAC';
import {
  validateRequest,
  createPatientSchema,
  updatePatientSchema,
  patientParamsSchema,
  searchSchema,
} from '../validators/patientValidators';
import { patientManagementErrorHandler } from '../utils/responseHelpers';
import { patientListCacheMiddleware, searchCacheMiddleware } from '../middlewares/cacheMiddleware';
import { responseOptimizationMiddleware, OptimizationPresets } from '../utils/payloadOptimization';

const router = express.Router();

// Apply authentication and pharmacy access check to all routes
router.use(auth);
router.use(checkPharmacyAccess);

// GET /api/patients - List patients with search and pagination
router.get(
  '/',
  requirePatientRead,
  validateRequest(searchSchema, 'query'),
  // Temporarily disable optimization middleware - it was causing empty responses
  // responseOptimizationMiddleware(
  //   OptimizationPresets.list.projection,
  //   OptimizationPresets.list.optimization
  // ),
  // Temporarily disable cache middleware - it was returning empty results
  // patientListCacheMiddleware,
  getPatients
);

// GET /api/patients/search - Search patients
router.get('/search',
  requirePatientRead,
  responseOptimizationMiddleware(
    OptimizationPresets.mobile.projection,
    OptimizationPresets.mobile.optimization
  ),
  searchCacheMiddleware,
  searchPatients
);

// GET /api/patients/search-with-interventions - Search patients with intervention context
router.get('/search-with-interventions', requirePatientRead, searchPatientsWithInterventions);

// POST /api/patients - Create new patient
router.post(
  '/',
  requirePatientCreate,
  checkPatientPlanLimits,
  validateRequest(createPatientSchema, 'body'),
  createPatient
);

// GET /api/patients/:id - Get patient details
router.get(
  '/:id',
  requirePatientRead,
  validateRequest(patientParamsSchema, 'params'),
  getPatient
);

// GET /api/patients/:id/summary - Get patient summary
router.get(
  '/:id/summary',
  requirePatientRead,
  validateRequest(patientParamsSchema, 'params'),
  getPatientSummary
);

// GET /api/patients/:id/interventions - Get patient interventions
router.get(
  '/:id/interventions',
  requirePatientRead,
  validateRequest(patientParamsSchema, 'params'),
  getPatientInterventions
);

// PATCH /api/patients/:id - Update patient
router.patch(
  '/:id',
  requirePatientUpdate,
  validateRequest(patientParamsSchema, 'params'),
  validateRequest(updatePatientSchema, 'body'),
  updatePatient
);

// DELETE /api/patients/:id - Delete patient (soft delete)
router.delete(
  '/:id',
  requirePatientDelete,
  validateRequest(patientParamsSchema, 'params'),
  deletePatient
);

// Error handling middleware
router.use(patientManagementErrorHandler);

export default router;
