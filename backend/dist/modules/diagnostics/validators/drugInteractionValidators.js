"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMedicationName = exports.sanitizeMedicationName = exports.validateDrugSearchQuery = exports.validatePatientAge = exports.validateConditionList = exports.validateAllergyList = exports.validateMedicationList = exports.validateConditionName = exports.validateAllergyName = exports.validateMedicationName = exports.validateRequest = exports.drugSearchQuerySchema = exports.contraindicationCheckSchema = exports.allergyCheckSchema = exports.drugInfoSchema = exports.checkInteractionsSchema = void 0;
const zod_1 = require("zod");
exports.checkInteractionsSchema = zod_1.z.object({
    medications: zod_1.z
        .array(zod_1.z.string().min(1, 'Medication name cannot be empty').max(200, 'Medication name too long'))
        .min(1, 'At least one medication is required')
        .max(50, 'Maximum 50 medications allowed per request'),
    patientAllergies: zod_1.z
        .array(zod_1.z.string().min(1, 'Allergy cannot be empty').max(100, 'Allergy name too long'))
        .max(20, 'Maximum 20 allergies allowed')
        .default([]),
    includeContraindications: zod_1.z.boolean().default(true),
});
exports.drugInfoSchema = zod_1.z.object({
    drugName: zod_1.z
        .string()
        .min(1, 'Drug name is required')
        .max(200, 'Drug name cannot exceed 200 characters')
        .trim(),
    includeInteractions: zod_1.z.boolean().default(false),
    includeIndications: zod_1.z.boolean().default(true),
});
exports.allergyCheckSchema = zod_1.z.object({
    medications: zod_1.z
        .array(zod_1.z.string().min(1, 'Medication name cannot be empty').max(200, 'Medication name too long'))
        .min(1, 'At least one medication is required')
        .max(50, 'Maximum 50 medications allowed'),
    allergies: zod_1.z
        .array(zod_1.z.string().min(1, 'Allergy cannot be empty').max(100, 'Allergy name too long'))
        .min(1, 'At least one allergy is required')
        .max(20, 'Maximum 20 allergies allowed'),
});
exports.contraindicationCheckSchema = zod_1.z.object({
    medications: zod_1.z
        .array(zod_1.z.string().min(1, 'Medication name cannot be empty').max(200, 'Medication name too long'))
        .min(1, 'At least one medication is required')
        .max(50, 'Maximum 50 medications allowed'),
    conditions: zod_1.z
        .array(zod_1.z.string().min(1, 'Condition cannot be empty').max(200, 'Condition name too long'))
        .max(30, 'Maximum 30 conditions allowed')
        .default([]),
    patientAge: zod_1.z
        .number()
        .int()
        .min(0, 'Age cannot be negative')
        .max(150, 'Age cannot exceed 150')
        .optional(),
    patientGender: zod_1.z
        .enum(['male', 'female', 'other'])
        .optional(),
});
exports.drugSearchQuerySchema = zod_1.z.object({
    q: zod_1.z
        .string()
        .min(2, 'Search query must be at least 2 characters long')
        .max(100, 'Search query cannot exceed 100 characters')
        .trim(),
    limit: zod_1.z
        .string()
        .optional()
        .default('20')
        .transform((val) => Math.min(50, Math.max(1, parseInt(val) || 20))),
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
const validateMedicationName = (medicationName) => {
    const cleanName = medicationName.trim();
    if (cleanName.length === 0) {
        return { valid: false, error: 'Medication name cannot be empty' };
    }
    if (cleanName.length < 2) {
        return { valid: false, error: 'Medication name must be at least 2 characters long' };
    }
    if (cleanName.length > 200) {
        return { valid: false, error: 'Medication name cannot exceed 200 characters' };
    }
    const validNamePattern = /^[a-zA-Z0-9\s\-\(\)\/\.]+$/;
    if (!validNamePattern.test(cleanName)) {
        return { valid: false, error: 'Medication name contains invalid characters' };
    }
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\bselect\b.*\bfrom\b/i,
        /\bunion\b.*\bselect\b/i,
        /\bdrop\b.*\btable\b/i,
    ];
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(cleanName)) {
            return { valid: false, error: 'Medication name contains invalid content' };
        }
    }
    return { valid: true };
};
exports.validateMedicationName = validateMedicationName;
const validateAllergyName = (allergyName) => {
    const cleanName = allergyName.trim();
    if (cleanName.length === 0) {
        return { valid: false, error: 'Allergy name cannot be empty' };
    }
    if (cleanName.length < 2) {
        return { valid: false, error: 'Allergy name must be at least 2 characters long' };
    }
    if (cleanName.length > 100) {
        return { valid: false, error: 'Allergy name cannot exceed 100 characters' };
    }
    const validAllergyPattern = /^[a-zA-Z0-9\s\-\(\)\/\.]+$/;
    if (!validAllergyPattern.test(cleanName)) {
        return { valid: false, error: 'Allergy name contains invalid characters' };
    }
    return { valid: true };
};
exports.validateAllergyName = validateAllergyName;
const validateConditionName = (conditionName) => {
    const cleanName = conditionName.trim();
    if (cleanName.length === 0) {
        return { valid: false, error: 'Condition name cannot be empty' };
    }
    if (cleanName.length < 2) {
        return { valid: false, error: 'Condition name must be at least 2 characters long' };
    }
    if (cleanName.length > 200) {
        return { valid: false, error: 'Condition name cannot exceed 200 characters' };
    }
    const validConditionPattern = /^[a-zA-Z0-9\s\-\(\)\/\.\,]+$/;
    if (!validConditionPattern.test(cleanName)) {
        return { valid: false, error: 'Condition name contains invalid characters' };
    }
    return { valid: true };
};
exports.validateConditionName = validateConditionName;
const validateMedicationList = (medications) => {
    const errors = [];
    const seenMedications = new Set();
    for (let i = 0; i < medications.length; i++) {
        const medication = medications[i];
        const validation = (0, exports.validateMedicationName)(medication);
        if (!validation.valid) {
            errors.push(`Medication ${i + 1}: ${validation.error}`);
            continue;
        }
        const normalizedMedication = medication.trim().toLowerCase();
        if (seenMedications.has(normalizedMedication)) {
            errors.push(`Medication ${i + 1}: Duplicate medication "${medication}"`);
        }
        else {
            seenMedications.add(normalizedMedication);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateMedicationList = validateMedicationList;
const validateAllergyList = (allergies) => {
    const errors = [];
    const seenAllergies = new Set();
    for (let i = 0; i < allergies.length; i++) {
        const allergy = allergies[i];
        const validation = (0, exports.validateAllergyName)(allergy);
        if (!validation.valid) {
            errors.push(`Allergy ${i + 1}: ${validation.error}`);
            continue;
        }
        const normalizedAllergy = allergy.trim().toLowerCase();
        if (seenAllergies.has(normalizedAllergy)) {
            errors.push(`Allergy ${i + 1}: Duplicate allergy "${allergy}"`);
        }
        else {
            seenAllergies.add(normalizedAllergy);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateAllergyList = validateAllergyList;
const validateConditionList = (conditions) => {
    const errors = [];
    const seenConditions = new Set();
    for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        const validation = (0, exports.validateConditionName)(condition);
        if (!validation.valid) {
            errors.push(`Condition ${i + 1}: ${validation.error}`);
            continue;
        }
        const normalizedCondition = condition.trim().toLowerCase();
        if (seenConditions.has(normalizedCondition)) {
            errors.push(`Condition ${i + 1}: Duplicate condition "${condition}"`);
        }
        else {
            seenConditions.add(normalizedCondition);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateConditionList = validateConditionList;
const validatePatientAge = (age) => {
    if (age < 0) {
        return { valid: false, error: 'Age cannot be negative' };
    }
    if (age > 150) {
        return { valid: false, error: 'Age cannot exceed 150 years' };
    }
    let ageGroup = 'adult';
    if (age < 2) {
        ageGroup = 'infant';
    }
    else if (age < 12) {
        ageGroup = 'child';
    }
    else if (age < 18) {
        ageGroup = 'adolescent';
    }
    else if (age >= 65) {
        ageGroup = 'elderly';
    }
    return { valid: true, ageGroup };
};
exports.validatePatientAge = validatePatientAge;
const validateDrugSearchQuery = (query) => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
        return { valid: false, error: 'Search query must be at least 2 characters long' };
    }
    if (cleanQuery.length > 100) {
        return { valid: false, error: 'Search query cannot exceed 100 characters' };
    }
    const validSearchPattern = /^[a-zA-Z0-9\s\-\(\)\/\.\*\%]+$/;
    if (!validSearchPattern.test(cleanQuery)) {
        return { valid: false, error: 'Search query contains invalid characters' };
    }
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\bselect\b.*\bfrom\b/i,
        /\bunion\b.*\bselect\b/i,
    ];
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(cleanQuery)) {
            return { valid: false, error: 'Search query contains invalid content' };
        }
    }
    return { valid: true };
};
exports.validateDrugSearchQuery = validateDrugSearchQuery;
const sanitizeMedicationName = (medicationName) => {
    return medicationName
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\-\(\)\/\.]/g, '')
        .substring(0, 200);
};
exports.sanitizeMedicationName = sanitizeMedicationName;
const normalizeMedicationName = (medicationName) => {
    return medicationName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');
};
exports.normalizeMedicationName = normalizeMedicationName;
exports.default = {
    validateRequest: exports.validateRequest,
    validateMedicationName: exports.validateMedicationName,
    validateAllergyName: exports.validateAllergyName,
    validateConditionName: exports.validateConditionName,
    validateMedicationList: exports.validateMedicationList,
    validateAllergyList: exports.validateAllergyList,
    validateConditionList: exports.validateConditionList,
    validatePatientAge: exports.validatePatientAge,
    validateDrugSearchQuery: exports.validateDrugSearchQuery,
    sanitizeMedicationName: exports.sanitizeMedicationName,
    normalizeMedicationName: exports.normalizeMedicationName,
};
//# sourceMappingURL=drugInteractionValidators.js.map