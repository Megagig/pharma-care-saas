// Add this temporary debug endpoint to your supportController.ts for testing

/**
 * Debug endpoint to test ticket number generation
 * GET /api/help/debug-ticket-number
 */
async debugTicketNumber(req, res) {
  try {
    console.log('🔍 Debug: Testing ticket number generation');
    
    // Import the SupportTicket model
    const { SupportTicket } = require('../models/SupportTicket');
    
    // Test 1: Count existing tickets
    const count = await SupportTicket.countDocuments();
    console.log('📊 Current ticket count:', count);
    
    // Test 2: Generate ticket number
    const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
    console.log('🎫 Generated ticket number:', ticketNumber);
    
    // Test 3: Check if it exists
    const existingTicket = await SupportTicket.findOne({ ticketNumber });
    console.log('🔍 Existing ticket check:', existingTicket ? 'EXISTS' : 'UNIQUE');
    
    // Test 4: Try creating a minimal ticket
    const testTicketData = {
      ticketNumber,
      title: 'Debug Test Ticket',
      description: 'This is a debug test ticket',
      priority: 'medium',
      category: 'technical',
      userId: req.user._id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`
    };
    
    console.log('📝 Creating test ticket with data:', testTicketData);
    
    const testTicket = new SupportTicket(testTicketData);
    
    // Validate before saving
    const validationError = testTicket.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationError.errors
      });
    }
    
    console.log('✅ Validation passed, saving ticket...');
    await testTicket.save();
    
    console.log('🎉 Test ticket created successfully:', testTicket._id);
    
    // Clean up - delete the test ticket
    await SupportTicket.deleteOne({ _id: testTicket._id });
    console.log('🧹 Test ticket cleaned up');
    
    res.json({
      success: true,
      message: 'Ticket number generation test passed',
      data: {
        count,
        generatedTicketNumber: ticketNumber,
        testTicketId: testTicket._id
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

// Add this route to your publicHelpRoutes.ts:
// router.get('/debug-ticket-number', supportController.debugTicketNumber.bind(supportController));