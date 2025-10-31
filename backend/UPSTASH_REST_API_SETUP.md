# 🚀 Upstash Redis REST API Setup Guide

## Why REST API?

The REST API bypasses DNS issues by using HTTP/HTTPS instead of direct Redis protocol. Perfect for:
- ✅ New Upstash accounts (DNS propagation delays)
- ✅ Serverless environments
- ✅ Network restrictions
- ✅ DNS resolution issues

## Step 1: Delete Old Database and Create New One

### Delete Old Database
1. Go to: https://console.upstash.com
2. Click on `pharmacyCopilot` database
3. Click "Settings" tab
4. Scroll down and click "Delete Database"
5. Confirm deletion
6. Wait 30 seconds

### Create New Database
1. Click "Create Database" button
2. Fill in:
   - **Name**: `pharmacare-prod`
   - **Region**: **US West** (try different region from before)
   - **Type**: Regional
   - **Eviction**: No eviction
3. Click "Create"
4. **Wait 2 minutes** for full provisioning

## Step 2: Get REST API Credentials

1. Click on your new `pharmacare-prod` database
2. Scroll down to the **"REST API"** section
3. You'll see two values:
   - **UPSTASH_REDIS_REST_URL**: `https://xxxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: Long token string
4. Copy both values

## Step 3: Update Your .env File

Open `backend/.env` and add:

```env
# Upstash Redis REST API Configuration
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Keep cache provider as memory for now
CACHE_PROVIDER=memory
DISABLE_BACKGROUND_JOBS=true
```

**Example:**
```env
UPSTASH_REDIS_REST_URL=https://us1-merry-firefly-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg==
```

## Step 4: Test Locally

```bash
cd backend
npm run dev
```

**Look for:**
```
✅ Upstash Redis (REST API) connected successfully
✅ Using Upstash Redis (REST API) for caching
```

**If you see:**
```
ℹ️ Upstash Redis not available, using fallback cache
```
Check your credentials are correct.

## Step 5: Update Render Environment

1. Go to: https://dashboard.render.com
2. Open your backend service
3. Click "Environment"
4. Add these variables:
   - `UPSTASH_REDIS_REST_URL` = `https://your-database.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `your-token-here`
5. Remove or keep commented:
   - `REDIS_URL` (not needed for REST API)
6. Click "Save Changes"

## What Was Installed

```bash
npm install @upstash/redis
```

This package provides HTTP-based Redis client that works without DNS.

## New Files Created

1. **`backend/src/config/upstashRedis.ts`**
   - Initializes Upstash REST API client
   - Tests connection
   - Provides singleton instance

2. **`backend/src/services/UnifiedCacheService.ts`**
   - Unified cache interface
   - Uses Upstash REST API if available
   - Falls back to in-memory cache
   - Transparent to your application

## How It Works

### Before (Direct Redis - DNS Required)
```
App → DNS Lookup → artistic-goblin-24622.upstash.io → ❌ ENOTFOUND
```

### After (REST API - No DNS)
```
App → HTTPS → https://artistic-goblin-24622.upstash.io → ✅ Works!
```

## Usage in Your Code

The UnifiedCacheService provides a simple interface:

```typescript
import { unifiedCache } from './services/UnifiedCacheService';

// Set value (with optional TTL)
await unifiedCache.set('key', 'value', 300); // 5 minutes

// Get value
const value = await unifiedCache.get('key');

// Delete value
await unifiedCache.del('key');

// Check if exists
const exists = await unifiedCache.exists('key');

// Clear all
await unifiedCache.clear();

// Get stats
const stats = unifiedCache.getStats();
// { type: 'upstash-rest', memoryKeys: 0, isUpstashConnected: true }
```

## Benefits

1. **No DNS Issues**: Uses HTTPS, bypasses DNS
2. **Automatic Fallback**: Falls back to memory if Upstash unavailable
3. **Same Interface**: No code changes needed
4. **Serverless-Friendly**: Perfect for Render, Vercel, etc.
5. **No Connection Pooling**: HTTP-based, no persistent connections

## Troubleshooting

### Error: "Upstash Redis not available"

**Check:**
1. REST URL is correct (starts with `https://`)
2. Token is correct (long base64 string)
3. Database is "Active" in Upstash console
4. No typos in .env file

### Error: "401 Unauthorized"

**Solution**: Token is incorrect
- Go back to Upstash console
- Copy the token again
- Make sure you copied the full token

### Error: "404 Not Found"

**Solution**: REST URL is incorrect
- Verify the URL in Upstash console
- Should be: `https://xxxxx.upstash.io`
- NOT: `https://xxxxx.upstash.io/`  (no trailing slash)

## Performance

REST API is slightly slower than direct Redis:
- **Direct Redis**: 1-5ms latency
- **REST API**: 10-50ms latency

But it's more reliable for serverless and avoids DNS issues.

## Migration Path

Once DNS issues are resolved, you can switch back to direct Redis:
1. Get the `redis://` connection string
2. Update `REDIS_URL` in .env
3. The app will automatically use direct Redis

## Cost

REST API uses the same Upstash pricing:
- **Free tier**: 10,000 commands/day
- **Paid tier**: $0.2 per 100K commands

No additional cost for using REST API.

## Summary

✅ **Installed**: `@upstash/redis` package
✅ **Created**: REST API configuration
✅ **Created**: Unified cache service
✅ **Updated**: Server initialization
✅ **Benefit**: No more DNS errors!

**Next Steps**:
1. Delete old Upstash database
2. Create new database (different region)
3. Copy REST API credentials
4. Update .env file
5. Test locally
6. Deploy to Render

**Time**: ~10 minutes
**Result**: Working Redis without DNS issues!
