"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbacAuditController_1 = require("../controllers/rbacAuditController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/dashboard', (0, rbac_1.requireDynamicPermission)('audit.view'), rbacAuditController_1.RBACSecurityAuditController.getAuditDashboard);
router.get('/logs', (0, rbac_1.requireDynamicPermission)('audit.view'), rbacAuditController_1.RBACSecurityAuditController.getAuditLogs);
router.get('/users/:userId/trail', (0, rbac_1.requireDynamicPermission)('audit.view'), rbacAuditController_1.RBACSecurityAuditController.getUserAuditTrail);
router.get('/roles/:roleId/trail', (0, rbac_1.requireDynamicPermission)('audit.view'), rbacAuditController_1.RBACSecurityAuditController.getRoleAuditTrail);
router.get('/export', (0, rbac_1.requireDynamicPermission)('audit.export'), rbacAuditController_1.RBACSecurityAuditController.exportAuditLogs);
router.get('/compliance-report', (0, rbac_1.requireDynamicPermission)('audit.compliance'), rbacAuditController_1.RBACSecurityAuditController.getComplianceReport);
router.get('/security-alerts', (0, rbac_1.requireDynamicPermission)('security.monitor'), rbacAuditController_1.RBACSecurityAuditController.getSecurityAlerts);
router.put('/security-alerts/:alertId/resolve', (0, rbac_1.requireDynamicPermission)('security.manage'), rbacAuditController_1.RBACSecurityAuditController.resolveSecurityAlert);
router.get('/statistics', (0, rbac_1.requireDynamicPermission)('audit.view'), rbacAuditController_1.RBACSecurityAuditController.getAuditStatistics);
exports.default = router;
//# sourceMappingURL=rbacAudit.js.map