import { z } from 'zod';
import { VALIDATION_ERROR_MESSAGES, COMMON_VALIDATION_SCHEMAS } from '@/hooks/useFormValidation';

// Patient selection schema
export const patientSelectionSchema = z.object({
    patientId: COMMON_VALIDATION_SCHEMAS.nonEmptyString,
    patientName: z.string().optional(),
});

// Symptoms schema
export const symptomsSchema = z.object({
    subjective: COMMON_VALIDATION_SCHEMAS.nonEmptyString,
    duration: COMMON_VALIDATION_SCHEMAS.nonEmptyString,
    severity: z.enum(['mild', 'moderate', 'severe'], {
        message: VALIDATION_ERROR_MESSAGES.select,
    }),
    onset: z.enum(['sudden', 'gradual', 'intermittent'], {
        message: VALIDATION_ERROR_MESSAGES.select,
    }),
    aggravatingFactors: z.string().optional(),
    relievingFactors: z.string().optional(),
});

// Medication schema
export const medicationSchema = z.object({
    name: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
});

// Medical conditions schema
export const medicalConditionsSchema = z.object({
    chronicIllnesses: z.string().optional(),
    pastSurgeries: z.string().optional(),
    familyHistory: z.string().optional(),
    lifestyleFactors: z.string().optional(),
});

// Complete case form schema
export const caseFormSchema = z.object({
    patientId: COMMON_VALIDATION_SCHEMAS.nonEmptyString,
    patientName: z.string().optional(),
    symptoms: symptomsSchema,
    currentMedications: z.array(medicationSchema),
    allergies: z.array(z.string()),
    medicalConditions: medicalConditionsSchema,
});

// Step schemas for multi-step validation
export const stepSchemas = [
    patientSelectionSchema,
    symptomsSchema,
    z.object({
        currentMedications: z.array(medicationSchema),
        allergies: z.array(z.string()),
        medicalConditions: medicalConditionsSchema,
    }),
];

// Type definitions
export type PatientSelectionFormData = z.infer<typeof patientSelectionSchema>;
export type SymptomsFormData = z.infer<typeof symptomsSchema>;
export type MedicationFormData = z.infer<typeof medicationSchema>;
export type MedicalConditionsFormData = z.infer<typeof medicalConditionsSchema>;
export type CaseFormData = z.infer<typeof caseFormSchema>;