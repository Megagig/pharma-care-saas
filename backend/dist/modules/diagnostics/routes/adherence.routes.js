"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = __importDefault(require("../../../middlewares/rbac"));
const adherenceController_1 = require("../controllers/adherenceController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.createAdherenceTracking);
router.get('/poor-adherence', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.getPatientsWithPoorAdherence);
router.get('/patient/:patientId', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.getPatientAdherenceTracking);
router.post('/patient/:patientId/refill', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.addRefill);
router.put('/patient/:patientId/medication/:medicationName', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.updateMedicationAdherence);
router.get('/patient/:patientId/assessment', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.assessPatientAdherence);
router.post('/patient/:patientId/intervention', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.addIntervention);
router.get('/patient/:patientId/report', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.generateAdherenceReport);
router.put('/patient/:patientId/alert/:alertIndex/acknowledge', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.acknowledgeAlert);
router.put('/patient/:patientId/alert/:alertIndex/resolve', rbac_1.default.requireRole('pharmacist', 'admin'), adherenceController_1.resolveAlert);
exports.default = router;
//# sourceMappingURL=adherence.routes.js.map