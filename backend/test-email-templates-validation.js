/**
 * Test script to validate workspace team email templates
 * Tests template loading and variable substitution without sending emails
 */

const fs = require('fs');
const path = require('path');

// Simple template loader (mimics the emailService loadTemplate method)
function loadTemplate(templateName, variables) {
  try {
    const templatePath = path.join(
      __dirname,
      'src',
      'templates',
      'email',
      `${templateName}.html`
    );
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace variables in template
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });

    // Extract subject from template
    const subjectMatch = html.match(/<!--\s*SUBJECT:\s*(.+?)\s*-->/);
    const subject = subjectMatch?.[1] || 'PharmacyCopilot Notification';

    // Replace variables in subject
    let processedSubject = subject;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(regex, variables[key]);
    });

    // Extract text content (basic implementation)
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return { 
      success: true, 
      subject: processedSubject, 
      html, 
      text,
      templateName 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      templateName 
    };
  }
}

async function validateTemplates() {
  console.log('🧪 Validating Workspace Team Email Templates\n');
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Member Suspension',
      templateName: 'memberSuspension',
      variables: {
        firstName: 'John',
        workspaceName: 'HealthCare Pharmacy',
        reason: 'Violation of workspace policies regarding patient data handling',
        suspendedDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        supportUrl: 'https://pharmacycopilot.com/support',
        privacyUrl: 'https://pharmacycopilot.com/privacy',
      },
    },
    {
      name: 'Member Approval',
      templateName: 'memberApproval',
      variables: {
        firstName: 'Jane',
        workspaceName: 'HealthCare Pharmacy',
        role: 'Pharmacist',
        loginUrl: 'https://pharmacycopilot.com/login',
        supportUrl: 'https://pharmacycopilot.com/support',
        helpUrl: 'https://pharmacycopilot.com/help',
        privacyUrl: 'https://pharmacycopilot.com/privacy',
      },
    },
    {
      name: 'Member Rejection',
      templateName: 'memberRejection',
      variables: {
        firstName: 'Bob',
        workspaceName: 'HealthCare Pharmacy',
        reason: 'Incomplete professional credentials. Please resubmit with valid license information.',
        requestDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        contactAdminUrl: 'https://pharmacycopilot.com/contact',
        supportUrl: 'https://pharmacycopilot.com/support',
        helpUrl: 'https://pharmacycopilot.com/help',
        privacyUrl: 'https://pharmacycopilot.com/privacy',
      },
    },
    {
      name: 'Workspace Team Invite',
      templateName: 'workspaceTeamInvite',
      variables: {
        inviterName: 'Dr. Sarah Johnson',
        workspaceName: 'HealthCare Pharmacy',
        role: 'Pharmacy Technician',
        inviteUrl: 'https://pharmacycopilot.com/signup?invite=abc123xyz',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        personalMessage: 'We are excited to have you join our team! Your expertise will be a great addition to our pharmacy.',
        requiresApproval: true,
        supportUrl: 'https://pharmacycopilot.com/support',
        privacyUrl: 'https://pharmacycopilot.com/privacy',
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n📧 Testing: ${test.name}`);
    console.log('-'.repeat(60));
    
    const result = loadTemplate(test.templateName, test.variables);
    results.push(result);

    if (result.success) {
      console.log(`✅ Template loaded successfully`);
      console.log(`   Subject: ${result.subject}`);
      console.log(`   HTML length: ${result.html.length} characters`);
      console.log(`   Text length: ${result.text.length} characters`);
      
      // Check for unreplaced variables
      const unreplacedVars = result.html.match(/{{[^}]+}}/g);
      if (unreplacedVars && unreplacedVars.length > 0) {
        console.log(`   ⚠️  Warning: Found unreplaced variables: ${unreplacedVars.join(', ')}`);
      } else {
        console.log(`   ✓ All variables replaced`);
      }
      
      // Check for required elements
      const hasSubject = result.subject && result.subject.length > 0;
      const hasHTML = result.html && result.html.length > 1000; // Reasonable minimum
      const hasText = result.text && result.text.length > 100;
      
      if (hasSubject && hasHTML && hasText) {
        console.log(`   ✓ Template structure valid`);
      } else {
        console.log(`   ⚠️  Warning: Template may be incomplete`);
        if (!hasSubject) console.log(`      - Missing or empty subject`);
        if (!hasHTML) console.log(`      - HTML content too short`);
        if (!hasText) console.log(`      - Text content too short`);
      }
    } else {
      console.log(`❌ Template failed to load`);
      console.log(`   Error: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successCount}/${tests.length}`);
  console.log(`❌ Failed: ${failCount}/${tests.length}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 All email templates are valid and ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Configure SMTP/Resend credentials in .env');
    console.log('   2. Test actual email sending with test-workspace-email-templates.js');
    console.log('   3. Deploy templates to production');
    return 0;
  } else {
    console.log('\n⚠️  Some templates failed validation. Please fix the errors above.');
    return 1;
  }
}

// Run validation
validateTemplates()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Validation failed with error:', error);
    process.exit(1);
  });
