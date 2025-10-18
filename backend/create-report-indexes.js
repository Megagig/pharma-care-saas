#!/usr/bin/env node

/**
 * Create Database Indexes for Reports Performance
 * Run this script to create optimized indexes for the Reports & Analytics module
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care';

async function createReportIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n📊 Creating indexes for Reports & Analytics performance...');

    // Indexes for MedicationTherapyReview collection
    console.log('1. Creating indexes for MedicationTherapyReview...');
    
    await db.collection('medicationtherapyreviews').createIndex(
      { createdAt: 1, workplaceId: 1 },
      { name: 'reports_createdAt_workplaceId', background: true }
    );
    console.log('   ✅ Created compound index: createdAt + workplaceId');

    await db.collection('medicationtherapyreviews').createIndex(
      { createdAt: 1, workplaceId: 1, status: 1 },
      { name: 'reports_createdAt_workplaceId_status', background: true }
    );
    console.log('   ✅ Created compound index: createdAt + workplaceId + status');

    await db.collection('medicationtherapyreviews').createIndex(
      { reviewType: 1, createdAt: 1 },
      { name: 'reports_reviewType_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: reviewType + createdAt');

    await db.collection('medicationtherapyreviews').createIndex(
      { isDeleted: 1, createdAt: 1 },
      { name: 'reports_isDeleted_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: isDeleted + createdAt');

    // Indexes for MTRIntervention collection
    console.log('\n2. Creating indexes for MTRIntervention...');
    
    await db.collection('mtrinterventions').createIndex(
      { createdAt: 1, workplaceId: 1 },
      { name: 'reports_interventions_createdAt_workplaceId', background: true }
    );
    console.log('   ✅ Created compound index: createdAt + workplaceId');

    await db.collection('mtrinterventions').createIndex(
      { type: 1, createdAt: 1 },
      { name: 'reports_interventions_type_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: type + createdAt');

    await db.collection('mtrinterventions').createIndex(
      { outcome: 1, createdAt: 1 },
      { name: 'reports_interventions_outcome_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: outcome + createdAt');

    await db.collection('mtrinterventions').createIndex(
      { pharmacistId: 1, createdAt: 1 },
      { name: 'reports_interventions_pharmacistId_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: pharmacistId + createdAt');

    // Indexes for DrugTherapyProblem collection
    console.log('\n3. Creating indexes for DrugTherapyProblem...');
    
    await db.collection('drugtherapyproblems').createIndex(
      { createdAt: 1, workplaceId: 1 },
      { name: 'reports_problems_createdAt_workplaceId', background: true }
    );
    console.log('   ✅ Created compound index: createdAt + workplaceId');

    await db.collection('drugtherapyproblems').createIndex(
      { status: 1, createdAt: 1 },
      { name: 'reports_problems_status_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: status + createdAt');

    await db.collection('drugtherapyproblems').createIndex(
      { severity: 1, createdAt: 1 },
      { name: 'reports_problems_severity_createdAt', background: true }
    );
    console.log('   ✅ Created compound index: severity + createdAt');

    console.log('\n🎉 All indexes created successfully!');
    console.log('\n📈 These indexes will significantly improve report generation performance.');
    console.log('💡 Reports should now load much faster (under 10 seconds instead of 2+ minutes).');

    // Show existing indexes
    console.log('\n📋 Current indexes on MedicationTherapyReview:');
    const mtrIndexes = await db.collection('medicationtherapyreviews').listIndexes().toArray();
    mtrIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n📋 Current indexes on MTRIntervention:');
    const interventionIndexes = await db.collection('mtrinterventions').listIndexes().toArray();
    interventionIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createReportIndexes();