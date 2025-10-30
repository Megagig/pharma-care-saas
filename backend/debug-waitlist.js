const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care';

console.log('Connecting to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use the correct schema that matches the actual model
const AppointmentWaitlistSchema = new mongoose.Schema({
  workplaceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Workplace',
    required: true,
    index: true
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    required: true,
    index: true
  },
  appointmentType: {
    type: String,
    required: true,
    enum: [
      'mtm_session',
      'chronic_disease_review',
      'new_medication_consultation',
      'vaccination',
      'health_check',
      'smoking_cessation',
      'general_followup',
    ],
  },
  duration: {
    type: Number,
    required: true,
    min: 5,
    max: 480,
  },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  maxWaitDays: {
    type: Number,
    required: true,
    min: 1,
    max: 90,
    default: 14,
  },
  preferredPharmacistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  preferredTimeSlots: [String],
  preferredDays: [Number],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active',
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  fulfilledAt: Date,
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  notificationsSent: [{
    sentAt: { type: Date, default: Date.now },
    channel: { type: String, enum: ['email', 'sms', 'push'] },
    message: String,
  }],
}, { timestamps: true });

const AppointmentWaitlist = mongoose.model('AppointmentWaitlist', AppointmentWaitlistSchema);

async function debugWaitlist() {
  try {
    console.log('=== DEBUGGING WAITLIST ===');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    
    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for database connection...');
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
    
    // List all collections to verify database structure
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Get all waitlist entries
    const allEntries = await AppointmentWaitlist.find({}).lean();
    console.log('\nTotal entries in database:', allEntries.length);
    
    if (allEntries.length > 0) {
      console.log('\nFirst entry details:');
      const firstEntry = allEntries[0];
      console.log('- _id:', firstEntry._id);
      console.log('- workplaceId:', firstEntry.workplaceId);
      console.log('- workplaceId type:', typeof firstEntry.workplaceId);
      console.log('- workplaceId instanceof ObjectId:', firstEntry.workplaceId instanceof mongoose.Types.ObjectId);
      console.log('- status:', firstEntry.status);
      console.log('- appointmentType:', firstEntry.appointmentType);
      console.log('- urgencyLevel:', firstEntry.urgencyLevel);
      console.log('- duration:', firstEntry.duration);
      console.log('- createdAt:', firstEntry.createdAt);
      console.log('- expiresAt:', firstEntry.expiresAt);
      
      // Show all unique workplace IDs
      const workplaceIds = [...new Set(allEntries.map(entry => entry.workplaceId.toString()))];
      console.log('\nUnique workplace IDs in database:');
      workplaceIds.forEach(id => console.log(`- ${id}`));
      
      // Check the specific workplace ID from the logs
      const targetWorkplaceId = '68b5cd85f1f0f9758b8afbbf';
      console.log('\n=== TESTING QUERIES ===');
      console.log('Target workplaceId:', targetWorkplaceId);
      
      // Test if target workplace ID exists in our list
      const hasTargetWorkplace = workplaceIds.includes(targetWorkplaceId);
      console.log('Target workplace exists in database:', hasTargetWorkplace);
      
      if (hasTargetWorkplace) {
        // Test query with string
        const entriesWithString = await AppointmentWaitlist.find({ 
          workplaceId: targetWorkplaceId 
        }).lean();
        console.log('Entries found with string query:', entriesWithString.length);
        
        // Test query with ObjectId
        const entriesWithObjectId = await AppointmentWaitlist.find({ 
          workplaceId: new mongoose.Types.ObjectId(targetWorkplaceId) 
        }).lean();
        console.log('Entries found with ObjectId query:', entriesWithObjectId.length);
        
        // Test with status filter
        const entriesWithStatus = await AppointmentWaitlist.find({ 
          workplaceId: new mongoose.Types.ObjectId(targetWorkplaceId),
          status: 'active'
        }).lean();
        console.log('Entries found with ObjectId + status=active:', entriesWithStatus.length);
        
        // Show all entries for this workplace
        console.log('\nAll entries for this workplace:');
        const workplaceEntries = allEntries.filter(entry => entry.workplaceId.toString() === targetWorkplaceId);
        workplaceEntries.forEach((entry, index) => {
          console.log(`Entry ${index + 1}:`, {
            id: entry._id,
            workplaceId: entry.workplaceId,
            status: entry.status,
            appointmentType: entry.appointmentType,
            urgencyLevel: entry.urgencyLevel,
            duration: entry.duration,
            createdAt: entry.createdAt,
            expiresAt: entry.expiresAt
          });
        });
      } else {
        console.log('\nTarget workplace ID not found. Using first available workplace ID for testing...');
        const testWorkplaceId = workplaceIds[0];
        console.log('Test workplaceId:', testWorkplaceId);
        
        const testEntries = await AppointmentWaitlist.find({ 
          workplaceId: new mongoose.Types.ObjectId(testWorkplaceId),
          status: 'active'
        }).lean();
        console.log('Test entries found:', testEntries.length);
        
        if (testEntries.length > 0) {
          console.log('Sample entry:', {
            id: testEntries[0]._id,
            workplaceId: testEntries[0].workplaceId,
            status: testEntries[0].status,
            appointmentType: testEntries[0].appointmentType,
            urgencyLevel: testEntries[0].urgencyLevel
          });
        }
      }
    } else {
      console.log('\nNo waitlist entries found in database.');
      console.log('This could mean:');
      console.log('1. The collection is empty');
      console.log('2. The collection name is different');
      console.log('3. Connected to wrong database');
      
      // Try to find any collection with "waitlist" in the name
      const waitlistCollections = collections.filter(col => 
        col.name.toLowerCase().includes('waitlist') || 
        col.name.toLowerCase().includes('appointment')
      );
      
      if (waitlistCollections.length > 0) {
        console.log('\nFound related collections:');
        waitlistCollections.forEach(col => console.log(`- ${col.name}`));
      }
    }
    
    // Test the WaitlistService query logic
    console.log('\n=== TESTING WAITLIST SERVICE LOGIC ===');
    const testWorkplaceId = '68b5cd85f1f0f9758b8afbbf';
    const workplaceObjectId = new mongoose.Types.ObjectId(testWorkplaceId);
    
    const query = { workplaceId: workplaceObjectId, status: 'active' };
    console.log('Service query:', query);
    
    const totalCount = await AppointmentWaitlist.countDocuments({});
    const workplaceCount = await AppointmentWaitlist.countDocuments({ workplaceId: workplaceObjectId });
    
    console.log('Database counts:', { totalCount, workplaceCount });
    
    const allEntriesForWorkplace = await AppointmentWaitlist.find({ workplaceId: workplaceObjectId })
      .select('status urgencyLevel appointmentType createdAt workplaceId patientId preferredPharmacistId')
      .lean();
    
    console.log('All entries for workplace (with refs):', allEntriesForWorkplace);
    
    // Test the populate query step by step
    console.log('\n=== TESTING POPULATE QUERIES ===');
    
    // First, try without populate
    const entriesWithoutPopulate = await AppointmentWaitlist.find(query).lean();
    console.log('Entries without populate:', entriesWithoutPopulate.length);
    
    if (entriesWithoutPopulate.length > 0) {
      console.log('First entry without populate:', {
        id: entriesWithoutPopulate[0]._id,
        patientId: entriesWithoutPopulate[0].patientId,
        preferredPharmacistId: entriesWithoutPopulate[0].preferredPharmacistId,
        status: entriesWithoutPopulate[0].status
      });
      
      // Check if the referenced patient exists
      const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
      const patientExists = await Patient.findById(entriesWithoutPopulate[0].patientId);
      console.log('Patient exists:', !!patientExists);
      if (patientExists) {
        console.log('Patient data:', {
          id: patientExists._id,
          firstName: patientExists.firstName,
          lastName: patientExists.lastName,
          email: patientExists.email
        });
      }
      
      // Check if the referenced pharmacist exists (if set)
      if (entriesWithoutPopulate[0].preferredPharmacistId) {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const pharmacistExists = await User.findById(entriesWithoutPopulate[0].preferredPharmacistId);
        console.log('Pharmacist exists:', !!pharmacistExists);
        if (pharmacistExists) {
          console.log('Pharmacist data:', {
            id: pharmacistExists._id,
            firstName: pharmacistExists.firstName,
            lastName: pharmacistExists.lastName
          });
        }
      }
    }
    
    // Now try with populate
    console.log('\n=== TESTING WITH POPULATE ===');
    try {
      const entriesWithPopulate = await AppointmentWaitlist.find(query)
        .populate('patientId', 'firstName lastName email phone')
        .populate('preferredPharmacistId', 'firstName lastName')
        .lean();
      
      console.log('Entries with populate:', entriesWithPopulate.length);
      
      if (entriesWithPopulate.length > 0) {
        console.log('First entry with populate:', {
          id: entriesWithPopulate[0]._id,
          patientId: entriesWithPopulate[0].patientId,
          preferredPharmacistId: entriesWithPopulate[0].preferredPharmacistId,
          status: entriesWithPopulate[0].status
        });
      }
    } catch (populateError) {
      console.error('Populate error:', populateError.message);
    }
    
    // Try populate one field at a time
    console.log('\n=== TESTING INDIVIDUAL POPULATES ===');
    try {
      const entriesWithPatientPopulate = await AppointmentWaitlist.find(query)
        .populate('patientId', 'firstName lastName email phone')
        .lean();
      console.log('Entries with patient populate only:', entriesWithPatientPopulate.length);
    } catch (error) {
      console.error('Patient populate error:', error.message);
    }
    
    try {
      const entriesWithPharmacistPopulate = await AppointmentWaitlist.find(query)
        .populate('preferredPharmacistId', 'firstName lastName')
        .lean();
      console.log('Entries with pharmacist populate only:', entriesWithPharmacistPopulate.length);
    } catch (error) {
      console.error('Pharmacist populate error:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

debugWaitlist();