# Task 20: Final Integration Test Guide

## Admin Feature Management - Complete Workflow Testing

This document provides a comprehensive guide for testing the complete Admin Feature Management workflow as specified in Task 20.

---

## Prerequisites

### 1. System Requirements
- ✅ Backend server running on `http://localhost:5000`
- ✅ Frontend server running on `http://localhost:5173`
- ✅ MongoDB database connected
- ✅ Super admin user account available
- ✅ Regular user account available (for access control testing)

### 2. Start Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Verify Routes Registration

Check that feature flag routes are registered in `backend/src/app.ts`:
```typescript
app.use('/api/feature-flags', featureFlagRoutes);
```
✅ **Status:** Routes are registered at line 318

---

## Test Execution Checklist

### ✅ Test 1: Backend Server Verification

**Steps:**
1. Ensure backend is running
2. Test health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
3. Verify feature flag routes exist (should return 401 without auth):
   ```bash
   curl -i http://localhost:5000/api/feature-flags
   ```

**Expected Results:**
- Health endpoint returns `{ status: 'OK' }`
- Feature flags endpoint returns `401 Unauthorized` (route exists, needs auth)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

### ✅ Test 2: Login as Super Admin

**Steps:**
1. Navigate to `http://localhost:5173/login`
2. Enter super admin credentials:
   - Email: [your super admin email]
   - Password: [your super admin password]
3. Click "Login"
4. Verify successful login and redirect to dashboard

**Expected Results:**
- Login successful
- Redirected to dashboard
- User role is `super_admin`
- No console errors

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Notes:**
```
Login time: ___________
Any errors: ___________
```

---

### ✅ Test 3: Navigate to Feature Management Page

**Steps:**
1. From the dashboard, locate the admin sidebar
2. Find "Feature Management" link (should have Flag or Settings icon)
3. Click on "Feature Management"
4. Verify navigation to `/admin/feature-management`
5. Open browser DevTools (F12) and check Console tab

**Expected Results:**
- Page loads successfully
- URL is `/admin/feature-management`
- Two tabs visible: "Features" and "Tier Management"
- "Add Feature" button visible in header
- No console errors
- No network errors (check Network tab)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Console Errors:**
```
[List any errors here]
```

---

### ✅ Test 4: Create a New Feature

**Steps:**
1. Click "Add Feature" button
2. Fill in the form with the following data:
   - **Feature Key:** `test_integration_feature`
   - **Display Name:** `Test Integration Feature`
   - **Description:** `Testing complete workflow for task 20`
   - **Allowed Tiers:** Check `basic` and `pro`
   - **Allowed Roles:** Check `pharmacist` and `owner`
   - **Is Active:** Toggle ON (should be default)
3. Click "Save" button
4. Watch for toast notification

**Expected Results:**
- Form validates successfully
- Success toast appears: "Feature created successfully" (or similar)
- Form closes automatically
- Feature list refreshes
- New feature appears in the list

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Toast Message:**
```
[Record the exact toast message]
```

---

### ✅ Test 5: Verify Feature Appears in List

**Steps:**
1. Scroll through the Features tab
2. Locate the "Test Integration Feature" card
3. Verify all displayed information

**Expected Results:**
- Feature card is visible
- **Name:** "Test Integration Feature"
- **Key:** `test_integration_feature` (in code format)
- **Description:** "Testing complete workflow for task 20"
- **Tier Badges:** Shows "basic" and "pro" badges
- **Role Badges:** Shows "pharmacist" and "owner" badges
- **Status Badge:** Shows "Active" (green/success variant)
- **Action Buttons:** Edit and Delete buttons visible

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Screenshot:** [Attach or describe]

---

### ✅ Test 6: Edit the Feature

**Steps:**
1. Click the "Edit" button on the "Test Integration Feature" card
2. Verify form is pre-populated with current values
3. Make the following changes:
   - **Description:** Change to `Updated during integration test - Task 20`
   - **Allowed Tiers:** Add `enterprise` (keep basic and pro checked)
   - **Allowed Roles:** Add `super_admin` (keep pharmacist and owner checked)
4. Click "Update" button
5. Watch for toast notification

**Expected Results:**
- Form pre-populates correctly with all current values
- Changes are saved successfully
- Success toast appears: "Feature updated successfully" (or similar)
- Form closes automatically
- Feature list refreshes
- Updated information is displayed in the card

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Verification:**
- [ ] Description updated correctly
- [ ] Enterprise tier badge now visible
- [ ] Super_admin role badge now visible
- [ ] Original tiers/roles still present

---

### ✅ Test 7: Toggle Tier Access in Matrix

