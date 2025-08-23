"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medicationController_1 = require("../controllers/medicationController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.route('/')
    .get(medicationController_1.getMedications)
    .post(medicationController_1.createMedication);
router.get('/patient/:patientId', medicationController_1.getPatientMedications);
router.post('/interactions', medicationController_1.checkInteractions);
router.route('/:id')
    .get(medicationController_1.getMedication)
    .put(medicationController_1.updateMedication)
    .delete(medicationController_1.deleteMedication);
exports.default = router;
//# sourceMappingURL=medicationRoutes.js.map