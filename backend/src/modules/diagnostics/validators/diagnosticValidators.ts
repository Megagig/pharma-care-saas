import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Diagnostic Module Validation Schemas
 * Comprehensive Zod schemas for AI Diagnostics & Therapeutics API endpoints
 */

// Common validation patterns
const mongoIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const phoneRegex = /^\+234[7-9]\d{9}$/; // Nigerian E.164 format
const bloodPressureRegex = /^\d{2,3}\/\d{2,3}$/; // BP format like "120/80"
const loincCodeRegex = /^[0-9]{1,5}-[0-9]$/; // LOINC code format
const icdCodeRegex = /^[A-Z]\d{2}(\.\d{1,2})?$/; // ICD-10 code format
const snomedCodeRegex = /^\d{6,18}$/; // SNOMED CT identifier

// ===============================
// DIAGNOSTIC REQUEST SCHEMAS
// ===============================

// Symptom data schema
const symptomDataSchema = z.object({
    subjective: z
        .array(z.string().min(1, 'Symptom cannot be empty').max(200, 'Symptom too long'))
        .min(1, 'At least one subjective symptom is required')
        .max(20, 'Too many symptoms'),
    objective: z
        .array(z.string().min(1).max(200))
        .max(20, 'Too many objective findings')
        .default([]),
    duration: z
        .string()
        .min(1, 'Duration is required')
        .max(100, 'Duration description too long')
        .trim(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    onset: z.enum(['acute', 'chronic', 'subacute'])
});

// Vital signs schema
const vitalSignsSchema = z.object({
    bloodPressure: z
        .string()
        .regex(bloodPressureRegex, 'Blood pressure must be in format "systolic/diastolic" (e.g., 120/80)')
        .optional(),
    heartRate: z
        .number()
        .int()
        .min(30, 'Heart rate too low')
        .max(250, 'Heart rate too high')
        .optional(),
    temperature: z
        .number()
        .min(30, 'Temperature too low')
        .max(45, 'Temperature too high')
        .optional(),
    bloodGlucose: z
        .number()
        .min(20, 'Blood glucose too low')
        .max(600, 'Blood glucose too high')
        .optional(),
    respiratoryRate: z
        .number()
        .int()
        .min(8, 'Respiratory rate too low')
        .max(60, 'Respiratory rate too high')
        .optional(),
    oxygenSaturation: z
        .number()
        .min(70, 'Oxygen saturation too low')
        .max(100, 'Oxygen saturation cannot exceed 100%')
        .optional(),
    weight: z
        .number()
        .min(0.5, 'Weight too low')
        .max(1000, 'Weight too high')
        .optional(),
    height: z
        .number()
        .min(30, 'Height too low')
        .max(300, 'Height too high')
        .optional()
}).refine(
    (data) => Object.values(data).some(value => value !== undefined),
    { message: 'At least one vital sign must be provided' }
);

// Medication entry schema
const medicationEntrySchema = z.object({
    name: z
        .string()
        .min(1, 'Medication name is required')
        .max(200, 'Medication name too long')
        .trim(),
    dosage: z
        .string()
        .min(1, 'Dosage is required')
        .max(100, 'Dosage description too long')
        .trim(),
    frequency: z
        .string()
        .min(1, 'Frequency is required')
        .max(100, 'Frequency description too long')
        .trim(),
    route: z
        .string()
        .max(50, 'Route description too long')
        .trim()
        .optional(),
    startDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    indication: z
        .string()
        .max(200, 'Indication too long')
        .trim()
        .optional()
});

// Social history schema
const socialHistorySchema = z.object({
    smoking: z.enum(['never', 'former', 'current']).optional(),
    alcohol: z.enum(['never', 'occasional', 'regular', 'heavy']).optional(),
    exercise: z.enum(['sedentary', 'light', 'moderate', 'active']).optional()
});

// Input snapshot schema
const inputSnapshotSchema = z.object({
    symptoms: symptomDataSchema,
    vitals: vitalSignsSchema.optional(),
    currentMedications: z
        .array(medicationEntrySchema)
        .max(50, 'Too many medications')
        .default([]),
    allergies: z
        .array(z.string().min(1, 'Allergy cannot be empty').max(100, 'Allergy name too long'))
        .max(20, 'Too many allergies')
        .default([]),
    medicalHistory: z
        .array(z.string().min(1, 'Medical history item cannot be empty').max(200, 'Medical history item too long'))
        .max(30, 'Too many medical history items')
        .default([]),
    labResultIds: z
        .array(mongoIdSchema)
        .max(20, 'Too many lab results')
        .default([]),
    socialHistory: socialHistorySchema.optional(),
    familyHistory: z
        .array(z.string().min(1, 'Family history item cannot be empty').max(200, 'Family history item too long'))
        .max(20, 'Too many family history items')
        .default([])
});

// Create diagnostic request schema
export const createDiagnosticRequestSchema = z.object({
    patientId: mongoIdSchema,
    inputSnapshot: inputSnapshotSchema,
    consentObtained: z
        .boolean()
        .refine(val => val === true, { message: 'Patient consent is required for AI diagnostic processing' }),
    priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
    clinicalUrgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    promptVersion: z
        .string()
        .max(20, 'Prompt version too long')
        .default('v1.0')
});

// Update diagnostic request schema
export const updateDiagnosticRequestSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional(),
    clinicalUrgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    errorMessage: z.string().max(1000, 'Error message too long').optional()
});

