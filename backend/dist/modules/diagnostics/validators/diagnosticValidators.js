"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBloodPressure = exports.validateMedicationFrequency = exports.validateMedicationDosage = exports.validateVitalSignsForAge = exports.validateConsentTimestamp = exports.validateRequest = exports.analyticsQuerySchema = exports.createInterventionSchema = exports.pendingReviewsQuerySchema = exports.rejectResultSchema = exports.approveResultSchema = exports.diagnosticQuerySchema = exports.patientHistoryParamsSchema = exports.diagnosticParamsSchema = exports.createDiagnosticRequestSchema = exports.inputSnapshotSchema = exports.socialHistorySchema = exports.medicationEntrySchema = exports.vitalSignsSchema = exports.symptomDataSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const legacyCaseIdSchema = zod_1.z
    .string()
    .regex(/^DX-[A-Z0-9]+-[A-Z0-9]+$/i, 'Invalid legacy Diagnostic Case ID');
const caseIdOrMongoIdSchema = zod_1.z.union([mongoIdSchema, legacyCaseIdSchema]);
const phoneRegex = /^\+234[7-9]\d{9}$/;
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .default('1')
        .transform((val) => Math.max(1, parseInt(val) || 1)),
    limit: zod_1.z
        .string()
        .optional()
        .default('20')
        .transform((val) => Math.min(50, Math.max(1, parseInt(val) || 20))),
});
exports.symptomDataSchema = zod_1.z.object({
    subjective: zod_1.z
        .array(zod_1.z.string().min(1, 'Symptom cannot be empty').max(200))
        .min(1, 'At least one subjective symptom is required')
        .max(20, 'Maximum 20 symptoms allowed'),
    objective: zod_1.z
        .array(zod_1.z.string().min(1).max(200))
        .max(20, 'Maximum 20 objective findings allowed')
        .default([]),
    duration: zod_1.z
        .string()
        .min(1, 'Duration is required')
        .max(100, 'Duration description too long'),
    severity: zod_1.z.enum(['mild', 'moderate', 'severe']),
    onset: zod_1.z.enum(['acute', 'chronic', 'subacute']),
});
exports.vitalSignsSchema = zod_1.z.object({
    bloodPressure: zod_1.z
        .string()
        .regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format "systolic/diastolic"')
        .optional(),
    heartRate: zod_1.z
        .number()
        .int()
        .min(30, 'Heart rate too low')
        .max(250, 'Heart rate too high')
        .optional(),
    temperature: zod_1.z
        .number()
        .min(30, 'Temperature too low')
        .max(45, 'Temperature too high')
        .optional(),
    bloodGlucose: zod_1.z
        .number()
        .min(20, 'Blood glucose too low')
        .max(600, 'Blood glucose too high')
        .optional(),
    respiratoryRate: zod_1.z
        .number()
        .int()
        .min(8, 'Respiratory rate too low')
        .max(60, 'Respiratory rate too high')
        .optional(),
    oxygenSaturation: zod_1.z
        .number()
        .min(70, 'Oxygen saturation too low')
        .max(100, 'Oxygen saturation cannot exceed 100%')
        .optional(),
    weight: zod_1.z
        .number()
        .min(0.5, 'Weight too low')
        .max(1000, 'Weight too high')
        .optional(),
    height: zod_1.z
        .number()
        .min(30, 'Height too low')
        .max(300, 'Height too high')
        .optional(),
});
exports.medicationEntrySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Medication name is required')
        .max(200, 'Medication name too long'),
    dosage: zod_1.z
        .string()
        .min(1, 'Dosage is required')
        .max(100, 'Dosage description too long'),
    frequency: zod_1.z
        .string()
        .min(1, 'Frequency is required')
        .max(100, 'Frequency description too long'),
    route: zod_1.z
        .string()
        .max(50, 'Route description too long')
        .optional(),
    startDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    indication: zod_1.z
        .string()
        .max(200, 'Indication description too long')
        .optional(),
});
exports.socialHistorySchema = zod_1.z.object({
    smoking: zod_1.z.enum(['never', 'former', 'current']).optional(),
    alcohol: zod_1.z.enum(['never', 'occasional', 'regular', 'heavy']).optional(),
    exercise: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
});
exports.inputSnapshotSchema = zod_1.z.object({
    symptoms: exports.symptomDataSchema,
    vitals: exports.vitalSignsSchema.optional(),
    currentMedications: zod_1.z
        .array(exports.medicationEntrySchema)
        .max(50, 'Maximum 50 medications allowed')
        .default([]),
    allergies: zod_1.z
        .array(zod_1.z.string().min(1, 'Allergy cannot be empty').max(100))
        .max(20, 'Maximum 20 allergies allowed')
        .default([]),
    medicalHistory: zod_1.z
        .array(zod_1.z.string().min(1, 'Medical history item cannot be empty').max(200))
        .max(30, 'Maximum 30 medical history items allowed')
        .default([]),
    labResultIds: zod_1.z
        .array(mongoIdSchema)
        .max(20, 'Maximum 20 lab results allowed')
        .default([]),
    socialHistory: exports.socialHistorySchema.optional(),
    familyHistory: zod_1.z
        .array(zod_1.z.string().min(1, 'Family history item cannot be empty').max(200))
        .max(20, 'Maximum 20 family history items allowed')
        .default([]),
});
exports.createDiagnosticRequestSchema = zod_1.z.object({
    patientId: mongoIdSchema,
    inputSnapshot: exports.inputSnapshotSchema,
    priority: zod_1.z.enum(['routine', 'urgent', 'stat']).default('routine'),
    consentObtained: zod_1.z
        .boolean()
        .refine((val) => val === true, {
        message: 'Patient consent is required for AI diagnostic processing',
    }),
});
exports.diagnosticParamsSchema = zod_1.z.object({
    id: caseIdOrMongoIdSchema,
});
exports.patientHistoryParamsSchema = zod_1.z.object({
    patientId: mongoIdSchema,
});
exports.diagnosticQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    priority: zod_1.z.enum(['routine', 'urgent', 'stat']).optional(),
    pharmacistId: mongoIdSchema.optional(),
})
    .merge(exports.paginationSchema);
