"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug';
class OpenFdaService {
    async getAdverseEffects(drugName, limit = 10) {
        try {
            const response = await axios_1.default.get(`${OPENFDA_BASE_URL}/event.json`, {
                params: {
                    search: `patient.drug.medicinalproduct:${drugName}`,
                    limit: limit
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('OpenFDA adverse effects error:', error);
            throw new Error(`Failed to get adverse effects: ${error.message}`);
        }
    }
    async getDrugLabeling(brandName) {
        try {
            const response = await axios_1.default.get(`${OPENFDA_BASE_URL}/label.json`, {
                params: {
                    search: `openfda.brand_name:${brandName}`
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('OpenFDA labeling error:', error);
            throw new Error(`Failed to get drug labeling: ${error.message}`);
        }
    }
}
exports.default = new OpenFdaService();
//# sourceMappingURL=openfdaService.js.map