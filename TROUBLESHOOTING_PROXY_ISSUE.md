# Troubleshooting: Vite Proxy Not Working

## Current Situation
✅ **Backend API is working** - Returns correct JSON data
❌ **Frontend getting HTML** - Vite proxy not forwarding requests correctly

## Root Cause
The Vite dev server proxy isn't properly forwarding API requests to the backend. This happens when:
1. Frontend server wasn't restarted after proxy configuration changes
2. Browser cached the HTML response
3. Vite proxy middleware isn't initialized correctly

## Solution Steps

### Step 1: Stop Everything
```bash
# Stop frontend (Ctrl+C in frontend terminal)
# Stop backend (Ctrl+C in backend terminal)
```

### Step 2: Start Backend First
```bash
cd backend
npm run dev

# Wait for: "Server running on port 5000"
```

### Step 3: Verify Backend Works
Open in browser or use curl:
```bash
curl http://localhost:5000/api/subscriptions/plans?billingInterval=monthly
```

Should return JSON with 6 plans.

### Step 4: Start Frontend
```bash
cd frontend
npm run dev

# Wait for: "Local: http://localhost:5173/"
```

### Step 5: Clear Browser Cache
**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Option B: DevTools**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Incognito/Private Window**
- Open a new incognito/private window
- Navigate to `http://localhost:5173/subscriptions`

### Step 6: Test Proxy
Open in browser:
```
http://localhost:5173/api/subscriptions/plans?billingInterval=monthly
```

Should return JSON (same as backend direct access).

### Step 7: Navigate to Subscriptions Page
```
http://localhost:5173/subscriptions
```

Should now show all plans!

## Verification Checklist

- [ ] Backend running on port 5000
- [ ] Backend API returns JSON when accessed directly
- [ ] Frontend running on port 5173
- [ ] Proxy test returns JSON (not HTML)
- [ ] Browser cache cleared
- [ ] Subscriptions page shows plans

## Alternative: Check Vite Config

If still not working, verify `frontend/vite.config.ts`:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

## Debug Commands

### Check if ports are in use:
```bash
# Check port 5000 (backend)
lsof -i :5000

# Check port 5173 (frontend)
lsof -i :5173
```

### Test API from command line:
```bash
# Direct backend
curl -v http://localhost:5000/api/subscriptions/plans?billingInterval=monthly

# Through proxy (while frontend is running)
curl -v http://localhost:5173/api/subscriptions/plans?billingInterval=monthly
```

### Check Vite proxy logs:
Look in frontend terminal for:
```
PROXY SENDING REQUEST:
  Method: GET
  URL: /api/subscriptions/plans?billingInterval=monthly
```

## Common Issues

### Issue 1: "ECONNREFUSED"
**Cause**: Backend not running
**Fix**: Start backend server

### Issue 2: Getting HTML instead of JSON
**Cause**: Proxy not working, Vite serving index.html
**Fix**: Restart frontend server + clear cache

### Issue 3: CORS errors
**Cause**: Backend CORS not configured for localhost:5173
**Fix**: Already configured in `backend/src/app.ts` (line 97-105)

### Issue 4: 404 Not Found
**Cause**: Route not registered in backend
**Fix**: Already registered in `backend/src/app.ts` (line 267)

## Success Indicators

When working correctly, you should see:

**Frontend Console:**
```
Fetching subscription data...
Plans response: {success: true, data: Array(6)}
Plans data: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
```

**Frontend Terminal:**
```
PROXY SENDING REQUEST:
  Method: GET
  URL: /api/subscriptions/plans?billingInterval=monthly
PROXY RECEIVED RESPONSE:
  URL: /api/subscriptions/plans?billingInterval=monthly
  Status: 200
  Content-Type: application/json; charset=utf-8
```

**Subscriptions Page:**
- Shows 6 plan cards
- Each card has features listed
- Buttons show correct text
- No error messages

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Kill all Node processes:**
   ```bash
   killall node
   ```

2. **Clear npm cache:**
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   ```

3. **Restart both servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

4. **Use a different browser** (to rule out browser-specific issues)

5. **Check firewall** (make sure ports 5000 and 5173 aren't blocked)

## Quick Test Script

Save this as `test-proxy.sh` and run it:

```bash
#!/bin/bash

echo "Testing Backend..."
BACKEND=$(curl -s http://localhost:5000/api/subscriptions/plans?billingInterval=monthly)
if [[ $BACKEND == *"success"* ]]; then
  echo "✅ Backend working"
else
  echo "❌ Backend not working"
  exit 1
fi

echo "Testing Proxy..."
PROXY=$(curl -s http://localhost:5173/api/subscriptions/plans?billingInterval=monthly)
if [[ $PROXY == *"success"* ]]; then
  echo "✅ Proxy working"
else
  echo "❌ Proxy not working - restart frontend"
  exit 1
fi

echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x test-proxy.sh
./test-proxy.sh
```

---

**Next Steps After Fix:**
Once the proxy is working and plans are loading, you can proceed with testing the subscription flow as outlined in `QUICK_START_TESTING.md`.
