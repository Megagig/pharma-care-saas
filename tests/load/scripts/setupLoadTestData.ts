#!/usr/bin/env ts-node

/**
 * Load Test Data Setup Script
 * 
 * Creates test users, patients, and initial data for load testing
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../../../.env') });

// Import models (adjust paths as needed)
import User from '../../../src/models/User';
import Patient from '../../../src/models/Patient';
import Workplace from '../../../src/models/Workplace';

interface LoadTestUser {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface LoadTestPatient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
}

class LoadTestDataSetup {
  private workplaceId: mongoose.Types.ObjectId | null = null;

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-test';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB for load test setup');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async createTestWorkspace(): Promise<mongoose.Types.ObjectId> {
    try {
      const workspace = new Workplace({
        name: 'Load Test Pharmacy',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Nigeria'
        },
        phone: '+2341234567890',
        email: 'loadtest@pharmacy.com',
        licenseNumber: 'LOADTEST001',
        isActive: true,
        subscriptionPlan: 'professional',
        subscriptionStatus: 'active',
        features: {
          patientEngagement: true,
          appointmentScheduling: true,
          followUpManagement: true,
          recurringAppointments: true,
          patientPortal: true,
          moduleIntegration: true,
          advancedAnalytics: true
        }
      });

      await workspace.save();
      this.workplaceId = workspace._id;
      console.log(`✅ Created test workspace: ${workspace._id}`);
      return workspace._id;
    } catch (error) {
      console.error('❌ Failed to create test workspace:', error);
      throw error;
    }
  }

  async createTestUsers(): Promise<void> {
    if (!this.workplaceId) {
      throw new Error('Workspace must be created first');
    }

    const users: LoadTestUser[] = [
      // Pharmacists (50 users)
      ...Array.from({ length: 50 }, (_, i) => ({
        email: `pharmacist+${i + 1}@example.com`,
        password: 'LoadTest123!',
        role: 'pharmacist',
        firstName: `Pharmacist${i + 1}`,
        lastName: 'LoadTest'
      })),
      // Managers (10 users)
      ...Array.from({ length: 10 }, (_, i) => ({
        email: `manager+${i + 1}@example.com`,
        password: 'LoadTest123!',
        role: 'pharmacy_manager',
        firstName: `Manager${i + 1}`,
        lastName: 'LoadTest'
      })),
      // General users (200 users)
      ...Array.from({ length: 200 }, (_, i) => ({
        email: `user+${i + 1}@example.com`,
        password: 'LoadTest123!',
        role: 'pharmacist',
        firstName: `User${i + 1}`,
        lastName: 'LoadTest'
      }))
    ];

    console.log(`Creating ${users.length} test users...`);

    const hashedPassword = await bcrypt.hash('LoadTest123!', 12);

    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);
      const userDocs = batch.map(userData => ({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        workplaceId: this.workplaceId,
        isActive: true,
        isEmailVerified: true,
        permissions: {
          canViewPatients: true,
          canEditPatients: true,
          canCreateAppointments: true,
          canManageFollowUps: true,
          canViewAnalytics: userData.role === 'pharmacy_manager',
          canManageSchedules: userData.role === 'pharmacy_manager'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      try {
        await User.insertMany(userDocs, { ordered: false });
        console.log(`✅ Created users batch ${Math.floor(i / 10) + 1}/${Math.ceil(users.length / 10)}`);
      } catch (error: any) {
        if (error.code === 11000) {
          console.log(`⚠️  Some users in batch ${Math.floor(i / 10) + 1} already exist, skipping...`);
        } else {
          console.error(`❌ Failed to create users batch ${Math.floor(i / 10) + 1}:`, error);
        }
      }
    }

    console.log('✅ Test users creation completed');
  }

  async createTestPatients(): Promise<void> {
    if (!this.workplaceId) {
      throw new Error('Workspace must be created first');
    }

    const patients: LoadTestPatient[] = Array.from({ length: 1000 }, (_, i) => ({
      firstName: `Patient${i + 1}`,
      lastName: 'LoadTest',
      email: `patient${i + 1}@example.com`,
      phone: `+234${7000000000 + i}`,
      dateOfBirth: new Date(1950 + Math.floor(Math.random() * 50), 
                           Math.floor(Math.random() * 12), 
                           Math.floor(Math.random() * 28) + 1)
    }));

    console.log(`Creating ${patients.length} test patients...`);

    for (let i = 0; i < patients.length; i += 20) {
      const batch = patients.slice(i, i + 20);
      const patientDocs = batch.map(patientData => ({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        phone: patientData.phone,
        dateOfBirth: patientData.dateOfBirth,
        workplaceId: this.workplaceId,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} Test Street`,
          city: 'Test City',
          state: 'Test State',
          zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: 'Nigeria'
        },
        emergencyContact: {
          name: `Emergency Contact ${i + 1}`,
          relationship: 'spouse',
          phone: `+234${8000000000 + i}`
        },
        appointmentPreferences: {
          preferredDays: [1, 2, 3, 4, 5], // Monday to Friday
          preferredTimeSlots: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '17:00' }
          ],
          reminderPreferences: {
            email: true,
            sms: true,
            push: false,
            whatsapp: Math.random() > 0.5
          },
          language: 'en',
          timezone: 'Africa/Lagos'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      try {
        await Patient.insertMany(patientDocs, { ordered: false });
        console.log(`✅ Created patients batch ${Math.floor(i / 20) + 1}/${Math.ceil(patients.length / 20)}`);
      } catch (error: any) {
        if (error.code === 11000) {
          console.log(`⚠️  Some patients in batch ${Math.floor(i / 20) + 1} already exist, skipping...`);
        } else {
          console.error(`❌ Failed to create patients batch ${Math.floor(i / 20) + 1}:`, error);
        }
      }
    }

    console.log('✅ Test patients creation completed');
  }

  async enableFeatureFlags(): Promise<void> {
    try {
      // Import feature flag service
      const { FeatureFlagService } = await import('../../../src/services/FeatureFlagService');
      const featureFlagService = new FeatureFlagService();

      const flags = [
        'patient_engagement_module',
        'appointment_scheduling',
        'follow_up_management',
        'recurring_appointments',
        'patient_portal',
        'module_integration',
        'advanced_analytics'
      ];

      for (const flag of flags) {
        await featureFlagService.setFlag(flag, true, this.workplaceId!.toString());
        console.log(`✅ Enabled feature flag: ${flag}`);
      }

      console.log('✅ All feature flags enabled for load testing');
    } catch (error) {
      console.error('❌ Failed to enable feature flags:', error);
    }
  }

  async generateAuthToken(): Promise<string> {
    try {
      const testUser = await User.findOne({ 
        email: 'pharmacist+1@example.com',
        workplaceId: this.workplaceId 
      });

      if (!testUser) {
        throw new Error('Test user not found');
      }

      // Generate JWT token (adjust import path as needed)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: testUser._id,
          workplaceId: this.workplaceId,
          role: testUser.role
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      console.log('✅ Generated test auth token');
      console.log(`📋 Set this as TEST_AUTH_TOKEN environment variable:`);
      console.log(`export TEST_AUTH_TOKEN="${token}"`);
      
      return token;
    } catch (error) {
      console.error('❌ Failed to generate auth token:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.workplaceId) {
        await User.deleteMany({ workplaceId: this.workplaceId });
        await Patient.deleteMany({ workplaceId: this.workplaceId });
        await Workplace.deleteOne({ _id: this.workplaceId });
        console.log('✅ Cleaned up test data');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

async function main() {
  const setup = new LoadTestDataSetup();
  
  try {
    await setup.connect();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'setup':
        console.log('🚀 Setting up load test data...');
        await setup.createTestWorkspace();
        await setup.createTestUsers();
        await setup.createTestPatients();
        await setup.enableFeatureFlags();
        await setup.generateAuthToken();
        console.log('✅ Load test data setup completed!');
        break;
        
      case 'cleanup':
        console.log('🧹 Cleaning up load test data...');
        // Find and set workspace ID for cleanup
        const workspace = await Workplace.findOne({ name: 'Load Test Pharmacy' });
        if (workspace) {
          (setup as any).workplaceId = workspace._id;
          await setup.cleanup();
        }
        console.log('✅ Load test data cleanup completed!');
        break;
        
      case 'token':
        const workspace2 = await Workplace.findOne({ name: 'Load Test Pharmacy' });
        if (workspace2) {
          (setup as any).workplaceId = workspace2._id;
          await setup.generateAuthToken();
        }
        break;
        
      default:
        console.log('Usage: ts-node setupLoadTestData.ts [setup|cleanup|token]');
        console.log('  setup   - Create test data for load testing');
        console.log('  cleanup - Remove all test data');
        console.log('  token   - Generate auth token for existing test user');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await setup.disconnect();
  }
}

if (require.main === module) {
  main();
}

export default LoadTestDataSetup;