// Diagnostic request params schema
export const diagnosticRequestParamsSchema = z.object({
    id: mongoIdSchema
});

// Diagnostic request query schema
export const diagnosticRequestQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .default('1')
        .transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z
        .string()
        .optional()
        .default('10')
        .transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional(),
    patientId: mongoIdSchema.optional(),
    pharmacistId: mongoIdSchema.optional(),
    fromDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    toDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional()
});

// ===============================
// DIAGNOSTIC RESULT SCHEMAS
// ===============================

// Pharmacist review schema
const pharmacistReviewSchema = z.object({
    status: z.enum(['approved', 'modified', 'rejected']),
    modifications: z
        .string()
        .max(2000, 'Modifications too long')
        .optional(),
    rejectionReason: z
        .string()
        .max(1000, 'Rejection reason too long')
        .optional(),
    reviewNotes: z
        .string()
        .max(1000, 'Review notes too long')
        .optional(),
    clinicalJustification: z
        .string()
        .max(1000, 'Clinical justification too long')
        .optional()
}).refine(
    (data) => {
        if (data.status === 'rejected' && !data.rejectionReason) {
            return false;
        }
        if (data.status === 'modified' && !data.modifications) {
            return false;
        }
        return true;
    },
    {
        message: 'Rejection reason required for rejected status, modifications required for modified status'
    }
);

// Approve diagnostic result schema
export const approveDiagnosticResultSchema = pharmacistReviewSchema;

// ===============================
// LAB ORDER SCHEMAS
// ===============================

// Lab test schema
const labTestSchema = z.object({
    code: z
        .string()
        .min(1, 'Test code is required')
        .max(20, 'Test code too long')
        .trim()
        .transform(val => val.toUpperCase()),
    name: z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name too long')
        .trim(),
    loincCode: z
        .string()
        .regex(loincCodeRegex, 'Invalid LOINC code format')
        .optional(),
    indication: z
        .string()
        .min(1, 'Indication is required')
        .max(500, 'Indication too long')
        .trim(),
    priority: z.enum(['stat', 'urgent', 'routine']),
    category: z
        .string()
        .max(100, 'Category too long')
        .trim()
        .optional(),
    specimen: z
        .string()
        .max(100, 'Specimen type too long')
        .trim()
        .optional(),
    expectedTurnaround: z
        .string()
        .max(50, 'Expected turnaround too long')
        .trim()
        .optional(),
    estimatedCost: z
        .number()
        .min(0, 'Cost cannot be negative')
        .optional(),
    clinicalNotes: z
        .string()
        .max(500, 'Clinical notes too long')
        .trim()
        .optional()
});

