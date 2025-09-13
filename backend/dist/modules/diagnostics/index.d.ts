export { DiagnosticService } from './services/diagnosticService';
export { PharmacistReviewService } from './services/pharmacistReviewService';
export { default as labService } from './services/labService';
export { default as clinicalApiService } from './services/clinicalApiService';
export { default as diagnosticFollowUpService } from './services/diagnosticFollowUpService';
export { default as adherenceService } from './services/adherenceService';
export { default as diagnosticNotificationService } from './services/diagnosticNotificationService';
export { default as diagnosticAnalyticsService } from './services/diagnosticAnalyticsService';
export { default as diagnosticAuditService } from './services/diagnosticAuditService';
export { default as DiagnosticRequest } from './models/DiagnosticRequest';
export { default as DiagnosticResult } from './models/DiagnosticResult';
export { default as LabOrder } from './models/LabOrder';
export { default as LabResult } from './models/LabResult';
export { default as DiagnosticFollowUp } from './models/DiagnosticFollowUp';
export { default as AdherenceTracking } from './models/AdherenceTracking';
export type { IDiagnosticRequest, IInputSnapshot, ISymptomData, IVitalSigns, IMedicationEntry, } from './models/DiagnosticRequest';
export type { IDiagnosticResult, IDiagnosis, ISuggestedTest, IMedicationSuggestion, IRedFlag, IReferralRecommendation, IAIMetadata, IPharmacistReview, } from './models/DiagnosticResult';
export type { ILabOrder, ILabTest, } from './models/LabOrder';
export type { ILabResult, IReferenceRange, } from './models/LabResult';
export type { IDiagnosticFollowUp, IFollowUpOutcome, IFollowUpReminder, } from './models/DiagnosticFollowUp';
export type { IAdherenceTracking, IMedicationAdherence, IAdherenceAlert, IAdherenceIntervention, } from './models/AdherenceTracking';
export { default as diagnosticRBAC } from './middlewares/diagnosticRBAC';
export { default as diagnosticValidators } from './validators/diagnosticValidators';
export { default as labValidators } from './validators/labValidators';
export { default as drugInteractionValidators } from './validators/drugInteractionValidators';
export declare const routes: {
    diagnostics: import("express-serve-static-core").Router;
    lab: import("express-serve-static-core").Router;
    drugInteractions: import("express-serve-static-core").Router;
    followUps: import("express-serve-static-core").Router;
    adherence: import("express-serve-static-core").Router;
    analytics: import("express-serve-static-core").Router;
    audit: import("express-serve-static-core").Router;
};
export declare const moduleConfig: {
    name: string;
    version: string;
    description: string;
    features: string[];
    permissions: string[];
    routes: {
        diagnostics: string;
        lab: string;
        drugInteractions: string;
        followUps: string;
        adherence: string;
        analytics: string;
        audit: string;
    };
    dependencies: string[];
};
declare const _default: {
    routes: {
        diagnostics: import("express-serve-static-core").Router;
        lab: import("express-serve-static-core").Router;
        drugInteractions: import("express-serve-static-core").Router;
        followUps: import("express-serve-static-core").Router;
        adherence: import("express-serve-static-core").Router;
        analytics: import("express-serve-static-core").Router;
        audit: import("express-serve-static-core").Router;
    };
    moduleConfig: {
        name: string;
        version: string;
        description: string;
        features: string[];
        permissions: string[];
        routes: {
            diagnostics: string;
            lab: string;
            drugInteractions: string;
            followUps: string;
            adherence: string;
            analytics: string;
            audit: string;
        };
        dependencies: string[];
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map