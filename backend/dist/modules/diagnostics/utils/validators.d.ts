import Joi from 'joi';
export declare const diagnosticRequestSchema: any;
export declare const labOrderSchema: any;
export declare const labResultSchema: any;
export declare const interactionCheckSchema: any;
export declare const pharmacistReviewSchema: any;
export declare const fhirImportSchema: any;
export declare const validateDiagnosticRequest: (data: unknown) => any;
export declare const validateLabOrder: (data: unknown) => any;
export declare const validateLabResult: (data: unknown) => any;
export declare const validateInteractionCheck: (data: unknown) => any;
export declare const validatePharmacistReview: (data: unknown) => any;
export declare const validateFHIRImport: (data: unknown) => any;
export declare const formatValidationErrors: (error: Joi.ValidationError) => any;
//# sourceMappingURL=validators.d.ts.map