// Create lab order schema
export const createLabOrderSchema = z.object({
    patientId: mongoIdSchema,
    tests: z
        .array(labTestSchema)
        .min(1, 'At least one test is required')
        .max(20, 'Too many tests in single order'),
    clinicalIndication: z
        .string()
        .min(1, 'Clinical indication is required')
        .max(1000, 'Clinical indication too long')
        .trim(),
    urgentReason: z
        .string()
        .max(500, 'Urgent reason too long')
        .trim()
        .optional(),
    patientInstructions: z
        .string()
        .max(1000, 'Patient instructions too long')
        .trim()
        .optional(),
    labInstructions: z
        .string()
        .max(1000, 'Lab instructions too long')
        .trim()
        .optional(),
    expectedDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    insurancePreAuth: z.boolean().default(false)
});

// Update lab order schema
export const updateLabOrderSchema = z.object({
    status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled', 'rejected']).optional(),
    collectionNotes: z
        .string()
        .max(500, 'Collection notes too long')
        .trim()
        .optional(),
    specimenType: z
        .string()
        .max(100, 'Specimen type too long')
        .trim()
        .optional(),
    collectionSite: z
        .string()
        .max(100, 'Collection site too long')
        .trim()
        .optional(),
    rejectionReason: z
        .string()
        .max(500, 'Rejection reason too long')
        .trim()
        .optional(),
    trackingNumber: z
        .string()
        .max(50, 'Tracking number too long')
        .trim()
        .optional()
});

// Lab order params schema
export const labOrderParamsSchema = z.object({
    id: mongoIdSchema
});

// Lab order query schema
export const labOrderQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .default('1')
        .transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z
        .string()
        .optional()
        .default('10')
        .transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
    status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled', 'rejected']).optional(),
    priority: z.enum(['stat', 'urgent', 'routine']).optional(),
    patientId: mongoIdSchema.optional(),
    orderedBy: mongoIdSchema.optional(),
    fromDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    toDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    overdue: z
        .string()
        .optional()
        .transform(val => val === 'true')
});

// ===============================
// LAB RESULT SCHEMAS
// ===============================

// Reference range schema
const referenceRangeSchema = z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    text: z
        .string()
        .max(200, 'Reference range text too long')
        .trim()
        .optional(),
    unit: z
        .string()
        .max(20, 'Unit too long')
        .trim()
        .optional(),
    ageGroup: z
        .string()
        .max(50, 'Age group too long')
        .trim()
        .optional(),
    gender: z.enum(['male', 'female', 'all']).default('all'),
    condition: z
        .string()
        .max(100, 'Condition too long')
        .trim()
        .optional()
}).refine(
    (data) => data.low !== undefined || data.high !== undefined || data.text,
    { message: 'Reference range must have numeric range or text description' }
);

// Create lab result schema
export const createLabResultSchema = z.object({
    orderId: mongoIdSchema.optional(),
    patientId: mongoIdSchema,
    testCode: z
        .string()
        .min(1, 'Test code is required')
        .max(20, 'Test code too long')
        .trim()
        .transform(val => val.toUpperCase()),
    testName: z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name too long')
        .trim(),
    testCategory: z
        .string()
        .max(100, 'Test category too long')
        .trim()
        .optional(),
    loincCode: z
        .string()
        .regex(loincCodeRegex, 'Invalid LOINC code format')
        .optional(),
    value: z
        .string()
        .min(1, 'Result value is required')
        .max(500, 'Result value too long')
        .trim(),
    unit: z
        .string()
        .max(20, 'Unit too long')
        .trim()
        .optional(),
    referenceRange: referenceRangeSchema,
    interpretation: z.enum(['low', 'normal', 'high', 'critical', 'abnormal', 'inconclusive']).optional(),
    flags: z
        .array(z.string().min(1).max(50))
        .max(10, 'Too many flags')
        .default([]),
    criticalValue: z.boolean().default(false),
    specimenCollectedAt: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    performedAt: z
        .string()
        .datetime()
        .transform(val => new Date(val)),
    source: z.enum(['manual', 'fhir', 'lis', 'external', 'imported']).default('manual'),
    externalResultId: z
        .string()
        .max(100, 'External result ID too long')
        .trim()
        .optional(),
    technicalNotes: z
        .string()
        .max(1000, 'Technical notes too long')
        .trim()
        .optional(),
    methodUsed: z
        .string()
        .max(100, 'Method used too long')
        .trim()
        .optional(),
    instrumentId: z
        .string()
        .max(50, 'Instrument ID too long')
        .trim()
        .optional(),
    clinicalNotes: z
        .string()
        .max(2000, 'Clinical notes too long')
        .trim()
        .optional(),
    followUpRequired: z.boolean().default(false),
    followUpInstructions: z
        .string()
        .max(1000, 'Follow-up instructions too long')
        .trim()
        .optional()
});

