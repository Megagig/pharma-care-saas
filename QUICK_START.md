# Quick Start - License Verification System

## 🚀 To See the Changes, Follow These Steps:

### Step 1: Stop the Backend
Press `Ctrl+C` in your backend terminal to stop the server.

### Step 2: Rebuild the Backend
```bash
cd backend
npm run build
```

### Step 3: Restart the Backend
```bash
npm run dev
# OR for production
npm run start
```

### Step 4: Verify the Changes

#### Test 1: Check License Routes
Open a new terminal and run:
```bash
curl http://localhost:5000/api/license/status \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

#### Test 2: Check Admin License Endpoint
```bash
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_ADMIN_TOKEN"
```

### Step 5: Test in Browser

1. **Login as a Pharmacist/Owner**
2. **Navigate to Clinical Notes** (`/notes`)
3. **You should see the license verification modal**
4. **Click "Upload License"**
5. **Fill out the form with:**
   - License Number
   - Expiration Date
   - Pharmacy School
   - Year of Graduation (optional)
   - Upload a PDF or image

6. **Login as Super Admin**
7. **Go to SaaS Settings**
8. **Click "License Verification" tab**
9. **You should see the pending license**

## 🔍 If You Still Don't See Changes:

### Clear Browser Cache
```bash
# In browser console (F12)
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

### Rebuild Frontend
```bash
cd frontend
npm run build
npm run dev
```

### Check Database Migration
```bash
cd backend
npx ts-node src/migrations/add-license-fields.ts
```

### Verify User Model
```bash
# Connect to MongoDB
mongo
use pharmily
db.users.findOne({}, { pharmacySchool: 1, yearOfGraduation: 1, licenseStatus: 1 })
```

## 📝 Expected Behavior:

### For Users with Pharmacist/Intern Pharmacist/Owner Role:
- ✅ When accessing Clinical Notes → See license modal
- ✅ When accessing MTR → See license modal
- ✅ When accessing Clinical Interventions → See license modal
- ✅ When accessing AI Diagnostics → See license modal
- ✅ When accessing Clinical Decision Support → See license modal

### For Super Admin:
- ✅ New "License Verification" tab in SaaS Settings
- ✅ Can view all pending licenses
- ✅ Can approve/reject licenses
- ✅ Can preview documents

## 🐛 Troubleshooting:

### Issue: "404 Not Found" for tenant-management
**Solution**: The TenantManagement component is working fine. The 404 is expected if you don't have tenants yet. The License Verification tab is separate.

### Issue: No license modal appears
**Check:**
1. User role is pharmacist/intern_pharmacist/owner
2. Backend is rebuilt and restarted
3. Browser cache is cleared
4. Check browser console for errors

### Issue: Can't see License Verification tab
**Check:**
1. Logged in as super_admin
2. In SaaS Settings page
3. Look for tab with SecurityIcon

## 📞 Quick Test Commands:

### Create a Test User (Pharmacist)
```bash
# In MongoDB
mongo
use pharmily
db.users.insertOne({
  email: "test.pharmacist@example.com",
  firstName: "Test",
  lastName: "Pharmacist",
  role: "pharmacist",
  passwordHash: "$2a$12$...", // Use bcrypt to hash "password123"
  status: "active",
  emailVerified: true,
  licenseStatus: "pending",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Check License Status
```bash
# In MongoDB
mongo
use pharmily
db.users.find({ role: { $in: ["pharmacist", "intern_pharmacist", "owner"] } }, { email: 1, licenseStatus: 1, pharmacySchool: 1 })
```

---

**IMPORTANT**: You MUST rebuild the backend for changes to take effect!

```bash
cd backend
npm run build
npm run dev
```
