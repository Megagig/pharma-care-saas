"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const drugInteractionController_1 = require("../controllers/drugInteractionController");
const auth_1 = require("../../../middlewares/auth");
const authWithWorkspace_1 = require("../../../middlewares/authWithWorkspace");
const diagnosticRBAC_1 = require("../middlewares/diagnosticRBAC");
const rbac_1 = require("../../../middlewares/rbac");
const drugInteractionValidators_1 = require("../validators/drugInteractionValidators");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(authWithWorkspace_1.authWithWorkspace);
router.post('/check', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireDrugInteractionFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('drug_interactions:check'), (0, drugInteractionValidators_1.validateRequest)(drugInteractionValidators_1.checkInteractionsSchema, 'body'), drugInteractionController_1.checkDrugInteractions);
router.post('/drug-info', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireDrugInteractionFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('drug_interactions:lookup'), (0, drugInteractionValidators_1.validateRequest)(drugInteractionValidators_1.drugInfoSchema, 'body'), drugInteractionController_1.getDrugInformation);
router.post('/allergy-check', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireDrugInteractionFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('drug_interactions:allergy_check'), (0, drugInteractionValidators_1.validateRequest)(drugInteractionValidators_1.allergyCheckSchema, 'body'), drugInteractionController_1.checkAllergyInteractions);
router.post('/contraindications', rbac_1.requireActiveSubscription, diagnosticRBAC_1.requireDrugInteractionFeature, diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('drug_interactions:contraindications'), (0, drugInteractionValidators_1.validateRequest)(drugInteractionValidators_1.contraindicationCheckSchema, 'body'), drugInteractionController_1.checkContraindications);
router.get('/drug-search', diagnosticRBAC_1.requirePharmacistRole, (0, rbac_1.requirePermission)('drug_interactions:search'), (0, drugInteractionValidators_1.validateRequest)(drugInteractionValidators_1.drugSearchQuerySchema, 'query'), drugInteractionController_1.searchDrugs);
router.use((error, req, res, next) => {
    console.error('Drug Interaction API Error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    if (error.message.includes('RxNorm')) {
        return res.status(502).json({
            success: false,
            message: 'Drug database service temporarily unavailable',
            code: 'RXNORM_SERVICE_ERROR',
            details: 'Unable to connect to RxNorm service. Please try again later.',
        });
    }
    if (error.message.includes('OpenFDA')) {
        return res.status(502).json({
            success: false,
            message: 'FDA drug database temporarily unavailable',
            code: 'OPENFDA_SERVICE_ERROR',
            details: 'Unable to connect to OpenFDA service. Please try again later.',
        });
    }
    if (error.message.includes('drug interaction')) {
        return res.status(400).json({
            success: false,
            message: 'Drug interaction check failed',
            code: 'INTERACTION_CHECK_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('allergy')) {
        return res.status(400).json({
            success: false,
            message: 'Allergy check failed',
            code: 'ALLERGY_CHECK_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('contraindication')) {
        return res.status(400).json({
            success: false,
            message: 'Contraindication check failed',
            code: 'CONTRAINDICATION_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('drug search')) {
        return res.status(400).json({
            success: false,
            message: 'Drug search failed',
            code: 'DRUG_SEARCH_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('medication name')) {
        return res.status(422).json({
            success: false,
            message: 'Invalid medication name',
            code: 'INVALID_MEDICATION_NAME',
            details: error.message,
        });
    }
    if (error.message.includes('duplicate')) {
        return res.status(422).json({
            success: false,
            message: 'Duplicate entries detected',
            code: 'DUPLICATE_ENTRIES',
            details: error.message,
        });
    }
    if (error.status === 429 || error.message.includes('rate limit')) {
        return res.status(429).json({
            success: false,
            message: 'External API rate limit exceeded',
            code: 'EXTERNAL_RATE_LIMIT',
            details: 'Too many requests to external drug databases. Please try again later.',
        });
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        return res.status(504).json({
            success: false,
            message: 'External service timeout',
            code: 'EXTERNAL_TIMEOUT',
            details: 'External drug database request timed out. Please try again.',
        });
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(502).json({
            success: false,
            message: 'External service unavailable',
            code: 'EXTERNAL_SERVICE_UNAVAILABLE',
            details: 'Unable to connect to external drug databases. Please try again later.',
        });
    }
    if (error.status === 401 || error.message.includes('unauthorized')) {
        return res.status(502).json({
            success: false,
            message: 'External service authentication failed',
            code: 'EXTERNAL_AUTH_ERROR',
            details: 'Authentication with external drug database failed. Please contact support.',
        });
    }
    if (error.status === 403 || error.message.includes('quota')) {
        return res.status(502).json({
            success: false,
            message: 'External service quota exceeded',
            code: 'EXTERNAL_QUOTA_ERROR',
            details: 'External drug database quota exceeded. Please contact support.',
        });
    }
    if (error.message.includes('parse') || error.message.includes('JSON')) {
        return res.status(502).json({
            success: false,
            message: 'External service response error',
            code: 'EXTERNAL_RESPONSE_ERROR',
            details: 'Received invalid response from external drug database.',
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
            message: 'Invalid data format',
            code: 'INVALID_FORMAT',
            details: 'The provided data is not in the correct format',
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
    if (error.message.includes('feature not available')) {
        return res.status(402).json({
            success: false,
            message: 'Feature not available in current plan',
            code: 'FEATURE_UNAVAILABLE',
            details: 'Drug interaction checking requires a higher plan tier.',
            upgradeRequired: true,
        });
    }
    if (error.message.includes('cache')) {
        console.warn('Cache error (non-critical):', error.message);
        return res.status(200).json({
            success: true,
            message: 'Request completed with limited caching',
            warning: 'Some data may not be cached for faster future access',
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
//# sourceMappingURL=drugInteractionRoutes.js.map