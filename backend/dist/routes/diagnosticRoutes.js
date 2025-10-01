"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const diagnosticController_1 = require("../controllers/diagnosticController");
const diagnosticValidators_1 = require("../validators/diagnosticValidators");
const auth_1 = require("../middlewares/auth");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const router = (0, express_1.Router)();
const aiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 50 : 10,
    message: {
        success: false,
        message: 'Too many AI diagnostic requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const diagnosticRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 200 : 100,
    message: {
        success: false,
        message: 'Too many diagnostic requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const extendTimeout = (req, res, next) => {
    req.setTimeout(90000);
    res.setTimeout(90000);
    next();
};
router.post('/ai', extendTimeout, aiRateLimit, auth_1.auth, auth_1.requireLicense, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('AI_DIAGNOSTIC_REQUEST', 'clinical_documentation'), diagnosticValidators_1.validateDiagnosticAnalysis, diagnosticController_1.generateDiagnosticAnalysis);
router.post('/cases/:caseId/decision', diagnosticRateLimit, auth_1.auth, auth_1.requireLicense, (0, auditMiddleware_1.auditLogger)('DIAGNOSTIC_DECISION', 'clinical_documentation'), diagnosticValidators_1.validateDiagnosticDecision, diagnosticController_1.saveDiagnosticDecision);
router.get('/patients/:patientId/history', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('VIEW_DIAGNOSTIC_HISTORY', 'data_access'), diagnosticValidators_1.validateDiagnosticHistory, diagnosticController_1.getDiagnosticHistory);
router.get('/cases/all', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('VIEW_ALL_DIAGNOSTIC_CASES', 'data_access'), diagnosticController_1.getAllDiagnosticCases);
router.get('/cases/:caseId', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('VIEW_DIAGNOSTIC_CASE', 'data_access'), diagnosticValidators_1.validateGetDiagnosticCase, diagnosticController_1.getDiagnosticCase);
router.post('/interactions', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('drug_information'), (0, auditMiddleware_1.auditLogger)('DRUG_INTERACTION_CHECK', 'clinical_documentation'), diagnosticValidators_1.validateDrugInteractions, diagnosticController_1.checkDrugInteractions);
router.post('/cases/:caseId/notes', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('SAVE_DIAGNOSTIC_NOTES', 'clinical_documentation'), diagnosticController_1.saveDiagnosticNotes);
router.get('/ai/test', auth_1.auth, (0, auditMiddleware_1.auditLogger)('AI_CONNECTION_TEST', 'system_security'), diagnosticController_1.testAIConnection);
router.post('/history/:historyId/notes', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('ADD_DIAGNOSTIC_HISTORY_NOTE', 'clinical_documentation'), diagnosticController_1.addDiagnosticHistoryNote);
router.get('/analytics', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('VIEW_DIAGNOSTIC_ANALYTICS', 'data_access'), diagnosticController_1.getDiagnosticAnalytics);
router.get('/referrals', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('VIEW_DIAGNOSTIC_REFERRALS', 'data_access'), diagnosticController_1.getDiagnosticReferrals);
router.get('/history/:historyId/export/pdf', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('EXPORT_DIAGNOSTIC_HISTORY_PDF', 'data_export'), diagnosticController_1.exportDiagnosticHistoryPDF);
router.post('/history/:historyId/referral/generate', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('GENERATE_REFERRAL_DOCUMENT', 'clinical_documentation'), diagnosticController_1.generateReferralDocument);
router.post('/history/compare', diagnosticRateLimit, auth_1.auth, (0, auth_1.requireFeature)('clinical_decision_support'), (0, auditMiddleware_1.auditLogger)('COMPARE_DIAGNOSTIC_HISTORIES', 'data_analysis'), diagnosticController_1.compareDiagnosticHistories);
exports.default = router;
//# sourceMappingURL=diagnosticRoutes.js.map