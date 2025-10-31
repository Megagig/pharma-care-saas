"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.attachmentSchema = exports.visitParamsSchema = exports.updateVisitSchema = exports.createVisitSchema = exports.carePlanParamsSchema = exports.updateCarePlanSchema = exports.createCarePlanSchema = exports.dtpQuerySchema = exports.dtpParamsSchema = exports.updateDTPSchema = exports.createDTPSchema = exports.assessmentParamsSchema = exports.updateAssessmentSchema = exports.createAssessmentSchema = exports.medicationQuerySchema = exports.medicationParamsSchema = exports.updateMedicationSchema = exports.createMedicationSchema = exports.conditionIdSchema = exports.conditionParamsSchema = exports.updateConditionSchema = exports.createConditionSchema = exports.allergyParamsSchema = exports.updateAllergySchema = exports.createAllergySchema = exports.patientParamsSchema = exports.updatePatientSchema = exports.createPatientSchema = exports.searchSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const tenancyGuard_1 = require("../utils/tenancyGuard");
const phoneRegex = /^\+234[7-9]\d{9}$/;
const snomedRegex = /^\d{6,18}$/;
const mrnRegex = /^PHM-[A-Z]{3}-\d{5}$/;
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .default('1')
        .transform((val) => Math.max(1, parseInt(val) || 1)),
    limit: zod_1.z
        .string()
        .optional()
        .default('10')
        .transform((val) => Math.min(100, Math.max(1, parseInt(val) || 10))),
    sort: zod_1.z.string().optional().default('-createdAt'),
});
exports.searchSchema = zod_1.z
    .object({
    q: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    mrn: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    state: zod_1.z.enum(tenancyGuard_1.NIGERIAN_STATES).optional(),
    bloodGroup: zod_1.z.enum(tenancyGuard_1.BLOOD_GROUPS).optional(),
    genotype: zod_1.z.enum(tenancyGuard_1.GENOTYPES).optional(),
})
    .merge(exports.paginationSchema)
    .transform((data) => ({
    ...data,
    q: data.q || data.search,
}));
exports.createPatientSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name cannot exceed 50 characters')
        .trim(),
    lastName: zod_1.z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name cannot exceed 50 characters')
        .trim(),
    otherNames: zod_1.z.string().max(100).trim().optional(),
    dob: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    age: zod_1.z.number().int().min(0).max(150).optional(),
    gender: zod_1.z.enum(tenancyGuard_1.GENDERS).optional(),
    phone: zod_1.z
        .string()
        .regex(phoneRegex, 'Phone must be in +234 format')
        .or(zod_1.z.literal(''))
        .optional(),
    email: zod_1.z.string().email('Invalid email format').or(zod_1.z.literal('')).optional(),
    address: zod_1.z.string().max(200).trim().optional(),
    state: zod_1.z.enum(tenancyGuard_1.NIGERIAN_STATES).optional(),
    lga: zod_1.z.string().max(100).trim().optional(),
    maritalStatus: zod_1.z.enum(tenancyGuard_1.MARITAL_STATUS).optional(),
    bloodGroup: zod_1.z.enum(tenancyGuard_1.BLOOD_GROUPS).optional(),
    genotype: zod_1.z.enum(tenancyGuard_1.GENOTYPES).optional(),
    weightKg: zod_1.z.number().positive().max(1000).optional(),
    allergies: zod_1.z
        .array(zod_1.z.object({
        substance: zod_1.z.string().min(1).max(100).trim(),
        reaction: zod_1.z.string().max(200).trim().optional(),
        severity: zod_1.z.enum(tenancyGuard_1.SEVERITY_LEVELS).optional(),
        notedAt: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
    }))
        .optional(),
    conditions: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).trim(),
        snomedId: zod_1.z.string().regex(snomedRegex).optional(),
        onsetDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        status: zod_1.z.enum(['active', 'resolved', 'remission']).optional(),
        notes: zod_1.z.string().max(500).trim().optional(),
    }))
        .optional(),
    medications: zod_1.z
        .array(zod_1.z.object({
        phase: zod_1.z.enum(['past', 'current']),
        medicationName: zod_1.z.string().min(1).max(100).trim(),
        purposeIndication: zod_1.z.string().max(200).trim().optional(),
        dose: zod_1.z.string().max(50).trim().optional(),
        frequency: zod_1.z.string().max(50).trim().optional(),
        route: zod_1.z.string().max(20).trim().optional(),
        duration: zod_1.z.string().max(50).trim().optional(),
        startDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        endDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        adherence: zod_1.z.enum(['good', 'poor', 'unknown']).optional(),
        notes: zod_1.z.string().max(500).trim().optional(),
    }))
        .optional(),
    assessment: zod_1.z
        .object({
        vitals: zod_1.z
            .object({
            bpSys: zod_1.z.number().int().min(50).max(300).optional(),
            bpDia: zod_1.z.number().int().min(30).max(200).optional(),
            rr: zod_1.z.number().int().min(8).max(60).optional(),
            tempC: zod_1.z.number().min(30).max(45).optional(),
            heartSounds: zod_1.z.string().max(200).trim().optional(),
            pallor: zod_1.z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
            dehydration: zod_1.z
                .enum(['none', 'mild', 'moderate', 'severe'])
                .optional(),
        })
            .optional(),
        labs: zod_1.z
            .object({
            pcv: zod_1.z.number().min(10).max(60).optional(),
            mcs: zod_1.z.string().max(500).trim().optional(),
            eucr: zod_1.z.string().max(500).trim().optional(),
            fbc: zod_1.z.string().max(500).trim().optional(),
            fbs: zod_1.z.number().min(30).max(600).optional(),
            hba1c: zod_1.z.number().min(3.0).max(20.0).optional(),
            misc: zod_1.z
                .record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))
                .optional(),
        })
            .optional(),
        recordedAt: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : new Date())),
    })
        .optional(),
    dtps: zod_1.z
        .array(zod_1.z.object({
        type: zod_1.z.enum(tenancyGuard_1.DTP_TYPES),
        description: zod_1.z.string().max(1000).trim().optional(),
        status: zod_1.z.enum(['unresolved', 'resolved']).default('unresolved'),
    }))
        .optional(),
    carePlan: zod_1.z
        .object({
        goals: zod_1.z.array(zod_1.z.string().min(5).max(200).trim()).min(1).max(10),
        objectives: zod_1.z.array(zod_1.z.string().min(5).max(300).trim()).min(1).max(15),
        followUpDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        planQuality: zod_1.z.enum(['adequate', 'needsReview']).default('adequate'),
        dtpSummary: zod_1.z.enum(['resolved', 'unresolved']).optional(),
        notes: zod_1.z.string().max(1000).trim().optional(),
    })
        .optional(),
});
exports.updatePatientSchema = exports.createPatientSchema.partial();
exports.patientParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
});
exports.createAllergySchema = zod_1.z.object({
    substance: zod_1.z.string().min(1, 'Substance is required').max(100).trim(),
    reaction: zod_1.z.string().max(200).trim().optional(),
    severity: zod_1.z.enum(tenancyGuard_1.SEVERITY_LEVELS).optional(),
    notedAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date())),
});
exports.updateAllergySchema = exports.createAllergySchema.partial();
exports.allergyParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    allergyId: mongoIdSchema,
});
exports.createConditionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Condition name is required').max(100).trim(),
    snomedId: zod_1.z
        .string()
        .regex(snomedRegex, 'Invalid SNOMED CT identifier')
        .optional(),
    onsetDate: zod_1.z
        .string()
        .datetime()
        .optional(),
    status: zod_1.z.enum(['active', 'resolved', 'remission']).default('active'),
    notes: zod_1.z.string().max(500).trim().optional(),
});
exports.updateConditionSchema = exports.createConditionSchema.partial();
exports.conditionParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    conditionId: mongoIdSchema,
});
exports.conditionIdSchema = zod_1.z.object({
    conditionId: mongoIdSchema,
});
exports.createMedicationSchema = zod_1.z.object({
    phase: zod_1.z.enum(['past', 'current']),
    medicationName: zod_1.z
        .string()
        .min(1, 'Medication name is required')
        .max(100)
        .trim(),
    purposeIndication: zod_1.z.string().max(200).trim().optional(),
    dose: zod_1.z.string().max(50).trim().optional(),
    frequency: zod_1.z.string().max(50).trim().optional(),
    route: zod_1.z.string().max(20).trim().optional(),
    duration: zod_1.z.string().max(50).trim().optional(),
    startDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    endDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    adherence: zod_1.z.enum(['good', 'poor', 'unknown']).default('unknown'),
    notes: zod_1.z.string().max(500).trim().optional(),
});
exports.updateMedicationSchema = exports.createMedicationSchema.partial();
exports.medicationParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    medId: mongoIdSchema,
});
exports.medicationQuerySchema = zod_1.z
    .object({
    phase: zod_1.z.enum(['past', 'current']).optional(),
})
    .merge(exports.paginationSchema);
