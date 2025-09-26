"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const securityController_1 = require("../controllers/securityController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const rateLimiting_1 = require("../middlewares/rateLimiting");
const auditLogging_1 = require("../middlewares/auditLogging");
const securityMonitoring_1 = require("../middlewares/securityMonitoring");
const router = express_1.default.Router();
router.get('/threats', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.security'), (0, auditLogging_1.auditMiddleware)({
    action: 'SECURITY_THREATS_VIEWED',
    category: 'security',
    severity: 'medium',
    resourceType: 'SecurityThreat',
}), (0, securityMonitoring_1.monitorSecurityEvents)('security_data_access'), securityController_1.securityController.getSecurityThreats.bind(securityController_1.securityController));
router.get('/dashboard', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.security'), (0, auditLogging_1.auditMiddleware)({
    action: 'SECURITY_DASHBOARD_VIEWED',
    category: 'security',
    severity: 'low',
    resourceType: 'SecurityDashboard',
}), (0, securityMonitoring_1.monitorSecurityEvents)('security_data_access'), securityController_1.securityController.getSecurityDashboard.bind(securityController_1.securityController));
router.post('/threats/:threatId/resolve', rateLimiting_1.generalRateLimiters.sensitive, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('admin.system_settings'), (0, auditLogging_1.auditMiddleware)({
    action: 'SECURITY_THREAT_RESOLVED',
    category: 'security',
    severity: 'high',
    resourceType: 'SecurityThreat',
    includeRequestBody: true,
}), (0, securityMonitoring_1.monitorSecurityEvents)('threat_resolution'), securityController_1.securityController.resolveThreat.bind(securityController_1.securityController));
router.get('/users/:userId/status', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, auditLogging_1.auditMiddleware)({
    action: 'USER_SECURITY_STATUS_VIEWED',
    category: 'security',
    severity: 'low',
    resourceType: 'UserSecurityStatus',
}), (0, securityMonitoring_1.monitorSecurityEvents)('security_data_access'), securityController_1.securityController.getUserSecurityStatus.bind(securityController_1.securityController));
router.get('/blocked-ips', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('admin.system_settings'), (0, auditLogging_1.auditMiddleware)({
    action: 'BLOCKED_IPS_VIEWED',
    category: 'security',
    severity: 'medium',
    resourceType: 'BlockedIP',
}), (0, securityMonitoring_1.monitorSecurityEvents)('security_data_access'), securityController_1.securityController.getBlockedIPs.bind(securityController_1.securityController));
exports.default = router;
//# sourceMappingURL=securityRoutes.js.map