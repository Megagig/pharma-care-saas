# 🚀 Quick Fix: Redis ECONNREFUSED Error

## The Problem
```
❌ Redis connection error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

## The Solution (2 Minutes)

### Step 1: Go to Render
https://dashboard.render.com

### Step 2: Open Your Backend Service
Click on your backend service name

### Step 3: Add Environment Variable
1. Click "Environment" in left sidebar
2. Click "Add Environment Variable"
3. Enter:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://red-d42bv0n5r7bs73djp8cg:6379`
4. Click "Save Changes"

### Step 4: Wait for Redeploy
Render will automatically redeploy (takes ~2-3 minutes)

### Step 5: Verify
Check logs - you should see:
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
```

## Done! ✨

No more ECONNREFUSED errors.

---

**Need more details?** See `REDIS_SETUP_COMPLETE.md`

**Having issues?** See `REDIS_CONFIGURATION_GUIDE.md`

**Step-by-step guide?** See `RENDER_DEPLOYMENT_CHECKLIST.md`
