# 🔧 Render Environment Variables - Required Updates

## Current Analysis

Your Render environment is configured for **Upstash REST API with disabled features**. We need to update it for **VPS Redis with full functionality**.

---

## ❌ REMOVE These Variables

These are blocking full functionality:

```bash
CACHE_PROVIDER=memory                    # ❌ Remove - we want Redis cache
DISABLE_BACKGROUND_JOBS=true            # ❌ Remove - we want background jobs
DISABLE_PERFORMANCE_JOBS=true           # ❌ Remove - we want performance jobs
```

**Why remove:**
- `CACHE_PROVIDER=memory` forces memory cache instead of Redis
- `DISABLE_BACKGROUND_JOBS=true` disables Bull queues (appointment reminders, etc.)
- `DISABLE_PERFORMANCE_JOBS=true` disables performance monitoring jobs

---

## ✅ ADD These Variables

Add your VPS Redis connection:

```bash
REDIS_URL=redis://:Makingexploit4life@247@46.202.141.1:6379
```

**Important:** Make sure you've allowed Render IPs on your VPS firewall first!

---

## ✅ KEEP These Variables (Already Correct)

### Core Configuration
```bash
NODE_ENV=production                      # ✅ Keep
NODE_VERSION=20.19.5                     # ✅ Keep
PORT=5000                                # ✅ Keep
FRONTEND_URL=https://pharmacare-nttq.onrender.com  # ✅ Keep
CORS_ORIGINS=https://pharmacare-nttq.onrender.com  # ✅ Keep
```

### Database
```bash
MONGODB_URI="mongodb+srv://..."          # ✅ Keep
```

### Security & Auth
```bash
JWT_SECRET=5ac844c5da41609d1f99c6fcfdc8486824e767e9c30a0b38271be167cc23afb1  # ✅ Keep
JWT_REFRESH_SECRET=4nzyO7MxnSnCCfs8qNwxQHBRVqrryYAq  # ✅ Keep
```

### File Upload
```bash
FILE_UPLOAD_PATH=./public/uploads       # ✅ Keep
MAX_FILE_SIZE=10000000                  # ✅ Keep
```

### Cloudinary
```bash
CLOUDINARY_CLOUD_NAME=dsguyuamo         # ✅ Keep
CLOUDINARY_API_KEY=239631528231549      # ✅ Keep
CLOUDINARY_API_SECRET=0h4qgRhe1EKteskdrLp5be_Eo-g  # ✅ Keep
```

### Email (Resend)
```bash
RESEND_API_KEY=re_cRCkGHT8_2duhxzbv3HsPzADnmU1FvJit  # ✅ Keep
SENDER_EMAIL=admin@megagigsolution.com   # ✅ Keep
SENDER_NAME="Pharmacare Hub"             # ✅ Keep
FROM_EMAIL=noreply@pharmacare.com        # ✅ Keep
FROM_NAME="PharmaCare SaaS"              # ✅ Keep
```

### Email (SMTP Fallback)
```bash
SMTP_HOST=smtp.gmail.com                 # ✅ Keep (even if not used)
SMTP_PORT=587                            # ✅ Keep
SMTP_USER=your-email@gmail.com           # ✅ Keep
SMTP_PASS=your-app-password              # ✅ Keep
```

