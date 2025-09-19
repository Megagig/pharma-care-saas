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
            logger_1.default.info(`Searching for drug with name: ${name}`);
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/drugs.json`, {
                params: { name: name },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNorm search error:', error);
            try {
                logger_1.default.info('Trying alternative RxNorm endpoint: /approximateTerm.json');
                const altResponse = await axios_1.default.get(`${RXNORM_BASE_URL}/approximateTerm.json`, {
                    params: {
                        term: name,
                        maxEntries: 10,
                    },
                    headers: {
                        Accept: 'application/json',
                    },
                    timeout: 10000,
                });
                logger_1.default.debug('Alternative RxNorm API response received');
                const conceptGroups = [];
                if (altResponse.data.approximateGroup?.candidate) {
                    const candidates = Array.isArray(altResponse.data.approximateGroup.candidate)
                        ? altResponse.data.approximateGroup.candidate
                        : [altResponse.data.approximateGroup.candidate];
                    const conceptProperties = candidates.map((candidate) => ({
                        rxcui: candidate.rxcui || '',
                        name: candidate.name || '',
                        synonym: candidate.name || '',
                        tty: candidate.tty || 'SCD',
                        language: 'ENG',
                        suppress: 'N',
                        umlscui: '',
                    }));
                    if (conceptProperties.length > 0) {
                        conceptGroups.push({
                            tty: 'SCD',
                            conceptProperties: conceptProperties,
                        });
                    }
                }
                return {
                    drugGroup: {
                        name: name,
                        conceptGroup: conceptGroups,
                    },
                };
            }
            catch (altError) {
                logger_1.default.error('Alternative RxNorm search error:', altError);
                return { drugGroup: { name: name, conceptGroup: [] } };
            }
        }
    }
    async getRxCuiByName(name) {
        try {
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/rxcui.json`, {
                params: {
                    name: name,
                    search: 2,
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 10000,
            });
            logger_1.default.info(`RxCUI lookup successful for ${name}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('RxNorm RxCUI lookup error:', error);
            try {
                logger_1.default.info(`Trying approximate match for ${name}`);
                const altResponse = await axios_1.default.get(`${RXNORM_BASE_URL}/rxcui.json`, {
                    params: {
                        name: name,
                        search: 9,
                    },
                    headers: {
                        Accept: 'application/json',
                    },
                    timeout: 10000,
                });
                logger_1.default.info(`Approximate match found for ${name}`);
                return altResponse.data;
            }
            catch (altError) {
                logger_1.default.error('RxNorm approximate match error:', altError);
                return {
                    idGroup: {
                        name: name,
                        rxnormId: [],
                    },
                };
            }
        }
    }
    async getTherapeuticEquivalents(rxcui) {
        try {
            const response = await axios_1.default.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json`, {
                params: {
                    tty: 'SCD',
                },
                headers: {
                    Accept: 'application/json',
                },
                timeout: 10000,
            });
            logger_1.default.info(`Successfully retrieved therapeutic equivalents for RxCUI: ${rxcui}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`RxNorm therapeutic equivalents error for RxCUI ${rxcui}:`, error);
            try {
                logger_1.default.info(`Trying alternative approach for RxCUI: ${rxcui}`);
                const altResponse = await axios_1.default.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/allrelated.json`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    timeout: 10000,
                });
                logger_1.default.info(`Successfully retrieved alternative related info for RxCUI: ${rxcui}`);
                if (altResponse.data && altResponse.data.allRelatedGroup) {
                    const scdGroup = altResponse.data.allRelatedGroup.conceptGroup?.find((group) => group.tty === 'SCD');
                    if (scdGroup) {
                        return {
                            relatedGroup: {
                                rxcui: rxcui,
                                termType: 'SCD',
                                conceptGroup: [scdGroup],
                            },
                        };
                    }
                }
                return {
                    relatedGroup: {
                        rxcui: rxcui,
                        termType: 'SCD',
                        conceptGroup: [],
                    },
                };
            }
            catch (altError) {
                logger_1.default.error(`Alternative approach also failed for RxCUI ${rxcui}:`, altError);
                return {
                    relatedGroup: {
                        rxcui: rxcui,
                        termType: 'SCD',
                        conceptGroup: [],
                    },
                };
            }
        }
    }
}
exports.default = new RxNormService();
//# sourceMappingURL=rxnormService.js.map