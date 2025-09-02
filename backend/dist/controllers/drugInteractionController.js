"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicalReviewValidation = exports.drugPairValidation = exports.drugInteractionValidation = exports.getSeverityLevels = exports.generateClinicalReview = exports.checkContraindications = exports.checkTherapeuticDuplications = exports.checkDrugPairInteraction = exports.checkDrugInteractions = void 0;
const responseHelpers_1 = require("../utils/responseHelpers");
const drugInteractionService_1 = require("../services/drugInteractionService");
const logger_1 = __importDefault(require("../utils/logger"));
const express_validator_1 = require("express-validator");
exports.checkDrugInteractions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid request parameters', 400, { errors: errors.array() });
    }
    const { medications, patientConditions = [] } = req.body;
    try {
        const interactionReport = await drugInteractionService_1.drugInteractionService.getInteractionReport(medications, patientConditions);
        logger_1.default.info(`Drug interaction check completed for user ${req.user?.id}`, {
            userId: req.user?.id,
            medicationCount: medications.length,
            interactionCount: interactionReport.interactions.length,
            criticalInteractions: interactionReport.summary.criticalInteractions,
            overallRiskLevel: interactionReport.summary.overallRiskLevel,
        });
        (0, responseHelpers_1.sendSuccess)(res, interactionReport, `Drug interaction analysis completed. ${interactionReport.interactions.length} interactions found.`);
    }
    catch (error) {
        logger_1.default.error('Error in drug interaction checking:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check drug interactions', 500);
    }
});
exports.checkDrugPairInteraction = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid request parameters', 400, { errors: errors.array() });
    }
    const { drug1, drug2 } = req.body;
    try {
        const interactions = await drugInteractionService_1.drugInteractionService.checkDrugInteractions([
            drug1,
            drug2,
        ]);
        (0, responseHelpers_1.sendSuccess)(res, {
            drug1: drug1.drugName,
            drug2: drug2.drugName,
            interaction: interactions[0] || null,
            hasInteraction: interactions.length > 0,
        }, interactions.length > 0
            ? `Interaction found between ${drug1.drugName} and ${drug2.drugName}`
            : `No interaction found between ${drug1.drugName} and ${drug2.drugName}`);
    }
    catch (error) {
        logger_1.default.error('Error checking drug pair interaction:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check drug pair interaction', 500);
    }
});
exports.checkTherapeuticDuplications = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid request parameters', 400, { errors: errors.array() });
    }
    const { medications } = req.body;
    try {
        const duplications = await drugInteractionService_1.drugInteractionService.checkTherapeuticDuplications(medications);
        (0, responseHelpers_1.sendSuccess)(res, {
            duplications,
            totalDuplications: duplications.length,
            hasDuplications: duplications.length > 0,
        }, `Found ${duplications.length} therapeutic duplications`);
    }
    catch (error) {
        logger_1.default.error('Error checking therapeutic duplications:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check therapeutic duplications', 500);
    }
});
exports.checkContraindications = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid request parameters', 400, { errors: errors.array() });
    }
    const { medications, patientConditions } = req.body;
    try {
        const contraindications = await drugInteractionService_1.drugInteractionService.checkContraindications(medications, patientConditions);
        const absoluteContraindications = contraindications.filter((c) => c.severity === 'absolute');
        const relativeContraindications = contraindications.filter((c) => c.severity === 'relative');
        (0, responseHelpers_1.sendSuccess)(res, {
            contraindications,
            absoluteContraindications,
            relativeContraindications,
            totalContraindications: contraindications.length,
            criticalAlert: absoluteContraindications.length > 0,
        }, contraindications.length > 0
            ? `Found ${contraindications.length} contraindications (${absoluteContraindications.length} absolute)`
            : 'No contraindications found');
    }
    catch (error) {
        logger_1.default.error('Error checking contraindications:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check contraindications', 500);
    }
});
exports.generateClinicalReview = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid request parameters', 400, { errors: errors.array() });
    }
    const { medications, patientConditions, patientAge, patientWeight, renalFunction, } = req.body;
    try {
        const interactionReport = await drugInteractionService_1.drugInteractionService.getInteractionReport(medications, patientConditions);
        const clinicalReview = {
            ...interactionReport,
            patientContext: {
                age: patientAge,
                weight: patientWeight,
                renalFunction: renalFunction,
                conditionsCount: patientConditions.length,
            },
            clinicalPriorities: generateClinicalPriorities(interactionReport),
            actionItems: generateActionItems(interactionReport),
            monitoringPlan: generateMonitoringPlan(interactionReport),
            pharmacistNotes: generatePharmacistNotes(interactionReport, {
                age: patientAge,
                renalFunction: renalFunction,
            }),
        };
        logger_1.default.info(`Clinical review generated for user ${req.user?.id}`, {
            userId: req.user?.id,
            overallRisk: interactionReport.summary.overallRiskLevel,
            actionItemsCount: clinicalReview.actionItems.length,
        });
        (0, responseHelpers_1.sendSuccess)(res, clinicalReview, 'Clinical review generated successfully');
    }
    catch (error) {
        logger_1.default.error('Error generating clinical review:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate clinical review', 500);
    }
});
exports.getSeverityLevels = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const severityLevels = {
        critical: {
            level: 'critical',
            description: 'Life-threatening interaction requiring immediate action',
            color: '#dc2626',
            action: 'DISCONTINUE or find alternative immediately',
            examples: ['Warfarin + Aspirin (high bleeding risk)'],
        },
        major: {
            level: 'major',
            description: 'Serious interaction requiring monitoring and possible intervention',
            color: '#ea580c',
            action: 'MONITOR closely and consider dose adjustment',
            examples: ['Digoxin + Furosemide (hypokalemia risk)'],
        },
        moderate: {
            level: 'moderate',
            description: 'Clinically significant interaction requiring awareness',
            color: '#ca8a04',
            action: 'AWARE and monitor as appropriate',
            examples: ['Simvastatin + Amlodipine (myopathy risk)'],
        },
        minor: {
            level: 'minor',
            description: 'Mild interaction with minimal clinical significance',
            color: '#059669',
            action: 'DOCUMENT but usually no action required',
            examples: ['Most food-drug interactions'],
        },
    };
    (0, responseHelpers_1.sendSuccess)(res, severityLevels, 'Interaction severity levels retrieved');
});
function generateClinicalPriorities(interactionReport) {
    const priorities = [];
    if (interactionReport.summary.criticalInteractions > 0) {
        priorities.push('🚨 URGENT: Address critical drug interactions immediately');
    }
    if (interactionReport.contraindications.some((c) => c.severity === 'absolute')) {
        priorities.push('⛔ CRITICAL: Review absolute contraindications');
    }
    if (interactionReport.summary.majorInteractions >= 3) {
        priorities.push('⚡ HIGH: Multiple major interactions require comprehensive review');
    }
    if (interactionReport.therapeuticDuplications.length > 0) {
        priorities.push('🔄 MODERATE: Review therapeutic duplications for optimization');
    }
    if (interactionReport.summary.totalMedications > 10) {
        priorities.push('📋 LOW: Consider medication reconciliation for complex regimen');
    }
    return priorities;
}
function generateActionItems(interactionReport) {
    const actions = [];
    interactionReport.interactions
        .filter((i) => i.severity === 'critical')
        .forEach((interaction) => {
        actions.push(`DISCONTINUE: Review ${interaction.drug1} + ${interaction.drug2} combination immediately`);
    });
    interactionReport.contraindications
        .filter((c) => c.severity === 'absolute')
        .forEach((contraindication) => {
        actions.push(`STOP: ${contraindication.drug} is contraindicated with ${contraindication.condition}`);
    });
    interactionReport.interactions
        .filter((i) => i.severity === 'major')
        .slice(0, 3)
        .forEach((interaction) => {
        actions.push(`MONITOR: ${interaction.drug1} + ${interaction.drug2} - ${interaction.recommendation}`);
    });
    return actions;
}
function generateMonitoringPlan(interactionReport) {
    const monitoringPlan = [];
    const allParameters = new Set();
    interactionReport.interactions.forEach((interaction) => {
        if (interaction.monitoringParameters) {
            interaction.monitoringParameters.forEach((param) => {
                allParameters.add(param);
            });
        }
    });
    const parameterFrequencies = {
        INR: 'Weekly initially, then monthly when stable',
        'Blood pressure': 'Daily for first week, then weekly',
        'Serum potassium': 'Weekly for first month',
        Creatinine: 'Monthly',
        'Digoxin level': 'After 1 week, then monthly',
        CBC: 'Monthly',
        'Liver enzymes': 'Monthly',
        'Blood glucose': 'Daily',
    };
    Array.from(allParameters).forEach((param) => {
        monitoringPlan.push({
            parameter: param,
            frequency: parameterFrequencies[param] || 'As clinically indicated',
            priority: interactionReport.interactions.some((i) => i.severity === 'critical' && i.monitoringParameters?.includes(param))
                ? 'high'
                : 'medium',
        });
    });
    return monitoringPlan;
}
function generatePharmacistNotes(interactionReport, patientContext) {
    const notes = [];
    if (patientContext.age && patientContext.age > 65) {
        notes.push('👴 GERIATRIC: Elderly patient - increased sensitivity to drug interactions');
    }
    if (patientContext.renalFunction && patientContext.renalFunction < 60) {
        notes.push('🧪 RENAL: Reduced kidney function may affect drug clearance');
    }
    if (interactionReport.summary.overallRiskLevel === 'high' ||
        interactionReport.summary.overallRiskLevel === 'critical') {
        notes.push('⚠️ HIGH RISK: Consider medication therapy management consultation');
    }
    if (interactionReport.summary.totalMedications > 8) {
        notes.push('💊 POLYPHARMACY: High medication burden increases interaction risk');
    }
    return notes;
}
exports.drugInteractionValidation = [
    (0, express_validator_1.body)('medications')
        .isArray({ min: 1 })
        .withMessage('At least one medication is required')
        .custom((medications) => {
        for (const med of medications) {
            if (!med.drugName || !med.activeIngredient) {
                throw new Error('Each medication must have drugName and activeIngredient');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('patientConditions')
        .optional()
        .isArray()
        .withMessage('Patient conditions must be an array'),
];
exports.drugPairValidation = [
    (0, express_validator_1.body)('drug1.drugName').notEmpty().withMessage('Drug 1 name is required'),
    (0, express_validator_1.body)('drug1.activeIngredient')
        .notEmpty()
        .withMessage('Drug 1 active ingredient is required'),
    (0, express_validator_1.body)('drug2.drugName').notEmpty().withMessage('Drug 2 name is required'),
    (0, express_validator_1.body)('drug2.activeIngredient')
        .notEmpty()
        .withMessage('Drug 2 active ingredient is required'),
];
exports.clinicalReviewValidation = [
    ...exports.drugInteractionValidation,
    (0, express_validator_1.body)('patientAge')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Patient age must be between 0 and 120'),
    (0, express_validator_1.body)('patientWeight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Patient weight must be a positive number'),
    (0, express_validator_1.body)('renalFunction')
        .optional()
        .isFloat({ min: 0, max: 200 })
        .withMessage('Renal function (eGFR) must be between 0 and 200'),
];
//# sourceMappingURL=drugInteractionController.js.map