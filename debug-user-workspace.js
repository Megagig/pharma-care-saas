#!/usr/bin/env node

/**
 * Debug script to check user workspace assignment and data
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// User ID from the frontend logs
const USER_ID = '68f7e213f10c0cc935f873c4';

async function debugUserWorkspace() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care');
        console.log('✅ Connected to MongoDB');

        // Get user info
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findById(USER_ID);
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('\n👤 User Information:');
        console.log('===================');
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Workplace ID: ${user.workplaceId || 'NOT SET'}`);
        console.log(`Status: ${user.status}`);

        if (!user.workplaceId) {
            console.log('\n❌ ISSUE FOUND: User has no workplaceId assigned!');
            console.log('This is why the dashboard shows no data.');
            
            // Check if there are any workplaces this user could belong to
            const Workplace = mongoose.model('Workplace', new mongoose.Schema({}, { strict: false }));
            const workplaces = await Workplace.find({}).limit(5);
            
            console.log('\n🏢 Available Workplaces:');
            workplaces.forEach((wp, index) => {
                console.log(`${index + 1}. ${wp.name} (ID: ${wp._id})`);
            });
            
            console.log('\n💡 Solution: Assign user to a workplace');
            console.log('You can do this by updating the user record in the database.');
            
            return;
        }

        // Check workplace exists
        const Workplace = mongoose.model('Workplace', new mongoose.Schema({}, { strict: false }));
        const workplace = await Workplace.findById(user.workplaceId);
        
        if (!workplace) {
            console.log('\n❌ ISSUE FOUND: User\'s workplace not found!');
            console.log(`User has workplaceId: ${user.workplaceId} but workplace doesn't exist`);
            return;
        }

        console.log('\n🏢 Workplace Information:');
        console.log('========================');
        console.log(`ID: ${workplace._id}`);
        console.log(`Name: ${workplace.name}`);
        console.log(`Owner ID: ${workplace.ownerId}`);

        // Check data in workspace
        const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
        const ClinicalNote = mongoose.model('ClinicalNote', new mongoose.Schema({}, { strict: false }));
        const MedicationRecord = mongoose.model('MedicationRecord', new mongoose.Schema({}, { strict: false }));

        const [patientsCount, notesCount, medicationsCount] = await Promise.all([
            Patient.countDocuments({ workplaceId: user.workplaceId, isDeleted: { $ne: true } }),
            ClinicalNote.countDocuments({ workplaceId: user.workplaceId }),
            MedicationRecord.countDocuments({ workplaceId: user.workplaceId })
        ]);

        console.log('\n📊 Data in User\'s Workspace:');
        console.log('============================');
        console.log(`Patients: ${patientsCount}`);
        console.log(`Clinical Notes: ${notesCount}`);
        console.log(`Medications: ${medicationsCount}`);

        const totalData = patientsCount + notesCount + medicationsCount;
        
        if (totalData === 0) {
            console.log('\n⚠️  ISSUE FOUND: Workspace has no data!');
            console.log('This is why the dashboard shows empty stats.');
            
            // Check if data exists in other workspaces
            const [totalPatients, totalNotes, totalMedications] = await Promise.all([
                Patient.countDocuments({ isDeleted: { $ne: true } }),
                ClinicalNote.countDocuments({}),
                MedicationRecord.countDocuments({})
            ]);
            
            console.log('\n🌐 System-wide Data:');
            console.log('===================');
            console.log(`Total Patients: ${totalPatients}`);
            console.log(`Total Notes: ${totalNotes}`);
            console.log(`Total Medications: ${totalMedications}`);
            
            if (totalPatients > 0 || totalNotes > 0 || totalMedications > 0) {
                console.log('\n💡 Data exists in other workspaces!');
                console.log('Possible solutions:');
                console.log('1. Move user to a workspace that has data');
                console.log('2. Create data in user\'s current workspace');
                console.log('3. Update existing data to have correct workplaceId');
                
                // Show sample data from other workspaces
                const samplePatients = await Patient.find({ isDeleted: { $ne: true } })
                    .select('firstName lastName workplaceId')
                    .limit(3);
                
                if (samplePatients.length > 0) {
                    console.log('\n📋 Sample Patients from Other Workspaces:');
                    samplePatients.forEach((patient, index) => {
                        console.log(`${index + 1}. ${patient.firstName} ${patient.lastName} (Workspace: ${patient.workplaceId})`);
                    });
                }
            } else {
                console.log('\n💡 No data exists in the system yet.');
                console.log('User needs to create patients, notes, and medications.');
            }
        } else {
            console.log('\n✅ Workspace has data - dashboard should show it!');
            console.log('If dashboard is still empty, there might be an API issue.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the debug
debugUserWorkspace().catch(console.error);