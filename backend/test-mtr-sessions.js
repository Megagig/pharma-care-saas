const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple schema to query MTR sessions
const mtrSchema = new mongoose.Schema({}, { collection: 'medicationtherapyreviews', strict: false });
const MTR = mongoose.model('MTRTest', mtrSchema);

async function testMTRSessions() {
  try {
    console.log('Testing MTR sessions...');
    
    // Count total MTR sessions
    const totalCount = await MTR.countDocuments();
    console.log(`Total MTR sessions in database: ${totalCount}`);
    
    // Get first few sessions
    const sessions = await MTR.find().limit(5).lean();
    console.log('Sample MTR sessions:', JSON.stringify(sessions, null, 2));
    
    // Check for specific patient if provided
    if (process.argv[2]) {
      const patientId = process.argv[2];
      console.log(`\nChecking MTR sessions for patient: ${patientId}`);
      
      const patientSessions = await MTR.find({ patientId }).lean();
      console.log(`Found ${patientSessions.length} sessions for patient ${patientId}`);
      console.log('Patient sessions:', JSON.stringify(patientSessions, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing MTR sessions:', error);
  } finally {
    mongoose.connection.close();
  }
}

testMTRSessions();