const mongoose = require('mongoose');
const Patient = require('./backend/src/models/Patient').default;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pharmacare:pharmacare123@cluster0.vf50xoc.mongodb.net/pharmacare?retryWrites=true&w=majority';

async function debugPatientIssue() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const patientId = '68ee8f3f78edb485fc1bbcd3';
        console.log(`\n🔍 Searching for patient with ID: ${patientId}`);

        // Check if the patient exists at all
        const patientExists = await Patient.findById(patientId);
        console.log('Patient exists (no workplace filter):', patientExists ? 'YES' : 'NO');

        if (patientExists) {
            console.log('Patient details:', {
                _id: patientExists._id,
                firstName: patientExists.firstName,
                lastName: patientExists.lastName,
                workplaceId: patientExists.workplaceId,
                isDeleted: patientExists.isDeleted,
                createdAt: patientExists.createdAt
            });

            // Check all workplaces to see which one this patient belongs to
            const allWorkplaces = await mongoose.connection.db.collection('workplaces').find({}).toArray();
            console.log('\n🏢 Available workplaces:');
            allWorkplaces.forEach(workplace => {
                console.log(`- ${workplace.name} (ID: ${workplace._id})`);
            });

            // Check if patient belongs to any specific workplace
            console.log(`\n🔍 Patient belongs to workplace: ${patientExists.workplaceId}`);
            const workplace = await mongoose.connection.db.collection('workplaces').findOne({_id: patientExists.workplaceId});
            if (workplace) {
                console.log(`Workplace name: ${workplace.name}`);
            } else {
                console.log('❌ Workplace not found!');
            }
        }

        // Check recent diagnostic requests for this patient
        const DiagnosticCase = mongoose.model('DiagnosticCase');
        const recentCases = await DiagnosticCase.find({patientId}).sort({createdAt: -1}).limit(5);
        console.log(`\n📋 Recent diagnostic cases for this patient: ${recentCases.length}`);
        recentCases.forEach(case_ => {
            console.log(`- Case ${case_._id}: ${case_.status} (${case_.createdAt})`);
        });

        // Check if there are validation issues
        console.log('\n🔍 Testing patient validation...');
        try {
            const testPatient = new Patient({
                workplaceId: patientExists?.workplaceId || new mongoose.Types.ObjectId(),
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'TEST-001'
            });
            await testPatient.validate();
            console.log('✅ Patient validation passed');
        } catch (validationError) {
            console.log('❌ Patient validation failed:', validationError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

debugPatientIssue();