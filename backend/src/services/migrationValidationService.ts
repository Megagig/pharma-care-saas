import mongoose from 'mongoose';
import User from '../models/User';
import Workplace from '../models/Workplace';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import logger from '../utils/logger';

export interface ValidationResult {
   isValid: boolean;
   score: number; // 0-100 validation score
   issues: ValidationIssue[];
   warnings: ValidationWarning[];
   stats: ValidationStats;
   recommendations: string[];
}

export interface ValidationIssue {
   type: 'critical' | 'error' | 'warning';
   category: string;
   description: string;
   count: number;
   affectedIds: string[];
   fixSuggestion?: string;
}

export interface ValidationWarning {
   type: string;
   description: string;
   count: number;
   impact: 'low' | 'medium' | 'high';
}

export interface ValidationStats {
   totalUsers: number;
   usersWithWorkspace: number;
   usersWithoutWorkspace: number;
   totalWorkspaces: number;
   workspacesWithSubscription: number;
   workspacesWithoutSubscription: number;
   totalSubscriptions: number;
   workspaceSubscriptions: number;
   userSubscriptions: number;
   orphanedRecords: number;
   dataConsistencyScore: number;
}

/**
 * Comprehensive migration validation service
 */
export class MigrationValidationService {
   /**
    * Run complete validation suite
    */
   async runCompleteValidation(): Promise<ValidationResult> {
      logger.info('Starting complete migration validation...');

      try {
         const issues: ValidationIssue[] = [];
         const warnings: ValidationWarning[] = [];
         const recommendations: string[] = [];

         // Collect basic statistics
         const stats = await this.collectValidationStats();

         // Run all validation checks
         const orphanedChecks = await this.checkOrphanedRecords();
         const consistencyChecks = await this.checkDataConsistency();
         const integrityChecks = await this.checkReferentialIntegrity();
         const subscriptionChecks = await this.checkSubscriptionMigration();
         const workspaceChecks = await this.checkWorkspaceIntegrity();
         const userChecks = await this.checkUserMigration();

         // Combine all issues
         issues.push(...orphanedChecks.issues);
         issues.push(...consistencyChecks.issues);
         issues.push(...integrityChecks.issues);
         issues.push(...subscriptionChecks.issues);
         issues.push(...workspaceChecks.issues);
         issues.push(...userChecks.issues);

         // Combine all warnings
         warnings.push(...orphanedChecks.warnings);
         warnings.push(...consistencyChecks.warnings);
         warnings.push(...integrityChecks.warnings);
         warnings.push(...subscriptionChecks.warnings);
         warnings.push(...workspaceChecks.warnings);
         warnings.push(...userChecks.warnings);

         // Calculate validation score
         const score = this.calculateValidationScore(issues, warnings, stats);

         // Generate recommendations
         recommendations.push(
            ...this.generateRecommendations(issues, warnings, stats)
         );

         const result: ValidationResult = {
            isValid:
               score >= 90 &&
               issues.filter((i) => i.type === 'critical').length === 0,
            score,
            issues,
            warnings,
            stats,
            recommendations,
         };

         logger.info('Migration validation completed', {
            score,
            issueCount: issues.length,
            warningCount: warnings.length,
            isValid: result.isValid,
         });

         return result;
      } catch (error) {
         logger.error('Migration validation failed', { error });
         throw error;
      }
   }

