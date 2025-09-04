"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyMedService = void 0;
const apiClient_1 = require("../utils/apiClient");
const logger_1 = require("../utils/logger");
class DailyMedService {
    constructor() {
        this.client = new apiClient_1.ApiClient({
            baseURL: 'https://dailymed.nlm.nih.gov/dailymed/services/v2',
            timeout: 20000,
            retryAttempts: 3,
            retryDelay: 1500
        });
    }
    async searchDrugs(drugName, page = 1, pageSize = 20) {
        try {
            const response = await this.client.get('/spls.json', {
                params: {
                    drug_name: drugName,
                    page,
                    pagesize: pageSize
                }
            });
            logger_1.logger.info(`DailyMed search found ${response.data.metadata.total_elements} results for "${drugName}"`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('DailyMed drug search failed:', error);
            throw new Error(`Failed to search DailyMed: ${error}`);
        }
    }
    async getMonograph(setid) {
        try {
            const response = await this.client.get(`/spls/${setid}.json`);
            if (!response.data.data || response.data.data.length === 0) {
                throw new Error('Monograph not found');
            }
            const monograph = response.data.data[0];
            logger_1.logger.info(`Retrieved DailyMed monograph for setid ${setid}: ${monograph.title}`);
            return monograph;
        }
        catch (error) {
            logger_1.logger.error('DailyMed monograph retrieval failed:', error);
            throw new Error(`Failed to get monograph: ${error}`);
        }
    }
    async searchByNDC(ndc) {
        try {
            const response = await this.client.get('/spls.json', {
                params: {
                    ndc
                }
            });
            logger_1.logger.info(`DailyMed NDC search found ${response.data.metadata.total_elements} results for NDC ${ndc}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('DailyMed NDC search failed:', error);
            throw new Error(`Failed to search by NDC: ${error}`);
        }
    }
    async searchByTherapeuticClass(therapeuticClass, page = 1, pageSize = 20) {
        try {
            const response = await this.client.get('/spls.json', {
                params: {
                    pharm_class: therapeuticClass,
                    page,
                    pagesize: pageSize
                }
            });
            logger_1.logger.info(`DailyMed therapeutic class search found ${response.data.metadata.total_elements} results for "${therapeuticClass}"`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('DailyMed therapeutic class search failed:', error);
            throw new Error(`Failed to search by therapeutic class: ${error}`);
        }
    }
    async getDrugLabeling(setid) {
        try {
            const response = await this.client.get(`/spls/${setid}/labeling.json`);
            logger_1.logger.info(`Retrieved DailyMed labeling for setid ${setid}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('DailyMed labeling retrieval failed:', error);
            throw new Error(`Failed to get drug labeling: ${error}`);
        }
    }
    async getDrugMedia(setid) {
        try {
            const response = await this.client.get(`/spls/${setid}/media.json`);
            logger_1.logger.info(`Retrieved DailyMed media for setid ${setid}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('DailyMed media retrieval failed:', error);
            return { data: [] };
        }
    }
    extractSafetyInfo(monograph) {
        return {
            boxedWarnings: monograph.boxed_warning || [],
            contraindications: monograph.contraindications || [],
            warningsAndPrecautions: monograph.warnings_and_precautions || [],
            adverseReactions: monograph.adverse_reactions || [],
            drugInteractions: monograph.drug_interactions || [],
            overdosage: monograph.overdosage || [],
            useInSpecificPopulations: monograph.use_in_specific_populations || [],
            deaSchedule: monograph.dea_schedule,
            controlledSubstance: monograph.controlled_substance
        };
    }
    extractDosingInfo(monograph) {
        return {
            indicationsAndUsage: monograph.indications_and_usage || [],
            dosageAndAdministration: monograph.dosage_and_administration || [],
            dosageForms: monograph.dosage_form || [],
            routes: monograph.route || [],
            howSupplied: monograph.how_supplied || [],
            storageAndHandling: monograph.storage_and_handling || []
        };
    }
    extractPatientCounselingInfo(monograph) {
        return monograph.patient_counseling_information || [];
    }
}
exports.DailyMedService = DailyMedService;
exports.default = new DailyMedService();
//# sourceMappingURL=dailymedService.js.map