// Update lab result schema
export const updateLabResultSchema = z.object({
    value: z
        .string()
        .min(1, 'Result value is required')
        .max(500, 'Result value too long')
        .trim()
        .optional(),
    interpretation: z.enum(['low', 'normal', 'high', 'critical', 'abnormal', 'inconclusive']).optional(),
    flags: z
        .array(z.string().min(1).max(50))
        .max(10, 'Too many flags')
        .optional(),
    criticalValue: z.boolean().optional(),
    reviewStatus: z.enum(['pending', 'reviewed', 'flagged', 'approved']).optional(),
    reviewNotes: z
        .string()
        .max(1000, 'Review notes too long')
        .trim()
        .optional(),
    clinicalNotes: z
        .string()
        .max(2000, 'Clinical notes too long')
        .trim()
        .optional(),
    followUpRequired: z.boolean().optional(),
    followUpInstructions: z
        .string()
        .max(1000, 'Follow-up instructions too long')
        .trim()
        .optional()
});

// Lab result params schema
export const labResultParamsSchema = z.object({
    id: mongoIdSchema
});

// Lab result query schema
export const labResultQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .default('1')
        .transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z
        .string()
        .optional()
        .default('10')
        .transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
    patientId: mongoIdSchema.optional(),
    testCode: z.string().optional(),
    interpretation: z.enum(['low', 'normal', 'high', 'critical', 'abnormal', 'inconclusive']).optional(),
    criticalValue: z
        .string()
        .optional()
        .transform(val => val === 'true'),
    reviewStatus: z.enum(['pending', 'reviewed', 'flagged', 'approved']).optional(),
    followUpRequired: z
        .string()
        .optional()
        .transform(val => val === 'true'),
    fromDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    toDate: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
    source: z.enum(['manual', 'fhir', 'lis', 'external', 'imported']).optional()
});

// ===============================
// DRUG INTERACTION SCHEMAS
// ===============================

// Drug interaction check schema
export const drugInteractionCheckSchema = z.object({
    medications: z
        .array(z.string().min(1, 'Medication name cannot be empty').max(200, 'Medication name too long'))
        .min(1, 'At least one medication is required')
        .max(20, 'Too many medications for interaction check'),
    patientAllergies: z
        .array(z.string().min(1).max(100))
        .max(20, 'Too many allergies')
        .default([]),
    patientAge: z
        .number()
        .int()
        .min(0, 'Age cannot be negative')
        .max(150, 'Age too high')
        .optional(),
    patientWeight: z
        .number()
        .min(0.5, 'Weight too low')
        .max(1000, 'Weight too high')
        .optional(),
    renalFunction: z.enum(['normal', 'mild', 'moderate', 'severe', 'dialysis']).optional(),
    hepaticFunction: z.enum(['normal', 'mild', 'moderate', 'severe']).optional()
});

// ===============================
// FHIR IMPORT SCHEMAS
// ===============================

// FHIR import schema
export const fhirImportSchema = z.object({
    fhirBundle: z.object({}).passthrough(), // Allow any FHIR bundle structure
    patientMapping: z.object({
        externalPatientId: z.string().min(1, 'External patient ID is required'),
        internalPatientId: mongoIdSchema
    }).optional(),
    validateOnly: z.boolean().default(false),
    overwriteExisting: z.boolean().default(false)
});

