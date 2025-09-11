import mongoose from 'mongoose';
import User from '../models/User';
import Workplace from '../models/Workplace';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import connectDB from '../config/db';
import logger from '../utils/logger';

interface MigrationResult {
   success: boolean;
   workspacesCreated: number;
   subscriptionsMigrated: number;
   usersUpdated: number;
   errors: string[];
}

interface MigrationStats {
   usersWithoutWorkspace: number;
   usersWithSubscriptions: number;
   workspacesCreated: number;
   subscriptionsMigrated: number;
   usersUpdated: number;
   errors: string[];
}

/**
 * Migration script to transition from user-level to workspace-level subscriptions
 *
 * This script:
 * 1. Identifies users without workspace associations
 * 2. Creates workspaces for users who don't have one
 * 3. Migrates user subscriptions to workspace subscriptions
 * 4. Updates user records to reference their workspace
 * 5. Adds new fields to existing workspace documents
 */
export async function migrateToWorkspaceSubscriptions(): Promise<MigrationResult> {
   const stats: MigrationStats = {
      usersWithoutWorkspace: 0,
      usersWithSubscriptions: 0,
      workspacesCreated: 0,
      subscriptionsMigrated: 0,
      usersUpdated: 0,
      errors: [],
   };

   try {
      logger.info('Starting workspace subscription migration...');

      // Step 1: Find users without workspace associations
      const usersWithoutWorkspace = await User.find({
         $or: [{ workplaceId: { $exists: false } }, { workplaceId: null }],
      });

      stats.usersWithoutWorkspace = usersWithoutWorkspace.length;
      logger.info(
         `Found ${stats.usersWithoutWorkspace} users without workspace associations`
      );

      // Step 2: Create workspaces for users without them
      for (const user of usersWithoutWorkspace) {
         try {
            // Create workspace for user
            const workspace = new Workplace({
               name: `${user.firstName} ${user.lastName}'s Pharmacy`,
               type: 'Community', // Default type
               licenseNumber:
                  user.licenseNumber || 'TEMP-' + user._id.toString().slice(-6),
               email: user.email,
               address: '',
               state: '',
               ownerId: user._id,
               verificationStatus:
                  user.licenseStatus === 'approved' ? 'verified' : 'unverified',
               teamMembers: [user._id],
               // New fields will be initialized by pre-save hook
            });

            await workspace.save();
            stats.workspacesCreated++;

            // Update user to reference workspace
            user.workplaceId = workspace._id;
            user.workplaceRole = 'Owner';
            await user.save();
            stats.usersUpdated++;

            logger.info(
               `Created workspace for user ${user.email}: ${workspace._id}`
            );

            // Step 3: Migrate user subscription to workspace subscription if exists
            if (user.currentSubscriptionId) {
               const userSubscription = await Subscription.findById(
                  user.currentSubscriptionId
               );
               if (userSubscription) {
                  // Create new workspace subscription
                  const workspaceSubscription = new Subscription({
                     workspaceId: workspace._id,
                     planId: userSubscription.planId,
                     status: userSubscription.status,
                     tier: userSubscription.tier,
                     startDate: userSubscription.startDate,
                     endDate: userSubscription.endDate,
                     trialEndDate: userSubscription.trialEndDate,
                     priceAtPurchase: userSubscription.priceAtPurchase,
                     billingInterval: 'monthly', // Default
                     paymentHistory: userSubscription.paymentHistory,
                     autoRenew: userSubscription.autoRenew,
                     gracePeriodEnd: userSubscription.gracePeriodEnd,
                     stripeSubscriptionId:
                        userSubscription.stripeSubscriptionId,
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

                  // Update workspace with subscription info
                  workspace.currentSubscriptionId = workspaceSubscription._id;
                  workspace.currentPlanId = userSubscription.planId;
                  workspace.subscriptionStatus = mapSubscriptionStatus(
                     userSubscription.status
                  );
                  if (userSubscription.trialEndDate) {
                     workspace.trialEndDate = userSubscription.trialEndDate;
                  }
                  await workspace.save();

                  // Remove old user subscription reference
                  user.currentSubscriptionId = undefined;
                  await user.save();

                  logger.info(
                     `Migrated subscription for user ${user.email}: ${userSubscription._id} -> ${workspaceSubscription._id}`
                  );
               }
            }
         } catch (error) {
            const errorMsg = `Error migrating user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMsg, { error, userId: user._id });
            stats.errors.push(errorMsg);
         }
      }

      // Step 4: Add new fields to existing workspaces that don't have them
      const existingWorkspaces = await Workplace.find({
         $or: [
            { subscriptionStatus: { $exists: false } },
            { stats: { $exists: false } },
            { settings: { $exists: false } },
            { locations: { $exists: false } },
         ],
      });

      for (const workspace of existingWorkspaces) {
         try {
            let updated = false;

            // Add subscription status if missing
            if (!workspace.subscriptionStatus) {
               workspace.subscriptionStatus = 'trial';
               updated = true;
            }

            // Add stats if missing
            if (!workspace.stats) {
               workspace.stats = {
                  patientsCount: 0,
                  usersCount: workspace.teamMembers?.length || 1,
                  lastUpdated: new Date(),
               };
               updated = true;
            }

            // Add settings if missing
            if (!workspace.settings) {
               workspace.settings = {
                  maxPendingInvites: 20,
                  allowSharedPatients: false,
               };
               updated = true;
            }

            // Add locations if missing
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
               logger.info(`Updated existing workspace: ${workspace._id}`);
            }
         } catch (error) {
            const errorMsg = `Error updating existing workspace ${workspace._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMsg, { error, workspaceId: workspace._id });
            stats.errors.push(errorMsg);
         }
      }

      logger.info('Migration completed successfully!');
      logger.info('Migration Statistics:', {
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
   } catch (error) {
      logger.error('Migration failed:', error);
      return {
         success: false,
         workspacesCreated: stats.workspacesCreated,
         subscriptionsMigrated: stats.subscriptionsMigrated,
         usersUpdated: stats.usersUpdated,
         errors: [
            ...stats.errors,
            error instanceof Error ? error.message : 'Unknown error',
         ],
      };
   }
}

/**
 * Maps old subscription status to new workspace subscription status
 */
function mapSubscriptionStatus(
   oldStatus: string
): 'trial' | 'active' | 'past_due' | 'expired' | 'canceled' {
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

/**
 * Rollback function to undo the migration
 */
export async function rollbackWorkspaceMigration(): Promise<MigrationResult> {
   const stats: MigrationStats = {
      usersWithoutWorkspace: 0,
      usersWithSubscriptions: 0,
      workspacesCreated: 0,
      subscriptionsMigrated: 0,
      usersUpdated: 0,
      errors: [],
   };

   try {
      logger.info('Starting migration rollback...');

      // Find all workspace subscriptions
      const workspaceSubscriptions = await Subscription.find({
         workspaceId: { $exists: true },
      });

      for (const subscription of workspaceSubscriptions) {
         try {
            // Find the workspace
            const workspace = await Workplace.findById(
               subscription.workspaceId
            );
            if (!workspace) continue;

            // Find the workspace owner
            const owner = await User.findById(workspace.ownerId);
            if (!owner) continue;

            // Create user subscription
            const userSubscription = new Subscription({
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

            // Update user with subscription reference
            owner.currentSubscriptionId = userSubscription._id;
            await owner.save();

            // Remove workspace subscription
            await Subscription.findByIdAndDelete(subscription._id);

            stats.subscriptionsMigrated++;
            logger.info(
               `Rolled back subscription for workspace ${workspace._id}`
            );
         } catch (error) {
            const errorMsg = `Error rolling back subscription ${subscription._id}: ${(error as Error).message}`;
            logger.error(errorMsg, { error, subscriptionId: subscription._id });
            stats.errors.push(errorMsg);
         }
      }

      logger.info('Rollback completed!');
      return {
         success: stats.errors.length === 0,
         workspacesCreated: 0,
         subscriptionsMigrated: stats.subscriptionsMigrated,
         usersUpdated: 0,
         errors: stats.errors,
      };
   } catch (error) {
      logger.error('Rollback failed:', error);
      return {
         success: false,
         workspacesCreated: 0,
         subscriptionsMigrated: 0,
         usersUpdated: 0,
         errors: [...stats.errors, (error as Error).message],
      };
   }
}

/**
 * Validation function to check migration success
 */
export async function validateMigration(): Promise<{
   valid: boolean;
   issues: string[];
   stats: {
      totalUsers: number;
      usersWithWorkspace: number;
      workspacesWithSubscription: number;
      orphanedSubscriptions: number;
   };
}> {
   const issues: string[] = [];

   try {
      // Count total users
      const totalUsers = await User.countDocuments();

      // Count users with workspace
      const usersWithWorkspace = await User.countDocuments({
         workplaceId: { $exists: true, $ne: null },
      });

      // Count workspaces with subscriptions
      const workspacesWithSubscription = await Workplace.countDocuments({
         currentSubscriptionId: { $exists: true, $ne: null },
      });

      // Count orphaned subscriptions (old user subscriptions)
      const orphanedSubscriptions = await Subscription.countDocuments({
         userId: { $exists: true },
      });

      // Validation checks
      if (usersWithWorkspace < totalUsers) {
         issues.push(
            `${totalUsers - usersWithWorkspace} users still don't have workspace associations`
         );
      }

      if (orphanedSubscriptions > 0) {
         issues.push(
            `${orphanedSubscriptions} old user subscriptions still exist`
         );
      }

      // Check for workspace subscriptions without workspaceId
      const invalidSubscriptions = await Subscription.countDocuments({
         workspaceId: { $exists: false },
      });

      if (invalidSubscriptions > 0) {
         issues.push(
            `${invalidSubscriptions} subscriptions don't have workspaceId`
         );
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
   } catch (error) {
      return {
         valid: false,
         issues: [`Validation failed: ${(error as Error).message}`],
         stats: {
            totalUsers: 0,
            usersWithWorkspace: 0,
            workspacesWithSubscription: 0,
            orphanedSubscriptions: 0,
         },
      };
   }
}

// CLI execution
if (require.main === module) {
   const command = process.argv[2];

   connectDB().then(async () => {
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
               logger.info('Validation Result:', validation);
               break;
            default:
               logger.info(
                  'Usage: npm run migrate:workspace [migrate|rollback|validate]'
               );
         }
      } catch (error) {
         logger.error('Script execution failed:', error);
      } finally {
         await mongoose.connection.close();
         process.exit(0);
      }
   });
}
