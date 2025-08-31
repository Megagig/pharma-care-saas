"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const auditController_1 = require("../controllers/auditController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/logs', auditController_1.getAuditLogs);
router.get('/summary', auditController_1.getAuditSummary);
router.get('/compliance-report', auditController_1.getComplianceReport);
router.get('/high-risk-activities', auditController_1.getHighRiskActivities);
router.get('/suspicious-activities', auditController_1.getSuspiciousActivities);
router.post('/export', auditController_1.exportAuditData);
router.get('/user-activity/:userId', auditController_1.getUserActivity);
router.get('/patient-access/:patientId', auditController_1.getPatientAccessLog);
router.get('/actions', auditController_1.getAuditActions);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map