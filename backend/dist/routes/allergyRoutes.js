"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const allergyController_1 = require("../controllers/allergyController");
const auth_1 = require("../middlewares/auth");
const patientRBAC_1 = require("../middlewares/patientRBAC");
const patientValidators_1 = require("../validators/patientValidators");
const responseHelpers_1 = require("../utils/responseHelpers");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(patientRBAC_1.checkPharmacyAccess);
router.post('/:id/allergies', patientRBAC_1.requirePatientCreate, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createAllergySchema, 'body'), allergyController_1.createAllergy);
router.get('/:id/allergies', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.paginationSchema, 'query'), allergyController_1.getAllergies);
router.get('/:id/allergies/critical', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), allergyController_1.getCriticalAllergies);
router.get('/allergies/search', patientRBAC_1.requirePatientRead, allergyController_1.searchAllergies);
router.get('/allergies/:allergyId', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.allergyParamsSchema, 'params'), allergyController_1.getAllergy);
router.patch('/allergies/:allergyId', patientRBAC_1.requirePatientUpdate, (0, patientValidators_1.validateRequest)(patientValidators_1.allergyParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateAllergySchema, 'body'), allergyController_1.updateAllergy);
router.delete('/allergies/:allergyId', patientRBAC_1.requirePatientDelete, (0, patientValidators_1.validateRequest)(patientValidators_1.allergyParamsSchema, 'params'), allergyController_1.deleteAllergy);
router.use(responseHelpers_1.patientManagementErrorHandler);
exports.default = router;
//# sourceMappingURL=allergyRoutes.js.map