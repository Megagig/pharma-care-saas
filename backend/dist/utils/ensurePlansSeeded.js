"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePlansSeeded = ensurePlansSeeded;
exports.forceReseedPlans = forceReseedPlans;
exports.getPlanSeedingStatus = getPlanSeedingStatus;
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const planSeeder_1 = __importDefault(require("./planSeeder"));
const logger_1 = __importDefault(require("./logger"));
async function ensurePlansSeeded() {
    try {
        const planCount = await SubscriptionPlan_1.default.countDocuments();
        if (planCount === 0) {
            logger_1.default.info('No subscription plans found in database, seeding from configuration...');
            const seeder = new planSeeder_1.default();
            await seeder.seedPlans();
            logger_1.default.info('Initial plan seeding completed');
        }
        else {
            logger_1.default.info(`Found ${planCount} subscription plans in database`);
            const seeder = new planSeeder_1.default();
            const stats = await seeder.getSeedingStats();
            if (stats.totalPlansInConfig > stats.activePlansInDatabase) {
                logger_1.default.warn(`Configuration has ${stats.totalPlansInConfig} plans but database has only ${stats.activePlansInDatabase} active plans`);
                logger_1.default.info('Consider running plan seeding to sync configuration with database');
            }
        }
    }
    catch (error) {
        logger_1.default.error('Failed to ensure plans are seeded:', error);
    }
}
async function forceReseedPlans() {
    try {
        logger_1.default.info('Force reseeding subscription plans from configuration...');
        const seeder = new planSeeder_1.default();
        await seeder.seedPlans();
        logger_1.default.info('Force reseed completed');
    }
    catch (error) {
        logger_1.default.error('Failed to force reseed plans:', error);
        throw error;
    }
}
async function getPlanSeedingStatus() {
    try {
        const seeder = new planSeeder_1.default();
        const stats = await seeder.getSeedingStats();
        const isSeeded = stats.totalPlansInDatabase > 0;
        const needsSeeding = stats.totalPlansInConfig > stats.activePlansInDatabase;
        return {
            isSeeded,
            stats,
            needsSeeding
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get plan seeding status:', error);
        throw error;
    }
}
//# sourceMappingURL=ensurePlansSeeded.js.map