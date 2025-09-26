"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationValidationService = void 0;
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const logger_1 = __importDefault(require("../utils/logger"));
class MigrationValidationService {
    async runCompleteValidation() {
        logger_1.default.info('Starting complete migration validation...');
        try {
            const issues = [];
            const warnings = [];
            const recommendations = [];
            const stats = await this.collectValidationStats();
            const orphanedChecks = await this.checkOrphanedRecords();
            const consistencyChecks = await this.checkDataConsistency();
            const integrityChecks = await this.checkReferentialIntegrity();
            const subscriptionChecks = await this.checkSubscriptionMigration();
            const workspaceChecks = await this.checkWorkspaceIntegrity();
            const userChecks = await this.checkUserMigration();
            issues.push(...orphanedChecks.issues);
            issues.push(...consistencyChecks.issues);
            issues.push(...integrityChecks.issues);
            issues.push(...subscriptionChecks.issues);
            issues.push(...workspaceChecks.issues);
            issues.push(...userChecks.issues);
            warnings.push(...orphanedChecks.warnings);
            warnings.push(...consistencyChecks.warnings);
            warnings.push(...integrityChecks.warnings);
            warnings.push(...subscriptionChecks.warnings);
            warnings.push(...workspaceChecks.warnings);
            warnings.push(...userChecks.warnings);
            const score = this.calculateValidationScore(issues, warnings, stats);
            recommendations.push(...this.generateRecommendations(issues, warnings, stats));
            const result = {
                isValid: score >= 90 && issues.filter(i => i.type === 'critical').length === 0,
                score,
                issues,
                warnings,
                stats,
                recommendations,
            };
            logger_1.default.info('Migration validation completed', {
                score,
                issueCount: issues.length,
                warningCount: warnings.length,
                isValid: result.isValid,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Migration validation failed', { error });
            throw error;
        }
    }
    async collectValidationStats() {
        try {
            const [totalUsers, usersWithWorkspace, totalWorkspaces, workspacesWithSubscription, totalSubscriptions, workspaceSubscriptions, userSubscriptions,] = await Promise.all([
                User_1.default.countDocuments(),
                User_1.default.countDocuments({ workplaceId: { $exists: true, $ne: null } }),
                Workplace_1.default.countDocuments(),
                Workplace_1.default.countDocuments({ currentSubscriptionId: { $exists: true, $ne: null } }),
                Subscription_1.default.countDocuments(),
                Subscription_1.default.countDocuments({ workspaceId: { $exists: true, $ne: null } }),
                Subscription_1.default.countDocuments({ userId: { $exists: true, $ne: null } }),
            ]);
            const usersWithoutWorkspace = totalUsers - usersWithWorkspace;
            const workspacesWithoutSubscription = totalWorkspaces - workspacesWithSubscription;
            const orphanedRecords = usersWithoutWorkspace + workspacesWithoutSubscription + userSubscriptions;
            const consistencyFactors = [
                usersWithWorkspace / Math.max(totalUsers, 1),
                workspacesWithSubscription / Math.max(totalWorkspaces, 1),
                workspaceSubscriptions / Math.max(totalSubscriptions, 1),
                1 - (orphanedRecords / Math.max(totalUsers + totalWorkspaces + totalSubscriptions, 1)),
            ];
            const dataConsistencyScore = Math.round(consistencyFactors.reduce((sum, factor) => sum + factor, 0) / consistencyFactors.length * 100);
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
        }
        catch (error) {
            logger_1.default.error('Failed to collect validation stats', { error });
            throw error;
        }
    }
    async checkOrphanedRecords() {
        const issues = [];
        const warnings = [];
        try {
            const usersWithoutWorkspace = await User_1.default.find({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            }).select('_id email').lean();
            if (usersWithoutWorkspace.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'orphaned_users',
                    description: 'Users without workspace associations',
                    count: usersWithoutWorkspace.length,
                    affectedIds: usersWithoutWorkspace.map(u => u._id.toString()),
                    fixSuggestion: 'Run user-to-workspace migration script',
                });
            }
            const userSubscriptions = await Subscription_1.default.find({
                userId: { $exists: true, $ne: null }
            }).select('_id userId').lean();
            if (userSubscriptions.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'legacy_subscriptions',
                    description: 'Old user-based subscriptions still exist',
                    count: userSubscriptions.length,
                    affectedIds: userSubscriptions.map(s => s._id.toString()),
                    fixSuggestion: 'Migrate user subscriptions to workspace subscriptions',
                });
            }
            const workspacesWithoutOwners = await Workplace_1.default.find({
                $or: [
                    { ownerId: { $exists: false } },
                    { ownerId: null }
                ]
            }).select('_id name').lean();
            if (workspacesWithoutOwners.length > 0) {
                issues.push({
                    type: 'critical',
                    category: 'invalid_workspaces',
                    description: 'Workspaces without valid owners',
                    count: workspacesWithoutOwners.length,
                    affectedIds: workspacesWithoutOwners.map(w => w._id.toString()),
                    fixSuggestion: 'Assign valid owners to workspaces or remove invalid workspaces',
                });
            }
            const orphanedSubscriptions = await Subscription_1.default.aggregate([
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workspaceId',
                        foreignField: '_id',
                        as: 'workspace'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $match: {
                        $and: [
                            { workspace: { $size: 0 } },
                            { user: { $size: 0 } }
                        ]
                    }
                },
                {
                    $project: { _id: 1 }
                }
            ]);
            if (orphanedSubscriptions.length > 0) {
                issues.push({
                    type: 'critical',
                    category: 'orphaned_subscriptions',
                    description: 'Subscriptions with no valid user or workspace reference',
                    count: orphanedSubscriptions.length,
                    affectedIds: orphanedSubscriptions.map(s => s._id.toString()),
                    fixSuggestion: 'Remove orphaned subscriptions or fix references',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('Orphaned records check failed', { error });
            throw error;
        }
    }
    async checkDataConsistency() {
        const issues = [];
        const warnings = [];
        try {
            const usersWithInvalidWorkspace = await User_1.default.aggregate([
                {
                    $match: {
                        workplaceId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workplaceId',
                        foreignField: '_id',
                        as: 'workplace'
                    }
                },
                {
                    $match: {
                        workplace: { $size: 0 }
                    }
                },
                {
                    $project: { _id: 1, email: 1, workplaceId: 1 }
                }
            ]);
            if (usersWithInvalidWorkspace.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'invalid_workspace_refs',
                    description: 'Users referencing non-existent workspaces',
                    count: usersWithInvalidWorkspace.length,
                    affectedIds: usersWithInvalidWorkspace.map(u => u._id.toString()),
                    fixSuggestion: 'Remove invalid workspace references or create missing workspaces',
                });
            }
            const workspacesWithInvalidSubscriptions = await Workplace_1.default.aggregate([
                {
                    $match: {
                        currentSubscriptionId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'currentSubscriptionId',
                        foreignField: '_id',
                        as: 'subscription'
                    }
                },
                {
                    $match: {
                        subscription: { $size: 0 }
                    }
                },
                {
                    $project: { _id: 1, name: 1, currentSubscriptionId: 1 }
                }
            ]);
            if (workspacesWithInvalidSubscriptions.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'invalid_subscription_refs',
                    description: 'Workspaces referencing non-existent subscriptions',
                    count: workspacesWithInvalidSubscriptions.length,
                    affectedIds: workspacesWithInvalidSubscriptions.map(w => w._id.toString()),
                    fixSuggestion: 'Remove invalid subscription references or create missing subscriptions',
                });
            }
            const subscriptionWorkspaceMismatches = await Subscription_1.default.aggregate([
                {
                    $match: {
                        workspaceId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workspaceId',
                        foreignField: '_id',
                        as: 'workspace'
                    }
                },
                {
                    $match: {
                        $or: [
                            { workspace: { $size: 0 } },
                            { $expr: { $ne: ['$_id', { $arrayElemAt: ['$workspace.currentSubscriptionId', 0] }] } }
                        ]
                    }
                },
                {
                    $project: { _id: 1, workspaceId: 1 }
                }
            ]);
            if (subscriptionWorkspaceMismatches.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'subscription_workspace_mismatch',
                    description: 'Subscription and workspace references are inconsistent',
                    count: subscriptionWorkspaceMismatches.length,
                    affectedIds: subscriptionWorkspaceMismatches.map(s => s._id.toString()),
                    fixSuggestion: 'Fix bidirectional references between subscriptions and workspaces',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('Data consistency check failed', { error });
            throw error;
        }
    }
    async checkReferentialIntegrity() {
        const issues = [];
        const warnings = [];
        try {
            const subscriptionsWithInvalidPlans = await Subscription_1.default.aggregate([
                {
                    $lookup: {
                        from: 'subscriptionplans',
                        localField: 'planId',
                        foreignField: '_id',
                        as: 'plan'
                    }
                },
                {
                    $match: {
                        plan: { $size: 0 }
                    }
                },
                {
                    $project: { _id: 1, planId: 1 }
                }
            ]);
            if (subscriptionsWithInvalidPlans.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'invalid_plan_refs',
                    description: 'Subscriptions referencing non-existent plans',
                    count: subscriptionsWithInvalidPlans.length,
                    affectedIds: subscriptionsWithInvalidPlans.map(s => s._id.toString()),
                    fixSuggestion: 'Create missing subscription plans or fix plan references',
                });
            }
            const workspacesWithInvalidOwners = await Workplace_1.default.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ownerId',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                {
                    $match: {
                        owner: { $size: 0 }
                    }
                },
                {
                    $project: { _id: 1, name: 1, ownerId: 1 }
                }
            ]);
            if (workspacesWithInvalidOwners.length > 0) {
                issues.push({
                    type: 'critical',
                    category: 'invalid_owner_refs',
                    description: 'Workspaces referencing non-existent owners',
                    count: workspacesWithInvalidOwners.length,
                    affectedIds: workspacesWithInvalidOwners.map(w => w._id.toString()),
                    fixSuggestion: 'Assign valid owners to workspaces',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('Referential integrity check failed', { error });
            throw error;
        }
    }
    async checkSubscriptionMigration() {
        const issues = [];
        const warnings = [];
        try {
            const usersWithOldSubscriptions = await User_1.default.find({
                currentSubscriptionId: { $exists: true, $ne: null }
            }).select('_id email currentSubscriptionId').lean();
            if (usersWithOldSubscriptions.length > 0) {
                warnings.push({
                    type: 'legacy_user_subscriptions',
                    description: 'Users still have old subscription references',
                    count: usersWithOldSubscriptions.length,
                    impact: 'medium',
                });
            }
            const workspacesWithoutSubscriptions = await Workplace_1.default.find({
                $or: [
                    { currentSubscriptionId: { $exists: false } },
                    { currentSubscriptionId: null }
                ]
            }).select('_id name ownerId').lean();
            if (workspacesWithoutSubscriptions.length > 0) {
                issues.push({
                    type: 'warning',
                    category: 'workspaces_without_subscriptions',
                    description: 'Workspaces without subscription assignments',
                    count: workspacesWithoutSubscriptions.length,
                    affectedIds: workspacesWithoutSubscriptions.map(w => w._id.toString()),
                    fixSuggestion: 'Assign trial subscriptions to workspaces without subscriptions',
                });
            }
            const inconsistentSubscriptionStatus = await Workplace_1.default.aggregate([
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'currentSubscriptionId',
                        foreignField: '_id',
                        as: 'subscription'
                    }
                },
                {
                    $match: {
                        $and: [
                            { subscription: { $size: 1 } },
                            { $expr: { $ne: ['$subscriptionStatus', { $arrayElemAt: ['$subscription.status', 0] }] } }
                        ]
                    }
                },
                {
                    $project: { _id: 1, name: 1, subscriptionStatus: 1, 'subscription.status': 1 }
                }
            ]);
            if (inconsistentSubscriptionStatus.length > 0) {
                issues.push({
                    type: 'warning',
                    category: 'inconsistent_subscription_status',
                    description: 'Workspace subscription status does not match subscription record',
                    count: inconsistentSubscriptionStatus.length,
                    affectedIds: inconsistentSubscriptionStatus.map(w => w._id.toString()),
                    fixSuggestion: 'Synchronize subscription status between workspace and subscription records',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('Subscription migration check failed', { error });
            throw error;
        }
    }
    async checkWorkspaceIntegrity() {
        const issues = [];
        const warnings = [];
        try {
            const workspacesWithMissingFields = await Workplace_1.default.find({
                $or: [
                    { stats: { $exists: false } },
                    { settings: { $exists: false } },
                    { locations: { $exists: false } },
                    { locations: { $size: 0 } }
                ]
            }).select('_id name').lean();
            if (workspacesWithMissingFields.length > 0) {
                issues.push({
                    type: 'warning',
                    category: 'incomplete_workspace_migration',
                    description: 'Workspaces missing new required fields (stats, settings, locations)',
                    count: workspacesWithMissingFields.length,
                    affectedIds: workspacesWithMissingFields.map(w => w._id.toString()),
                    fixSuggestion: 'Run workspace field initialization script',
                });
            }
            const workspacesWithInvalidTeamMembers = await Workplace_1.default.aggregate([
                {
                    $unwind: '$teamMembers'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'teamMembers',
                        foreignField: '_id',
                        as: 'member'
                    }
                },
                {
                    $match: {
                        member: { $size: 0 }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        invalidMembers: { $push: '$teamMembers' }
                    }
                }
            ]);
            if (workspacesWithInvalidTeamMembers.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'invalid_team_members',
                    description: 'Workspaces with invalid team member references',
                    count: workspacesWithInvalidTeamMembers.length,
                    affectedIds: workspacesWithInvalidTeamMembers.map(w => w._id.toString()),
                    fixSuggestion: 'Remove invalid team member references',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('Workspace integrity check failed', { error });
            throw error;
        }
    }
    async checkUserMigration() {
        const issues = [];
        const warnings = [];
        try {
            const usersWithoutWorkplaceRole = await User_1.default.find({
                workplaceId: { $exists: true, $ne: null },
                $or: [
                    { workplaceRole: { $exists: false } },
                    { workplaceRole: null }
                ]
            }).select('_id email workplaceId').lean();
            if (usersWithoutWorkplaceRole.length > 0) {
                issues.push({
                    type: 'warning',
                    category: 'missing_workplace_roles',
                    description: 'Users with workspace but no workplace role assigned',
                    count: usersWithoutWorkplaceRole.length,
                    affectedIds: usersWithoutWorkplaceRole.map(u => u._id.toString()),
                    fixSuggestion: 'Assign appropriate workplace roles to users',
                });
            }
            const usersNotInTeamMembers = await User_1.default.aggregate([
                {
                    $match: {
                        workplaceId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workplaceId',
                        foreignField: '_id',
                        as: 'workplace'
                    }
                },
                {
                    $match: {
                        $and: [
                            { workplace: { $size: 1 } },
                            { $expr: { $not: { $in: ['$_id', { $arrayElemAt: ['$workplace.teamMembers', 0] }] } } }
                        ]
                    }
                },
                {
                    $project: { _id: 1, email: 1, workplaceId: 1 }
                }
            ]);
            if (usersNotInTeamMembers.length > 0) {
                issues.push({
                    type: 'error',
                    category: 'team_member_sync_issue',
                    description: 'Users associated with workspace but not in team members list',
                    count: usersNotInTeamMembers.length,
                    affectedIds: usersNotInTeamMembers.map(u => u._id.toString()),
                    fixSuggestion: 'Synchronize workspace team members with user workspace associations',
                });
            }
            return { issues, warnings };
        }
        catch (error) {
            logger_1.default.error('User migration check failed', { error });
            throw error;
        }
    }
    calculateValidationScore(issues, warnings, stats) {
        let score = 100;
        issues.forEach(issue => {
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
        warnings.forEach(warning => {
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
        score = (score + stats.dataConsistencyScore) / 2;
        return Math.max(0, Math.round(score));
    }
    generateRecommendations(issues, warnings, stats) {
        const recommendations = [];
        const criticalIssues = issues.filter(i => i.type === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push('🚨 Address critical issues immediately before proceeding with production deployment');
        }
        if (stats.usersWithoutWorkspace > 0) {
            recommendations.push(`📋 Complete user migration: ${stats.usersWithoutWorkspace} users need workspace assignment`);
        }
        if (stats.userSubscriptions > 0) {
            recommendations.push(`🔄 Complete subscription migration: ${stats.userSubscriptions} user-based subscriptions need migration`);
        }
        if (stats.dataConsistencyScore < 90) {
            recommendations.push('🔧 Improve data consistency by fixing referential integrity issues');
        }
        if (stats.totalUsers > 1000) {
            recommendations.push('⚡ Consider running migration in batches for better performance');
        }
        recommendations.push('📊 Set up monitoring for migration progress and data integrity');
        recommendations.push('🔍 Schedule regular validation checks after migration completion');
        return recommendations;
    }
}
exports.MigrationValidationService = MigrationValidationService;
exports.default = MigrationValidationService;
//# sourceMappingURL=migrationValidationService.js.map