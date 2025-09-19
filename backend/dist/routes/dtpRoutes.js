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
router.post('/:id/dtps', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.dtpParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createDTPSchema, 'body'), patientResourcesController_1.createDTP);
router.get('/:id/dtps', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.dtpParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.dtpQuerySchema, 'query'), patientResourcesController_1.getDTPs);
router.patch('/dtps/:dtpId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.dtpParamsSchema.pick({ dtpId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateDTPSchema, 'body'), patientResourcesController_1.updateDTP);
exports.default = router;
//# sourceMappingURL=dtpRoutes.js.map