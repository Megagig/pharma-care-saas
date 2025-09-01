"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const planSeeder_1 = __importDefault(require("../../utils/planSeeder"));
describe('PlanSeeder', () => {
    let seeder;
    beforeEach(async () => {
        await SubscriptionPlan_1.default.deleteMany({});
        seeder = new planSeeder_1.default();
    });
    describe('validateConfiguration', () => {
        it('should validate configuration successfully', async () => {
            const isValid = await seeder.validateConfiguration();
            expect(isValid).toBe(true);
        });
    });
    describe('seedPlans', () => {
        it('should seed plans from configuration', async () => {
            const initialCount = await SubscriptionPlan_1.default.countDocuments();
            expect(initialCount).toBe(0);
            await seeder.seedPlans();
            const finalCount = await SubscriptionPlan_1.default.countDocuments();
            expect(finalCount).toBeGreaterThan(0);
            const freeTrial = await SubscriptionPlan_1.default.findOne({ tier: 'free_trial' });
            expect(freeTrial).toBeTruthy();
            expect(freeTrial?.name).toBe('Free Trial');
            expect(freeTrial?.isActive).toBe(true);
        });
        it('should update existing plans when seeding again', async () => {
            await seeder.seedPlans();
            const initialCount = await SubscriptionPlan_1.default.countDocuments();
            await seeder.seedPlans();
            const finalCount = await SubscriptionPlan_1.default.countDocuments();
            expect(finalCount).toBe(initialCount);
        });
    });
    describe('getSeedingStats', () => {
        it('should return correct statistics', async () => {
            const statsBefore = await seeder.getSeedingStats();
            expect(statsBefore.totalPlansInDatabase).toBe(0);
            expect(statsBefore.activePlansInDatabase).toBe(0);
            expect(statsBefore.totalPlansInConfig).toBeGreaterThan(0);
            await seeder.seedPlans();
            const statsAfter = await seeder.getSeedingStats();
            expect(statsAfter.totalPlansInDatabase).toBeGreaterThan(0);
            expect(statsAfter.activePlansInDatabase).toBeGreaterThan(0);
            expect(statsAfter.totalPlansInConfig).toBe(statsAfter.activePlansInDatabase);
        });
    });
});
//# sourceMappingURL=planSeeder.test.js.map