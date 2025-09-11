#!/usr/bin/env node

/**
 * Admin Utilities for Pharmacare Workspace Subscription Management
 *
 * This script provides command-line utilities for administrators to manage
 * workspaces, subscriptions, invitations, and perform system maintenance.
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
require('../dist/models/Invitation');
require('../dist/models/EmailDelivery');

const User = mongoose.model('User');
const Workplace = mongoose.model('Workplace');
const Subscription = mongoose.model('Subscription');
const SubscriptionPlan = mongoose.model('SubscriptionPlan');
const Invitation = mongoose.model('Invitation');
const EmailDelivery = mongoose.model('EmailDelivery');

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

// Admin utilities
class AdminUtils {
   // Workspace management
   async listWorkspaces(options = {}) {
      try {
         const { limit = 20, status, search } = options;

         let query = {};
         if (status) query.subscriptionStatus = status;
         if (search) {
            query.$or = [
               { name: { $regex: search, $options: 'i' } },
               { email: { $regex: search, $options: 'i' } },
            ];
         }

         const workspaces = await Workplace.find(query)
            .populate('ownerId', 'firstName lastName email')
            .populate('currentSubscriptionId')
            .limit(limit)
            .sort({ createdAt: -1 });

         log('\n📊 Workspaces:', 'cyan');
         log('─'.repeat(100));
         log(
            `${'Name'.padEnd(25)} ${'Owner'.padEnd(25)} ${'Status'.padEnd(
               12
            )} ${'Created'.padEnd(20)} ${'Users'.padEnd(8)}`,
            'bright'
         );
         log('─'.repeat(100));

         for (const workspace of workspaces) {
            const owner = workspace.ownerId;
            const ownerName = owner
               ? `${owner.firstName} ${owner.lastName}`
               : 'Unknown';
            const status = workspace.subscriptionStatus || 'unknown';
            const created = formatDate(workspace.createdAt);
            const userCount = workspace.stats?.usersCount || 0;

            log(
               `${workspace.name.padEnd(25)} ${ownerName.padEnd(25)} ${status.padEnd(
                  12
               )} ${created.padEnd(20)} ${userCount.toString().padEnd(8)}`
            );
         }

         log('─'.repeat(100));
         log(`Total: ${workspaces.length} workspaces`);
      } catch (err) {
         error(`Failed to list workspaces: ${err.message}`);
      }
   }

   async getWorkspaceDetails(workspaceId) {
      try {
         const workspace = await Workplace.findById(workspaceId)
            .populate('ownerId', 'firstName lastName email phoneNumber')
            .populate('currentSubscriptionId')
            .populate('teamMembers', 'firstName lastName email role');

         if (!workspace) {
            error('Workspace not found');
            return;
         }

         const subscription = await Subscription.findOne({
            workspaceId,
         }).populate('planId');

         log('\n🏢 Workspace Details:', 'cyan');
         log('─'.repeat(60));
         log(`Name: ${workspace.name}`);
         log(`Email: ${workspace.email}`);
         log(`Type: ${workspace.type}`);
         log(`License Number: ${workspace.licenseNumber || 'N/A'}`);
         log(`Status: ${workspace.subscriptionStatus}`);
         log(`Created: ${formatDate(workspace.createdAt)}`);
         log(`Verification: ${workspace.verificationStatus}`);

         if (workspace.ownerId) {
            log('\n👤 Owner:', 'yellow');
            log(
               `Name: ${workspace.ownerId.firstName} ${workspace.ownerId.lastName}`
            );
            log(`Email: ${workspace.ownerId.email}`);
            log(`Phone: ${workspace.ownerId.phoneNumber || 'N/A'}`);
         }

         if (subscription) {
            log('\n💳 Subscription:', 'magenta');
            log(`Status: ${subscription.status}`);
            log(`Tier: ${subscription.tier}`);
            log(`Start Date: ${formatDate(subscription.startDate)}`);
            log(`End Date: ${formatDate(subscription.endDate)}`);
            log(`Price: ${formatCurrency(subscription.priceAtPurchase || 0)}`);
            log(`Billing: ${subscription.billingInterval}`);

            if (subscription.planId) {
               log(`Plan: ${subscription.planId.name}`);
            }
         }

         if (workspace.stats) {
            log('\n📈 Usage Stats:', 'green');
            log(`Patients: ${workspace.stats.patientsCount || 0}`);
            log(`Users: ${workspace.stats.usersCount || 0}`);
            log(`Last Updated: ${formatDate(workspace.stats.lastUpdated)}`);
         }

         if (workspace.teamMembers && workspace.teamMembers.length > 0) {
            log('\n👥 Team Members:', 'blue');
            workspace.teamMembers.forEach((member) => {
               log(
                  `- ${member.firstName} ${member.lastName} (${member.email}) - ${
                     member.role || 'User'
                  }`
               );
            });
         }
      } catch (err) {
         error(`Failed to get workspace details: ${err.message}`);
      }
   }

   async updateWorkspaceSubscription(workspaceId, updates) {
      try {
         const workspace = await Workplace.findById(workspaceId);
         if (!workspace) {
            error('Workspace not found');
            return;
         }

         const subscription = await Subscription.findOne({ workspaceId });
         if (!subscription) {
            error('Subscription not found');
            return;
         }

         // Update subscription
         if (updates.planId) {
            const plan = await SubscriptionPlan.findById(updates.planId);
            if (!plan) {
               error('Plan not found');
               return;
            }
            subscription.planId = updates.planId;
            subscription.tier = plan.tier;
            subscription.features = plan.features;
            subscription.limits = plan.limits;
         }

         if (updates.status) {
            subscription.status = updates.status;
            workspace.subscriptionStatus = updates.status;
         }

         if (updates.endDate) {
            subscription.endDate = new Date(updates.endDate);
         }

         await subscription.save();
         await workspace.save();

         success(`Updated subscription for workspace: ${workspace.name}`);

         // Log the change
         const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'admin_subscription_update',
            workspaceId,
            workspaceName: workspace.name,
            updates,
            adminUser: 'CLI Admin',
         };

         await this.logAdminAction(logEntry);
      } catch (err) {
         error(`Failed to update workspace subscription: ${err.message}`);
      }
   }

   // Invitation management
   async listInvitations(options = {}) {
      try {
         const { limit = 20, status, workspaceId } = options;

         let query = {};
         if (status) query.status = status;
         if (workspaceId) query.workspaceId = workspaceId;

         const invitations = await Invitation.find(query)
            .populate('workspaceId', 'name')
            .populate('invitedBy', 'firstName lastName email')
            .limit(limit)
            .sort({ createdAt: -1 });

         log('\n📧 Invitations:', 'cyan');
         log('─'.repeat(120));
         log(
            `${'Email'.padEnd(30)} ${'Workspace'.padEnd(25)} ${'Role'.padEnd(
               12
            )} ${'Status'.padEnd(10)} ${'Expires'.padEnd(20)} ${'Invited By'.padEnd(
               20
            )}`,
            'bright'
         );
         log('─'.repeat(120));

         for (const invitation of invitations) {
            const workspace = invitation.workspaceId?.name || 'Unknown';
            const inviter = invitation.invitedBy
               ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
               : 'Unknown';
            const expires = formatDate(invitation.expiresAt);

            log(
               `${invitation.email.padEnd(30)} ${workspace.padEnd(
                  25
               )} ${invitation.role.padEnd(12)} ${invitation.status.padEnd(
                  10
               )} ${expires.padEnd(20)} ${inviter.padEnd(20)}`
            );
         }

         log('─'.repeat(120));
         log(`Total: ${invitations.length} invitations`);
      } catch (err) {
         error(`Failed to list invitations: ${err.message}`);
      }
   }

   async cancelInvitation(invitationId, reason = 'Admin cancellation') {
      try {
         const invitation = await Invitation.findById(invitationId);
         if (!invitation) {
            error('Invitation not found');
            return;
         }

         if (invitation.status !== 'active') {
            warning('Invitation is not active');
            return;
         }

         invitation.status = 'canceled';
         invitation.metadata = {
            ...invitation.metadata,
            canceledBy: 'admin',
            canceledReason: reason,
            canceledAt: new Date(),
         };

         await invitation.save();
         success(`Canceled invitation for ${invitation.email}`);

         // Log the action
         await this.logAdminAction({
            timestamp: new Date().toISOString(),
            action: 'admin_invitation_cancel',
            invitationId,
            email: invitation.email,
            reason,
            adminUser: 'CLI Admin',
         });
      } catch (err) {
         error(`Failed to cancel invitation: ${err.message}`);
      }
   }

   // User management
   async listUsers(options = {}) {
      try {
         const { limit = 20, status, role, search } = options;

         let query = {};
         if (status) query.status = status;
         if (role) query.role = role;
         if (search) {
            query.$or = [
               { firstName: { $regex: search, $options: 'i' } },
               { lastName: { $regex: search, $options: 'i' } },
               { email: { $regex: search, $options: 'i' } },
            ];
         }

         const users = await User.find(query)
            .limit(limit)
            .sort({ createdAt: -1 });

         log('\n👥 Users:', 'cyan');
         log('─'.repeat(100));
         log(
            `${'Name'.padEnd(25)} ${'Email'.padEnd(30)} ${'Role'.padEnd(
               12
            )} ${'Status'.padEnd(12)} ${'Created'.padEnd(20)}`,
            'bright'
         );
         log('─'.repeat(100));

         for (const user of users) {
            const name = `${user.firstName} ${user.lastName}`;
            const created = formatDate(user.createdAt);

            log(
               `${name.padEnd(25)} ${user.email.padEnd(30)} ${user.role.padEnd(
                  12
               )} ${user.status.padEnd(12)} ${created.padEnd(20)}`
            );
         }

         log('─'.repeat(100));
         log(`Total: ${users.length} users`);
      } catch (err) {
         error(`Failed to list users: ${err.message}`);
      }
   }

   async updateUserStatus(userId, status, reason = '') {
      try {
         const user = await User.findById(userId);
         if (!user) {
            error('User not found');
            return;
         }

         const oldStatus = user.status;
         user.status = status;
         await user.save();

         success(
            `Updated user ${user.email} status from ${oldStatus} to ${status}`
         );

         // Log the action
         await this.logAdminAction({
            timestamp: new Date().toISOString(),
            action: 'admin_user_status_update',
            userId,
            email: user.email,
            oldStatus,
            newStatus: status,
            reason,
            adminUser: 'CLI Admin',
         });
      } catch (err) {
         error(`Failed to update user status: ${err.message}`);
      }
   }

   // System maintenance
   async cleanupExpiredInvitations() {
      try {
         const result = await Invitation.updateMany(
            {
               status: 'active',
               expiresAt: { $lt: new Date() },
            },
            {
               $set: { status: 'expired' },
            }
         );

         success(`Marked ${result.modifiedCount} expired invitations`);
      } catch (err) {
         error(`Failed to cleanup expired invitations: ${err.message}`);
      }
   }

   async recalculateUsageStats() {
      try {
         const workspaces = await Workplace.find({});
         let updated = 0;

         for (const workspace of workspaces) {
            // Count patients
            const patientCount = await mongoose
               .model('Patient')
               .countDocuments({
                  workspaceId: workspace._id,
               });

            // Count users
            const userCount = await User.countDocuments({
               $or: [
                  { _id: workspace.ownerId },
                  { _id: { $in: workspace.teamMembers } },
               ],
            });

            // Update stats
            workspace.stats = {
               patientsCount: patientCount,
               usersCount: userCount,
               lastUpdated: new Date(),
            };

            await workspace.save();
            updated++;
         }

         success(`Updated usage stats for ${updated} workspaces`);
      } catch (err) {
         error(`Failed to recalculate usage stats: ${err.message}`);
      }
   }

   async generateSystemReport() {
      try {
         const now = new Date();
         const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
         );

         const [
            totalWorkspaces,
            activeWorkspaces,
            totalUsers,
            activeUsers,
            totalSubscriptions,
            activeSubscriptions,
            totalInvitations,
            pendingInvitations,
            recentWorkspaces,
            recentUsers,
         ] = await Promise.all([
            Workplace.countDocuments(),
            Workplace.countDocuments({ subscriptionStatus: 'active' }),
            User.countDocuments(),
            User.countDocuments({ status: 'active' }),
            Subscription.countDocuments(),
            Subscription.countDocuments({ status: 'active' }),
            Invitation.countDocuments(),
            Invitation.countDocuments({
               status: 'active',
               expiresAt: { $gt: now },
            }),
            Workplace.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
         ]);

         const report = {
            timestamp: now.toISOString(),
            summary: {
               workspaces: { total: totalWorkspaces, active: activeWorkspaces },
               users: { total: totalUsers, active: activeUsers },
               subscriptions: {
                  total: totalSubscriptions,
                  active: activeSubscriptions,
               },
               invitations: {
                  total: totalInvitations,
                  pending: pendingInvitations,
               },
            },
            growth: {
               newWorkspaces30d: recentWorkspaces,
               newUsers30d: recentUsers,
            },
         };

         // Save report to file
         const reportPath = path.join(
            __dirname,
            `../reports/system-report-${now.toISOString().split('T')[0]}.json`
         );
         await fs.mkdir(path.dirname(reportPath), { recursive: true });
         await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

         log('\n📊 System Report:', 'cyan');
         log('─'.repeat(50));
         log(
            `Workspaces: ${totalWorkspaces} total, ${activeWorkspaces} active`
         );
         log(`Users: ${totalUsers} total, ${activeUsers} active`);
         log(
            `Subscriptions: ${totalSubscriptions} total, ${activeSubscriptions} active`
         );
         log(
            `Invitations: ${totalInvitations} total, ${pendingInvitations} pending`
         );
         log(`New workspaces (30d): ${recentWorkspaces}`);
         log(`New users (30d): ${recentUsers}`);
         log('─'.repeat(50));
         log(`Report saved to: ${reportPath}`);
      } catch (err) {
         error(`Failed to generate system report: ${err.message}`);
      }
   }

   // Logging
   async logAdminAction(logEntry) {
      try {
         const logPath = path.join(__dirname, '../logs/admin-actions.log');
         await fs.mkdir(path.dirname(logPath), { recursive: true });
         await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
      } catch (err) {
         warning(`Failed to log admin action: ${err.message}`);
      }
   }
}

// CLI Interface
async function showMenu() {
   log('\n🔧 Pharmacare Admin Utilities', 'cyan');
   log('─'.repeat(40));
   log('1. List workspaces');
   log('2. Get workspace details');
   log('3. Update workspace subscription');
   log('4. List invitations');
   log('5. Cancel invitation');
   log('6. List users');
   log('7. Update user status');
   log('8. Cleanup expired invitations');
   log('9. Recalculate usage stats');
   log('10. Generate system report');
   log('0. Exit');
   log('─'.repeat(40));
}

async function main() {
   await connectDB();
   const adminUtils = new AdminUtils();

   while (true) {
      await showMenu();
      const choice = await question('\nSelect an option: ');

      switch (choice) {
         case '1':
            const status = await question('Filter by status (optional): ');
            const search = await question('Search term (optional): ');
            await adminUtils.listWorkspaces({
               status: status || undefined,
               search: search || undefined,
            });
            break;

         case '2':
            const workspaceId = await question('Enter workspace ID: ');
            await adminUtils.getWorkspaceDetails(workspaceId);
            break;

         case '3':
            const wsId = await question('Enter workspace ID: ');
            const newStatus = await question('New status (optional): ');
            const endDate = await question(
               'New end date (YYYY-MM-DD, optional): '
            );
            const updates = {};
            if (newStatus) updates.status = newStatus;
            if (endDate) updates.endDate = endDate;
            await adminUtils.updateWorkspaceSubscription(wsId, updates);
            break;

         case '4':
            const invStatus = await question('Filter by status (optional): ');
            await adminUtils.listInvitations({
               status: invStatus || undefined,
            });
            break;

         case '5':
            const invitationId = await question('Enter invitation ID: ');
            const reason = await question('Cancellation reason: ');
            await adminUtils.cancelInvitation(invitationId, reason);
            break;

         case '6':
            const userStatus = await question('Filter by status (optional): ');
            const userRole = await question('Filter by role (optional): ');
            await adminUtils.listUsers({
               status: userStatus || undefined,
               role: userRole || undefined,
            });
            break;

         case '7':
            const userId = await question('Enter user ID: ');
            const newUserStatus = await question('New status: ');
            const statusReason = await question('Reason: ');
            await adminUtils.updateUserStatus(
               userId,
               newUserStatus,
               statusReason
            );
            break;

         case '8':
            await adminUtils.cleanupExpiredInvitations();
            break;

         case '9':
            await adminUtils.recalculateUsageStats();
            break;

         case '10':
            await adminUtils.generateSystemReport();
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
      const adminUtils = new AdminUtils();

      switch (command) {
         case 'list-workspaces':
            await adminUtils.listWorkspaces();
            break;
         case 'cleanup-invitations':
            await adminUtils.cleanupExpiredInvitations();
            break;
         case 'recalculate-stats':
            await adminUtils.recalculateUsageStats();
            break;
         case 'system-report':
            await adminUtils.generateSystemReport();
            break;
         default:
            error(`Unknown command: ${command}`);
            log(
               'Available commands: list-workspaces, cleanup-invitations, recalculate-stats, system-report'
            );
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