// ===============================
// CLINICAL VALIDATION HELPERS
// ===============================

// Custom validators for clinical data
export const clinicalValidators = {
    // Validate vital signs are within reasonable ranges
    validateVitalSigns: (vitals: any) => {
        if (vitals.bloodPressure) {
            const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
            if (systolic <= diastolic) {
                throw new Error('Systolic pressure must be higher than diastolic pressure');
            }
        }

        if (vitals.temperature && vitals.temperature > 42) {
            throw new Error('Temperature above 42°C requires immediate medical attention');
        }

        if (vitals.heartRate && vitals.oxygenSaturation) {
            if (vitals.heartRate > 150 && vitals.oxygenSaturation < 90) {
                throw new Error('Critical vital signs combination detected');
            }
        }

        return true;
    },

    // Validate medication interactions
    validateMedicationList: (medications: any[]) => {
        const drugNames = medications.map(med => med.name.toLowerCase());
        const duplicates = drugNames.filter((name, index) => drugNames.indexOf(name) !== index);

        if (duplicates.length > 0) {
            throw new Error(`Duplicate medications detected: ${duplicates.join(', ')}`);
        }

        return true;
    },

    // Validate lab result values
    validateLabResult: (result: any) => {
        if (result.numericValue !== undefined && result.referenceRange) {
            const { low, high } = result.referenceRange;

            if (low !== undefined && high !== undefined && low >= high) {
                throw new Error('Reference range low value must be less than high value');
            }

            // Flag extremely abnormal values
            if (low !== undefined && result.numericValue < (low * 0.1)) {
                throw new Error('Result value is extremely low and may indicate data entry error');
            }

            if (high !== undefined && result.numericValue > (high * 10)) {
                throw new Error('Result value is extremely high and may indicate data entry error');
            }
        }

        return true;
    }
};

// ===============================
// VALIDATION MIDDLEWARE
// ===============================

type ValidationTarget = 'body' | 'params' | 'query';

export const validateRequest = (
    schema: z.ZodSchema,
    target: ValidationTarget = 'body'
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[target];
            const validated = schema.parse(data);

            // Apply clinical validations for specific schemas
            if (target === 'body') {
                const validatedData = validated as any;
                if (validatedData.inputSnapshot?.vitals) {
                    clinicalValidators.validateVitalSigns(validatedData.inputSnapshot.vitals);
                }

                if (validatedData.inputSnapshot?.currentMedications) {
                    clinicalValidators.validateMedicationList(validatedData.inputSnapshot.currentMedications);
                }

                if (validatedData.value && validatedData.referenceRange) {
                    clinicalValidators.validateLabResult(validatedData);
                }
            }

            req[target] = validated;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                    received: err.received
                }));

                res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    errors,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Invalid request data',
                    code: 'BAD_REQUEST',
                    timestamp: new Date().toISOString()
                });
            }
        }
    };
};

// ===============================
// SANITIZATION HELPERS
// ===============================

export const sanitizeInput = {
    // Remove potentially harmful characters from clinical text
    sanitizeClinicalText: (text: string): string => {
        return text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    },

    // Sanitize medication names
    sanitizeMedicationName: (name: string): string => {
        return name
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/[<>\"'&]/g, '') // Remove HTML special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    },

    // Sanitize numeric values
    sanitizeNumericValue: (value: string): string => {
        return value
            .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus sign
            .replace(/^-+/, '-') // Keep only one minus sign at start
            .replace(/\.+/g, '.'); // Keep only one decimal point
    }
};

export default {
    createDiagnosticRequestSchema,
    updateDiagnosticRequestSchema,
    diagnosticRequestParamsSchema,
    diagnosticRequestQuerySchema,
    approveDiagnosticResultSchema,
    createLabOrderSchema,
    updateLabOrderSchema,
    labOrderParamsSchema,
    labOrderQuerySchema,
    createLabResultSchema,
    updateLabResultSchema,
    labResultParamsSchema,
    labResultQuerySchema,
    drugInteractionCheckSchema,
    fhirImportSchema,
    validateRequest,
    clinicalValidators,
    sanitizeInput
};