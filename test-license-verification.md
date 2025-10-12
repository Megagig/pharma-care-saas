# 🧪 Test License Verification - Step by Step

## ⚠️ IMPORTANT: The 404 Errors You See Are NOT From License Verification!

Those errors are from the old "Tenant Management" tab trying to load tenant data. **Ignore them!**

## ✅ Here's How to Actually Test License Verification:

### Part 1: Test as Pharmacist User

#### Step 1: Check Your User Role
First, let's verify you have a pharmacist user. In MongoDB:

```javascript
// Find all pharmacist users
db.users.find({ 
  role: { $in: ["pharmacist", "intern_pharmacist", "owner"] } 
}, { 
  email: 1, 
  role: 1, 
  licenseStatus: 1 
})
```

If you don't have one, create/update a user:

```javascript
// Update existing user to pharmacist
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { 
      role: "pharmacist",
      licenseStatus: "pending",
      status: "active",
      emailVerified: true
    }
  }
)
```

#### Step 2: Login as Pharmacist
1. Logout from super admin
2. Login with the pharmacist account
3. You should land on the dashboard

#### Step 3: Try to Access Clinical Notes
1. Look at the sidebar
2. Click on "Clinical Notes"
3. **EXPECTED RESULT:** You should see a modal popup with:
   ```
   ⚠️ License Verification Required
   
   A verified pharmacist license is required to access this feature.
   Current status: pending
   
   Your license is currently under review. You'll be notified once it's approved.
   
   [Upload License] [Back to Dashboard]
   ```

#### Step 4: Upload License
1. Click "Upload License" button
2. You'll be redirected to `/license`
3. Fill out the form:
   - **License Number:** TEST-PCN-12345 (must be unique)
   - **Expiration Date:** 2026-12-31 (future date)
   - **Pharmacy School:** University of Lagos
   - **Year of Graduation:** 2020 (optional)
   - **Document:** Upload a PDF or image (max 5MB)
4. Click "Upload Document"
5. **EXPECTED RESULT:** Success message and status shows "pending"

### Part 2: Test as Super Admin

#### Step 1: Login as Super Admin
1. Logout from pharmacist account
2. Login with super admin credentials

#### Step 2: Navigate to SaaS Settings
1. Click "SaaS Settings" in the sidebar
2. You should see multiple tabs

#### Step 3: Find License Verification Tab
**Look for this tab:**
- Icon: 🔒 (Security icon)
- Label: "License Verification"
- Position: After "Tenant Management" tab

**Screenshot of what you should see:**
```
[System Overview] [Pricing] [Users] [Features] [Security] 
[Analytics] [Notifications] [Billing] [Tenant Management] 
[License Verification] ← THIS ONE! [Support] [API]
```

#### Step 4: Click License Verification Tab
**EXPECTED RESULT:** You should see:
```
┌──────────────────────────────────────────────────────┐
│ License Verification Management        [Refresh]     │
├──────────────────────────────────────────────────────┤
│ User          License#    School         Status      │
│ ──────────    ────────    ──────         ──────      │
│ Test User     PCN-12345   Uni Lagos      Pending     │
│ [👁️ View] [✅ Approve] [❌ Reject]                    │
└──────────────────────────────────────────────────────┘
```

#### Step 5: Review a License
1. Click the "View" (👁️) icon
2. **EXPECTED RESULT:** Modal opens showing:
   - User details
   - License number
   - Pharmacy school
   - Graduation year
   - Expiration date
   - Document preview (PDF/image)
   - [Approve] and [Reject] buttons

#### Step 6: Approve the License
1. Click "Approve" button
2. Confirm the approval
3. **EXPECTED RESULT:**
   - Success message
   - License removed from pending list
   - User receives email notification

### Part 3: Verify Access Granted

#### Step 1: Login as Pharmacist Again
1. Logout from super admin
2. Login with the pharmacist account

#### Step 2: Access Protected Modules
Try accessing these modules (should work now):
1. ✅ Clinical Notes
2. ✅ Medication Therapy Review
3. ✅ Clinical Interventions
4. ✅ AI Diagnostics
5. ✅ Clinical Decision Support

**EXPECTED RESULT:** Direct access, no modal!

## 🔍 Debugging Tips:

### If Modal Doesn't Appear:
1. **Check user role:**
   ```javascript
   // In MongoDB
   db.users.findOne({ email: "your-email" }, { role: 1, licenseStatus: 1 })
   ```
   Should be: `pharmacist`, `intern_pharmacist`, or `owner`

2. **Check browser console:**
   - Press F12
   - Look for errors
   - Check Network tab for failed requests

3. **Clear cache:**
   - Use Incognito mode
   - Or clear all browser data

### If License Verification Tab Doesn't Appear:
1. **Check you're super admin:**
   ```javascript
   // In MongoDB
   db.users.findOne({ email: "your-email" }, { role: 1 })
   ```
   Should be: `super_admin`

2. **Check SaasSettings.tsx:**
   - File should have the License Verification tab config
   - Look for: `id: 'licenses'`

3. **Rebuild frontend:**
   ```bash
   cd frontend
   npm run build
   npm run dev
   ```

### If Upload Fails:
1. **Check file:**
   - Must be PDF, JPEG, PNG, or WebP
   - Must be under 5MB

2. **Check backend logs:**
   - Look for upload errors
   - Check file permissions on `backend/uploads/licenses/`

3. **Check all fields filled:**
   - License Number (required)
   - Expiration Date (required)
   - Pharmacy School (required)
   - Document (required)

## 📊 API Endpoints to Test:

### Test License Status:
```bash
curl http://localhost:5000/api/license/status \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

### Test Pending Licenses (Admin):
```bash
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_ADMIN_TOKEN"
```

### Test License Upload:
```bash
curl -X POST http://localhost:5000/api/license/upload \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -F "licenseDocument=@/path/to/license.pdf" \
  -F "licenseNumber=TEST-123" \
  -F "licenseExpirationDate=2026-12-31" \
  -F "pharmacySchool=University of Lagos" \
  -F "yearOfGraduation=2020"
```

## ✅ Success Checklist:

- [ ] Pharmacist user exists in database
- [ ] Backend is running with latest build
- [ ] Frontend is running
- [ ] Browser cache cleared
- [ ] Modal appears when accessing Clinical Notes
- [ ] Can upload license successfully
- [ ] License Verification tab visible in SaaS Settings
- [ ] Can view pending licenses as admin
- [ ] Can approve/reject licenses
- [ ] Approved user can access protected modules

---

**Remember: The 404 errors are from the OLD Tenant Management tab, NOT the new License Verification feature!**
