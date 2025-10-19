const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple schema to query MTR sessions
const mtrSchema = new mongoose.Schema({}, { collection: 'medicationtherapyreviews', strict: false });
const MTR = mongoose.model('MTRTest', mtrSchema);

async function testMTRObjectId() {
  try {
    console.log('Testing MTR sessions with ObjectId...');
    
    const patientIdString = "68b0b5bdb26019cd8ea86b98";
    const patientIdObjectId = new mongoose.Types.ObjectId(patientIdString);
    
    console.log(`Testing with string: ${patientIdString}`);
    console.log(`Testing with ObjectId: ${patientIdObjectId}`);
    
    // Test with string
    const sessionsString = await MTR.find({ patientId: patientIdString }).lean();
    console.log(`Found ${sessionsString.length} sessions with string patientId`);
    
    // Test with ObjectId
    const sessionsObjectId = await MTR.find({ patientId: patientIdObjectId }).lean();
    console.log(`Found ${sessionsObjectId.length} sessions with ObjectId patientId`);
    
    // Check the actual type of patientId in the first document
    const firstSession = await MTR.findOne().lean();
    if (firstSession) {
      console.log('First session patientId type:', typeof firstSession.patientId);
      console.log('First session patientId value:', firstSession.patientId);
      console.log('Is ObjectId?', firstSession.patientId instanceof mongoose.Types.ObjectId);
    }
    
  } catch (error) {
    console.error('Error testing MTR ObjectId:', error);
  } finally {
    mongoose.connection.close();
  }
}

testMTRObjectId();