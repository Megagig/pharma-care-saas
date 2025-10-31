# 🚀 Quick Fix: Redis ECONNREFUSED Error (Upstash Redis)

## The Problem
```
❌ Redis connection error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

## The Solution (3 Minutes)

### Step 1: Get Your Upstash Redis URL
1. Go to: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b
2. Find the **"Redis Connect"** section
3. Copy the connection string (looks like):
   ```
   redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
   ```

### Step 2: Update Local .env
Open `backend/.env` and update:
```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

### Step 3: Test Locally (Optional)
```bash
cd backend
npm run dev
```
Look for: ✅ "Queue Redis client connected"

### Step 4: Deploy to Render
1. Go to: https://dashboard.render.com
2. Open your backend service
3. Click "Environment" in left sidebar
4. Add environment variable:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379`
5. Click "Save Changes"

### Step 5: Wait for Redeploy
Render will automatically redeploy (takes ~2-3 minutes)

### Step 6: Verify
Check logs - you should see:
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
```

## Done! ✨

No more ECONNREFUSED errors.

---

**Full Upstash guide**: See `UPSTASH_REDIS_SETUP.md`

**Need more details?** See `REDIS_SETUP_COMPLETE.md`

**Having issues?** See `REDIS_CONFIGURATION_GUIDE.md`
