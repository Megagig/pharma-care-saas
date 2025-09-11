import express from 'express';
import {
   createVisit,
   getVisits,
   getVisit,
   updateVisit,
   addVisitAttachment,
} from '../controllers/patientResourcesController';
import { auth } from '../middlewares/auth';
import {
   requirePatientPermission,
   checkPharmacyAccess,
} from '../middlewares/patientRBAC';
import {
   validateRequest,
   createVisitSchema,
   updateVisitSchema,
   visitParamsSchema,
   paginationSchema,
   attachmentSchema,
} from '../validators/patientValidators';

const router = express.Router();

/**
 * Patient Visit Routes
 * Base path: /api/patients/:id/visits
 * Individual visit path: /api/visits/:visitId
 */

// ===============================
// PATIENT-SCOPED VISIT ROUTES
// ===============================

/**
 * POST /api/patients/:id/visits
 * Create new visit for patient with SOAP notes
 */
router.post(
   '/:id/visits',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('create'),
   validateRequest(visitParamsSchema.pick({ id: true }), 'params'),
   validateRequest(createVisitSchema, 'body'),
   createVisit
);

/**
 * GET /api/patients/:id/visits
 * Get all visits for a patient with pagination
 * Sorted by visit date (most recent first)
 */
router.get(
   '/:id/visits',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('read'),
   validateRequest(visitParamsSchema.pick({ id: true }), 'params'),
   validateRequest(paginationSchema, 'query'),
   getVisits
);

// ===============================
// INDIVIDUAL VISIT ROUTES
// ===============================

/**
 * GET /api/visits/:visitId
 * Get detailed visit information with patient details
 */
router.get(
   '/visits/:visitId',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('read'),
   validateRequest(visitParamsSchema.pick({ visitId: true }), 'params'),
   getVisit
);

/**
 * PATCH /api/visits/:visitId
 * Update visit information and SOAP notes
 */
router.patch(
   '/visits/:visitId',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('update'),
   validateRequest(visitParamsSchema.pick({ visitId: true }), 'params'),
   validateRequest(updateVisitSchema, 'body'),
   updateVisit
);

/**
 * POST /api/visits/:visitId/attachments
 * Add attachment to visit (lab results, images, etc.)
 */
router.post(
   '/visits/:visitId/attachments',
   auth,
   checkPharmacyAccess,
   requirePatientPermission('create'),
   validateRequest(visitParamsSchema.pick({ visitId: true }), 'params'),
   validateRequest(attachmentSchema, 'body'),
   addVisitAttachment
);

export default router;
