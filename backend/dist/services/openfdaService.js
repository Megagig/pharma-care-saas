"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenFDAService = void 0;
const apiClient_1 = require("../utils/apiClient");
const logger_1 = require("../utils/logger");
class OpenFDAService {
    constructor() {
        this.client = new apiClient_1.ApiClient({
            baseURL: 'https://api.fda.gov/drug',
            timeout: 20000,
            retryAttempts: 3,
            retryDelay: 2000
        });
    }
    async getAdverseEvents(drugName, limit = 100, skip = 0) {
        try {
            const searchQuery = `patient.drug.medicinalproduct:"${drugName}"`;
            const response = await this.client.get('/event.json', {
                params: {
                    search: searchQuery,
                    limit,
                    skip
                }
            });
            logger_1.logger.info(`OpenFDA adverse events found ${response.data.meta.results.total} results for "${drugName}"`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('OpenFDA adverse events search failed:', error);
            throw new Error(`Failed to get adverse events: ${error}`);
        }
    }
    async getDrugLabeling(drugName, limit = 10, skip = 0) {
        try {
            let searchQuery = `openfda.brand_name:"${drugName}"`;
            const response = await this.client.get('/label.json', {
                params: {
                    search: searchQuery,
                    limit,
                    skip
                }
            });
            if (response.data.meta.results.total === 0) {
                searchQuery = `openfda.generic_name:"${drugName}"`;
                const genericResponse = await this.client.get('/label.json', {
                    params: {
                        search: searchQuery,
                        limit,
                        skip
                    }
                });
                logger_1.logger.info(`OpenFDA drug labeling found ${genericResponse.data.meta.results.total} results for generic "${drugName}"`);
                return genericResponse.data;
            }
            logger_1.logger.info(`OpenFDA drug labeling found ${response.data.meta.results.total} results for brand "${drugName}"`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('OpenFDA drug labeling search failed:', error);
            throw new Error(`Failed to get drug labeling: ${error}`);
        }
    }
    async getAdverseEventsBySeverity(drugName, serious = true) {
        try {
            const seriousValue = serious ? '1' : '2';
            const searchQuery = `patient.drug.medicinalproduct:"${drugName}" AND serious:${seriousValue}`;
            const response = await this.client.get('/event.json', {
                params: {
                    search: searchQuery,
                    limit: 100
                }
            });
            logger_1.logger.info(`OpenFDA serious adverse events found ${response.data.meta.results.total} results for "${drugName}"`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('OpenFDA serious adverse events search failed:', error);
            throw new Error(`Failed to get serious adverse events: ${error}`);
        }
    }
    analyzeAdverseEventPatterns(events) {
        const analysis = {
            totalEvents: events.length,
            reactionCounts: {},
            severityBreakdown: {
                serious: 0,
                nonSerious: 0
            },
            demographics: {
                ageGroups: {},
                genders: {}
            },
            outcomes: {}
        };
        events.forEach(event => {
            if (event.patient?.reaction) {
                event.patient.reaction.forEach(reaction => {
                    if (reaction.reactionmeddrapt) {
                        analysis.reactionCounts[reaction.reactionmeddrapt] =
                            (analysis.reactionCounts[reaction.reactionmeddrapt] || 0) + 1;
                    }
                    if (reaction.reactionoutcome) {
                        analysis.outcomes[reaction.reactionoutcome] =
                            (analysis.outcomes[reaction.reactionoutcome] || 0) + 1;
                    }
                });
            }
            if (event.serious === '1') {
                analysis.severityBreakdown.serious++;
            }
            else {
                analysis.severityBreakdown.nonSerious++;
            }
            if (event.patient?.patientsex) {
                analysis.demographics.genders[event.patient.patientsex] =
                    (analysis.demographics.genders[event.patient.patientsex] || 0) + 1;
            }
            if (event.patient?.patientonsetage && event.patient?.patientonsetageunit) {
                const ageGroup = this.categorizeAge(parseInt(event.patient.patientonsetage), event.patient.patientonsetageunit);
                analysis.demographics.ageGroups[ageGroup] =
                    (analysis.demographics.ageGroups[ageGroup] || 0) + 1;
            }
        });
        analysis.topReactions = Object.entries(analysis.reactionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([reaction, count]) => ({ reaction, count }));
        return analysis;
    }
    extractSafetyInformation(labeling) {
        return {
            contraindications: labeling.contraindications || [],
            warnings: labeling.warnings || [],
            boxedWarnings: labeling.boxed_warning || [],
            warningsAndCautions: labeling.warnings_and_cautions || [],
            adverseReactions: labeling.adverse_reactions || [],
            drugInteractions: labeling.drug_interactions || [],
            overdosage: labeling.overdosage || [],
            pregnancy: labeling.pregnancy || [],
            pediatricUse: labeling.pediatric_use || [],
            geriatricUse: labeling.geriatric_use || []
        };
    }
    categorizeAge(age, unit) {
        let ageInYears = age;
        if (unit === '802' || unit.toLowerCase().includes('month')) {
            ageInYears = age / 12;
        }
        else if (unit === '803' || unit.toLowerCase().includes('week')) {
            ageInYears = age / 52;
        }
        else if (unit === '804' || unit.toLowerCase().includes('day')) {
            ageInYears = age / 365;
        }
        if (ageInYears < 2)
            return 'Infant (0-2 years)';
        if (ageInYears < 12)
            return 'Child (2-12 years)';
        if (ageInYears < 18)
            return 'Adolescent (12-18 years)';
        if (ageInYears < 65)
            return 'Adult (18-65 years)';
        return 'Elderly (65+ years)';
    }
}
exports.OpenFDAService = OpenFDAService;
exports.default = new OpenFDAService();
//# sourceMappingURL=openfdaService.js.map