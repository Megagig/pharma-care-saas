"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientMTRIntegrationController_1 = require("../controllers/patientMTRIntegrationController");
const authenticate = (req, res, next) => next();
const validateWorkplace = (req, res, next) => next();
const auditMiddleware = (action) => (req, res, next) => next();
const router = (0, express_1.Router)();
router.use(authenticate);
router.use(validateWorkplace);
router.get('/:patientId/mtr/summary', auditMiddleware('patient_mtr_summary_view'), patientMTRIntegrationController_1.patientMTRIntegrationController.getPatientMTRSummary);
router.get('/:patientId/mtr/data', auditMiddleware('patient_mtr_data_view'), patientMTRIntegrationController_1.patientMTRIntegrationController.getPatientDataForMTR);
router.get('/:patientId/dashboard/mtr', auditMiddleware('patient_dashboard_mtr_view'), patientMTRIntegrationController_1.patientMTRIntegrationController.getPatientDashboardMTRData);
router.post('/:patientId/mtr/:mtrId/sync-medications', auditMiddleware('patient_mtr_medications_sync'), patientMTRIntegrationController_1.patientMTRIntegrationController.syncMedicationsWithMTR);
router.get('/search/with-mtr', auditMiddleware('patients_search_with_mtr'), patientMTRIntegrationController_1.patientMTRIntegrationController.searchPatientsWithMTR);
exports.default = router;
//# sourceMappingURL=patientMTRIntegrationRoutes.js.map