# Diagnostic Checklist - HTML Response Issue

## Current Situation
- ✅ Backend is running (confirmed)
- ✅ CORS is configured correctly
- ✅ apiClient is set to use `http://localhost:5000/api` directly
- ❌ Still getting HTML responses

## Check These in Browser Console

### 1. Check API Request Logs
Look for logs starting with `🔵 API Request:`

**What to look for:**
```javascript
🔵 API Request: {
  method: 'GET',
  url: '/super-admin/dashboard/overview',
  baseURL: 'http://localhost:5000/api',
  fullURL: 'http://localhost:5000/api/super-admin/dashboard/overview',
  isDev: true
}
📍 Request will be sent to: http://localhost:5000/api/super-admin/dashboard/overview
```

**Questions:**
- Do you see these logs?
- What is the `fullURL` value?
- Is `isDev` true or false?

### 2. Check Network Tab
Open DevTools → Network tab

**For each failing request, check:**
- Request URL (what URL is actually being called?)
- Request Method (GET, POST, etc.)
- Status Code (200, 404, 500, etc.)
- Response Headers (Content-Type should be application/json)
- Response Preview (is it HTML or JSON?)

**Take a screenshot of:**
1. The request URL
2. The Response tab showing HTML
3. The Headers tab

### 3. Check for CORS Errors
Look in console for errors like:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Do you see CORS errors?** YES / NO

### 4. Test Backend Directly
Open a new browser tab and go to:
```
http://localhost:5000/api/health
```

**What do you see?**
- [ ] JSON response: `{"status":"OK",...}`
- [ ] HTML page
- [ ] Error page
- [ ] Nothing / timeout

### 5. Check Environment Variables
In browser console, type:
```javascript
import.meta.env.DEV
```

**What does it return?**
- [ ] true
- [ ] false
- [ ] undefined

### 6. Check if Frontend is Actually Restarted
In the terminal running `npm run dev`, you should see:
```
VITE v4.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Do you see this?** YES / NO

**When did you restart it?** (timestamp)

### 7. Check Browser Cache
1. Open DevTools
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Refresh page (Ctrl+Shift+R)

**Did you do this?** YES / NO

## Common Issues and Solutions

### Issue A: fullURL shows `/api/super-admin/...` (missing http://localhost:5000)
**Cause:** apiClient baseURL not set correctly  
**Solution:** Check if `import.meta.env.DEV` is true

### Issue B: Requests go to `http://localhost:5173/api/...`
**Cause:** apiClient is using relative URL instead of absolute  
**Solution:** Verify apiClient.ts line 6 has `http://localhost:5000/api` for DEV

### Issue C: CORS errors in console
**Cause:** Backend CORS not configured or backend not running  
**Solution:** Restart backend, verify CORS config

### Issue D: 404 errors
**Cause:** Backend routes not registered  
**Solution:** Check backend logs, verify routes are loaded

### Issue E: HTML responses but no errors
**Cause:** Requests hitting Vite dev server instead of backend  
**Solution:** Check Network tab for actual request URL

## Next Steps

Based on your answers above, we can determine:

1. **If `isDev` is false** → Environment variable issue
2. **If fullURL is wrong** → apiClient configuration issue
3. **If CORS errors** → Backend CORS or not running
4. **If 404 errors** → Backend routing issue
5. **If HTML with no errors** → Request routing issue

## Report Back

Please provide:
1. Screenshot of browser console showing `🔵 API Request` logs
2. Screenshot of Network tab showing a failing request
3. Answers to the YES/NO questions above
4. Output of `import.meta.env.DEV` in console

This will help identify the exact issue.
