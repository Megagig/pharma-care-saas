"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auditController_1 = require("../controllers/auditController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const rateLimiting_1 = require("../middlewares/rateLimiting");
const auditLogging_1 = require("../middlewares/auditLogging");
const router = express_1.default.Router();
router.get('/logs', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.view'), (0, auditLogging_1.auditMiddleware)({
    action: 'AUDIT_LOGS_VIEWED',
    category: 'security',
    severity: 'medium',
    resourceType: 'AuditLog',
}), auditController_1.auditController.getAuditLogs.bind(auditController_1.auditController));
router.get('/summary', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.view'), (0, auditLogging_1.auditMiddleware)({
    action: 'AUDIT_SUMMARY_VIEWED',
    category: 'security',
    severity: 'low',
    resourceType: 'AuditSummary',
}), auditController_1.auditController.getAuditSummary.bind(auditController_1.auditController));
router.get('/security-alerts', rateLimiting_1.generalRateLimiters.api, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.security'), (0, auditLogging_1.auditMiddleware)({
    action: 'SECURITY_ALERTS_VIEWED',
    category: 'security',
    severity: 'medium',
    resourceType: 'SecurityAlert',
}), auditController_1.auditController.getSecurityAlerts.bind(auditController_1.auditController));
router.get('/export', rateLimiting_1.generalRateLimiters.sensitive, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('audit.export'), (0, auditLogging_1.auditMiddleware)({
    action: 'AUDIT_LOGS_EXPORTED',
    category: 'security',
    severity: 'high',
    resourceType: 'AuditExport',
    includeRequestBody: false,
    includeResponseBody: false,
}), auditController_1.auditController.exportAuditLogs.bind(auditController_1.auditController));
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map