"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePatientAccessRequest = exports.validateVitalSigns = exports.validateMedication = exports.validateDrugInteractions = exports.validateGetDiagnosticCase = exports.validateDiagnosticHistory = exports.validateDiagnosticDecision = exports.validateDiagnosticAnalysis = void 0;
const express_validator_1 = require("express-validator");
exports.validateDiagnosticAnalysis = [
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Valid patient ID is required'),
    (0, express_validator_1.body)('symptoms')
        .isObject()
        .withMessage('Symptoms object is required'),
    (0, express_validator_1.body)('symptoms.subjective')
        .notEmpty()
        .withMessage('Subjective symptoms are required')
        .isArray({ min: 1 })
        .withMessage('At least one subjective symptom is required')
        .custom((value) => {
        if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.trim().length === 0)) {
            throw new Error('Subjective symptoms must be non-empty strings');
        }
        return true;
    }),
    (0, express_validator_1.body)('symptoms.objective')
        .optional()
        .isArray()
        .withMessage('Objective symptoms must be an array')
        .custom((value) => {
        if (value && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) {
            throw new Error('Objective symptoms must be strings');
        }
        return true;
    }),
    (0, express_validator_1.body)('symptoms.duration')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Duration must be between 1-100 characters'),
    (0, express_validator_1.body)('symptoms.severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Severity must be mild, moderate, or severe'),
    (0, express_validator_1.body)('symptoms.onset')
        .optional()
        .isIn(['acute', 'chronic', 'subacute'])
        .withMessage('Onset must be acute, chronic, or subacute'),
    (0, express_validator_1.body)('labResults')
        .optional()
        .isArray()
        .withMessage('Lab results must be an array')
        .custom((value) => {
        if (value && Array.isArray(value)) {
            for (const lab of value) {
                if (!lab.testName || !lab.value || !lab.referenceRange || typeof lab.abnormal !== 'boolean') {
                    throw new Error('Each lab result must have testName, value, referenceRange, and abnormal (boolean)');
                }
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('currentMedications')
        .optional()
        .isArray()
        .withMessage('Current medications must be an array')
        .custom((value) => {
        if (value && Array.isArray(value)) {
            for (const med of value) {
                if (!med.name || !med.dosage || !med.frequency) {
                    throw new Error('Each medication must have name, dosage, and frequency');
                }
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('vitalSigns')
        .optional()
        .isObject()
        .withMessage('Vital signs must be an object'),
    (0, express_validator_1.body)('vitalSigns.bloodPressure')
        .optional()
        .isString()
        .matches(/^\d{2,3}\/\d{2,3}$|^\d{2,3}$|^\d{2,3}\/\d{2,3}\s*mmHg$/)
        .withMessage('Blood pressure format is invalid'),
    (0, express_validator_1.body)('vitalSigns.heartRate')
        .optional()
        .isInt({ min: 30, max: 250 })
        .withMessage('Heart rate must be between 30-250 bpm'),
    (0, express_validator_1.body)('vitalSigns.temperature')
        .optional()
        .isFloat({ min: 30, max: 45 })
        .withMessage('Temperature must be between 30-45°C'),
    (0, express_validator_1.body)('vitalSigns.respiratoryRate')
        .optional()
        .isInt({ min: 5, max: 100 })
        .withMessage('Respiratory rate must be between 5-100 breaths/min'),
    (0, express_validator_1.body)('vitalSigns.oxygenSaturation')
        .optional()
        .isInt({ min: 50, max: 100 })
        .withMessage('Oxygen saturation must be between 50-100%'),
    (0, express_validator_1.body)('patientConsent')
        .optional()
        .isObject()
        .withMessage('Patient consent must be an object'),
    (0, express_validator_1.body)('patientConsent.provided')
        .optional()
        .isBoolean()
        .withMessage('Patient consent provided must be a boolean'),
    (0, express_validator_1.body)('patientConsent.method')
        .optional()
        .isIn(['verbal', 'written', 'electronic'])
        .withMessage('Consent method must be verbal, written, or electronic')
];
exports.validateDiagnosticDecision = [
    (0, express_validator_1.param)('caseId')
        .isString()
        .isLength({ min: 10, max: 50 })
        .withMessage('Valid case ID is required'),
    (0, express_validator_1.body)('accepted')
        .isBoolean()
        .withMessage('Accepted decision must be a boolean'),
    (0, express_validator_1.body)('modifications')
        .optional()
        .isString()
        .isLength({ max: 2000 })
        .withMessage('Modifications must be a string with max 2000 characters'),
    (0, express_validator_1.body)('finalRecommendation')
        .isString()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Final recommendation is required (10-2000 characters)'),
    (0, express_validator_1.body)('counselingPoints')
        .optional()
        .isArray()
        .withMessage('Counseling points must be an array')
        .custom((value) => {
        if (value && Array.isArray(value)) {
            for (const point of value) {
                if (typeof point !== 'string' || point.trim().length === 0) {
                    throw new Error('Counseling points must be non-empty strings');
                }
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('followUpRequired')
        .optional()
        .isBoolean()
        .withMessage('Follow up required must be a boolean'),
    (0, express_validator_1.body)('followUpDate')
        .optional()
        .isISO8601()
        .withMessage('Follow up date must be a valid date'),
    (0, express_validator_1.body)().custom((value) => {
        if (value.followUpRequired === true && !value.followUpDate) {
            throw new Error('Follow up date is required when follow up is required');
        }
        return true;
    })
];
exports.validateDiagnosticHistory = [
    (0, express_validator_1.param)('patientId')
        .isMongoId()
        .withMessage('Valid patient ID is required'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100')
];
exports.validateGetDiagnosticCase = [
    (0, express_validator_1.param)('caseId')
        .isString()
        .isLength({ min: 10, max: 50 })
        .withMessage('Valid case ID is required')
];
exports.validateDrugInteractions = [
    (0, express_validator_1.body)('medications')
        .isArray({ min: 2 })
        .withMessage('At least two medications are required for interaction checking')
        .custom((value) => {
        if (!Array.isArray(value)) {
            throw new Error('Medications must be an array');
        }
        for (const med of value) {
            if (!med.name || typeof med.name !== 'string' || med.name.trim().length === 0) {
                throw new Error('Each medication must have a valid name');
            }
            if (med.dosage && typeof med.dosage !== 'string') {
                throw new Error('Medication dosage must be a string');
            }
            if (med.frequency && typeof med.frequency !== 'string') {
                throw new Error('Medication frequency must be a string');
            }
        }
        return true;
    })
];
const validateMedication = (medication) => {
    const errors = [];
    if (!medication.name || typeof medication.name !== 'string' || medication.name.trim().length === 0) {
        errors.push('Medication name is required');
    }
    if (!medication.dosage || typeof medication.dosage !== 'string' || medication.dosage.trim().length === 0) {
        errors.push('Medication dosage is required');
    }
    if (!medication.frequency || typeof medication.frequency !== 'string' || medication.frequency.trim().length === 0) {
        errors.push('Medication frequency is required');
    }
    if (medication.startDate && !Date.parse(medication.startDate)) {
        errors.push('Medication start date must be a valid date');
    }
    return errors;
};
exports.validateMedication = validateMedication;
const validateVitalSigns = (vitalSigns) => {
    const errors = [];
    if (vitalSigns.heartRate !== undefined) {
        const hr = Number(vitalSigns.heartRate);
        if (isNaN(hr) || hr < 30 || hr > 250) {
            errors.push('Heart rate must be between 30-250 bpm');
        }
    }
    if (vitalSigns.temperature !== undefined) {
        const temp = Number(vitalSigns.temperature);
        if (isNaN(temp) || temp < 30 || temp > 45) {
            errors.push('Temperature must be between 30-45°C');
        }
    }
    if (vitalSigns.respiratoryRate !== undefined) {
        const rr = Number(vitalSigns.respiratoryRate);
        if (isNaN(rr) || rr < 5 || rr > 100) {
            errors.push('Respiratory rate must be between 5-100 breaths/min');
        }
    }
    if (vitalSigns.oxygenSaturation !== undefined) {
        const spo2 = Number(vitalSigns.oxygenSaturation);
        if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
            errors.push('Oxygen saturation must be between 50-100%');
        }
    }
    if (vitalSigns.bloodPressure !== undefined) {
        const bpPattern = /^\d{2,3}\/\d{2,3}$|^\d{2,3}$|^\d{2,3}\/\d{2,3}\s*mmHg$/;
        if (!bpPattern.test(vitalSigns.bloodPressure)) {
            errors.push('Blood pressure format is invalid');
        }
    }
    return errors;
};
exports.validateVitalSigns = validateVitalSigns;
exports.default = {
    validateDiagnosticAnalysis: exports.validateDiagnosticAnalysis,
    validateDiagnosticDecision: exports.validateDiagnosticDecision,
    validateDiagnosticHistory: exports.validateDiagnosticHistory,
    validateGetDiagnosticCase: exports.validateGetDiagnosticCase,
    validateDrugInteractions: exports.validateDrugInteractions,
    validateMedication: exports.validateMedication,
    validateVitalSigns: exports.validateVitalSigns
};
exports.validatePatientAccessRequest = [
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Valid patient ID is required'),
];
//# sourceMappingURL=diagnosticValidators.js.map