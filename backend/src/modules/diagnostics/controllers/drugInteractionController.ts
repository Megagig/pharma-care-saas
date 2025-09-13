import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
import logger from '../../../utils/logger';
import {
    sendSuccess,
    sendError,
    asyncHandler,
    getRequestContext,
    createAuditLog,
} from '../../../utils/responseHelpers';

// Import services
import clinicalApiService from '../services/clinicalApiService';

/**
 * Drug Interaction Controller
 * Handles all drug interaction checking endpoints
 */

// ===============================
// DRUG INTERACTION OPERATIONS
// ===============================

/**
 * POST /api/interactions/check
 * Check drug interactions for a list of medications
 */
export const checkDrugInteractions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { medications, patientAllergies = [], includeContraindications = true } = req.body;

        try {
            // Validate medications array
            if (!medications || !Array.isArray(medications) || medications.length === 0) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'At least one medication is required',
                    400
                );
            }

            if (medications.length > 50) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'Maximum 50 medications allowed per request',
                    400
                );
            }

            // Check drug interactions
            const interactionResults = await clinicalApiService.checkDrugInteractions(medications);

            // Check allergic reactions if allergies provided
            let allergyAlerts: any[] = [];
            if (patientAllergies.length > 0) {
                allergyAlerts = await clinicalApiService.checkAllergyInteractions(
                    medications,
                    patientAllergies
                );
            }

            // Check contraindications if requested
            let contraindications: any[] = [];
            if (includeContraindications) {
                contraindications = await clinicalApiService.checkContraindications(medications);
            }

            // Categorize interactions by severity
            const categorizedInteractions = {
                critical: interactionResults.filter((i: any) => i.severity === 'contraindicated'),
                major: interactionResults.filter((i: any) => i.severity === 'major'),
                moderate: interactionResults.filter((i: any) => i.severity === 'moderate'),
                minor: interactionResults.filter((i: any) => i.severity === 'minor'),
            };

            // Calculate risk score
            const riskScore = calculateInteractionRiskScore(
                interactionResults,
                allergyAlerts,
                contraindications
            );

            // Generate recommendations
            const recommendations = generateInteractionRecommendations(
                categorizedInteractions,
                allergyAlerts,
                contraindications
            );

            // Create audit log
            console.log(
                'Drug interactions checked:',
                createAuditLog(
                    'CHECK_DRUG_INTERACTIONS',
                    'DrugInteraction',
                    'interaction_check',
                    context,
                    {
                        medicationsCount: medications.length,
                        interactionsFound: interactionResults.length,
                        allergyAlertsFound: allergyAlerts.length,
                        riskScore,
                        hasCriticalInteractions: categorizedInteractions.critical.length > 0,
                    }
                )
            );

            sendSuccess(
                res,
                {
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
                },
                'Drug interactions checked successfully'
            );
        } catch (error) {
            logger.error('Failed to check drug interactions:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to check drug interactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/interactions/drug-info
 * Get detailed drug information
 */
export const getDrugInformation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { drugName, includeInteractions = false, includeIndications = true } = req.body;

        try {
            // Validate drug name
            if (!drugName || typeof drugName !== 'string' || drugName.trim().length === 0) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'Drug name is required',
                    400
                );
            }

            // Get drug information
            const drugInfo = await clinicalApiService.lookupDrugInfo(drugName.trim());

            if (!drugInfo) {
                return sendError(
                    res,
                    'NOT_FOUND',
                    `Drug information not found for: ${drugName}`,
                    404
                );
            }

            // Get additional interaction data if requested
            let interactionData = null;
            if (includeInteractions && drugInfo.rxcui) {
                try {
                    interactionData = await clinicalApiService.getDrugInteractionsByRxCUI(drugInfo.rxcui);
                } catch (error) {
                    logger.warn('Failed to get interaction data for drug:', { drugName, error });
                }
            }

            // Get indications if requested
            let indications = null;
            if (includeIndications && drugInfo.rxcui) {
                try {
                    indications = await clinicalApiService.getDrugIndications(drugInfo.rxcui);
                } catch (error) {
                    logger.warn('Failed to get indications for drug:', { drugName, error });
                }
            }

            // Create audit log
            console.log(
                'Drug information retrieved:',
                createAuditLog(
                    'GET_DRUG_INFORMATION',
                    'DrugInfo',
                    'drug_lookup',
                    context,
                    {
                        drugName,
                        rxcui: drugInfo.rxcui,
                        includeInteractions,
                        includeIndications,
                        foundInteractions: interactionData?.length || 0,
                        foundIndications: indications?.length || 0,
                    }
                )
            );

            sendSuccess(
                res,
                {
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
                },
                'Drug information retrieved successfully'
            );
        } catch (error) {
            logger.error('Failed to get drug information:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get drug information: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/interactions/allergy-check
 * Check for drug-allergy interactions
 */
export const checkAllergyInteractions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { medications, allergies } = req.body;

        try {
            // Validate input
            if (!medications || !Array.isArray(medications) || medications.length === 0) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'At least one medication is required',
                    400
                );
            }

            if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'At least one allergy is required',
                    400
                );
            }

            // Check allergy interactions
            const allergyAlerts = await clinicalApiService.checkAllergyInteractions(
                medications,
                allergies
            );

            // Categorize alerts by severity
            const categorizedAlerts = {
                severe: allergyAlerts.filter((a: any) => a.severity === 'severe'),
                moderate: allergyAlerts.filter((a: any) => a.severity === 'moderate'),
                mild: allergyAlerts.filter((a: any) => a.severity === 'mild'),
            };

            // Generate recommendations
            const recommendations = generateAllergyRecommendations(categorizedAlerts);

            // Create audit log
            console.log(
                'Allergy interactions checked:',
                createAuditLog(
                    'CHECK_ALLERGY_INTERACTIONS',
                    'AllergyInteraction',
                    'allergy_check',
                    context,
                    {
                        medicationsCount: medications.length,
                        allergiesCount: allergies.length,
                        alertsFound: allergyAlerts.length,
                        severeAlerts: categorizedAlerts.severe.length,
                    }
                )
            );

            sendSuccess(
                res,
                {
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
                },
                'Allergy interactions checked successfully'
            );
        } catch (error) {
            logger.error('Failed to check allergy interactions:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to check allergy interactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/interactions/contraindications
 * Check for drug contraindications
 */
export const checkContraindications = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { medications, conditions = [], patientAge, patientGender } = req.body;

        try {
            // Validate input
            if (!medications || !Array.isArray(medications) || medications.length === 0) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'At least one medication is required',
                    400
                );
            }

            // Check contraindications
            const contraindications = await clinicalApiService.checkContraindications(
                medications,
                {
                    conditions,
                    age: patientAge,
                    gender: patientGender,
                }
            );

            // Categorize contraindications
            const categorizedContraindications = {
                absolute: contraindications.filter((c: any) => c.type === 'absolute'),
                relative: contraindications.filter((c: any) => c.type === 'relative'),
                caution: contraindications.filter((c: any) => c.type === 'caution'),
            };

            // Generate recommendations
            const recommendations = generateContraindicationRecommendations(categorizedContraindications);

            // Create audit log
            console.log(
                'Contraindications checked:',
                createAuditLog(
                    'CHECK_CONTRAINDICATIONS',
                    'Contraindication',
                    'contraindication_check',
                    context,
                    {
                        medicationsCount: medications.length,
                        conditionsCount: conditions.length,
                        contraindicationsFound: contraindications.length,
                        absoluteContraindications: categorizedContraindications.absolute.length,
                        patientAge,
                        patientGender,
                    }
                )
            );

            sendSuccess(
                res,
                {
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
                },
                'Contraindications checked successfully'
            );
        } catch (error) {
            logger.error('Failed to check contraindications:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to check contraindications: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/interactions/drug-search
 * Search for drugs by name
 */
export const searchDrugs = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { q, limit = 20 } = req.query as any;
        const context = getRequestContext(req);

        try {
            // Validate search query
            if (!q || typeof q !== 'string' || q.trim().length < 2) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'Search query must be at least 2 characters long',
                    400
                );
            }

            const searchLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

            // Search for drugs
            const searchResults = await clinicalApiService.searchDrugs(q.trim(), searchLimit);

            // Create audit log
            console.log(
                'Drug search performed:',
                createAuditLog(
                    'SEARCH_DRUGS',
                    'DrugSearch',
                    'drug_search',
                    context,
                    {
                        searchQuery: q.trim(),
                        resultsCount: searchResults.length,
                        limit: searchLimit,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    results: searchResults,
                    query: q.trim(),
                    totalResults: searchResults.length,
                    limit: searchLimit,
                },
                'Drug search completed successfully'
            );
        } catch (error) {
            logger.error('Failed to search drugs:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

// ===============================
// HELPER FUNCTIONS
// ===============================

/**
 * Calculate interaction risk score
 */
function calculateInteractionRiskScore(
    interactions: any[],
    allergyAlerts: any[],
    contraindications: any[]
): number {
    let score = 0;

    // Score interactions by severity
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

    // Score allergy alerts
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

    // Score contraindications
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

    return Math.min(score, 1000); // Cap at 1000
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score: number): string {
    if (score >= 100) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 20) return 'moderate';
    if (score > 0) return 'low';
    return 'minimal';
}

/**
 * Generate interaction recommendations
 */
function generateInteractionRecommendations(
    categorizedInteractions: any,
    allergyAlerts: any[],
    contraindications: any[]
): string[] {
    const recommendations: string[] = [];

    // Critical interactions
    if (categorizedInteractions.critical.length > 0) {
        recommendations.push('URGENT: Contraindicated drug combinations detected. Consider alternative medications immediately.');
    }

    // Major interactions
    if (categorizedInteractions.major.length > 0) {
        recommendations.push('Major drug interactions found. Monitor patient closely and consider dose adjustments or alternative therapies.');
    }

    // Moderate interactions
    if (categorizedInteractions.moderate.length > 0) {
        recommendations.push('Moderate interactions detected. Monitor for adverse effects and consider timing adjustments.');
    }

    // Allergy alerts
    if (allergyAlerts.some((a: any) => a.severity === 'severe')) {
        recommendations.push('SEVERE ALLERGY ALERT: Patient may be allergic to one or more prescribed medications. Verify allergy history.');
    }

    // Contraindications
    if (contraindications.some((c: any) => c.type === 'absolute')) {
        recommendations.push('Absolute contraindications identified. These medications should not be used in this patient.');
    }

    // General recommendations
    if (recommendations.length === 0) {
        recommendations.push('No significant interactions detected. Continue monitoring as per standard practice.');
    } else {
        recommendations.push('Review all interactions with prescribing physician before administration.');
        recommendations.push('Document all interaction checks and clinical decisions in patient record.');
    }

    return recommendations;
}

/**
 * Generate allergy recommendations
 */
function generateAllergyRecommendations(categorizedAlerts: any): string[] {
    const recommendations: string[] = [];

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

/**
 * Generate contraindication recommendations
 */
function generateContraindicationRecommendations(categorizedContraindications: any): string[] {
    const recommendations: string[] = [];

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

// Default export for the controller
export default {
    checkDrugInteractions,
    getDrugInformation,
    checkAllergyInteractions,
    checkContraindications,
    searchDrugs
};