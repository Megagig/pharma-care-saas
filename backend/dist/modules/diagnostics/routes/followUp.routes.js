"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = __importDefault(require("../../../middlewares/rbac"));
const followUpController_1 = require("../controllers/followUpController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.createFollowUp);
router.get('/my', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.getMyFollowUps);
router.get('/overdue', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.getOverdueFollowUps);
router.get('/analytics', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.getFollowUpAnalytics);
router.get('/patient/:patientId', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.getPatientFollowUps);
router.get('/:followUpId', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.getFollowUpById);
router.put('/:followUpId/complete', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.completeFollowUp);
router.put('/:followUpId/reschedule', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.rescheduleFollowUp);
router.put('/:followUpId/status', rbac_1.default.requireRole('pharmacist', 'admin'), followUpController_1.updateFollowUpStatus);
exports.default = router;
//# sourceMappingURL=followUp.routes.js.map