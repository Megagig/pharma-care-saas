# 📋 How to Get Your Upstash Redis URL

## Visual Step-by-Step Guide

### Step 1: Open Your Upstash Database

Click this link: [Your Upstash Database](https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b)

Or go to: `https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b`

### Step 2: Find the Connection String

On your database page, look for one of these sections:

#### Option A: "Redis Connect" Section
```
┌─────────────────────────────────────────────────┐
│ Redis Connect                                    │
├─────────────────────────────────────────────────┤
│ redis://default:AXzxASQg...@us1-merry-12345... │
│ [Copy] button                                    │
└─────────────────────────────────────────────────┘
```

#### Option B: "Connection String" Section
```
┌─────────────────────────────────────────────────┐
│ Connection String                                │
├─────────────────────────────────────────────────┤
│ redis://default:AXzxASQg...@us1-merry-12345... │
│ [Copy] button                                    │
└─────────────────────────────────────────────────┘
```

#### Option C: "Details" Tab
```
┌─────────────────────────────────────────────────┐
│ Details                                          │
├─────────────────────────────────────────────────┤
│ Endpoint: us1-merry-firefly-12345.upstash.io   │
│ Port: 6379                                       │
│ Password: AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5...   │
└─────────────────────────────────────────────────┘
```

### Step 3: Copy the URL

Click the **[Copy]** button next to the connection string.

The URL should look like this:
```
redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379
```

### Step 4: Verify the URL Format

Your URL should have these parts:

```
redis://default:PASSWORD@HOST.upstash.io:6379
  │      │       │        │                 │
  │      │       │        │                 └─ Port (always 6379)
  │      │       │        └─ Host (ends with .upstash.io)
  │      │       └─ Password (long random string)
  │      └─ Username (always "default")
  └─ Protocol (always "redis://")
```

### Step 5: What NOT to Copy

❌ **Don't copy these** (they're different):

**REST API URL** (starts with https):
```
https://us1-merry-firefly-12345.upstash.io
```

**REST API Token**:
```
AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg==
```

**Individual credentials** (host, port, password separately)

✅ **Only copy the full Redis connection string** that starts with `redis://`

## Common Mistakes

### ❌ Wrong: Missing Password
```
redis://us1-merry-firefly-12345.upstash.io:6379
```

### ❌ Wrong: Missing "default:" Username
```
redis://AXzxASQg...@us1-merry-firefly-12345.upstash.io:6379
```

### ❌ Wrong: Using HTTPS URL
```
https://us1-merry-firefly-12345.upstash.io
```

### ✅ Correct: Full Connection String
```
redis://default:AXzxASQg...@us1-merry-firefly-12345.upstash.io:6379
```

## Where to Use This URL

### 1. Local Development (.env file)

Open `backend/.env` and update:
```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

### 2. Render Deployment (Environment Variables)

1. Go to Render Dashboard
2. Open your backend service
3. Click "Environment"
4. Add/update:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379`

## Quick Test

After copying the URL, test it locally:

```bash
cd backend
npm run dev
```

Look for:
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
```

If you see errors, check:
- [ ] URL starts with `redis://`
- [ ] URL includes `default:` before the password
- [ ] URL ends with `.upstash.io:6379`
- [ ] No extra spaces or line breaks
- [ ] Password is complete (not truncated)

## Need Help?

### Can't Find the Connection String?

1. Make sure you're on the database details page
2. Look for tabs: "Details", "Connect", "Configuration"
3. Try scrolling down - it might be below the fold
4. Check if database is "Active" (not "Creating" or "Error")

### Database Not Active?

Wait a few seconds and refresh the page. New databases take 10-30 seconds to activate.

### Still Can't Find It?

1. Go to Upstash console home: https://console.upstash.com
2. Click on your database name
3. Look for "Redis Connect" or "Connection String"
4. If still not visible, contact Upstash support

## Example URLs

Here are examples of what valid Upstash URLs look like:

```
redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379

redis://default:BYayBTRhZGU2Zi01NjlmLTRmNjYtOTU5Zi00ZjYtOTU5Zg@eu1-happy-butterfly-67890.upstash.io:6379

redis://default:CZbzCURiZHU3Zi02NzlmLTVmNjYtMDU5Zi01ZjYtMDU5Zg@ap1-calm-dragonfly-11111.upstash.io:6379
```

Notice they all:
- Start with `redis://default:`
- Have a long password
- End with `.upstash.io:6379`

## Security Note

⚠️ **Keep this URL secret!**

- Don't commit it to git
- Don't share it publicly
- Don't post it in forums/chat
- Store it securely (password manager)

This URL contains your password and gives full access to your Redis database.

## Next Steps

Once you have the URL:

1. ✅ Copy the URL
2. ✅ Update `backend/.env`
3. ✅ Test locally
4. ✅ Add to Render environment
5. ✅ Deploy and verify

Follow: `QUICK_FIX_REDIS.md` or `UPSTASH_CHECKLIST.md`

---

**Your Database**: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b

**What to copy**: The full `redis://default:...` connection string

**Where to use**: `backend/.env` and Render environment variables