exports.createAssessmentSchema = zod_1.z
    .object({
    vitals: zod_1.z
        .object({
        bpSys: zod_1.z.number().int().min(50).max(300).optional(),
        bpDia: zod_1.z.number().int().min(30).max(200).optional(),
        rr: zod_1.z.number().int().min(8).max(60).optional(),
        tempC: zod_1.z.number().min(30).max(45).optional(),
        heartSounds: zod_1.z.string().max(200).trim().optional(),
        pallor: zod_1.z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
        dehydration: zod_1.z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
    })
        .optional(),
    labs: zod_1.z
        .object({
        pcv: zod_1.z.number().min(10).max(60).optional(),
        mcs: zod_1.z.string().max(500).trim().optional(),
        eucr: zod_1.z.string().max(500).trim().optional(),
        fbc: zod_1.z.string().max(500).trim().optional(),
        fbs: zod_1.z.number().min(30).max(600).optional(),
        hba1c: zod_1.z.number().min(3.0).max(20.0).optional(),
        misc: zod_1.z
            .record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))
            .optional(),
    })
        .optional(),
    visitId: mongoIdSchema.optional(),
    recordedAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date())),
})
    .refine((data) => data.vitals || data.labs, {
    message: 'Either vitals or labs must be provided',
});
exports.updateAssessmentSchema = exports.createAssessmentSchema.partial();
exports.assessmentParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    assessmentId: mongoIdSchema,
});
exports.createDTPSchema = zod_1.z.object({
    type: zod_1.z.enum(tenancyGuard_1.DTP_TYPES),
    description: zod_1.z.string().max(1000).trim().optional(),
    visitId: mongoIdSchema.optional(),
    status: zod_1.z.enum(['unresolved', 'resolved']).default('unresolved'),
});
exports.updateDTPSchema = exports.createDTPSchema.partial();
exports.dtpParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    dtpId: mongoIdSchema,
});
exports.dtpQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['unresolved', 'resolved']).optional(),
})
    .merge(exports.paginationSchema);
