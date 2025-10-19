const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple schema to query MTR sessions
const mtrSchema = new mongoose.Schema({}, { collection: 'medicationtherapyreviews', strict: false });
const MTR = mongoose.model('MTRTest', mtrSchema);

async function testDashboardMTR() {
  try {
    console.log('Testing Dashboard MTR data...');
    
    const patientId = "68b0b5bdb26019cd8ea86b98"; // Use the patient ID we found earlier
    const patientObjectId = new mongoose.Types.ObjectId(patientId);
    
    console.log(`Testing with patientId: ${patientId}`);
    console.log(`Testing with ObjectId: ${patientObjectId}`);
    
    // Test the query that the backend service will use
    const sessions = await MTR.find({
      patientId: patientObjectId
    }).lean();
    
    console.log(`Found ${sessions.length} sessions for patient`);
    
    if (sessions.length > 0) {
      const activeSessions = sessions.filter(s => s.status === 'in_progress' || s.status === 'on_hold');
      const completedSessions = sessions.filter(s => s.status === 'completed');
      
      console.log(`Active sessions: ${activeSessions.length}`);
      console.log(`Completed sessions: ${completedSessions.length}`);
      
      console.log('Sample session:', JSON.stringify(sessions[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error testing dashboard MTR:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDashboardMTR();