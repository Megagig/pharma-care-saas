import express from 'express';
import rateLimit from 'express-rate-limit';

// Import controllers
import {
    createManualLabOrder,
    getManualLabOrder,
    getPatientLabOrders,
    updateOrderStatus,
    getManualLabOrders,
    addLabResults,
    getLabResults,
    resolveOrderToken,
    servePDFRequisition,
} from '../controllers/manualLabController';

// Import middleware
import { auth } from '../../../middlewares/auth';
import rbac from '../../../middlewares/rbac';

// Import validators
import {
    validateRequest,
    createManualLabOrderSchema,
    updateOrderStatusSchema,
    orderParamsSchema,
    patientParamsSchema,
    orderQuerySchema,
    patientOrderQuerySchema,
    addResultsSchema,
    tokenQuerySchema,
} from '../validators/manualLabValidators';

// Import error handler
import { asyncHandler } from '../../../utils/responseHelpers';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Rate limiting for order creation and PDF generation
const orderCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each user to 10 order creations per windowMs
    message: {
        success: false,
        message: 'Too many order creation attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for PDF access
const pdfAccessLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limit each user to 50 PDF accesses per windowMs
    message: {
        success: false,
        message: 'Too many PDF access attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for token scanning
const tokenScanLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each user to 30 token scans per minute
    message: {
        success: false,
        message: 'Too many scan attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ===============================
// ORDER MANAGEMENT ROUTES
// ===============================

/**
 * POST /api/manual-lab-orders
 * Create new lab order with PDF generation
 * Requires: pharmacist or owner role
 */
router.post(
    '/',
    orderCreationLimiter,
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(createManualLabOrderSchema, 'body'),
    createManualLabOrder
);

/**
 * GET /api/manual-lab-orders
 * List orders with filtering and pagination (admin/management endpoint)
 * Requires: pharmacist or owner role
 */
router.get(
    '/',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderQuerySchema, 'query'),
    getManualLabOrders
);

/**
 * GET /api/manual-lab-orders/scan
 * Resolve QR/barcode tokens to order details
 * Requires: pharmacist or owner role
 */
router.get(
    '/scan',
    tokenScanLimiter,
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(tokenQuerySchema, 'query'),
    resolveOrderToken
);

/**
 * GET /api/manual-lab-orders/patient/:patientId
 * Get patient order history
 * Requires: pharmacist or owner role
 */
router.get(
    '/patient/:patientId',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(patientParamsSchema, 'params'),
    validateRequest(patientOrderQuerySchema, 'query'),
    getPatientLabOrders
);

/**
 * GET /api/manual-lab-orders/:orderId
 * Retrieve order details
 * Requires: pharmacist or owner role
 */
router.get(
    '/:orderId',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderParamsSchema, 'params'),
    getManualLabOrder
);

/**
 * PUT /api/manual-lab-orders/:orderId/status
 * Update order status
 * Requires: pharmacist or owner role
 */
router.put(
    '/:orderId/status',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderParamsSchema, 'params'),
    validateRequest(updateOrderStatusSchema, 'body'),
    updateOrderStatus
);

// ===============================
// RESULT MANAGEMENT ROUTES
// ===============================

/**
 * POST /api/manual-lab-orders/:orderId/results
 * Submit lab results
 * Requires: pharmacist or owner role
 */
router.post(
    '/:orderId/results',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderParamsSchema, 'params'),
    validateRequest(addResultsSchema, 'body'),
    addLabResults
);

/**
 * GET /api/manual-lab-orders/:orderId/results
 * Retrieve entered results
 * Requires: pharmacist or owner role
 */
router.get(
    '/:orderId/results',
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderParamsSchema, 'params'),
    getLabResults
);

// ===============================
// PDF AND SCANNING ROUTES
// ===============================

/**
 * GET /api/manual-lab-orders/:orderId/pdf
 * Serve generated PDF requisition
 * Requires: pharmacist or owner role
 */
router.get(
    '/:orderId/pdf',
    pdfAccessLimiter,
    rbac.requireRole('pharmacist', 'owner'),
    validateRequest(orderParamsSchema, 'params'),
    servePDFRequisition
);

// ===============================
// ERROR HANDLING
// ===============================

// Manual lab specific error handler
router.use((error: any, req: any, res: any, next: any) => {
    // Log the error
    console.error('Manual Lab API Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?._id,
        workplaceId: req.user?.workplaceId,
    });

    // Handle specific manual lab errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.message,
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID',
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry detected',
            code: 'DUPLICATE_ERROR',
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error in manual lab module',
        code: 'INTERNAL_ERROR',
    });
});

export default router;