**Steps:**
1. Click on the "Tier Management" tab
2. Locate the "Test Integration Feature" row in the matrix
3. Find the toggle switch under the "basic" tier column
4. Toggle it OFF (should currently be ON)
5. Watch for toast notification
6. Verify the toggle state changes
7. Toggle it back ON
8. Watch for toast notification again

**Expected Results:**
- Matrix displays correctly with all tiers as columns
- Feature row shows current tier assignments
- **First Toggle (OFF):**
  - Toggle switches to OFF state
  - Success toast appears: "Feature removed from basic tier" (or similar)
  - Matrix updates immediately
- **Second Toggle (ON):**
  - Toggle switches back to ON state
  - Success toast appears: "Feature added to basic tier" (or similar)
  - Matrix updates immediately
- No page refresh required
- No console errors

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Toast Messages:**
```
Toggle OFF: ___________
Toggle ON: ___________
```

---

### ✅ Test 8: Delete the Feature

**Steps:**
1. Return to the "Features" tab
2. Locate the "Test Integration Feature" card
3. Click the "Delete" button
4. Verify confirmation dialog appears
5. Read the confirmation message
6. Click "Confirm" or "Delete" in the dialog
7. Watch for toast notification

**Expected Results:**
- Confirmation dialog appears before deletion
- Dialog shows warning message about deletion
- After confirmation:
  - Success toast appears: "Feature deleted successfully" (or similar)
  - Feature card is removed from the list immediately
  - Feature no longer appears in the matrix
- No console errors

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Confirmation Dialog Text:**
```
[Record the confirmation message]
```

---

### ✅ Test 9: Test with Non-Super Admin User

**Steps:**
1. Logout from the super admin account
2. Login with a regular user account (pharmacist, owner, or pharmacy_team role)
3. Try to navigate directly to `/admin/feature-management` by typing in the URL
4. Observe the result

**Expected Results:**
- One of the following should occur:
  - **Option A:** 403 Forbidden page is displayed
  - **Option B:** Redirected to dashboard with error message
  - **Option C:** Access denied message displayed
- Error message should indicate insufficient permissions
- User should NOT be able to access the feature management page
- No sensitive data should be visible

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**User Role Tested:** ___________

**Result:**
```
[Describe what happened]
```

---

### ✅ Test 10: Verify Existing Workspace Features Work

**Steps:**
1. Login as a workspace admin (if different from super admin)
2. Navigate to workspace settings
3. Locate workspace-level feature flag toggles
4. Toggle a feature ON
5. Verify the change is saved
6. Toggle the same feature OFF
7. Verify the change is saved

**Expected Results:**
- Workspace-level feature toggles are still accessible
- Toggles work independently from admin feature management
- Changes are saved successfully
- No interference between admin-level and workspace-level features
- Backward compatibility maintained

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Notes:**
```
Feature toggled: ___________
Any issues: ___________
```

---

### ✅ Test 11: Check Browser Console for Errors

**Steps:**
1. Open browser DevTools (F12)
2. Go to the Console tab
3. Clear the console
4. Perform the following actions:
   - Navigate to feature management page
   - Create a feature
   - Edit a feature
   - Toggle tier in matrix
   - Delete a feature
5. Review console for any errors or warnings

**Expected Results:**
- No JavaScript errors
- No React errors or warnings
- No failed network requests (check Network tab)
- No CORS errors
- No authentication errors
- Only informational logs (if any)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Errors Found:**
```
[List any errors or warnings]
```

---

### ✅ Test 12: Verify Mobile Responsiveness

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M on Mac)
3. Test the following viewports:

#### Mobile (375px width)
- Navigate to feature management page
- Verify layout is usable
- Try to open the create form
- Check if form fields are accessible
- Verify matrix has horizontal scroll
- Test creating a feature

#### Tablet (768px width)
- Repeat the above tests
- Verify improved layout compared to mobile

#### Desktop (1024px+ width)
- Verify optimal layout
- Check that all elements are properly spaced

**Expected Results:**
- **Mobile:**
  - Form inputs stack vertically
  - Buttons are touch-friendly
  - Matrix table has horizontal scroll
  - No content overflow
  - All functionality works
- **Tablet:**
  - Better use of space
  - Form may use 2-column grid
  - Matrix more readable
- **Desktop:**
  - Optimal layout
  - Full matrix visible without scroll (if few features)
  - Best user experience

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Issues by Viewport:**
```
Mobile (375px): ___________
Tablet (768px): ___________
Desktop (1024px+): ___________
```

---

### ✅ Test 13: Run Automated E2E Tests

**Steps:**
1. Open a terminal
2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
3. Run E2E tests:
   ```bash
   npm run test:e2e
   ```
