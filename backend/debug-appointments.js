const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care';

console.log('Connecting to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use a simple schema to check appointments
const AppointmentSchema = new mongoose.Schema({}, { strict: false });
const Appointment = mongoose.model('Appointment', AppointmentSchema);

async function debugAppointments() {
  try {
    console.log('=== DEBUGGING APPOINTMENTS ===');
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
    
    // Check if appointments collection exists
    const appointmentCollections = collections.filter(col => 
      col.name.toLowerCase().includes('appointment')
    );
    
    if (appointmentCollections.length > 0) {
      console.log('\nFound appointment-related collections:');
      appointmentCollections.forEach(col => console.log(`- ${col.name}`));
    }
    
    // Get all appointments
    const allAppointments = await Appointment.find({}).lean();
    console.log('\nTotal appointments in database:', allAppointments.length);
    
    if (allAppointments.length > 0) {
      console.log('\nFirst appointment details:');
      const firstAppointment = allAppointments[0];
      console.log('- _id:', firstAppointment._id);
      console.log('- workplaceId:', firstAppointment.workplaceId);
      console.log('- patientId:', firstAppointment.patientId);
      console.log('- type:', firstAppointment.type);
      console.log('- status:', firstAppointment.status);
      console.log('- scheduledDate:', firstAppointment.scheduledDate);
      console.log('- scheduledTime:', firstAppointment.scheduledTime);
      console.log('- assignedTo:', firstAppointment.assignedTo);
      console.log('- createdAt:', firstAppointment.createdAt);
      
      // Show all unique workplace IDs
      const workplaceIds = [...new Set(allAppointments.map(apt => apt.workplaceId?.toString()).filter(Boolean))];
      console.log('\nUnique workplace IDs in appointments:');
      workplaceIds.forEach(id => console.log(`- ${id}`));
      
      // Check the specific workplace ID from the logs
      const targetWorkplaceId = '68b5cd85f1f0f9758b8afbbf';
      console.log('\n=== TESTING APPOINTMENT QUERIES ===');
      console.log('Target workplaceId:', targetWorkplaceId);
      
      // Test if target workplace ID exists in our list
      const hasTargetWorkplace = workplaceIds.includes(targetWorkplaceId);
      console.log('Target workplace exists in appointments:', hasTargetWorkplace);
      
      if (hasTargetWorkplace) {
        // Test query with ObjectId
        const appointmentsForWorkplace = await Appointment.find({ 
          workplaceId: new mongoose.Types.ObjectId(targetWorkplaceId) 
        }).lean();
        console.log('Appointments found for target workplace:', appointmentsForWorkplace.length);
        
        if (appointmentsForWorkplace.length > 0) {
          console.log('\nAppointments for this workplace:');
          appointmentsForWorkplace.forEach((apt, index) => {
            console.log(`Appointment ${index + 1}:`, {
              id: apt._id,
              workplaceId: apt.workplaceId,
              status: apt.status,
              type: apt.type,
              scheduledDate: apt.scheduledDate,
              scheduledTime: apt.scheduledTime,
              patientId: apt.patientId,
              assignedTo: apt.assignedTo
            });
          });
        }
        
        // Test with different status filters
        const activeAppointments = await Appointment.find({ 
          workplaceId: new mongoose.Types.ObjectId(targetWorkplaceId),
          status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
        }).lean();
        console.log('Active appointments for workplace:', activeAppointments.length);
        
        // Test with date range (current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const appointmentsThisMonth = await Appointment.find({ 
          workplaceId: new mongoose.Types.ObjectId(targetWorkplaceId),
          scheduledDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).lean();
        console.log('Appointments this month for workplace:', appointmentsThisMonth.length);
        
      } else {
        console.log('\nTarget workplace ID not found. Using first available workplace ID for testing...');
        const testWorkplaceId = workplaceIds[0];
        console.log('Test workplaceId:', testWorkplaceId);
        
        const testAppointments = await Appointment.find({ 
          workplaceId: new mongoose.Types.ObjectId(testWorkplaceId)
        }).lean();
        console.log('Test appointments found:', testAppointments.length);
      }
    } else {
      console.log('\nNo appointments found in database.');
      console.log('This could mean:');
      console.log('1. The appointments collection is empty');
      console.log('2. The collection name is different');
      console.log('3. Connected to wrong database');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

debugAppointments();