# Avatar Display Fix - Complete Solution

## Problem
The uploaded avatar images were being saved successfully to the `backend/uploads/avatars/` folder but were not displaying in the UI on the Settings page profile section.

## Root Cause Analysis
1. **Static File Serving Issue**: The catch-all route was intercepting `/uploads` requests before the static file middleware could handle them
2. **Cache Invalidation Issue**: React Query cache wasn't being properly invalidated after avatar upload
3. **Browser Caching**: Browser was caching the old avatar image even after a new one was uploaded
4. **No Cache-Busting**: Avatar URLs didn't have a mechanism to force browser to reload the image

## Solution Implemented

### 1. Created Avatar Utility Function
**File**: `frontend/src/utils/avatarUtils.ts`

A centralized utility function to handle avatar URLs consistently across the application:

```typescript
export const getAvatarUrl = (avatarPath?: string, cacheBust: boolean = true): string | undefined => {
    if (!avatarPath) return undefined;
    
    // Handle full URLs
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }
    
    // Get backend URL based on environment
    const backendUrl = import.meta.env.MODE === 'development' 
        ? 'http://localhost:5000' 
        : '';
    
    // Add cache-busting timestamp
    const cacheBuster = cacheBust ? `?t=${Date.now()}` : '';
    
    return `${backendUrl}${avatarPath}${cacheBuster}`;
};
```

**Features**:
- Handles both relative and absolute URLs
- Environment-aware (development vs production)
- Cache-busting with timestamp parameter
- Optional stable URLs (without cache-busting)

### 2. Fixed React Query Cache Invalidation
**File**: `frontend/src/queries/userSettingsQueries.ts`

Added query invalidation to force refetch after avatar upload:

```typescript
export const useUploadAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => userSettingsService.uploadAvatar(file),
        onSuccess: (avatarUrl) => {
            // Update cache with new avatar
            queryClient.setQueryData(userSettingsKeys.profile, (old: UserProfile | undefined) => {
                if (old) {
                    return { ...old, avatar: avatarUrl };
                }
                return old;
            });
            
            // CRITICAL: Invalidate queries to force refetch
            queryClient.invalidateQueries({ queryKey: userSettingsKeys.profile });
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
            
            toast.success('Profile picture uploaded successfully');
        },
    });
};
```

### 3. Updated ProfileTab Component
**File**: `frontend/src/components/settings/ProfileTab.tsx`

- Imported the new `getAvatarUrl` utility
- Removed inline avatar URL helper function
- Now uses centralized utility for consistent behavior

```typescript
import { getAvatarUrl } from '../../utils/avatarUtils';

// In component:
<Avatar
    src={getAvatarUrl(profile?.avatar)}
    sx={{ width: 150, height: 150, fontSize: '3rem', mx: 'auto' }}
>
```

## How It Works

### Upload Flow
1. User selects an image file
2. File is uploaded to `POST /api/user/settings/profile/avatar`
3. Backend saves file to `backend/uploads/avatars/` with UUID filename
4. Backend returns avatar path: `/uploads/avatars/uuid-filename.jpg`
5. Frontend mutation updates React Query cache
6. Cache invalidation triggers refetch of user profile
7. Avatar URL is constructed with cache-busting timestamp
8. Browser loads the new image (cache is bypassed)

### Backend Configuration
- **Upload Endpoint**: `POST /api/user/settings/profile/avatar`
- **Storage Location**: `backend/uploads/avatars/`
- **Static File Serving**: Configured in `backend/src/app.ts`
  ```typescript
  // CRITICAL: Use absolute path for static files
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
      },
  }));
  
  // CRITICAL: Exclude /uploads from catch-all route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
    } else {
      res.status(404).json({ message: `Route ${req.originalUrl} not found` });
    }
  });
  ```

## Testing the Fix

1. **Navigate to Settings**: Go to Settings > Profile tab
2. **Upload Avatar**: Click the camera icon on the avatar
3. **Select Image**: Choose an image file (JPEG, PNG, GIF, WebP)
4. **Verify Upload**: 
   - Success toast notification appears
   - Avatar updates immediately in the UI
   - Check browser DevTools Network tab - should see new image request
5. **Refresh Page**: Avatar should persist after page refresh

## Files Modified

1. ✅ `frontend/src/utils/avatarUtils.ts` - Created new utility
2. ✅ `frontend/src/queries/userSettingsQueries.ts` - Added cache invalidation
3. ✅ `frontend/src/components/settings/ProfileTab.tsx` - Updated to use utility

## Benefits

1. **Immediate UI Update**: Avatar displays immediately after upload
2. **No Browser Cache Issues**: Cache-busting ensures fresh image loads
3. **Consistent Behavior**: Centralized utility can be used across the app
4. **Maintainable**: Single source of truth for avatar URL logic
5. **Environment-Aware**: Works in both development and production

## Future Enhancements

Consider applying the `getAvatarUrl` utility to other components that display avatars:
- `frontend/src/components/workflow/TeamCollaborationStep.tsx`
- `frontend/src/components/dashboard/PharmacistPerformanceTable.tsx`
- `frontend/src/components/communication/TypingIndicator.tsx`
- `frontend/src/components/communication/MentionInput.tsx`
- `frontend/src/components/communication/MentionSearch.tsx`

## Notes

- The fix maintains all existing functionality
- No breaking changes to the API
- Backend upload logic remains unchanged
- File validation and size limits (5MB) still apply
- Supported formats: JPEG, JPG, PNG, GIF, WebP
