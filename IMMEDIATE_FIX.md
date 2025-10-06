# Immediate Fix for Session Expiration

## Quick Solution

The issue is likely that old/stale cookies are interfering. Here's the immediate fix:

### Step 1: Clear Browser Cookies
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Delete ALL cookies for `localhost:5173` and `localhost:5000`
4. Close all browser tabs for the application

### Step 2: Clear Browser Cache
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Click "Clear data"

### Step 3: Restart Backend
```bash
cd backend
npm run dev
```

### Step 4: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 5: Try Login Again
1. Go to http://localhost:5173/login
2. Login with megagigdev@gmail.com
3. Check if it works

## If Still Not Working

### Check Browser Console
Look for any errors in the browser console (F12 → Console tab)

### Check Network Tab
1. Open DevTools → Network tab
2. Try logging in
3. Look for the `/auth/login` request
4. Check the Response Headers - should see `Set-Cookie` headers
5. Look for the `/auth/me` request
6. Check the Request Headers - should see `Cookie` header with accessToken

### Check Backend Logs
The backend should now show detailed logging:
```
Auth middleware - checking token: {
  hasAccessToken: true/false,
  hasRefreshToken: true/false,
  ...
}
```

## Most Likely Causes

1. **Stale cookies** - Old cookies from before our changes
2. **CORS issue** - Frontend and backend on different origins
3. **Cookie not being sent** - Browser security blocking cookies
4. **Token expiring immediately** - JWT_SECRET mismatch

## Nuclear Option

If nothing works, let's add a temporary bypass:

In `backend/src/middlewares/auth.ts`, temporarily add at the very top of the `auth` function:

```typescript
// TEMPORARY DEBUG - REMOVE AFTER TESTING
if (req.url === '/auth/me') {
  console.log('=== /auth/me REQUEST ===');
  console.log('Cookies:', req.cookies);
  console.log('Headers:', req.headers);
}
```

This will help us see exactly what's being sent to the server.
