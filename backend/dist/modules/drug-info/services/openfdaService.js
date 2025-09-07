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
            const encodedDrugName = encodeURIComponent(drugName);
            const response = await axios_1.default.get(`${OPENFDA_BASE_URL}/event.json`, {
                params: {
                    search: `patient.drug.medicinalproduct:"${encodedDrugName}"`,
                    limit: limit,
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved adverse effects for ${drugName}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('OpenFDA adverse effects error:', error);
            try {
                logger_1.default.info(`Trying alternative search for ${drugName}`);
                const altResponse = await axios_1.default.get(`${OPENFDA_BASE_URL}/event.json`, {
                    params: {
                        search: `patient.drug.openfda.generic_name:"${encodeURIComponent(drugName)}" OR patient.drug.openfda.brand_name:"${encodeURIComponent(drugName)}"`,
                        limit: limit,
                    },
                    headers: {
                        Accept: 'application/json',
                    },
                    timeout: 15000,
                });
                logger_1.default.info(`Successfully retrieved adverse effects with alternative search for ${drugName}`);
                return altResponse.data;
            }
            catch (altError) {
                logger_1.default.error('Alternative OpenFDA search also failed:', altError);
                return {
                    meta: {
                        disclaimer: 'No adverse effects found or API error occurred',
                        terms: 'See OpenFDA for terms of service',
                        license: 'See OpenFDA for license',
                        last_updated: new Date().toISOString(),
                        results: {
                            skip: 0,
                            limit: limit,
                            total: 0,
                        },
                    },
                    results: [],
                };
            }
        }
    }
    async getDrugIndications(drugId) {
        try {
            let drugName = drugId;
            if (/^\d+$/.test(drugId)) {
                try {
                    const rxNormInfo = await axios_1.default.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${drugId}/property.json?propName=name`);
                    if (rxNormInfo.data?.propConceptGroup?.propConcept?.[0]?.propValue) {
                        drugName =
                            rxNormInfo.data.propConceptGroup.propConcept[0].propValue;
                        logger_1.default.info(`Converted RxCUI ${drugId} to drug name: ${drugName}`);
                    }
                }
                catch (rxError) {
                    logger_1.default.warn(`Could not convert RxCUI ${drugId} to drug name:`, rxError);
                }
            }
            const encodedDrugName = encodeURIComponent(drugName);
            const response = await axios_1.default.get(`${OPENFDA_BASE_URL}/label.json`, {
                params: {
                    search: `openfda.brand_name:"${encodedDrugName}" OR openfda.generic_name:"${encodedDrugName}"`,
                    limit: 5,
                    fields: 'openfda.brand_name,openfda.generic_name,openfda.manufacturer_name,indications_and_usage',
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved drug indications for ${drugName}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('OpenFDA indications search error:', error);
            return {
                meta: {
                    disclaimer: 'No drug indications found or API error occurred',
                    terms: 'See OpenFDA for terms of service',
                    license: 'See OpenFDA for license',
                    last_updated: new Date().toISOString(),
                    results: {
                        skip: 0,
                        limit: 5,
                        total: 0,
                    },
                },
                results: [],
            };
        }
    }
    async getDrugLabeling(brandName) {
        try {
            const encodedBrandName = encodeURIComponent(brandName);
            const response = await axios_1.default.get(`${OPENFDA_BASE_URL}/label.json`, {
                params: {
                    search: `openfda.brand_name:"${encodedBrandName}"`,
                    limit: 10,
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            logger_1.default.info(`Successfully retrieved drug labeling for ${brandName}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('OpenFDA labeling error:', error);
            try {
                logger_1.default.info(`Trying alternative search for ${brandName}`);
                const altResponse = await axios_1.default.get(`${OPENFDA_BASE_URL}/label.json`, {
                    params: {
                        search: `openfda.generic_name:"${encodeURIComponent(brandName)}" OR openfda.substance_name:"${encodeURIComponent(brandName)}"`,
                        limit: 10,
                    },
                    headers: {
                        Accept: 'application/json',
                    },
                    timeout: 15000,
                });
                logger_1.default.info(`Successfully retrieved drug labeling with alternative search for ${brandName}`);
                return altResponse.data;
            }
            catch (altError) {
                logger_1.default.error('Alternative OpenFDA labeling search also failed:', altError);
                return {
                    meta: {
                        disclaimer: 'No drug labeling found or API error occurred',
                        terms: 'See OpenFDA for terms of service',
                        license: 'See OpenFDA for license',
                        last_updated: new Date().toISOString(),
                        results: {
                            skip: 0,
                            limit: 10,
                            total: 0,
                        },
                    },
                    results: [],
                };
            }
        }
    }
}
exports.default = new OpenFdaService();
//# sourceMappingURL=openfdaService.js.map