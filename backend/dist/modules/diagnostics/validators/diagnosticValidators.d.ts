import { z } from 'zod';
export type IVitalSigns = z.infer<typeof vitalSignsSchema>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const symptomDataSchema: z.ZodObject<{
    subjective: z.ZodArray<z.ZodString>;
    objective: z.ZodDefault<z.ZodArray<z.ZodString>>;
    duration: z.ZodString;
    severity: z.ZodEnum<{
        mild: "mild";
        moderate: "moderate";
        severe: "severe";
    }>;
    onset: z.ZodEnum<{
        acute: "acute";
        chronic: "chronic";
        subacute: "subacute";
    }>;
}, z.core.$strip>;
export declare const vitalSignsSchema: z.ZodObject<{
    bloodPressure: z.ZodOptional<z.ZodString>;
    heartRate: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    bloodGlucose: z.ZodOptional<z.ZodNumber>;
    respiratoryRate: z.ZodOptional<z.ZodNumber>;
    oxygenSaturation: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const medicationEntrySchema: z.ZodObject<{
    name: z.ZodString;
    dosage: z.ZodString;
    frequency: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    indication: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const socialHistorySchema: z.ZodObject<{
    smoking: z.ZodOptional<z.ZodEnum<{
        current: "current";
        never: "never";
        former: "former";
    }>>;
    alcohol: z.ZodOptional<z.ZodEnum<{
        never: "never";
        occasional: "occasional";
        regular: "regular";
        heavy: "heavy";
    }>>;
    exercise: z.ZodOptional<z.ZodEnum<{
        active: "active";
        light: "light";
        moderate: "moderate";
        sedentary: "sedentary";
    }>>;
}, z.core.$strip>;
export declare const inputSnapshotSchema: z.ZodObject<{
    symptoms: z.ZodObject<{
        subjective: z.ZodArray<z.ZodString>;
        objective: z.ZodDefault<z.ZodArray<z.ZodString>>;
        duration: z.ZodString;
        severity: z.ZodEnum<{
            mild: "mild";
            moderate: "moderate";
            severe: "severe";
        }>;
        onset: z.ZodEnum<{
            acute: "acute";
            chronic: "chronic";
            subacute: "subacute";
        }>;
    }, z.core.$strip>;
    vitals: z.ZodOptional<z.ZodObject<{
        bloodPressure: z.ZodOptional<z.ZodString>;
        heartRate: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        bloodGlucose: z.ZodOptional<z.ZodNumber>;
        respiratoryRate: z.ZodOptional<z.ZodNumber>;
        oxygenSaturation: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    currentMedications: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        dosage: z.ZodString;
        frequency: z.ZodString;
        route: z.ZodOptional<z.ZodString>;
        startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        indication: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    allergies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    medicalHistory: z.ZodDefault<z.ZodArray<z.ZodString>>;
    labResultIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    socialHistory: z.ZodOptional<z.ZodObject<{
        smoking: z.ZodOptional<z.ZodEnum<{
            current: "current";
            never: "never";
            former: "former";
        }>>;
        alcohol: z.ZodOptional<z.ZodEnum<{
            never: "never";
            occasional: "occasional";
            regular: "regular";
            heavy: "heavy";
        }>>;
        exercise: z.ZodOptional<z.ZodEnum<{
            active: "active";
            light: "light";
            moderate: "moderate";
            sedentary: "sedentary";
        }>>;
    }, z.core.$strip>>;
    familyHistory: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const createDiagnosticRequestSchema: z.ZodObject<{
    patientId: z.ZodString;
    inputSnapshot: z.ZodObject<{
        symptoms: z.ZodObject<{
            subjective: z.ZodArray<z.ZodString>;
            objective: z.ZodDefault<z.ZodArray<z.ZodString>>;
            duration: z.ZodString;
            severity: z.ZodEnum<{
                mild: "mild";
                moderate: "moderate";
                severe: "severe";
            }>;
            onset: z.ZodEnum<{
                acute: "acute";
                chronic: "chronic";
                subacute: "subacute";
            }>;
        }, z.core.$strip>;
        vitals: z.ZodOptional<z.ZodObject<{
            bloodPressure: z.ZodOptional<z.ZodString>;
            heartRate: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            bloodGlucose: z.ZodOptional<z.ZodNumber>;
            respiratoryRate: z.ZodOptional<z.ZodNumber>;
            oxygenSaturation: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        currentMedications: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            dosage: z.ZodString;
            frequency: z.ZodString;
            route: z.ZodOptional<z.ZodString>;
            startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
            indication: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        allergies: z.ZodDefault<z.ZodArray<z.ZodString>>;
        medicalHistory: z.ZodDefault<z.ZodArray<z.ZodString>>;
        labResultIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
        socialHistory: z.ZodOptional<z.ZodObject<{
            smoking: z.ZodOptional<z.ZodEnum<{
                current: "current";
                never: "never";
                former: "former";
            }>>;
            alcohol: z.ZodOptional<z.ZodEnum<{
                never: "never";
                occasional: "occasional";
                regular: "regular";
                heavy: "heavy";
            }>>;
            exercise: z.ZodOptional<z.ZodEnum<{
                active: "active";
                light: "light";
                moderate: "moderate";
                sedentary: "sedentary";
            }>>;
        }, z.core.$strip>>;
        familyHistory: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    priority: z.ZodDefault<z.ZodEnum<{
        routine: "routine";
        urgent: "urgent";
        stat: "stat";
    }>>;
    consentObtained: z.ZodBoolean;
}, z.core.$strip>;
export declare const diagnosticParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const patientHistoryParamsSchema: z.ZodObject<{
    patientId: z.ZodString;
}, z.core.$strip>;
export declare const diagnosticQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
        processing: "processing";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        routine: "routine";
        urgent: "urgent";
        stat: "stat";
    }>>;
    pharmacistId: z.ZodOptional<z.ZodString>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const approveResultSchema: z.ZodObject<{
    modifications: z.ZodOptional<z.ZodString>;
    reviewNotes: z.ZodOptional<z.ZodString>;
    clinicalJustification: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const rejectResultSchema: z.ZodObject<{
    rejectionReason: z.ZodString;
    reviewNotes: z.ZodOptional<z.ZodString>;
    clinicalJustification: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const pendingReviewsQuerySchema: z.ZodObject<{
    priority: z.ZodOptional<z.ZodEnum<{
        routine: "routine";
        urgent: "urgent";
        stat: "stat";
    }>>;
    confidenceMin: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number | undefined, string | undefined>>;
    confidenceMax: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number | undefined, string | undefined>>;
    hasRedFlags: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    orderBy: z.ZodDefault<z.ZodEnum<{
        priority: "priority";
        confidence: "confidence";
        oldest: "oldest";
        newest: "newest";
    }>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const createInterventionSchema: z.ZodObject<{
    type: z.ZodEnum<{
        monitoring: "monitoring";
        medication_review: "medication_review";
        counseling: "counseling";
        referral: "referral";
        lifestyle: "lifestyle";
    }>;
    title: z.ZodString;
    description: z.ZodString;
    priority: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        urgent: "urgent";
    }>;
    category: z.ZodString;
    recommendations: z.ZodArray<z.ZodString>;
    followUpRequired: z.ZodDefault<z.ZodBoolean>;
    followUpDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    targetOutcome: z.ZodOptional<z.ZodString>;
    monitoringParameters: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const analyticsQuerySchema: z.ZodObject<{
    from: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    to: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
}, z.core.$strip>;
import { Request, Response, NextFunction } from 'express';
type ValidationTarget = 'body' | 'params' | 'query';
export declare const validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateConsentTimestamp: (timestamp: Date) => boolean;
export declare const validateVitalSignsForAge: (vitals: IVitalSigns, patientAge: number) => {
    valid: boolean;
    errors: string[];
};
export declare const validateMedicationDosage: (dosage: string) => boolean;
export declare const validateMedicationFrequency: (frequency: string) => boolean;
export declare const validateBloodPressure: (bp: string) => {
    valid: boolean;
    systolic?: number;
    diastolic?: number;
    error?: string;
};
declare const _default: {
    validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
    validateConsentTimestamp: (timestamp: Date) => boolean;
    validateVitalSignsForAge: (vitals: IVitalSigns, patientAge: number) => {
        valid: boolean;
        errors: string[];
    };
    validateMedicationDosage: (dosage: string) => boolean;
    validateMedicationFrequency: (frequency: string) => boolean;
    validateBloodPressure: (bp: string) => {
        valid: boolean;
        systolic?: number;
        diastolic?: number;
        error?: string;
    };
};
export default _default;
//# sourceMappingURL=diagnosticValidators.d.ts.map