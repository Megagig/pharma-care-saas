"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PlanConfigService_1 = __importDefault(require("../../services/PlanConfigService"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const fs_1 = __importDefault(require("fs"));
jest.mock('fs');
const mockFs = fs_1.default;
jest.mock('../../models/SubscriptionPlan');
const mockSubscriptionPlan = SubscriptionPlan_1.default;
describe('PlanConfigService', () => {
    let planConfigService;
    const mockPlanConfig = {
        plans: {
            basic: {
                name: 'Basic Plan',
                code: 'basic',
                tier: 'basic',
                tierRank: 1,
                priceNGN: 15000,
                billingInterval: 'monthly',
                features: ['dashboard', 'patient_management'],
                limits: {
                    patients: 100,
                    users: 1,
                    locations: 1,
                    storage: 1000,
                    apiCalls: 1000
                },
                description: 'Basic plan for small pharmacies',
                isActive: true,
                isTrial: false,
                isCustom: false,
                popularPlan: false
            },
            premium: {
                name: 'Premium Plan',
                code: 'premium',
                tier: 'premium',
                tierRank: 2,
                priceNGN: 35000,
                billingInterval: 'monthly',
                features: ['dashboard', 'patient_management', 'advanced_reports'],
                limits: {
                    patients: 500,
                    users: 5,
                    locations: 3,
                    storage: 5000,
                    apiCalls: 5000
                },
                description: 'Premium plan for growing pharmacies',
                isActive: true,
                isTrial: false,
                isCustom: false,
                popularPlan: true
            }
        },
        features: {
            dashboard: {
                name: 'Dashboard Overview',
                category: 'core'
            },
            patient_management: {
                name: 'Patient Management',
                category: 'clinical'
            },
            advanced_reports: {
                name: 'Advanced Reports',
                category: 'analytics'
            }
        }
    };
    beforeEach(() => {
        jest.clearAllMocks();
        planConfigService = new PlanConfigService_1.default();
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPlanConfig));
    });
    describe('loadConfiguration', () => {
        it('should load configuration from JSON file successfully', async () => {
            const config = await planConfigService.loadConfiguration();
            expect(config).toEqual(mockPlanConfig);
            expect(mockFs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('plans.json'), 'utf8');
        });
        it('should throw error when configuration file does not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(planConfigService.loadConfiguration()).rejects.toThrow('Plan configuration file not found');
        });
        it('should throw error when configuration file contains invalid JSON', async () => {
            mockFs.readFileSync.mockReturnValue('invalid json');
            await expect(planConfigService.loadConfiguration()).rejects.toThrow();
        });
        it('should cache configuration after first load', async () => {
            await planConfigService.loadConfiguration();
            await planConfigService.loadConfiguration();
            expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
        });
    });
    describe('getPlanByCode', () => {
        beforeEach(async () => {
            await planConfigService.loadConfiguration();
        });
        it('should return plan configuration by code', async () => {
            const plan = await planConfigService.getPlanByCode('basic');
            expect(plan).toEqual(mockPlanConfig.plans.basic);
        });
        it('should return null for non-existent plan code', async () => {
            const plan = await planConfigService.getPlanByCode('non-existent');
            expect(plan).toBeNull();
        });
    });
    describe('getAllPlans', () => {
        beforeEach(async () => {
            await planConfigService.loadConfiguration();
        });
        it('should return all plan configurations', async () => {
            const plans = await planConfigService.getAllPlans();
            expect(plans).toEqual(Object.values(mockPlanConfig.plans));
        });
        it('should return only active plans when activeOnly is true', async () => {
            const plans = await planConfigService.getAllPlans(true);
            expect(plans).toHaveLength(2);
            expect(plans.every(plan => plan.isActive)).toBe(true);
        });
    });
    describe('getFeatureDefinition', () => {
        beforeEach(async () => {
            await planConfigService.loadConfiguration();
        });
        it('should return feature definition by code', async () => {
            const feature = await planConfigService.getFeatureDefinition('dashboard');
            expect(feature).toEqual(mockPlanConfig.features.dashboard);
        });
        it('should return null for non-existent feature code', async () => {
            const feature = await planConfigService.getFeatureDefinition('non-existent');
            expect(feature).toBeNull();
        });
    });
    describe('validatePlanConfiguration', () => {
        it('should validate correct plan configuration', () => {
            const isValid = planConfigService.validatePlanConfiguration(mockPlanConfig.plans.basic);
            expect(isValid).toBe(true);
        });
        it('should reject plan configuration with missing required fields', () => {
            const invalidPlan = { ...mockPlanConfig.plans.basic };
            delete invalidPlan.name;
            const isValid = planConfigService.validatePlanConfiguration(invalidPlan);
            expect(isValid).toBe(false);
        });
        it('should reject plan configuration with invalid tier rank', () => {
            const invalidPlan = { ...mockPlanConfig.plans.basic, tierRank: -1 };
            const isValid = planConfigService.validatePlanConfiguration(invalidPlan);
            expect(isValid).toBe(false);
        });
        it('should reject plan configuration with invalid price', () => {
            const invalidPlan = { ...mockPlanConfig.plans.basic, priceNGN: -100 };
            const isValid = planConfigService.validatePlanConfiguration(invalidPlan);
            expect(isValid).toBe(false);
        });
    });
    describe('refreshCache', () => {
        it('should clear cache and reload configuration', async () => {
            await planConfigService.loadConfiguration();
            expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
            await planConfigService.refreshCache();
            expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
        });
    });
    describe('getCacheStatus', () => {
        it('should return cache status information', async () => {
            const initialStatus = planConfigService.getCacheStatus();
            expect(initialStatus.isLoaded).toBe(false);
            expect(initialStatus.lastRefresh).toBeNull();
            await planConfigService.loadConfiguration();
            const loadedStatus = planConfigService.getCacheStatus();
            expect(loadedStatus.isLoaded).toBe(true);
            expect(loadedStatus.lastRefresh).toBeInstanceOf(Date);
            expect(loadedStatus.planCount).toBe(2);
            expect(loadedStatus.featureCount).toBe(3);
        });
    });
});
//# sourceMappingURL=PlanConfigService.test.js.map