#!/usr/bin/env ts-node

/**
 * Load Test Data Cleanup Script
 * 
 * Removes all test data created during load testing
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../../../.env') });

// Import models (adjust paths as needed)
import User from '../../../src/models/User';
import Patient from '../../../src/models/Patient';
import Workplace from '../../../src/models/Workplace';

// Import Patient Engagement models if they exist
let Appointment: any, FollowUpTask: any, PharmacistSchedule: any, ReminderTemplate: any;

try {
  Appointment = require('../../../src/models/Appointment').default;
  FollowUpTask = require('../../../src/models/FollowUpTask').default;
  PharmacistSchedule = require('../../../src/models/PharmacistSchedule').default;
  ReminderTemplate = require('../../../src/models/ReminderTemplate').default;
} catch (error) {
  console.log('⚠️  Patient Engagement models not found, skipping cleanup for those collections');
}

class LoadTestDataCleanup {
  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-test';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB for cleanup');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async cleanupTestWorkspaces(): Promise<void> {
    try {
      console.log('🧹 Cleaning up test workspaces...');
      
      const testWorkspaces = await Workplace.find({
        $or: [
          { name: /Load Test/i },
          { email: /loadtest/i },
          { licenseNumber: /LOADTEST/i }
        ]
      });

      console.log(`Found ${testWorkspaces.length} test workspaces to clean up`);

      for (const workspace of testWorkspaces) {
        await this.cleanupWorkspaceData(workspace._id);
        await Workplace.deleteOne({ _id: workspace._id });
        console.log(`✅ Cleaned up workspace: ${workspace.name} (${workspace._id})`);
      }

      console.log('✅ Test workspaces cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test workspaces:', error);
    }
  }

  async cleanupWorkspaceData(workplaceId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Clean up users
      const userResult = await User.deleteMany({ workplaceId });
      console.log(`  Deleted ${userResult.deletedCount} test users`);

      // Clean up patients
      const patientResult = await Patient.deleteMany({ workplaceId });
      console.log(`  Deleted ${patientResult.deletedCount} test patients`);

      // Clean up Patient Engagement data if models exist
      if (Appointment) {
        const appointmentResult = await Appointment.deleteMany({ workplaceId });
        console.log(`  Deleted ${appointmentResult.deletedCount} test appointments`);
      }

      if (FollowUpTask) {
        const followUpResult = await FollowUpTask.deleteMany({ workplaceId });
        console.log(`  Deleted ${followUpResult.deletedCount} test follow-up tasks`);
      }

      if (PharmacistSchedule) {
        const scheduleResult = await PharmacistSchedule.deleteMany({ workplaceId });
        console.log(`  Deleted ${scheduleResult.deletedCount} test pharmacist schedules`);
      }

      if (ReminderTemplate) {
        const templateResult = await ReminderTemplate.deleteMany({ workplaceId });
        console.log(`  Deleted ${templateResult.deletedCount} test reminder templates`);
      }

    } catch (error) {
      console.error(`❌ Failed to cleanup data for workspace ${workplaceId}:`, error);
    }
  }

  async cleanupTestUsers(): Promise<void> {
    try {
      console.log('🧹 Cleaning up test users...');
      
      const testUserResult = await User.deleteMany({
        $or: [
          { email: /loadtest/i },
          { email: /pharmacist\+\d+@example\.com/ },
          { email: /manager\+\d+@example\.com/ },
          { email: /user\+\d+@example\.com/ },
          { firstName: /LoadTest/i },
          { lastName: /LoadTest/i }
        ]
      });

      console.log(`✅ Deleted ${testUserResult.deletedCount} test users`);
    } catch (error) {
      console.error('❌ Failed to cleanup test users:', error);
    }
  }

  async cleanupTestPatients(): Promise<void> {
    try {
      console.log('🧹 Cleaning up test patients...');
      
      const testPatientResult = await Patient.deleteMany({
        $or: [
          { email: /patient\d+@example\.com/ },
          { firstName: /Patient\d+/ },
          { lastName: /LoadTest/i },
          { phone: /^\+2347\d{9}$/ } // Test phone number pattern
        ]
      });

      console.log(`✅ Deleted ${testPatientResult.deletedCount} test patients`);
    } catch (error) {
      console.error('❌ Failed to cleanup test patients:', error);
    }
  }

  async cleanupPatientEngagementData(): Promise<void> {
    if (!Appointment && !FollowUpTask) {
      console.log('⚠️  Patient Engagement models not available, skipping cleanup');
      return;
    }

    try {
      console.log('🧹 Cleaning up Patient Engagement test data...');

      if (Appointment) {
        const appointmentResult = await Appointment.deleteMany({
          $or: [
            { description: /load test/i },
            { description: /database load test/i },
            { title: /Load test/i }
          ]
        });
        console.log(`✅ Deleted ${appointmentResult.deletedCount} test appointments`);
      }

      if (FollowUpTask) {
        const followUpResult = await FollowUpTask.deleteMany({
          $or: [
            { title: /load test/i },
            { description: /load test/i },
            { description: /Automated load test/i },
            { description: /Intensive database testing/i }
          ]
        });
        console.log(`✅ Deleted ${followUpResult.deletedCount} test follow-up tasks`);
      }

      if (PharmacistSchedule) {
        // Clean up any test schedules (be careful with this)
        const scheduleResult = await PharmacistSchedule.deleteMany({
          // Only delete schedules for test pharmacists
          pharmacistId: { $in: await this.getTestPharmacistIds() }
        });
        console.log(`✅ Deleted ${scheduleResult.deletedCount} test pharmacist schedules`);
      }

      if (ReminderTemplate) {
        const templateResult = await ReminderTemplate.deleteMany({
          $or: [
            { name: /load test/i },
            { name: /test template/i }
          ]
        });
        console.log(`✅ Deleted ${templateResult.deletedCount} test reminder templates`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup Patient Engagement test data:', error);
    }
  }

  private async getTestPharmacistIds(): Promise<mongoose.Types.ObjectId[]> {
    try {
      const testUsers = await User.find({
        $or: [
          { email: /pharmacist\+\d+@example\.com/ },
          { firstName: /Pharmacist\d+/ },
          { lastName: /LoadTest/i }
        ]
      }, { _id: 1 });

      return testUsers.map(user => user._id);
    } catch (error) {
      console.error('Failed to get test pharmacist IDs:', error);
      return [];
    }
  }

  async cleanupBulkOperations(): Promise<void> {
    try {
      console.log('🧹 Performing bulk cleanup operations...');

      // Clean up any remaining test data based on patterns
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Skip system collections
        if (collectionName.startsWith('system.')) continue;
        
        try {
          const coll = mongoose.connection.db.collection(collectionName);
          
          // Try to clean up documents with test patterns
          const result = await coll.deleteMany({
            $or: [
              { createdBy: { $exists: true }, 'metadata.source': 'load_test' },
              { description: /load test/i },
              { title: /load test/i },
              { name: /load test/i },
              { notes: /load test/i }
            ]
          });

          if (result.deletedCount > 0) {
            console.log(`  Cleaned ${result.deletedCount} documents from ${collectionName}`);
          }
        } catch (error) {
          // Ignore errors for collections that don't have the fields we're querying
        }
      }

      console.log('✅ Bulk cleanup operations completed');
    } catch (error) {
      console.error('❌ Failed to perform bulk cleanup operations:', error);
    }
  }

  async cleanupRedisCache(): Promise<void> {
    try {
      console.log('🧹 Cleaning up Redis cache...');
      
      // Import Redis client if available
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      // Clean up test-related cache keys
      const testKeys = await redis.keys('*loadtest*');
      const appointmentKeys = await redis.keys('*appointment*test*');
      const followUpKeys = await redis.keys('*followup*test*');
      
      const allTestKeys = [...testKeys, ...appointmentKeys, ...followUpKeys];
      
      if (allTestKeys.length > 0) {
        await redis.del(...allTestKeys);
        console.log(`✅ Deleted ${allTestKeys.length} test cache keys`);
      } else {
        console.log('✅ No test cache keys found');
      }
      
      await redis.disconnect();
    } catch (error) {
      console.log('⚠️  Redis cleanup skipped (Redis not available or configured)');
    }
  }

  async cleanupJobQueues(): Promise<void> {
    try {
      console.log('🧹 Cleaning up job queues...');
      
      // Import Bull if available
      const Bull = require('bull');
      const redisConfig = process.env.REDIS_URL || 'redis://localhost:6379';
      
      const queueNames = [
        'appointment-reminders',
        'follow-up-monitor',
        'medication-reminders',
        'adherence-check',
        'appointment-status'
      ];
      
      for (const queueName of queueNames) {
        try {
          const queue = new Bull(queueName, redisConfig);
          
          // Clean completed and failed jobs
          await queue.clean(0, 'completed');
          await queue.clean(0, 'failed');
          await queue.clean(0, 'active');
          await queue.clean(0, 'waiting');
          
          console.log(`✅ Cleaned queue: ${queueName}`);
          await queue.close();
        } catch (error) {
          console.log(`⚠️  Could not clean queue ${queueName}:`, error.message);
        }
      }
      
      console.log('✅ Job queue cleanup completed');
    } catch (error) {
      console.log('⚠️  Job queue cleanup skipped (Bull not available)');
    }
  }

  async performFullCleanup(): Promise<void> {
    console.log('🚀 Starting comprehensive load test data cleanup...\n');

    await this.cleanupTestWorkspaces();
    await this.cleanupTestUsers();
    await this.cleanupTestPatients();
    await this.cleanupPatientEngagementData();
    await this.cleanupBulkOperations();
    await this.cleanupRedisCache();
    await this.cleanupJobQueues();

    console.log('\n✅ Comprehensive cleanup completed!');
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async getCleanupStats(): Promise<void> {
    try {
      console.log('📊 Cleanup Statistics:');
      console.log('='.repeat(40));

      const stats = {
        workspaces: await Workplace.countDocuments({ name: /Load Test/i }),
        users: await User.countDocuments({ 
          $or: [
            { email: /loadtest/i },
            { firstName: /LoadTest/i }
          ]
        }),
        patients: await Patient.countDocuments({
          $or: [
            { firstName: /Patient\d+/ },
            { lastName: /LoadTest/i }
          ]
        })
      };

      if (Appointment) {
        stats['appointments'] = await Appointment.countDocuments({
          description: /load test/i
        });
      }

      if (FollowUpTask) {
        stats['followUps'] = await FollowUpTask.countDocuments({
          title: /load test/i
        });
      }

      Object.entries(stats).forEach(([key, count]) => {
        console.log(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${count} remaining`);
      });

      console.log('='.repeat(40));
    } catch (error) {
      console.error('❌ Failed to get cleanup stats:', error);
    }
  }
}

async function main() {
  const cleanup = new LoadTestDataCleanup();
  
  try {
    await cleanup.connect();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'full':
        await cleanup.performFullCleanup();
        break;
        
      case 'workspaces':
        await cleanup.cleanupTestWorkspaces();
        break;
        
      case 'users':
        await cleanup.cleanupTestUsers();
        break;
        
      case 'patients':
        await cleanup.cleanupTestPatients();
        break;
        
      case 'engagement':
        await cleanup.cleanupPatientEngagementData();
        break;
        
      case 'cache':
        await cleanup.cleanupRedisCache();
        break;
        
      case 'queues':
        await cleanup.cleanupJobQueues();
        break;
        
      case 'stats':
        await cleanup.getCleanupStats();
        break;
        
      default:
        console.log('Usage: ts-node cleanupLoadTestData.ts [command]');
        console.log('Commands:');
        console.log('  full        - Perform complete cleanup');
        console.log('  workspaces  - Clean up test workspaces');
        console.log('  users       - Clean up test users');
        console.log('  patients    - Clean up test patients');
        console.log('  engagement  - Clean up Patient Engagement test data');
        console.log('  cache       - Clean up Redis cache');
        console.log('  queues      - Clean up job queues');
        console.log('  stats       - Show cleanup statistics');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await cleanup.disconnect();
  }
}

if (require.main === module) {
  main();
}

export default LoadTestDataCleanup;