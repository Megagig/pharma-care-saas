"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../../../middlewares/auth");
const auditMiddleware_1 = require("../../../middlewares/auditMiddleware");
const drugInteractionController_1 = __importDefault(require("../controllers/drugInteractionController"));
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
router.post('/check', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)('CHECK_DRUG_INTERACTIONS', 'clinical_documentation'), validateRequest(validators_1.validateInteractionCheck), drugInteractionController_1.default.checkDrugInteractions);
router.get('/drug-info', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)('GET_DRUG_INFO', 'data_access'), drugInteractionController_1.default.getDrugInformation);
router.get('/search', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)('SEARCH_DRUGS', 'data_access'), drugInteractionController_1.default.searchDrugs);
router.post('/check-allergies', interactionRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)('CHECK_ALLERGY_CONTRAINDICATIONS', 'clinical_documentation'), drugInteractionController_1.default.checkAllergyInteractions);
exports.default = router;
//# sourceMappingURL=interactionRoutes.js.map