import Joi from 'joi';
import type { CreateDiagnosticRequestData, CreateLabOrderData, CreateLabResultData } from '../types';
export declare const diagnosticRequestSchema: Joi.ObjectSchema<CreateDiagnosticRequestData>;
export declare const labOrderSchema: Joi.ObjectSchema<CreateLabOrderData>;
export declare const labResultSchema: Joi.ObjectSchema<CreateLabResultData>;
export declare const interactionCheckSchema: Joi.ObjectSchema<any>;
export declare const pharmacistReviewSchema: Joi.ObjectSchema<any>;
export declare const fhirImportSchema: Joi.ObjectSchema<any>;
export declare const validateDiagnosticRequest: (data: unknown) => Joi.ValidationResult<CreateDiagnosticRequestData>;
export declare const validateLabOrder: (data: unknown) => Joi.ValidationResult<CreateLabOrderData>;
export declare const validateLabResult: (data: unknown) => Joi.ValidationResult<CreateLabResultData>;
export declare const validateInteractionCheck: (data: unknown) => Joi.ValidationResult<any>;
export declare const validatePharmacistReview: (data: unknown) => Joi.ValidationResult<any>;
export declare const validateFHIRImport: (data: unknown) => Joi.ValidationResult<any>;
export declare const formatValidationErrors: (error: Joi.ValidationError) => {
    field: string;
    message: string;
    code: string;
}[];
//# sourceMappingURL=validators.d.ts.map