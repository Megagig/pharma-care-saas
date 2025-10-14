# Cookie Authentication Fix

## Problem
After login, the user is immediately logged out because:
1. Login succeeds but cookies aren't being sent with subsequent requests
2. `getCurrentUser()` fails with "Access denied. No token provided"
3. Many services still using relative fetch URLs getting HTML responses

## Root Cause
When using direct backend URLs (`http://127.0.0.1:5000/api`) from frontend (`http://127.0.0.1:5173`), cookies need special handling:

1. **SameSite attribute**: Cookies must allow cross-origin requests
2. **Domain attribute**: Cookies must be set for the correct domain
3. **Credentials**: All requests must include `credentials: 'include'`

## Solution

### Backend Cookie Configuration
The backend needs to set cookies with proper attributes for cross-origin requests in development.

Check `backend/src/controllers/authController.ts` - cookies should be set like:
```typescript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 'lax' for dev
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
  // NO domain attribute in development!
});
```

### Alternative: Use Vite Proxy (Recommended)
Instead of direct backend URLs, fix the Vite proxy to work properly. This avoids cross-origin cookie issues entirely.

## Quick Fix: Restart Backend

The backend might need to be restarted to pick up the correct CORS configuration.

```bash
# Stop backend
pkill -f "node.*backend"

# Start backend
cd backend
npm run dev
```

## Verification

After fixing, check:
1. Login succeeds
2. Browser DevTools > Application > Cookies shows `accessToken` and `refreshToken`
3. Subsequent API calls include cookies
4. No "Access denied. No token provided" errors
5. Dashboard loads data

## If Still Not Working

Try using localStorage tokens instead of httpOnly cookies (less secure but works):
1. Backend sends tokens in response body
2. Frontend stores in localStorage
3. Frontend sends in Authorization header

This is a fallback - httpOnly cookies are more secure.
