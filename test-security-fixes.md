# Test Security Fixes - Quick Guide

## Test 1: Invite Generator Button

1. Login as workspace owner (pharmacy_outlet role)
2. Navigate to `/workspace/team`
3. Click "Invite Links" tab
4. **Expected**: See "Generate Invite Link" button at top
5. Click the button
6. **Expected**: Modal dialog opens with invite form
7. Fill in the form and generate an invite
8. **Expected**: Invite appears in list below

**Status**: ⬜ Pass ⬜ Fail

---

## Test 2: Pending User Cannot Login (CRITICAL)

### Setup:
1. Generate an invite with "Requires Approval" checked
2. Copy the invite link
3. Open in incognito window
4. Register a new user with the invite
5. Verify email (click link in email)

### Test:
1. Try to login with the new user credentials
2. **Expected**: Login fails with message:
   ```
   "Your account is pending approval by the workspace owner. 
   You will receive an email once approved."
   ```
3. **Expected**: User is NOT logged in
4. **Expected**: User cannot access any pages

**Status**: ⬜ Pass ⬜ Fail

---

## Test 3: Pending User Appears in Pending Approvals Tab

### Continuing from Test 2:
1. Switch back to workspace owner account
2. Navigate to `/workspace/team`
3. Click "Pending Approvals" tab
4. **Expected**: See the new user in the list with:
   - Name
   - Email
   - Role
   - Registration date
5. **Expected**: "Approve" and "Reject" buttons visible

**Status**: ⬜ Pass ⬜ Fail

---

## Test 4: Approve User and Allow Login

### Continuing from Test 3:
1. Click "Approve" button for the pending user
2. **Expected**: Success message
3. **Expected**: User disappears from Pending Approvals list
4. **Expected**: User appears in Members tab with "Active" status
5. Switch to the new user's browser window
6. Try to login again
7. **Expected**: Login successful
8. **Expected**: User can access the application

**Status**: ⬜ Pass ⬜ Fail

---

## Test 5: Registration with Invite Token

### Test the complete flow:
1. Generate invite: `https://app.com/signup?invite=TOKEN`
2. Open invite link
3. **Expected**: Registration form opens
4. **Expected**: Email field pre-filled or validated against invite
5. Fill registration form
6. Submit
7. **Expected**: Success message mentions approval if required
8. Check database:
   ```javascript
   db.users.findOne({ email: "test@example.com" })
   ```
9. **Expected**: User has:
   - `workplaceId` set
   - `workplaceRole` set
   - `status: "pending"`

**Status**: ⬜ Pass ⬜ Fail

---

## Test 6: Invite Validation

### Test invalid invites:

**Test 6a: Expired Invite**
1. Create invite with 1 day expiration
2. Manually update expiry in database to past date
3. Try to register with expired invite
4. **Expected**: Error "This invite link has expired"

**Test 6b: Wrong Email**
1. Create invite for user1@example.com
2. Try to register with user2@example.com
3. **Expected**: Error "This invite was sent to a different email address"

**Test 6c: Max Uses Reached**
1. Create invite with maxUses: 1
2. Register one user successfully
3. Try to register another user with same invite
4. **Expected**: Error "This invite link has reached its maximum number of uses"

**Status**: ⬜ Pass ⬜ Fail

---

## Test 7: Audit Trail Logging

1. Generate an invite
2. Register a user with the invite
3. Approve the user
4. Navigate to Audit Trail tab
5. **Expected**: See logs for:
   - "Invite Generated"
   - "Invite Used (Pending Approval)" or "Invite Accepted"
   - "Member Approved"
6. Click expand on each log
7. **Expected**: See detailed information (before/after, metadata)

**Status**: ⬜ Pass ⬜ Fail

---

## Test 8: Email Notifications

### Check that emails are sent:

1. **Invite Email**
   - Generate invite
   - Check recipient's email
   - **Expected**: Email with invite link

2. **Verification Email**
   - Register with invite
   - Check recipient's email
   - **Expected**: Email with verification link/code

3. **Approval Email**
   - Approve pending user
   - Check user's email
   - **Expected**: Email confirming approval

