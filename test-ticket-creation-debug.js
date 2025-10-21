#!/usr/bin/env node

/**
 * Debug script to test support ticket creation
 * This script helps debug the ticket number generation issue
 */

const mongoose = require('mongoose');

// Connect to MongoDB (adjust connection string as needed)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/PharmaCare';

async function testTicketNumberGeneration() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define a simple SupportTicket schema for testing
    const supportTicketSchema = new mongoose.Schema({
      ticketNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'],
        default: 'open',
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      category: {
        type: String,
        enum: ['technical', 'billing', 'feature_request', 'bug_report', 'general'],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      userEmail: {
        type: String,
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
    }, {
      timestamps: true,
      collection: 'supporttickets',
    });

    const SupportTicket = mongoose.model('TestSupportTicket', supportTicketSchema);

    // Test ticket number generation
    console.log('🎫 Testing ticket number generation...');
    
    const generateTicketNumber = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const count = await SupportTicket.countDocuments();
          const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
          
          console.log(`Attempt ${attempts + 1}: Generated ticket number ${ticketNumber}`);
          
          // Check if this ticket number already exists
          const existingTicket = await SupportTicket.findOne({ ticketNumber });
          
          if (!existingTicket) {
            console.log(`✅ Ticket number ${ticketNumber} is unique`);
            return ticketNumber;
          }
          
          console.log(`❌ Ticket number ${ticketNumber} already exists`);
          attempts++;
        }
        
        // Fallback to timestamp-based approach
        const timestamp = Date.now().toString().slice(-6);
        const fallbackNumber = `TKT-${timestamp}`;
        console.log(`🔄 Using fallback ticket number: ${fallbackNumber}`);
        return fallbackNumber;
      } catch (error) {
        console.error('Error generating ticket number:', error);
        // Ultimate fallback
        const timestamp = Date.now().toString().slice(-6);
        return `TKT-${timestamp}`;
      }
    };

    // Generate a ticket number
    const ticketNumber = await generateTicketNumber();
    console.log(`🎯 Final ticket number: ${ticketNumber}`);

    // Test creating a ticket
    console.log('📝 Testing ticket creation...');
    
    const testTicket = new SupportTicket({
      ticketNumber,
      title: 'Test Support Ticket',
      description: 'This is a test ticket to verify the creation process works.',
      priority: 'medium',
      category: 'technical',
      userId: new mongoose.Types.ObjectId(),
      userEmail: 'test@example.com',
      userName: 'Test User'
    });

    await testTicket.save();
    console.log('✅ Test ticket created successfully!');
    console.log('Ticket details:', {
      id: testTicket._id,
      ticketNumber: testTicket.ticketNumber,
      title: testTicket.title,
      status: testTicket.status
    });

    // Clean up - remove the test ticket
    await SupportTicket.deleteOne({ _id: testTicket._id });
    console.log('🧹 Test ticket cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
console.log('🚀 Starting Support Ticket Creation Debug Test...\n');
testTicketNumberGeneration();