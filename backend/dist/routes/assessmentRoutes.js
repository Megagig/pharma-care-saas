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
router.post('/:id/assessments', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.assessmentParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createAssessmentSchema, 'body'), patientResourcesController_1.createAssessment);
router.get('/:id/assessments', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.assessmentParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.paginationSchema, 'query'), patientResourcesController_1.getAssessments);
router.patch('/assessments/:assessmentId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.assessmentParamsSchema.pick({ assessmentId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateAssessmentSchema, 'body'), patientResourcesController_1.updateAssessment);
exports.default = router;
//# sourceMappingURL=assessmentRoutes.js.map