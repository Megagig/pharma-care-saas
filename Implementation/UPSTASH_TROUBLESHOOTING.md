# 🔧 Upstash Redis Troubleshooting

## Error: ENOTFOUND artistic-goblin-24622.upstash.io

### What This Means
The hostname `artistic-goblin-24622.upstash.io` cannot be found. This means:
1. ❌ The database was deleted
2. ❌ The URL is incorrect or outdated
3. ❌ You're using an old/wrong database URL

### Solution: Get the Correct URL

## Step-by-Step Fix

### 1. Open Your Upstash Console

Go to: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b

### 2. Check What You See

#### Scenario A: Database Exists and is Active ✅

You should see:
```
┌─────────────────────────────────────────┐
│ Database Name: your-database-name       │
│ Status: ● Active                        │
│ Region: us-east-1                       │
├─────────────────────────────────────────┤
│ Redis Connect                           │
│ redis://default:XXX@XXX.upstash.io:6379│
│ [Copy] button                           │
└─────────────────────────────────────────┘
```

**Action**: Copy the connection string and update your .env file

#### Scenario B: Database Not Found ❌

You see:
```
Database not found
or
404 Error
or
Access denied
```

**Action**: Create a new database (see below)

#### Scenario C: Database is "Creating" ⏳

You see:
```
Status: Creating...
```

**Action**: Wait 30-60 seconds and refresh the page

### 3. If Database Doesn't Exist - Create New One

#### Option 1: Create from Console

1. Go to: https://console.upstash.com
2. Click "Create Database"
3. Fill in:
   - **Name**: `pharmacare-redis` (or any name)
   - **Region**: Choose closest to your Render region (e.g., US East)
   - **Type**: Regional (free tier)
4. Click "Create"
5. Wait 30 seconds for creation
6. Copy the connection string

#### Option 2: Use Existing Database

1. Go to: https://console.upstash.com
2. Click on any existing database
3. Copy its connection string

### 4. Update Your .env File

Open `backend/.env` and replace the REDIS_URL:

```env
# Replace this line with your ACTUAL Upstash URL
REDIS_URL=redis://default:YOUR_ACTUAL_PASSWORD@YOUR_ACTUAL_HOST.upstash.io:6379
```

**Example of correct URL:**
```env
REDIS_URL=redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379
```

### 5. Update Render Environment Variables

1. Go to: https://dashboard.render.com
2. Open your backend service
3. Click "Environment"
4. Find `REDIS_URL` variable
5. Update with the SAME URL from your .env
6. Click "Save Changes"

### 6. Test Locally First

Before deploying, test locally:

```bash
cd backend
npm run dev
```

**Look for:**
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
```

**If you still see errors:**
- Check the URL is correct
- No extra spaces or quotes
- URL starts with `redis://`
- URL ends with `:6379`

### 7. Deploy to Render

Once local test passes:
1. Render will auto-redeploy after saving environment variables
2. Check logs for success messages
3. No more ENOTFOUND errors

## Common Mistakes

### ❌ Mistake 1: Using Old/Deleted Database URL
```env
REDIS_URL=redis://default:XXX@artistic-goblin-24622.upstash.io:6379
```
**Fix**: Get fresh URL from current active database

### ❌ Mistake 2: Using REST API URL Instead
```env
REDIS_URL=https://artistic-goblin-24622.upstash.io
```
**Fix**: Use Redis URL (starts with `redis://`), not REST URL (starts with `https://`)

### ❌ Mistake 3: Missing Password
```env
REDIS_URL=redis://artistic-goblin-24622.upstash.io:6379
```
**Fix**: Include `default:PASSWORD@` in the URL

### ❌ Mistake 4: Extra Quotes
```env
REDIS_URL="redis://default:XXX@XXX.upstash.io:6379"
```
**Fix**: Remove quotes (unless required by your .env parser)

### ❌ Mistake 5: Wrong Database ID in Console URL
```
https://console.upstash.com/redis/WRONG_ID
```
**Fix**: Use the correct database ID or go to console home and click your database

## How to Find Your Databases

### Method 1: Console Home
1. Go to: https://console.upstash.com
2. You'll see all your databases listed
3. Click on the one you want to use
4. Copy its connection string

### Method 2: Check All Databases
1. Go to: https://console.upstash.com/redis
2. Lists all Redis databases
3. Click on any active database
4. Copy connection string

## Verify Your URL is Correct

A valid Upstash Redis URL has these parts:

```
redis://default:PASSWORD@HOSTNAME.upstash.io:6379
  │      │       │        │                   │
  │      │       │        │                   └─ Port (always 6379)
  │      │       │        └─ Hostname (must exist and be active)
  │      │       └─ Password (long random string)
  │      └─ Username (always "default")
  └─ Protocol (always "redis://")
```

### Test Your URL Format

Your URL should match this pattern:
```
redis://default:[A-Za-z0-9+/=]+@[a-z0-9-]+\.upstash\.io:6379
```

### Quick Checks

- [ ] Starts with `redis://`
- [ ] Contains `default:` after `redis://`
- [ ] Has a password (long string) after `default:`
- [ ] Has `@` before hostname
- [ ] Hostname ends with `.upstash.io`
- [ ] Ends with `:6379`
- [ ] No spaces or line breaks
- [ ] No extra quotes

## Alternative: Disable Redis Temporarily

If you need the app running NOW while you fix Redis:

### Update .env
```env
# Temporarily disable Redis
CACHE_PROVIDER=memory
DISABLE_BACKGROUND_JOBS=true
# REDIS_URL=PASTE_YOUR_UPSTASH_URL_HERE
```

### Update Render Environment
Add these variables:
- `CACHE_PROVIDER=memory`
- `DISABLE_BACKGROUND_JOBS=true`
- Remove or comment out `REDIS_URL`

**Note**: This disables:
- ❌ Background jobs (reminders, follow-ups)
- ❌ Redis caching (slower performance)
- ✅ But app will run without Redis errors

## Still Having Issues?

### Check Upstash Status
https://status.upstash.com

### Check Your Account
1. Go to: https://console.upstash.com
2. Verify you're logged into the correct account
3. Check if you have any active databases

### Create Fresh Database
1. Delete old database (if exists)
2. Create new database
3. Use new connection string
4. Update .env and Render

### Contact Support
- Upstash Discord: https://discord.gg/upstash
- Upstash Email: support@upstash.com
- Include error message and database ID

## Quick Reference

### Your Database Console
https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b

### What to Copy
The full connection string from "Redis Connect" section

### Where to Paste
1. `backend/.env` → `REDIS_URL=...`
2. Render Dashboard → Environment → `REDIS_URL`

### Test Command
```bash
cd backend && npm run dev
```

### Expected Success
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
```

## Summary

The error means the database hostname doesn't exist. To fix:

1. ✅ Go to Upstash console
2. ✅ Find an active database (or create new one)
3. ✅ Copy the FULL connection string
4. ✅ Update `backend/.env`
5. ✅ Test locally
6. ✅ Update Render environment variables
7. ✅ Verify in logs

**Time to fix**: 5 minutes

**Result**: No more ENOTFOUND errors
