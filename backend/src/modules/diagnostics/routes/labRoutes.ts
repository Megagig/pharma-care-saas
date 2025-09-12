import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { auth, requireFeature, requireLicense } from '../../../middlewares/auth';
import { auditLogger } from '../../../middlewares/auditMiddleware';
import labController from '../controllers/labController';
import {
    validateLabOrder,
    validateLabResult,
    validateFHIRImport,
    formatValidationErrors
} from '../utils/validators';

const router = Router();

// Rate limiting for lab endpoints
const labRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 300 : 150, // 150 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many lab requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation middleware
const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
    const { error } = schema(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formatValidationErrors(error)
        });
    }
    next();
};

// =============================================
// LAB ORDER ROUTES
// =============================================

/**
 * @route POST /api/lab/orders
 * @desc Create new lab order
 * @access Private (requires license and lab_integration feature)
 */
router.post(
    '/orders',
    labRateLimit,
    auth,
    requireLicense,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'CREATE_LAB_ORDER',
        resourceType: 'LabOrder',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'medium'
    }),
    validateRequest(validateLabOrder),
    labController.createOrder
);

/**
 * @route GET /api/lab/orders
 * @desc Get lab orders with optional filters
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/orders',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_ORDERS',
        resourceType: 'LabOrder',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getOrders
);

/**
 * @route GET /api/lab/orders/:orderId
 * @desc Get specific lab order
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/orders/:orderId',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_ORDER',
        resourceType: 'LabOrder',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getOrder
);

/**
 * @route PATCH /api/lab/orders/:orderId/status
 * @desc Update lab order status
 * @access Private (requires license)
 */
router.patch(
    '/orders/:orderId/status',
    labRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'UPDATE_LAB_ORDER_STATUS',
        resourceType: 'LabOrder',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'medium'
    }),
    labController.updateOrderStatus
);

/**
 * @route POST /api/lab/orders/:orderId/cancel
 * @desc Cancel lab order
 * @access Private (requires license)
 */
router.post(
    '/orders/:orderId/cancel',
    labRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'CANCEL_LAB_ORDER',
        resourceType: 'LabOrder',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'medium'
    }),
    labController.cancelOrder
);

/**
 * @route POST /api/lab/orders/:orderId/export
 * @desc Export lab order to FHIR format
 * @access Private (requires license and fhir_integration feature)
 */
router.post(
    '/orders/:orderId/export',
    labRateLimit,
    auth,
    requireLicense,
    requireFeature('fhir_integration'),
    auditLogger({
        action: 'EXPORT_LAB_ORDER_FHIR',
        resourceType: 'LabOrder',
        complianceCategory: 'data_export',
        riskLevel: 'medium'
    }),
    labController.exportOrder
);

// =============================================
// LAB RESULT ROUTES
// =============================================

/**
 * @route POST /api/lab/results
 * @desc Add new lab result
 * @access Private (requires license and lab_integration feature)
 */
router.post(
    '/results',
    labRateLimit,
    auth,
    requireLicense,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'ADD_LAB_RESULT',
        resourceType: 'LabResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    validateRequest(validateLabResult),
    labController.addResult
);

/**
 * @route GET /api/lab/results
 * @desc Get lab results with optional filters
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/results',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_RESULTS',
        resourceType: 'LabResult',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getResults
);

/**
 * @route GET /api/lab/results/:resultId
 * @desc Get specific lab result
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/results/:resultId',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_RESULT',
        resourceType: 'LabResult',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getResult
);

/**
 * @route PATCH /api/lab/results/:resultId
 * @desc Update lab result
 * @access Private (requires license)
 */
router.patch(
    '/results/:resultId',
    labRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'UPDATE_LAB_RESULT',
        resourceType: 'LabResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    validateRequest(validateLabResult),
    labController.updateResult
);

/**
 * @route DELETE /api/lab/results/:resultId
 * @desc Delete lab result (soft delete)
 * @access Private (requires license)
 */
router.delete(
    '/results/:resultId',
    labRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'DELETE_LAB_RESULT',
        resourceType: 'LabResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    labController.deleteResult
);

/**
 * @route GET /api/lab/results/critical
 * @desc Get critical lab results
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/results/critical',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_CRITICAL_LAB_RESULTS',
        resourceType: 'LabResult',
        complianceCategory: 'data_access',
        riskLevel: 'medium'
    }),
    labController.getCriticalResults
);

/**
 * @route GET /api/lab/results/abnormal/:patientId
 * @desc Get abnormal lab results for patient
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/results/abnormal/:patientId',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_ABNORMAL_LAB_RESULTS',
        resourceType: 'LabResult',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getAbnormalResults
);

// =============================================
// TREND ANALYSIS ROUTES
// =============================================

/**
 * @route GET /api/lab/trends/:patientId/:testCode
 * @desc Get lab result trends for specific test
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/trends/:patientId/:testCode',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_TRENDS',
        resourceType: 'LabResult',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getTrends
);

// =============================================
// FHIR INTEGRATION ROUTES
// =============================================

/**
 * @route POST /api/lab/import/fhir
 * @desc Import lab results from FHIR bundle
 * @access Private (requires license and fhir_integration feature)
 */
router.post(
    '/import/fhir',
    labRateLimit,
    auth,
    requireLicense,
    requireFeature('fhir_integration'),
    auditLogger({
        action: 'IMPORT_LAB_RESULTS_FHIR',
        resourceType: 'LabResult',
        complianceCategory: 'data_import',
        riskLevel: 'high'
    }),
    validateRequest(validateFHIRImport),
    labController.importFHIR
);

// =============================================
// REFERENCE DATA ROUTES
// =============================================

/**
 * @route GET /api/lab/catalog
 * @desc Get lab test catalog
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/catalog',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_LAB_CATALOG',
        resourceType: 'LabCatalog',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getTestCatalog
);

/**
 * @route GET /api/lab/reference-ranges/:testCode
 * @desc Get reference ranges for specific test
 * @access Private (requires lab_integration feature)
 */
router.get(
    '/reference-ranges/:testCode',
    labRateLimit,
    auth,
    requireFeature('lab_integration'),
    auditLogger({
        action: 'VIEW_REFERENCE_RANGES',
        resourceType: 'ReferenceRange',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    labController.getReferenceRanges
);

export default router;