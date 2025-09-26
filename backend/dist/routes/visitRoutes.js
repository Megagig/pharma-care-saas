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
router.post('/:id/visits', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.visitParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.createVisitSchema, 'body'), patientResourcesController_1.createVisit);
router.get('/:id/visits', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.visitParamsSchema.pick({ id: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.paginationSchema, 'query'), patientResourcesController_1.getVisits);
router.get('/visits/:visitId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('read'), (0, patientValidators_1.validateRequest)(patientValidators_1.visitParamsSchema.pick({ visitId: true }), 'params'), patientResourcesController_1.getVisit);
router.patch('/visits/:visitId', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('update'), (0, patientValidators_1.validateRequest)(patientValidators_1.visitParamsSchema.pick({ visitId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.updateVisitSchema, 'body'), patientResourcesController_1.updateVisit);
router.post('/visits/:visitId/attachments', auth_1.auth, patientRBAC_1.checkPharmacyAccess, (0, patientRBAC_1.requirePatientPermission)('create'), (0, patientValidators_1.validateRequest)(patientValidators_1.visitParamsSchema.pick({ visitId: true }), 'params'), (0, patientValidators_1.validateRequest)(patientValidators_1.attachmentSchema, 'body'), patientResourcesController_1.addVisitAttachment);
exports.default = router;
//# sourceMappingURL=visitRoutes.js.map