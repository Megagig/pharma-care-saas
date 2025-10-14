# Cloudinary Avatar Upload Implementation

## Overview

Avatar uploads now use **Cloudinary as the primary storage** with local file system as a fallback. This ensures reliable image hosting and automatic optimization.

## Features

✅ **Primary**: Cloudinary cloud storage
✅ **Fallback**: Local file system if Cloudinary fails
✅ **Auto-optimization**: Images resized to 500x500, face-detection cropping
✅ **Format optimization**: Automatic format selection (WebP, etc.)
✅ **Quality optimization**: Automatic quality adjustment
✅ **CDN delivery**: Fast global delivery via Cloudinary CDN

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dsguyuamo
CLOUDINARY_API_KEY=239631528231549
CLOUDINARY_API_SECRET=0h4qgRhe1EKteskdrLp5be_Eo-g
```

### How It Works

1. **Upload Request** → `POST /api/user/settings/profile/avatar`
2. **Check Cloudinary Config** → If configured, upload to Cloudinary
3. **Cloudinary Upload** → Image uploaded with transformations:
   - Resize to 500x500
   - Crop to face (intelligent face detection)
   - Auto quality and format optimization
4. **Return URL** → Cloudinary secure URL (https://res.cloudinary.com/...)
5. **Fallback** → If Cloudinary fails, save to local `/uploads/avatars/`

## Code Changes

### 1. Updated `backend/src/utils/fileUpload.ts`

```typescript
// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload with fallback
export const uploadProfilePicture = async (file: Express.Multer.File): Promise<string> => {
    try {
        if (isCloudinaryConfigured()) {
            // Primary: Upload to Cloudinary
            return await uploadToCloudinary(file);
        } else {
            // No Cloudinary config: Use local storage
            return await uploadToLocal(file);
        }
    } catch (error) {
        // Fallback: If Cloudinary fails, use local storage
        return await uploadToLocal(file);
    }
};
```

### 2. Fixed Static File Serving `backend/src/app.ts`

```typescript
// Correct path for local uploads (when running from src/)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Exclude /uploads from catch-all route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  }
});
```

### 3. Updated `frontend/src/utils/avatarUtils.ts`

```typescript
export const getAvatarUrl = (avatarPath?: string): string | undefined => {
    if (!avatarPath) return undefined;
    
    // Cloudinary URLs (full URLs) - return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }
    
    // Local uploads - add backend URL
    const backendUrl = import.meta.env.MODE === 'development' 
        ? 'http://localhost:5000' 
        : '';
    
    return `${backendUrl}${avatarPath}?t=${Date.now()}`;
};
```

## Testing

### 1. Restart Backend
```bash
cd backend
npm run dev
```

### 2. Upload Avatar
1. Go to Settings > Profile
2. Click camera icon
3. Select an image
4. Upload

### 3. Verify Upload

**Check Console Logs:**
```
[Upload] Using Cloudinary for avatar upload
[Upload] Cloudinary upload successful: https://res.cloudinary.com/dsguyuamo/image/upload/v1234567890/avatars/abc123.jpg
```

**Check Database:**
```javascript
// Avatar field should contain Cloudinary URL
avatar: "https://res.cloudinary.com/dsguyuamo/image/upload/v1234567890/avatars/abc123.jpg"
```

**Check Browser:**
- Avatar displays immediately
- No console errors
- Network tab shows image loaded from Cloudinary CDN

### 4. Test Fallback

To test local storage fallback:

1. **Temporarily disable Cloudinary** in `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

2. **Restart backend**

3. **Upload avatar** - should save to `/backend/uploads/avatars/`

4. **Check logs**:
   ```
   [Upload] Cloudinary not configured, using local storage
   [Upload] Local upload successful: /uploads/avatars/uuid-filename.jpg
   ```

## Cloudinary Dashboard

View uploaded images at: https://cloudinary.com/console

- **Folder**: `avatars/`
- **Transformations**: Applied automatically
- **Storage**: Check usage and limits

## Benefits

### Cloudinary (Primary)
- ✅ Reliable cloud storage
- ✅ Global CDN delivery
- ✅ Automatic image optimization
- ✅ Face detection cropping
- ✅ Format conversion (WebP, AVIF)
- ✅ No server storage needed
- ✅ Scales automatically

### Local Storage (Fallback)
- ✅ Works without internet
- ✅ No external dependencies
- ✅ Full control over files
- ✅ No API limits
- ✅ Instant upload

## Troubleshooting

### Avatar Still Not Showing?

1. **Check Cloudinary credentials**:
   ```bash
   # In backend/.env
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   echo $CLOUDINARY_API_SECRET
   ```

2. **Check backend logs**:
   ```
   [Upload] Using Cloudinary for avatar upload
   [Upload] Cloudinary upload successful: [URL]
   ```

3. **Test Cloudinary directly**:
   ```bash
   curl -X POST \
     https://api.cloudinary.com/v1_1/dsguyuamo/image/upload \
     -F "file=@/path/to/image.jpg" \
     -F "upload_preset=ml_default"
   ```

4. **Check database**:
   - Avatar field should contain full Cloudinary URL
   - Not a relative path like `/uploads/avatars/...`

5. **Check browser console**:
   - Should show Cloudinary URL
   - No 404 errors
   - Image loads successfully

### Local Storage Not Working?

1. **Check uploads directory exists**:
   ```bash
   ls -la backend/uploads/avatars/
   ```

2. **Check file permissions**:
   ```bash
   chmod -R 755 backend/uploads/
   ```

3. **Check static file serving**:
   ```bash
   curl -I http://localhost:5000/uploads/avatars/[filename].jpg
   # Should return: Content-Type: image/jpeg
   ```

4. **Check path in app.ts**:
   ```typescript
   // Should be '../uploads' when running from src/
   app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
   ```

## Migration

### Existing Local Avatars

To migrate existing local avatars to Cloudinary:

```javascript
// Run this script to migrate
const User = require('./models/User');
const { uploadToCloudinary } = require('./utils/fileUpload');
const fs = require('fs');
const path = require('path');

async function migrateAvatars() {
    const users = await User.find({ avatar: { $regex: '^/uploads/avatars/' } });
    
    for (const user of users) {
        try {
            const localPath = path.join(__dirname, '..', user.avatar);
            const fileBuffer = fs.readFileSync(localPath);
            
            const cloudinaryUrl = await uploadToCloudinary({
                buffer: fileBuffer,
                originalname: path.basename(localPath)
            });
            
            user.avatar = cloudinaryUrl;
            await user.save();
            
            console.log(`Migrated avatar for ${user.email}`);
        } catch (error) {
            console.error(`Failed to migrate avatar for ${user.email}:`, error);
        }
    }
}
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
CLOUDINARY_CLOUD_NAME=dsguyuamo
CLOUDINARY_API_KEY=239631528231549
CLOUDINARY_API_SECRET=0h4qgRhe1EKteskdrLp5be_Eo-g
```

### Render/Heroku

Add environment variables in dashboard:
- Settings > Environment Variables
- Add each Cloudinary variable

### Vercel/Netlify

Add to `.env.production` or dashboard environment variables.

## Summary

- ✅ Cloudinary is now the primary upload method
- ✅ Local storage is the fallback
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ No changes needed to frontend code
- ✅ Backward compatible with existing local uploads
