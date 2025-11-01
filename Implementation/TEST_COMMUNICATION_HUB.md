# Communication Hub Testing Checklist

## ✅ Deployment Status

- [x] Backend restarted (nodemon)
- [x] Frontend built successfully
- [ ] Browser cache cleared
- [ ] User logged in with fresh token

## 🧪 Test Cases

### Test 1: Participant Search (Fix for Mock Data Issue)
**Expected:** Real users from database, not mock data

1. [ ] Navigate to Communication Hub
2. [ ] Click "New Conversation" button
3. [ ] Go to "Participants" step (Step 2)
4. [ ] **VERIFY:** No "Dr. Sarah Johnson" or "Dr. Michael Chen" appear
5. [ ] **VERIFY:** Real users from your database appear
6. [ ] **VERIFY:** Users have correct roles (doctor, pharmacist, patient)
7. [ ] Search for a user by name
8. [ ] **VERIFY:** Search works correctly
9. [ ] Filter by role (if available)
10. [ ] **VERIFY:** Filtering works correctly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2: Create Conversation (Fix for 401 & 404 Errors)
**Expected:** Conversation created successfully without errors

1. [ ] Click "New Conversation"
2. [ ] Step 1: Select conversation type (direct/group/patient_query)
3. [ ] Enter conversation title (optional)
4. [ ] Click "Next"
5. [ ] Step 2: Select at least one participant
6. [ ] Click "Next"
7. [ ] Step 3: Set priority and tags (optional)
8. [ ] Click "Create Conversation"
9. [ ] **VERIFY:** No 401 error appears
10. [ ] **VERIFY:** No 404 error appears
11. [ ] **VERIFY:** Success message appears
12. [ ] **VERIFY:** Conversation appears in the list
13. [ ] **VERIFY:** Can open the conversation
14. [ ] **VERIFY:** Can send a message

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3: Audit Log Tab (Fix for "Error is not a constructor")
**Expected:** Audit log loads without errors

1. [ ] Navigate to Communication Hub
2. [ ] Click on "Audit Logs" tab
3. [ ] **VERIFY:** No "Error is not a constructor" error
4. [ ] **VERIFY:** Page loads (shows logs or "No audit logs found")
5. [ ] **VERIFY:** No console errors
6. [ ] Try using filters
7. [ ] **VERIFY:** Filters work correctly
8. [ ] Try export buttons (if available)
9. [ ] **VERIFY:** Export works or shows appropriate message

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 4: Notifications Tab
**Expected:** Notifications load without errors

1. [ ] Navigate to Communication Hub
2. [ ] Click on "Notifications" tab
3. [ ] **VERIFY:** No errors appear
4. [ ] **VERIFY:** Page loads (shows notifications or "No notifications yet")
5. [ ] **VERIFY:** No console errors
6. [ ] If notifications exist:
   - [ ] Click on a notification
   - [ ] Mark as read
   - [ ] Dismiss notification
7. [ ] **VERIFY:** All actions work correctly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 5: Messages Tab (Existing Functionality)
**Expected:** Messages work as before

1. [ ] Navigate to Communication Hub
2. [ ] Click on "Messages" tab (default)
3. [ ] **VERIFY:** Conversations list loads
4. [ ] Select a conversation
5. [ ] **VERIFY:** Messages load
6. [ ] Send a test message
7. [ ] **VERIFY:** Message appears
8. [ ] **VERIFY:** No errors in console

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🔍 Browser Console Check

Open browser console (F12) and check for:

- [ ] No 401 errors
- [ ] No 404 errors
- [ ] No "Error is not a constructor" errors
- [ ] No other JavaScript errors
- [ ] API calls to `/api/communication/participants/search` succeed

---

## 📊 API Endpoint Verification

Test the new endpoint directly:

```bash
# Get authentication token from browser localStorage
# Then test the endpoint:

curl -X GET "http://localhost:5000/api/communication/participants/search?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Participants retrieved successfully",
  "data": [
    {
      "userId": "...",
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "role": "doctor|pharmacist|patient",
      "avatar": "..."
    }
  ],
  "count": 10
}
```

---

## 🐛 Known Issues to Watch For

1. **Empty Participants List**
   - Cause: No users in database or wrong workplace
   - Solution: Ensure users exist with `status: 'active'`

2. **401 Unauthorized**
   - Cause: Token expired or invalid
   - Solution: Log out and log back in

3. **404 Not Found**
   - Cause: Backend not running or route not registered
   - Solution: Restart backend, check logs

4. **Mock Data Still Showing**
   - Cause: Browser cache
   - Solution: Hard refresh (Ctrl+Shift+R), clear cache

---

## ✅ Success Criteria

All tests must pass:
- ✅ Real participants appear (no mock data)
- ✅ Conversations can be created without errors
- ✅ Audit log tab loads without errors
- ✅ Notifications tab loads without errors
- ✅ No console errors
- ✅ All existing functionality still works

---

## 📝 Test Results

**Tested By:** _________________
**Date:** _________________
**Browser:** _________________
**Environment:** Development / Staging / Production

**Overall Status:** ⬜ Not Started | 🟡 In Progress | ✅ All Passed | ❌ Failed

**Notes:**
```
[Add any observations, issues, or comments here]
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. [ ] Deploy to staging environment
2. [ ] Perform user acceptance testing
3. [ ] Deploy to production
4. [ ] Monitor error logs
5. [ ] Collect user feedback

If tests fail:
1. [ ] Document the failure
2. [ ] Check browser console for errors
3. [ ] Check backend logs
4. [ ] Review the troubleshooting guide
5. [ ] Contact development team if needed
