#!/usr/bin/env ts-node

/**
 * Migration Integrity Validation Script
 * Validates data integrity after workspace subscription migration
 */

import mongoose from 'mongoose';
import Workplace from '../models/Workplace';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import User from '../models/User';

interface ValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    summary: {
        totalWorkspaces: number;
        workspacesWithSubscriptions: number;
        orphanedSubscriptions: number;
        invalidSubscriptionReferences: number;
        usersWithInvalidWorkspaces: number;
    };
}

class MigrationIntegrityValidator {
    private errors: string[] = [];
    private warnings: string[] = [];

    async validateIntegrity(): Promise<ValidationResult> {
        console.log('🔍 Starting migration integrity validation...');

        try {
            // Connect to database
            if (!mongoose.connection.readyState) {
                await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-test');
            }

            // Run validation checks
            const workspaceValidation = await this.validateWorkspaceSubscriptions();
            const subscriptionValidation = await this.validateSubscriptionReferences();
            const userValidation = await this.validateUserWorkspaceReferences();
            const planValidation = await this.validateSubscriptionPlans();

            const summary = {
                totalWorkspaces: workspaceValidation.total,
                workspacesWithSubscriptions: workspaceValidation.withSubscriptions,
                orphanedSubscriptions: subscriptionValidation.orphaned,
                invalidSubscriptionReferences: subscriptionValidation.invalid,
                usersWithInvalidWorkspaces: userValidation.invalid
            };

            const passed = this.errors.length === 0;

            if (passed) {
                console.log('✅ Data integrity validation passed');
                console.log('✅ All workspaces have valid subscriptions');
                console.log('✅ All subscriptions have valid plans');
                console.log('✅ All users are properly associated');
            } else {
                console.log('❌ Data integrity validation failed');
                this.errors.forEach(error => console.error(`   - ${error}`));
            }

            if (this.warnings.length > 0) {
                console.log('⚠️  Warnings:');
                this.warnings.forEach(warning => console.warn(`   - ${warning}`));
            }

            return {
                passed,
                errors: this.errors,
                warnings: this.warnings,
                summary
            };

        } catch (error) {
            this.errors.push(`Validation failed: ${(error as Error).message}`);
            return {
                passed: false,
                errors: this.errors,
                warnings: this.warnings,
                summary: {
                    totalWorkspaces: 0,
                    workspacesWithSubscriptions: 0,
                    orphanedSubscriptions: 0,
                    invalidSubscriptionReferences: 0,
                    usersWithInvalidWorkspaces: 0
                }
            };
        }
    }

    private async validateWorkspaceSubscriptions() {
        const workspaces = await Workplace.find({});
        const total = workspaces.length;
        let withSubscriptions = 0;

        for (const workspace of workspaces) {
            if (workspace.currentSubscriptionId) {
                withSubscriptions++;

                // Check if subscription exists
                const subscription = await Subscription.findById(workspace.currentSubscriptionId);
                if (!subscription) {
                    this.errors.push(`Workspace ${workspace._id} references non-existent subscription ${workspace.currentSubscriptionId}`);
                } else if (subscription.workspaceId.toString() !== workspace._id.toString()) {
                    this.errors.push(`Workspace ${workspace._id} subscription ${subscription._id} has mismatched workspaceId`);
                }
            } else {
                this.errors.push(`Workspace ${workspace._id} (${workspace.name}) has no subscription`);
            }
        }

        return { total, withSubscriptions };
    }

    private async validateSubscriptionReferences() {
        const subscriptions = await Subscription.find({});
        let orphaned = 0;
        let invalid = 0;

        for (const subscription of subscriptions) {
            // Check if workspace exists
            const workspace = await Workplace.findById(subscription.workspaceId);
            if (!workspace) {
                this.errors.push(`Subscription ${subscription._id} references non-existent workspace ${subscription.workspaceId}`);
                orphaned++;
            }

            // Check if plan exists
            const plan = await SubscriptionPlan.findById(subscription.planId);
            if (!plan) {
                this.errors.push(`Subscription ${subscription._id} references non-existent plan ${subscription.planId}`);
                invalid++;
            }
        }

        return { orphaned, invalid };
    }

    private async validateUserWorkspaceReferences() {
        const users = await User.find({});
        let invalid = 0;

        for (const user of users) {
            if (user.workplaceId) {
                const workspace = await Workplace.findById(user.workplaceId);
                if (!workspace) {
                    this.errors.push(`User ${user._id} (${user.email}) references non-existent workspace ${user.workplaceId}`);
                    invalid++;
                } else {
                    // Check if user is in workspace team members
                    const isTeamMember = workspace.teamMembers.some(memberId =>
                        memberId.toString() === user._id.toString()
                    );
                    if (!isTeamMember) {
                        this.warnings.push(`User ${user._id} (${user.email}) is not in workspace ${workspace._id} team members`);
                    }
                }
            }
        }

        return { invalid };
    }

    private async validateSubscriptionPlans() {
        const plans = await SubscriptionPlan.find({});

        for (const plan of plans) {
            if (!plan.isActive) {
                this.warnings.push(`Plan ${plan._id} (${plan.name}) is inactive but may be referenced by subscriptions`);
            }
        }

        return { total: plans.length };
    }
}

// Main execution
async function main() {
    try {
        const validator = new MigrationIntegrityValidator();
        const result = await validator.validateIntegrity();

        if (!result.passed) {
            console.log('❌ Data integrity validation failed');
            console.log('Invalid subscription references found');
            console.log('Orphaned subscriptions found');
            process.exit(1);
        }

        console.log('✅ Migration integrity validation completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export default MigrationIntegrityValidator;