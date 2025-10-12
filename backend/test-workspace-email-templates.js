/**
 * Test script for workspace team email templates
 * Tests all four email templates: suspension, approval, rejection, and invite
 */

const { emailService } = require('./dist/utils/emailService');

async function testEmailTemplates() {
  console.log('🧪 Testing Workspace Team Email Templates\n');

  try {
    // Test 1: Suspension Notification
    console.log('1️⃣ Testing Suspension Notification Template...');
    const suspensionResult = await emailService.sendAccountSuspensionNotification(
      'test@example.com',
      {
        firstName: 'John',
        workspaceName: 'HealthCare Pharmacy',
        reason: 'Violation of workspace policies regarding patient data handling',
        suspendedDate: new Date(),
      }
    );
    console.log('   ✅ Suspension notification:', suspensionResult.success ? 'SUCCESS' : 'FAILED');
    if (!suspensionResult.success) {
      console.log('   ❌ Error:', suspensionResult.error);
    }

    // Test 2: Approval Notification
    console.log('\n2️⃣ Testing Approval Notification Template...');
    const approvalResult = await emailService.sendMemberApprovalNotification(
      'test@example.com',
      {
        firstName: 'Jane',
        workspaceName: 'HealthCare Pharmacy',
        role: 'Pharmacist',
      }
    );
    console.log('   ✅ Approval notification:', approvalResult.success ? 'SUCCESS' : 'FAILED');
    if (!approvalResult.success) {
      console.log('   ❌ Error:', approvalResult.error);
    }

    // Test 3: Rejection Notification
    console.log('\n3️⃣ Testing Rejection Notification Template...');
    const rejectionResult = await emailService.sendMemberRejectionNotification(
      'test@example.com',
      {
        firstName: 'Bob',
        workspaceName: 'HealthCare Pharmacy',
        reason: 'Incomplete professional credentials. Please resubmit with valid license information.',
        requestDate: new Date(),
      }
    );
    console.log('   ✅ Rejection notification:', rejectionResult.success ? 'SUCCESS' : 'FAILED');
    if (!rejectionResult.success) {
      console.log('   ❌ Error:', rejectionResult.error);
    }

    // Test 4: Workspace Invite
    console.log('\n4️⃣ Testing Workspace Invite Template...');
    const inviteResult = await emailService.sendWorkspaceInviteEmail(
      'test@example.com',
      {
        inviterName: 'Dr. Sarah Johnson',
        workspaceName: 'HealthCare Pharmacy',
        role: 'Pharmacy Technician',
        inviteUrl: 'https://pharmacycopilot.com/signup?invite=abc123xyz',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        personalMessage: 'We are excited to have you join our team! Your expertise will be a great addition to our pharmacy.',
        requiresApproval: true,
      }
    );
    console.log('   ✅ Workspace invite:', inviteResult.success ? 'SUCCESS' : 'FAILED');
    if (!inviteResult.success) {
      console.log('   ❌ Error:', inviteResult.error);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log('='.repeat(60));
    const results = [suspensionResult, approvalResult, rejectionResult, inviteResult];
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successCount}/4`);
    console.log(`❌ Failed: ${failCount}/4`);
    
    if (successCount === 4) {
      console.log('\n🎉 All email templates are working correctly!');
    } else {
      console.log('\n⚠️  Some email templates failed. Check the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
testEmailTemplates()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
