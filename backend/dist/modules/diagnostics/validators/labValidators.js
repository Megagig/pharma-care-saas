"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTestCode = exports.validateLOINCCode = exports.validateLabInterpretation = exports.validateReferenceRange = exports.validateLabValue = exports.validateRequest = exports.fhirConfigSchema = exports.syncFHIRBodySchema = exports.syncFHIRParamsSchema = exports.exportFHIRParamsSchema = exports.importFHIRSchema = exports.fhirBundleSchema = exports.patientMappingSchema = exports.labTrendsQuerySchema = exports.labTrendsParamsSchema = exports.labResultQuerySchema = exports.labResultParamsSchema = exports.updateLabResultSchema = exports.createLabResultSchema = exports.referenceRangeSchema = exports.labOrderQuerySchema = exports.labOrderParamsSchema = exports.updateLabOrderSchema = exports.createLabOrderSchema = exports.labTestSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const loincCodeSchema = zod_1.z
    .string()
    .regex(/^\d{1,5}-\d{1,2}$/, 'Invalid LOINC code format (should be like 12345-6)');
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
exports.labTestSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(50, 'Test code cannot exceed 50 characters')
        .trim(),
    name: zod_1.z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters')
        .trim(),
    loincCode: loincCodeSchema.optional(),
    indication: zod_1.z
        .string()
        .min(1, 'Test indication is required')
        .max(500, 'Test indication cannot exceed 500 characters')
        .trim(),
    priority: zod_1.z.enum(['stat', 'urgent', 'routine']).default('routine'),
});
exports.createLabOrderSchema = zod_1.z.object({
    patientId: mongoIdSchema,
    tests: zod_1.z
        .array(exports.labTestSchema)
        .min(1, 'At least one test is required')
        .max(20, 'Maximum 20 tests allowed per order'),
    indication: zod_1.z
        .string()
        .min(1, 'Order indication is required')
        .max(1000, 'Order indication cannot exceed 1000 characters')
        .trim(),
    priority: zod_1.z.enum(['stat', 'urgent', 'routine']).default('routine'),
    expectedDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    externalOrderId: zod_1.z
        .string()
        .max(100, 'External order ID cannot exceed 100 characters')
        .trim()
        .optional(),
});
exports.updateLabOrderSchema = zod_1.z.object({
    tests: zod_1.z
        .array(exports.labTestSchema)
        .min(1, 'At least one test is required')
        .max(20, 'Maximum 20 tests allowed per order')
        .optional(),
    indication: zod_1.z
        .string()
        .min(1, 'Order indication is required')
        .max(1000, 'Order indication cannot exceed 1000 characters')
        .trim()
        .optional(),
    priority: zod_1.z.enum(['stat', 'urgent', 'routine']).optional(),
    status: zod_1.z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
    expectedDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    externalOrderId: zod_1.z
        .string()
        .max(100, 'External order ID cannot exceed 100 characters')
        .trim()
        .optional(),
});
exports.labOrderParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
});
exports.labOrderQuerySchema = zod_1.z
    .object({
    patientId: mongoIdSchema.optional(),
    status: zod_1.z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
    priority: zod_1.z.enum(['stat', 'urgent', 'routine']).optional(),
    orderedBy: mongoIdSchema.optional(),
    fromDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    toDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
})
    .merge(exports.paginationSchema)
    .refine((data) => {
    if (data.fromDate && data.toDate) {
        return data.fromDate <= data.toDate;
    }
    return true;
}, {
    message: 'From date cannot be after to date',
    path: ['fromDate'],
});
exports.referenceRangeSchema = zod_1.z.object({
    low: zod_1.z.number().optional(),
    high: zod_1.z.number().optional(),
    text: zod_1.z
        .string()
        .max(200, 'Reference range text cannot exceed 200 characters')
        .trim()
        .optional(),
});
exports.createLabResultSchema = zod_1.z.object({
    orderId: mongoIdSchema.optional(),
    patientId: mongoIdSchema,
    testCode: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(50, 'Test code cannot exceed 50 characters')
        .trim(),
    testName: zod_1.z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters')
        .trim(),
    value: zod_1.z
        .string()
        .min(1, 'Test value is required')
        .max(100, 'Test value cannot exceed 100 characters')
        .trim(),
    unit: zod_1.z
        .string()
        .max(20, 'Unit cannot exceed 20 characters')
        .trim()
        .optional(),
    referenceRange: exports.referenceRangeSchema,
    interpretation: zod_1.z.enum(['low', 'normal', 'high', 'critical', 'abnormal']).default('normal'),
    flags: zod_1.z
        .array(zod_1.z.string().max(50))
        .max(10, 'Maximum 10 flags allowed')
        .default([]),
    performedAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date())),
    externalResultId: zod_1.z
        .string()
        .max(100, 'External result ID cannot exceed 100 characters')
        .trim()
        .optional(),
    loincCode: loincCodeSchema.optional(),
});
exports.updateLabResultSchema = zod_1.z.object({
    testCode: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(50, 'Test code cannot exceed 50 characters')
        .trim()
        .optional(),
    testName: zod_1.z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters')
        .trim()
        .optional(),
    value: zod_1.z
        .string()
        .min(1, 'Test value is required')
        .max(100, 'Test value cannot exceed 100 characters')
        .trim()
        .optional(),
    unit: zod_1.z
        .string()
        .max(20, 'Unit cannot exceed 20 characters')
        .trim()
        .optional(),
    referenceRange: exports.referenceRangeSchema.optional(),
    interpretation: zod_1.z.enum(['low', 'normal', 'high', 'critical', 'abnormal']).optional(),
    flags: zod_1.z
        .array(zod_1.z.string().max(50))
        .max(10, 'Maximum 10 flags allowed')
        .optional(),
    performedAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    externalResultId: zod_1.z
        .string()
        .max(100, 'External result ID cannot exceed 100 characters')
        .trim()
        .optional(),
    loincCode: loincCodeSchema.optional(),
});
exports.labResultParamsSchema = zod_1.z.object({
    id: mongoIdSchema,
});
exports.labResultQuerySchema = zod_1.z
    .object({
    patientId: mongoIdSchema.optional(),
    orderId: mongoIdSchema.optional(),
    testCode: zod_1.z.string().max(50).trim().optional(),
    interpretation: zod_1.z.enum(['low', 'normal', 'high', 'critical', 'abnormal']).optional(),
    fromDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    toDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
})
    .merge(exports.paginationSchema)
    .refine((data) => {
    if (data.fromDate && data.toDate) {
        return data.fromDate <= data.toDate;
    }
    return true;
}, {
    message: 'From date cannot be after to date',
    path: ['fromDate'],
});
exports.labTrendsParamsSchema = zod_1.z.object({
    patientId: mongoIdSchema,
    testCode: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(50, 'Test code cannot exceed 50 characters')
        .trim(),
});
exports.labTrendsQuerySchema = zod_1.z.object({
    months: zod_1.z
        .string()
        .optional()
        .default('12')
        .transform((val) => Math.min(60, Math.max(1, parseInt(val) || 12))),
});
exports.patientMappingSchema = zod_1.z.record(zod_1.z.string(), mongoIdSchema);
exports.fhirBundleSchema = zod_1.z.object({
    resourceType: zod_1.z.literal('Bundle'),
    id: zod_1.z.string().optional(),
    type: zod_1.z.enum(['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection']),
    entry: zod_1.z.array(zod_1.z.object({
        resource: zod_1.z.object({
            resourceType: zod_1.z.string(),
            id: zod_1.z.string().optional(),
        }).passthrough(),
    })).optional(),
});
exports.importFHIRSchema = zod_1.z.object({
    fhirBundle: exports.fhirBundleSchema,
    patientMapping: zod_1.z.array(zod_1.z.object({
        fhirPatientId: zod_1.z.string().min(1, 'FHIR patient ID is required'),
        internalPatientId: mongoIdSchema,
        workplaceId: mongoIdSchema,
    })).min(1, 'At least one patient mapping is required'),
});
exports.exportFHIRParamsSchema = zod_1.z.object({
    orderId: mongoIdSchema,
});
exports.syncFHIRParamsSchema = zod_1.z.object({
    patientId: mongoIdSchema,
});
exports.syncFHIRBodySchema = zod_1.z.object({
    fromDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    toDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
}).refine((data) => {
    if (data.fromDate && data.toDate) {
        return data.fromDate <= data.toDate;
    }
    return true;
}, {
    message: 'From date cannot be after to date',
    path: ['fromDate'],
});
exports.fhirConfigSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Server ID is required'),
    name: zod_1.z.string().min(1, 'Server name is required'),
    description: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    config: zod_1.z.object({
        baseUrl: zod_1.z.string().url('Base URL must be a valid URL'),
        version: zod_1.z.enum(['R4', 'STU3', 'DSTU2']).default('R4'),
        timeout: zod_1.z.number().min(1000).max(300000).default(30000),
        retryAttempts: zod_1.z.number().min(0).max(10).default(3),
    }),
    auth: zod_1.z.object({
        type: zod_1.z.enum(['oauth2', 'basic', 'bearer', 'none']),
        tokenUrl: zod_1.z.string().url().optional(),
        clientId: zod_1.z.string().optional(),
        clientSecret: zod_1.z.string().optional(),
        scope: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
        bearerToken: zod_1.z.string().optional(),
    }).optional(),
    workplaceId: mongoIdSchema.optional(),
}).refine((data) => {
    if (data.auth?.type === 'oauth2') {
        return data.auth.tokenUrl && data.auth.clientId && data.auth.clientSecret;
    }
    if (data.auth?.type === 'basic') {
        return data.auth.username && data.auth.password;
    }
    if (data.auth?.type === 'bearer') {
        return data.auth.bearerToken;
    }
    return true;
}, {
    message: 'Authentication configuration is incomplete for the selected type',
    path: ['auth'],
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
const validateLabValue = (value, testCode) => {
    const numericPattern = /^-?\d+(\.\d+)?$/;
    const rangePattern = /^-?\d+(\.\d+)?\s*-\s*-?\d+(\.\d+)?$/;
    const qualitativePattern = /^(positive|negative|detected|not detected|present|absent|normal|abnormal)$/i;
    const textPattern = /^[a-zA-Z0-9\s\-\+\.\,\(\)\/]+$/;
    const testCodeLower = testCode.toLowerCase();
    if (testCodeLower.includes('glucose') ||
        testCodeLower.includes('cholesterol') ||
        testCodeLower.includes('creatinine') ||
        testCodeLower.includes('hemoglobin') ||
        testCodeLower.includes('hematocrit')) {
        if (!numericPattern.test(value) && !rangePattern.test(value)) {
            return { valid: false, error: 'Numeric value expected for this test' };
        }
    }
    if (testCodeLower.includes('hiv') ||
        testCodeLower.includes('hepatitis') ||
        testCodeLower.includes('pregnancy') ||
        testCodeLower.includes('culture')) {
        if (!qualitativePattern.test(value) && !textPattern.test(value)) {
            return { valid: false, error: 'Qualitative result expected for this test' };
        }
    }
    if (value.trim().length === 0) {
        return { valid: false, error: 'Lab value cannot be empty' };
    }
    if (value.length > 100) {
        return { valid: false, error: 'Lab value too long' };
    }
    return { valid: true };
};
exports.validateLabValue = validateLabValue;
const validateReferenceRange = (range) => {
    if (!range) {
        return { valid: true };
    }
    if (!range.low && !range.high && !range.text) {
        return { valid: false, error: 'Reference range must specify low, high, or text value' };
    }
    if (range.low !== undefined && range.high !== undefined) {
        if (range.low >= range.high) {
            return { valid: false, error: 'Reference range low value must be less than high value' };
        }
    }
    if (range.low !== undefined && (typeof range.low !== 'number' || isNaN(range.low))) {
        return { valid: false, error: 'Reference range low value must be a valid number' };
    }
    if (range.high !== undefined && (typeof range.high !== 'number' || isNaN(range.high))) {
        return { valid: false, error: 'Reference range high value must be a valid number' };
    }
    return { valid: true };
};
exports.validateReferenceRange = validateReferenceRange;
const validateLabInterpretation = (value, referenceRange, interpretation) => {
    if (!referenceRange || (!referenceRange.low && !referenceRange.high)) {
        return { valid: true };
    }
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
        return { valid: true };
    }
    let suggestedInterpretation = 'normal';
    if (referenceRange.low !== undefined && numericValue < referenceRange.low) {
        suggestedInterpretation = 'low';
    }
    else if (referenceRange.high !== undefined && numericValue > referenceRange.high) {
        suggestedInterpretation = 'high';
    }
    if (referenceRange.low !== undefined && numericValue < (referenceRange.low * 0.5)) {
        suggestedInterpretation = 'critical';
    }
    else if (referenceRange.high !== undefined && numericValue > (referenceRange.high * 2)) {
        suggestedInterpretation = 'critical';
    }
    const isConsistent = interpretation === suggestedInterpretation ||
        (interpretation === 'abnormal' && suggestedInterpretation !== 'normal');
    return {
        valid: isConsistent,
        suggestedInterpretation,
        error: isConsistent ? undefined : `Interpretation '${interpretation}' may not match value '${value}' for given reference range. Suggested: '${suggestedInterpretation}'`,
    };
};
exports.validateLabInterpretation = validateLabInterpretation;
const validateLOINCCode = (loincCode) => {
    const loincPattern = /^(\d{1,5})-(\d{1,2})$/;
    const match = loincCode.match(loincPattern);
    if (!match) {
        return { valid: false, error: 'LOINC code must be in format NNNNN-N (e.g., 12345-6)' };
    }
    const [, code, checkDigit] = match;
    if (!code)
        return { valid: false, error: 'LOINC code is required' };
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (char) {
            const digit = parseInt(char);
            const weight = (i % 2 === 0) ? 1 : 2;
            sum += digit * weight;
        }
    }
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    const providedCheckDigit = parseInt(checkDigit);
    if (calculatedCheckDigit !== providedCheckDigit) {
        return {
            valid: false,
            error: `Invalid LOINC check digit. Expected ${calculatedCheckDigit}, got ${providedCheckDigit}`
        };
    }
    return { valid: true };
};
exports.validateLOINCCode = validateLOINCCode;
const validateTestCode = (testCode) => {
    const testCodePattern = /^[A-Za-z0-9_-]+$/;
    if (!testCodePattern.test(testCode)) {
        return {
            valid: false,
            error: 'Test code can only contain letters, numbers, hyphens, and underscores'
        };
    }
    if (testCode.length < 2) {
        return { valid: false, error: 'Test code must be at least 2 characters long' };
    }
    if (testCode.length > 50) {
        return { valid: false, error: 'Test code cannot exceed 50 characters' };
    }
    return { valid: true };
};
exports.validateTestCode = validateTestCode;
exports.default = {
    validateRequest: exports.validateRequest,
    validateLabValue: exports.validateLabValue,
    validateReferenceRange: exports.validateReferenceRange,
    validateLabInterpretation: exports.validateLabInterpretation,
    validateLOINCCode: exports.validateLOINCCode,
    validateTestCode: exports.validateTestCode,
};
//# sourceMappingURL=labValidators.js.map