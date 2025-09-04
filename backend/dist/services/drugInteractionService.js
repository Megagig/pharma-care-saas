"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrugInteractionService = void 0;
const apiClient_1 = require("../utils/apiClient");
const logger_1 = require("../utils/logger");
class DrugInteractionService {
    constructor() {
        this.client = new apiClient_1.ApiClient({
            baseURL: 'https://rxnav.nlm.nih.gov/REST/interaction',
            timeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000
        });
    }
    async checkSingleDrugInteractions(rxcui) {
        try {
            const response = await this.client.get(`/interaction.json`, {
                params: { rxcui }
            });
            logger_1.logger.info(`Drug interaction check completed for RxCUI ${rxcui}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Single drug interaction check failed:', error);
            throw new Error(`Failed to check interactions for RxCUI ${rxcui}: ${error}`);
        }
    }
    async checkMultiDrugInteractions(rxcuis) {
        try {
            const response = await this.client.post('/list.json', {
                rxcuis
            });
            logger_1.logger.info(`Multi-drug interaction check completed for ${rxcuis.length} drugs`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Multi-drug interaction check failed:', error);
            throw new Error(`Failed to check interactions for multiple drugs: ${error}`);
        }
    }
    formatInteractionResults(interactionData, primaryRxcui) {
        const results = [];
        try {
            if ('interactionTypeGroup' in interactionData && interactionData.interactionTypeGroup) {
                for (const typeGroup of interactionData.interactionTypeGroup) {
                    for (const interactionType of typeGroup.interactionType) {
                        if (interactionType.minConcept) {
                            for (const concept of interactionType.minConcept) {
                                if (concept.rxcui === primaryRxcui)
                                    continue;
                                results.push({
                                    drugName: concept.name,
                                    rxcui: concept.rxcui,
                                    interactions: [{
                                            interactingDrug: concept.name,
                                            interactingRxcui: concept.rxcui,
                                            description: interactionType.comment || 'Interaction detected',
                                            source: typeGroup.sourceName,
                                            severity: this.determineSeverity(interactionType.comment || '')
                                        }]
                                });
                            }
                        }
                    }
                }
            }
            if ('interactions' in interactionData && interactionData.interactions) {
                for (const interaction of interactionData.interactions) {
                    if (interaction.interactionPairs) {
                        for (const pair of interaction.interactionPairs) {
                            if (pair.interactionConcept && pair.interactionConcept.length >= 2) {
                                const drug1 = pair.interactionConcept[0];
                                const drug2 = pair.interactionConcept[1];
                                results.push({
                                    drugName: drug1.minConceptItem.name,
                                    rxcui: drug1.minConceptItem.rxcui,
                                    interactions: [{
                                            interactingDrug: drug2.minConceptItem.name,
                                            interactingRxcui: drug2.minConceptItem.rxcui,
                                            description: pair.description || 'Drug interaction detected',
                                            source: drug1.sourceConceptItem.name,
                                            severity: this.determineSeverity(pair.description || '')
                                        }]
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error formatting interaction results:', error);
        }
        return results;
    }
    determineSeverity(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('contraindicated') || lowerDesc.includes('avoid') || lowerDesc.includes('dangerous')) {
            return 'contraindicated';
        }
        if (lowerDesc.includes('major') || lowerDesc.includes('serious') || lowerDesc.includes('severe')) {
            return 'major';
        }
        if (lowerDesc.includes('moderate') || lowerDesc.includes('monitor') || lowerDesc.includes('caution')) {
            return 'moderate';
        }
        return 'minor';
    }
    getManagementRecommendations(severity, description) {
        switch (severity) {
            case 'contraindicated':
                return 'Do not use together. Consider alternative medications.';
            case 'major':
                return 'Monitor closely. Consider dose adjustment or alternative therapy.';
            case 'moderate':
                return 'Monitor for adverse effects. Consider dose modification if needed.';
            case 'minor':
                return 'Monitor patient. Interaction is generally manageable.';
            default:
                return 'Monitor patient for any adverse effects.';
        }
    }
    async quickInteractionCheck(drugName) {
        try {
            const response = await this.client.get('/interaction.json', {
                params: { rxcui: drugName }
            });
            const hasInteractions = response.data?.interactionTypeGroup && response.data.interactionTypeGroup.length > 0;
            const count = response.data?.interactionTypeGroup?.reduce((total, group) => {
                return total + (group.interactionType?.length || 0);
            }, 0) || 0;
            return { hasInteractions, count };
        }
        catch (error) {
            logger_1.logger.warn('Quick interaction check failed:', error);
            return { hasInteractions: false, count: 0 };
        }
    }
}
exports.DrugInteractionService = DrugInteractionService;
exports.default = new DrugInteractionService();
//# sourceMappingURL=drugInteractionService.js.map