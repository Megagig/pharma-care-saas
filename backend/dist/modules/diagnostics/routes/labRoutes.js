"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const labController_1 = require("../controllers/labController");
const fhirConfigController_1 = require("../controllers/fhirConfigController");
const auth_1 = require("../../../middlewares/auth");
const authWithWorkspace_1 = require("../../../middlewares/authWithWorkspace");
const diagnosticRBAC_1 = require("../middlewares/diagnosticRBAC");
const rbac_1 = require("../../../middlewares/rbac");
const labValidators_1 = require("../validators/labValidators");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(authWithWorkspace_1.authWithWorkspace);
router.post('/orders', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireLabIntegrationFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:create_order'), (0, labValidators_1.validateRequest)(labValidators_1.createLabOrderSchema, 'body'), labController_1.createLabOrder);
router.get('/orders', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), (0, labValidators_1.validateRequest)(labValidators_1.labOrderQuerySchema, 'query'), labController_1.getLabOrders);
router.get('/orders/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), (0, labValidators_1.validateRequest)(labValidators_1.labOrderParamsSchema, 'params'), labController_1.getLabOrder);
router.patch('/orders/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:update_order'), (0, labValidators_1.validateRequest)(labValidators_1.labOrderParamsSchema, 'params'), (0, labValidators_1.validateRequest)(labValidators_1.updateLabOrderSchema, 'body'), labController_1.updateLabOrder);
router.delete('/orders/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:cancel_order'), (0, labValidators_1.validateRequest)(labValidators_1.labOrderParamsSchema, 'params'), labController_1.cancelLabOrder);
router.post('/results', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireLabIntegrationFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:add_result'), (0, labValidators_1.validateRequest)(labValidators_1.createLabResultSchema, 'body'), labController_1.addLabResult);
router.get('/results', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), (0, labValidators_1.validateRequest)(labValidators_1.labResultQuerySchema, 'query'), labController_1.getLabResults);
router.get('/results/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), (0, labValidators_1.validateRequest)(labValidators_1.labResultParamsSchema, 'params'), labController_1.getLabResult);
router.patch('/results/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:update_result'), (0, labValidators_1.validateRequest)(labValidators_1.labResultParamsSchema, 'params'), (0, labValidators_1.validateRequest)(labValidators_1.updateLabResultSchema, 'body'), labController_1.updateLabResult);
router.delete('/results/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:delete_result'), (0, labValidators_1.validateRequest)(labValidators_1.labResultParamsSchema, 'params'), labController_1.deleteLabResult);
router.get('/trends/:patientId/:testCode', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), (0, labValidators_1.validateRequest)(labValidators_1.labTrendsParamsSchema, 'params'), (0, labValidators_1.validateRequest)(labValidators_1.labTrendsQuerySchema, 'query'), labController_1.getLabResultTrends);
router.get('/dashboard', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read'), labController_1.getLabDashboard);
router.post('/import/fhir', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireLabIntegrationFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:import_fhir'), (0, labValidators_1.validateRequest)(labValidators_1.importFHIRSchema, 'body'), labController_1.importFHIRResults);
router.post('/export/fhir/:orderId', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireLabIntegrationFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:export_fhir'), (0, labValidators_1.validateRequest)(labValidators_1.labOrderParamsSchema, 'params'), labController_1.exportLabOrderToFHIR);
router.post('/sync/fhir/:patientId', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireLabIntegrationFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:sync_fhir'), labController_1.syncLabResultsFromFHIR);
router.get('/fhir/test-connection', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:test_fhir'), labController_1.testFHIRConnection);
router.get('/fhir/config', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read_fhir_config'), fhirConfigController_1.getFHIRConfigs);
router.get('/fhir/config/defaults', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read_fhir_config'), fhirConfigController_1.getDefaultFHIRConfigs);
router.get('/fhir/config/:id', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read_fhir_config'), fhirConfigController_1.getFHIRConfig);
router.post('/fhir/config/test', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:test_fhir_config'), fhirConfigController_1.testFHIRConfig);
router.get('/fhir/capabilities', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read_fhir_config'), fhirConfigController_1.getFHIRCapabilities);
router.get('/fhir/status', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('lab:read_fhir_config'), fhirConfigController_1.getFHIRStatus);
router.use((error, req, res, next) => {
    console.error('Lab API Error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    if (error.message.includes('lab order')) {
        return res.status(400).json({
            success: false,
            message: 'Lab order operation failed',
            code: 'LAB_ORDER_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('lab result')) {
        return res.status(400).json({
            success: false,
            message: 'Lab result operation failed',
            code: 'LAB_RESULT_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('FHIR')) {
        return res.status(400).json({
            success: false,
            message: 'FHIR import operation failed',
            code: 'FHIR_IMPORT_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('reference range')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid reference range',
            code: 'REFERENCE_RANGE_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('LOINC')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid LOINC code',
            code: 'LOINC_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('test code')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid test code',
            code: 'TEST_CODE_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('interpretation')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid result interpretation',
            code: 'INTERPRETATION_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('external lab')) {
        return res.status(502).json({
            success: false,
            message: 'External lab system error',
            code: 'EXTERNAL_LAB_ERROR',
            details: 'Unable to connect to external lab system. Please try again later.',
        });
    }
    if (error.message.includes('FHIR bundle')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid FHIR bundle format',
            code: 'FHIR_BUNDLE_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('patient mapping')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid patient mapping',
            code: 'PATIENT_MAPPING_ERROR',
            details: error.message,
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            message: 'Data validation failed',
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map((err) => err.message),
        });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID',
            details: 'The provided ID is not in the correct format',
        });
    }
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate resource',
            code: 'DUPLICATE_ERROR',
            details: 'A resource with this identifier already exists',
        });
    }
    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_ERROR',
            details: 'Too many requests. Please try again later.',
        });
    }
    if (error.status === 402) {
        return res.status(402).json({
            success: false,
            message: 'Subscription required',
            code: 'SUBSCRIPTION_ERROR',
            details: error.message,
            upgradeRequired: true,
        });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File too large',
            code: 'FILE_SIZE_ERROR',
            details: 'FHIR bundle file exceeds maximum allowed size',
        });
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        return res.status(504).json({
            success: false,
            message: 'Operation timeout',
            code: 'TIMEOUT_ERROR',
            details: 'The operation took too long to complete. Please try again.',
        });
    }
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error,
        }),
    });
});
exports.default = router;
//# sourceMappingURL=labRoutes.js.map