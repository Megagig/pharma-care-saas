# License Verification System - Testing Guide

## Pre-Testing Setup

### 1. Database Setup
```bash
cd backend
npm run migrate:up
```

### 2. Create Test Users
Create users with different roles:
- Pharmacist (requires license)
- Intern Pharmacist (requires license)
- Owner (requires license)
- Pharmacy Team (no license required)
- Super Admin (for approval testing)

### 3. Verify Upload Directory
```bash
mkdir -p backend/uploads/licenses
chmod 755 backend/uploads/licenses
```

## Test Scenarios

### Scenario 1: New User License Upload

**Steps:**
1. Register as a pharmacist
2. Login to the system
3. Navigate to Clinical Notes module
4. Verify license verification modal appears
5. Click "Upload License" button
6. Fill out the form:
   - License Number: TEST-PCN-12345
   - Expiration Date: Select future date
   - Pharmacy School: University of Lagos
   - Year of Graduation: 2020
   - Upload a PDF or image file
7. Click "Upload Document"
8. Verify success message
9. Verify status shows "Under Review"

**Expected Results:**
- ✅ Modal blocks access to Clinical Notes
- ✅ Form validates all required fields
- ✅ File upload succeeds
- ✅ Status changes to "pending"
- ✅ User receives confirmation email
- ✅ Admin receives notification email

### Scenario 2: License Number Validation

**Steps:**
1. Start license upload process
2. Enter a license number that's already in use
3. Observe validation message

**Expected Results:**
- ✅ Real-time validation shows "License number already registered"
- ✅ Continue button is disabled
- ✅ Cannot proceed with duplicate license number

### Scenario 3: File Upload Validation

**Test 3a: Invalid File Type**
1. Try to upload a .txt or .doc file
2. Verify error message

**Expected Results:**
- ✅ Error: "Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed"

**Test 3b: File Too Large**
1. Try to upload a file > 5MB
2. Verify error message

**Expected Results:**
- ✅ Error: "File size must be less than 5MB"

**Test 3c: Valid File**
1. Upload a PDF or image < 5MB
2. Verify file is accepted

**Expected Results:**
- ✅ File name and size displayed
- ✅ Can proceed to upload

### Scenario 4: Super Admin License Approval

**Steps:**
1. Login as super admin
2. Navigate to SaaS Settings
3. Click "License Verification" tab
4. Verify pending license appears in list
5. Click "View" icon to preview document
6. Review license details:
   - License number
   - Pharmacy school
   - Expiration date
   - Year of graduation
7. Click "Approve" button
8. Confirm approval
9. Verify success message

**Expected Results:**
- ✅ License appears in pending list
- ✅ Document preview loads correctly
- ✅ All license details are visible
- ✅ Approval succeeds
- ✅ User receives approval email
- ✅ License removed from pending list
- ✅ User status changes to "active"

### Scenario 5: Super Admin License Rejection

**Steps:**
1. Login as super admin
2. Navigate to License Verification tab
3. Select a pending license
4. Click "Reject" button
5. Enter rejection reason: "Document is unclear, please upload a clearer image"
6. Confirm rejection
7. Verify success message

**Expected Results:**
- ✅ Rejection reason is required
- ✅ Rejection succeeds
- ✅ User receives rejection email with reason
- ✅ License removed from pending list
- ✅ User status changes to "license_rejected"

### Scenario 6: Access After Approval

**Steps:**
1. Login as user whose license was approved
2. Navigate to Clinical Notes
3. Verify access is granted
4. Navigate to Medication Therapy Review
5. Verify access is granted
6. Navigate to Clinical Interventions
7. Verify access is granted
8. Navigate to AI Diagnostics
9. Verify access is granted
10. Navigate to Clinical Decision Support
11. Verify access is granted

**Expected Results:**
- ✅ All 5 protected modules are accessible
- ✅ No license verification modal appears
- ✅ User can perform all actions in modules

### Scenario 7: Re-upload After Rejection

**Steps:**
1. Login as user whose license was rejected
2. Navigate to any protected module
3. Verify rejection message with reason
4. Click "Upload License" button
5. Upload new license document
6. Verify new submission

**Expected Results:**
- ✅ Rejection reason is displayed
- ✅ Can upload new license
- ✅ Previous rejection reason is cleared
- ✅ Status changes back to "pending"

### Scenario 8: License Status Page

**Steps:**
1. Login as user with pending license
2. Navigate to /license route
3. Verify license status display
4. Check all information is correct

**Expected Results:**
- ✅ Current status is displayed (pending/approved/rejected)
- ✅ License number is shown
- ✅ Upload date is shown
- ✅ Expiration date is shown
- ✅ Pharmacy school is shown
- ✅ Year of graduation is shown (if provided)

### Scenario 9: Non-Licensed Role Access

**Steps:**
1. Login as pharmacy_team member
2. Navigate to Clinical Notes
3. Verify access is granted without license check

**Expected Results:**
- ✅ No license verification modal
- ✅ Direct access to module
- ✅ License status shows "not_required"

### Scenario 10: Multiple Protected Routes

**Steps:**
1. Login as user with pending license
2. Try to access each protected module:
   - /notes
   - /pharmacy/medication-therapy
   - /pharmacy/clinical-interventions
   - /pharmacy/diagnostics
   - /pharmacy/decision-support

