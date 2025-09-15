"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integrationController_1 = require("../controllers/integrationController");
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = __importDefault(require("../../../middlewares/rbac"));
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.post('/clinical-note', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.createClinicalNoteFromDiagnostic);
router.post('/mtr/:mtrId/enrich', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.addDiagnosticDataToMTR);
router.post('/mtr', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.createMTRFromDiagnostic);
router.get('/timeline/:patientId', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.getUnifiedPatientTimeline);
router.get('/cross-reference/:diagnosticRequestId', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.crossReferenceWithExistingRecords);
router.get('/options/:diagnosticRequestId', rbac_1.default.requireRole('pharmacist', 'admin', 'super_admin'), integrationController_1.getIntegrationOptions);
exports.default = router;
//# sourceMappingURL=integration.routes.js.map