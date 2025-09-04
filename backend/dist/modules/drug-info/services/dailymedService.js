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
                params: { drug_name: drugName }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('DailyMed search error:', error);
            throw new Error(`Failed to search monographs: ${error.message}`);
        }
    }
    async getMonographById(setId) {
        try {
            const response = await axios_1.default.get(`${DAILYMED_BASE_URL}/spls/${setId}.json`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('DailyMed monograph error:', error);
            throw new Error(`Failed to get monograph: ${error.message}`);
        }
    }
}
exports.default = new DailyMedService();
//# sourceMappingURL=dailymedService.js.map