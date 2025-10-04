import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const manualLabTestSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    loincCode: z.ZodOptional<z.ZodString>;
    specimenType: z.ZodString;
    unit: z.ZodOptional<z.ZodString>;
    refRange: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createManualLabOrderSchema: z.ZodObject<{
    patientId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    tests: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        code: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        loincCode: z.ZodOptional<z.ZodString>;
        specimenType: z.ZodString;
        unit: z.ZodOptional<z.ZodString>;
        refRange: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    indication: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
    consentObtained: z.ZodBoolean;
    consentObtainedBy: z.ZodString;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        completed: "completed";
        requested: "requested";
        sample_collected: "sample_collected";
        result_awaited: "result_awaited";
        referred: "referred";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const orderParamsSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export declare const patientParamsSchema: z.ZodObject<{
    patientId: z.ZodString;
}, z.core.$strip>;
export declare const orderQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        completed: "completed";
        requested: "requested";
        sample_collected: "sample_collected";
        result_awaited: "result_awaited";
        referred: "referred";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        urgent: "urgent";
        routine: "routine";
        stat: "stat";
    }>>;
    orderedBy: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    dateTo: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date, string>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const patientOrderQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        completed: "completed";
        requested: "requested";
        sample_collected: "sample_collected";
        result_awaited: "result_awaited";
        referred: "referred";
    }>>;
    page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const resultValueSchema: z.ZodObject<{
    testCode: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    testName: z.ZodString;
    numericValue: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    stringValue: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addResultsSchema: z.ZodObject<{
    values: z.ZodArray<z.ZodObject<{
        testCode: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        testName: z.ZodString;
        numericValue: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        stringValue: z.ZodOptional<z.ZodString>;
        comment: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    reviewNotes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const tokenQuerySchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
import { Request, Response, NextFunction } from 'express';
type ValidationTarget = 'body' | 'params' | 'query';
export declare const validateRequest: (schema: z.ZodSchema, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateOrderStatusTransition: (currentStatus: string, newStatus: string) => boolean;
export declare const validateTestCodes: (resultTestCodes: string[], orderedTestCodes: string[]) => {
    valid: boolean;
    invalidCodes: string[];
};
export declare const validateConsentRequirement: (consentObtained: boolean, consentObtainedBy: string) => boolean;
export {};
//# sourceMappingURL=manualLabValidators.d.ts.map