"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';
class RxNormService {
    async searchDrugs(name) {
        try {
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/drugs.json`, {
                params: { name }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNorm search error:', error);
            throw new Error(`Failed to search drugs: ${error.message}`);
        }
    }
    async getRxCuiByName(name) {
        try {
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/rxcui.json`, {
                params: { name }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNorm RxCUI error:', error);
            throw new Error(`Failed to get RxCUI: ${error.message}`);
        }
    }
    async getTherapeuticEquivalents(rxcui) {
        try {
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/related.json`, {
                params: { rxcui, tty: 'SCD' }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNorm therapeutic equivalents error:', error);
            throw new Error(`Failed to get therapeutic equivalents: ${error.message}`);
        }
    }
}
exports.default = new RxNormService();
//# sourceMappingURL=rxnormService.js.map