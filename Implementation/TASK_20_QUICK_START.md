# Task 20: Quick Start Guide

## 🚀 Quick Testing in 5 Minutes

### Step 1: Verify Implementation (30 seconds)
```bash
./verify-task-20-implementation.sh
```
**Expected:** ✅ All 29 checks passed

---

### Step 2: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

---

### Step 3: Verify Servers Running (30 seconds)
```bash
./test-admin-feature-management-integration.sh
```
**Expected:** Backend and frontend both running

---

### Step 4: Quick Manual Test (3 minutes)

1. **Login:** http://localhost:5173/login (use super_admin account)

2. **Navigate:** Click "Feature Management" in sidebar

3. **Create Feature:**
   - Click "Add Feature"
   - Key: `quick_test`
   - Name: `Quick Test Feature`
   - Check: `basic`, `pro` tiers
   - Check: `pharmacist`, `owner` roles
   - Click "Save"

4. **Verify:** Feature appears in list with correct badges

5. **Edit:** Click Edit, change description, click Update

6. **Matrix:** Switch to "Tier Management" tab, toggle a tier

7. **Delete:** Go back to Features tab, click Delete, confirm

8. **Access Control:** Logout, login as regular user, try to access `/admin/feature-management` (should be blocked)

---

### Step 5: Run E2E Tests (1 minute)
```bash
cd frontend && npm run test:e2e
```
**Expected:** All tests pass

---

## ✅ Success Criteria

- [ ] Verification script: 29/29 checks passed
- [ ] Servers running without errors
- [ ] Can create, edit, delete features
- [ ] Matrix toggles work
- [ ] Non-admin blocked from access
- [ ] E2E tests pass
- [ ] No console errors

---

## 📋 Full Testing

For comprehensive testing, see: **TASK_20_INTEGRATION_TEST_GUIDE.md**

---

## 🔧 Troubleshooting

**Backend won't start:**
```bash
cd backend && npm install && npm run dev
```

**Frontend won't start:**
```bash
cd frontend && npm install && npm run dev
```

**Can't login as super_admin:**
- Check if you have a super_admin user
- Create one using backend scripts if needed

**Routes return 404:**
- Verify `featureFlagRoutes` is registered in `backend/src/app.ts`
- Restart backend server

---

## 📊 Status

**Implementation:** ✅ Complete (29/29 checks passed)  
**Manual Testing:** ⏳ Ready to execute  
**E2E Testing:** ⏳ Ready to execute  

---

## 📁 Key Files

- **Verification:** `verify-task-20-implementation.sh`
- **Integration Test:** `test-admin-feature-management-integration.sh`
- **Full Guide:** `TASK_20_INTEGRATION_TEST_GUIDE.md`
- **Summary:** `TASK_20_COMPLETION_SUMMARY.md`

---

**Last Updated:** October 10, 2025  
**Task Status:** ✅ Complete
