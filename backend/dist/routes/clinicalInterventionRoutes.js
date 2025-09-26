"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const clinicalInterventionRBAC_1 = require("../middlewares/clinicalInterventionRBAC");
const clinicalInterventionErrorHandler_1 = require("../middlewares/clinicalInterventionErrorHandler");
const workspaceContext_1 = require("../middlewares/workspaceContext");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const clinicalInterventionController_1 = require("../controllers/clinicalInterventionController");
const auditController_1 = require("../controllers/auditController");
const router = express_1.default.Router();
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        module: 'clinical-interventions',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            total: 30,
            crud: 5,
            workflow: 8,
            analytics: 4,
            reporting: 3,
            utility: 2,
            mtr: 5,
            notifications: 1,
            audit: 3
        }
    });
});
const authenticatedRouter = express_1.default.Router();
authenticatedRouter.use(auth_1.auth);
authenticatedRouter.use(workspaceContext_1.loadWorkspaceContext);
authenticatedRouter.get('/', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getClinicalInterventions);
authenticatedRouter.post('/', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionCreate, ...(0, auditMiddleware_1.auditIntervention)('INTERVENTION_CREATED'), clinicalInterventionController_1.createClinicalIntervention);
authenticatedRouter.get('/:id', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getClinicalIntervention);
authenticatedRouter.patch('/:id', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, ...(0, auditMiddleware_1.auditIntervention)('INTERVENTION_UPDATED'), clinicalInterventionController_1.updateClinicalIntervention);
authenticatedRouter.delete('/:id', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionDelete, ...(0, auditMiddleware_1.auditIntervention)('INTERVENTION_DELETED'), clinicalInterventionController_1.deleteClinicalIntervention);
authenticatedRouter.post('/:id/strategies', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.addInterventionStrategy);
authenticatedRouter.patch('/:id/strategies/:strategyId', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.updateInterventionStrategy);
authenticatedRouter.post('/:id/assignments', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.assignTeamMember);
authenticatedRouter.patch('/:id/assignments/:assignmentId', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.updateAssignment);
authenticatedRouter.post('/:id/outcomes', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, ...(0, auditMiddleware_1.auditIntervention)('INTERVENTION_COMPLETED'), clinicalInterventionController_1.recordOutcome);
authenticatedRouter.post('/:id/follow-up', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.scheduleFollowUp);
authenticatedRouter.get('/search', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.searchClinicalInterventions);
authenticatedRouter.get('/patient/:patientId', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getPatientInterventions);
authenticatedRouter.get('/assigned-to-me', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getAssignedInterventions);
authenticatedRouter.get('/analytics/summary', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getInterventionAnalytics);
authenticatedRouter.get('/analytics/trends', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getInterventionTrends);
authenticatedRouter.get('/analytics/categories', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getCategoryCounts);
authenticatedRouter.get('/analytics/priorities', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getPriorityDistribution);
authenticatedRouter.get('/reports/outcomes', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getOutcomeReports);
authenticatedRouter.get('/reports/cost-savings', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getCostSavingsReport);
authenticatedRouter.get('/reports/export', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.exportInterventionData);
authenticatedRouter.get('/recommendations/:category', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getStrategyRecommendations);
authenticatedRouter.get('/check-duplicates', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.checkDuplicates);
authenticatedRouter.post('/from-mtr', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionCreate, clinicalInterventionController_1.createInterventionsFromMTR);
authenticatedRouter.get('/:id/mtr-reference', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getMTRReference);
authenticatedRouter.get('/mtr/:mtrId', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getInterventionsForMTR);
authenticatedRouter.post('/:id/link-mtr', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.linkToMTR);
authenticatedRouter.post('/:id/sync-mtr', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.syncWithMTR);
authenticatedRouter.post('/:id/notifications', (0, rbac_1.requireRole)('pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionUpdate, clinicalInterventionController_1.sendInterventionNotifications);
authenticatedRouter.get('/audit-trail', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, auditController_1.getAllAuditTrail);
authenticatedRouter.get('/:id/audit-trail', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getInterventionAuditTrail);
authenticatedRouter.get('/compliance/report', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.getComplianceReport);
authenticatedRouter.get('/audit/export', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, clinicalInterventionController_1.exportAuditData);
authenticatedRouter.get('/audit/statistics', (0, rbac_1.requireRole)('pharmacy_outlet', 'owner', 'super_admin'), clinicalInterventionRBAC_1.requireInterventionRead, auditController_1.getAuditStatistics);
authenticatedRouter.post('/audit/cleanup', (0, rbac_1.requireRole)('super_admin'), auditController_1.cleanupAuditLogs);
authenticatedRouter.use(clinicalInterventionErrorHandler_1.clinicalInterventionErrorHandler);
router.use(authenticatedRouter);
exports.default = router;
//# sourceMappingURL=clinicalInterventionRoutes.js.map