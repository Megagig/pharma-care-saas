"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConsentRequirement = exports.validateTestCodes = exports.validateOrderStatusTransition = exports.validateRequest = exports.tokenQuerySchema = exports.addResultsSchema = exports.resultValueSchema = exports.patientOrderQuerySchema = exports.orderQuerySchema = exports.patientParamsSchema = exports.orderParamsSchema = exports.updateOrderStatusSchema = exports.createManualLabOrderSchema = exports.manualLabTestSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const orderIdSchema = zod_1.z
    .string()
    .regex(/^LAB-\d{4}-\d{4}$/, 'Invalid order ID format (expected LAB-YYYY-XXXX)');
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
        .transform((val) => Math.min(100, Math.max(1, parseInt(val) || 20))),
    sort: zod_1.z.string().optional().default('-createdAt'),
});
exports.manualLabTestSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters')
        .trim(),
    code: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(20, 'Test code cannot exceed 20 characters')
        .trim()
        .transform((val) => val.toUpperCase()),
    loincCode: zod_1.z
        .string()
        .max(20, 'LOINC code cannot exceed 20 characters')
        .trim()
        .optional(),
    specimenType: zod_1.z
        .string()
        .min(1, 'Specimen type is required')
        .max(100, 'Specimen type cannot exceed 100 characters')
        .trim(),
    unit: zod_1.z
        .string()
        .max(20, 'Unit cannot exceed 20 characters')
        .trim()
        .optional(),
    refRange: zod_1.z
        .string()
        .max(100, 'Reference range cannot exceed 100 characters')
        .trim()
        .optional(),
    category: zod_1.z
        .string()
        .max(100, 'Category cannot exceed 100 characters')
        .trim()
        .optional(),
});
exports.createManualLabOrderSchema = zod_1.z.object({
    patientId: mongoIdSchema,
    locationId: zod_1.z.string().max(100).trim().optional(),
    tests: zod_1.z
        .array(exports.manualLabTestSchema)
        .min(1, 'At least one test is required')
        .max(20, 'Maximum 20 tests allowed per order'),
    indication: zod_1.z
        .string()
        .min(1, 'Clinical indication is required')
        .max(1000, 'Indication cannot exceed 1000 characters')
        .trim(),
    priority: zod_1.z.enum(['routine', 'urgent', 'stat']).default('routine'),
    notes: zod_1.z
        .string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .trim()
        .optional(),
    consentObtained: zod_1.z
        .boolean()
        .refine((val) => val === true, {
        message: 'Patient consent is required for manual lab orders',
    }),
    consentObtainedBy: mongoIdSchema,
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['requested', 'sample_collected', 'result_awaited', 'completed', 'referred']),
    notes: zod_1.z
        .string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .trim()
        .optional(),
});
exports.orderParamsSchema = zod_1.z.object({
    orderId: orderIdSchema,
});
exports.patientParamsSchema = zod_1.z.object({
    patientId: mongoIdSchema,
});
exports.orderQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['requested', 'sample_collected', 'result_awaited', 'completed', 'referred']).optional(),
    priority: zod_1.z.enum(['routine', 'urgent', 'stat']).optional(),
    orderedBy: mongoIdSchema.optional(),
    locationId: zod_1.z.string().optional(),
    dateFrom: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    dateTo: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    search: zod_1.z.string().max(100).trim().optional(),
})
    .merge(exports.paginationSchema);
exports.patientOrderQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['requested', 'sample_collected', 'result_awaited', 'completed', 'referred']).optional(),
})
    .merge(exports.paginationSchema);
exports.resultValueSchema = zod_1.z.object({
    testCode: zod_1.z
        .string()
        .min(1, 'Test code is required')
        .max(20, 'Test code cannot exceed 20 characters')
        .trim()
        .transform((val) => val.toUpperCase()),
    testName: zod_1.z
        .string()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters')
        .trim(),
    numericValue: zod_1.z.number().min(0, 'Numeric value cannot be negative').optional(),
    unit: zod_1.z
        .string()
        .max(20, 'Unit cannot exceed 20 characters')
        .trim()
        .optional(),
    stringValue: zod_1.z
        .string()
        .max(500, 'String value cannot exceed 500 characters')
        .trim()
        .optional(),
    comment: zod_1.z
        .string()
        .max(1000, 'Comment cannot exceed 1000 characters')
        .trim()
        .optional(),
}).refine((data) => data.numericValue !== undefined || data.stringValue !== undefined, {
    message: 'Either numeric value or string value must be provided',
});
exports.addResultsSchema = zod_1.z.object({
    values: zod_1.z
        .array(exports.resultValueSchema)
        .min(1, 'At least one result value is required')
        .max(50, 'Maximum 50 result values allowed'),
    reviewNotes: zod_1.z
        .string()
        .max(1000, 'Review notes cannot exceed 1000 characters')
        .trim()
        .optional(),
});
exports.tokenQuerySchema = zod_1.z.object({
    token: zod_1.z
        .string()
        .min(1, 'Token is required')
        .max(500, 'Token cannot exceed 500 characters')
        .trim(),
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
const validateOrderStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        requested: ['sample_collected', 'referred'],
        sample_collected: ['result_awaited', 'referred'],
        result_awaited: ['completed', 'referred'],
        completed: ['referred'],
        referred: [],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
};
exports.validateOrderStatusTransition = validateOrderStatusTransition;
const validateTestCodes = (resultTestCodes, orderedTestCodes) => {
    const orderedCodesUpper = orderedTestCodes.map(code => code.toUpperCase());
    const resultCodesUpper = resultTestCodes.map(code => code.toUpperCase());
    const invalidCodes = resultCodesUpper.filter(code => !orderedCodesUpper.includes(code));
    return {
        valid: invalidCodes.length === 0,
        invalidCodes,
    };
};
exports.validateTestCodes = validateTestCodes;
const validateConsentRequirement = (consentObtained, consentObtainedBy) => {
    return consentObtained === true && !!consentObtainedBy;
};
exports.validateConsentRequirement = validateConsentRequirement;
//# sourceMappingURL=manualLabValidators.js.map