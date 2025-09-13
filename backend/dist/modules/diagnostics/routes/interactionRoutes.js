"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../../../middlewares/auth");
const auditMiddleware_1 = require("../../../middlewares/auditMiddleware");
const interactionController_1 = __importDefault(require("../controllers/interactionController"));
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
const interactionRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 200 : 100,
    message: {
        success: false,
        message: 'Too many interaction check requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: (0, validators_1.formatValidationErrors)(error)
        });
    }
    next();
};
router.post('/check', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'CHECK_DRUG_INTERACTIONS',
    resourceType: 'DrugInteraction',
    complianceCategory: 'clinical_documentation',
    riskLevel: 'medium'
}), validateRequest(validators_1.validateInteractionCheck), interactionController_1.default.checkInteractions);
router.get('/drug-info', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'GET_DRUG_INFO',
    resourceType: 'DrugInfo',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.getDrugInfo);
router.get('/search', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'SEARCH_DRUGS',
    resourceType: 'DrugSearch',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.searchDrugs);
router.post('/check-allergies', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'CHECK_ALLERGY_CONTRAINDICATIONS',
    resourceType: 'AllergyCheck',
    complianceCategory: 'clinical_documentation',
    riskLevel: 'medium'
}), interactionController_1.default.checkAllergies);
router.get('/details', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'GET_INTERACTION_DETAILS',
    resourceType: 'InteractionDetails',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.getInteractionDetails);
router.get('/class-interactions', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'GET_CLASS_INTERACTIONS',
    resourceType: 'ClassInteractions',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.getClassInteractions);
router.get('/food-interactions', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'GET_FOOD_INTERACTIONS',
    resourceType: 'FoodInteractions',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.getFoodInteractions);
router.get('/pregnancy-info', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)({
    action: 'GET_PREGNANCY_INFO',
    resourceType: 'PregnancyInfo',
    complianceCategory: 'data_access',
    riskLevel: 'low'
}), interactionController_1.default.getPregnancyInfo);
exports.default = router;
//# sourceMappingURL=interactionRoutes.js.map