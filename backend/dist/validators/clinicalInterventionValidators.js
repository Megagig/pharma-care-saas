"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationSchema = exports.linkMTRSchema = exports.exportQuerySchema = exports.analyticsQuerySchema = exports.patientParamsSchema = exports.searchInterventionsSchema = exports.scheduleFollowUpSchema = exports.recordOutcomeSchema = exports.updateAssignmentSchema = exports.assignTeamMemberSchema = exports.updateStrategySchema = exports.addStrategySchema = exports.interventionParamsSchema = exports.updateInterventionSchema = exports.validateCreateIntervention = exports.createInterventionSchema = exports.outcomeBusinessRules = exports.assignmentBusinessRules = exports.strategyBusinessRules = exports.interventionBusinessRules = exports.validateRequest = exports.sanitizeInput = void 0;
const express_validator_1 = require("express-validator");
const express_validator_2 = require("express-validator");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
exports.sanitizeInput = {
    text: (input) => {
        if (typeof input !== 'string')
            return '';
        return isomorphic_dompurify_1.default.sanitize(input.trim(), {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        });
    },
    html: (input) => {
        if (typeof input !== 'string')
            return '';
        return isomorphic_dompurify_1.default.sanitize(input, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
            ALLOWED_ATTR: []
        });
    },
    mongoId: (input) => {
        if (typeof input !== 'string')
            return '';
        const sanitized = input.trim();
        return mongoose_1.default.Types.ObjectId.isValid(sanitized) ? sanitized : '';
    },
    number: (input) => {
        const num = Number(input);
        return isNaN(num) ? null : num;
    },
    boolean: (input) => {
        if (typeof input === 'boolean')
            return input;
        if (typeof input === 'string') {
            return input.toLowerCase() === 'true';
        }
        return Boolean(input);
    }
};
const validateRequest = (validations, businessRules = [], options = {}) => {
    const { sanitize = true, logErrors = true, includeStack = false } = options;
    return async (req, res, next) => {
        try {
            if (sanitize) {
                sanitizeRequestData(req);
            }
            await Promise.all(validations.map(validation => validation.run(req)));
            const validationErrors = (0, express_validator_2.validationResult)(req);
            const errors = [];
            if (!validationErrors.isEmpty()) {
                errors.push(...validationErrors.array().map((error) => {
                    const fieldError = error;
                    const location = fieldError.location;
                    return {
                        field: fieldError.path || error.param || 'unknown',
                        message: fieldError.msg || 'Validation failed',
                        value: fieldError.value,
                        code: 'VALIDATION_ERROR',
                        location: (location === 'cookies') ? 'body' : location
                    };
                }));
            }
            for (const rule of businessRules) {
                try {
                    const fieldValue = getFieldValue(req, rule.field);
                    const isValid = await rule.rule(fieldValue, req);
                    if (!isValid) {
                        errors.push({
                            field: rule.field,
                            message: rule.message,
                            value: fieldValue,
                            code: rule.code || 'BUSINESS_RULE_ERROR',
                            location: 'body'
                        });
                    }
                }
                catch (ruleError) {
                    if (logErrors) {
                        logger_1.default.error('Business rule validation error', {
                            field: rule.field,
                            error: ruleError,
                            userId: req.user?.id,
                            endpoint: req.originalUrl
                        });
                    }
                    errors.push({
                        field: rule.field,
                        message: 'Business rule validation failed',
                        code: 'BUSINESS_RULE_EXECUTION_ERROR',
                        location: 'body'
                    });
                }
            }
            if (errors.length > 0) {
                if (logErrors) {
                    logger_1.default.warn('Validation failed', {
                        errors,
                        userId: req.user?.id,
                        endpoint: req.originalUrl,
                        method: req.method,
                        body: sanitize ? '[SANITIZED]' : req.body
                    });
                }
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    errors,
                    timestamp: new Date().toISOString(),
                    ...(includeStack && process.env.NODE_ENV === 'development' && {
                        requestId: req.headers['x-request-id'] || 'unknown'
                    })
                });
                return;
            }
            next();
        }
        catch (error) {
            if (logErrors) {
                logger_1.default.error('Validation middleware error', {
                    error,
                    userId: req.user?.id,
                    endpoint: req.originalUrl,
                    method: req.method
                });
            }
            res.status(500).json({
                success: false,
                message: 'Internal validation error',
                code: 'VALIDATION_MIDDLEWARE_ERROR',
                timestamp: new Date().toISOString()
            });
            return;
        }
    };
};
exports.validateRequest = validateRequest;
const sanitizeRequestData = (req) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
};
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = exports.sanitizeInput.text(value);
            }
            else {
                sanitized[key] = sanitizeObject(value);
            }
        }
        return sanitized;
    }
    if (typeof obj === 'string') {
        return exports.sanitizeInput.text(obj);
    }
    return obj;
};
const getFieldValue = (req, fieldPath) => {
    const parts = fieldPath.split('.');
    let value = req.body;
    for (const part of parts) {
        if (value && typeof value === 'object') {
            value = value[part];
        }
        else {
            return undefined;
        }
    }
    return value;
};
exports.interventionBusinessRules = [
    {
        field: 'patientId',
        rule: async (patientId, req) => {
            if (!patientId)
                return false;
            const Patient = require('../models/Patient');
            const patient = await Patient.findOne({
                _id: patientId,
                workplaceId: req.user?.workplaceId,
                isDeleted: false
            });
            return !!patient;
        },
        message: 'Patient not found or does not belong to your workplace',
        code: 'PATIENT_NOT_FOUND'
    },
    {
        field: 'category',
        rule: (category) => {
            const validCategories = [
                'drug_therapy_problem',
                'adverse_drug_reaction',
                'medication_nonadherence',
                'drug_interaction',
                'dosing_issue',
                'contraindication',
                'other'
            ];
            return validCategories.includes(category);
        },
        message: 'Invalid intervention category',
        code: 'INVALID_CATEGORY'
    },
    {
        field: 'strategies',
        rule: (strategies) => {
            if (!Array.isArray(strategies))
                return true;
            const types = strategies.map(s => s.type);
            const uniqueTypes = new Set(types);
            return types.length === uniqueTypes.size;
        },
        message: 'Duplicate strategy types are not allowed',
        code: 'DUPLICATE_STRATEGIES'
    }
];
exports.strategyBusinessRules = [
    {
        field: 'type',
        rule: (type, req) => {
            if (type === 'custom') {
                const description = req.body.description;
                const rationale = req.body.rationale;
                return description && description.length >= 20 &&
                    rationale && rationale.length >= 20;
            }
            return true;
        },
        message: 'Custom strategies require detailed description and rationale (minimum 20 characters each)',
        code: 'CUSTOM_STRATEGY_INSUFFICIENT_DETAIL'
    }
];
exports.assignmentBusinessRules = [
    {
        field: 'userId',
        rule: async (userId, req) => {
            if (!userId)
                return false;
            const User = require('../models/User');
            const user = await User.findOne({
                _id: userId,
                workplaceId: req.user?.workplaceId,
                isDeleted: false
            });
            return !!user;
        },
        message: 'User not found or does not belong to your workplace',
        code: 'USER_NOT_FOUND'
    },
    {
        field: 'role',
        rule: async (role, req) => {
            const userId = req.body.userId;
            if (!userId || !role)
                return false;
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (!user)
                return false;
            if (req.user?.role === 'Pharmacist')
                return true;
            const allowedRoles = ['patient', 'caregiver'];
            return allowedRoles.includes(role);
        },
        message: 'Insufficient permissions to assign this role',
        code: 'ROLE_ASSIGNMENT_DENIED'
    }
];
exports.outcomeBusinessRules = [
    {
        field: 'clinicalParameters',
        rule: (parameters) => {
            if (!Array.isArray(parameters))
                return true;
            return parameters.every(param => {
                if (param.beforeValue && param.afterValue) {
                    const before = parseFloat(param.beforeValue);
                    const after = parseFloat(param.afterValue);
                    if (!isNaN(before) && !isNaN(after)) {
                        if (!param.improvementPercentage) {
                            param.improvementPercentage = ((after - before) / before) * 100;
                        }
                    }
                }
                return true;
            });
        },
        message: 'Invalid clinical parameter values',
        code: 'INVALID_CLINICAL_PARAMETERS'
    },
    {
        field: 'successMetrics.costSavings',
        rule: (costSavings) => {
            if (costSavings === undefined || costSavings === null)
                return true;
            return costSavings >= 0 && costSavings <= 1000000;
        },
        message: 'Cost savings must be between 0 and 1,000,000',
        code: 'INVALID_COST_SAVINGS'
    }
];
exports.createInterventionSchema = [
    (0, express_validator_1.body)('patientId')
        .isMongoId()
        .withMessage('Valid patient ID is required')
        .customSanitizer(exports.sanitizeInput.mongoId),
    (0, express_validator_1.body)('category')
        .isIn([
        'drug_therapy_problem',
        'adverse_drug_reaction',
        'medication_nonadherence',
        'drug_interaction',
        'dosing_issue',
        'contraindication',
        'other'
    ])
        .withMessage('Valid intervention category is required')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('issueDescription')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Issue description must be between 10 and 1000 characters')
        .customSanitizer(exports.sanitizeInput.text)
        .custom((value) => {
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i
        ];
        if (suspiciousPatterns.some(pattern => pattern.test(value))) {
            throw new Error('Issue description contains potentially unsafe content');
        }
        return true;
    }),
    (0, express_validator_1.body)('priority')
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Valid priority level is required')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('strategies')
        .optional()
        .isArray({ min: 0, max: 10 })
        .withMessage('Strategies must be an array with maximum 10 items'),
    (0, express_validator_1.body)('strategies.*.type')
        .optional()
        .isIn([
        'medication_review',
        'dose_adjustment',
        'alternative_therapy',
        'discontinuation',
        'additional_monitoring',
        'patient_counseling',
        'physician_consultation',
        'custom'
    ])
        .withMessage('Valid strategy type is required')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('strategies.*.description')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy description must be between 1 and 500 characters')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('strategies.*.rationale')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy rationale must be between 1 and 500 characters')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('strategies.*.expectedOutcome')
        .optional()
        .isLength({ min: 20, max: 500 })
        .withMessage('Expected outcome must be between 20 and 500 characters')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('strategies.*.priority')
        .optional()
        .isIn(['primary', 'secondary'])
        .withMessage('Valid strategy priority is required')
        .customSanitizer(exports.sanitizeInput.text),
    (0, express_validator_1.body)('estimatedDuration')
        .optional()
        .isInt({ min: 1, max: 10080 })
        .withMessage('Estimated duration must be between 1 and 10080 minutes')
        .customSanitizer(exports.sanitizeInput.number),
    (0, express_validator_1.body)('relatedMTRId')
        .optional()
        .isMongoId()
        .withMessage('Valid MTR ID is required')
        .customSanitizer(exports.sanitizeInput.mongoId),
];
exports.validateCreateIntervention = (0, exports.validateRequest)(exports.createInterventionSchema, exports.interventionBusinessRules, {
    sanitize: true,
    logErrors: true,
    includeStack: process.env.NODE_ENV === 'development'
});
exports.updateInterventionSchema = [
    (0, express_validator_1.body)('category')
        .optional()
        .isIn([
        'drug_therapy_problem',
        'adverse_drug_reaction',
        'medication_nonadherence',
        'drug_interaction',
        'dosing_issue',
        'contraindication',
        'other'
    ])
        .withMessage('Valid intervention category is required'),
    (0, express_validator_1.body)('issueDescription')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Issue description must be between 10 and 1000 characters')
        .trim(),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Valid priority level is required'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['identified', 'planning', 'in_progress', 'implemented', 'completed', 'cancelled'])
        .withMessage('Valid status is required'),
    (0, express_validator_1.body)('implementationNotes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Implementation notes must not exceed 1000 characters')
        .trim(),
];
exports.interventionParamsSchema = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Valid intervention ID is required'),
];
exports.addStrategySchema = [
    (0, express_validator_1.body)('type')
        .isIn([
        'medication_review',
        'dose_adjustment',
        'alternative_therapy',
        'discontinuation',
        'additional_monitoring',
        'patient_counseling',
        'physician_consultation',
        'custom'
    ])
        .withMessage('Valid strategy type is required'),
    (0, express_validator_1.body)('description')
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy description must be between 1 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('rationale')
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy rationale must be between 1 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('expectedOutcome')
        .isLength({ min: 20, max: 500 })
        .withMessage('Expected outcome must be between 20 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['primary', 'secondary'])
        .withMessage('Valid strategy priority is required'),
];
exports.updateStrategySchema = [
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy description must be between 1 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('rationale')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Strategy rationale must be between 1 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('expectedOutcome')
        .optional()
        .isLength({ min: 20, max: 500 })
        .withMessage('Expected outcome must be between 20 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['primary', 'secondary'])
        .withMessage('Valid strategy priority is required'),
];
exports.assignTeamMemberSchema = [
    (0, express_validator_1.body)('userId')
        .isMongoId()
        .withMessage('Valid user ID is required'),
    (0, express_validator_1.body)('role')
        .isIn(['pharmacist', 'physician', 'nurse', 'patient', 'caregiver'])
        .withMessage('Valid role is required'),
    (0, express_validator_1.body)('task')
        .isLength({ min: 1, max: 500 })
        .withMessage('Task description must be between 1 and 500 characters')
        .trim(),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
        .trim(),
];
exports.updateAssignmentSchema = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Valid assignment status is required'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
        .trim(),
];
exports.recordOutcomeSchema = [
    (0, express_validator_1.body)('patientResponse')
        .isIn(['improved', 'no_change', 'worsened', 'unknown'])
        .withMessage('Valid patient response is required'),
    (0, express_validator_1.body)('clinicalParameters')
        .optional()
        .isArray()
        .withMessage('Clinical parameters must be an array'),
    (0, express_validator_1.body)('clinicalParameters.*.parameter')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Parameter name must be between 1 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('clinicalParameters.*.beforeValue')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Before value must not exceed 50 characters')
        .trim(),
    (0, express_validator_1.body)('clinicalParameters.*.afterValue')
        .optional()
        .isLength({ max: 50 })
        .withMessage('After value must not exceed 50 characters')
        .trim(),
    (0, express_validator_1.body)('clinicalParameters.*.unit')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Unit must not exceed 20 characters')
        .trim(),
    (0, express_validator_1.body)('adverseEffects')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Adverse effects must not exceed 1000 characters')
        .trim(),
    (0, express_validator_1.body)('additionalIssues')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Additional issues must not exceed 1000 characters')
        .trim(),
    (0, express_validator_1.body)('successMetrics.problemResolved')
        .optional()
        .isBoolean()
        .withMessage('Problem resolved must be a boolean'),
    (0, express_validator_1.body)('successMetrics.medicationOptimized')
        .optional()
        .isBoolean()
        .withMessage('Medication optimized must be a boolean'),
    (0, express_validator_1.body)('successMetrics.adherenceImproved')
        .optional()
        .isBoolean()
        .withMessage('Adherence improved must be a boolean'),
    (0, express_validator_1.body)('successMetrics.costSavings')
        .optional()
        .isNumeric()
        .withMessage('Cost savings must be a number'),
    (0, express_validator_1.body)('successMetrics.qualityOfLifeImproved')
        .optional()
        .isBoolean()
        .withMessage('Quality of life improved must be a boolean'),
];
exports.scheduleFollowUpSchema = [
    (0, express_validator_1.body)('required')
        .isBoolean()
        .withMessage('Follow-up required must be a boolean'),
    (0, express_validator_1.body)('scheduledDate')
        .optional()
        .isISO8601()
        .withMessage('Valid scheduled date is required'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Follow-up notes must not exceed 1000 characters')
        .trim(),
    (0, express_validator_1.body)('nextReviewDate')
        .optional()
        .isISO8601()
        .withMessage('Valid next review date is required'),
];
exports.searchInterventionsSchema = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('category')
        .optional()
        .isIn([
        'drug_therapy_problem',
        'adverse_drug_reaction',
        'medication_nonadherence',
        'drug_interaction',
        'dosing_issue',
        'contraindication',
        'other'
    ])
        .withMessage('Valid category is required'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Valid priority is required'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['identified', 'planning', 'in_progress', 'implemented', 'completed', 'cancelled'])
        .withMessage('Valid status is required'),
    (0, express_validator_1.query)('patientId')
        .optional()
        .isMongoId()
        .withMessage('Valid patient ID is required'),
    (0, express_validator_1.query)('assignedTo')
        .optional()
        .isMongoId()
        .withMessage('Valid user ID is required'),
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Valid date from is required'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Valid date to is required'),
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters')
        .trim(),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['identifiedDate', 'priority', 'status', 'completedAt', 'interventionNumber'])
        .withMessage('Valid sort field is required'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Valid sort order is required'),
];
exports.patientParamsSchema = [
    (0, express_validator_1.param)('patientId')
        .isMongoId()
        .withMessage('Valid patient ID is required'),
];
exports.analyticsQuerySchema = [
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Valid date from is required'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Valid date to is required'),
    (0, express_validator_1.query)('category')
        .optional()
        .isIn([
        'drug_therapy_problem',
        'adverse_drug_reaction',
        'medication_nonadherence',
        'drug_interaction',
        'dosing_issue',
        'contraindication',
        'other'
    ])
        .withMessage('Valid category is required'),
    (0, express_validator_1.query)('pharmacistId')
        .optional()
        .isMongoId()
        .withMessage('Valid pharmacist ID is required'),
];
exports.exportQuerySchema = [
    (0, express_validator_1.query)('format')
        .optional()
        .isIn(['pdf', 'excel', 'csv'])
        .withMessage('Valid export format is required'),
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Valid date from is required'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Valid date to is required'),
    (0, express_validator_1.query)('includeOutcomes')
        .optional()
        .isBoolean()
        .withMessage('Include outcomes must be a boolean'),
];
exports.linkMTRSchema = [
    (0, express_validator_1.body)('mtrId')
        .isMongoId()
        .withMessage('Valid MTR ID is required'),
];
exports.notificationSchema = [
    (0, express_validator_1.body)('event')
        .isIn(['assignment', 'status_change', 'outcome_recorded', 'follow_up_due'])
        .withMessage('Valid notification event is required'),
    (0, express_validator_1.body)('recipients')
        .optional()
        .isArray()
        .withMessage('Recipients must be an array'),
    (0, express_validator_1.body)('recipients.*')
        .optional()
        .isMongoId()
        .withMessage('Valid recipient ID is required'),
    (0, express_validator_1.body)('message')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Message must be between 1 and 500 characters')
        .trim(),
];
//# sourceMappingURL=clinicalInterventionValidators.js.map