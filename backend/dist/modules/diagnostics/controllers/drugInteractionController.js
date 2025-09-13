"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDrugs = exports.checkContraindications = exports.checkAllergyInteractions = exports.getDrugInformation = exports.checkDrugInteractions = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const clinicalApiService_1 = __importDefault(require("../services/clinicalApiService"));
exports.checkDrugInteractions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { medications, patientAllergies = [], includeContraindications = true } = req.body;
    try {
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'At least one medication is required', 400);
        }
        if (medications.length > 50) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Maximum 50 medications allowed per request', 400);
        }
        const interactionResults = await clinicalApiService_1.default.checkDrugInteractions(medications);
        let allergyAlerts = [];
        if (patientAllergies.length > 0) {
            allergyAlerts = await clinicalApiService_1.default.checkAllergyInteractions(medications, patientAllergies);
        }
        let contraindications = [];
        if (includeContraindications) {
            contraindications = await clinicalApiService_1.default.checkContraindications(medications);
        }
        const categorizedInteractions = {
            critical: interactionResults.filter((i) => i.severity === 'contraindicated'),
            major: interactionResults.filter((i) => i.severity === 'major'),
            moderate: interactionResults.filter((i) => i.severity === 'moderate'),
            minor: interactionResults.filter((i) => i.severity === 'minor'),
        };
        const riskScore = calculateInteractionRiskScore(interactionResults, allergyAlerts, contraindications);
        const recommendations = generateInteractionRecommendations(categorizedInteractions, allergyAlerts, contraindications);
        console.log('Drug interactions checked:', (0, responseHelpers_1.createAuditLog)('CHECK_DRUG_INTERACTIONS', 'DrugInteraction', 'interaction_check', context, {
            medicationsCount: medications.length,
            interactionsFound: interactionResults.length,
            allergyAlertsFound: allergyAlerts.length,
            riskScore,
            hasCriticalInteractions: categorizedInteractions.critical.length > 0,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            interactions: interactionResults,
            categorizedInteractions,
            allergyAlerts,
            contraindications,
            summary: {
                totalInteractions: interactionResults.length,
                criticalCount: categorizedInteractions.critical.length,
                majorCount: categorizedInteractions.major.length,
                moderateCount: categorizedInteractions.moderate.length,
                minorCount: categorizedInteractions.minor.length,
                allergyAlertCount: allergyAlerts.length,
                contraindicationCount: contraindications.length,
                riskScore,
                riskLevel: getRiskLevel(riskScore),
            },
            recommendations,
            checkedMedications: medications,
            checkedAllergies: patientAllergies,
        }, 'Drug interactions checked successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to check drug interactions:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to check drug interactions: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDrugInformation = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { drugName, includeInteractions = false, includeIndications = true } = req.body;
    try {
        if (!drugName || typeof drugName !== 'string' || drugName.trim().length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Drug name is required', 400);
        }
        const drugInfo = await clinicalApiService_1.default.lookupDrugInfo(drugName.trim());
        if (!drugInfo) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', `Drug information not found for: ${drugName}`, 404);
        }
        let interactionData = null;
        if (includeInteractions && drugInfo.rxcui) {
            try {
                interactionData = await clinicalApiService_1.default.getDrugInteractionsByRxCUI(drugInfo.rxcui);
            }
            catch (error) {
                logger_1.default.warn('Failed to get interaction data for drug:', { drugName, error });
            }
        }
        let indications = null;
        if (includeIndications && drugInfo.rxcui) {
            try {
                indications = await clinicalApiService_1.default.getDrugIndications(drugInfo.rxcui);
            }
            catch (error) {
                logger_1.default.warn('Failed to get indications for drug:', { drugName, error });
            }
        }
        console.log('Drug information retrieved:', (0, responseHelpers_1.createAuditLog)('GET_DRUG_INFORMATION', 'DrugInfo', 'drug_lookup', context, {
            drugName,
            rxcui: drugInfo.rxcui,
            includeInteractions,
            includeIndications,
            foundInteractions: interactionData?.length || 0,
            foundIndications: indications?.length || 0,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            drugInfo,
            interactionData,
            indications,
            searchTerm: drugName,
            dataCompleteness: {
                hasBasicInfo: !!drugInfo,
                hasInteractions: !!interactionData,
                hasIndications: !!indications,
                hasRxCUI: !!drugInfo.rxcui,
            },
        }, 'Drug information retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get drug information:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get drug information: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.checkAllergyInteractions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { medications, allergies } = req.body;
    try {
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'At least one medication is required', 400);
        }
        if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'At least one allergy is required', 400);
        }
        const allergyAlerts = await clinicalApiService_1.default.checkAllergyInteractions(medications, allergies);
        const categorizedAlerts = {
            severe: allergyAlerts.filter((a) => a.severity === 'severe'),
            moderate: allergyAlerts.filter((a) => a.severity === 'moderate'),
            mild: allergyAlerts.filter((a) => a.severity === 'mild'),
        };
        const recommendations = generateAllergyRecommendations(categorizedAlerts);
        console.log('Allergy interactions checked:', (0, responseHelpers_1.createAuditLog)('CHECK_ALLERGY_INTERACTIONS', 'AllergyInteraction', 'allergy_check', context, {
            medicationsCount: medications.length,
            allergiesCount: allergies.length,
            alertsFound: allergyAlerts.length,
            severeAlerts: categorizedAlerts.severe.length,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            allergyAlerts,
            categorizedAlerts,
            summary: {
                totalAlerts: allergyAlerts.length,
                severeCount: categorizedAlerts.severe.length,
                moderateCount: categorizedAlerts.moderate.length,
                mildCount: categorizedAlerts.mild.length,
                hasSevereAlerts: categorizedAlerts.severe.length > 0,
            },
            recommendations,
            checkedMedications: medications,
            checkedAllergies: allergies,
        }, 'Allergy interactions checked successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to check allergy interactions:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to check allergy interactions: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.checkContraindications = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { medications, conditions = [], patientAge, patientGender } = req.body;
    try {
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'At least one medication is required', 400);
        }
        const contraindications = await clinicalApiService_1.default.checkContraindications(medications, {
            conditions,
            age: patientAge,
            gender: patientGender,
        });
        const categorizedContraindications = {
            absolute: contraindications.filter((c) => c.type === 'absolute'),
            relative: contraindications.filter((c) => c.type === 'relative'),
            caution: contraindications.filter((c) => c.type === 'caution'),
        };
        const recommendations = generateContraindicationRecommendations(categorizedContraindications);
        console.log('Contraindications checked:', (0, responseHelpers_1.createAuditLog)('CHECK_CONTRAINDICATIONS', 'Contraindication', 'contraindication_check', context, {
            medicationsCount: medications.length,
            conditionsCount: conditions.length,
            contraindicationsFound: contraindications.length,
            absoluteContraindications: categorizedContraindications.absolute.length,
            patientAge,
            patientGender,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            contraindications,
            categorizedContraindications,
            summary: {
                totalContraindications: contraindications.length,
                absoluteCount: categorizedContraindications.absolute.length,
                relativeCount: categorizedContraindications.relative.length,
                cautionCount: categorizedContraindications.caution.length,
                hasAbsoluteContraindications: categorizedContraindications.absolute.length > 0,
            },
            recommendations,
            checkedMedications: medications,
            patientFactors: {
                conditions,
                age: patientAge,
                gender: patientGender,
            },
        }, 'Contraindications checked successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to check contraindications:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to check contraindications: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.searchDrugs = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { q, limit = 20 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        if (!q || typeof q !== 'string' || q.trim().length < 2) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Search query must be at least 2 characters long', 400);
        }
        const searchLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
        const searchResults = await clinicalApiService_1.default.searchDrugs(q.trim(), searchLimit);
        console.log('Drug search performed:', (0, responseHelpers_1.createAuditLog)('SEARCH_DRUGS', 'DrugSearch', 'drug_search', context, {
            searchQuery: q.trim(),
            resultsCount: searchResults.length,
            limit: searchLimit,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            results: searchResults,
            query: q.trim(),
            totalResults: searchResults.length,
            limit: searchLimit,
        }, 'Drug search completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to search drugs:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
function calculateInteractionRiskScore(interactions, allergyAlerts, contraindications) {
    let score = 0;
    interactions.forEach((interaction) => {
        switch (interaction.severity) {
            case 'contraindicated':
                score += 100;
                break;
            case 'major':
                score += 50;
                break;
            case 'moderate':
                score += 20;
                break;
            case 'minor':
                score += 5;
                break;
        }
    });
    allergyAlerts.forEach((alert) => {
        switch (alert.severity) {
            case 'severe':
                score += 75;
                break;
            case 'moderate':
                score += 30;
                break;
            case 'mild':
                score += 10;
                break;
        }
    });
    contraindications.forEach((contraindication) => {
        switch (contraindication.type) {
            case 'absolute':
                score += 80;
                break;
            case 'relative':
                score += 40;
                break;
            case 'caution':
                score += 15;
                break;
        }
    });
    return Math.min(score, 1000);
}
function getRiskLevel(score) {
    if (score >= 100)
        return 'critical';
    if (score >= 50)
        return 'high';
    if (score >= 20)
        return 'moderate';
    if (score > 0)
        return 'low';
    return 'minimal';
}
function generateInteractionRecommendations(categorizedInteractions, allergyAlerts, contraindications) {
    const recommendations = [];
    if (categorizedInteractions.critical.length > 0) {
        recommendations.push('URGENT: Contraindicated drug combinations detected. Consider alternative medications immediately.');
    }
    if (categorizedInteractions.major.length > 0) {
        recommendations.push('Major drug interactions found. Monitor patient closely and consider dose adjustments or alternative therapies.');
    }
    if (categorizedInteractions.moderate.length > 0) {
        recommendations.push('Moderate interactions detected. Monitor for adverse effects and consider timing adjustments.');
    }
    if (allergyAlerts.some((a) => a.severity === 'severe')) {
        recommendations.push('SEVERE ALLERGY ALERT: Patient may be allergic to one or more prescribed medications. Verify allergy history.');
    }
    if (contraindications.some((c) => c.type === 'absolute')) {
        recommendations.push('Absolute contraindications identified. These medications should not be used in this patient.');
    }
    if (recommendations.length === 0) {
        recommendations.push('No significant interactions detected. Continue monitoring as per standard practice.');
    }
    else {
        recommendations.push('Review all interactions with prescribing physician before administration.');
        recommendations.push('Document all interaction checks and clinical decisions in patient record.');
    }
    return recommendations;
}
function generateAllergyRecommendations(categorizedAlerts) {
    const recommendations = [];
    if (categorizedAlerts.severe.length > 0) {
        recommendations.push('STOP: Severe allergy risk detected. Do not administer these medications.');
        recommendations.push('Contact prescriber immediately for alternative therapy.');
    }
    if (categorizedAlerts.moderate.length > 0) {
        recommendations.push('Moderate allergy risk identified. Verify patient allergy history before proceeding.');
        recommendations.push('Consider premedication or alternative therapy if allergy confirmed.');
    }
    if (categorizedAlerts.mild.length > 0) {
        recommendations.push('Mild allergy risk noted. Monitor patient for allergic reactions.');
    }
    if (recommendations.length > 0) {
        recommendations.push('Ensure emergency medications are readily available.');
        recommendations.push('Document allergy check and patient counseling.');
    }
    return recommendations;
}
function generateContraindicationRecommendations(categorizedContraindications) {
    const recommendations = [];
    if (categorizedContraindications.absolute.length > 0) {
        recommendations.push('ABSOLUTE CONTRAINDICATION: These medications should not be used in this patient.');
        recommendations.push('Contact prescriber for alternative therapy options.');
    }
    if (categorizedContraindications.relative.length > 0) {
        recommendations.push('Relative contraindications identified. Benefits must outweigh risks.');
        recommendations.push('Enhanced monitoring and dose adjustments may be required.');
    }
    if (categorizedContraindications.caution.length > 0) {
        recommendations.push('Use with caution. Monitor patient closely for adverse effects.');
    }
    if (recommendations.length > 0) {
        recommendations.push('Document contraindication assessment and clinical rationale.');
    }
    return recommendations;
}
//# sourceMappingURL=drugInteractionController.js.map