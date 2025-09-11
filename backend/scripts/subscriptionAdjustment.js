#!/usr/bin/env node

/**
 * Subscription Adjustment Utility
 *
 * This script provides utilities for manual subscription adjustments,
 * billing corrections, and subscription management tasks.
 */

const mongoose = require('mongoose');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// Import models
require('dotenv').config();
require('../dist/models/User');
require('../dist/models/Workplace');
require('../dist/models/Subscription');
require('../dist/models/SubscriptionPlan');
require('../dist/models/Payment');

const User = mongoose.model('User');
const Workplace = mongoose.model('Workplace');
const Subscription = mongoose.model('Subscription');
const SubscriptionPlan = mongoose.model('SubscriptionPlan');
const Payment = mongoose.model('Payment');

// CLI interface
const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout,
});

// Colors for console output
const colors = {
   reset: '\x1b[0m',
   bright: '\x1b[1m',
   red: '\x1b[31m',
   green: '\x1b[32m',
   yellow: '\x1b[33m',
   blue: '\x1b[34m',
   magenta: '\x1b[35m',
   cyan: '\x1b[36m',
};

function colorize(text, color) {
   return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
   console.log(colorize(message, color));
}

function error(message) {
   console.error(colorize(`❌ ${message}`, 'red'));
}

function success(message) {
   console.log(colorize(`✅ ${message}`, 'green'));
}

function warning(message) {
   console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

function info(message) {
   console.log(colorize(`ℹ️  ${message}`, 'blue'));
}

// Database connection
async function connectDB() {
   try {
      await mongoose.connect(
         process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare'
      );
      success('Connected to MongoDB');
   } catch (err) {
      error(`Failed to connect to MongoDB: ${err.message}`);
      process.exit(1);
   }
}

// Utility functions
function question(prompt) {
   return new Promise((resolve) => {
      rl.question(prompt, resolve);
   });
}

function formatDate(date) {
   return new Date(date).toLocaleString();
}

function formatCurrency(amount) {
   return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
   }).format(amount);
}

class SubscriptionAdjustmentUtils {
   /**
    * Extend trial period for a workspace
    */
   async extendTrial(workspaceId, additionalDays, reason) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         if (workspace.subscriptionStatus !== 'trial') {
            error('Workspace is not on trial');
            return false;
         }

         const currentTrialEnd = workspace.trialEndDate || new Date();
         const newTrialEnd = new Date(
            currentTrialEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000
         );

         workspace.trialEndDate = newTrialEnd;
         await workspace.save();

         // Update subscription if exists
         const subscription = await Subscription.findOne({ workspaceId });
         if (subscription && subscription.status === 'trial') {
            subscription.endDate = newTrialEnd;
            await subscription.save();
         }

         success(
            `Extended trial for ${workspace.name} by ${additionalDays} days`
         );
         info(`New trial end date: ${formatDate(newTrialEnd)}`);

