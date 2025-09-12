/**
 * Diagnostics Module Index
 * Main entry point for the AI-Powered Diagnostics & Therapeutics module
 */

// Import routes
import diagnosticRoutes from './routes/diagnosticRoutes';
import labRoutes from './routes/labRoutes';
import drugInteractionRoutes from './routes/drugInteractionRoutes';

// Import services
export { DiagnosticService } from './services/diagnosticService';
export { PharmacistReviewService } from './services/pharmacistReviewService';
export { default as labService } from './services/labService';
export { default as clinicalApiService } from './services/clinicalApiService';

// Import models
export { default as DiagnosticRequest } from './models/DiagnosticRequest';
export { default as DiagnosticResult } from './models/DiagnosticResult';
export { default as LabOrder } from './models/LabOrder';
export { default as LabResult } from './models/LabResult';

// Import types
export type {
    IDiagnosticRequest,
    IInputSnapshot,
    ISymptomData,
    IVitalSigns,
    IMedicationEntry,
} from './models/DiagnosticRequest';

export type {
    IDiagnosticResult,
    IDiagnosis,
    ISuggestedTest,
    IMedicationSuggestion,
    IRedFlag,
    IReferralRecommendation,
    IAIMetadata,
    IPharmacistReview,
} from './models/DiagnosticResult';

export type {
    ILabOrder,
    ILabTest,
} from './models/LabOrder';

export type {
    ILabResult,
    IReferenceRange,
} from './models/LabResult';

// Import middleware
export { default as diagnosticRBAC } from './middlewares/diagnosticRBAC';

// Import validators
export { default as diagnosticValidators } from './validators/diagnosticValidators';
export { default as labValidators } from './validators/labValidators';
export { default as drugInteractionValidators } from './validators/drugInteractionValidators';

// Export routes
export const routes = {
    diagnostics: diagnosticRoutes,
    lab: labRoutes,
    drugInteractions: drugInteractionRoutes,
};

// Module configuration
export const moduleConfig = {
    name: 'ai-diagnostics-therapeutics',
    version: '1.0.0',
    description: 'AI-Powered Diagnostics & Therapeutics module for comprehensive clinical decision support',
    features: [
        'ai_diagnostics',
        'lab_integration',
        'drug_interactions',
        'diagnostic_analytics',
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
    ],
    routes: {
        diagnostics: '/api/diagnostics',
        lab: '/api/lab',
        drugInteractions: '/api/interactions',
    },
    dependencies: [
        'openRouterService',
        'rxnormService',
        'openfdaService',
        'auditService',
    ],
};

export default {
    routes,
    moduleConfig,
};