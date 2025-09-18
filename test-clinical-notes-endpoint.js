// Test script to check clinical notes endpoint
const patientId = '68ae5aa549785bf928279659'; // Example patient ID from the error

console.log('Testing Clinical Notes Endpoint');
console.log('Patient ID:', patientId);
console.log(
  'Expected URL:',
  `http://localhost:5000/api/notes/patient/${patientId}`
);

// The error shows the endpoint is returning 404
// This could be due to:
// 1. Patient doesn't exist in the database
// 2. Authentication/authorization issues
// 3. Middleware blocking the request
// 4. Route not matching properly

console.log('\nPossible issues:');
console.log('1. Patient with ID', patientId, 'might not exist in database');
console.log('2. Authentication token might be missing or invalid');
console.log('3. Workspace/tenant context might be missing');
console.log('4. RBAC middleware might be blocking access');

console.log('\nTo debug:');
console.log('1. Check if patient exists in database');
console.log('2. Check authentication headers');
console.log('3. Check server logs for middleware errors');
console.log('4. Verify user has permission to access clinical notes');