         // Log the adjustment
         await this.logAdjustment({
            type: 'trial_extension',
            workspaceId,
            workspaceName: workspace.name,
            additionalDays,
            newEndDate: newTrialEnd,
            reason,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to extend trial: ${err.message}`);
         return false;
      }
   }

   /**
    * Apply subscription credit
    */
   async applyCredit(workspaceId, creditAmount, reason, creditType = 'manual') {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return false;
         }

         // Create credit record
         const creditRecord = {
            workspaceId,
            subscriptionId: subscription._id,
            amount: creditAmount,
            type: creditType,
            reason,
            appliedAt: new Date(),
            appliedBy: 'admin',
         };

         // If subscription has credits field, add to it
         if (!subscription.credits) {
            subscription.credits = [];
         }
         subscription.credits.push(creditRecord);

         // Calculate total credits
         const totalCredits = subscription.credits.reduce(
            (sum, credit) => sum + credit.amount,
            0
         );
         subscription.totalCredits = totalCredits;

         await subscription.save();

         success(
            `Applied ${formatCurrency(creditAmount)} credit to ${workspace.name}`
         );
         info(`Total credits: ${formatCurrency(totalCredits)}`);

         // Log the adjustment
         await this.logAdjustment({
            type: 'credit_applied',
            workspaceId,
            workspaceName: workspace.name,
            creditAmount,
            totalCredits,
            reason,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to apply credit: ${err.message}`);
         return false;
      }
   }

   /**
    * Change subscription plan
    */
   async changePlan(
      workspaceId,
      newPlanId,
      effectiveDate,
      reason,
      prorated = false
   ) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return false;
         }

         const newPlan = await SubscriptionPlan.findById(newPlanId);
         if (!newPlan) {
            error('New plan not found');
            return false;
         }

         const oldPlan = await SubscriptionPlan.findById(subscription.planId);
         const oldPlanName = oldPlan ? oldPlan.name : 'Unknown';

         // Calculate proration if requested
         let proratedAmount = 0;
         if (prorated && oldPlan) {
            const remainingDays = Math.max(
               0,
               Math.ceil(
                  (subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
               )
            );
            const oldDailyRate = oldPlan.priceNGN / 30; // Assuming monthly billing
            const newDailyRate = newPlan.priceNGN / 30;
            proratedAmount = (newDailyRate - oldDailyRate) * remainingDays;
         }

         // Update subscription
         subscription.planId = newPlanId;
         subscription.tier = newPlan.tier;
         subscription.features = newPlan.features;
         subscription.limits = newPlan.limits;
         subscription.priceAtPurchase = newPlan.priceNGN;

         // Add plan change record
         if (!subscription.planChanges) {
            subscription.planChanges = [];
         }
         subscription.planChanges.push({
            fromPlanId: oldPlan?._id,
            toPlanId: newPlanId,
            fromPlanName: oldPlanName,
            toPlanName: newPlan.name,
            effectiveDate: new Date(effectiveDate),
            reason,
            proratedAmount,
            changedBy: 'admin',
            changedAt: new Date(),
         });

         await subscription.save();

         // Update workspace
         workspace.currentPlanId = newPlanId;
         await workspace.save();

         success(
            `Changed plan for ${workspace.name} from ${oldPlanName} to ${newPlan.name}`
         );
         if (prorated && proratedAmount !== 0) {
            info(`Prorated amount: ${formatCurrency(proratedAmount)}`);
         }

         // Log the adjustment
         await this.logAdjustment({
            type: 'plan_change',
            workspaceId,
            workspaceName: workspace.name,
            oldPlan: oldPlanName,
            newPlan: newPlan.name,
            proratedAmount,
            effectiveDate,
            reason,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to change plan: ${err.message}`);
         return false;
      }
   }

   /**
    * Pause subscription
    */
   async pauseSubscription(workspaceId, pauseUntil, reason) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return false;
         }

         // Store original status and end date
         subscription.pausedStatus = {
            originalStatus: subscription.status,
            originalEndDate: subscription.endDate,
            pausedAt: new Date(),
            pauseUntil: new Date(pauseUntil),
            reason,
            pausedBy: 'admin',
         };

         subscription.status = 'paused';
         workspace.subscriptionStatus = 'paused';

         await subscription.save();
         await workspace.save();

         success(
            `Paused subscription for ${workspace.name} until ${formatDate(
               pauseUntil
            )}`
         );

         // Log the adjustment
         await this.logAdjustment({
            type: 'subscription_paused',
            workspaceId,
            workspaceName: workspace.name,
            pauseUntil,
            reason,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to pause subscription: ${err.message}`);
         return false;
      }
   }

   /**
    * Resume paused subscription
    */
   async resumeSubscription(workspaceId, reason) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return false;
         }

         if (subscription.status !== 'paused' || !subscription.pausedStatus) {
            error('Subscription is not paused');
            return false;
         }

         // Calculate extension based on pause duration
         const pauseDuration = new Date() - subscription.pausedStatus.pausedAt;
         const newEndDate = new Date(
            subscription.pausedStatus.originalEndDate.getTime() + pauseDuration
         );

         // Restore original status
         subscription.status = subscription.pausedStatus.originalStatus;
         subscription.endDate = newEndDate;
         workspace.subscriptionStatus =
            subscription.pausedStatus.originalStatus;

         // Add resume record
         subscription.pausedStatus.resumedAt = new Date();
         subscription.pausedStatus.resumeReason = reason;

         await subscription.save();
         await workspace.save();

         success(`Resumed subscription for ${workspace.name}`);
         info(`New end date: ${formatDate(newEndDate)}`);

         // Log the adjustment
         await this.logAdjustment({
            type: 'subscription_resumed',
            workspaceId,
            workspaceName: workspace.name,
            newEndDate,
            reason,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to resume subscription: ${err.message}`);
         return false;
      }
   }

   /**
    * Create manual payment record
    */
   async createManualPayment(
      workspaceId,
      amount,
      paymentMethod,
      reference,
      notes
   ) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return false;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return false;
         }

         // Create payment record
         const payment = new Payment({
            workspaceId,
            subscriptionId: subscription._id,
            amount,
            currency: 'NGN',
            paymentMethod,
            reference,
            status: 'succeeded',
            type: 'manual',
            metadata: {
               notes,
               createdBy: 'admin',
               isManual: true,
            },
            createdAt: new Date(),
            paidAt: new Date(),
         });

         await payment.save();

         // Update subscription if needed
         if (subscription.status === 'past_due') {
            subscription.status = 'active';
            workspace.subscriptionStatus = 'active';

            // Extend subscription by billing period
            const billingDays =
               subscription.billingInterval === 'yearly' ? 365 : 30;
            subscription.endDate = new Date(
               subscription.endDate.getTime() +
                  billingDays * 24 * 60 * 60 * 1000
            );

            await subscription.save();
            await workspace.save();
         }

         success(`Created manual payment record for ${workspace.name}`);
         info(`Amount: ${formatCurrency(amount)}`);
         info(`Reference: ${reference}`);

         // Log the adjustment
         await this.logAdjustment({
            type: 'manual_payment',
            workspaceId,
            workspaceName: workspace.name,
            amount,
            paymentMethod,
            reference,
            notes,
            timestamp: new Date(),
         });

         return true;
      } catch (err) {
         error(`Failed to create manual payment: ${err.message}`);
         return false;
      }
   }

   /**
    * Generate adjustment report
    */
   async generateAdjustmentReport(startDate, endDate) {
      try {
         const adjustments = await this.getAdjustments(startDate, endDate);

         const report = {
            period: {
               start: startDate,
               end: endDate,
            },
            summary: {
               total: adjustments.length,
               byType: {},
            },
            adjustments,
         };

         // Group by type
         adjustments.forEach((adj) => {
            if (!report.summary.byType[adj.type]) {
               report.summary.byType[adj.type] = 0;
            }
            report.summary.byType[adj.type]++;
         });

         // Save report
         const reportPath = path.join(
            __dirname,
            `../reports/adjustment-report-${
               new Date().toISOString().split('T')[0]
            }.json`
         );
         await fs.mkdir(path.dirname(reportPath), { recursive: true });
         await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

         log('\n📊 Adjustment Report:', 'cyan');
         log('─'.repeat(50));
         log(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`);
         log(`Total adjustments: ${adjustments.length}`);
         log('\nBy type:');
         Object.entries(report.summary.byType).forEach(([type, count]) => {
            log(`  ${type}: ${count}`);
         });
         log('─'.repeat(50));
         log(`Report saved to: ${reportPath}`);

         return report;
      } catch (err) {
         error(`Failed to generate adjustment report: ${err.message}`);
         return null;
      }
   }

   /**
    * Get adjustments from log file
    */
   async getAdjustments(startDate, endDate) {
      try {
         const logPath = path.join(
            __dirname,
            '../logs/subscription-adjustments.log'
         );
         const logContent = await fs.readFile(logPath, 'utf8');
         const lines = logContent
            .trim()
            .split('\n')
            .filter((line) => line);

         const adjustments = lines
            .map((line) => {
               try {
                  return JSON.parse(line);
               } catch {
                  return null;
               }
            })
            .filter((adj) => adj && adj.timestamp)
            .filter((adj) => {
               const adjDate = new Date(adj.timestamp);
               return adjDate >= startDate && adjDate <= endDate;
            });

         return adjustments;
      } catch (err) {
         if (err.code === 'ENOENT') {
            return [];
         }
         throw err;
      }
   }

   /**
    * Log adjustment to file
    */
   async logAdjustment(adjustment) {
      try {
         const logPath = path.join(
            __dirname,
            '../logs/subscription-adjustments.log'
         );
         await fs.mkdir(path.dirname(logPath), { recursive: true });
         await fs.appendFile(logPath, JSON.stringify(adjustment) + '\n');
      } catch (err) {
         warning(`Failed to log adjustment: ${err.message}`);
      }
   }
}

