"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mtrController_1 = require("../controllers/mtrController");
const mtrReportsController_1 = require("../controllers/mtrReportsController");
const auth_1 = require("../middlewares/auth");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const mtrValidators_1 = require("../validators/mtrValidators");
const mtrValidation_1 = require("../middlewares/mtrValidation");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireLicense);
router.use(auditMiddleware_1.auditTimer);
router.use(mtrValidation_1.mtrValidationMiddleware.validateMTRAccess);
router.use(mtrValidation_1.mtrValidationMiddleware.validateMTRBusinessLogic);
router.get('/', mtrValidators_1.mtrQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (0, auditMiddleware_1.auditMTRActivity)('VIEW_MTR_SESSIONS'), mtrController_1.getMTRSessions);
router.post('/', mtrValidators_1.createMTRSessionSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (0, auditMiddleware_1.auditMTRActivity)('CREATE_MTR_SESSION'), mtrController_1.createMTRSession);
router.get('/:id', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (0, auditMiddleware_1.auditMTRActivity)('VIEW_MTR_SESSION'), mtrController_1.getMTRSession);
router.put('/:id', [...mtrValidators_1.mtrParamsSchema, ...mtrValidators_1.updateMTRSessionSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (0, auditMiddleware_1.auditMTRActivity)('UPDATE_MTR_SESSION'), mtrController_1.updateMTRSession);
router.delete('/:id', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (0, auditMiddleware_1.auditMTRActivity)('DELETE_MTR_SESSION'), mtrController_1.deleteMTRSession);
router.put('/:id/step/:stepName', [...mtrValidators_1.mtrParamsSchema, ...mtrValidators_1.updateStepSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, (req, res, next) => {
    if (req.params.stepName === 'medicationHistory' && req.body.data?.medications) {
        return mtrValidation_1.mtrValidationMiddleware.validateMedicationHistory(req, res, next);
    }
    next();
}, (req, res, next) => {
    if (req.params.stepName === 'planDevelopment' && req.body.data?.plan) {
        return mtrValidation_1.mtrValidationMiddleware.validateTherapyPlan(req, res, next);
    }
    next();
}, mtrController_1.updateMTRStep);
router.get('/:id/progress', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getMTRProgress);
router.get('/patient/:patientId', [...mtrValidators_1.patientParamsSchema, ...mtrValidators_1.mtrQuerySchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getPatientMTRHistory);
router.post('/patient/:patientId', [...mtrValidators_1.patientParamsSchema, ...mtrValidators_1.createMTRSessionSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.createPatientMTRSession);
router.get('/:id/problems', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getMTRProblems);
router.post('/:id/problems', [...mtrValidators_1.mtrParamsSchema, ...mtrValidators_1.createProblemSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.createMTRProblem);
router.put('/:id/problems/:problemId', [...mtrValidators_1.problemParamsSchema, ...mtrValidators_1.updateProblemSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.updateMTRProblem);
router.delete('/:id/problems/:problemId', mtrValidators_1.problemParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.deleteMTRProblem);
router.get('/:id/interventions', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getMTRInterventions);
router.post('/:id/interventions', [...mtrValidators_1.mtrParamsSchema, ...mtrValidators_1.createInterventionSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.createMTRIntervention);
router.put('/:id/interventions/:interventionId', [...mtrValidators_1.interventionParamsSchema, ...mtrValidators_1.updateInterventionSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.updateMTRIntervention);
router.get('/:id/followups', mtrValidators_1.mtrParamsSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getMTRFollowUps);
router.post('/:id/followups', [...mtrValidators_1.mtrParamsSchema, ...mtrValidators_1.createFollowUpSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.createMTRFollowUp);
router.put('/:id/followups/:followupId', [...mtrValidators_1.followUpParamsSchema, ...mtrValidators_1.updateFollowUpSchema], mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.updateMTRFollowUp);
router.get('/reports/summary', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrReportsController_1.getMTRSummaryReport);
router.get('/reports/interventions', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrReportsController_1.getInterventionEffectivenessReport);
router.get('/reports/pharmacists', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrReportsController_1.getPharmacistPerformanceReport);
router.get('/reports/quality', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrReportsController_1.getQualityAssuranceReport);
router.get('/reports/outcomes', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrReportsController_1.getOutcomeMetricsReport);
router.get('/reports/audit', mtrValidators_1.reportsQuerySchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.getMTRAuditTrail);
router.post('/check-interactions', mtrValidators_1.drugInteractionSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.checkDrugInteractions);
router.post('/check-duplicates', mtrValidators_1.drugInteractionSchema, mtrValidation_1.mtrValidationMiddleware.handleValidationErrors, mtrController_1.checkDuplicateTherapies);
exports.default = router;
//# sourceMappingURL=mtrRoutes.js.map