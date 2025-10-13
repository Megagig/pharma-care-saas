# 🚨 RESTART FRONTEND DEV SERVER REQUIRED

## Problem
Login is failing with 404 error because the Vite proxy configuration changes haven't taken effect yet.

## Root Cause
The Vite dev server was running BEFORE we updated the proxy configuration in `vite.config.ts`. Vite doesn't hot-reload configuration changes - it requires a full restart.

## Solution

### Step 1: Stop the Current Frontend Server
Press `Ctrl+C` in the terminal where the frontend is running, or:

```bash
# Find and kill the Vite process
pkill -f "vite --force --port 5173"
```

### Step 2: Restart the Frontend Server
```bash
cd frontend
npm run dev
```

### Step 3: Verify the Proxy is Working
You should see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://127.0.0.1:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 4: Test the Proxy
Open a new terminal and run:
```bash
curl -X POST http://127.0.0.1:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

You should see:
```json
{"message":"Invalid credentials"}
```

NOT a 404 error!

### Step 5: Test Login in Browser
1. Open http://127.0.0.1:5173
2. Try to login
3. Check the browser console - you should see:
   ```
   📤 Proxying request: POST /api/auth/login -> http://127.0.0.1:5000/api/auth/login
   📥 Proxy response: 200 /api/auth/login
   ```

## Why This Happened
Vite configuration files (`vite.config.ts`) are only loaded when the dev server starts. Changes to:
- Proxy configuration
- Build settings
- Plugin configuration
- Server settings

All require a full restart to take effect.

## What Will Work After Restart
✅ Login functionality
✅ Dashboard data loading
✅ Patients page loading
✅ All API requests through Vite proxy
✅ Proper CORS handling
✅ Cookie-based authentication

## Quick Commands

### Kill and Restart (One Command):
```bash
pkill -f "vite --force --port 5173" && cd frontend && npm run dev
```

### Or Manually:
1. Go to the terminal running frontend
2. Press `Ctrl+C`
3. Run `npm run dev` again

## Verification Checklist
- [ ] Frontend dev server restarted
- [ ] Proxy test returns JSON (not 404)
- [ ] Login page loads
- [ ] Can attempt login (even if credentials wrong)
- [ ] Browser console shows proxy logs
- [ ] No 404 errors in console

## If Still Not Working
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check backend is running: `curl http://127.0.0.1:5000/api/health`
3. Check frontend port is correct: `lsof -i :5173`
4. Check for port conflicts
5. Try a different browser or incognito mode
