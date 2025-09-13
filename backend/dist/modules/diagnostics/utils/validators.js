"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = exports.validateFHIRImport = exports.validatePharmacistReview = exports.validateInteractionCheck = exports.validateLabResult = exports.validateLabOrder = exports.validateDiagnosticRequest = exports.fhirImportSchema = exports.pharmacistReviewSchema = exports.interactionCheckSchema = exports.labResultSchema = exports.labOrderSchema = exports.diagnosticRequestSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.diagnosticRequestSchema = joi_1.default.object({
    patientId: joi_1.default.string().required().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid patient ID format'),
    symptoms: joi_1.default.object({
        subjective: joi_1.default.array().items(joi_1.default.string().trim().min(1)).min(1).required()
            .messages({
            'array.min': 'At least one subjective symptom is required',
            'any.required': 'Symptoms are required'
        }),
        objective: joi_1.default.array().items(joi_1.default.string().trim().min(1)).default([]),
        duration: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Duration is required',
            'any.required': 'Duration is required'
        }),
        severity: joi_1.default.string().valid('mild', 'moderate', 'severe').required()
            .messages({
            'any.only': 'Severity must be mild, moderate, or severe',
            'any.required': 'Severity is required'
        }),
        onset: joi_1.default.string().valid('acute', 'chronic', 'subacute').required()
            .messages({
            'any.only': 'Onset must be acute, chronic, or subacute',
            'any.required': 'Onset is required'
        })
    }).required(),
    vitals: joi_1.default.object({
        bloodPressure: joi_1.default.string().pattern(/^\d{2,3}\/\d{2,3}$/)
            .message('Blood pressure must be in format "120/80"'),
        heartRate: joi_1.default.number().integer().min(30).max(250)
            .messages({
            'number.min': 'Heart rate must be at least 30 bpm',
            'number.max': 'Heart rate cannot exceed 250 bpm'
        }),
        temperature: joi_1.default.number().min(30).max(45)
            .messages({
            'number.min': 'Temperature must be at least 30°C',
            'number.max': 'Temperature cannot exceed 45°C'
        }),
        bloodGlucose: joi_1.default.number().min(0).max(1000)
            .messages({
            'number.min': 'Blood glucose cannot be negative',
            'number.max': 'Blood glucose value seems unrealistic'
        }),
        respiratoryRate: joi_1.default.number().integer().min(8).max(60)
            .messages({
            'number.min': 'Respiratory rate must be at least 8',
            'number.max': 'Respiratory rate cannot exceed 60'
        })
    }).optional(),
    currentMedications: joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Medication name is required',
            'any.required': 'Medication name is required'
        }),
        dosage: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Medication dosage is required',
            'any.required': 'Medication dosage is required'
        }),
        frequency: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Medication frequency is required',
            'any.required': 'Medication frequency is required'
        })
    })).optional(),
    allergies: joi_1.default.array().items(joi_1.default.string().trim().min(1)).optional(),
    medicalHistory: joi_1.default.array().items(joi_1.default.string().trim().min(1)).optional(),
    labResults: joi_1.default.array().items(joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid lab result ID format')).optional(),
    consent: joi_1.default.boolean().valid(true).required()
        .messages({
        'any.only': 'Patient consent is required for AI processing',
        'any.required': 'Patient consent is required for AI processing'
    })
});
exports.labOrderSchema = joi_1.default.object({
    patientId: joi_1.default.string().required().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid patient ID format'),
    tests: joi_1.default.array().items(joi_1.default.object({
        code: joi_1.default.string().trim().uppercase().min(1).required()
            .messages({
            'string.empty': 'Test code is required',
            'any.required': 'Test code is required'
        }),
        name: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Test name is required',
            'any.required': 'Test name is required'
        }),
        loincCode: joi_1.default.string().pattern(/^\d{4,5}-\d$/)
            .message('LOINC code must be in format "12345-6"'),
        indication: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'Test indication is required',
            'any.required': 'Test indication is required'
        }),
        priority: joi_1.default.string().valid('stat', 'urgent', 'routine').default('routine')
            .messages({
            'any.only': 'Priority must be stat, urgent, or routine'
        })
    })).min(1).required()
        .messages({
        'array.min': 'At least one test must be ordered',
        'any.required': 'Tests are required'
    }),
    expectedDate: joi_1.default.date().iso().greater('now').optional()
        .messages({
        'date.greater': 'Expected date must be in the future'
    })
});
exports.labResultSchema = joi_1.default.object({
    patientId: joi_1.default.string().required().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid patient ID format'),
    orderId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid order ID format').optional(),
    testCode: joi_1.default.string().trim().uppercase().min(1).required()
        .messages({
        'string.empty': 'Test code is required',
        'any.required': 'Test code is required'
    }),
    testName: joi_1.default.string().trim().min(1).required()
        .messages({
        'string.empty': 'Test name is required',
        'any.required': 'Test name is required'
    }),
    value: joi_1.default.string().trim().min(1).required()
        .messages({
        'string.empty': 'Test value is required',
        'any.required': 'Test value is required'
    }),
    unit: joi_1.default.string().trim().max(20).optional(),
    referenceRange: joi_1.default.object({
        low: joi_1.default.number().optional(),
        high: joi_1.default.number().optional(),
        text: joi_1.default.string().trim().max(200).optional()
    }).required()
        .custom((value, helpers) => {
        if (value.low !== undefined && value.high !== undefined && value.low > value.high) {
            return helpers.error('referenceRange.invalid');
        }
        return value;
    })
        .messages({
        'referenceRange.invalid': 'Low reference value cannot be greater than high value',
        'any.required': 'Reference range is required'
    }),
    interpretation: joi_1.default.string().valid('low', 'normal', 'high', 'critical', 'abnormal').optional(),
    flags: joi_1.default.array().items(joi_1.default.string().trim()).max(10).optional()
        .messages({
        'array.max': 'Cannot have more than 10 flags'
    }),
    performedAt: joi_1.default.date().iso().max('now').required()
        .messages({
        'date.max': 'Performed date cannot be in the future',
        'any.required': 'Performed date is required'
    }),
    loincCode: joi_1.default.string().pattern(/^\d{4,5}-\d$/)
        .message('LOINC code must be in format "12345-6"').optional()
});
exports.interactionCheckSchema = joi_1.default.object({
    medications: joi_1.default.array().items(joi_1.default.string().trim().min(1)).min(1).required()
        .messages({
        'array.min': 'At least one medication is required',
        'any.required': 'Medications are required'
    }),
    patientAllergies: joi_1.default.array().items(joi_1.default.string().trim().min(1)).optional()
});
exports.pharmacistReviewSchema = joi_1.default.object({
    status: joi_1.default.string().valid('approved', 'modified', 'rejected').required()
        .messages({
        'any.only': 'Status must be approved, modified, or rejected',
        'any.required': 'Review status is required'
    }),
    modifications: joi_1.default.string().trim().min(1)
        .when('status', {
        is: 'modified',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'string.empty': 'Modifications are required when status is modified',
        'any.required': 'Modifications are required when status is modified'
    }),
    rejectionReason: joi_1.default.string().trim().min(1)
        .when('status', {
        is: 'rejected',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'string.empty': 'Rejection reason is required when status is rejected',
        'any.required': 'Rejection reason is required when status is rejected'
    })
});
exports.fhirImportSchema = joi_1.default.object({
    fhirBundle: joi_1.default.object().required()
        .messages({
        'any.required': 'FHIR bundle is required'
    }),
    patientMapping: joi_1.default.object({
        fhirPatientId: joi_1.default.string().trim().min(1).required()
            .messages({
            'string.empty': 'FHIR patient ID is required',
            'any.required': 'FHIR patient ID is required'
        }),
        internalPatientId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).required()
            .messages({
            'string.pattern.base': 'Invalid internal patient ID format',
            'any.required': 'Internal patient ID is required'
        })
    }).required()
        .messages({
        'any.required': 'Patient mapping is required'
    })
});
const validateDiagnosticRequest = (data) => {
    return exports.diagnosticRequestSchema.validate(data, { abortEarly: false });
};
exports.validateDiagnosticRequest = validateDiagnosticRequest;
const validateLabOrder = (data) => {
    return exports.labOrderSchema.validate(data, { abortEarly: false });
};
exports.validateLabOrder = validateLabOrder;
const validateLabResult = (data) => {
    return exports.labResultSchema.validate(data, { abortEarly: false });
};
exports.validateLabResult = validateLabResult;
const validateInteractionCheck = (data) => {
    return exports.interactionCheckSchema.validate(data, { abortEarly: false });
};
exports.validateInteractionCheck = validateInteractionCheck;
const validatePharmacistReview = (data) => {
    return exports.pharmacistReviewSchema.validate(data, { abortEarly: false });
};
exports.validatePharmacistReview = validatePharmacistReview;
const validateFHIRImport = (data) => {
    return exports.fhirImportSchema.validate(data, { abortEarly: false });
};
exports.validateFHIRImport = validateFHIRImport;
const formatValidationErrors = (error) => {
    return error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
    }));
};
exports.formatValidationErrors = formatValidationErrors;
//# sourceMappingURL=validators.js.map