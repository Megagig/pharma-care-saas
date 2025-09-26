"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientController_1 = require("../controllers/patientController");
const auth_1 = require("../middlewares/auth");
const patientRBAC_1 = require("../middlewares/patientRBAC");
const patientValidators_1 = require("../validators/patientValidators");
const responseHelpers_1 = require("../utils/responseHelpers");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(patientRBAC_1.checkPharmacyAccess);
router.get('/', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.searchSchema, 'query'), patientController_1.getPatients);
router.get('/search', patientRBAC_1.requirePatientRead, patientController_1.searchPatients);
router.get('/search-with-interventions', patientRBAC_1.requirePatientRead, patientController_1.searchPatientsWithInterventions);
router.post('/', patientRBAC_1.requirePatientCreate, patientRBAC_1.checkPatientPlanLimits, (0, patientValidators_1.validateRequest)(patientValidators_1.createPatientSchema, 'body'), patientController_1.createPatient);
router.get('/:id', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), patientController_1.getPatient);
router.get('/:id/summary', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), patientController_1.getPatientSummary);
router.get('/:id/interventions', patientRBAC_1.requirePatientRead, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), patientController_1.getPatientInterventions);
router.patch('/:id', patientRBAC_1.requirePatientUpdate, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updatePatientSchema, 'body'), patientController_1.updatePatient);
router.delete('/:id', patientRBAC_1.requirePatientDelete, (0, patientValidators_1.validateRequest)(patientValidators_1.patientParamsSchema, 'params'), patientController_1.deletePatient);
router.use(responseHelpers_1.patientManagementErrorHandler);
exports.default = router;
//# sourceMappingURL=patientRoutes.js.map