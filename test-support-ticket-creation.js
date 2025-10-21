#!/usr/bin/env node

/**
 * Test script to verify support ticket creation functionality
 * This script tests the integration between the Help page ticket creation
 * and the admin Support & Helpdesk management interface
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  // You'll need to replace these with actual test credentials
  testUser: {
    email: 'test@example.com',
    password: 'testpassword'
  },
  adminUser: {
    email: 'admin@example.com', 
    password: 'adminpassword'
  }
};

let userToken = '';
let adminToken = '';

async function authenticateUser(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.data.token;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createSupportTicket(token) {
  try {
    const ticketData = {
      title: 'Test Support Ticket from Help Page',
      description: 'This is a test ticket created from the Help page to verify the integration with the admin Support & Helpdesk interface.',
      priority: 'medium',
      category: 'technical',
      tags: ['test', 'integration', 'help-page']
    };

    const response = await axios.post(`${BASE_URL}/help/tickets`, ticketData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Support ticket created successfully:');
    console.log('Ticket ID:', response.data.data._id);
    console.log('Ticket Number:', response.data.data.ticketNumber);
    console.log('Title:', response.data.data.title);
    console.log('Status:', response.data.data.status);
    console.log('Priority:', response.data.data.priority);
    console.log('Category:', response.data.data.category);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to create support ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function verifyTicketInAdmin(adminToken, ticketId) {
  try {
    const response = await axios.get(`${BASE_URL}/admin/saas/support/tickets`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const tickets = response.data.data.tickets || [];
    const createdTicket = tickets.find(ticket => ticket._id === ticketId || ticket.id === ticketId);

    if (createdTicket) {
      console.log('✅ Ticket found in admin interface:');
      console.log('Ticket Number:', createdTicket.ticketNumber);
      console.log('Title:', createdTicket.title);
      console.log('User:', createdTicket.userName, '(' + createdTicket.userEmail + ')');
      console.log('Status:', createdTicket.status);
      return true;
    } else {
      console.log('❌ Ticket not found in admin interface');
      console.log('Available tickets:', tickets.length);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to verify ticket in admin interface:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  console.log('🚀 Starting Support Ticket Integration Test...\n');

  try {
    // Step 1: Authenticate test user
    console.log('1. Authenticating test user...');
    userToken = await authenticateUser(testConfig.testUser.email, testConfig.testUser.password);
    console.log('✅ User authenticated successfully\n');

    // Step 2: Authenticate admin user
    console.log('2. Authenticating admin user...');
    adminToken = await authenticateUser(testConfig.adminUser.email, testConfig.adminUser.password);
    console.log('✅ Admin authenticated successfully\n');

    // Step 3: Create support ticket from Help page
    console.log('3. Creating support ticket from Help page...');
    const ticket = await createSupportTicket(userToken);
    console.log('');

    // Step 4: Verify ticket appears in admin interface
    console.log('4. Verifying ticket appears in admin Support & Helpdesk...');
    const ticketFound = await verifyTicketInAdmin(adminToken, ticket._id);
    console.log('');

    if (ticketFound) {
      console.log('🎉 Integration test PASSED! Support ticket creation from Help page works correctly.');
    } else {
      console.log('❌ Integration test FAILED! Ticket not visible in admin interface.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Usage instructions
if (process.argv.length < 2) {
  console.log('Usage: node test-support-ticket-creation.js');
  console.log('');
  console.log('Before running this test:');
  console.log('1. Make sure your backend server is running');
  console.log('2. Update the testConfig object with valid test user credentials');
  console.log('3. Ensure you have a regular user and an admin user in your system');
  console.log('');
  console.log('Environment variables:');
  console.log('- API_BASE_URL: Base URL for your API (default: http://localhost:5000/api)');
  process.exit(0);
}

// Run the test
runTest();