import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const searchSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    mrn: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    bloodGroup: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    genotype: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createPatientSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    otherNames: z.ZodOptional<z.ZodString>;
    dob: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    lga: z.ZodOptional<z.ZodString>;
    maritalStatus: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    bloodGroup: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    genotype: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    allergies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        substance: z.ZodString;
        reaction: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<{
            [x: string]: string;
        }>>;
        notedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    }, z.core.$strip>>>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        snomedId: z.ZodOptional<z.ZodString>;
        onsetDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            resolved: "resolved";
            remission: "remission";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    medications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        phase: z.ZodEnum<{
            past: "past";
            current: "current";
        }>;
        medicationName: z.ZodString;
        purposeIndication: z.ZodOptional<z.ZodString>;
        dose: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodString>;
        route: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        adherence: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            good: "good";
            poor: "poor";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    assessment: z.ZodOptional<z.ZodObject<{
        vitals: z.ZodOptional<z.ZodObject<{
            bpSys: z.ZodOptional<z.ZodNumber>;
            bpDia: z.ZodOptional<z.ZodNumber>;
            rr: z.ZodOptional<z.ZodNumber>;
            tempC: z.ZodOptional<z.ZodNumber>;
            heartSounds: z.ZodOptional<z.ZodString>;
            pallor: z.ZodOptional<z.ZodEnum<{
                none: "none";
                mild: "mild";
                moderate: "moderate";
                severe: "severe";
            }>>;
            dehydration: z.ZodOptional<z.ZodEnum<{
                none: "none";
                mild: "mild";
                moderate: "moderate";
                severe: "severe";
            }>>;
        }, z.core.$strip>>;
        labs: z.ZodOptional<z.ZodObject<{
            pcv: z.ZodOptional<z.ZodNumber>;
            mcs: z.ZodOptional<z.ZodString>;
            eucr: z.ZodOptional<z.ZodString>;
            fbc: z.ZodOptional<z.ZodString>;
            fbs: z.ZodOptional<z.ZodNumber>;
            hba1c: z.ZodOptional<z.ZodNumber>;
            misc: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        }, z.core.$strip>>;
        recordedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>;
    }, z.core.$strip>>;
    dtps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            [x: string]: string;
        }>;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            resolved: "resolved";
            unresolved: "unresolved";
        }>>;
    }, z.core.$strip>>>;
    carePlan: z.ZodOptional<z.ZodObject<{
        goals: z.ZodArray<z.ZodString>;
        objectives: z.ZodArray<z.ZodString>;
        followUpDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        planQuality: z.ZodDefault<z.ZodEnum<{
            adequate: "adequate";
            needsReview: "needsReview";
        }>>;
        dtpSummary: z.ZodOptional<z.ZodEnum<{
            resolved: "resolved";
            unresolved: "unresolved";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const updatePatientSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    otherNames: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dob: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>>;
    age: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    lga: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    maritalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    bloodGroup: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    genotype: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    weightKg: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    allergies: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        substance: z.ZodString;
        reaction: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<{
            [x: string]: string;
        }>>;
        notedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    }, z.core.$strip>>>>;
    conditions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        snomedId: z.ZodOptional<z.ZodString>;
        onsetDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            resolved: "resolved";
            remission: "remission";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    medications: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        phase: z.ZodEnum<{
            past: "past";
            current: "current";
        }>;
        medicationName: z.ZodString;
        purposeIndication: z.ZodOptional<z.ZodString>;
        dose: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodString>;
        route: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        adherence: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            good: "good";
            poor: "poor";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    assessment: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        vitals: z.ZodOptional<z.ZodObject<{
            bpSys: z.ZodOptional<z.ZodNumber>;
            bpDia: z.ZodOptional<z.ZodNumber>;
            rr: z.ZodOptional<z.ZodNumber>;
            tempC: z.ZodOptional<z.ZodNumber>;
            heartSounds: z.ZodOptional<z.ZodString>;
            pallor: z.ZodOptional<z.ZodEnum<{
                none: "none";
                mild: "mild";
                moderate: "moderate";
                severe: "severe";
            }>>;
            dehydration: z.ZodOptional<z.ZodEnum<{
                none: "none";
                mild: "mild";
                moderate: "moderate";
                severe: "severe";
            }>>;
        }, z.core.$strip>>;
        labs: z.ZodOptional<z.ZodObject<{
            pcv: z.ZodOptional<z.ZodNumber>;
            mcs: z.ZodOptional<z.ZodString>;
            eucr: z.ZodOptional<z.ZodString>;
            fbc: z.ZodOptional<z.ZodString>;
            fbs: z.ZodOptional<z.ZodNumber>;
            hba1c: z.ZodOptional<z.ZodNumber>;
            misc: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        }, z.core.$strip>>;
        recordedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>;
    }, z.core.$strip>>>;
    dtps: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            [x: string]: string;
        }>;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            resolved: "resolved";
            unresolved: "unresolved";
        }>>;
    }, z.core.$strip>>>>;
    carePlan: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        goals: z.ZodArray<z.ZodString>;
        objectives: z.ZodArray<z.ZodString>;
        followUpDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
        planQuality: z.ZodDefault<z.ZodEnum<{
            adequate: "adequate";
            needsReview: "needsReview";
        }>>;
        dtpSummary: z.ZodOptional<z.ZodEnum<{
            resolved: "resolved";
            unresolved: "unresolved";
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const patientParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createAllergySchema: z.ZodObject<{
    substance: z.ZodString;
    reaction: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    notedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>;
}, z.core.$strip>;
export declare const updateAllergySchema: z.ZodObject<{
    substance: z.ZodOptional<z.ZodString>;
    reaction: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    severity: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    notedAt: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>>;
}, z.core.$strip>;
export declare const allergyParamsSchema: z.ZodObject<{
    id: z.ZodString;
    allergyId: z.ZodString;
}, z.core.$strip>;
export declare const createConditionSchema: z.ZodObject<{
    name: z.ZodString;
    snomedId: z.ZodOptional<z.ZodString>;
    onsetDate: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        resolved: "resolved";
        remission: "remission";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateConditionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    snomedId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    onsetDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        active: "active";
        resolved: "resolved";
        remission: "remission";
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const conditionParamsSchema: z.ZodObject<{
    id: z.ZodString;
    conditionId: z.ZodString;
}, z.core.$strip>;
export declare const conditionIdSchema: z.ZodObject<{
    conditionId: z.ZodString;
}, z.core.$strip>;
export declare const createMedicationSchema: z.ZodObject<{
    phase: z.ZodEnum<{
        past: "past";
        current: "current";
    }>;
    medicationName: z.ZodString;
    purposeIndication: z.ZodOptional<z.ZodString>;
    dose: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodString>;
    route: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    adherence: z.ZodDefault<z.ZodEnum<{
        unknown: "unknown";
        good: "good";
        poor: "poor";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateMedicationSchema: z.ZodObject<{
    phase: z.ZodOptional<z.ZodEnum<{
        past: "past";
        current: "current";
    }>>;
    medicationName: z.ZodOptional<z.ZodString>;
    purposeIndication: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dose: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    frequency: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    route: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    duration: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>>;
    endDate: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>>;
    adherence: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        unknown: "unknown";
        good: "good";
        poor: "poor";
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const medicationParamsSchema: z.ZodObject<{
    id: z.ZodString;
    medId: z.ZodString;
}, z.core.$strip>;
export declare const medicationQuerySchema: z.ZodObject<{
    phase: z.ZodOptional<z.ZodEnum<{
        past: "past";
        current: "current";
    }>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createAssessmentSchema: z.ZodObject<{
    vitals: z.ZodOptional<z.ZodObject<{
        bpSys: z.ZodOptional<z.ZodNumber>;
        bpDia: z.ZodOptional<z.ZodNumber>;
        rr: z.ZodOptional<z.ZodNumber>;
        tempC: z.ZodOptional<z.ZodNumber>;
        heartSounds: z.ZodOptional<z.ZodString>;
        pallor: z.ZodOptional<z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
            severe: "severe";
        }>>;
        dehydration: z.ZodOptional<z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
            severe: "severe";
        }>>;
    }, z.core.$strip>>;
    labs: z.ZodOptional<z.ZodObject<{
        pcv: z.ZodOptional<z.ZodNumber>;
        mcs: z.ZodOptional<z.ZodString>;
        eucr: z.ZodOptional<z.ZodString>;
        fbc: z.ZodOptional<z.ZodString>;
        fbs: z.ZodOptional<z.ZodNumber>;
        hba1c: z.ZodOptional<z.ZodNumber>;
        misc: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    }, z.core.$strip>>;
    visitId: z.ZodOptional<z.ZodString>;
    recordedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>;
}, z.core.$strip>;
export declare const updateAssessmentSchema: z.ZodObject<{
    vitals: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        bpSys: z.ZodOptional<z.ZodNumber>;
        bpDia: z.ZodOptional<z.ZodNumber>;
        rr: z.ZodOptional<z.ZodNumber>;
        tempC: z.ZodOptional<z.ZodNumber>;
        heartSounds: z.ZodOptional<z.ZodString>;
        pallor: z.ZodOptional<z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
            severe: "severe";
        }>>;
        dehydration: z.ZodOptional<z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
            severe: "severe";
        }>>;
    }, z.core.$strip>>>;
    labs: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        pcv: z.ZodOptional<z.ZodNumber>;
        mcs: z.ZodOptional<z.ZodString>;
        eucr: z.ZodOptional<z.ZodString>;
        fbc: z.ZodOptional<z.ZodString>;
        fbs: z.ZodOptional<z.ZodNumber>;
        hba1c: z.ZodOptional<z.ZodNumber>;
        misc: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    }, z.core.$strip>>>;
    visitId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    recordedAt: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string | undefined>>>;
}, z.core.$strip>;
export declare const assessmentParamsSchema: z.ZodObject<{
    id: z.ZodString;
    assessmentId: z.ZodString;
}, z.core.$strip>;
export declare const createDTPSchema: z.ZodObject<{
    type: z.ZodEnum<{
        [x: string]: string;
    }>;
    description: z.ZodOptional<z.ZodString>;
    visitId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        resolved: "resolved";
        unresolved: "unresolved";
    }>>;
}, z.core.$strip>;
export declare const updateDTPSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    visitId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        resolved: "resolved";
        unresolved: "unresolved";
    }>>>;
}, z.core.$strip>;
export declare const dtpParamsSchema: z.ZodObject<{
    id: z.ZodString;
    dtpId: z.ZodString;
}, z.core.$strip>;
export declare const dtpQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        resolved: "resolved";
        unresolved: "unresolved";
    }>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createCarePlanSchema: z.ZodObject<{
    goals: z.ZodArray<z.ZodString>;
    objectives: z.ZodArray<z.ZodString>;
    visitId: z.ZodOptional<z.ZodString>;
    followUpDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    planQuality: z.ZodDefault<z.ZodEnum<{
        adequate: "adequate";
        needsReview: "needsReview";
    }>>;
    dtpSummary: z.ZodOptional<z.ZodEnum<{
        resolved: "resolved";
        unresolved: "unresolved";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateCarePlanSchema: z.ZodObject<{
    goals: z.ZodOptional<z.ZodArray<z.ZodString>>;
    objectives: z.ZodOptional<z.ZodArray<z.ZodString>>;
    visitId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    followUpDate: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>>;
    planQuality: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        adequate: "adequate";
        needsReview: "needsReview";
    }>>>;
    dtpSummary: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        resolved: "resolved";
        unresolved: "unresolved";
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const carePlanParamsSchema: z.ZodObject<{
    id: z.ZodString;
    carePlanId: z.ZodString;
}, z.core.$strip>;
export declare const createVisitSchema: z.ZodObject<{
    date: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<Date, string>>;
    soap: z.ZodObject<{
        subjective: z.ZodOptional<z.ZodString>;
        objective: z.ZodOptional<z.ZodString>;
        assessment: z.ZodOptional<z.ZodString>;
        plan: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            other: "other";
            lab: "lab";
            image: "image";
            audio: "audio";
        }>;
        url: z.ZodString;
        fileName: z.ZodOptional<z.ZodString>;
        fileSize: z.ZodOptional<z.ZodNumber>;
        mimeType: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const updateVisitSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<Date, string>>>;
    soap: z.ZodOptional<z.ZodObject<{
        subjective: z.ZodOptional<z.ZodString>;
        objective: z.ZodOptional<z.ZodString>;
        assessment: z.ZodOptional<z.ZodString>;
        plan: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    attachments: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            other: "other";
            lab: "lab";
            image: "image";
            audio: "audio";
        }>;
        url: z.ZodString;
        fileName: z.ZodOptional<z.ZodString>;
        fileSize: z.ZodOptional<z.ZodNumber>;
        mimeType: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export declare const visitParamsSchema: z.ZodObject<{
    id: z.ZodString;
    visitId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const attachmentSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        other: "other";
        lab: "lab";
        image: "image";
        audio: "audio";
    }>;
    url: z.ZodString;
    fileName: z.ZodOptional<z.ZodString>;
    fileSize: z.ZodOptional<z.ZodNumber>;
    mimeType: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
import { Request, Response, NextFunction } from 'express';
type ValidationTarget = 'body' | 'params' | 'query';
export declare const validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=patientValidators.d.ts.map