### SMS (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ✅ Keep (mock mode)
TWILIO_AUTH_TOKEN=your-twilio-auth-token  # ✅ Keep
TWILIO_PHONE_NUMBER=+1234567890          # ✅ Keep
```

### Payment (Paystack)
```bash
PAYSTACK_SECRET_KEY=sk_test_a67af4a215bb1d536eec24d017d88eb17df50011  # ✅ Keep
PAYSTACK_PUBLIC_KEY=pk_test_8bd2650f18936d4ab9eaf0e51aff51905816b60e  # ✅ Keep
PAYSTACK_WEBHOOK_SECRET=whsec_your-webhook-secret  # ✅ Keep
```

### Payment (Nomba)
```bash
NOMBA_CLIENT_ID=910b9b4f-ee3b-4b2b-b5d1-34185f599b84  # ✅ Keep
NOMBA_PRIVATE_KEY="6XKu6F7A4UFJ7U/KpN8/CC1oYSTtyPrOX+/XE6PgB1EnB5Agfd7O1ijhsgWAH/MrOfc4eWcOMHhB68LercqThg=="  # ✅ Keep
NOMBA_ACCOUNT_ID=91216542-0744-4bdb-a2cc-fcc2ecca6eb2  # ✅ Keep
```

### APIs
```bash
OPENFDA_API_KEY=GjyRI4APszhf01Bc7sPSUWg59nrShJt6C5tRy7ws  # ✅ Keep
OPENROUTER_API_KEY=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  # ✅ Keep
```

### Rate Limiting
```bash
RATE_LIMIT_MAX_REQUESTS=5000             # ✅ Keep
RATE_LIMIT_WINDOW_MS=900000              # ✅ Keep
```

### Other
```bash
DISABLE_PROFILING=true                   # ✅ Keep (for MongoDB Atlas)
VITE_API_BASE_URL=https://pharmacare-nttq.onrender.com/api  # ✅ Keep (frontend var)
```

### Upstash (Optional - for UnifiedCacheService fallback)
```bash
UPSTASH_REDIS_REST_URL=https://open-kid-31747.upstash.io  # ✅ Keep (optional)
UPSTASH_REDIS_REST_TOKEN=AXwDAAIncDI2OWQwZDgzMjE0ZjA0OGU5YTZlODE4ODBjMmNiNTI3NXAyMzE3NDc  # ✅ Keep (optional)
```

**Note:** These Upstash variables are optional. UnifiedCacheService will use them if available, otherwise falls back to memory cache. Not critical since main Redis services use VPS Redis.

---

## 📋 Step-by-Step Update Guide

### Step 1: Allow Render IPs on VPS (CRITICAL - Do This First!)

```bash
# SSH to your VPS
ssh root@46.202.141.1

# Allow Render IP ranges
sudo ufw allow from 216.24.57.0/24 to any port 6379
sudo ufw allow from 216.24.58.0/24 to any port 6379

# Verify firewall rules
sudo ufw status numbered

# Test Redis is accessible
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 ping
# Should return: PONG
```

### Step 2: Update Render Environment Variables

Go to Render Dashboard → Your Service → Environment

**A. Delete These Variables:**
1. Click on `CACHE_PROVIDER` → Delete
2. Click on `DISABLE_BACKGROUND_JOBS` → Delete
3. Click on `DISABLE_PERFORMANCE_JOBS` → Delete

**B. Add This Variable:**
1. Click "Add Environment Variable"
2. Key: `REDIS_URL`
3. Value: `redis://:Makingexploit4life@247@46.202.141.1:6379`
4. Click "Save Changes"

### Step 3: Deploy

Render will automatically redeploy when you save environment changes.

### Step 4: Monitor Deployment Logs

Watch for these success indicators:

```
✅ Database connected successfully
✅ Redis cache manager connected
✅ Background job service initialized successfully
✅ Redis connected for presence tracking
Initializing QueueService...
QueueService initialized successfully
✅ All cron jobs started
🚀 Server running on port 5000 in production mode
```

**❌ If you see errors:**
- `ETIMEDOUT` or `ECONNREFUSED` → VPS firewall not configured
- `NOAUTH` → Wrong password in REDIS_URL
- `MaxRetriesPerRequestError` → Redis not accessible from Render

---

## 🔍 Verification Checklist

After deployment, verify:

### 1. Check Render Logs
```
✅ Redis cache manager connected
✅ Background job service initialized
✅ Redis connected for presence tracking
✅ QueueService initialized successfully
```

### 2. Test Redis Connection from VPS
```bash
# On your VPS, check Redis connections
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 client list

# Should show connections from Render IPs (216.24.57.x or 216.24.58.x)
```

### 3. Test Application Features
- Create an appointment → Check if reminder jobs are queued
- Login with multiple users → Check presence tracking
- Load dashboard → Check if caching works
- Check background jobs are processing

### 4. Monitor Redis on VPS
```bash
# Watch Redis activity
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 monitor

# Check memory usage
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 info memory

# Check connected clients
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 client list
```

---

## 📊 Before vs After Comparison

| Feature | Before (Current) | After (Updated) |
|---------|-----------------|-----------------|
| **Cache** | Memory only | Redis (VPS) |
| **Background Jobs** | ❌ Disabled | ✅ Enabled |
| **Performance Jobs** | ❌ Disabled | ✅ Enabled |
| **Appointment Reminders** | ❌ Not working | ✅ Working |
| **Presence Tracking** | ❌ Not working | ✅ Working |
| **Bull Queues** | ❌ Not working | ✅ Working |
| **Caching Performance** | Slow (memory) | Fast (Redis) |
| **Features Working** | ~60% | 100% |

