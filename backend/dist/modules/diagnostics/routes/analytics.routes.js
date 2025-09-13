"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = __importDefault(require("../controllers/analyticsController"));
const auth_1 = require("../../../middlewares/auth");
const diagnosticRBAC_1 = __importDefault(require("../middlewares/diagnosticRBAC"));
const rateLimiting_1 = require("../../../middlewares/rateLimiting");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.use(diagnosticRBAC_1.default.requireDiagnosticAnalytics);
router.use((0, rateLimiting_1.rateLimiting)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many analytics requests, please try again later'
}));
router.get('/dashboard', analyticsController_1.default.getDashboardSummary);
router.get('/metrics', analyticsController_1.default.getDiagnosticMetrics);
router.get('/ai-performance', analyticsController_1.default.getAIPerformanceMetrics);
router.get('/patient-outcomes', analyticsController_1.default.getPatientOutcomeMetrics);
router.get('/usage', analyticsController_1.default.getUsageAnalytics);
router.get('/trends', analyticsController_1.default.getTrendAnalysis);
router.get('/comparison', analyticsController_1.default.getComparisonAnalysis);
router.get('/report', analyticsController_1.default.generateAnalyticsReport);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map