**Expected Results:**
- ✅ All routes show license verification modal
- ✅ Consistent messaging across all routes
- ✅ "Upload License" button works from all routes

### Scenario 11: Document Preview

**Steps:**
1. Login as super admin
2. Navigate to License Verification tab
3. Click "View" on a license
4. Verify document preview loads

**Expected Results:**
- ✅ PDF displays in iframe
- ✅ Images display correctly
- ✅ Can zoom/scroll if needed
- ✅ Close button works

### Scenario 12: Search and Filter

**Steps:**
1. Login as super admin
2. Navigate to License Verification tab
3. Use search box to search by:
   - User name
   - Email
   - License number
4. Verify results

**Expected Results:**
- ✅ Search filters results correctly
- ✅ Results update in real-time
- ✅ No results message when appropriate

### Scenario 13: Pagination

**Steps:**
1. Create 50+ pending licenses
2. Navigate to License Verification tab
3. Verify pagination controls
4. Navigate between pages

**Expected Results:**
- ✅ Shows 50 licenses per page
- ✅ Page numbers displayed
- ✅ Can navigate to next/previous page
- ✅ Total count is accurate

### Scenario 14: Email Notifications

**Test 14a: Submission Email**
1. Upload a license
2. Check user's email inbox

**Expected Results:**
- ✅ Receives confirmation email
- ✅ Email contains license number
- ✅ Email contains submission date

**Test 14b: Approval Email**
1. Admin approves license
2. Check user's email inbox

**Expected Results:**
- ✅ Receives approval email
- ✅ Email contains congratulations message
- ✅ Email explains next steps

**Test 14c: Rejection Email**
1. Admin rejects license with reason
2. Check user's email inbox

**Expected Results:**
- ✅ Receives rejection email
- ✅ Email contains rejection reason
- ✅ Email explains how to re-upload

**Test 14d: Admin Notification**
1. User uploads license
2. Check super admin's email inbox

**Expected Results:**
- ✅ Admin receives notification
- ✅ Email contains user details
- ✅ Email contains link to review

### Scenario 15: Concurrent Access

**Steps:**
1. Have multiple users upload licenses simultaneously
2. Have admin review multiple licenses
3. Verify no conflicts

**Expected Results:**
- ✅ All uploads succeed
- ✅ No file conflicts
- ✅ All approvals/rejections process correctly

### Scenario 16: License Expiration Date Validation

**Steps:**
1. Try to upload license with past expiration date
2. Verify validation

**Expected Results:**
- ✅ Warning message about expired license
- ✅ Can still submit (admin will review)

### Scenario 17: Mobile Responsiveness

**Steps:**
1. Access license upload on mobile device
2. Complete upload process
3. Access admin panel on mobile

**Expected Results:**
- ✅ Form is mobile-friendly
- ✅ File upload works on mobile
- ✅ Admin panel is responsive
- ✅ Document preview works on mobile

### Scenario 18: Browser Compatibility

**Test on:**
- Chrome
- Firefox
- Safari
- Edge

**Expected Results:**
- ✅ All features work on all browsers
- ✅ File upload works consistently
- ✅ Document preview works consistently

## Performance Testing

### Load Testing
1. Upload 100 licenses simultaneously
2. Have admin process 50 licenses in quick succession
3. Monitor server performance

**Expected Results:**
- ✅ Server handles load without crashes
- ✅ Response times remain acceptable
- ✅ No memory leaks

### File Storage Testing
1. Upload 1000 license documents
2. Verify storage usage
3. Test document retrieval speed

**Expected Results:**
- ✅ Files stored efficiently
- ✅ Retrieval is fast
- ✅ No storage issues

## Security Testing

### Authorization Testing
1. Try to access admin endpoints as regular user
2. Try to view other users' documents
3. Try to approve own license

**Expected Results:**
- ✅ All unauthorized access is blocked
- ✅ Proper error messages returned
- ✅ No sensitive data leaked

### File Upload Security
1. Try to upload malicious files
2. Try to upload files with script tags
3. Try path traversal attacks

**Expected Results:**
- ✅ Malicious files rejected
- ✅ File type validation works
- ✅ No security vulnerabilities

## Regression Testing

### Existing Features
1. Verify user registration still works
2. Verify login still works
3. Verify other modules still work
4. Verify subscription management still works

**Expected Results:**
- ✅ No existing features broken
- ✅ All integrations still work
- ✅ No performance degradation

## Bug Tracking

### Known Issues
- Document any bugs found during testing
- Prioritize by severity
- Create tickets for fixes

### Test Results Log
```
Date: ___________
Tester: ___________
Environment: ___________

Scenario 1: ☐ Pass ☐ Fail
Scenario 2: ☐ Pass ☐ Fail
Scenario 3: ☐ Pass ☐ Fail
...
```

## Post-Testing Checklist

- [ ] All test scenarios passed
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Security tests passed
- [ ] Documentation is complete
- [ ] Deployment plan is ready
- [ ] Rollback plan is prepared
- [ ] Stakeholders notified

## Support Resources

- API Documentation: `/docs/api`
- User Guide: `/docs/user-guide`
- Admin Guide: `/docs/admin-guide`
- Troubleshooting: `LICENSE_VERIFICATION_IMPLEMENTATION.md`

---

**Testing Date**: ___________
**Tested By**: ___________
**Status**: ☐ In Progress ☐ Complete ☐ Failed
