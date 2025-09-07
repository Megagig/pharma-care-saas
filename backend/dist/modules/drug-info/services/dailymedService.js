"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const DAILYMED_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';
class DailyMedService {
    async searchMonographs(drugName) {
        try {
            const response = await axios_1.default.get(`${DAILYMED_BASE_URL}/spls.json`, {
                params: {
                    drug_name: drugName,
                    page: 1,
                    pageSize: 10,
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved monographs for ${drugName}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('DailyMed search error:', error);
            return {
                metadata: {
                    total_elements: 0,
                    per_page: 10,
                    current_page: 1,
                },
                results: [],
            };
        }
    }
    async getMonographById(setId) {
        try {
            const response = await axios_1.default.get(`${DAILYMED_BASE_URL}/spls/${setId}.json`, {
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved monograph for set ID: ${setId}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`DailyMed monograph error for set ID ${setId}:`, error);
            try {
                logger_1.default.info(`Trying to search for monographs related to set ID: ${setId}`);
                const searchResponse = await this.searchMonographs(setId);
                if (searchResponse.results && searchResponse.results.length > 0) {
                    const firstResult = searchResponse.results[0];
                    if (firstResult && firstResult.setid) {
                        logger_1.default.info(`Found alternative monograph with set ID: ${firstResult.setid}`);
                        const altResponse = await axios_1.default.get(`${DAILYMED_BASE_URL}/spls/${firstResult.setid}.json`, {
                            headers: {
                                Accept: 'application/json',
                            },
                            timeout: 15000,
                        });
                        return altResponse.data;
                    }
                }
            }
            catch (searchError) {
                logger_1.default.error('Alternative monograph search failed:', searchError);
            }
            return { SPL: undefined };
        }
    }
}
exports.default = new DailyMedService();
//# sourceMappingURL=dailymedService.js.map