"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
require("../models/SubscriptionPlan");
const db_1 = __importDefault(require("../config/db"));
const logger_1 = __importDefault(require("../utils/logger"));
const plans_json_1 = __importDefault(require("../config/plans.json"));
dotenv_1.default.config();
async function updateSubscriptionFeatures() {
    try {
        await (0, db_1.default)();
        logger_1.default.info('Connected to database');
        const subscriptions = await Subscription_1.default.find({
            status: { $in: ['active', 'trial'] }
        }).populate('planId');
        logger_1.default.info(`Found ${subscriptions.length} active subscriptions to update`);
        let updatedCount = 0;
        for (const subscription of subscriptions) {
            try {
                const planId = subscription.planId;
                if (!planId) {
                    logger_1.default.warn(`Subscription ${subscription._id} has no plan, skipping`);
                    continue;
                }
                const planConfig = Object.values(plans_json_1.default.plans).find((plan) => plan.tier === subscription.tier);
                if (!planConfig) {
                    logger_1.default.warn(`No plan configuration found for tier: ${subscription.tier}`);
                    continue;
                }
                const newFeatures = [...new Set([
                        ...subscription.features,
                        ...planConfig.features
                    ])];
                const featuresChanged = newFeatures.length !== subscription.features.length ||
                    !newFeatures.every(feature => subscription.features.includes(feature));
                if (featuresChanged) {
                    subscription.features = newFeatures;
                    await subscription.save();
                    updatedCount++;
                    logger_1.default.info(`✅ Updated subscription for workspace ${subscription.workspaceId}`, {
                        tier: subscription.tier,
                        addedFeatures: newFeatures.filter(f => !subscription.features.includes(f)),
                        totalFeatures: newFeatures.length
                    });
                }
                else {
                    logger_1.default.info(`⏭️  Subscription for workspace ${subscription.workspaceId} already up to date`);
                }
            }
            catch (error) {
                logger_1.default.error(`❌ Failed to update subscription ${subscription._id}:`, error);
            }
        }
        logger_1.default.info(`\n📊 Summary:`);
        logger_1.default.info(`- Total subscriptions checked: ${subscriptions.length}`);
        logger_1.default.info(`- Subscriptions updated: ${updatedCount}`);
        logger_1.default.info(`- Subscriptions already up to date: ${subscriptions.length - updatedCount}`);
        if (updatedCount > 0) {
            logger_1.default.info('\n🎉 Subscription features have been successfully updated!');
            logger_1.default.info('\nThe following diagnostic features are now available:');
            logger_1.default.info('- ai_diagnostics: AI-powered diagnostic analysis');
            logger_1.default.info('- clinical_decision_support: Clinical decision support workflows');
            logger_1.default.info('- drug_information: Drug interaction checking and information');
        }
        else {
            logger_1.default.info('\n✅ All subscriptions were already up to date!');
        }
    }
    catch (error) {
        logger_1.default.error('❌ Failed to update subscription features:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        logger_1.default.info('Database connection closed');
    }
}
if (require.main === module) {
    updateSubscriptionFeatures()
        .then(() => {
        logger_1.default.info('Script completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Script failed:', error);
        process.exit(1);
    });
}
exports.default = updateSubscriptionFeatures;
//# sourceMappingURL=updateSubscriptionFeatures.js.map