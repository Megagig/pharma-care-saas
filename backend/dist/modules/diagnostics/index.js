"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleConfig = exports.routes = exports.drugInteractionValidators = exports.labValidators = exports.diagnosticValidators = exports.diagnosticRBAC = exports.AdherenceTracking = exports.DiagnosticFollowUp = exports.LabResult = exports.LabOrder = exports.DiagnosticResult = exports.DiagnosticRequest = exports.diagnosticAuditService = exports.diagnosticAnalyticsService = exports.diagnosticNotificationService = exports.adherenceService = exports.diagnosticFollowUpService = exports.clinicalApiService = exports.labService = exports.PharmacistReviewService = exports.DiagnosticService = void 0;
const diagnosticRoutes_1 = __importDefault(require("./routes/diagnosticRoutes"));
const labRoutes_1 = __importDefault(require("./routes/labRoutes"));
const drugInteractionRoutes_1 = __importDefault(require("./routes/drugInteractionRoutes"));
const followUp_routes_1 = __importDefault(require("./routes/followUp.routes"));
const adherence_routes_1 = __importDefault(require("./routes/adherence.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
var diagnosticService_1 = require("./services/diagnosticService");
Object.defineProperty(exports, "DiagnosticService", { enumerable: true, get: function () { return diagnosticService_1.DiagnosticService; } });
var pharmacistReviewService_1 = require("./services/pharmacistReviewService");
Object.defineProperty(exports, "PharmacistReviewService", { enumerable: true, get: function () { return pharmacistReviewService_1.PharmacistReviewService; } });
var labService_1 = require("./services/labService");
Object.defineProperty(exports, "labService", { enumerable: true, get: function () { return __importDefault(labService_1).default; } });
var clinicalApiService_1 = require("./services/clinicalApiService");
Object.defineProperty(exports, "clinicalApiService", { enumerable: true, get: function () { return __importDefault(clinicalApiService_1).default; } });
var diagnosticFollowUpService_1 = require("./services/diagnosticFollowUpService");
Object.defineProperty(exports, "diagnosticFollowUpService", { enumerable: true, get: function () { return __importDefault(diagnosticFollowUpService_1).default; } });
var adherenceService_1 = require("./services/adherenceService");
Object.defineProperty(exports, "adherenceService", { enumerable: true, get: function () { return __importDefault(adherenceService_1).default; } });
var diagnosticNotificationService_1 = require("./services/diagnosticNotificationService");
Object.defineProperty(exports, "diagnosticNotificationService", { enumerable: true, get: function () { return __importDefault(diagnosticNotificationService_1).default; } });
var diagnosticAnalyticsService_1 = require("./services/diagnosticAnalyticsService");
Object.defineProperty(exports, "diagnosticAnalyticsService", { enumerable: true, get: function () { return __importDefault(diagnosticAnalyticsService_1).default; } });
var diagnosticAuditService_1 = require("./services/diagnosticAuditService");
Object.defineProperty(exports, "diagnosticAuditService", { enumerable: true, get: function () { return __importDefault(diagnosticAuditService_1).default; } });
var DiagnosticRequest_1 = require("./models/DiagnosticRequest");
Object.defineProperty(exports, "DiagnosticRequest", { enumerable: true, get: function () { return __importDefault(DiagnosticRequest_1).default; } });
var DiagnosticResult_1 = require("./models/DiagnosticResult");
Object.defineProperty(exports, "DiagnosticResult", { enumerable: true, get: function () { return __importDefault(DiagnosticResult_1).default; } });
var LabOrder_1 = require("./models/LabOrder");
Object.defineProperty(exports, "LabOrder", { enumerable: true, get: function () { return __importDefault(LabOrder_1).default; } });
var LabResult_1 = require("./models/LabResult");
Object.defineProperty(exports, "LabResult", { enumerable: true, get: function () { return __importDefault(LabResult_1).default; } });
var DiagnosticFollowUp_1 = require("./models/DiagnosticFollowUp");
Object.defineProperty(exports, "DiagnosticFollowUp", { enumerable: true, get: function () { return __importDefault(DiagnosticFollowUp_1).default; } });
var AdherenceTracking_1 = require("./models/AdherenceTracking");
Object.defineProperty(exports, "AdherenceTracking", { enumerable: true, get: function () { return __importDefault(AdherenceTracking_1).default; } });
var diagnosticRBAC_1 = require("./middlewares/diagnosticRBAC");
Object.defineProperty(exports, "diagnosticRBAC", { enumerable: true, get: function () { return __importDefault(diagnosticRBAC_1).default; } });
var diagnosticValidators_1 = require("./validators/diagnosticValidators");
Object.defineProperty(exports, "diagnosticValidators", { enumerable: true, get: function () { return __importDefault(diagnosticValidators_1).default; } });
var labValidators_1 = require("./validators/labValidators");
Object.defineProperty(exports, "labValidators", { enumerable: true, get: function () { return __importDefault(labValidators_1).default; } });
var drugInteractionValidators_1 = require("./validators/drugInteractionValidators");
Object.defineProperty(exports, "drugInteractionValidators", { enumerable: true, get: function () { return __importDefault(drugInteractionValidators_1).default; } });
exports.routes = {
    diagnostics: diagnosticRoutes_1.default,
    lab: labRoutes_1.default,
    drugInteractions: drugInteractionRoutes_1.default,
    followUps: followUp_routes_1.default,
    adherence: adherence_routes_1.default,
    analytics: analytics_routes_1.default,
    audit: audit_routes_1.default,
};
exports.moduleConfig = {
    name: 'ai-diagnostics-therapeutics',
    version: '1.0.0',
    description: 'AI-Powered Diagnostics & Therapeutics module for comprehensive clinical decision support',
    features: [
        'ai_diagnostics',
        'lab_integration',
        'drug_interactions',
        'diagnostic_analytics',
        'follow_up_tracking',
        'adherence_monitoring',
        'automated_notifications',
    ],
    permissions: [
        'diagnostic:read',
        'diagnostic:create',
        'diagnostic:process',
        'diagnostic:review',
        'diagnostic:approve',
        'diagnostic:intervention',
        'diagnostic:cancel',
        'diagnostic:retry',
        'diagnostic:analytics',
        'lab:read',
        'lab:create_order',
        'lab:update_order',
        'lab:cancel_order',
        'lab:add_result',
        'lab:update_result',
        'lab:delete_result',
        'lab:import_fhir',
        'drug_interactions:check',
        'drug_interactions:lookup',
        'drug_interactions:allergy_check',
        'drug_interactions:contraindications',
        'drug_interactions:search',
        'follow_up:read',
        'follow_up:create',
        'follow_up:update',
        'follow_up:complete',
        'follow_up:reschedule',
        'follow_up:cancel',
        'follow_up:analytics',
        'adherence:read',
        'adherence:create',
        'adherence:update',
        'adherence:add_refill',
        'adherence:add_intervention',
        'adherence:acknowledge_alert',
        'adherence:resolve_alert',
        'adherence:generate_report',
    ],
    routes: {
        diagnostics: '/api/diagnostics',
        lab: '/api/lab',
        drugInteractions: '/api/interactions',
        followUps: '/api/diagnostics/follow-ups',
        adherence: '/api/diagnostics/adherence',
        analytics: '/api/diagnostics/analytics',
        audit: '/api/diagnostics/audit',
    },
    dependencies: [
        'openRouterService',
        'rxnormService',
        'openfdaService',
        'auditService',
    ],
};
exports.default = {
    routes: exports.routes,
    moduleConfig: exports.moduleConfig,
};
//# sourceMappingURL=index.js.map