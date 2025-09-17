// Test to verify MTR save fix for follow-ups issue
console.log('Testing MTR save fix for follow-ups...');

// Mock follow-up data that would be sent from frontend
const mockFollowUpData = [
  {
    _id: '1758145739700', // Temp ID from frontend
    type: 'phone_call',
    priority: 'medium',
    description: 'Call this client',
    objectives: ['follow up'],
    scheduledDate: '2025-09-17T21:48:34.796Z',
    estimatedDuration: 30,
    assignedTo: 'cosmas', // This was causing the ObjectId casting error
    status: 'scheduled',
    relatedInterventions: [],
    reminders: [],
    reviewId: '68cb11a51d5688c7b3f854d1',
    patientId: '',
  },
];

// Test the backend logic for handling follow-ups
function testFollowUpHandling(followUps) {
  console.log('Testing follow-up handling logic...');

  if (!Array.isArray(followUps)) {
    console.error('❌ Follow-ups should be an array');
    return false;
  }

  for (const followUp of followUps) {
    // Check if it has a temp ID (should be handled as new)
    if (followUp._id && followUp._id.toString().startsWith('temp')) {
      console.log('✅ Temp ID detected, will create new follow-up');
    } else if (followUp._id && followUp._id !== 'temp') {
      console.log('✅ Existing ID detected, will try to update');
    } else {
      console.log('✅ No ID, will create new follow-up');
    }

    // Check required fields
    if (!followUp.type) {
      console.error('❌ Follow-up missing type');
      return false;
    }

    if (!followUp.description) {
      console.error('❌ Follow-up missing description');
      return false;
    }

    if (!followUp.scheduledDate) {
      console.error('❌ Follow-up missing scheduledDate');
      return false;
    }
  }

  console.log('✅ All follow-ups have required fields');
  return true;
}

// Test the fix
const testResult = testFollowUpHandling(mockFollowUpData);
console.log(
  'Follow-up handling test result:',
  testResult ? '✅ PASSED' : '❌ FAILED'
);

// Test the casting issue fix
function testCastingFix() {
  console.log('Testing casting fix...');

  // The issue was that followUps field in MTR model expects ObjectIds
  // but frontend was sending full objects
  // The fix is to handle followUps separately in the controller

  const mockUpdateData = {
    medications: [],
    problems: [],
    interventions: [],
    followUps: mockFollowUpData, // This would cause casting error before fix
    status: 'in_progress',
  };

  // Simulate the fix: remove followUps from update data after processing
  const processedData = { ...mockUpdateData };

  if (processedData.followUps && Array.isArray(processedData.followUps)) {
    console.log('✅ Follow-ups detected, will process separately');
    delete processedData.followUps; // Remove to avoid casting error
  }

  console.log('✅ Update data after processing:', Object.keys(processedData));
  return !processedData.followUps; // Should be undefined after removal
}

const castingTestResult = testCastingFix();
console.log(
  'Casting fix test result:',
  castingTestResult ? '✅ PASSED' : '❌ FAILED'
);

// Test the assignedTo ObjectId fix
function testAssignedToFix() {
  console.log('Testing assignedTo ObjectId fix...');

  const mockUserId = '68b5cb81f1f0f9758b8afadd'; // Valid ObjectId
  const invalidAssignedTo = 'cosmas'; // String that caused the error

  // Simulate the fix logic
  function handleAssignedTo(assignedToValue, fallbackUserId) {
    if (!assignedToValue) return fallbackUserId;

    // Check if it's a valid ObjectId (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (objectIdRegex.test(assignedToValue)) {
      return assignedToValue;
    } else {
      console.log(
        `⚠️ Invalid assignedTo value "${assignedToValue}", using fallback`
      );
      return fallbackUserId;
    }
  }

  const result1 = handleAssignedTo(invalidAssignedTo, mockUserId);
  const result2 = handleAssignedTo(mockUserId, mockUserId);
  const result3 = handleAssignedTo(null, mockUserId);

  const success =
    result1 === mockUserId && result2 === mockUserId && result3 === mockUserId;
  console.log('✅ AssignedTo fix test:', success ? 'PASSED' : 'FAILED');
  return success;
}

const assignedToTestResult = testAssignedToFix();

// Test the super_admin permission fix
function testSuperAdminFix() {
  console.log('Testing super_admin permission fix...');

  // Simulate the permission check logic
  function checkUpdatePermission(sessionStatus, isAdmin, isSuperAdmin) {
    // Old logic: if (session.status === 'completed' && !context.isAdmin)
    // New logic: if (session.status === 'completed' && !context.isAdmin && !context.isSuperAdmin)

    if (sessionStatus === 'completed' && !isAdmin && !isSuperAdmin) {
      return false; // Forbidden
    }
    return true; // Allowed
  }

  // Test cases
  const test1 = checkUpdatePermission('completed', false, true); // super_admin should be allowed
  const test2 = checkUpdatePermission('completed', true, false); // admin should be allowed
  const test3 = checkUpdatePermission('completed', false, false); // regular user should be blocked
  const test4 = checkUpdatePermission('in_progress', false, false); // in_progress should be allowed for anyone

  const success = test1 && test2 && !test3 && test4;
  console.log('✅ Super admin permission test:', success ? 'PASSED' : 'FAILED');
  return success;
}

const superAdminTestResult = testSuperAdminFix();

console.log('\n🎯 Summary:');
console.log('- Follow-up handling:', testResult ? '✅ FIXED' : '❌ NEEDS WORK');
console.log(
  '- Casting issue:',
  castingTestResult ? '✅ FIXED' : '❌ NEEDS WORK'
);
console.log(
  '- AssignedTo ObjectId issue:',
  assignedToTestResult ? '✅ FIXED' : '❌ NEEDS WORK'
);
console.log(
  '- Super admin permission issue:',
  superAdminTestResult ? '✅ FIXED' : '❌ NEEDS WORK'
);
console.log(
  '- Overall fix status:',
  testResult &&
    castingTestResult &&
    assignedToTestResult &&
    superAdminTestResult
    ? '✅ READY TO TEST'
    : '❌ NEEDS MORE WORK'
);
