"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyMedService = void 0;
const apiClient_1 = require("../utils/apiClient");
const logger_1 = __importDefault(require("../utils/logger"));
class DailyMedService {
    constructor() {
        this.client = new apiClient_1.ApiClient({
            baseURL: 'https://dailymed.nlm.nih.gov/dailymed/services/v2',
            timeout: 20000,
            retryAttempts: 3,
            retryDelay: 1500,
        });
    }
    async searchDrugs(drugName, page = 1, pageSize = 20) {
        try {
            const response = await this.client.get('/spls.json', {
                params: {
                    drug_name: drugName,
                    page,
                    pagesize: pageSize,
                },
            });
            logger_1.default.info(`DailyMed search found ${response.data.metadata.total_elements} results for "${drugName}"`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('DailyMed drug search failed:', error);
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
            if (monograph) {
                logger_1.default.info(`Retrieved DailyMed monograph for setid ${setid}: ${monograph.title}`);
                return monograph;
            }
            throw new Error('Monograph data is missing');
        }
        catch (error) {
            logger_1.default.error('DailyMed monograph retrieval failed:', error);
            throw new Error(`Failed to get monograph: ${error}`);
        }
    }
    async searchByNDC(ndc) {
        try {
            const response = await this.client.get('/spls.json', {
                params: {
                    ndc,
                },
            });
            logger_1.default.info(`DailyMed NDC search found ${response.data.metadata.total_elements} results for NDC ${ndc}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('DailyMed NDC search failed:', error);
            throw new Error(`Failed to search by NDC: ${error}`);
        }
    }
}
exports.DailyMedService = DailyMedService;
//# sourceMappingURL=dailymedService.js.map