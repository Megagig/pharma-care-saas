"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.drugInteractionSchema = exports.reportsQuerySchema = exports.mtrQuerySchema = exports.patientParamsSchema = exports.followUpParamsSchema = exports.interventionParamsSchema = exports.problemParamsSchema = exports.mtrParamsSchema = exports.updateFollowUpSchema = exports.createFollowUpSchema = exports.updateInterventionSchema = exports.createInterventionSchema = exports.updateProblemSchema = exports.createProblemSchema = exports.medicationSchema = exports.updateStepSchema = exports.updateMTRSessionSchema = exports.createMTRSessionSchema = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const isValidObjectId = (value) => {
    return mongoose_1.default.Types.ObjectId.isValid(value);
};
exports.createMTRSessionSchema = [
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid patient ID format'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['routine', 'urgent', 'high_risk'])
        .withMessage('Priority must be routine, urgent, or high_risk'),
    (0, express_validator_1.body)('reviewType')
        .optional()
        .isIn(['initial', 'follow_up', 'annual', 'targeted'])
        .withMessage('Review type must be initial, follow_up, annual, or targeted'),
    (0, express_validator_1.body)('referralSource')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Referral source cannot exceed 100 characters'),
    (0, express_validator_1.body)('reviewReason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Review reason cannot exceed 500 characters'),
    (0, express_validator_1.body)('patientConsent')
        .isBoolean()
        .withMessage('Patient consent must be a boolean')
        .custom((value, { req }) => {
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        if (!value) {
            throw new Error('Patient consent is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('confidentialityAgreed')
        .isBoolean()
        .withMessage('Confidentiality agreement must be a boolean')
        .custom((value, { req }) => {
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        if (!value) {
            throw new Error('Confidentiality agreement is required');
        }
        return true;
    }),
];
exports.updateMTRSessionSchema = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['in_progress', 'completed', 'cancelled', 'on_hold'])
        .withMessage('Status must be in_progress, completed, cancelled, or on_hold'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['routine', 'urgent', 'high_risk'])
        .withMessage('Priority must be routine, urgent, or high_risk'),
    (0, express_validator_1.body)('reviewType')
        .optional()
        .isIn(['initial', 'follow_up', 'annual', 'targeted'])
        .withMessage('Review type must be initial, follow_up, annual, or targeted'),
    (0, express_validator_1.body)('referralSource')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Referral source cannot exceed 100 characters'),
    (0, express_validator_1.body)('reviewReason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Review reason cannot exceed 500 characters'),
    (0, express_validator_1.body)('nextReviewDate')
        .optional()
        .isISO8601()
        .withMessage('Next review date must be a valid date'),
    (0, express_validator_1.body)('estimatedDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Estimated duration must be a positive number'),
];
exports.updateStepSchema = [
    (0, express_validator_1.param)('stepName')
        .isIn(['patientSelection', 'medicationHistory', 'therapyAssessment', 'planDevelopment', 'interventions', 'followUp'])
        .withMessage('Invalid step name'),
    (0, express_validator_1.body)('completed')
        .isBoolean()
        .withMessage('Completed must be a boolean'),
    (0, express_validator_1.body)('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object'),
];
exports.medicationSchema = [
    (0, express_validator_1.body)('medications')
        .isArray()
        .withMessage('Medications must be an array'),
    (0, express_validator_1.body)('medications.*.drugName')
        .notEmpty()
        .withMessage('Drug name is required')
        .isLength({ max: 200 })
        .withMessage('Drug name cannot exceed 200 characters'),
    (0, express_validator_1.body)('medications.*.genericName')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Generic name cannot exceed 200 characters'),
    (0, express_validator_1.body)('medications.*.strength.value')
        .isFloat({ min: 0 })
        .withMessage('Strength value must be a positive number'),
    (0, express_validator_1.body)('medications.*.strength.unit')
        .notEmpty()
        .withMessage('Strength unit is required')
        .isLength({ max: 20 })
        .withMessage('Strength unit cannot exceed 20 characters'),
    (0, express_validator_1.body)('medications.*.dosageForm')
        .notEmpty()
        .withMessage('Dosage form is required')
        .isLength({ max: 50 })
        .withMessage('Dosage form cannot exceed 50 characters'),
    (0, express_validator_1.body)('medications.*.instructions.dose')
        .notEmpty()
        .withMessage('Dose is required')
        .isLength({ max: 100 })
        .withMessage('Dose cannot exceed 100 characters'),
    (0, express_validator_1.body)('medications.*.instructions.frequency')
        .notEmpty()
        .withMessage('Frequency is required')
        .isLength({ max: 100 })
        .withMessage('Frequency cannot exceed 100 characters'),
    (0, express_validator_1.body)('medications.*.instructions.route')
        .notEmpty()
        .withMessage('Route is required')
        .isLength({ max: 50 })
        .withMessage('Route cannot exceed 50 characters'),
    (0, express_validator_1.body)('medications.*.category')
        .isIn(['prescribed', 'otc', 'herbal', 'supplement'])
        .withMessage('Category must be prescribed, otc, herbal, or supplement'),
    (0, express_validator_1.body)('medications.*.startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('medications.*.endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('medications.*.indication')
        .notEmpty()
        .withMessage('Indication is required')
        .isLength({ max: 200 })
        .withMessage('Indication cannot exceed 200 characters'),
    (0, express_validator_1.body)('medications.*.adherenceScore')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Adherence score must be between 0 and 100'),
];
exports.createProblemSchema = [
    (0, express_validator_1.body)('category')
        .isIn(['indication', 'effectiveness', 'safety', 'adherence'])
        .withMessage('Category must be indication, effectiveness, safety, or adherence'),
    (0, express_validator_1.body)('type')
        .isIn(['unnecessary', 'wrongDrug', 'doseTooLow', 'doseTooHigh', 'adverseReaction', 'inappropriateAdherence', 'needsAdditional', 'interaction', 'duplication', 'contraindication', 'monitoring'])
        .withMessage('Invalid problem type'),
    (0, express_validator_1.body)('severity')
        .isIn(['critical', 'major', 'moderate', 'minor'])
        .withMessage('Severity must be critical, major, moderate, or minor'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('clinicalSignificance')
        .notEmpty()
        .withMessage('Clinical significance is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Clinical significance must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('evidenceLevel')
        .isIn(['definite', 'probable', 'possible', 'unlikely'])
        .withMessage('Evidence level must be definite, probable, possible, or unlikely'),
    (0, express_validator_1.body)('affectedMedications')
        .optional()
        .isArray()
        .withMessage('Affected medications must be an array'),
    (0, express_validator_1.body)('relatedConditions')
        .optional()
        .isArray()
        .withMessage('Related conditions must be an array'),
    (0, express_validator_1.body)('riskFactors')
        .optional()
        .isArray()
        .withMessage('Risk factors must be an array'),
];
exports.updateProblemSchema = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['identified', 'addressed', 'monitoring', 'resolved', 'not_applicable'])
        .withMessage('Status must be identified, addressed, monitoring, resolved, or not_applicable'),
    (0, express_validator_1.body)('resolution.action')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Resolution action cannot exceed 1000 characters'),
    (0, express_validator_1.body)('resolution.outcome')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Resolution outcome cannot exceed 1000 characters'),
    ...exports.createProblemSchema.filter(rule => !rule.toString().includes('notEmpty')),
];
exports.createInterventionSchema = [
    (0, express_validator_1.body)('type')
        .isIn(['recommendation', 'counseling', 'monitoring', 'communication', 'education'])
        .withMessage('Type must be recommendation, counseling, monitoring, communication, or education'),
    (0, express_validator_1.body)('category')
        .isIn(['medication_change', 'adherence_support', 'monitoring_plan', 'patient_education'])
        .withMessage('Category must be medication_change, adherence_support, monitoring_plan, or patient_education'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    (0, express_validator_1.body)('rationale')
        .notEmpty()
        .withMessage('Rationale is required')
        .isLength({ max: 1000 })
        .withMessage('Rationale cannot exceed 1000 characters'),
    (0, express_validator_1.body)('targetAudience')
        .isIn(['patient', 'prescriber', 'caregiver', 'healthcare_team'])
        .withMessage('Target audience must be patient, prescriber, caregiver, or healthcare_team'),
    (0, express_validator_1.body)('communicationMethod')
        .isIn(['verbal', 'written', 'phone', 'email', 'fax', 'in_person'])
        .withMessage('Communication method must be verbal, written, phone, email, fax, or in_person'),
    (0, express_validator_1.body)('documentation')
        .notEmpty()
        .withMessage('Documentation is required')
        .isLength({ max: 2000 })
        .withMessage('Documentation cannot exceed 2000 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['high', 'medium', 'low'])
        .withMessage('Priority must be high, medium, or low'),
    (0, express_validator_1.body)('urgency')
        .optional()
        .isIn(['immediate', 'within_24h', 'within_week', 'routine'])
        .withMessage('Urgency must be immediate, within_24h, within_week, or routine'),
    (0, express_validator_1.body)('followUpRequired')
        .optional()
        .isBoolean()
        .withMessage('Follow-up required must be a boolean'),
    (0, express_validator_1.body)('followUpDate')
        .optional()
        .isISO8601()
        .withMessage('Follow-up date must be a valid date'),
];
exports.updateInterventionSchema = [
    (0, express_validator_1.body)('outcome')
        .optional()
        .isIn(['accepted', 'rejected', 'modified', 'pending', 'not_applicable'])
        .withMessage('Outcome must be accepted, rejected, modified, pending, or not_applicable'),
    (0, express_validator_1.body)('outcomeDetails')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Outcome details cannot exceed 1000 characters'),
    (0, express_validator_1.body)('followUpCompleted')
        .optional()
        .isBoolean()
        .withMessage('Follow-up completed must be a boolean'),
    ...exports.createInterventionSchema.filter(rule => !rule.toString().includes('notEmpty')),
];
exports.createFollowUpSchema = [
    (0, express_validator_1.body)('type')
        .isIn(['phone_call', 'appointment', 'lab_review', 'adherence_check', 'outcome_assessment'])
        .withMessage('Type must be phone_call, appointment, lab_review, adherence_check, or outcome_assessment'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    (0, express_validator_1.body)('scheduledDate')
        .isISO8601()
        .withMessage('Scheduled date must be a valid date')
        .custom((value) => {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate < now) {
            throw new Error('Scheduled date cannot be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('estimatedDuration')
        .optional()
        .isInt({ min: 5, max: 480 })
        .withMessage('Estimated duration must be between 5 and 480 minutes'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['high', 'medium', 'low'])
        .withMessage('Priority must be high, medium, or low'),
    (0, express_validator_1.body)('objectives')
        .optional()
        .isArray()
        .withMessage('Objectives must be an array'),
    (0, express_validator_1.body)('assignedTo')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid assigned to user ID format'),
];
exports.updateFollowUpSchema = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['scheduled', 'in_progress', 'completed', 'missed', 'rescheduled', 'cancelled'])
        .withMessage('Status must be scheduled, in_progress, completed, missed, rescheduled, or cancelled'),
    (0, express_validator_1.body)('scheduledDate')
        .optional()
        .isISO8601()
        .withMessage('Scheduled date must be a valid date'),
    (0, express_validator_1.body)('outcome.status')
        .optional()
        .isIn(['successful', 'partially_successful', 'unsuccessful'])
        .withMessage('Outcome status must be successful, partially_successful, or unsuccessful'),
    (0, express_validator_1.body)('outcome.notes')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Outcome notes cannot exceed 2000 characters'),
    (0, express_validator_1.body)('outcome.nextFollowUpDate')
        .optional()
        .isISO8601()
        .withMessage('Next follow-up date must be a valid date'),
    ...exports.createFollowUpSchema.filter(rule => !rule.toString().includes('notEmpty')),
];
exports.mtrParamsSchema = [
    (0, express_validator_1.param)('id')
        .custom(isValidObjectId)
        .withMessage('Invalid MTR session ID format'),
];
exports.problemParamsSchema = [
    (0, express_validator_1.param)('id')
        .custom(isValidObjectId)
        .withMessage('Invalid MTR session ID format'),
    (0, express_validator_1.param)('problemId')
        .custom(isValidObjectId)
        .withMessage('Invalid problem ID format'),
];
exports.interventionParamsSchema = [
    (0, express_validator_1.param)('id')
        .custom(isValidObjectId)
        .withMessage('Invalid MTR session ID format'),
    (0, express_validator_1.param)('interventionId')
        .custom(isValidObjectId)
        .withMessage('Invalid intervention ID format'),
];
exports.followUpParamsSchema = [
    (0, express_validator_1.param)('id')
        .custom(isValidObjectId)
        .withMessage('Invalid MTR session ID format'),
    (0, express_validator_1.param)('followupId')
        .custom(isValidObjectId)
        .withMessage('Invalid follow-up ID format'),
];
exports.patientParamsSchema = [
    (0, express_validator_1.param)('patientId')
        .custom(isValidObjectId)
        .withMessage('Invalid patient ID format'),
];
exports.mtrQuerySchema = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['in_progress', 'completed', 'cancelled', 'on_hold'])
        .withMessage('Status must be in_progress, completed, cancelled, or on_hold'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['routine', 'urgent', 'high_risk'])
        .withMessage('Priority must be routine, urgent, or high_risk'),
    (0, express_validator_1.query)('reviewType')
        .optional()
        .isIn(['initial', 'follow_up', 'annual', 'targeted'])
        .withMessage('Review type must be initial, follow_up, annual, or targeted'),
    (0, express_validator_1.query)('pharmacistId')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid pharmacist ID format'),
    (0, express_validator_1.query)('patientId')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid patient ID format'),
];
exports.reportsQuerySchema = [
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.query)('pharmacistId')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid pharmacist ID format'),
    (0, express_validator_1.query)('sessionId')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid session ID format'),
    (0, express_validator_1.query)('userId')
        .optional()
        .custom(isValidObjectId)
        .withMessage('Invalid user ID format'),
];
exports.drugInteractionSchema = [
    (0, express_validator_1.body)('medications')
        .isArray({ min: 1 })
        .withMessage('Medications array is required and must not be empty'),
    (0, express_validator_1.body)('medications.*.drugName')
        .notEmpty()
        .withMessage('Drug name is required for each medication'),
    (0, express_validator_1.body)('medications.*.genericName')
        .optional()
        .isString()
        .withMessage('Generic name must be a string'),
];
const validateRequest = (validations, location = 'body') => {
    return validations;
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=mtrValidators.js.map