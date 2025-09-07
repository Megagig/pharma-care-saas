"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clinicalInterventionController_1 = require("../controllers/clinicalInterventionController");
const auth_1 = require("../middlewares/auth");
const workspaceContext_1 = require("../middlewares/workspaceContext");
const rbac_1 = require("../middlewares/rbac");
const clinicalInterventionErrorHandler_1 = require("../middlewares/clinicalInterventionErrorHandler");
const clinicalInterventionRBAC_1 = require("../middlewares/clinicalInterventionRBAC");
const clinicalInterventionValidators_1 = require("../validators/clinicalInterventionValidators");
const validateRequest = (schema, location = 'body') => {
    return (req, res, next) => {
        next();
    };
};
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const auditInterventionActivity = (action) => {
    return (req, res, next) => {
        next();
    };
};
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(workspaceContext_1.loadWorkspaceContext);
router.use(workspaceContext_1.requireWorkspaceContext);
router.use(auditMiddleware_1.auditTimer);
router.get('/', (0, rbac_1.requirePermission)('clinical_intervention.read'), validateRequest(clinicalInterventionValidators_1.searchInterventionsSchema, 'query'), auditInterventionActivity('VIEW_INTERVENTIONS'), clinicalInterventionController_1.getClinicalInterventions);
router.post('/', clinicalInterventionErrorHandler_1.errorLoggingMiddleware, (0, rbac_1.requirePermission)('clinical_intervention.create'), clinicalInterventionRBAC_1.checkInterventionPlanLimits, clinicalInterventionValidators_1.validateCreateIntervention, auditInterventionActivity('CREATE_INTERVENTION'), (0, clinicalInterventionErrorHandler_1.asyncErrorHandler)(clinicalInterventionController_1.createClinicalIntervention));
router.get('/search', (0, rbac_1.requirePermission)('clinical_intervention.read'), validateRequest(clinicalInterventionValidators_1.searchInterventionsSchema, 'query'), auditInterventionActivity('SEARCH_INTERVENTIONS'), clinicalInterventionController_1.searchClinicalInterventions);
router.get('/assigned-to-me', (0, rbac_1.requirePermission)('clinical_intervention.read'), auditInterventionActivity('VIEW_ASSIGNED_INTERVENTIONS'), clinicalInterventionController_1.getAssignedInterventions);
router.get('/:id', (0, rbac_1.requirePermission)('clinical_intervention.read'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionAccess, auditInterventionActivity('VIEW_INTERVENTION'), clinicalInterventionController_1.getClinicalIntervention);
router.patch('/:id', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionModifyAccess, validateRequest(clinicalInterventionValidators_1.updateInterventionSchema, 'body'), auditInterventionActivity('UPDATE_INTERVENTION'), clinicalInterventionController_1.updateClinicalIntervention);
router.delete('/:id', (0, rbac_1.requirePermission)('clinical_intervention.delete'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), auditInterventionActivity('DELETE_INTERVENTION'), clinicalInterventionController_1.deleteClinicalIntervention);
router.post('/:id/strategies', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), validateRequest(clinicalInterventionValidators_1.addStrategySchema, 'body'), auditInterventionActivity('ADD_STRATEGY'), clinicalInterventionController_1.addInterventionStrategy);
router.patch('/:id/strategies/:strategyId', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.updateStrategySchema, 'body'), auditInterventionActivity('UPDATE_STRATEGY'), clinicalInterventionController_1.updateInterventionStrategy);
router.post('/:id/assignments', (0, rbac_1.requirePermission)('clinical_intervention.assign'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionAssignAccess, validateRequest(clinicalInterventionValidators_1.assignTeamMemberSchema, 'body'), auditInterventionActivity('ASSIGN_TEAM_MEMBER'), clinicalInterventionController_1.assignTeamMember);
router.patch('/:id/assignments/:assignmentId', (0, rbac_1.requirePermission)('clinical_intervention.assign'), validateRequest(clinicalInterventionValidators_1.updateAssignmentSchema, 'body'), auditInterventionActivity('UPDATE_ASSIGNMENT'), clinicalInterventionController_1.updateAssignment);
router.post('/:id/outcomes', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), validateRequest(clinicalInterventionValidators_1.recordOutcomeSchema, 'body'), auditInterventionActivity('RECORD_OUTCOME'), clinicalInterventionController_1.recordOutcome);
router.post('/:id/follow-up', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), validateRequest(clinicalInterventionValidators_1.scheduleFollowUpSchema, 'body'), auditInterventionActivity('SCHEDULE_FOLLOW_UP'), clinicalInterventionController_1.scheduleFollowUp);
router.get('/patient/:patientId', (0, rbac_1.requirePermission)('clinical_intervention.read'), validateRequest(clinicalInterventionValidators_1.patientParamsSchema, 'params'), auditInterventionActivity('VIEW_PATIENT_INTERVENTIONS'), clinicalInterventionController_1.getPatientInterventions);
router.get('/analytics/summary', (0, rbac_1.requirePermission)('clinical_intervention.reports'), clinicalInterventionRBAC_1.checkInterventionReportAccess, validateRequest(clinicalInterventionValidators_1.analyticsQuerySchema, 'query'), auditInterventionActivity('VIEW_ANALYTICS'), clinicalInterventionController_1.getInterventionAnalytics);
router.get('/analytics/trends', (0, rbac_1.requirePermission)('clinical_intervention.reports'), clinicalInterventionRBAC_1.checkInterventionReportAccess, validateRequest(clinicalInterventionValidators_1.analyticsQuerySchema, 'query'), auditInterventionActivity('VIEW_TRENDS'), clinicalInterventionController_1.getInterventionTrends);
router.get('/reports/outcomes', (0, rbac_1.requirePermission)('clinical_intervention.reports'), clinicalInterventionRBAC_1.checkInterventionReportAccess, validateRequest(clinicalInterventionValidators_1.analyticsQuerySchema, 'query'), auditInterventionActivity('VIEW_OUTCOME_REPORTS'), clinicalInterventionController_1.getOutcomeReports);
router.get('/reports/export', (0, rbac_1.requirePermission)('clinical_intervention.export'), clinicalInterventionRBAC_1.checkInterventionReportAccess, validateRequest(clinicalInterventionValidators_1.exportQuerySchema, 'query'), auditInterventionActivity('EXPORT_DATA'), clinicalInterventionController_1.exportInterventionData);
router.get('/recommendations/:category', (0, rbac_1.requirePermission)('clinical_intervention.read'), auditInterventionActivity('GET_RECOMMENDATIONS'), clinicalInterventionController_1.getStrategyRecommendations);
router.post('/:id/link-mtr', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), validateRequest(clinicalInterventionValidators_1.linkMTRSchema, 'body'), auditInterventionActivity('LINK_MTR'), clinicalInterventionController_1.linkToMTR);
router.post('/from-mtr', (0, rbac_1.requirePermission)('clinical_intervention.create'), clinicalInterventionRBAC_1.checkInterventionPlanLimits, auditInterventionActivity('CREATE_FROM_MTR'), clinicalInterventionController_1.createInterventionsFromMTR);
router.get('/:id/mtr-reference', (0, rbac_1.requirePermission)('clinical_intervention.read'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionAccess, auditInterventionActivity('GET_MTR_REFERENCE'), clinicalInterventionController_1.getMTRReference);
router.get('/mtr/:mtrId', (0, rbac_1.requirePermission)('clinical_intervention.read'), auditInterventionActivity('GET_MTR_INTERVENTIONS'), clinicalInterventionController_1.getInterventionsForMTR);
router.post('/:id/sync-mtr', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionModifyAccess, auditInterventionActivity('SYNC_MTR'), clinicalInterventionController_1.syncWithMTR);
router.post('/:id/notifications', (0, rbac_1.requirePermission)('clinical_intervention.update'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), validateRequest(clinicalInterventionValidators_1.notificationSchema, 'body'), auditInterventionActivity('SEND_NOTIFICATIONS'), clinicalInterventionController_1.sendInterventionNotifications);
router.get('/:id/audit-trail', (0, rbac_1.requirePermission)('clinical_intervention.audit'), validateRequest(clinicalInterventionValidators_1.interventionParamsSchema, 'params'), clinicalInterventionRBAC_1.checkInterventionAccess, auditInterventionActivity('VIEW_AUDIT_TRAIL'), clinicalInterventionController_1.getInterventionAuditTrail);
router.get('/compliance/report', (0, rbac_1.requirePermission)('clinical_intervention.compliance'), clinicalInterventionRBAC_1.checkInterventionReportAccess, auditInterventionActivity('GENERATE_COMPLIANCE_REPORT'), clinicalInterventionController_1.getComplianceReport);
router.get('/audit/export', (0, rbac_1.requirePermission)('clinical_intervention.audit_export'), clinicalInterventionRBAC_1.checkInterventionReportAccess, auditInterventionActivity('EXPORT_AUDIT_DATA'), clinicalInterventionController_1.exportAuditData);
router.use(clinicalInterventionErrorHandler_1.clinicalInterventionErrorHandler);
exports.default = router;
//# sourceMappingURL=clinicalInterventionRoutes.js.map