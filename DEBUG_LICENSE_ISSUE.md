# 🔍 Debug License Issue - Why Admin Can't See Pending License

## Current Situation:
- ✅ Pharmacist uploaded license (License #07006)
- ✅ Status shows "PENDING" on pharmacist's page
- ❌ Admin panel shows "No pending license verifications"

## 🧪 Let's Debug:

### Step 1: Check Database Directly

Run this script to see what's in the database:

```bash
cd backend
npx ts-node scripts/checkLicenseData.ts
```

**This will show:**
- All pharmacist users
- Their license status
- Whether they have a document uploaded
- Specifically which licenses are pending with documents

### Step 2: Check Backend API Response

Test the admin API directly:

```bash
# Get your admin access token from browser cookies
# Then run:
curl http://localhost:5000/api/admin/licenses/pending \
  -H "Cookie: accessToken=YOUR_TOKEN; refreshToken=YOUR_REFRESH_TOKEN" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "licenses": [
      {
        "userId": "...",
        "userName": "User Name",
        "userEmail": "user@example.com",
        "licenseNumber": "07006",
        "licenseStatus": "pending",
        ...
      }
    ]
  }
}
```

### Step 3: Check Frontend API Call

Add debug logging to `TenantLicenseManagement.tsx`:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the License Verification tab
4. Look for:
   - Network request to `/api/admin/licenses/pending`
   - Response data
   - Any errors

## 🎯 Possible Issues:

### Issue 1: License Document Not Saved
**Symptom:** Database shows `licenseDocument: null`

**Solution:**
The upload might have failed. Check:
1. Backend logs for upload errors
2. File permissions on `backend/uploads/licenses/`
3. Try uploading again

### Issue 2: License Status Not "pending"
**Symptom:** Database shows different status

**Solution:**
Update in MongoDB:
```javascript
db.users.updateOne(
  { licenseNumber: "07006" },
  { $set: { licenseStatus: "pending" } }
)
```

### Issue 3: API Route Not Working
**Symptom:** API returns 404 or 500

**Solution:**
1. Check backend is running
2. Check route is registered in `app.ts`
3. Check admin middleware is working

### Issue 4: Frontend Not Calling API
**Symptom:** No network request in DevTools

**Solution:**
Check `TenantLicenseManagement.tsx` is mounted and calling `loadPendingLicenses()`

## 🔧 Quick Fixes:

### Fix 1: Manually Verify License in Database

```javascript
// In MongoDB
db.users.findOne({ licenseNumber: "07006" })
```

Check if:
- `licenseStatus` is "pending"
- `licenseDocument` exists and has data
- `licenseDocument.fileName` is set
- `licenseDocument.filePath` is set

### Fix 2: Force Refresh Admin Panel

1. In admin panel, click the "Refresh" button
2. Or reload the page (Ctrl+R)
3. Check browser console for errors

### Fix 3: Test with MongoDB Query

```javascript
// This is exactly what the backend does
db.users.find({
  licenseStatus: "pending",
  licenseDocument: { $exists: true }
}).pretty()
```

If this returns the user, the backend should too.

### Fix 4: Check Backend Logs

When you refresh the admin panel, you should see in backend logs:
```
GET /api/admin/licenses/pending 200
```

If you see 404 or 500, there's an error.

## 📋 Debugging Checklist:

- [ ] Run `checkLicenseData.ts` script
- [ ] Verify user has `licenseDocument` in database
- [ ] Verify `licenseStatus` is "pending"
- [ ] Test API with curl
- [ ] Check browser Network tab
- [ ] Check browser Console for errors
- [ ] Check backend logs
- [ ] Try clicking Refresh button in admin panel

## 🎯 Most Likely Cause:

Based on the screenshot, the license was uploaded successfully (you can see License #07006 and "Under Review" message). 

**The most likely issue is:**
1. The `licenseDocument` field might not be properly saved in the database
2. Or the admin API is not querying correctly

**Run the debug script to confirm:**
```bash
cd backend
npx ts-node scripts/checkLicenseData.ts
```

This will show exactly what's in the database and help us identify the issue!

---

**Run the script and share the output!** 🔍
