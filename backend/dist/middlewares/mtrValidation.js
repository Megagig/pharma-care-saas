"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mtrValidationMiddleware = exports.validateMTRBusinessLogic = exports.validateMTRAccess = exports.validateTherapyPlan = exports.validateMedicationHistory = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const mtrErrors_1 = require("../utils/mtrErrors");
const logger_1 = __importDefault(require("../utils/logger"));
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error) => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined,
            location: 'location' in error ? error.location : 'body'
        }));
        logger_1.default.warn('MTR validation failed', {
            userId: req.user?.id,
            endpoint: req.originalUrl,
            method: req.method,
            errors: validationErrors,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        const error = new mtrErrors_1.MTRValidationError('Validation failed for MTR operation', validationErrors);
        return next(error);
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
const validateMedicationHistory = (req, res, next) => {
    try {
        const { medications } = req.body;
        if (!Array.isArray(medications)) {
            throw new mtrErrors_1.MTRValidationError('Medications must be provided as an array');
        }
        const validationErrors = [];
        medications.forEach((medication, index) => {
            const requiredFields = ['drugName', 'strength', 'dosageForm', 'instructions', 'category', 'startDate', 'indication'];
            requiredFields.forEach(field => {
                if (!medication[field]) {
                    validationErrors.push({
                        field: `medications[${index}].${field}`,
                        message: `${field} is required`,
                        value: medication[field]
                    });
                }
            });
            if (medication.strength) {
                if (!medication.strength.value || !medication.strength.unit) {
                    validationErrors.push({
                        field: `medications[${index}].strength`,
                        message: 'Strength must include both value and unit',
                        value: medication.strength
                    });
                }
                if (typeof medication.strength.value !== 'number' || medication.strength.value <= 0) {
                    validationErrors.push({
                        field: `medications[${index}].strength.value`,
                        message: 'Strength value must be a positive number',
                        value: medication.strength.value
                    });
                }
            }
            if (medication.instructions) {
                const requiredInstructions = ['dose', 'frequency', 'route'];
                requiredInstructions.forEach(field => {
                    if (!medication.instructions[field]) {
                        validationErrors.push({
                            field: `medications[${index}].instructions.${field}`,
                            message: `${field} is required in instructions`,
                            value: medication.instructions[field]
                        });
                    }
                });
            }
            if (medication.startDate && !isValidDate(medication.startDate)) {
                validationErrors.push({
                    field: `medications[${index}].startDate`,
                    message: 'Start date must be a valid date',
                    value: medication.startDate
                });
            }
            if (medication.endDate && !isValidDate(medication.endDate)) {
                validationErrors.push({
                    field: `medications[${index}].endDate`,
                    message: 'End date must be a valid date',
                    value: medication.endDate
                });
            }
            if (medication.startDate && medication.endDate) {
                const startDate = new Date(medication.startDate);
                const endDate = new Date(medication.endDate);
                if (endDate <= startDate) {
                    validationErrors.push({
                        field: `medications[${index}].endDate`,
                        message: 'End date must be after start date',
                        value: medication.endDate
                    });
                }
            }
            const validCategories = ['prescribed', 'otc', 'herbal', 'supplement'];
            if (medication.category && !validCategories.includes(medication.category)) {
                validationErrors.push({
                    field: `medications[${index}].category`,
                    message: `Category must be one of: ${validCategories.join(', ')}`,
                    value: medication.category
                });
            }
            if (medication.adherenceScore !== undefined) {
                if (typeof medication.adherenceScore !== 'number' ||
                    medication.adherenceScore < 0 ||
                    medication.adherenceScore > 100) {
                    validationErrors.push({
                        field: `medications[${index}].adherenceScore`,
                        message: 'Adherence score must be a number between 0 and 100',
                        value: medication.adherenceScore
                    });
                }
            }
        });
        if (validationErrors.length > 0) {
            logger_1.default.warn('Medication history validation failed', {
                userId: req.user?.id,
                patientId: req.params.patientId || req.body.patientId,
                errors: validationErrors,
                timestamp: new Date().toISOString()
            });
            throw new mtrErrors_1.MTRValidationError('Medication history validation failed', validationErrors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateMedicationHistory = validateMedicationHistory;
const validateTherapyPlan = (req, res, next) => {
    try {
        const { plan } = req.body;
        if (!plan) {
            throw new mtrErrors_1.MTRValidationError('Therapy plan is required');
        }
        const validationErrors = [];
        if (!plan.problems || !Array.isArray(plan.problems) || plan.problems.length === 0) {
            validationErrors.push({
                field: 'plan.problems',
                message: 'Therapy plan must be linked to at least one drug therapy problem',
                value: plan.problems
            });
        }
        if (plan.problems && Array.isArray(plan.problems)) {
            plan.problems.forEach((problemId, index) => {
                if (!mongoose_1.default.Types.ObjectId.isValid(problemId)) {
                    validationErrors.push({
                        field: `plan.problems[${index}]`,
                        message: 'Invalid problem ID format',
                        value: problemId
                    });
                }
            });
        }
        if (!plan.recommendations || !Array.isArray(plan.recommendations) || plan.recommendations.length === 0) {
            validationErrors.push({
                field: 'plan.recommendations',
                message: 'At least one recommendation is required',
                value: plan.recommendations
            });
        }
        if (plan.recommendations && Array.isArray(plan.recommendations)) {
            plan.recommendations.forEach((recommendation, index) => {
                const requiredFields = ['type', 'rationale', 'priority', 'expectedOutcome'];
                requiredFields.forEach(field => {
                    if (!recommendation[field]) {
                        validationErrors.push({
                            field: `plan.recommendations[${index}].${field}`,
                            message: `${field} is required for each recommendation`,
                            value: recommendation[field]
                        });
                    }
                });
                const validTypes = ['discontinue', 'adjust_dose', 'switch_therapy', 'add_therapy', 'monitor'];
                if (recommendation.type && !validTypes.includes(recommendation.type)) {
                    validationErrors.push({
                        field: `plan.recommendations[${index}].type`,
                        message: `Recommendation type must be one of: ${validTypes.join(', ')}`,
                        value: recommendation.type
                    });
                }
                const validPriorities = ['high', 'medium', 'low'];
                if (recommendation.priority && !validPriorities.includes(recommendation.priority)) {
                    validationErrors.push({
                        field: `plan.recommendations[${index}].priority`,
                        message: `Priority must be one of: ${validPriorities.join(', ')}`,
                        value: recommendation.priority
                    });
                }
            });
        }
        if (plan.monitoringPlan && Array.isArray(plan.monitoringPlan)) {
            plan.monitoringPlan.forEach((parameter, index) => {
                if (!parameter.parameter || !parameter.frequency) {
                    validationErrors.push({
                        field: `plan.monitoringPlan[${index}]`,
                        message: 'Monitoring parameters must include parameter and frequency',
                        value: parameter
                    });
                }
            });
        }
        if (plan.goals && Array.isArray(plan.goals)) {
            plan.goals.forEach((goal, index) => {
                const requiredGoalFields = ['description', 'targetValue', 'timeframe'];
                requiredGoalFields.forEach(field => {
                    if (!goal[field]) {
                        validationErrors.push({
                            field: `plan.goals[${index}].${field}`,
                            message: `${field} is required for each therapy goal`,
                            value: goal[field]
                        });
                    }
                });
            });
        }
        if (validationErrors.length > 0) {
            logger_1.default.warn('Therapy plan validation failed', {
                userId: req.user?.id,
                reviewId: req.params.id,
                errors: validationErrors,
                timestamp: new Date().toISOString()
            });
            throw new mtrErrors_1.MTRValidationError('Therapy plan validation failed', validationErrors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateTherapyPlan = validateTherapyPlan;
const validateMTRAccess = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            logger_1.default.warn('Unauthorized MTR access attempt', {
                endpoint: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            throw new mtrErrors_1.MTRAuthorizationError('Authentication required for MTR access');
        }
        if (!user.role || !['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'].includes(user.role)) {
            logger_1.default.warn('Insufficient permissions for MTR access', {
                userId: user.id,
                userRole: user.role,
                endpoint: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            throw new mtrErrors_1.MTRAuthorizationError('Pharmacist credentials required for MTR operations');
        }
        if (user.licenseStatus && !['active', 'approved'].includes(user.licenseStatus)) {
            logger_1.default.warn('MTR access attempt with inactive license', {
                userId: user.id,
                licenseStatus: user.licenseStatus,
                endpoint: req.originalUrl,
                timestamp: new Date().toISOString()
            });
            throw new mtrErrors_1.MTRAuthorizationError('Active or approved pharmacist license required for MTR operations');
        }
        logger_1.default.info('MTR access granted', {
            userId: user.id,
            userRole: user.role,
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateMTRAccess = validateMTRAccess;
const validateMTRBusinessLogic = (req, res, next) => {
    try {
        const { method, originalUrl } = req;
        const validationErrors = [];
        if (originalUrl.includes('/step/') && method === 'PUT') {
            const stepName = req.params.stepName;
            const { completed, data } = req.body;
            if (completed && !data) {
                validationErrors.push({
                    field: 'data',
                    message: 'Step data is required when marking step as completed',
                    value: data
                });
            }
            const stepOrder = ['patientSelection', 'medicationHistory', 'therapyAssessment', 'planDevelopment', 'interventions', 'followUp'];
            const currentStepIndex = stepOrder.indexOf(stepName || '');
            if (currentStepIndex === -1) {
                validationErrors.push({
                    field: 'stepName',
                    message: 'Invalid step name',
                    value: stepName
                });
            }
        }
        if (originalUrl.includes('/interventions') && method === 'POST') {
            const { type, targetAudience, communicationMethod } = req.body;
            if (targetAudience === 'prescriber' && !['written', 'phone', 'email', 'fax'].includes(communicationMethod)) {
                validationErrors.push({
                    field: 'communicationMethod',
                    message: 'Prescriber communications must use written, phone, email, or fax methods',
                    value: communicationMethod
                });
            }
        }
        if (validationErrors.length > 0) {
            throw new mtrErrors_1.MTRBusinessLogicError('MTR business logic validation failed', validationErrors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateMTRBusinessLogic = validateMTRBusinessLogic;
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};
exports.mtrValidationMiddleware = {
    handleValidationErrors: exports.handleValidationErrors,
    validateMTRAccess: exports.validateMTRAccess,
    validateMTRBusinessLogic: exports.validateMTRBusinessLogic,
    validateMedicationHistory: exports.validateMedicationHistory,
    validateTherapyPlan: exports.validateTherapyPlan,
};
//# sourceMappingURL=mtrValidation.js.map