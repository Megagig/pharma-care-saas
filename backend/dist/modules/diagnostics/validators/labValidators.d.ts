import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const labTestSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    loincCode: z.ZodOptional<z.ZodString>;
    indication: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
}, z.core.$strip>;
export declare const createLabOrderSchema: z.ZodObject<{
    patientId: z.ZodString;
    tests: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
        loincCode: z.ZodOptional<z.ZodString>;
        indication: z.ZodString;
        priority: z.ZodDefault<z.ZodEnum<{
            urgent: "urgent";
            routine: "routine";
            stat: "stat";
        }>>;
    }, z.core.$strip>>;
    indication: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
    expectedDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    externalOrderId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateLabOrderSchema: z.ZodObject<{
    tests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
        loincCode: z.ZodOptional<z.ZodString>;
        indication: z.ZodString;
        priority: z.ZodDefault<z.ZodEnum<{
            urgent: "urgent";
            routine: "routine";
            stat: "stat";
        }>>;
    }, z.core.$strip>>>;
    indication: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        ordered: "ordered";
        completed: "completed";
        cancelled: "cancelled";
        processing: "processing";
        collected: "collected";
    }>>;
    expectedDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    externalOrderId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const labOrderParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const labOrderQuerySchema: z.ZodObject<{
    patientId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ordered: "ordered";
        completed: "completed";
        cancelled: "cancelled";
        processing: "processing";
        collected: "collected";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
    orderedBy: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    toDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const referenceRangeSchema: z.ZodObject<{
    low: z.ZodOptional<z.ZodNumber>;
    high: z.ZodOptional<z.ZodNumber>;
    text: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createLabResultSchema: z.ZodObject<{
    orderId: z.ZodOptional<z.ZodString>;
    patientId: z.ZodString;
    testCode: z.ZodString;
    testName: z.ZodString;
    value: z.ZodString;
    unit: z.ZodOptional<z.ZodString>;
    referenceRange: z.ZodObject<{
        low: z.ZodOptional<z.ZodNumber>;
        high: z.ZodOptional<z.ZodNumber>;
        text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    interpretation: z.ZodDefault<z.ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
        abnormal: "abnormal";
    }>>;
    flags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    performedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    externalResultId: z.ZodOptional<z.ZodString>;
    loincCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateLabResultSchema: z.ZodObject<{
    testCode: z.ZodOptional<z.ZodString>;
    testName: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    referenceRange: z.ZodOptional<z.ZodObject<{
        low: z.ZodOptional<z.ZodNumber>;
        high: z.ZodOptional<z.ZodNumber>;
        text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    interpretation: z.ZodOptional<z.ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
        abnormal: "abnormal";
    }>>;
    flags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    performedAt: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    externalResultId: z.ZodOptional<z.ZodString>;
    loincCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const labResultParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const labResultQuerySchema: z.ZodObject<{
    patientId: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    testCode: z.ZodOptional<z.ZodString>;
    interpretation: z.ZodOptional<z.ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
        abnormal: "abnormal";
    }>>;
    fromDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    toDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const labTrendsParamsSchema: z.ZodObject<{
    patientId: z.ZodString;
    testCode: z.ZodString;
}, z.core.$strip>;
export declare const labTrendsQuerySchema: z.ZodObject<{
    months: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const patientMappingSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const fhirBundleSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"Bundle">;
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        collection: "collection";
        transaction: "transaction";
        message: "message";
        history: "history";
        document: "document";
        "transaction-response": "transaction-response";
        batch: "batch";
        "batch-response": "batch-response";
        searchset: "searchset";
    }>;
    entry: z.ZodOptional<z.ZodArray<z.ZodObject<{
        resource: z.ZodObject<{
            resourceType: z.ZodString;
            id: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const importFHIRSchema: z.ZodObject<{
    fhirBundle: z.ZodObject<{
        resourceType: z.ZodLiteral<"Bundle">;
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<{
            collection: "collection";
            transaction: "transaction";
            message: "message";
            history: "history";
            document: "document";
            "transaction-response": "transaction-response";
            batch: "batch";
            "batch-response": "batch-response";
            searchset: "searchset";
        }>;
        entry: z.ZodOptional<z.ZodArray<z.ZodObject<{
            resource: z.ZodObject<{
                resourceType: z.ZodString;
                id: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    patientMapping: z.ZodArray<z.ZodObject<{
        fhirPatientId: z.ZodString;
        internalPatientId: z.ZodString;
        workplaceId: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const exportFHIRParamsSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export declare const syncFHIRParamsSchema: z.ZodObject<{
    patientId: z.ZodString;
}, z.core.$strip>;
export declare const syncFHIRBodySchema: z.ZodObject<{
    fromDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    toDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
}, z.core.$strip>;
export declare const fhirConfigSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    config: z.ZodObject<{
        baseUrl: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<{
            R4: "R4";
            STU3: "STU3";
            DSTU2: "DSTU2";
        }>>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    auth: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
            basic: "basic";
            oauth2: "oauth2";
            none: "none";
            bearer: "bearer";
        }>;
        tokenUrl: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<z.ZodString>;
        username: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        bearerToken: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    workplaceId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
import { Request, Response, NextFunction } from 'express';
type ValidationTarget = 'body' | 'params' | 'query';
export declare const validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateLabValue: (value: string, testCode: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateReferenceRange: (range: any) => {
    valid: boolean;
    error?: string;
};
export declare const validateLabInterpretation: (value: string, referenceRange: any, interpretation: string) => {
    valid: boolean;
    suggestedInterpretation?: string;
    error?: string;
};
export declare const validateLOINCCode: (loincCode: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateTestCode: (testCode: string) => {
    valid: boolean;
    error?: string;
};
declare const _default: {
    validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
    validateLabValue: (value: string, testCode: string) => {
        valid: boolean;
        error?: string;
    };
    validateReferenceRange: (range: any) => {
        valid: boolean;
        error?: string;
    };
    validateLabInterpretation: (value: string, referenceRange: any, interpretation: string) => {
        valid: boolean;
        suggestedInterpretation?: string;
        error?: string;
    };
    validateLOINCCode: (loincCode: string) => {
        valid: boolean;
        error?: string;
    };
    validateTestCode: (testCode: string) => {
        valid: boolean;
        error?: string;
    };
};
export default _default;
//# sourceMappingURL=labValidators.d.ts.map