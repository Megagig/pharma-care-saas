# CRITICAL: Restart Frontend Dev Server

## The Problem

All API requests are returning HTML instead of JSON because the Vite proxy is not working. This happens when:
1. The dev server needs to be restarted to pick up changes
2. Module resolution is cached
3. The proxy configuration isn't being applied

## Solution: Restart Vite Dev Server

### Option 1: Manual Restart (Recommended)

1. **Go to the terminal running `npm run dev`**
2. **Press `Ctrl+C`** to stop the server
3. **Wait for it to fully stop**
4. **Run again**: `npm run dev`
5. **Wait for "ready" message**
6. **Refresh browser** with `Ctrl+Shift+R`

### Option 2: Kill and Restart

```bash
# In project root
cd frontend

# Kill any existing Vite processes
pkill -f "vite --force --port 5173"

# Wait a moment
sleep 2

# Start fresh
npm run dev
```

### Option 3: Use the restart script

```bash
# Make executable
chmod +x restart-frontend.sh

# Run it
./restart-frontend.sh
```

## After Restart

### 1. Check Console Logs

You should now see:
```
🔵 API Request: {
  method: 'GET',
  url: '/super-admin/dashboard/overview',
  baseURL: '/api',
  fullURL: '/api/super-admin/dashboard/overview'
}
```

### 2. Check Vite Terminal

You should see proxy logs:
```
Sending Request to the Target: GET /api/super-admin/dashboard/overview
Received Response from the Target: 200 /api/super-admin/dashboard/overview
```

### 3. Check Network Tab

- Request URL: `http://localhost:5173/api/super-admin/dashboard/overview`
- Status: `200 OK`
- Response: **JSON data** (not HTML!)

## Why This Happens

The Vite dev server:
- Reads `vite.config.ts` at startup
- Sets up proxy middleware
- Caches module resolutions
- **Doesn't hot-reload proxy config**

When you make changes to:
- API client configuration
- Service layer paths
- Proxy-related code

You **MUST restart** the dev server for changes to take effect.

## Verification

After restart, run:
```bash
# Check if proxy is working
curl -s http://localhost:5173/api/health

# Should return JSON:
# {"status":"OK","timestamp":"...","environment":"development"}
```

If you still get HTML, the proxy is not working.

## Common Issues

### Issue: Still getting HTML after restart
**Solution**: 
- Make sure backend is running on port 5000
- Check `vite.config.ts` has proxy configured
- Try clearing browser cache completely
- Check no other process is using port 5173

### Issue: Can't kill Vite process
**Solution**:
```bash
# Force kill all node processes (careful!)
pkill -9 node

# Or find specific PID
ps aux | grep vite
kill -9 <PID>
```

### Issue: Port 5173 already in use
**Solution**:
```bash
# Find what's using the port
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use a different port
npm run dev -- --port 5174
```

## Expected Behavior After Restart

✅ API requests show in console with full URL  
✅ Vite terminal shows proxy logs  
✅ Network tab shows `/api/...` requests  
✅ Responses are JSON (not HTML)  
✅ Dashboard loads data  
✅ No "Unexpected token '<'" errors  

---

**IMPORTANT**: You MUST restart the Vite dev server now!

**Steps**:
1. Stop current dev server (Ctrl+C)
2. Start it again (npm run dev)
3. Refresh browser (Ctrl+Shift+R)
4. Check console logs
