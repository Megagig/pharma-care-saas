#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function checkNotes() {
   try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');

      // Get ClinicalNote model
      const ClinicalNote = mongoose.model('ClinicalNote');

      // Count total notes
      const totalNotes = await ClinicalNote.countDocuments();
      console.log(`Total clinical notes in database: ${totalNotes}`);

      // Get sample notes to check structure
      const sampleNotes = await ClinicalNote.find({})
         .limit(3)
         .select('title workplaceId patient createdAt');
      console.log('Sample notes:', JSON.stringify(sampleNotes, null, 2));

      // Group by workplaceId
      const workplaceStats = await ClinicalNote.aggregate([
         { $group: { _id: '$workplaceId', count: { $sum: 1 } } },
      ]);
      console.log('Notes by workplace:', workplaceStats);
   } catch (error) {
      console.error('Error:', error);
   } finally {
      await mongoose.disconnect();
   }
}

checkNotes();
