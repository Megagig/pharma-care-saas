import { z } from 'zod';
export declare const checkInteractionsSchema: z.ZodObject<{
    medications: z.ZodArray<z.ZodString>;
    patientAllergies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    includeContraindications: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const drugInfoSchema: z.ZodObject<{
    drugName: z.ZodString;
    includeInteractions: z.ZodDefault<z.ZodBoolean>;
    includeIndications: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const allergyCheckSchema: z.ZodObject<{
    medications: z.ZodArray<z.ZodString>;
    allergies: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const contraindicationCheckSchema: z.ZodObject<{
    medications: z.ZodArray<z.ZodString>;
    conditions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    patientAge: z.ZodOptional<z.ZodNumber>;
    patientGender: z.ZodOptional<z.ZodEnum<{
        male: "male";
        female: "female";
        other: "other";
    }>>;
}, z.core.$strip>;
export declare const drugSearchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
import { Request, Response, NextFunction } from 'express';
type ValidationTarget = 'body' | 'params' | 'query';
export declare const validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMedicationName: (medicationName: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateAllergyName: (allergyName: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateConditionName: (conditionName: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateMedicationList: (medications: string[]) => {
    valid: boolean;
    errors: string[];
};
export declare const validateAllergyList: (allergies: string[]) => {
    valid: boolean;
    errors: string[];
};
export declare const validateConditionList: (conditions: string[]) => {
    valid: boolean;
    errors: string[];
};
export declare const validatePatientAge: (age: number) => {
    valid: boolean;
    error?: string;
    ageGroup?: string;
};
export declare const validateDrugSearchQuery: (query: string) => {
    valid: boolean;
    error?: string;
};
export declare const sanitizeMedicationName: (medicationName: string) => string;
export declare const normalizeMedicationName: (medicationName: string) => string;
declare const _default: {
    validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
    validateMedicationName: (medicationName: string) => {
        valid: boolean;
        error?: string;
    };
    validateAllergyName: (allergyName: string) => {
        valid: boolean;
        error?: string;
    };
    validateConditionName: (conditionName: string) => {
        valid: boolean;
        error?: string;
    };
    validateMedicationList: (medications: string[]) => {
        valid: boolean;
        errors: string[];
    };
    validateAllergyList: (allergies: string[]) => {
        valid: boolean;
        errors: string[];
    };
    validateConditionList: (conditions: string[]) => {
        valid: boolean;
        errors: string[];
    };
    validatePatientAge: (age: number) => {
        valid: boolean;
        error?: string;
        ageGroup?: string;
    };
    validateDrugSearchQuery: (query: string) => {
        valid: boolean;
        error?: string;
    };
    sanitizeMedicationName: (medicationName: string) => string;
    normalizeMedicationName: (medicationName: string) => string;
};
export default _default;
//# sourceMappingURL=drugInteractionValidators.d.ts.map