---

## 🚨 Important Security Notes

### 1. VPS Firewall Configuration
```bash
# Only allow Render IPs, not the entire internet
sudo ufw status

# Should show:
# 216.24.57.0/24    ALLOW    6379
# 216.24.58.0/24    ALLOW    6379

# Should NOT show:
# Anywhere          ALLOW    6379  ❌ DANGEROUS!
```

### 2. Redis Password
Your Redis password is in the URL: `Makingexploit4life@247`

**Recommendations:**
- ✅ Current password is strong
- ✅ Only accessible from Render IPs
- ✅ Not exposed to public internet

### 3. Monitor Access
```bash
# Regularly check who's connected to Redis
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 client list

# Should only see Render IPs (216.24.57.x or 216.24.58.x)
```

---

## 🔄 Rollback Plan (If Issues Occur)

If deployment fails or has issues:

### Quick Rollback
1. Go to Render Dashboard → Environment
2. Add back:
   ```
   CACHE_PROVIDER=memory
   DISABLE_BACKGROUND_JOBS=true
   DISABLE_PERFORMANCE_JOBS=true
   ```
3. Remove:
   ```
   REDIS_URL
   ```
4. Save and redeploy

### Or Revert Git Commit
```bash
git revert HEAD
git push origin main
```

---

## 📝 Final Environment Variables List

After updates, your Render environment should have:

```bash
# Core
NODE_ENV=production
NODE_VERSION=20.19.5
PORT=5000
FRONTEND_URL=https://pharmacare-nttq.onrender.com
CORS_ORIGINS=https://pharmacare-nttq.onrender.com

# Database
MONGODB_URI="mongodb+srv://..."

# Redis (NEW!)
REDIS_URL=redis://:Makingexploit4life@247@46.202.141.1:6379

# Upstash (Optional)
UPSTASH_REDIS_REST_URL=https://open-kid-31747.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXwDAAInc...

# Security
JWT_SECRET=5ac844c5da41609d1f99c6fcfdc8486824e767e9c30a0b38271be167cc23afb1
JWT_REFRESH_SECRET=4nzyO7MxnSnCCfs8qNwxQHBRVqrryYAq

# File Upload
FILE_UPLOAD_PATH=./public/uploads
MAX_FILE_SIZE=10000000

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsguyuamo
CLOUDINARY_API_KEY=239631528231549
CLOUDINARY_API_SECRET=0h4qgRhe1EKteskdrLp5be_Eo-g

# Email
RESEND_API_KEY=re_cRCkGHT8_2duhxzbv3HsPzADnmU1FvJit
SENDER_EMAIL=admin@megagigsolution.com
SENDER_NAME="Pharmacare Hub"
FROM_EMAIL=noreply@pharmacare.com
FROM_NAME="PharmaCare SaaS"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment
PAYSTACK_SECRET_KEY=sk_test_a67af4a215bb1d536eec24d017d88eb17df50011
PAYSTACK_PUBLIC_KEY=pk_test_8bd2650f18936d4ab9eaf0e51aff51905816b60e
PAYSTACK_WEBHOOK_SECRET=whsec_your-webhook-secret
NOMBA_CLIENT_ID=910b9b4f-ee3b-4b2b-b5d1-34185f599b84
NOMBA_PRIVATE_KEY="6XKu6F7A4UFJ7U/KpN8/CC1oYSTtyPrOX+/XE6PgB1EnB5Agfd7O1ijhsgWAH/MrOfc4eWcOMHhB68LercqThg=="
NOMBA_ACCOUNT_ID=91216542-0744-4bdb-a2cc-fcc2ecca6eb2

# APIs
OPENFDA_API_KEY=GjyRI4APszhf01Bc7sPSUWg59nrShJt6C5tRy7ws
OPENROUTER_API_KEY=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

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5000
RATE_LIMIT_WINDOW_MS=900000

# Other
DISABLE_PROFILING=true
VITE_API_BASE_URL=https://pharmacare-nttq.onrender.com/api
```

**Total Variables:** ~40 (removed 3, added 1)

---

## ✅ Ready to Update?

Follow the steps in order:
1. ✅ Configure VPS firewall (allow Render IPs)
2. ✅ Update Render environment variables
3. ✅ Monitor deployment logs
4. ✅ Test application features
5. ✅ Celebrate! 🎉

**Estimated Time:** 10-15 minutes
