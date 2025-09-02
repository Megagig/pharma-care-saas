"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToWorkspaceSubscriptions = migrateToWorkspaceSubscriptions;
exports.rollbackWorkspaceMigration = rollbackWorkspaceMigration;
exports.validateMigration = validateMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const db_1 = __importDefault(require("../config/db"));
const logger_1 = __importDefault(require("../utils/logger"));
async function migrateToWorkspaceSubscriptions() {
    const stats = {
        usersWithoutWorkspace: 0,
        usersWithSubscriptions: 0,
        workspacesCreated: 0,
        subscriptionsMigrated: 0,
        usersUpdated: 0,
        errors: [],
    };
    try {
        logger_1.default.info('Starting workspace subscription migration...');
        const usersWithoutWorkspace = await User_1.default.find({
            $or: [
                { workplaceId: { $exists: false } },
                { workplaceId: null }
            ]
        });
        stats.usersWithoutWorkspace = usersWithoutWorkspace.length;
        logger_1.default.info(`Found ${stats.usersWithoutWorkspace} users without workspace associations`);
        for (const user of usersWithoutWorkspace) {
            try {
                const workspace = new Workplace_1.default({
                    name: `${user.firstName} ${user.lastName}'s Pharmacy`,
                    type: 'Community',
                    licenseNumber: user.licenseNumber || 'TEMP-' + user._id.toString().slice(-6),
                    email: user.email,
                    address: '',
                    state: '',
                    ownerId: user._id,
                    verificationStatus: user.licenseStatus === 'approved' ? 'verified' : 'unverified',
                    teamMembers: [user._id],
                });
                await workspace.save();
                stats.workspacesCreated++;
                user.workplaceId = workspace._id;
                user.workplaceRole = 'Owner';
                await user.save();
                stats.usersUpdated++;
                logger_1.default.info(`Created workspace for user ${user.email}: ${workspace._id}`);
                if (user.currentSubscriptionId) {
                    const userSubscription = await Subscription_1.default.findById(user.currentSubscriptionId);
                    if (userSubscription) {
                        const workspaceSubscription = new Subscription_1.default({
                            workspaceId: workspace._id,
                            planId: userSubscription.planId,
                            status: userSubscription.status,
                            tier: userSubscription.tier,
                            startDate: userSubscription.startDate,
                            endDate: userSubscription.endDate,
                            trialEndDate: userSubscription.trialEndDate,
                            priceAtPurchase: userSubscription.priceAtPurchase,
                            billingInterval: 'monthly',
                            paymentHistory: userSubscription.paymentHistory,
                            autoRenew: userSubscription.autoRenew,
                            gracePeriodEnd: userSubscription.gracePeriodEnd,
                            stripeSubscriptionId: userSubscription.stripeSubscriptionId,
                            stripeCustomerId: userSubscription.stripeCustomerId,
                            webhookEvents: userSubscription.webhookEvents,
                            renewalAttempts: userSubscription.renewalAttempts,
                            features: userSubscription.features,
                            customFeatures: userSubscription.customFeatures,
                            limits: {
                                patients: null,
                                users: null,
                                locations: 1,
                                storage: null,
                                apiCalls: null,
                            },
                            usageMetrics: userSubscription.usageMetrics,
                            scheduledDowngrade: userSubscription.scheduledDowngrade,
                        });
                        await workspaceSubscription.save();
                        stats.subscriptionsMigrated++;
                        workspace.currentSubscriptionId = workspaceSubscription._id;
                        workspace.currentPlanId = userSubscription.planId;
                        workspace.subscriptionStatus = mapSubscriptionStatus(userSubscription.status);
                        if (userSubscription.trialEndDate) {
                            workspace.trialEndDate = userSubscription.trialEndDate;
                        }
                        await workspace.save();
                        user.currentSubscriptionId = undefined;
                        await user.save();
                        logger_1.default.info(`Migrated subscription for user ${user.email}: ${userSubscription._id} -> ${workspaceSubscription._id}`);
                    }
                }
            }
            catch (error) {
                const errorMsg = `Error migrating user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger_1.default.error(errorMsg, { error, userId: user._id });
                stats.errors.push(errorMsg);
            }
        }
        const existingWorkspaces = await Workplace_1.default.find({
            $or: [
                { subscriptionStatus: { $exists: false } },
                { stats: { $exists: false } },
                { settings: { $exists: false } },
                { locations: { $exists: false } }
            ]
        });
        for (const workspace of existingWorkspaces) {
            try {
                let updated = false;
                if (!workspace.subscriptionStatus) {
                    workspace.subscriptionStatus = 'trial';
                    updated = true;
                }
                if (!workspace.stats) {
                    workspace.stats = {
                        patientsCount: 0,
                        usersCount: workspace.teamMembers?.length || 1,
                        lastUpdated: new Date(),
                    };
                    updated = true;
                }
                if (!workspace.settings) {
                    workspace.settings = {
                        maxPendingInvites: 20,
                        allowSharedPatients: false,
                    };
                    updated = true;
                }
                if (!workspace.locations || workspace.locations.length === 0) {
                    workspace.locations = [
                        {
                            id: 'primary',
                            name: workspace.name,
                            address: workspace.address || 'Main Location',
                            isPrimary: true,
                            metadata: {},
                        },
                    ];
                    updated = true;
                }
                if (updated) {
                    await workspace.save();
                    logger_1.default.info(`Updated existing workspace: ${workspace._id}`);
                }
            }
            catch (error) {
                const errorMsg = `Error updating existing workspace ${workspace._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger_1.default.error(errorMsg, { error, workspaceId: workspace._id });
                stats.errors.push(errorMsg);
            }
        }
        logger_1.default.info('Migration completed successfully!');
        logger_1.default.info('Migration Statistics:', {
            usersWithoutWorkspace: stats.usersWithoutWorkspace,
            workspacesCreated: stats.workspacesCreated,
            subscriptionsMigrated: stats.subscriptionsMigrated,
            usersUpdated: stats.usersUpdated,
            errors: stats.errors.length,
        });
        return {
            success: stats.errors.length === 0,
            workspacesCreated: stats.workspacesCreated,
            subscriptionsMigrated: stats.subscriptionsMigrated,
            usersUpdated: stats.usersUpdated,
            errors: stats.errors,
        };
    }
    catch (error) {
        logger_1.default.error('Migration failed:', error);
        return {
            success: false,
            workspacesCreated: stats.workspacesCreated,
            subscriptionsMigrated: stats.subscriptionsMigrated,
            usersUpdated: stats.usersUpdated,
            errors: [...stats.errors, error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}
function mapSubscriptionStatus(oldStatus) {
    switch (oldStatus) {
        case 'trial':
            return 'trial';
        case 'active':
            return 'active';
        case 'grace_period':
        case 'inactive':
            return 'past_due';
        case 'expired':
            return 'expired';
        case 'cancelled':
        case 'suspended':
            return 'canceled';
        default:
            return 'trial';
    }
}
async function rollbackWorkspaceMigration() {
    const stats = {
        usersWithoutWorkspace: 0,
        usersWithSubscriptions: 0,
        workspacesCreated: 0,
        subscriptionsMigrated: 0,
        usersUpdated: 0,
        errors: [],
    };
    try {
        logger_1.default.info('Starting migration rollback...');
        const workspaceSubscriptions = await Subscription_1.default.find({
            workspaceId: { $exists: true }
        });
        for (const subscription of workspaceSubscriptions) {
            try {
                const workspace = await Workplace_1.default.findById(subscription.workspaceId);
                if (!workspace)
                    continue;
                const owner = await User_1.default.findById(workspace.ownerId);
                if (!owner)
                    continue;
                const userSubscription = new Subscription_1.default({
                    userId: owner._id,
                    planId: subscription.planId,
                    status: subscription.status,
                    tier: subscription.tier,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    priceAtPurchase: subscription.priceAtPurchase,
                    paymentHistory: subscription.paymentHistory,
                    autoRenew: subscription.autoRenew,
                    trialEnd: subscription.trialEndDate,
                    gracePeriodEnd: subscription.gracePeriodEnd,
                    stripeSubscriptionId: subscription.stripeSubscriptionId,
                    stripeCustomerId: subscription.stripeCustomerId,
                    webhookEvents: subscription.webhookEvents,
                    renewalAttempts: subscription.renewalAttempts,
                    features: subscription.features,
                    customFeatures: subscription.customFeatures,
                    usageMetrics: subscription.usageMetrics,
                    scheduledDowngrade: subscription.scheduledDowngrade,
                });
                await userSubscription.save();
                owner.currentSubscriptionId = userSubscription._id;
                await owner.save();
                await Subscription_1.default.findByIdAndDelete(subscription._id);
                stats.subscriptionsMigrated++;
                logger_1.default.info(`Rolled back subscription for workspace ${workspace._id}`);
            }
            catch (error) {
                const errorMsg = `Error rolling back subscription ${subscription._id}: ${error.message}`;
                logger_1.default.error(errorMsg, { error, subscriptionId: subscription._id });
                stats.errors.push(errorMsg);
            }
        }
        logger_1.default.info('Rollback completed!');
        return {
            success: stats.errors.length === 0,
            workspacesCreated: 0,
            subscriptionsMigrated: stats.subscriptionsMigrated,
            usersUpdated: 0,
            errors: stats.errors,
        };
    }
    catch (error) {
        logger_1.default.error('Rollback failed:', error);
        return {
            success: false,
            workspacesCreated: 0,
            subscriptionsMigrated: 0,
            usersUpdated: 0,
            errors: [...stats.errors, error.message],
        };
    }
}
async function validateMigration() {
    const issues = [];
    try {
        const totalUsers = await User_1.default.countDocuments();
        const usersWithWorkspace = await User_1.default.countDocuments({
            workplaceId: { $exists: true, $ne: null }
        });
        const workspacesWithSubscription = await Workplace_1.default.countDocuments({
            currentSubscriptionId: { $exists: true, $ne: null }
        });
        const orphanedSubscriptions = await Subscription_1.default.countDocuments({
            userId: { $exists: true }
        });
        if (usersWithWorkspace < totalUsers) {
            issues.push(`${totalUsers - usersWithWorkspace} users still don't have workspace associations`);
        }
        if (orphanedSubscriptions > 0) {
            issues.push(`${orphanedSubscriptions} old user subscriptions still exist`);
        }
        const invalidSubscriptions = await Subscription_1.default.countDocuments({
            workspaceId: { $exists: false }
        });
        if (invalidSubscriptions > 0) {
            issues.push(`${invalidSubscriptions} subscriptions don't have workspaceId`);
        }
        return {
            valid: issues.length === 0,
            issues,
            stats: {
                totalUsers,
                usersWithWorkspace,
                workspacesWithSubscription,
                orphanedSubscriptions,
            },
        };
    }
    catch (error) {
        return {
            valid: false,
            issues: [`Validation failed: ${error.message}`],
            stats: {
                totalUsers: 0,
                usersWithWorkspace: 0,
                workspacesWithSubscription: 0,
                orphanedSubscriptions: 0,
            },
        };
    }
}
if (require.main === module) {
    const command = process.argv[2];
    (0, db_1.default)().then(async () => {
        try {
            switch (command) {
                case 'migrate':
                    await migrateToWorkspaceSubscriptions();
                    break;
                case 'rollback':
                    await rollbackWorkspaceMigration();
                    break;
                case 'validate':
                    const validation = await validateMigration();
                    logger_1.default.info('Validation Result:', validation);
                    break;
                default:
                    logger_1.default.info('Usage: npm run migrate:workspace [migrate|rollback|validate]');
            }
        }
        catch (error) {
            logger_1.default.error('Script execution failed:', error);
        }
        finally {
            await mongoose_1.default.connection.close();
            process.exit(0);
        }
    });
}
//# sourceMappingURL=migrateToWorkspaceSubscriptions.js.map