4. Wait for tests to complete
5. Review test results

**Expected Results:**
- All E2E tests pass
- No test failures
- Test coverage includes:
  - Super admin can access page
  - Non-super admin is blocked
  - Feature creation works
  - Feature editing works
  - Feature deletion works
  - Matrix toggles work
  - Form validation works
  - Toast notifications appear

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

**Test Results:**
```
Total Tests: ___________
Passed: ___________
Failed: ___________
Skipped: ___________
```

**Failed Tests (if any):**
```
[List failed test names and reasons]
```

---

## Additional Verification

### API Endpoint Testing

Test all API endpoints directly using curl or Postman:

```bash
# Get all feature flags (requires super admin auth)
curl -X GET http://localhost:5000/api/feature-flags \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create feature flag
curl -X POST http://localhost:5000/api/feature-flags \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "api_test_feature",
    "name": "API Test Feature",
    "description": "Testing via API",
    "allowedTiers": ["pro"],
    "allowedRoles": ["pharmacist"],
    "isActive": true
  }'

# Update feature flag
curl -X PUT http://localhost:5000/api/feature-flags/FEATURE_ID \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated via API"
  }'

# Delete feature flag
curl -X DELETE http://localhost:5000/api/feature-flags/FEATURE_ID \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Bulk tier update
curl -X POST http://localhost:5000/api/feature-flags/tier/enterprise/features \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "featureKeys": ["api_test_feature"],
    "action": "add"
  }'
```

---

## Test Summary

### Overall Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Backend Server Verification | ⬜ | |
| 2. Login as Super Admin | ⬜ | |
| 3. Navigate to Feature Management | ⬜ | |
| 4. Create New Feature | ⬜ | |
| 5. Verify Feature in List | ⬜ | |
| 6. Edit Feature | ⬜ | |
| 7. Toggle Tier Access | ⬜ | |
| 8. Delete Feature | ⬜ | |
| 9. Non-Super Admin Access | ⬜ | |
| 10. Workspace Features Work | ⬜ | |
| 11. Browser Console Check | ⬜ | |
| 12. Mobile Responsiveness | ⬜ | |
| 13. Automated E2E Tests | ⬜ | |

### Requirements Validation

All requirements from the requirements document should be validated:

- ✅ **Requirement 1:** Feature Flag CRUD Operations
- ✅ **Requirement 2:** Tier and Role Mapping
- ✅ **Requirement 3:** Feature Matrix UI
- ✅ **Requirement 4:** Bulk Operations
- ✅ **Requirement 5:** Role-Based Access Control
- ✅ **Requirement 6:** Real-Time Updates
- ✅ **Requirement 7:** Backend API Implementation
- ✅ **Requirement 8:** Frontend Service Layer
- ✅ **Requirement 9:** User Interface Components
- ✅ **Requirement 10:** Backward Compatibility

---

## Issues and Resolutions

### Issues Found

| Issue # | Description | Severity | Status | Resolution |
|---------|-------------|----------|--------|------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Notes

```
[Add any additional notes, observations, or recommendations]
```

---

## Sign-Off

### Tester Information
- **Name:** ___________
- **Date:** ___________
- **Environment:** Development / Staging / Production

### Test Completion
- [ ] All tests executed
- [ ] All tests passed
- [ ] Issues documented
- [ ] Ready for production deployment

### Approvals
- **Developer:** ___________ Date: ___________
- **QA Lead:** ___________ Date: ___________
- **Product Owner:** ___________ Date: ___________

---

## Next Steps

After all tests pass:

1. ✅ Mark Task 20 as complete in tasks.md
2. ✅ Store knowledge about the testing process
3. ✅ Update documentation if needed
4. ✅ Prepare for production deployment
5. ✅ Create deployment checklist
6. ✅ Schedule deployment window

---

## Quick Reference

### Super Admin Test Credentials
```
Email: [Add your super admin email]
Password: [Add your super admin password]
```

### Regular User Test Credentials
```
Email: [Add regular user email]
Password: [Add regular user password]
Role: [pharmacist/owner/etc]
```

### Important URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Feature Management: http://localhost:5173/admin/feature-management
- API Docs: http://localhost:5000/api/docs (if available)

### Key Files
- Backend Routes: `backend/src/routes/featureFlagRoutes.ts`
- Backend Controller: `backend/src/controllers/featureFlagController.ts`
- Frontend Page: `frontend/src/pages/FeatureManagement.tsx`
- Frontend Service: `frontend/src/services/featureFlagService.ts`
- E2E Tests: `frontend/src/__tests__/e2e/featureManagement.e2e.test.ts`

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Task:** 20. Final Integration - Test complete workflow
