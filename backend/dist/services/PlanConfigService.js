"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
class PlanConfigService {
    constructor() {
        this.cachedConfig = null;
        this.lastLoadTime = 0;
        this.CACHE_DURATION = 5 * 60 * 1000;
        this.CONFIG_PATH = path_1.default.join(__dirname, '../config/plans.json');
    }
    static getInstance() {
        if (!PlanConfigService.instance) {
            PlanConfigService.instance = new PlanConfigService();
        }
        return PlanConfigService.instance;
    }
    async loadConfiguration() {
        const now = Date.now();
        if (this.cachedConfig && (now - this.lastLoadTime) < this.CACHE_DURATION) {
            return this.cachedConfig;
        }
        try {
            logger_1.default.info('Loading plan configuration from file');
            if (!fs_1.default.existsSync(this.CONFIG_PATH)) {
                throw new Error(`Plan configuration file not found at ${this.CONFIG_PATH}`);
            }
            const configData = fs_1.default.readFileSync(this.CONFIG_PATH, 'utf8');
            const parsedConfig = JSON.parse(configData);
            this.validateConfiguration(parsedConfig);
            this.cachedConfig = parsedConfig;
            this.lastLoadTime = now;
            logger_1.default.info(`Successfully loaded ${Object.keys(parsedConfig.plans).length} plans and ${Object.keys(parsedConfig.features).length} features`);
            return parsedConfig;
        }
        catch (error) {
            logger_1.default.error('Failed to load plan configuration:', error);
            if (this.cachedConfig) {
                logger_1.default.warn('Using cached configuration as fallback');
                return this.cachedConfig;
            }
            logger_1.default.warn('Using default configuration as fallback');
            return this.getDefaultConfiguration();
        }
    }
    async getPlanByCode(code) {
        const config = await this.loadConfiguration();
        return config.plans[code] || null;
    }
    async getActivePlans() {
        const config = await this.loadConfiguration();
        return Object.values(config.plans).filter(plan => plan.isActive);
    }
    async getFeatureByCode(code) {
        const config = await this.loadConfiguration();
        return config.features[code] || null;
    }
    async planHasFeature(planCode, featureCode) {
        const plan = await this.getPlanByCode(planCode);
        return plan ? plan.features.includes(featureCode) : false;
    }
    async getPlansByTierRank() {
        const config = await this.loadConfiguration();
        return Object.values(config.plans)
            .filter(plan => plan.isActive)
            .sort((a, b) => a.tierRank - b.tierRank);
    }
    async refreshCache() {
        this.cachedConfig = null;
        this.lastLoadTime = 0;
        await this.loadConfiguration();
    }
    validateConfiguration(config) {
        if (!config.plans || typeof config.plans !== 'object') {
            throw new Error('Invalid configuration: plans object is required');
        }
        if (!config.features || typeof config.features !== 'object') {
            throw new Error('Invalid configuration: features object is required');
        }
        if (!config.categories || typeof config.categories !== 'object') {
            throw new Error('Invalid configuration: categories object is required');
        }
        for (const [code, plan] of Object.entries(config.plans)) {
            this.validatePlan(code, plan);
        }
        for (const [code, feature] of Object.entries(config.features)) {
            this.validateFeature(code, feature);
        }
        this.validateFeatureReferences(config);
    }
    validatePlan(code, plan) {
        const requiredFields = ['name', 'code', 'tier', 'tierRank', 'priceNGN', 'billingInterval', 'description', 'features', 'limits'];
        for (const field of requiredFields) {
            if (!(field in plan)) {
                throw new Error(`Plan ${code} is missing required field: ${field}`);
            }
        }
        if (plan.code !== code) {
            throw new Error(`Plan code mismatch: expected ${code}, got ${plan.code}`);
        }
        if (!Array.isArray(plan.features)) {
            throw new Error(`Plan ${code} features must be an array`);
        }
        if (typeof plan.limits !== 'object' || plan.limits === null) {
            throw new Error(`Plan ${code} limits must be an object`);
        }
        const validTiers = ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'];
        if (!validTiers.includes(plan.tier)) {
            throw new Error(`Plan ${code} has invalid tier: ${plan.tier}`);
        }
        const validIntervals = ['monthly', 'yearly'];
        if (!validIntervals.includes(plan.billingInterval)) {
            throw new Error(`Plan ${code} has invalid billing interval: ${plan.billingInterval}`);
        }
    }
    validateFeature(code, feature) {
        const requiredFields = ['name', 'category', 'description'];
        for (const field of requiredFields) {
            if (!(field in feature)) {
                throw new Error(`Feature ${code} is missing required field: ${field}`);
            }
        }
    }
    validateFeatureReferences(config) {
        const availableFeatures = new Set(Object.keys(config.features));
        for (const [planCode, plan] of Object.entries(config.plans)) {
            for (const featureCode of plan.features) {
                if (!availableFeatures.has(featureCode)) {
                    throw new Error(`Plan ${planCode} references unknown feature: ${featureCode}`);
                }
            }
        }
    }
    getDefaultConfiguration() {
        return {
            plans: {
                free_trial: {
                    name: 'Free Trial',
                    code: 'free_trial',
                    tier: 'free_trial',
                    tierRank: 0,
                    priceNGN: 0,
                    billingInterval: 'monthly',
                    trialDuration: 14,
                    popularPlan: false,
                    isContactSales: false,
                    whatsappNumber: null,
                    description: '14-day free trial with basic features',
                    isActive: true,
                    isTrial: true,
                    isCustom: false,
                    features: ['dashboard', 'patient_management', 'clinical_notes'],
                    limits: {
                        patients: 10,
                        users: 1,
                        locations: 1,
                        storage: 100,
                        apiCalls: 100,
                        clinicalNotes: 50,
                        reminderSms: 10
                    }
                }
            },
            features: {
                dashboard: {
                    name: 'Dashboard Overview',
                    category: 'core',
                    description: 'Main dashboard with key metrics'
                },
                patient_management: {
                    name: 'Patient Management',
                    category: 'clinical',
                    description: 'Basic patient record management'
                },
                clinical_notes: {
                    name: 'Clinical Notes',
                    category: 'clinical',
                    description: 'Create and manage clinical notes'
                }
            },
            categories: {
                core: {
                    name: 'Core Features',
                    description: 'Essential functionality'
                },
                clinical: {
                    name: 'Clinical Features',
                    description: 'Clinical workflow tools'
                }
            }
        };
    }
}
exports.default = PlanConfigService;
//# sourceMappingURL=PlanConfigService.js.map