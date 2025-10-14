#!/usr/bin/env ts-node
/**
 * Fix subscription planId references
 * 
 * Ensures all subscriptions have valid planId references that match their tier
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixSubscriptionPlanIds() {
    try {
        console.log('🔧 Fixing subscription planId references...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas');
        console.log('✅ Connected to database\n');

        // Get all subscriptions
        const subscriptions = await Subscription.find({});
        console.log(`📊 Found ${subscriptions.length} subscriptions to check\n`);

        // Get all available plans
        const plans = await SubscriptionPlan.find({});
        const plansByTier = new Map();

        plans.forEach(plan => {
            plansByTier.set(plan.tier, plan);
        });

        console.log(`📋 Available plans: ${plans.map(p => `${p.tier} (${p.name})`).join(', ')}\n`);

        let fixed = 0;
        let skipped = 0;
        let errors = 0;

        for (const subscription of subscriptions) {
            try {
                // Check if planId is null or doesn't exist
                if (!subscription.planId) {
                    console.log(`❌ Subscription ${subscription._id} has no planId (tier: ${subscription.tier})`);

                    // Find the matching plan for this tier
                    const matchingPlan = plansByTier.get(subscription.tier);

                    if (matchingPlan) {
                        subscription.planId = matchingPlan._id as any;
                        await subscription.save();
                        console.log(`✅ Fixed: Assigned ${matchingPlan.name} plan to subscription`);
                        fixed++;
                    } else {
                        console.log(`⚠️  No matching plan found for tier: ${subscription.tier}`);
                        errors++;
                    }
                } else {
                    // Verify that the planId exists
                    const plan = await SubscriptionPlan.findById(subscription.planId);

                    if (!plan) {
                        console.log(`❌ Subscription ${subscription._id} has invalid planId reference`);

                        // Try to fix by matching tier
                        const matchingPlan = plansByTier.get(subscription.tier);
                        if (matchingPlan) {
                            subscription.planId = matchingPlan._id as any;
                            await subscription.save();
                            console.log(`✅ Fixed: Reassigned ${matchingPlan.name} plan`);
                            fixed++;
                        } else {
                            console.log(`⚠️  No matching plan found for tier: ${subscription.tier}`);
                            errors++;
                        }
                    } else {
                        // Verify tier matches
                        if (plan.tier !== subscription.tier) {
                            console.log(`⚠️  Subscription tier (${subscription.tier}) doesn't match plan tier (${plan.tier})`);

                            // Fix the mismatch
                            const correctPlan = plansByTier.get(subscription.tier);
                            if (correctPlan) {
                                subscription.planId = correctPlan._id as any;
                                await subscription.save();
                                console.log(`✅ Fixed: Corrected plan to match tier ${subscription.tier}`);
                                fixed++;
                            }
                        } else {
                            console.log(`✅ Subscription ${subscription._id} - OK (${subscription.tier})`);
                            skipped++;
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error processing subscription ${subscription._id}:`, error);
                errors++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total subscriptions: ${subscriptions.length}`);
        console.log(`   Fixed: ${fixed}`);
        console.log(`   Already OK: ${skipped}`);
        console.log(`   Errors: ${errors}\n`);

        // Disconnect
        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// CLI execution
fixSubscriptionPlanIds();
