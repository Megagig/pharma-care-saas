# 🔧 Fix Broken License Documents

## 🎯 Problem Identified!

The debug script revealed:
```
Has Document: YES
Document File: undefined
Uploaded At: undefined
```

**This means:**
- Users uploaded licenses BEFORE the new fields were added
- The `licenseDocument` object exists but is empty `{}`
- The admin query requires `fileName` to exist, so it returns 0 results

## ✅ Solution:

### Step 1: Clean Up Broken Documents

Run this script to remove broken license documents:

```bash
cd backend
npx ts-node scripts/fixLicenseDocuments.ts
```

**This will:**
- Find all users with broken `licenseDocument` (missing fileName)
- Remove the broken documents
- Allow users to re-upload with the new form

### Step 2: Users Re-Upload Licenses

After running the fix script, users need to upload their licenses again with the NEW form that includes:
- ✅ License Number
- ✅ Expiration Date
- ✅ Pharmacy School
- ✅ Year of Graduation (optional)
- ✅ Document file

### Step 3: Verify Fix

After users re-upload:

1. **Check database:**
   ```bash
   npx ts-node scripts/checkLicenseData.ts
   ```
   
   Should now show:
   ```
   Has Document: YES
   Document File: license-xxxxx-xxxxx.pdf  ← Should have filename!
   Uploaded At: 2025-10-08...  ← Should have date!
   ```

2. **Check admin panel:**
   - Login as super admin
   - Go to SaaS Settings → License Verification
   - Should see pending licenses!

## 🎯 Why This Happened:

1. **Old uploads:** Users uploaded licenses before migration
2. **Schema mismatch:** Old uploads didn't have the new required fields
3. **Empty objects:** MongoDB created `licenseDocument: {}` instead of `null`
4. **Query fails:** Admin query checks `licenseDocument: { $exists: true }` but also needs `fileName` to exist

## 📋 Step-by-Step Fix:

### For You (Admin):

```bash
# 1. Run the fix script
cd backend
npx ts-node scripts/fixLicenseDocuments.ts

# 2. Verify it worked
npx ts-node scripts/checkLicenseData.ts
```

### For Users (Pharmacists):

1. Login to the system
2. Go to `/license` route
3. You'll see the upload form again (old document was removed)
4. Fill out ALL fields:
   - License Number: 017606 (or their number)
   - Expiration Date: (select future date)
   - Pharmacy School: University of Lagos (or their school)
   - Year of Graduation: 2020 (optional)
5. Upload document (PDF or image)
6. Click "Upload Document"
7. Should see "Upload Successful" message

### For You (Admin) - After Re-upload:

1. Go to SaaS Settings
2. Click "License Verification" tab
3. **Should now see the pending licenses!** ✅
4. Click "View" to see document
5. Click "Approve" to approve

## 🔍 Alternative: Manual Database Fix

If you want to keep existing license numbers and just fix the documents, you can manually update in MongoDB:

```javascript
// For each user, update their licenseDocument properly
db.users.updateOne(
  { email: "megagigsolution@gmail.com" },
  { 
    $set: {
      licenseDocument: {
        fileName: "license-megagig.pdf",
        filePath: "uploads/licenses/license-megagig.pdf",
        uploadedAt: new Date(),
        fileSize: 0,
        mimeType: "application/pdf"
      },
      pharmacySchool: "University of Lagos",
      licenseExpirationDate: new Date("2026-12-31")
    }
  }
)
```

But it's easier to just have users re-upload with the new form!

## ✅ Expected Results After Fix:

### Before Fix:
```
=== Pending Licenses with Documents ===
Found 0 pending licenses  ← Problem!
```

### After Fix + Re-upload:
```
=== Pending Licenses with Documents ===
Found 4 pending licenses  ← Fixed!

1. Megagig Solution (megagigsolution@gmail.com)
   License Number: 017606
   Document: license-xxxxx-xxxxx.pdf  ← Has filename!
```

### Admin Panel After Fix:
```
┌────────────────────────────────────────────────────┐
│ License Verification Management    [Refresh]       │
├────────────────────────────────────────────────────┤
│ User              License#   School      Status    │
│ ────────────      ────────   ──────      ──────    │
│ Megagig Solution  017606     Uni Lagos   Pending   │
│ [View] [Approve] [Reject]                          │
│                                                     │
│ Linus Ezeode      029045     Uni Lagos   Pending   │
│ [View] [Approve] [Reject]                          │
└────────────────────────────────────────────────────┘
```

## 🚀 Quick Commands:

```bash
# Fix broken documents
cd backend
npx ts-node scripts/fixLicenseDocuments.ts

# Verify fix
npx ts-node scripts/checkLicenseData.ts

# Check admin API
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

**Run the fix script, then have users re-upload their licenses!** 🔧
