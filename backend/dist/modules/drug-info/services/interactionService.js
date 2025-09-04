"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const RXNAV_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/interaction';
class InteractionService {
    async getInteractionsForDrug(rxcui) {
        try {
            const response = await axios_1.default.get(`${RXNAV_BASE_URL}/interaction.json`, {
                params: { rxcui }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNav interaction error:', error);
            throw new Error(`Failed to get interactions: ${error.message}`);
        }
    }
    async getInteractionsForMultipleDrugs(rxcuis) {
        try {
            const response = await axios_1.default.post(`${RXNAV_BASE_URL}/list.json`, {
                rxcuis: rxcuis
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNav multiple interactions error:', error);
            throw new Error(`Failed to get multiple drug interactions: ${error.message}`);
        }
    }
}
exports.default = new InteractionService();
//# sourceMappingURL=interactionService.js.map