exports.createCarePlanSchema = zod_1.z.object({
    goals: zod_1.z
        .array(zod_1.z
        .string()
        .min(5, 'Each goal must be at least 5 characters')
        .max(200)
        .trim())
        .min(1, 'At least one goal is required')
        .max(10, 'Maximum 10 goals allowed'),
    objectives: zod_1.z
        .array(zod_1.z
        .string()
        .min(5, 'Each objective must be at least 5 characters')
        .max(300)
        .trim())
        .min(1, 'At least one objective is required')
        .max(15, 'Maximum 15 objectives allowed'),
    visitId: mongoIdSchema.optional(),
    followUpDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    planQuality: zod_1.z.enum(['adequate', 'needsReview']).default('adequate'),
    dtpSummary: zod_1.z.enum(['resolved', 'unresolved']).optional(),
    notes: zod_1.z.string().max(1000).trim().optional(),
});
exports.updateCarePlanSchema = exports.createCarePlanSchema.partial();
exports.carePlanParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    carePlanId: mongoIdSchema,
});
exports.createVisitSchema = zod_1.z.object({
    date: zod_1.z
        .string()
        .datetime()
        .default(() => new Date().toISOString())
        .transform((val) => new Date(val)),
    soap: zod_1.z
        .object({
        subjective: zod_1.z.string().max(2000).trim().optional(),
        objective: zod_1.z.string().max(2000).trim().optional(),
        assessment: zod_1.z.string().max(2000).trim().optional(),
        plan: zod_1.z.string().max(2000).trim().optional(),
    })
        .refine((soap) => soap.subjective || soap.objective || soap.assessment || soap.plan, {
        message: 'At least one SOAP section must have content',
    }),
    attachments: zod_1.z
        .array(zod_1.z.object({
        kind: zod_1.z.enum(['lab', 'image', 'audio', 'other']),
        url: zod_1.z.string().url('Invalid URL format'),
        fileName: zod_1.z.string().max(255).optional(),
        fileSize: zod_1.z
            .number()
            .int()
            .min(0)
            .max(100 * 1024 * 1024)
            .optional(),
        mimeType: zod_1.z.string().max(100).optional(),
    }))
        .max(10, 'Maximum 10 attachments allowed')
        .optional(),
});
exports.updateVisitSchema = exports.createVisitSchema.partial();
exports.visitParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
    visitId: mongoIdSchema.optional(),
});
exports.attachmentSchema = zod_1.z.object({
    kind: zod_1.z.enum(['lab', 'image', 'audio', 'other']),
    url: zod_1.z.string().url('Invalid URL format'),
    fileName: zod_1.z.string().max(255).optional(),
    fileSize: zod_1.z
        .number()
        .int()
        .min(0)
        .max(100 * 1024 * 1024)
        .optional(),
    mimeType: zod_1.z.string().max(100).optional(),
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
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    errors,
                });
            }
            else {
                res.status(400).json({
                    message: 'Invalid request data',
                    code: 'BAD_REQUEST',
                });
            }
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=patientValidators.js.map