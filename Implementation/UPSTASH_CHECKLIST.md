# ✅ Upstash Redis Setup Checklist

## Before You Start
- [ ] You have an Upstash account
- [ ] You have created a Redis database at: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b
- [ ] Your database status is "Active"

## Step 1: Get Upstash Credentials (2 minutes)

- [ ] Go to Upstash console: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b
- [ ] Find the "Redis Connect" or "Connection String" section
- [ ] Copy the full URL that looks like:
  ```
  redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379
  ```
- [ ] Save it somewhere safe (you'll need it twice)

## Step 2: Update Local Environment (1 minute)

- [ ] Open `backend/.env` file
- [ ] Find the line with `REDIS_URL=`
- [ ] Replace it with your Upstash URL:
  ```env
  REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
  ```
- [ ] Save the file

## Step 3: Test Locally (2 minutes)

- [ ] Open terminal
- [ ] Navigate to backend: `cd backend`
- [ ] Start the server: `npm run dev`
- [ ] Check logs for success messages:
  - [ ] ✅ "Queue Redis client connected"
  - [ ] ✅ "Redis cache connected successfully"
  - [ ] ✅ "Redis cache manager connected"
- [ ] No ECONNREFUSED errors appear
- [ ] Stop the server: `Ctrl+C`

## Step 4: Deploy to Render (3 minutes)

- [ ] Go to Render Dashboard: https://dashboard.render.com
- [ ] Click on your backend service
- [ ] Click "Environment" in the left sidebar
- [ ] Look for existing `REDIS_URL` variable:
  - [ ] If exists: Click "Edit" and update the value
  - [ ] If not exists: Click "Add Environment Variable"
- [ ] Enter:
  - **Key**: `REDIS_URL`
  - **Value**: `redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379`
- [ ] Click "Save Changes"
- [ ] Wait for "Deploying..." message

## Step 5: Monitor Deployment (3 minutes)

- [ ] Stay on Render dashboard
- [ ] Click "Logs" tab
- [ ] Watch the deployment logs
- [ ] Wait for "Live" status (green dot)
- [ ] Check for success messages in logs:
  - [ ] ✅ "Queue Redis client connected"
  - [ ] ✅ "Redis cache connected successfully"
  - [ ] ✅ No ECONNREFUSED errors

## Step 6: Verify Application (2 minutes)

- [ ] Open your application in browser
- [ ] Test key features:
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] Create/view appointments
  - [ ] No error messages
- [ ] Check Render logs again:
  - [ ] No Redis errors
  - [ ] Application running smoothly

## Step 7: Monitor Upstash Usage (1 minute)

- [ ] Go back to Upstash console
- [ ] Click on your database
- [ ] Click "Metrics" or "Usage" tab
- [ ] Verify:
  - [ ] Commands are being executed
  - [ ] No errors in Upstash logs
  - [ ] Usage is within free tier limits

## Troubleshooting

### If Local Test Fails

**Error: Connection timeout**
- [ ] Check Upstash URL is correct
- [ ] Verify no extra spaces in .env file
- [ ] Ensure URL starts with `redis://`
- [ ] Check Upstash database is "Active"

**Error: WRONGPASS**
- [ ] Copy the FULL URL from Upstash (including password)
- [ ] Don't manually type the URL
- [ ] Include the `default:` username part

**Error: Protocol error**
- [ ] Ensure you copied the Redis URL (not REST API URL)
- [ ] URL should be: `redis://...` not `https://...`

### If Render Deployment Fails

**Still seeing ECONNREFUSED**
- [ ] Verify REDIS_URL is set in Render environment
- [ ] Check for typos in the URL
- [ ] Try manual redeploy: "Manual Deploy" → "Deploy latest commit"

**Connection timeout on Render**
- [ ] Check Upstash and Render are in nearby regions
- [ ] Verify Upstash database is active
- [ ] Check Render service logs for specific error

**Application works but slow**
- [ ] Check Upstash region vs Render region
- [ ] Monitor Upstash latency in console
- [ ] Consider upgrading Upstash plan

## Success Criteria

Your setup is successful when ALL of these are true:

- ✅ Local server starts without Redis errors
- ✅ Render deployment completes successfully
- ✅ Render logs show "Redis connected" messages
- ✅ No ECONNREFUSED errors in logs
- ✅ Application features work normally
- ✅ Upstash console shows active connections
- ✅ Upstash metrics show commands being executed

## Post-Setup Tasks

- [ ] Monitor Upstash usage for 24 hours
- [ ] Check Render logs for any issues
- [ ] Test all application features
- [ ] Set up Upstash usage alerts (if available)
- [ ] Document your Upstash URL securely
- [ ] Update team on new Redis setup

## Quick Reference

### Your Upstash Database
- **Console**: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b
- **URL Format**: `redis://default:PASSWORD@HOST.upstash.io:6379`

### Render Dashboard
- **URL**: https://dashboard.render.com
- **Environment**: Backend Service → Environment
- **Logs**: Backend Service → Logs

### Local Testing
```bash
cd backend
npm run dev
# Look for: ✅ Redis connected messages
```

### Render Environment Variable
```
Key: REDIS_URL
Value: redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

## Need Help?

- 📖 Full guide: `UPSTASH_REDIS_SETUP.md`
- 🚀 Quick fix: `QUICK_FIX_REDIS.md`
- 📚 General Redis guide: `REDIS_CONFIGURATION_GUIDE.md`
- 💬 Upstash support: https://discord.gg/upstash

## Estimated Time

- **Total**: ~15 minutes
- **Active work**: ~10 minutes
- **Waiting (deploys)**: ~5 minutes

## Status

- [x] Code updated for Upstash compatibility
- [ ] Upstash URL obtained
- [ ] Local .env updated
- [ ] Local testing passed
- [ ] Render environment updated
- [ ] Render deployment successful
- [ ] Application verified working
- [ ] Monitoring set up

**Current Step**: Get your Upstash Redis URL from the console

**Next Step**: Update your local `.env` file with the URL
