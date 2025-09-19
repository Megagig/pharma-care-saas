"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicationExistsValidator = exports.getAdherenceByPatientSchema = exports.getMedicationsByPatientSchema = exports.checkInteractionsSchema = exports.createAdherenceLogSchema = exports.updateMedicationSchema = exports.createMedicationSchema = exports.validateObjectId = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return next();
};
exports.validateRequest = validateRequest;
const validateObjectId = (paramName) => (0, express_validator_1.param)(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ID`);
exports.validateObjectId = validateObjectId;
exports.createMedicationSchema = [
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Patient ID must be a valid MongoDB ID'),
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Medication name is required')
        .isString()
        .withMessage('Medication name must be a string')
        .trim(),
    (0, express_validator_1.body)('dosage')
        .notEmpty()
        .withMessage('Dosage is required')
        .isString()
        .withMessage('Dosage must be a string')
        .trim(),
    (0, express_validator_1.body)('frequency')
        .notEmpty()
        .withMessage('Frequency is required')
        .isString()
        .withMessage('Frequency must be a string')
        .trim(),
    (0, express_validator_1.body)('route')
        .notEmpty()
        .withMessage('Route is required')
        .isString()
        .withMessage('Route must be a string')
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((endDate, { req }) => {
        if (req.body.startDate &&
            endDate &&
            new Date(endDate) < new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('indication')
        .optional()
        .isString()
        .withMessage('Indication must be a string')
        .trim(),
    (0, express_validator_1.body)('prescriber')
        .optional()
        .isString()
        .withMessage('Prescriber must be a string')
        .trim(),
    (0, express_validator_1.body)('allergyCheck.status')
        .optional()
        .isBoolean()
        .withMessage('Allergy check status must be a boolean'),
    (0, express_validator_1.body)('allergyCheck.details')
        .optional()
        .isString()
        .withMessage('Allergy check details must be a string')
        .trim(),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'archived', 'cancelled'])
        .withMessage('Status must be either active, archived, or cancelled'),
    exports.validateRequest,
];
exports.updateMedicationSchema = [
    (0, exports.validateObjectId)('id'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .withMessage('Medication name must be a string')
        .trim(),
    (0, express_validator_1.body)('dosage')
        .optional()
        .isString()
        .withMessage('Dosage must be a string')
        .trim(),
    (0, express_validator_1.body)('frequency')
        .optional()
        .isString()
        .withMessage('Frequency must be a string')
        .trim(),
    (0, express_validator_1.body)('route')
        .optional()
        .isString()
        .withMessage('Route must be a string')
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((endDate, { req }) => {
        if (req.body.startDate &&
            endDate &&
            new Date(endDate) < new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('indication')
        .optional()
        .isString()
        .withMessage('Indication must be a string')
        .trim(),
    (0, express_validator_1.body)('prescriber')
        .optional()
        .isString()
        .withMessage('Prescriber must be a string')
        .trim(),
    (0, express_validator_1.body)('allergyCheck.status')
        .optional()
        .isBoolean()
        .withMessage('Allergy check status must be a boolean'),
    (0, express_validator_1.body)('allergyCheck.details')
        .optional()
        .isString()
        .withMessage('Allergy check details must be a string')
        .trim(),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'archived', 'cancelled'])
        .withMessage('Status must be either active, archived, or cancelled'),
    exports.validateRequest,
];
exports.createAdherenceLogSchema = [
    (0, express_validator_1.body)('medicationId')
        .notEmpty()
        .withMessage('Medication ID is required')
        .isMongoId()
        .withMessage('Medication ID must be a valid MongoDB ID'),
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Patient ID must be a valid MongoDB ID'),
    (0, express_validator_1.body)('refillDate')
        .optional()
        .isISO8601()
        .withMessage('Refill date must be a valid date'),
    (0, express_validator_1.body)('adherenceScore')
        .notEmpty()
        .withMessage('Adherence score is required')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Adherence score must be a number between 0 and 100'),
    (0, express_validator_1.body)('pillCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Pill count must be a non-negative integer'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .trim(),
    exports.validateRequest,
];
exports.checkInteractionsSchema = [
    (0, express_validator_1.body)('medications')
        .isArray({ min: 1 })
        .withMessage('At least one medication is required'),
    (0, express_validator_1.body)('medications.*.name')
        .notEmpty()
        .withMessage('Medication name is required')
        .isString()
        .withMessage('Medication name must be a string'),
    (0, express_validator_1.body)('medications.*.rxcui')
        .optional()
        .isString()
        .withMessage('RxCUI must be a string'),
    exports.validateRequest,
];
exports.getMedicationsByPatientSchema = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Patient ID must be a valid MongoDB ID'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'archived', 'cancelled', 'all'])
        .withMessage('Status must be either active, archived, cancelled, or all'),
    exports.validateRequest,
];
exports.getAdherenceByPatientSchema = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Patient ID must be a valid MongoDB ID'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    exports.validateRequest,
];
exports.medicationExistsValidator = (0, express_validator_1.param)('id')
    .custom(async (value) => {
    if (!(0, mongoose_1.isValidObjectId)(value)) {
        throw new Error('Invalid medication ID format');
    }
    return true;
})
    .withMessage('Medication not found');
//# sourceMappingURL=medicationValidators.js.map