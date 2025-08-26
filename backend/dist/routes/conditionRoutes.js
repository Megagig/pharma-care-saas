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
router.post('/:id/conditions', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.conditionParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createConditionSchema, 'body'), patientResourcesController_1.createCondition);
router.get('/:id/conditions', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.conditionParamsSchema, 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.paginationSchema, 'query'), patientResourcesController_1.getConditions);
router.patch('/conditions/:conditionId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.conditionParamsSchema.pick({ conditionId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateConditionSchema, 'body'), patientResourcesController_1.updateCondition);
router.delete('/conditions/:conditionId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('delete'), (0, patientValidators_1.validateRequest)(patientValidators_1.conditionParamsSchema.pick({ conditionId: true }), 'params'), patientResourcesController_1.deleteCondition);
exports.default = router;
//# sourceMappingURL=conditionRoutes.js.map