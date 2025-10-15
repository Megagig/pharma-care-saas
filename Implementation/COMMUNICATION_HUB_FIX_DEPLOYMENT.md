# Communication Hub Fixes - Deployment Guide

## Summary of Changes

### Backend Changes
1. **Added Participant Search Endpoint**
   - Route: `GET /api/communication/participants/search`
   - Controller method: `searchParticipants`
   - Returns real users from database (doctors, pharmacists, patients)
   - Supports search by name, email, and role filtering

### Frontend Changes
1. **NewConversationModal.tsx**
   - Removed hardcoded mock data (Dr. Sarah Johnson, Dr. Michael Chen, etc.)
   - Added API call to fetch real participants
   - Fixed participants array format (now sends user IDs instead of objects)
   - Added loading state for participant fetching

2. **AuditLogViewer.tsx**
   - Fixed "Error is not a constructor" issue
   - Changed icon imports to avoid naming conflicts

3. **types.ts**
   - Updated `CreateConversationData` interface
   - Changed `participants` from object array to string array (user IDs)

## Files Modified

### Backend
- `backend/src/routes/communicationRoutes.ts`
- `backend/src/controllers/communicationController.ts`

### Frontend
- `frontend/src/components/communication/NewConversationModal.tsx`
- `frontend/src/components/communication/AuditLogViewer.tsx`
- `frontend/src/stores/types.ts`

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Restart the backend server
pm2 restart backend
# OR
npm run dev
```

### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Build the frontend
npm run build

# Restart the frontend server
npm start
# OR for development
npm run dev
```

### 3. Clear Browser Cache

After deployment, users should:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Log out and log back in to refresh authentication tokens

## Testing Checklist

### Test 1: Participant Search
- [ ] Open Communication Hub
- [ ] Click "New Conversation" button
- [ ] Navigate to "Participants" step
- [ ] Verify real users appear (not mock data)
- [ ] Search for users by name
- [ ] Filter by role (doctor, pharmacist, patient)
- [ ] Verify no "Dr. Sarah Johnson" or "Dr. Michael Chen" appear

### Test 2: Create Conversation
- [ ] Select conversation type
- [ ] Add participants from the real user list
- [ ] Fill in conversation details
- [ ] Click "Create Conversation"
- [ ] Verify no 401 error
- [ ] Verify no 404 error
- [ ] Verify conversation is created successfully
- [ ] Verify conversation appears in the list

### Test 3: Audit Log Tab
- [ ] Navigate to "Audit Logs" tab
- [ ] Verify no "Error is not a constructor" error
- [ ] Verify audit logs load (or show "No audit logs found")
- [ ] Test filters
- [ ] Test export functionality

### Test 4: Notifications Tab
- [ ] Navigate to "Notifications" tab
- [ ] Verify notifications load properly
- [ ] Verify no errors in console
- [ ] Test notification actions (mark as read, dismiss)

### Test 5: Messages Tab
- [ ] Navigate to "Messages" tab
- [ ] Verify conversations load
- [ ] Select a conversation
- [ ] Send a message
- [ ] Verify message appears

## Troubleshooting

### Issue: 401 Unauthorized Error
**Solution:**
1. Check if user is logged in
2. Verify token is present in localStorage
3. Check backend authentication middleware
4. Restart backend server

### Issue: 404 Not Found Error
**Solution:**
1. Verify backend routes are registered
2. Check if backend server is running
3. Verify API endpoint URL is correct
4. Check nginx/proxy configuration

### Issue: Participants Not Loading
**Solution:**
1. Check browser console for errors
2. Verify API endpoint returns data
3. Check if users exist in database
4. Verify workplaceId is set correctly

### Issue: Mock Data Still Showing
**Solution:**
1. Clear browser cache completely
2. Hard refresh (Ctrl+Shift+R)
3. Check if old build is cached
4. Rebuild frontend with `npm run build`

## API Endpoint Documentation

### GET /api/communication/participants/search

**Description:** Search for participants to add to conversations

**Query Parameters:**
- `q` (optional): Search query (name or email)
- `role` (optional): Filter by role (doctor, pharmacist, patient, admin)
- `limit` (optional): Maximum results (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Participants retrieved successfully",
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "doctor",
      "avatar": "https://..."
    }
  ],
  "count": 1
}
```

**Example Requests:**
```bash
# Get all participants
GET /api/communication/participants/search

# Search by name
GET /api/communication/participants/search?q=john

# Filter by role
GET /api/communication/participants/search?role=doctor

# Combined search and filter
GET /api/communication/participants/search?q=john&role=doctor&limit=20
```

## Database Requirements

Ensure the following data exists in your database:

1. **Users Collection**
   - Active users with roles: doctor, pharmacist, patient
   - Users must have `workplaceId` matching the current user's workplace
   - Users must have `status: 'active'`

2. **Workplace Collection**
   - Valid workplace documents
   - Users must be associated with workplaces

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only see participants from their workplace
3. **Rate Limiting**: Search endpoint has rate limiting applied
4. **Input Sanitization**: All search queries are sanitized
5. **CSRF Protection**: Conversation creation requires CSRF token

## Performance Notes

1. Participant search is limited to 100 results
2. Results are filtered by workplace for security
3. Only active users are returned
4. Search uses MongoDB regex (consider adding text index for better performance)

## Next Steps

After successful deployment:

1. Monitor error logs for any issues
2. Collect user feedback
3. Consider adding:
   - Participant caching
   - Recent participants list
   - Favorite participants
   - Participant groups/teams
   - Advanced search filters

## Rollback Plan

If issues occur:

1. **Backend Rollback:**
   ```bash
   cd backend
   git checkout HEAD~1 src/routes/communicationRoutes.ts
   git checkout HEAD~1 src/controllers/communicationController.ts
   npm run build
   pm2 restart backend
   ```

2. **Frontend Rollback:**
   ```bash
   cd frontend
   git checkout HEAD~1 src/components/communication/NewConversationModal.tsx
   git checkout HEAD~1 src/components/communication/AuditLogViewer.tsx
   git checkout HEAD~1 src/stores/types.ts
   npm run build
   npm start
   ```

## Support

If you encounter any issues:
1. Check the error logs
2. Review the troubleshooting section
3. Verify all deployment steps were followed
4. Check database connectivity
5. Verify authentication is working