   /**
    * Collect basic validation statistics
    */
   async collectValidationStats(): Promise<ValidationStats> {
      try {
         const [
            totalUsers,
            usersWithWorkspace,
            totalWorkspaces,
            workspacesWithSubscription,
            totalSubscriptions,
            workspaceSubscriptions,
            userSubscriptions,
         ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ workplaceId: { $exists: true, $ne: null } }),
            Workplace.countDocuments(),
            Workplace.countDocuments({
               currentSubscriptionId: { $exists: true, $ne: null },
            }),
            Subscription.countDocuments(),
            Subscription.countDocuments({
               workspaceId: { $exists: true, $ne: null },
            }),
            Subscription.countDocuments({
               userId: { $exists: true, $ne: null },
            }),
         ]);

         const usersWithoutWorkspace = totalUsers - usersWithWorkspace;
         const workspacesWithoutSubscription =
            totalWorkspaces - workspacesWithSubscription;
         const orphanedRecords =
            usersWithoutWorkspace +
            workspacesWithoutSubscription +
            userSubscriptions;

         // Calculate data consistency score (0-100)
         const consistencyFactors = [
            usersWithWorkspace / Math.max(totalUsers, 1), // Users with workspace
            workspacesWithSubscription / Math.max(totalWorkspaces, 1), // Workspaces with subscription
            workspaceSubscriptions / Math.max(totalSubscriptions, 1), // Workspace-based subscriptions
            1 -
               orphanedRecords /
                  Math.max(
                     totalUsers + totalWorkspaces + totalSubscriptions,
                     1
                  ), // Low orphaned records
         ];

         const dataConsistencyScore = Math.round(
            (consistencyFactors.reduce((sum, factor) => sum + factor, 0) /
               consistencyFactors.length) *
               100
         );

         return {
            totalUsers,
            usersWithWorkspace,
            usersWithoutWorkspace,
            totalWorkspaces,
            workspacesWithSubscription,
            workspacesWithoutSubscription,
            totalSubscriptions,
            workspaceSubscriptions,
            userSubscriptions,
            orphanedRecords,
            dataConsistencyScore,
         };
      } catch (error) {
         logger.error('Failed to collect validation stats', { error });
         throw error;
      }
   }

   /**
    * Check for orphaned records
    */
   async checkOrphanedRecords(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check for users without workspaces
         const usersWithoutWorkspace = await User.find({
            $or: [{ workplaceId: { $exists: false } }, { workplaceId: null }],
         })
            .select('_id email')
            .lean();

         if (usersWithoutWorkspace.length > 0) {
            issues.push({
               type: 'error',
               category: 'orphaned_users',
               description: 'Users without workspace associations',
               count: usersWithoutWorkspace.length,
               affectedIds: usersWithoutWorkspace.map((u) => u._id.toString()),
               fixSuggestion: 'Run user-to-workspace migration script',
            });
         }

         // Check for old user-based subscriptions
         const userSubscriptions = await Subscription.find({
            userId: { $exists: true, $ne: null },
         })
            .select('_id userId')
            .lean();

         if (userSubscriptions.length > 0) {
            issues.push({
               type: 'error',
               category: 'legacy_subscriptions',
               description: 'Old user-based subscriptions still exist',
               count: userSubscriptions.length,
               affectedIds: userSubscriptions.map((s) => s._id.toString()),
               fixSuggestion:
                  'Migrate user subscriptions to workspace subscriptions',
            });
         }

         // Check for workspaces without owners
         const workspacesWithoutOwners = await Workplace.find({
            $or: [{ ownerId: { $exists: false } }, { ownerId: null }],
         })
            .select('_id name')
            .lean();

         if (workspacesWithoutOwners.length > 0) {
            issues.push({
               type: 'critical',
               category: 'invalid_workspaces',
               description: 'Workspaces without valid owners',
               count: workspacesWithoutOwners.length,
               affectedIds: workspacesWithoutOwners.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion:
                  'Assign valid owners to workspaces or remove invalid workspaces',
            });
         }

         // Check for subscriptions without valid references
         const orphanedSubscriptions = await Subscription.aggregate([
            {
               $lookup: {
                  from: 'workplaces',
                  localField: 'workspaceId',
                  foreignField: '_id',
                  as: 'workspace',
               },
            },
            {
               $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user',
               },
            },
            {
               $match: {
                  $and: [{ workspace: { $size: 0 } }, { user: { $size: 0 } }],
               },
            },
            {
               $project: { _id: 1 },
            },
         ]);

         if (orphanedSubscriptions.length > 0) {
            issues.push({
               type: 'critical',
               category: 'orphaned_subscriptions',
               description:
                  'Subscriptions with no valid user or workspace reference',
               count: orphanedSubscriptions.length,
               affectedIds: orphanedSubscriptions.map((s) => s._id.toString()),
               fixSuggestion: 'Remove orphaned subscriptions or fix references',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('Orphaned records check failed', { error });
         throw error;
      }
   }

   /**
    * Check data consistency between models
    */
   async checkDataConsistency(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check users with invalid workspace references
         const usersWithInvalidWorkspace = await User.aggregate([
            {
               $match: {
                  workplaceId: { $exists: true, $ne: null },
               },
            },
            {
               $lookup: {
                  from: 'workplaces',
                  localField: 'workplaceId',
                  foreignField: '_id',
                  as: 'workplace',
               },
            },
            {
               $match: {
                  workplace: { $size: 0 },
               },
            },
            {
               $project: { _id: 1, email: 1, workplaceId: 1 },
            },
         ]);

         if (usersWithInvalidWorkspace.length > 0) {
            issues.push({
               type: 'error',
               category: 'invalid_workspace_refs',
               description: 'Users referencing non-existent workspaces',
               count: usersWithInvalidWorkspace.length,
               affectedIds: usersWithInvalidWorkspace.map((u) =>
                  u._id.toString()
               ),
               fixSuggestion:
                  'Remove invalid workspace references or create missing workspaces',
            });
         }

         // Check workspaces with invalid subscription references
         const workspacesWithInvalidSubscriptions = await Workplace.aggregate([
            {
               $match: {
                  currentSubscriptionId: { $exists: true, $ne: null },
               },
            },
            {
               $lookup: {
                  from: 'subscriptions',
                  localField: 'currentSubscriptionId',
                  foreignField: '_id',
                  as: 'subscription',
               },
            },
            {
               $match: {
                  subscription: { $size: 0 },
               },
            },
            {
               $project: { _id: 1, name: 1, currentSubscriptionId: 1 },
            },
         ]);

         if (workspacesWithInvalidSubscriptions.length > 0) {
            issues.push({
               type: 'error',
               category: 'invalid_subscription_refs',
               description: 'Workspaces referencing non-existent subscriptions',
               count: workspacesWithInvalidSubscriptions.length,
               affectedIds: workspacesWithInvalidSubscriptions.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion:
                  'Remove invalid subscription references or create missing subscriptions',
            });
         }

         // Check for subscription/workspace mismatches
         const subscriptionWorkspaceMismatches = await Subscription.aggregate([
            {
               $match: {
                  workspaceId: { $exists: true, $ne: null },
               },
            },
            {
               $lookup: {
                  from: 'workplaces',
                  localField: 'workspaceId',
                  foreignField: '_id',
                  as: 'workspace',
               },
            },
            {
               $match: {
                  $or: [
                     { workspace: { $size: 0 } },
                     {
                        $expr: {
                           $ne: [
                              '$_id',
                              {
                                 $arrayElemAt: [
                                    '$workspace.currentSubscriptionId',
                                    0,
                                 ],
                              },
                           ],
                        },
                     },
                  ],
               },
            },
            {
               $project: { _id: 1, workspaceId: 1 },
            },
         ]);

         if (subscriptionWorkspaceMismatches.length > 0) {
            issues.push({
               type: 'error',
               category: 'subscription_workspace_mismatch',
               description:
                  'Subscription and workspace references are inconsistent',
               count: subscriptionWorkspaceMismatches.length,
               affectedIds: subscriptionWorkspaceMismatches.map((s) =>
                  s._id.toString()
               ),
               fixSuggestion:
                  'Fix bidirectional references between subscriptions and workspaces',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('Data consistency check failed', { error });
         throw error;
      }
   }

   /**
    * Check referential integrity
    */
   async checkReferentialIntegrity(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check for invalid plan references in subscriptions
         const subscriptionsWithInvalidPlans = await Subscription.aggregate([
            {
               $lookup: {
                  from: 'subscriptionplans',
                  localField: 'planId',
                  foreignField: '_id',
                  as: 'plan',
               },
            },
            {
               $match: {
                  plan: { $size: 0 },
               },
            },
            {
               $project: { _id: 1, planId: 1 },
            },
         ]);

         if (subscriptionsWithInvalidPlans.length > 0) {
            issues.push({
               type: 'error',
               category: 'invalid_plan_refs',
               description: 'Subscriptions referencing non-existent plans',
               count: subscriptionsWithInvalidPlans.length,
               affectedIds: subscriptionsWithInvalidPlans.map((s) =>
                  s._id.toString()
               ),
               fixSuggestion:
                  'Create missing subscription plans or fix plan references',
            });
         }

         // Check for invalid owner references in workspaces
         const workspacesWithInvalidOwners = await Workplace.aggregate([
            {
               $lookup: {
                  from: 'users',
                  localField: 'ownerId',
                  foreignField: '_id',
                  as: 'owner',
               },
            },
            {
               $match: {
                  owner: { $size: 0 },
               },
            },
            {
               $project: { _id: 1, name: 1, ownerId: 1 },
            },
         ]);

         if (workspacesWithInvalidOwners.length > 0) {
            issues.push({
               type: 'critical',
               category: 'invalid_owner_refs',
               description: 'Workspaces referencing non-existent owners',
               count: workspacesWithInvalidOwners.length,
               affectedIds: workspacesWithInvalidOwners.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion: 'Assign valid owners to workspaces',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('Referential integrity check failed', { error });
         throw error;
      }
   }

   /**
    * Check subscription migration completeness
    */
   async checkSubscriptionMigration(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check for users with old subscription references
         const usersWithOldSubscriptions = await User.find({
            currentSubscriptionId: { $exists: true, $ne: null },
         })
            .select('_id email currentSubscriptionId')
            .lean();

         if (usersWithOldSubscriptions.length > 0) {
            warnings.push({
               type: 'legacy_user_subscriptions',
               description: 'Users still have old subscription references',
               count: usersWithOldSubscriptions.length,
               impact: 'medium',
            });
         }

         // Check for workspaces without subscriptions
         const workspacesWithoutSubscriptions = await Workplace.find({
            $or: [
               { currentSubscriptionId: { $exists: false } },
               { currentSubscriptionId: null },
            ],
         })
            .select('_id name ownerId')
            .lean();

         if (workspacesWithoutSubscriptions.length > 0) {
            issues.push({
               type: 'warning',
               category: 'workspaces_without_subscriptions',
               description: 'Workspaces without subscription assignments',
               count: workspacesWithoutSubscriptions.length,
               affectedIds: workspacesWithoutSubscriptions.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion:
                  'Assign trial subscriptions to workspaces without subscriptions',
            });
         }

         // Check subscription status consistency
         const inconsistentSubscriptionStatus = await Workplace.aggregate([
            {
               $lookup: {
                  from: 'subscriptions',
                  localField: 'currentSubscriptionId',
                  foreignField: '_id',
                  as: 'subscription',
               },
            },
            {
               $match: {
                  $and: [
                     { subscription: { $size: 1 } },
                     {
                        $expr: {
                           $ne: [
                              '$subscriptionStatus',
                              { $arrayElemAt: ['$subscription.status', 0] },
                           ],
                        },
                     },
                  ],
               },
            },
            {
               $project: {
                  _id: 1,
                  name: 1,
                  subscriptionStatus: 1,
                  'subscription.status': 1,
               },
            },
         ]);

         if (inconsistentSubscriptionStatus.length > 0) {
            issues.push({
               type: 'warning',
               category: 'inconsistent_subscription_status',
               description:
                  'Workspace subscription status does not match subscription record',
               count: inconsistentSubscriptionStatus.length,
               affectedIds: inconsistentSubscriptionStatus.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion:
                  'Synchronize subscription status between workspace and subscription records',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('Subscription migration check failed', { error });
         throw error;
      }
   }

   /**
    * Check workspace integrity
    */
   async checkWorkspaceIntegrity(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check for workspaces with missing required fields
         const workspacesWithMissingFields = await Workplace.find({
            $or: [
               { stats: { $exists: false } },
               { settings: { $exists: false } },
               { locations: { $exists: false } },
               { locations: { $size: 0 } },
            ],
         })
            .select('_id name')
            .lean();

         if (workspacesWithMissingFields.length > 0) {
            issues.push({
               type: 'warning',
               category: 'incomplete_workspace_migration',
               description:
                  'Workspaces missing new required fields (stats, settings, locations)',
               count: workspacesWithMissingFields.length,
               affectedIds: workspacesWithMissingFields.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion: 'Run workspace field initialization script',
            });
         }

         // Check for workspaces with invalid team member references
         const workspacesWithInvalidTeamMembers = await Workplace.aggregate([
            {
               $unwind: '$teamMembers',
            },
            {
               $lookup: {
                  from: 'users',
                  localField: 'teamMembers',
                  foreignField: '_id',
                  as: 'member',
               },
            },
            {
               $match: {
                  member: { $size: 0 },
               },
            },
            {
               $group: {
                  _id: '$_id',
                  name: { $first: '$name' },
                  invalidMembers: { $push: '$teamMembers' },
               },
            },
         ]);

         if (workspacesWithInvalidTeamMembers.length > 0) {
            issues.push({
               type: 'error',
               category: 'invalid_team_members',
               description: 'Workspaces with invalid team member references',
               count: workspacesWithInvalidTeamMembers.length,
               affectedIds: workspacesWithInvalidTeamMembers.map((w) =>
                  w._id.toString()
               ),
               fixSuggestion: 'Remove invalid team member references',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('Workspace integrity check failed', { error });
         throw error;
      }
   }

   /**
    * Check user migration completeness
    */
   async checkUserMigration(): Promise<{
      issues: ValidationIssue[];
      warnings: ValidationWarning[];
   }> {
      const issues: ValidationIssue[] = [];
      const warnings: ValidationWarning[] = [];

      try {
         // Check for users with missing workplace roles
         const usersWithoutWorkplaceRole = await User.find({
            workplaceId: { $exists: true, $ne: null },
            $or: [
               { workplaceRole: { $exists: false } },
               { workplaceRole: null },
            ],
         })
            .select('_id email workplaceId')
            .lean();

         if (usersWithoutWorkplaceRole.length > 0) {
            issues.push({
               type: 'warning',
               category: 'missing_workplace_roles',
               description:
                  'Users with workspace but no workplace role assigned',
               count: usersWithoutWorkplaceRole.length,
               affectedIds: usersWithoutWorkplaceRole.map((u) =>
                  u._id.toString()
               ),
               fixSuggestion: 'Assign appropriate workplace roles to users',
            });
         }

         // Check for users not in their workspace team members list
         const usersNotInTeamMembers = await User.aggregate([
            {
               $match: {
                  workplaceId: { $exists: true, $ne: null },
               },
            },
            {
               $lookup: {
                  from: 'workplaces',
                  localField: 'workplaceId',
                  foreignField: '_id',
                  as: 'workplace',
               },
            },
            {
               $match: {
                  $and: [
                     { workplace: { $size: 1 } },
                     {
                        $expr: {
                           $not: {
                              $in: [
                                 '$_id',
                                 {
                                    $arrayElemAt: ['$workplace.teamMembers', 0],
                                 },
                              ],
                           },
                        },
                     },
                  ],
               },
            },
            {
               $project: { _id: 1, email: 1, workplaceId: 1 },
            },
         ]);

         if (usersNotInTeamMembers.length > 0) {
            issues.push({
               type: 'error',
               category: 'team_member_sync_issue',
               description:
                  'Users associated with workspace but not in team members list',
               count: usersNotInTeamMembers.length,
               affectedIds: usersNotInTeamMembers.map((u) => u._id.toString()),
               fixSuggestion:
                  'Synchronize workspace team members with user workspace associations',
            });
         }

         return { issues, warnings };
      } catch (error) {
         logger.error('User migration check failed', { error });
         throw error;
      }
   }

   /**
    * Calculate overall validation score
    */
   private calculateValidationScore(
      issues: ValidationIssue[],
      warnings: ValidationWarning[],
      stats: ValidationStats
   ): number {
      let score = 100;

      // Deduct points for issues
      issues.forEach((issue) => {
         switch (issue.type) {
            case 'critical':
               score -= 20;
               break;
            case 'error':
               score -= 10;
               break;
            case 'warning':
               score -= 5;
               break;
         }
      });

      // Deduct points for warnings
      warnings.forEach((warning) => {
         switch (warning.impact) {
            case 'high':
               score -= 5;
               break;
            case 'medium':
               score -= 3;
               break;
            case 'low':
               score -= 1;
               break;
         }
      });

      // Factor in data consistency score
      score = (score + stats.dataConsistencyScore) / 2;

      return Math.max(0, Math.round(score));
   }

   /**
    * Generate recommendations based on validation results
    */
   private generateRecommendations(
      issues: ValidationIssue[],
      warnings: ValidationWarning[],
      stats: ValidationStats
   ): string[] {
      const recommendations: string[] = [];

      // Critical issues
      const criticalIssues = issues.filter((i) => i.type === 'critical');
      if (criticalIssues.length > 0) {
         recommendations.push(
            '🚨 Address critical issues immediately before proceeding with production deployment'
         );
      }

      // Migration completeness
      if (stats.usersWithoutWorkspace > 0) {
         recommendations.push(
            `📋 Complete user migration: ${stats.usersWithoutWorkspace} users need workspace assignment`
         );
      }

      if (stats.userSubscriptions > 0) {
         recommendations.push(
            `🔄 Complete subscription migration: ${stats.userSubscriptions} user-based subscriptions need migration`
         );
      }

      // Data consistency
      if (stats.dataConsistencyScore < 90) {
         recommendations.push(
            '🔧 Improve data consistency by fixing referential integrity issues'
         );
      }

      // Performance recommendations
      if (stats.totalUsers > 1000) {
         recommendations.push(
            '⚡ Consider running migration in batches for better performance'
         );
      }

      // Monitoring recommendations
      recommendations.push(
         '📊 Set up monitoring for migration progress and data integrity'
      );
      recommendations.push(
         '🔍 Schedule regular validation checks after migration completion'
      );

      return recommendations;
   }
}

export default MigrationValidationService;