4. **Rejection Email**
   - Reject pending user
   - Check user's email
   - **Expected**: Email explaining rejection

**Status**: ⬜ Pass ⬜ Fail

---

## Test 9: Statistics Update

1. Note current statistics on dashboard
2. Generate an invite
3. **Expected**: "Active Invites" count increases
4. Register a user with invite (requires approval)
5. **Expected**: "Pending Approvals" count increases
6. Approve the user
7. **Expected**: 
   - "Pending Approvals" count decreases
   - "Active Members" count increases
   - "Total Members" count increases

**Status**: ⬜ Pass ⬜ Fail

---

## Test 10: Edge Cases

**Test 10a: User Already Exists**
1. Try to register with email that already exists
2. **Expected**: Error "User already exists with this email"

**Test 10b: Invalid Invite Token**
1. Try to register with random/invalid token
2. **Expected**: Error "Invalid or expired invite link"

**Test 10c: Suspended User Login**
1. Suspend an active user
2. Try to login as that user
3. **Expected**: Error "Account is suspended. Please contact support."

**Test 10d: Unverified Email Login**
1. Register without verifying email
2. Try to login
3. **Expected**: Error "Please verify your email before logging in."

**Status**: ⬜ Pass ⬜ Fail

---

## Quick Verification Commands

### Check User Status in Database
```javascript
// MongoDB shell
use pharma_care_saas

// Find pending users
db.users.find({ status: "pending" }).pretty()

// Find users in specific workspace
db.users.find({ workplaceId: ObjectId("WORKSPACE_ID") }).pretty()

// Check invite usage
db.workspaceinvites.find({ inviteToken: "TOKEN" }).pretty()
```

### Check Audit Logs
```javascript
// Find recent audit logs
db.workspaceauditlogs.find()
  .sort({ timestamp: -1 })
  .limit(10)
  .pretty()

// Find invite-related logs
db.workspaceauditlogs.find({
  category: "invite"
}).pretty()
```

### Reset Test User (if needed)
```javascript
// Delete test user
db.users.deleteOne({ email: "test@example.com" })

// Reset invite
db.workspaceinvites.updateOne(
  { inviteToken: "TOKEN" },
  { $set: { usedCount: 0, status: "pending" } }
)
```

---

## Expected Results Summary

✅ **All tests should pass with these results:**

1. Invite generator button visible and functional
2. Pending users CANNOT login
3. Pending users appear in Pending Approvals tab
4. Approved users CAN login
5. Registration with invite assigns workspace
6. Invalid invites are rejected
7. All actions logged in audit trail
8. Email notifications sent
9. Statistics update correctly
10. Edge cases handled properly

---

## If Tests Fail

### Invite Generator Not Showing
- Check browser console for errors
- Verify frontend code was rebuilt
- Clear browser cache

### Pending User Can Still Login
- **CRITICAL**: Do not deploy!
- Check backend logs
- Verify authController changes applied
- Restart backend server

### Pending User Not in List
- Check user's `workplaceId` in database
- Verify invite token was included in registration
- Check backend logs for errors

### Emails Not Sending
- Check email service configuration
- Verify SMTP settings
- Check backend logs for email errors

---

## Sign-Off

**Tester**: ___________________
**Date**: ___________________
**Environment**: ⬜ Development ⬜ Staging ⬜ Production

**Results**:
- Test 1: ⬜ Pass ⬜ Fail
- Test 2: ⬜ Pass ⬜ Fail (CRITICAL)
- Test 3: ⬜ Pass ⬜ Fail
- Test 4: ⬜ Pass ⬜ Fail
- Test 5: ⬜ Pass ⬜ Fail
- Test 6: ⬜ Pass ⬜ Fail
- Test 7: ⬜ Pass ⬜ Fail
- Test 8: ⬜ Pass ⬜ Fail
- Test 9: ⬜ Pass ⬜ Fail
- Test 10: ⬜ Pass ⬜ Fail

**Overall**: ⬜ PASS - Ready to deploy ⬜ FAIL - Do not deploy

**Notes**:
_________________________________
_________________________________
_________________________________
