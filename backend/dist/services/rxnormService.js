"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RxNormService = void 0;
const apiClient_1 = require("../utils/apiClient");
const logger_1 = __importDefault(require("../utils/logger"));
class RxNormService {
    constructor() {
        this.client = new apiClient_1.ApiClient({
            baseURL: 'https://rxnav.nlm.nih.gov/REST',
            timeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000
        });
    }
    async searchDrugs(drugName, maxEntries = 20) {
        try {
            const response = await this.client.get('/drugs.json', {
                params: {
                    name: drugName,
                    maxEntries
                }
            });
            const conceptGroups = response.data?.drugGroup?.conceptGroup || [];
            const drugs = [];
            conceptGroups.forEach(group => {
                if (group.conceptProperties) {
                    drugs.push(...group.conceptProperties);
                }
            });
            logger_1.default.info(`RxNorm search found ${drugs.length} drugs for "${drugName}"`);
            return drugs;
        }
        catch (error) {
            logger_1.default.error('RxNorm drug search failed:', error);
            throw new Error(`Failed to search drugs: ${error}`);
        }
    }
    async getRxCui(drugName) {
        try {
            const response = await this.client.get('/rxcui', {
                params: {
                    name: drugName
                }
            });
            const rxcuis = response.data?.idGroup?.rxnormId || [];
            logger_1.default.info(`Found ${rxcuis.length} RxCUIs for "${drugName}"`);
            return rxcuis;
        }
        catch (error) {
            logger_1.default.error('RxNorm RxCUI lookup failed:', error);
            throw new Error(`Failed to get RxCUI: ${error}`);
        }
    }
    async getTherapeuticEquivalents(rxcui) {
        try {
            const response = await this.client.get(`/related.json`, {
                params: {
                    rxcui,
                    tty: 'SCD+SBD+GPCK+BPCK'
                }
            });
            const conceptGroups = response.data?.relatedGroup?.conceptGroup || [];
            const equivalents = [];
            conceptGroups.forEach(group => {
                if (group.conceptProperties) {
                    equivalents.push(...group.conceptProperties);
                }
            });
            logger_1.default.info(`Found ${equivalents.length} therapeutic equivalents for RxCUI ${rxcui}`);
            return equivalents;
        }
        catch (error) {
            logger_1.default.error('RxNorm therapeutic equivalents lookup failed:', error);
            throw new Error(`Failed to get therapeutic equivalents: ${error}`);
        }
    }
    async getRelatedDrugs(rxcui) {
        try {
            const response = await this.client.get(`/related.json`, {
                params: {
                    rxcui
                }
            });
            const conceptGroups = response.data?.relatedGroup?.conceptGroup || [];
            const related = [];
            conceptGroups.forEach(group => {
                if (group.conceptProperties) {
                    related.push(...group.conceptProperties);
                }
            });
            logger_1.default.info(`Found ${related.length} related drugs for RxCUI ${rxcui}`);
            return related;
        }
        catch (error) {
            logger_1.default.error('RxNorm related drugs lookup failed:', error);
            throw new Error(`Failed to get related drugs: ${error}`);
        }
    }
    async getDrugDetails(rxcui) {
        try {
            const propertiesResponse = await this.client.get(`/rxcui/${rxcui}/properties.json`);
            const ndcResponse = await this.client.get(`/rxcui/${rxcui}/ndcs.json`);
            return {
                properties: propertiesResponse.data?.properties || {},
                ndcs: ndcResponse.data?.ndcGroup?.ndcList || []
            };
        }
        catch (error) {
            logger_1.default.error('RxNorm drug details lookup failed:', error);
            throw new Error(`Failed to get drug details: ${error}`);
        }
    }
    async getSpellingSuggestions(drugName) {
        try {
            const response = await this.client.get('/spellingsuggestions.json', {
                params: {
                    name: drugName
                }
            });
            const suggestions = response.data?.suggestionGroup?.suggestionList?.suggestion || [];
            logger_1.default.info(`Found ${suggestions.length} spelling suggestions for "${drugName}"`);
            return suggestions;
        }
        catch (error) {
            logger_1.default.error('RxNorm spelling suggestions failed:', error);
            return [];
        }
    }
}
exports.RxNormService = RxNormService;
exports.default = new RxNormService();
//# sourceMappingURL=rxnormService.js.map