exports.approveResultSchema = zod_1.z.object({
    modifications: zod_1.z
        .string()
        .max(2000, 'Modifications cannot exceed 2000 characters')
        .optional(),
    reviewNotes: zod_1.z
        .string()
        .max(1000, 'Review notes cannot exceed 1000 characters')
        .optional(),
    clinicalJustification: zod_1.z
        .string()
        .max(1000, 'Clinical justification cannot exceed 1000 characters')
        .optional(),
});
exports.rejectResultSchema = zod_1.z.object({
    rejectionReason: zod_1.z
        .string()
        .min(1, 'Rejection reason is required')
        .max(1000, 'Rejection reason cannot exceed 1000 characters'),
    reviewNotes: zod_1.z
        .string()
        .max(1000, 'Review notes cannot exceed 1000 characters')
        .optional(),
    clinicalJustification: zod_1.z
        .string()
        .max(1000, 'Clinical justification cannot exceed 1000 characters')
        .optional(),
});
exports.pendingReviewsQuerySchema = zod_1.z
    .object({
    priority: zod_1.z.enum(['routine', 'urgent', 'stat']).optional(),
    confidenceMin: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .refine((val) => val === undefined || (val >= 0 && val <= 1), {
        message: 'Confidence must be between 0 and 1',
    }),
    confidenceMax: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .refine((val) => val === undefined || (val >= 0 && val <= 1), {
        message: 'Confidence must be between 0 and 1',
    }),
    hasRedFlags: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        if (val === undefined)
            return undefined;
        return val === 'true';
    }),
    orderBy: zod_1.z.enum(['oldest', 'newest', 'priority', 'confidence']).default('oldest'),
})
    .merge(exports.paginationSchema)
    .refine((data) => {
    if (data.confidenceMin !== undefined && data.confidenceMax !== undefined) {
        return data.confidenceMin <= data.confidenceMax;
    }
    return true;
}, {
    message: 'Minimum confidence cannot be greater than maximum confidence',
    path: ['confidenceMin'],
});
exports.createInterventionSchema = zod_1.z.object({
    type: zod_1.z.enum(['medication_review', 'counseling', 'referral', 'monitoring', 'lifestyle']),
    title: zod_1.z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters'),
    description: zod_1.z
        .string()
        .min(1, 'Description is required')
        .max(2000, 'Description cannot exceed 2000 characters'),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']),
    category: zod_1.z
        .string()
        .min(1, 'Category is required')
        .max(100, 'Category cannot exceed 100 characters'),
    recommendations: zod_1.z
        .array(zod_1.z.string().min(1, 'Recommendation cannot be empty').max(500))
        .min(1, 'At least one recommendation is required')
        .max(10, 'Maximum 10 recommendations allowed'),
    followUpRequired: zod_1.z.boolean().default(false),
    followUpDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    targetOutcome: zod_1.z
        .string()
        .max(500, 'Target outcome cannot exceed 500 characters')
        .optional(),
    monitoringParameters: zod_1.z
        .array(zod_1.z.string().min(1).max(200))
        .max(10, 'Maximum 10 monitoring parameters allowed')
        .default([]),
});
exports.analyticsQuerySchema = zod_1.z.object({
    from: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    to: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
});
const validateRequest = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[target];
            const validated = schema.parse(data);
            req[target] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    errors,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request data',
                    code: 'BAD_REQUEST',
                });
            }
        }
    };
};
exports.validateRequest = validateRequest;
const validateConsentTimestamp = (timestamp) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return timestamp >= twentyFourHoursAgo && timestamp <= now;
};
exports.validateConsentTimestamp = validateConsentTimestamp;
const validateVitalSignsForAge = (vitals, patientAge) => {
    const errors = [];
    if (vitals.heartRate) {
        let minHR = 60;
        let maxHR = 100;
        if (patientAge < 1) {
            minHR = 100;
            maxHR = 160;
        }
        else if (patientAge < 3) {
            minHR = 90;
            maxHR = 150;
        }
        else if (patientAge < 6) {
            minHR = 80;
            maxHR = 140;
        }
        else if (patientAge < 12) {
            minHR = 70;
            maxHR = 120;
        }
        else if (patientAge < 18) {
            minHR = 60;
            maxHR = 110;
        }
        if (vitals.heartRate < minHR || vitals.heartRate > maxHR) {
            errors.push(`Heart rate ${vitals.heartRate.toString()} is outside normal range for age ${patientAge} (${minHR}-${maxHR})`);
        }
    }
    if (vitals.respiratoryRate) {
        let minRR = 12;
        let maxRR = 20;
        if (patientAge < 1) {
            minRR = 30;
            maxRR = 60;
        }
        else if (patientAge < 3) {
            minRR = 24;
            maxRR = 40;
        }
        else if (patientAge < 6) {
            minRR = 22;
            maxRR = 34;
        }
        else if (patientAge < 12) {
            minRR = 18;
            maxRR = 30;
        }
        else if (patientAge < 18) {
            minRR = 12;
            maxRR = 16;
        }
        if (vitals.respiratoryRate < minRR || vitals.respiratoryRate > maxRR) {
            errors.push(`Respiratory rate ${vitals.respiratoryRate.toString()} is outside normal range for age ${patientAge} (${minRR}-${maxRR})`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateVitalSignsForAge = validateVitalSignsForAge;
const validateMedicationDosage = (dosage) => {
    const dosagePattern = /^(\d+(\.\d+)?)\s*(mg|g|ml|l|tablets?|capsules?|drops?|units?|iu|mcg|μg)(\s*\/\s*(day|dose|kg|m2))?$/i;
    return dosagePattern.test(dosage.trim());
};
exports.validateMedicationDosage = validateMedicationDosage;
const validateMedicationFrequency = (frequency) => {
    const frequencyPatterns = [
        /^(once|twice|three times?|four times?|\d+\s*times?)\s*(daily|per day|a day)$/i,
        /^every\s+\d+\s*(hours?|hrs?|minutes?|mins?)$/i,
        /^(prn|as needed|when required)$/i,
        /^(bid|tid|qid|qd|od|bd|tds|qds)$/i,
        /^\d+x\s*(daily|per day)$/i,
    ];
    return frequencyPatterns.some(pattern => pattern.test(frequency.trim()));
};
exports.validateMedicationFrequency = validateMedicationFrequency;
const validateBloodPressure = (bp) => {
    const bpMatch = bp.match(/^(\d{2,3})\/(\d{2,3})$/);
    if (!bpMatch) {
        return { valid: false, error: 'Blood pressure must be in format "systolic/diastolic"' };
    }
    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);
    if (systolic < 70 || systolic > 250) {
        return { valid: false, error: 'Systolic pressure must be between 70-250 mmHg' };
    }
    if (diastolic < 40 || diastolic > 150) {
        return { valid: false, error: 'Diastolic pressure must be between 40-150 mmHg' };
    }
    if (systolic <= diastolic) {
        return { valid: false, error: 'Systolic pressure must be higher than diastolic pressure' };
    }
    return { valid: true, systolic, diastolic };
};
exports.validateBloodPressure = validateBloodPressure;
exports.default = {
    validateRequest: exports.validateRequest,
    validateConsentTimestamp: exports.validateConsentTimestamp,
    validateVitalSignsForAge: exports.validateVitalSignsForAge,
    validateMedicationDosage: exports.validateMedicationDosage,
    validateMedicationFrequency: exports.validateMedicationFrequency,
    validateBloodPressure: exports.validateBloodPressure,
};
//# sourceMappingURL=diagnosticValidators.js.map