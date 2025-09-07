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
                params: { rxcui },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved interactions for RxCUI: ${rxcui}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNav interaction error:', error);
            return {
                interactionTypeGroup: [
                    {
                        interactionType: [
                            {
                                minConceptItem: {
                                    rxcui: rxcui,
                                    name: 'Drug Information',
                                    tty: 'SCD',
                                },
                                interactionPair: [],
                            },
                        ],
                    },
                ],
            };
        }
    }
    async getInteractionsForMultipleDrugs(rxcuis) {
        try {
            const params = new URLSearchParams();
            params.append('rxcuis', rxcuis.join(' '));
            const response = await (0, axios_1.default)({
                method: 'POST',
                url: `${RXNAV_BASE_URL}/list.json`,
                data: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved interactions for multiple RxCUIs: ${rxcuis.join(', ')}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNav multiple interactions error:', error);
            return {
                fullInteractionTypeGroup: [
                    {
                        sourceDisclaimer: 'No interactions found or error occurred',
                        drugGroup: {
                            name: 'Queried medications',
                            rxnormId: rxcuis,
                        },
                        fullInteractionType: [],
                    },
                ],
            };
        }
    }
}
exports.default = new InteractionService();
//# sourceMappingURL=interactionService.js.map