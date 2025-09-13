"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = __importDefault(require("../controllers/auditController"));
const auth_1 = require("../../../middlewares/auth");
const diagnosticRBAC_1 = __importDefault(require("../middlewares/diagnosticRBAC"));
const rateLimiting_1 = require("../../../middlewares/rateLimiting");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.use((0, rateLimiting_1.rateLimiting)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many audit requests, please try again later'
}));
router.get('/events', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.searchAuditEvents);
router.get('/trail/:entityType/:entityId', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.getEntityAuditTrail);
router.get('/statistics', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.getAuditStatistics);
router.get('/compliance/report', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.generateComplianceReport);
router.post('/security/violation', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.logSecurityViolation);
router.post('/archive', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.archiveAuditRecords);
router.get('/export', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.exportAuditData);
router.get('/regulatory/report', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.generateRegulatoryReport);
router.get('/anomalies', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.detectAuditAnomalies);
router.get('/visualization', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.getAuditVisualization);
router.get('/search/advanced', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.advancedAuditSearch);
router.get('/visualization/export', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.exportAuditVisualization);
router.get('/retention/policies', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.getDataRetentionPolicies);
router.put('/retention/policies/:recordType', (0, diagnosticRBAC_1.default)(['diagnostic:analytics']), auditController_1.default.updateDataRetentionPolicy);
exports.default = router;
//# sourceMappingURL=audit.routes.js.map