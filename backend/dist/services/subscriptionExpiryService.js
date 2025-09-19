"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionExpiryService = exports.SubscriptionExpiryService = void 0;
const Subscription_1 = __importDefault(require("../models/Subscription"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../utils/emailService");
const logger_1 = __importDefault(require("../utils/logger"));
class SubscriptionExpiryService {
    async checkExpiredTrials() {
        try {
            const now = new Date();
            const expiredTrials = await Subscription_1.default.find({
                status: 'trial',
                trialEndDate: { $lt: now },
            }).populate('workspaceId');
            logger_1.default.info(`Found ${expiredTrials.length} expired trials to process`);
            for (const subscription of expiredTrials) {
                try {
                    await this.expireTrialSubscription(subscription);
                    logger_1.default.info(`Expired trial subscription ${subscription._id} for workspace ${subscription.workspaceId}`);
                }
                catch (error) {
                    logger_1.default.error(`Error expiring trial subscription ${subscription._id}:`, error);
                }
            }
            await this.sendTrialExpiryWarnings();
        }
        catch (error) {
            logger_1.default.error('Error checking expired trials:', error);
        }
    }
    async checkExpiredSubscriptions() {
        try {
            const now = new Date();
            const expiredSubscriptions = await Subscription_1.default.find({
                status: 'active',
                endDate: { $lt: now },
            }).populate('workspaceId');
            logger_1.default.info(`Found ${expiredSubscriptions.length} expired subscriptions to process`);
            for (const subscription of expiredSubscriptions) {
                try {
                    await this.handleExpiredSubscription(subscription);
                    logger_1.default.info(`Handled expired subscription ${subscription._id} for workspace ${subscription.workspaceId}`);
                }
                catch (error) {
                    logger_1.default.error(`Error handling expired subscription ${subscription._id}:`, error);
                }
            }
            await this.checkGracePeriodExpiry();
            await this.sendSubscriptionExpiryWarnings();
        }
        catch (error) {
            logger_1.default.error('Error checking expired subscriptions:', error);
        }
    }
    async checkGracePeriodExpiry() {
        try {
            const now = new Date();
            const expiredGracePeriods = await Subscription_1.default.find({
                status: 'past_due',
                gracePeriodEnd: { $lt: now },
            }).populate('workspaceId');
            logger_1.default.info(`Found ${expiredGracePeriods.length} expired grace periods to process`);
            for (const subscription of expiredGracePeriods) {
                try {
                    await this.expireSubscriptionAfterGracePeriod(subscription);
                    logger_1.default.info(`Expired subscription ${subscription._id} after grace period for workspace ${subscription.workspaceId}`);
                }
                catch (error) {
                    logger_1.default.error(`Error expiring subscription after grace period ${subscription._id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error checking grace period expiry:', error);
        }
    }
    async processScheduledDowngrades() {
        try {
            const now = new Date();
            const subscriptionsToDowngrade = await Subscription_1.default.find({
                status: 'active',
                'scheduledDowngrade.effectiveDate': { $lte: now },
            }).populate('scheduledDowngrade.planId').populate('workspaceId');
            logger_1.default.info(`Found ${subscriptionsToDowngrade.length} scheduled downgrades to process`);
            for (const subscription of subscriptionsToDowngrade) {
                try {
                    await this.applyScheduledDowngrade(subscription);
                    logger_1.default.info(`Applied scheduled downgrade for subscription ${subscription._id}`);
                }
                catch (error) {
                    logger_1.default.error(`Error applying scheduled downgrade for subscription ${subscription._id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error processing scheduled downgrades:', error);
        }
    }
    async sendTrialExpiryWarnings() {
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const trialsSoonToExpire = await Subscription_1.default.find({
                status: 'trial',
                trialEndDate: {
                    $gte: new Date(),
                    $lte: threeDaysFromNow,
                },
            }).populate('workspaceId');
            for (const subscription of trialsSoonToExpire) {
                try {
                    const workspace = subscription.workspaceId;
                    const owner = await User_1.default.findById(workspace.ownerId);
                    if (owner) {
                        const daysRemaining = Math.ceil((subscription.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        await emailService_1.emailService.sendTrialExpiryWarning(owner.email, {
                            firstName: owner.firstName,
                            workspaceName: workspace.name,
                            trialStartDate: subscription.startDate,
                            trialEndDate: subscription.trialEndDate,
                            daysLeft: daysRemaining,
                        });
                        logger_1.default.info(`Sent trial expiry warning to ${owner.email} for workspace ${workspace.name}`);
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error sending trial expiry warning for subscription ${subscription._id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error sending trial expiry warnings:', error);
        }
    }
    async sendSubscriptionExpiryWarnings() {
        try {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const subscriptionsSoonToExpire = await Subscription_1.default.find({
                status: 'active',
                endDate: {
                    $gte: new Date(),
                    $lte: sevenDaysFromNow,
                },
            }).populate('workspaceId');
            for (const subscription of subscriptionsSoonToExpire) {
                try {
                    const workspace = subscription.workspaceId;
                    const owner = await User_1.default.findById(workspace.ownerId);
                    if (owner) {
                        const daysRemaining = Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        await emailService_1.emailService.sendSubscriptionExpiryWarning(owner.email, {
                            firstName: owner.firstName,
                            workspaceName: workspace.name,
                            daysRemaining,
                            endDate: subscription.endDate,
                        });
                        logger_1.default.info(`Sent subscription expiry warning to ${owner.email} for workspace ${workspace.name}`);
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error sending subscription expiry warning for subscription ${subscription._id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error sending subscription expiry warnings:', error);
        }
    }
    async expireTrialSubscription(subscription) {
        const workspace = subscription.workspaceId;
        subscription.status = 'expired';
        await subscription.save();
        workspace.subscriptionStatus = 'expired';
        await workspace.save();
        const owner = await User_1.default.findById(workspace.ownerId);
        if (owner) {
            await emailService_1.emailService.sendTrialExpired(owner.email, {
                firstName: owner.firstName,
                workspaceName: workspace.name,
                trialEndDate: subscription.trialEndDate,
            });
        }
    }
    async handleExpiredSubscription(subscription) {
        const workspace = subscription.workspaceId;
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        subscription.status = 'past_due';
        subscription.gracePeriodEnd = gracePeriodEnd;
        await subscription.save();
        workspace.subscriptionStatus = 'past_due';
        await workspace.save();
        const owner = await User_1.default.findById(workspace.ownerId);
        if (owner) {
            await emailService_1.emailService.sendSubscriptionPastDue(owner.email, {
                firstName: owner.firstName,
                workspaceName: workspace.name,
                gracePeriodEnd,
            });
        }
    }
    async expireSubscriptionAfterGracePeriod(subscription) {
        const workspace = subscription.workspaceId;
        subscription.status = 'expired';
        await subscription.save();
        workspace.subscriptionStatus = 'expired';
        await workspace.save();
        const owner = await User_1.default.findById(workspace.ownerId);
        if (owner) {
            await emailService_1.emailService.sendSubscriptionExpired(owner.email, {
                firstName: owner.firstName,
                workspaceName: workspace.name,
            });
        }
    }
    async applyScheduledDowngrade(subscription) {
        const workspace = subscription.workspaceId;
        const newPlan = subscription.scheduledDowngrade.planId;
        subscription.planId = newPlan._id;
        subscription.tier = newPlan.tier;
        subscription.priceAtPurchase = newPlan.priceNGN;
        subscription.features = Object.keys(newPlan.features).filter(key => newPlan.features[key] === true);
        subscription.limits = {
            patients: newPlan.features.patientLimit,
            users: newPlan.features.teamSize,
            locations: newPlan.features.multiLocationDashboard ? null : 1,
            storage: null,
            apiCalls: newPlan.features.apiAccess ? null : 0,
        };
        subscription.scheduledDowngrade = undefined;
        await subscription.save();
        workspace.currentPlanId = newPlan._id;
        await workspace.save();
        const owner = await User_1.default.findById(workspace.ownerId);
        if (owner) {
            await emailService_1.emailService.sendSubscriptionDowngradeApplied(owner.email, {
                firstName: owner.firstName,
                workspaceName: workspace.name,
                newPlanName: newPlan.name,
                effectiveDate: new Date(),
            });
        }
    }
    async runExpiryChecks() {
        logger_1.default.info('Starting subscription expiry checks...');
        await this.checkExpiredTrials();
        await this.checkExpiredSubscriptions();
        await this.processScheduledDowngrades();
        logger_1.default.info('Completed subscription expiry checks');
    }
}
exports.SubscriptionExpiryService = SubscriptionExpiryService;
exports.subscriptionExpiryService = new SubscriptionExpiryService();
//# sourceMappingURL=subscriptionExpiryService.js.map