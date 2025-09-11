import express from 'express';
import {
   createCondition,
   getConditions,
   updateCondition,
   deleteCondition,
} from '../controllers/patientResourcesController';
import { auth } from '../middlewares/auth';
import {
   requirePatientPermission,
   checkPharmacyAccess,
} from '../middlewares/patientRBAC';
import {
   validateRequest,
   createConditionSchema,
   updateConditionSchema,
   conditionParamsSchema,
   paginationSchema,
} from '../validators/patientValidators';

const router = express.Router();

/**
 * Patient Condition Routes
 * Base path: /api/patients/:id/conditions
 * Individual condition path: /api/conditions/:conditionId
 */

// ===============================
// PATIENT-SCOPED CONDITION ROUTES
// ===============================

/**
 * POST /api/patients/:id/conditions
 * Add new condition to patient
 */
router.post(
   '/:id/conditions',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('create'),
   validateRequest(conditionParamsSchema, 'params'),
   validateRequest(createConditionSchema, 'body'),
   createCondition
);

/**
 * GET /api/patients/:id/conditions
 * Get all conditions for a patient with pagination and filtering
 */
router.get(
   '/:id/conditions',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('read'),
   validateRequest(conditionParamsSchema, 'params'),
   validateRequest(paginationSchema, 'query'),
   getConditions
);

// ===============================
// INDIVIDUAL CONDITION ROUTES
// ===============================

/**
 * PATCH /api/conditions/:conditionId
 * Update condition information
 */
router.patch(
   '/conditions/:conditionId',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('update'),
   validateRequest(conditionParamsSchema.pick({ conditionId: true }), 'params'),
   validateRequest(updateConditionSchema, 'body'),
   updateCondition
);

/**
 * DELETE /api/conditions/:conditionId
 * Delete condition (soft delete)
 */
router.delete(
   '/conditions/:conditionId',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('delete'),
   validateRequest(conditionParamsSchema.pick({ conditionId: true }), 'params'),
   deleteCondition
);

export default router;
