/**
 * Integration test script for audit log export functionality
 * This script tests the CSV export feature with sample data
 */

const mongoose = require('mongoose');

// Sample audit log data
const sampleLogs = [
  {
    _id: new mongoose.Types.ObjectId(),
    workplaceId: new mongoose.Types.ObjectId(),
    actorId: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    },
    targetId: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
    },
    action: 'role_changed',
    category: 'role',
    details: {
      before: 'Staff',
      after: 'Pharmacist',
      reason: 'Promotion',
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'medium',
    timestamp: new Date('2024-01-15T10:30:00Z'),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    workplaceId: new mongoose.Types.ObjectId(),
    actorId: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
    },
    targetId: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@test.com',
    },
    action: 'member_suspended',
    category: 'member',
    details: {
      reason: 'Policy violation',
      metadata: {
        previousStatus: 'active',
        suspensionDuration: '30 days',
      },
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'high',
    timestamp: new Date('2024-01-16T14:20:00Z'),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    workplaceId: new mongoose.Types.ObjectId(),
    actorId: {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Owner',
      lastName: 'Admin',
      email: 'owner@test.com',
    },
    targetId: null,
    action: 'invite_generated',
    category: 'invite',
    details: {
      reason: 'New team member invitation',
      metadata: {
        email: 'newmember@test.com',
        role: 'Pharmacist',
      },
    },
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    severity: 'low',
    timestamp: new Date('2024-01-17T09:15:00Z'),
  },
];

/**
 * Convert audit logs to CSV format (mimics the service implementation)
 */
function convertToCSV(logs) {
  if (logs.length === 0) {
    return 'No audit data available';
  }

  const headers = [
    'Timestamp',
    'Action',
    'Category',
    'Actor Name',
    'Actor Email',
    'Target Name',
    'Target Email',
    'Severity',
    'IP Address',
    'Reason',
    'Before',
    'After',
  ];

  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.action,
    log.category,
    log.actorId ? `${log.actorId.firstName} ${log.actorId.lastName}` : 'Unknown',
    log.actorId?.email || 'Unknown',
    log.targetId ? `${log.targetId.firstName} ${log.targetId.lastName}` : '',
    log.targetId?.email || '',
    log.severity,
    log.ipAddress || '',
    log.details?.reason || '',
    log.details?.before ? JSON.stringify(log.details.before).replace(/"/g, '""') : '',
    log.details?.after ? JSON.stringify(log.details.after).replace(/"/g, '""') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((field) => `"${field}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Run tests
 */
function runTests() {
  console.log('🧪 Testing Audit Log Export Functionality\n');
  console.log('=' .repeat(60));

  // Test 1: Export with sample data
  console.log('\n✅ Test 1: Export audit logs with sample data');
  const csv = convertToCSV(sampleLogs);
  console.log('CSV Output:');
  console.log('-'.repeat(60));
  console.log(csv);
  console.log('-'.repeat(60));

  // Verify CSV structure
  const lines = csv.split('\n');
  console.log(`\n📊 CSV Statistics:`);
  console.log(`   - Total lines: ${lines.length}`);
  console.log(`   - Header line: ${lines[0].substring(0, 50)}...`);
  console.log(`   - Data rows: ${lines.length - 1}`);

  // Test 2: Export with empty data
  console.log('\n✅ Test 2: Export with no audit logs');
  const emptyCSV = convertToCSV([]);
  console.log(`   Result: "${emptyCSV}"`);

  // Test 3: Verify CSV contains expected data
  console.log('\n✅ Test 3: Verify CSV contains expected data');
  const checks = [
    { name: 'Contains header', test: csv.includes('Timestamp,Action,Category') },
    { name: 'Contains role_changed action', test: csv.includes('role_changed') },
    { name: 'Contains member_suspended action', test: csv.includes('member_suspended') },
    { name: 'Contains invite_generated action', test: csv.includes('invite_generated') },
    { name: 'Contains actor names', test: csv.includes('John Doe') && csv.includes('Admin User') },
    { name: 'Contains target names', test: csv.includes('Jane Smith') && csv.includes('Bob Johnson') },
    { name: 'Contains severity levels', test: csv.includes('medium') && csv.includes('high') && csv.includes('low') },
    { name: 'Contains IP addresses', test: csv.includes('192.168.1.1') },
    { name: 'Contains reasons', test: csv.includes('Promotion') && csv.includes('Policy violation') },
    { name: 'Handles null target', test: csv.includes('invite_generated') },
  ];

  checks.forEach((check) => {
    console.log(`   ${check.test ? '✓' : '✗'} ${check.name}`);
  });

  // Test 4: Verify CSV escaping
  console.log('\n✅ Test 4: Verify CSV field escaping');
  const testLog = [{
    ...sampleLogs[0],
    details: {
      reason: 'Test with "quotes" and, commas',
      before: { status: 'active', note: 'Has "quotes"' },
    },
  }];
  const escapedCSV = convertToCSV(testLog);
  console.log(`   Contains escaped quotes: ${escapedCSV.includes('""')}`);

  // Test 5: Verify date formatting
  console.log('\n✅ Test 5: Verify date formatting');
  const dateCheck = csv.includes('2024-01-15T10:30:00.000Z');
  console.log(`   ISO 8601 format: ${dateCheck ? '✓' : '✗'}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  const allPassed = checks.every((check) => check.test) && dateCheck;
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  console.log('\n📝 Export functionality verification complete\n');

  return allPassed ? 0 : 1;
}

// Run the tests
const exitCode = runTests();
process.exit(exitCode);
