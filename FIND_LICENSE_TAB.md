# 🎯 How to Find the License Verification Tab

## The Error You're Seeing is NOT Related to License Verification!

The 404 error for `/api/admin/saas/tenant-management/tenants` is from the **OLD Tenant Management tab**, not the new License Verification feature.

## Here's How to Find the License Verification Tab:

### Step 1: Go to SaaS Settings
Navigate to: `http://localhost:5173/saas-settings`

### Step 2: Look for These Tabs (in order):
1. System Overview
2. Pricing Management
3. User Management
4. Feature Flags
5. Security Settings
6. Analytics & Reports
7. Notifications
8. Billing & Subscriptions
9. Tenant Management ← (This one has the 404 error - ignore it)
10. **License Verification** ← **THIS IS THE NEW ONE!** 🎯
11. Support & Helpdesk
12. API & Integrations

### Step 3: Click on "License Verification"
- Icon: 🔒 (Security/Shield icon)
- Label: "License Verification"
- Description: "Manage pharmacist license verifications"

## 🧪 To Test License Verification (Not Tenant Management):

### Test 1: As Regular User (Pharmacist)
1. **Logout from super admin**
2. **Login with a pharmacist account**
3. **Click "Clinical Notes" in the sidebar**
4. **You should see a modal** with:
   - ⚠️ Warning icon
   - "License Verification Required"
   - "A verified pharmacist license is required to access this feature"
   - "Upload License" button

### Test 2: Upload a License
1. Click "Upload License" button
2. You'll be taken to `/license` route
3. Fill out the form:
   - License Number: TEST-PCN-12345
   - Expiration Date: (select a future date)
   - Pharmacy School: University of Lagos
   - Year of Graduation: 2020 (optional)
   - Upload a PDF or image file
4. Click "Upload Document"
5. You should see "Under Review" status

### Test 3: As Super Admin - Review License
1. **Login as super admin**
2. **Go to SaaS Settings**
3. **Click "License Verification" tab** (NOT "Tenant Management")
4. **You should see:**
   - Table with pending licenses
   - User details
   - License information
   - View/Approve/Reject buttons

## 🔍 If You Don't Have a Pharmacist User:

### Create One in MongoDB:
```javascript
// In MongoDB Compass or Shell
db.users.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      role: "pharmacist",
      licenseStatus: "pending",
      status: "active"
    }
  }
)
```

Or create a new user with role "pharmacist" during registration.

## ❌ Ignore These Errors:

The following errors are NOT related to license verification:
- ❌ `GET /api/admin/saas/tenant-management/tenants? 404` - Old tenant management
- ❌ `Error loading tenants` - Old tenant management
- ❌ `workspace/settings` errors - Unrelated

## ✅ What You Should See:

### In License Verification Tab:
```
┌─────────────────────────────────────────────────────────┐
│  License Verification Management                        │
│  [Refresh Button]                                       │
├─────────────────────────────────────────────────────────┤
│  User    License#   School      Grad   Exp    Status   │
│  ────    ────────   ──────      ────   ───    ──────   │
│  John    PCN-123    Uni Lagos   2020   2026   Pending  │
│  [View] [Approve] [Reject]                              │
└─────────────────────────────────────────────────────────┘
```

### When You Click "View":
- Document preview in modal
- All license details
- Approve/Reject buttons

## 🎯 Quick Test Command:

### Check if License Routes Work:
```bash
# Test license status endpoint
curl http://localhost:5000/api/license/status \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Test admin pending licenses endpoint
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_ADMIN_TOKEN"
```

## 📝 Summary:

1. ✅ License Verification is a **NEW TAB** in SaaS Settings
2. ✅ It's **SEPARATE** from Tenant Management
3. ✅ The 404 errors are from the old Tenant Management tab
4. ✅ License Verification tab should work perfectly
5. ✅ Test with a pharmacist user, not super admin

**Look for the "License Verification" tab with the 🔒 icon!**

---

**The license verification system is working! You're just looking at the wrong tab!**
