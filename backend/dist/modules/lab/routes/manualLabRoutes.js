"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const manualLabController_1 = require("../controllers/manualLabController");
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = __importDefault(require("../../../middlewares/rbac"));
const manualLabValidators_1 = require("../validators/manualLabValidators");
const router = express_1.default.Router();
router.use(auth_1.auth);
const orderCreationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many order creation attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const pdfAccessLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: 'Too many PDF access attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const tokenScanLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many scan attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/', orderCreationLimiter, rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.createManualLabOrderSchema, 'body'), manualLabController_1.createManualLabOrder);
router.get('/', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderQuerySchema, 'query'), manualLabController_1.getManualLabOrders);
router.get('/scan', tokenScanLimiter, rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.tokenQuerySchema, 'query'), manualLabController_1.resolveOrderToken);
router.get('/patient/:patientId', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.patientParamsSchema, 'params'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.patientOrderQuerySchema, 'query'), manualLabController_1.getPatientLabOrders);
router.get('/:orderId', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderParamsSchema, 'params'), manualLabController_1.getManualLabOrder);
router.put('/:orderId/status', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderParamsSchema, 'params'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.updateOrderStatusSchema, 'body'), manualLabController_1.updateOrderStatus);
router.post('/:orderId/results', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderParamsSchema, 'params'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.addResultsSchema, 'body'), manualLabController_1.addLabResults);
router.get('/:orderId/results', rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderParamsSchema, 'params'), manualLabController_1.getLabResults);
router.get('/:orderId/pdf', pdfAccessLimiter, rbac_1.default.requireRole('pharmacist', 'owner'), (0, manualLabValidators_1.validateRequest)(manualLabValidators_1.orderParamsSchema, 'params'), manualLabController_1.servePDFRequisition);
router.use((error, req, res, next) => {
    console.error('Manual Lab API Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?._id,
        workplaceId: req.user?.workplaceId,
    });
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
    res.status(500).json({
        success: false,
        message: 'Internal server error in manual lab module',
        code: 'INTERNAL_ERROR',
    });
});
exports.default = router;
//# sourceMappingURL=manualLabRoutes.js.map