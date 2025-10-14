# Fix Instructions - Subscription Page Not Loading Plans

## Problem
The backend API is working correctly and returning plans data, but the frontend is getting HTML instead of JSON. This is a Vite proxy issue.

## Solution

### Step 1: Restart Frontend Server
The Vite dev server needs to be restarted to pick up the proxy configuration properly.

```bash
# Stop the frontend server (Ctrl+C)
# Then restart it:
cd frontend
npm run dev
```

### Step 2: Clear Browser Cache
Sometimes the browser caches the HTML response.

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR

Press: `Ctrl + Shift + R` (Linux/Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Test the API Directly
Open this URL in your browser to verify the backend is accessible:
```
http://localhost:5000/api/subscriptions/plans?billingInterval=monthly
```

You should see JSON data (which you already confirmed works).

### Step 4: Test Through Proxy
After restarting frontend, open:
```
http://localhost:5173/api/subscriptions/plans?billingInterval=monthly
```

This should also return JSON (proxied through Vite).

### Step 5: Check Frontend Console
After restarting, navigate to:
```
http://localhost:5173/subscriptions
```

Open browser console (F12) and look for:
- "Fetching subscription data..."
- "Plans response: ..." (should show the JSON data)

## If Still Not Working

### Check Vite Proxy Logs
Look at your frontend terminal for proxy logs like:
```
PROXY SENDING REQUEST:
  Method: GET
  URL: /api/subscriptions/plans?billingInterval=monthly

PROXY RECEIVED RESPONSE:
  URL: /api/subscriptions/plans?billingInterval=monthly
  Status: 200
  Content-Type: application/json
```

### Verify Backend is Running
```bash
# Check if backend is running on port 5000
curl http://localhost:5000/api/subscriptions/plans?billingInterval=monthly
```

Should return the JSON you showed me.

## Expected Result

After following these steps, the Subscriptions page should display:
- ✅ Current status card with your tier
- ✅ All 6 plan cards (Free Trial, Basic, Pro, Pharmily, Network, Enterprise)
- ✅ Each plan showing correct features
- ✅ Correct button text (Current Plan/Upgrade/Downgrade)

## Quick Test

Run this in your browser console on the subscriptions page:
```javascript
fetch('/api/subscriptions/plans?billingInterval=monthly')
  .then(r => r.json())
  .then(d => console.log('Plans:', d))
  .catch(e => console.error('Error:', e));
```

This should log the plans data.
