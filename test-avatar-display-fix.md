# Avatar Display Fix - Testing Guide

## Quick Test Steps

### 1. Start the Application
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

### 2. Test Avatar Upload

1. **Login to the application**
   - Navigate to `http://localhost:5173`
   - Login with your credentials

2. **Go to Settings**
   - Click on your profile or navigate to Settings
   - Go to the "Profile" tab

3. **Upload an Avatar**
   - Click the camera icon on the avatar placeholder
   - Select an image file (JPEG, PNG, GIF, or WebP)
   - Maximum file size: 5MB

4. **Verify the Fix**
   - ✅ Success toast notification should appear
   - ✅ Avatar should display immediately in the UI
   - ✅ No need to refresh the page
   - ✅ Avatar should show the uploaded image

### 3. Verify Persistence

1. **Refresh the page** (F5 or Ctrl+R)
   - Avatar should still be visible
   - Image should load from the server

2. **Check Browser DevTools**
   - Open DevTools (F12)
   - Go to Network tab
   - Filter by "Img"
   - You should see a request to `/uploads/avatars/[uuid-filename].jpg`
   - The URL should have a timestamp parameter like `?t=1234567890`

### 4. Check Backend Storage

1. **Verify file exists on server**
   ```bash
   ls -la backend/uploads/avatars/
   ```
   - You should see your uploaded image file with a UUID filename

2. **Check file permissions**
   ```bash
   # File should be readable
   ls -l backend/uploads/avatars/
   ```

## Expected Behavior

### Before the Fix
- ❌ Avatar uploaded successfully but didn't show in UI
- ❌ Had to refresh page multiple times
- ❌ Browser cached old avatar image
- ❌ React Query cache not updated

### After the Fix
- ✅ Avatar displays immediately after upload
- ✅ No page refresh needed
- ✅ Cache-busting prevents browser caching issues
- ✅ React Query cache properly invalidated
- ✅ Consistent behavior across the app

## Troubleshooting

### Avatar Still Not Showing?

1. **Check Browser Console**
   ```
   F12 > Console tab
   Look for any errors related to image loading
   ```

2. **Check Network Tab**
   ```
   F12 > Network tab > Filter: Img
   - Is the image request being made?
   - What's the response status? (should be 200)
   - Is the URL correct?
   ```

3. **Verify Backend is Serving Static Files**
   ```bash
   # Test direct access to uploaded file
   curl http://localhost:5000/uploads/avatars/[filename].jpg
   ```

4. **Check File Permissions**
   ```bash
   # Ensure uploads directory is readable
   chmod -R 755 backend/uploads/
   ```

5. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete > Clear cached images and files
   ```

### Common Issues

**Issue**: "No file uploaded" error
- **Solution**: Make sure you're selecting a valid image file

**Issue**: "File size must be less than 5MB"
- **Solution**: Compress your image or choose a smaller file

**Issue**: 404 error when loading avatar
- **Solution**: Check that backend is running and serving static files

**Issue**: Avatar shows old image
- **Solution**: Hard refresh (Ctrl+F5) or clear browser cache

## API Endpoints

### Upload Avatar
```
POST /api/user/settings/profile/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- avatar: [image file]

Response:
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "avatar": "/uploads/avatars/uuid-filename.jpg"
  }
}
```

### Get User Profile
```
GET /api/user/settings/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "avatar": "/uploads/avatars/uuid-filename.jpg",
    ...
  }
}
```

## Success Criteria

- [x] Avatar uploads successfully
- [x] Avatar displays immediately in UI
- [x] No page refresh required
- [x] Avatar persists after page refresh
- [x] File is saved in backend/uploads/avatars/
- [x] Success toast notification appears
- [x] No console errors
- [x] Network request shows 200 status
- [x] Cache-busting parameter in URL

## Next Steps

If everything works correctly:
1. Test with different image formats (JPEG, PNG, GIF, WebP)
2. Test with different file sizes (up to 5MB)
3. Test on different browsers (Chrome, Firefox, Safari)
4. Consider applying the avatar utility to other components
