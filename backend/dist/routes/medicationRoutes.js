"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientResourcesController_1 = require("../controllers/patientResourcesController");
const auth_1 = require("../middlewares/auth");
const patientRBAC_1 = require("../middlewares/patientRBAC");
const patientValidators_1 = require("../validators/patientValidators");
const router = express_1.default.Router();
router.post('/:id/medications', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.medicationParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createMedicationSchema, 'body'), patientResourcesController_1.createMedication);
router.get('/:id/medications', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.medicationParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.medicationQuerySchema, 'query'), patientResourcesController_1.getMedications);
router.patch('/medications/:medId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.medicationParamsSchema.pick({ medId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateMedicationSchema, 'body'), patientResourcesController_1.updateMedication);
router.delete('/medications/:medId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('delete'), (0, patientValidators_1.validateRequest)(patientValidators_1.medicationParamsSchema.pick({ medId: true }), 'params'), patientResourcesController_1.deleteMedication);
exports.default = router;
//# sourceMappingURL=medicationRoutes.js.map