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
router.post('/:id/careplans', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.carePlanParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createCarePlanSchema, 'body'), patientResourcesController_1.createCarePlan);
router.get('/:id/careplans', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.carePlanParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.paginationSchema, 'query'), patientResourcesController_1.getCarePlans);
router.patch('/careplans/:carePlanId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.carePlanParamsSchema.pick({ carePlanId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateCarePlanSchema, 'body'), patientResourcesController_1.updateCarePlan);
exports.default = router;
//# sourceMappingURL=carePlanRoutes.js.map