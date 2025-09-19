"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalApiService = void 0;
const apiClient_1 = require("../../../utils/apiClient");
const logger_1 = __importDefault(require("../../../utils/logger"));
const rxnormService_1 = __importDefault(require("../../../services/rxnormService"));
const drugInteractionService_1 = __importDefault(require("../../../services/drugInteractionService"));
class ClinicalApiService {
    constructor() {
        this.cacheTimeout = 24 * 60 * 60 * 1000;
        this.maxCacheSize = 1000;
        this.rxnormClient = new apiClient_1.ApiClient({
            baseURL: 'https://rxnav.nlm.nih.gov/REST',
            timeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000,
        });
        this.openfdaClient = new apiClient_1.ApiClient({
            baseURL: 'https://api.fda.gov/drug',
            timeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000,
        });
        this.cache = new Map();
        setInterval(() => this.cleanExpiredCache(), 60 * 60 * 1000);
    }
    async getDrugInfo(drugName) {
        const cacheKey = `drug_info_${drugName.toLowerCase()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return {
                data: cached,
                cached: true,
                timestamp: new Date(),
                source: 'cache',
            };
        }
        try {
            const rxcuis = await rxnormService_1.default.getRxCui(drugName);
            if (rxcuis.length === 0) {
                throw new Error(`No RxCUI found for drug: ${drugName}`);
            }
            const primaryRxcui = rxcuis[0];
            const [drugDetails, relatedDrugs] = await Promise.all([
                rxnormService_1.default.getDrugDetails(primaryRxcui),
                rxnormService_1.default.getRelatedDrugs(primaryRxcui),
            ]);
            const fdaInfo = await this.getFDADrugInfo(drugName);
            const drugInfo = {
                rxcui: primaryRxcui,
                name: drugName,
                brandNames: this.extractBrandNames(relatedDrugs),
                genericNames: this.extractGenericNames(relatedDrugs),
                strength: drugDetails.properties?.strength,
                dosageForm: drugDetails.properties?.dosage_form,
                route: drugDetails.properties?.route,
                manufacturer: fdaInfo?.manufacturer,
                ndcs: drugDetails.ndcs || [],
                therapeuticClass: fdaInfo?.therapeuticClass,
                pharmacologicalClass: fdaInfo?.pharmacologicalClass,
                indication: fdaInfo?.indication,
                contraindications: fdaInfo?.contraindications || [],
                warnings: fdaInfo?.warnings || [],
                adverseEffects: fdaInfo?.adverseEffects || [],
                dosing: fdaInfo?.dosing,
            };
            this.setCache(cacheKey, drugInfo);
            logger_1.default.info(`Retrieved comprehensive drug info for: ${drugName}`, {
                rxcui: primaryRxcui,
                brandNames: drugInfo.brandNames.length,
                contraindications: drugInfo.contraindications.length,
            });
            return {
                data: drugInfo,
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get drug info for ${drugName}:`, error);
            throw new Error(`Failed to retrieve drug information: ${error}`);
        }
    }
    async checkDrugInteractions(medications) {
        if (medications.length < 2) {
            return {
                data: [],
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        const cacheKey = `interactions_${medications.sort().join('_').toLowerCase()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return {
                data: cached,
                cached: true,
                timestamp: new Date(),
                source: 'cache',
            };
        }
        try {
            const rxcuiPromises = medications.map(med => rxnormService_1.default.getRxCui(med));
            const rxcuiResults = await Promise.all(rxcuiPromises);
            const validRxcuis = [];
            const medicationMap = new Map();
            rxcuiResults.forEach((rxcuis, index) => {
                if (rxcuis.length > 0) {
                    const rxcui = rxcuis[0];
                    if (rxcui) {
                        validRxcuis.push(rxcui);
                        medicationMap.set(rxcui, medications[index]);
                    }
                }
            });
            if (validRxcuis.length < 2) {
                logger_1.default.warn('Insufficient valid RxCUIs for interaction check', {
                    medications,
                    validRxcuis: validRxcuis.length,
                });
                return {
                    data: [],
                    cached: false,
                    timestamp: new Date(),
                    source: 'api',
                };
            }
            const interactionData = await drugInteractionService_1.default.checkMultiDrugInteractions(validRxcuis);
            const formattedResults = drugInteractionService_1.default.formatInteractionResults(interactionData);
            const enhancedResults = [];
            for (const result of formattedResults) {
                for (const interaction of result.interactions) {
                    const enhancedInteraction = {
                        drugPair: {
                            drug1: result.drugName,
                            drug2: interaction.interactingDrug,
                            rxcui1: result.rxcui,
                            rxcui2: interaction.interactingRxcui,
                        },
                        severity: interaction.severity || 'minor',
                        description: interaction.description,
                        mechanism: await this.getInteractionMechanism(result.rxcui || '', interaction.interactingRxcui || ''),
                        clinicalEffects: this.extractClinicalEffects(interaction.description),
                        management: interaction.management ||
                            drugInteractionService_1.default.getManagementRecommendations(interaction.severity || 'minor', interaction.description),
                        source: interaction.source,
                        references: [],
                    };
                    enhancedResults.push(enhancedInteraction);
                }
            }
            this.setCache(cacheKey, enhancedResults);
            logger_1.default.info(`Drug interaction check completed`, {
                medications: medications.length,
                interactions: enhancedResults.length,
                severities: this.countBySeverity(enhancedResults),
            });
            return {
                data: enhancedResults,
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        catch (error) {
            logger_1.default.error('Drug interaction check failed:', error);
            throw new Error(`Failed to check drug interactions: ${error}`);
        }
    }
    async checkDrugAllergies(medications, knownAllergies) {
        const cacheKey = `allergies_${medications.sort().join('_')}_${knownAllergies.sort().join('_')}`.toLowerCase();
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return {
                data: cached,
                cached: true,
                timestamp: new Date(),
                source: 'cache',
            };
        }
        try {
            const alerts = [];
            for (const medication of medications) {
                for (const allergy of knownAllergies) {
                    const alert = await this.checkSingleDrugAllergy(medication, allergy);
                    if (alert) {
                        alerts.push(alert);
                    }
                }
            }
            this.setCache(cacheKey, alerts);
            logger_1.default.info(`Allergy check completed`, {
                medications: medications.length,
                allergies: knownAllergies.length,
                alerts: alerts.length,
            });
            return {
                data: alerts,
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        catch (error) {
            logger_1.default.error('Drug allergy check failed:', error);
            throw new Error(`Failed to check drug allergies: ${error}`);
        }
    }
    async checkContraindications(medications, conditions) {
        const cacheKey = `contraindications_${medications.sort().join('_')}_${conditions.sort().join('_')}`.toLowerCase();
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return {
                data: cached,
                cached: true,
                timestamp: new Date(),
                source: 'cache',
            };
        }
        try {
            const alerts = [];
            for (const medication of medications) {
                const drugInfo = await this.getDrugInfo(medication);
                for (const condition of conditions) {
                    const alert = this.checkSingleContraindication(drugInfo.data, condition);
                    if (alert) {
                        alerts.push(alert);
                    }
                }
            }
            this.setCache(cacheKey, alerts);
            logger_1.default.info(`Contraindication check completed`, {
                medications: medications.length,
                conditions: conditions.length,
                alerts: alerts.length,
            });
            return {
                data: alerts,
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        catch (error) {
            logger_1.default.error('Contraindication check failed:', error);
            throw new Error(`Failed to check contraindications: ${error}`);
        }
    }
    async searchDrugs(drugName, limit = 20) {
        const cacheKey = `drug_search_${drugName.toLowerCase()}_${limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return {
                data: cached,
                cached: true,
                timestamp: new Date(),
                source: 'cache',
            };
        }
        try {
            const results = await rxnormService_1.default.searchDrugs(drugName, limit);
            this.setCache(cacheKey, results);
            return {
                data: results,
                cached: false,
                timestamp: new Date(),
                source: 'api',
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to search for drug ${drugName}:`, error);
            throw new Error(`Failed to search for drug: ${error}`);
        }
    }
    async getFDADrugInfo(drugName) {
        try {
            const response = await this.openfdaClient.get('/label.json', {
                params: {
                    search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
                    limit: 1,
                },
            });
            const results = response.data?.results;
            if (!results || results.length === 0) {
                return null;
            }
            const drugLabel = results[0];
            return {
                manufacturer: drugLabel.openfda?.manufacturer_name?.[0],
                therapeuticClass: drugLabel.openfda?.pharm_class_epc?.[0],
                pharmacologicalClass: drugLabel.openfda?.pharm_class_moa?.[0],
                indication: drugLabel.indications_and_usage?.[0],
                contraindications: drugLabel.contraindications || [],
                warnings: drugLabel.warnings || [],
                adverseEffects: drugLabel.adverse_reactions || [],
                dosing: {
                    adult: drugLabel.dosage_and_administration?.[0],
                    pediatric: drugLabel.pediatric_use?.[0],
                    renal: drugLabel.use_in_specific_populations?.[0],
                    hepatic: drugLabel.use_in_specific_populations?.[1],
                },
            };
        }
        catch (error) {
            logger_1.default.warn(`FDA drug info not found for ${drugName}:`, error);
            return null;
        }
    }
    extractBrandNames(relatedDrugs) {
        return relatedDrugs
            .filter(drug => drug.tty === 'BN' || drug.tty === 'SBD')
            .map(drug => drug.name)
            .filter((name, index, array) => array.indexOf(name) === index);
    }
    extractGenericNames(relatedDrugs) {
        return relatedDrugs
            .filter(drug => drug.tty === 'IN' || drug.tty === 'SCD')
            .map(drug => drug.name)
            .filter((name, index, array) => array.indexOf(name) === index);
    }
    async getInteractionMechanism(rxcui1, rxcui2) {
        return undefined;
    }
    extractClinicalEffects(description) {
        const effects = [];
        const lowerDesc = description.toLowerCase();
        const effectPatterns = [
            { pattern: /increased.*risk/g, effect: 'Increased risk' },
            { pattern: /decreased.*effectiveness/g, effect: 'Decreased effectiveness' },
            { pattern: /elevated.*levels/g, effect: 'Elevated drug levels' },
            { pattern: /reduced.*clearance/g, effect: 'Reduced clearance' },
            { pattern: /prolonged.*effect/g, effect: 'Prolonged effect' },
            { pattern: /enhanced.*toxicity/g, effect: 'Enhanced toxicity' },
        ];
        effectPatterns.forEach(({ pattern, effect }) => {
            if (pattern.test(lowerDesc)) {
                effects.push(effect);
            }
        });
        return effects.length > 0 ? effects : ['Monitor for interaction effects'];
    }
    async checkSingleDrugAllergy(medication, allergy) {
        const commonCrossSensitivities = {
            'penicillin': ['amoxicillin', 'ampicillin', 'cephalexin'],
            'sulfa': ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole'],
            'aspirin': ['ibuprofen', 'naproxen', 'diclofenac'],
        };
        const lowerMedication = medication.toLowerCase();
        const lowerAllergy = allergy.toLowerCase();
        if (lowerMedication.includes(lowerAllergy)) {
            return {
                allergen: allergy,
                medication: medication,
                alertType: 'allergy',
                severity: 'severe',
                description: `Direct allergy match: Patient is allergic to ${allergy}`,
                recommendations: ['Do not administer', 'Consider alternative medication'],
            };
        }
        for (const [allergen, crossReactive] of Object.entries(commonCrossSensitivities)) {
            if (lowerAllergy.includes(allergen)) {
                for (const crossDrug of crossReactive) {
                    if (lowerMedication.includes(crossDrug)) {
                        return {
                            allergen: allergy,
                            medication: medication,
                            alertType: 'cross_sensitivity',
                            severity: 'moderate',
                            description: `Potential cross-sensitivity: ${medication} may cross-react with ${allergy}`,
                            recommendations: ['Use with caution', 'Monitor closely', 'Consider alternative if possible'],
                        };
                    }
                }
            }
        }
        return null;
    }
    checkSingleContraindication(drugInfo, condition) {
        const lowerCondition = condition.toLowerCase();
        for (const contraindication of drugInfo.contraindications) {
            if (contraindication.toLowerCase().includes(lowerCondition)) {
                return {
                    medication: drugInfo.name,
                    rxcui: drugInfo.rxcui,
                    condition: condition,
                    severity: 'absolute',
                    description: contraindication,
                    alternatives: [],
                };
            }
        }
        for (const warning of drugInfo.warnings) {
            if (warning.toLowerCase().includes(lowerCondition)) {
                return {
                    medication: drugInfo.name,
                    rxcui: drugInfo.rxcui,
                    condition: condition,
                    severity: 'relative',
                    description: warning,
                    alternatives: [],
                };
            }
        }
        return null;
    }
    countBySeverity(interactions) {
        return interactions.reduce((counts, interaction) => {
            counts[interaction.severity] = (counts[interaction.severity] || 0) + 1;
            return counts;
        }, {});
    }
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt.getTime()) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        const entry = {
            data,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + this.cacheTimeout),
        };
        this.cache.set(key, entry);
    }
    cleanExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt.getTime()) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.default.info(`Cleaned ${cleanedCount} expired cache entries`);
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.default.info('Clinical API cache cleared');
    }
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
        };
    }
}
exports.ClinicalApiService = ClinicalApiService;
exports.default = new ClinicalApiService();
//# sourceMappingURL=clinicalApiService.js.map