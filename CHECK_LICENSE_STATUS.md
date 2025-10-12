# 🔍 Check License Status - Troubleshooting

## Current Situation:
- ✅ License Verification tab is visible and working
- ✅ Shows "No pending license verifications"
- ❓ Need to verify if pharmacist uploaded license successfully

## 🧪 Let's Check Step by Step:

### Step 1: Check if Pharmacist Uploaded License

**As Pharmacist:**
1. Login as pharmacist
2. Go to `/license` route directly
3. Check what you see:
   - If you see the upload form → License NOT uploaded yet
   - If you see "Under Review" → License uploaded successfully

### Step 2: Check Database Directly

Run this in MongoDB:

```javascript
// Check all users with licenses
db.users.find(
  { 
    role: { $in: ["pharmacist", "intern_pharmacist", "owner"] }
  },
  { 
    email: 1,
    role: 1,
    licenseStatus: 1,
    licenseNumber: 1,
    licenseDocument: 1,
    pharmacySchool: 1
  }
).pretty()
```

**Expected Results:**

**If License NOT Uploaded:**
```javascript
{
  email: "pharmacist@example.com",
  role: "pharmacist",
  licenseStatus: "pending",  // or "not_required"
  licenseNumber: null,
  licenseDocument: null,
  pharmacySchool: null
}
```

**If License Uploaded:**
```javascript
{
  email: "pharmacist@example.com",
  role: "pharmacist",
  licenseStatus: "pending",
  licenseNumber: "PCN-TEST-12345",
  licenseDocument: {
    fileName: "license.pdf",
    filePath: "/path/to/file",
    uploadedAt: ISODate("2025-10-08..."),
    fileSize: 123456,
    mimeType: "application/pdf"
  },
  pharmacySchool: "University of Lagos"
}
```

### Step 3: Check Backend Logs

When pharmacist uploads, you should see in backend terminal:
```
POST /api/license/upload 200
```

If you see 404 or 500, there's an error.

### Step 4: Test API Directly

**Test if backend endpoint works:**

```bash
# Check pending licenses endpoint
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_ADMIN_TOKEN" \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "licenses": [
      {
        "userId": "...",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "licenseNumber": "PCN-12345",
        "licenseStatus": "pending",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "pages": 1
    }
  }
}
```

## 🎯 Most Likely Scenarios:

### Scenario 1: License Not Uploaded Yet ✅
**Symptoms:**
- Admin sees "No pending license verifications"
- Pharmacist sees upload form on `/license`

**Solution:**
Pharmacist needs to upload their license:
1. Login as pharmacist
2. Go to `/license`
3. Fill out the form
4. Upload document
5. Submit

### Scenario 2: Upload Failed Silently ❌
**Symptoms:**
- Pharmacist clicked upload but got no success message
- Database shows no license document
- Backend logs show error

**Solution:**
1. Check backend logs for errors
2. Check browser console for errors
3. Try upload again with smaller file
4. Check file permissions on `backend/uploads/licenses/`

### Scenario 3: License Status is Wrong ❌
**Symptoms:**
- License uploaded but status is not "pending"
- Admin endpoint filters by status="pending"

**Solution:**
Check database and update status:
```javascript
db.users.updateOne(
  { email: "pharmacist@example.com" },
  { $set: { licenseStatus: "pending" } }
)
```

### Scenario 4: Backend Query Issue ❌
**Symptoms:**
- License exists in database
- Admin endpoint returns empty array

**Solution:**
Check backend controller query logic.

## 🔧 Quick Fixes:

### Fix 1: Manually Create Test License in Database

```javascript
// Update a pharmacist user with test license data
db.users.updateOne(
  { 
    email: "pharmacist@example.com",
    role: "pharmacist"
  },
  { 
    $set: {
      licenseStatus: "pending",
      licenseNumber: "PCN-TEST-12345",
      licenseDocument: {
        fileName: "test-license.pdf",
        filePath: "uploads/licenses/test-license.pdf",
        uploadedAt: new Date(),
        fileSize: 123456,
        mimeType: "application/pdf"
      },
      pharmacySchool: "University of Lagos",
      yearOfGraduation: 2020,
      licenseExpirationDate: new Date("2026-12-31")
    }
  }
)
```

Then refresh the License Verification tab in admin panel.

### Fix 2: Check Backend Controller

The admin controller should query:
```typescript
const query = {
  licenseStatus: 'pending',
  licenseDocument: { $exists: true }
};
```

### Fix 3: Enable Debug Logging

Add console.log in `TenantLicenseManagement.tsx`:

```typescript
const loadPendingLicenses = async () => {
  try {
    setLoading(true);
    const response = await axios.get('/api/admin/licenses/pending', {
      withCredentials: true,
    });
    
    console.log('License API Response:', response.data); // ADD THIS
    
    if (response.data.success) {
      setLicenses(response.data.data.licenses || []);
    }
  } catch (err: any) {
    console.error('License API Error:', err); // ADD THIS
    setError(err.response?.data?.message || 'Failed to load licenses');
  } finally {
    setLoading(false);
  }
};
```

## 📋 Checklist:

- [ ] Pharmacist uploaded license (check `/license` page)
- [ ] Database has license document (check MongoDB)
- [ ] License status is "pending" (check MongoDB)
- [ ] Backend endpoint returns data (test with curl)
- [ ] Frontend receives data (check browser console)
- [ ] No errors in backend logs
- [ ] No errors in browser console

## 🎯 Next Steps:

1. **First:** Login as pharmacist and check `/license` page
   - If you see upload form → Upload the license
   - If you see "Under Review" → License already uploaded

2. **Second:** Check MongoDB for license data
   - Run the query above
   - Verify licenseDocument exists

3. **Third:** Check backend logs
   - Look for POST /api/license/upload
   - Look for GET /api/admin/licenses/pending

4. **Fourth:** Test the admin API directly
   - Use curl command above
   - Check response

---

**Most likely: The pharmacist hasn't uploaded their license yet!**

Just login as pharmacist, go to `/license`, and upload the license. Then it will appear in the admin panel! 🚀
