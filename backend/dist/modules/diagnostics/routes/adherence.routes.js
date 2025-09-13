"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = require("../../../middlewares/rbac");
const adherenceController_1 = require("../controllers/adherenceController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.createAdherenceTracking);
router.get('/poor-adherence', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.getPatientsWithPoorAdherence);
router.get('/patient/:patientId', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.getPatientAdherenceTracking);
router.post('/patient/:patientId/refill', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.addRefill);
router.put('/patient/:patientId/medication/:medicationName', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.updateMedicationAdherence);
router.get('/patient/:patientId/assessment', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.assessPatientAdherence);
router.post('/patient/:patientId/intervention', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.addIntervention);
router.get('/patient/:patientId/report', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.generateAdherenceReport);
router.put('/patient/:patientId/alert/:alertIndex/acknowledge', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.acknowledgeAlert);
router.put('/patient/:patientId/alert/:alertIndex/resolve', (0, rbac_1.rbac)(['pharmacist', 'admin']), adherenceController_1.resolveAlert);
exports.default = router;
//# sourceMappingURL=adherence.routes.js.map