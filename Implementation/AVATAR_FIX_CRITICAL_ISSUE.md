# CRITICAL FIX: Avatar Display Issue

## The Real Problem

The backend was returning HTML instead of image files when accessing `/uploads/avatars/*` URLs.

### Root Cause

The **catch-all route** in `backend/src/app.ts` was intercepting `/uploads` requests BEFORE the static file middleware could handle them:

```typescript
// This was catching /uploads requests!
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {  // ❌ Only excluded /api, not /uploads
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  }
});
```

## The Fix

### 1. Fixed Static File Path (backend/src/app.ts)

Changed from relative to absolute path:

```typescript
// BEFORE (relative path - unreliable)
app.use('/uploads', express.static('uploads', { ... }));

// AFTER (absolute path - reliable)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), { ... }));
```

### 2. Fixed Catch-All Route (backend/src/app.ts)

Excluded `/uploads` from the catch-all route:

```typescript
// BEFORE
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {  // ❌ Missing /uploads check
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  }
});

// AFTER
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {  // ✅ Excludes both
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  } else {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  }
});
```

## Testing the Fix

### 1. Restart Backend Server
```bash
# Stop the backend (Ctrl+C)
# Start it again
cd backend
npm run dev
```

### 2. Test Direct File Access
```bash
# Should return image data, not HTML
curl -I http://localhost:5000/uploads/avatars/[your-file].jpg

# Should show: Content-Type: image/jpeg
# NOT: Content-Type: text/html
```

### 3. Test in Browser
1. Go to Settings > Profile
2. Upload a new avatar
3. Avatar should display immediately
4. Check browser console - no errors
5. Check Network tab - image should load with 200 status

## Why This Happened

Express middleware is executed in order:
1. API routes (`/api/*`)
2. Static file serving (`/uploads`)
3. **Catch-all route (`*`)** ← This was catching /uploads!

The catch-all route needs to explicitly exclude both `/api` and `/uploads` paths.

## Files Modified

1. ✅ `backend/src/app.ts` - Fixed static file path and catch-all route
2. ✅ `frontend/src/utils/avatarUtils.ts` - Created utility for avatar URLs
3. ✅ `frontend/src/queries/userSettingsQueries.ts` - Added cache invalidation
4. ✅ `frontend/src/components/settings/ProfileTab.tsx` - Uses avatar utility

## Verification

After restarting the backend, verify:

```bash
# 1. Check file exists
ls -la backend/uploads/avatars/

# 2. Test direct access (should return image, not HTML)
curl http://localhost:5000/uploads/avatars/[filename].jpg --output /tmp/test.jpg
file /tmp/test.jpg  # Should say "JPEG image data" not "HTML document"

# 3. Check in browser
# Open: http://localhost:5000/uploads/avatars/[filename].jpg
# Should display the image, not a blank page or HTML
```

## Success Criteria

- ✅ Direct URL access shows image (not HTML)
- ✅ Avatar displays in Settings page
- ✅ No console errors
- ✅ Network tab shows 200 status for image
- ✅ Content-Type is image/jpeg (not text/html)