// CLI Interface
async function showMenu() {
   log('\n💳 Subscription Adjustment Utilities', 'cyan');
   log('─'.repeat(50));
   log('1. Extend trial period');
   log('2. Apply subscription credit');
   log('3. Change subscription plan');
   log('4. Pause subscription');
   log('5. Resume subscription');
   log('6. Create manual payment record');
   log('7. Generate adjustment report');
   log('0. Exit');
   log('─'.repeat(50));
}

async function main() {
   await connectDB();
   const utils = new SubscriptionAdjustmentUtils();

   while (true) {
      await showMenu();
      const choice = await question('\nSelect an option: ');

      switch (choice) {
         case '1':
            const workspaceId1 = await question('Enter workspace ID: ');
            const days = parseInt(await question('Additional days: '));
            const reason1 = await question('Reason: ');
            await utils.extendTrial(workspaceId1, days, reason1);
            break;

         case '2':
            const workspaceId2 = await question('Enter workspace ID: ');
            const amount = parseFloat(await question('Credit amount (NGN): '));
            const reason2 = await question('Reason: ');
            await utils.applyCredit(workspaceId2, amount, reason2);
            break;

         case '3':
            const workspaceId3 = await question('Enter workspace ID: ');
            const planId = await question('New plan ID: ');
            const effectiveDate = await question(
               'Effective date (YYYY-MM-DD): '
            );
            const reason3 = await question('Reason: ');
            const prorated =
               (await question('Prorate? (y/n): ')).toLowerCase() === 'y';
            await utils.changePlan(
               workspaceId3,
               planId,
               effectiveDate,
               reason3,
               prorated
            );
            break;

         case '4':
            const workspaceId4 = await question('Enter workspace ID: ');
            const pauseUntil = await question('Pause until (YYYY-MM-DD): ');
            const reason4 = await question('Reason: ');
            await utils.pauseSubscription(workspaceId4, pauseUntil, reason4);
            break;

         case '5':
            const workspaceId5 = await question('Enter workspace ID: ');
            const reason5 = await question('Reason: ');
            await utils.resumeSubscription(workspaceId5, reason5);
            break;

         case '6':
            const workspaceId6 = await question('Enter workspace ID: ');
            const paymentAmount = parseFloat(
               await question('Payment amount (NGN): ')
            );
            const paymentMethod = await question('Payment method: ');
            const reference = await question('Payment reference: ');
            const notes = await question('Notes: ');
            await utils.createManualPayment(
               workspaceId6,
               paymentAmount,
               paymentMethod,
               reference,
               notes
            );
            break;

         case '7':
            const startDate = new Date(
               await question('Start date (YYYY-MM-DD): ')
            );
            const endDate = new Date(await question('End date (YYYY-MM-DD): '));
            await utils.generateAdjustmentReport(startDate, endDate);
            break;

         case '0':
            log('Goodbye! 👋', 'green');
            process.exit(0);

         default:
            warning('Invalid option. Please try again.');
      }

      await question('\nPress Enter to continue...');
   }
}

// Handle command line arguments
if (process.argv.length > 2) {
   const command = process.argv[2];
   const args = process.argv.slice(3);

   connectDB().then(async () => {
      const utils = new SubscriptionAdjustmentUtils();

      switch (command) {
         case 'extend-trial':
            if (args.length < 3) {
               error('Usage: extend-trial <workspaceId> <days> <reason>');
               process.exit(1);
            }
            await utils.extendTrial(args[0], parseInt(args[1]), args[2]);
            break;

         case 'apply-credit':
            if (args.length < 3) {
               error('Usage: apply-credit <workspaceId> <amount> <reason>');
               process.exit(1);
            }
            await utils.applyCredit(args[0], parseFloat(args[1]), args[2]);
            break;

         default:
            error(`Unknown command: ${command}`);
            log('Available commands: extend-trial, apply-credit');
      }
      process.exit(0);
   });
} else {
   // Interactive mode
   main().catch((err) => {
      error(`Application error: ${err.message}`);
      process.exit(1);
   });
}

// Graceful shutdown
process.on('SIGINT', () => {
   log('\n\nShutting down gracefully...', 'yellow');
   mongoose.connection.close();
   rl.close();
   process.exit(0);
});
