# 🚀 Render Deployment Steps

## Step-by-Step Guide for Deploying to Render

### 📋 Prerequisites

- ✅ Render account created
- ✅ Backend service created on Render
- ✅ Frontend service created on Render (or using static site)
- ✅ MongoDB Atlas database set up
- ✅ All fixes from this repository applied

---

## 🔧 Backend Deployment

### Step 1: Access Backend Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (e.g., "pharmacare-backend")
3. Go to **"Environment"** tab in the left sidebar

### Step 2: Set Environment Variables

Click **"Add Environment Variable"** and add each of these:

#### Required Variables

```
NODE_ENV=production
PORT=5000
```

#### Database
```
MONGODB_URI=mongodb+srv://megagigdev:9svFmZ3VCP5ONzfU@cluster0.vf50xoc.mongodb.net/PharmaCare?retryWrites=true&w=majority&appName=Cluster0
```

#### Authentication
```
JWT_SECRET=5ac844c5da41609d1f99c6fcfdc8486824e767e9c30a0b38271be167cc23afb1
JWT_REFRESH_SECRET=4nzyO7MxnSnCCfs8qNwxQHBRVqrryYAq
```

#### CORS & Frontend
```
FRONTEND_URL=https://pharmacare-nttq.onrender.com
CORS_ORIGINS=https://pharmacare-nttq.onrender.com
```

#### Email Service
```
RESEND_API_KEY=re_cRCkGHT8_2duhxzbv3HsPzADnmU1FvJit
SENDER_EMAIL=admin@megagigsolution.com
SENDER_NAME=Pharmacare Hub
```

#### External APIs
```
OPENFDA_API_KEY=GjyRI4APszhf01Bc7sPSUWg59nrShJt6C5tRy7ws
OPENROUTER_API_KEY=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
```

#### Payment Gateway
```
PAYSTACK_SECRET_KEY=sk_test_a67af4a215bb1d536eec24d017d88eb17df50011
PAYSTACK_PUBLIC_KEY=pk_test_8bd2650f18936d4ab9eaf0e51aff51905816b60e
```

#### Performance Settings
```
CACHE_PROVIDER=memory
DISABLE_BACKGROUND_JOBS=true
DISABLE_PERFORMANCE_JOBS=true
DISABLE_PROFILING=true
```

#### Nomba Integration
```
NOMBA_CLIENT_ID=910b9b4f-ee3b-4b2b-b5d1-34185f599b84
NOMBA_PRIVATE_KEY=6XKu6F7A4UFJ7U/KpN8/CC1oYSTtyPrOX+/XE6PgB1EnB5Agfd7O1ijhsgWAH/MrOfc4eWcOMHhB68LercqThg==
NOMBA_ACCOUNT_ID=91216542-0744-4bdb-a2cc-fcc2ecca6eb2
```

### Step 3: Configure Build Settings

1. Go to **"Settings"** tab
2. Verify **Build Command**: `npm install && npm run build`
3. Verify **Start Command**: `npm start` or `node dist/server.js`
4. **Root Directory**: `backend` (if monorepo) or leave empty

### Step 4: Deploy Backend

**Option A: Automatic Deploy (Recommended)**
1. Go to **"Settings"** → **"Build & Deploy"**
2. Enable **"Auto-Deploy"** for your main branch
3. Push your code:
   ```bash
   cd backend
   git add .
   git commit -m "Fix production environment configuration"
   git push origin main
   ```
4. Render will automatically deploy

**Option B: Manual Deploy**
1. Go to **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment to complete

### Step 5: Verify Backend Deployment

1. Wait for deployment to complete (check logs)
2. Click on your service URL (e.g., `https://pharmacare-nttq.onrender.com`)
3. Test health endpoint:
   ```bash
   curl https://pharmacare-nttq.onrender.com/api/health
   ```
4. Should return: `{"status":"OK",...}`

---

## 🎨 Frontend Deployment

### Step 1: Access Frontend Service

1. Go to Render Dashboard
2. Click on your frontend service (e.g., "pharmacare-frontend")

### Step 2: Set Environment Variables

Add these environment variables:

```
VITE_API_BASE_URL=https://pharmacare-nttq.onrender.com/api
VITE_FRONTEND_URL=https://pharmacare-nttq.onrender.com
```

**Note:** For Vite, environment variables must be prefixed with `VITE_`

### Step 3: Configure Build Settings

1. Go to **"Settings"** tab
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist` (for Vite) or `build` (for CRA)
4. **Root Directory**: `frontend` (if monorepo) or leave empty

### Step 4: Deploy Frontend

**Option A: Automatic Deploy**
1. Enable **"Auto-Deploy"**
2. Push your code:
   ```bash
   cd frontend
   git add .
   git commit -m "Production deployment ready"
   git push origin main
   ```

**Option B: Manual Deploy**
1. Click **"Manual Deploy"**
2. Click **"Deploy latest commit"**

### Step 5: Verify Frontend Deployment

1. Wait for deployment to complete
2. Open your frontend URL: `https://pharmacare-nttq.onrender.com`
3. Open browser DevTools (F12)
4. Check Network tab - requests should go to production backend
5. Try to login - should work without CORS errors

---

## 🔍 Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://pharmacare-nttq.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-06T...",
  "uptime": 123.45
}
```

### 2. Test CORS Configuration

```bash
curl -I -X OPTIONS https://pharmacare-nttq.onrender.com/api/auth/login \
  -H "Origin: https://pharmacare-nttq.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```

Expected headers:
```
Access-Control-Allow-Origin: https://pharmacare-nttq.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### 3. Test Frontend

1. Open `https://pharmacare-nttq.onrender.com`
2. Open DevTools (F12) → Console
3. Should see NO errors
4. Try to login
5. Check Network tab:
   - ✅ Requests go to `https://pharmacare-nttq.onrender.com/api/...`
   - ✅ No `localhost:5000` references
   - ✅ No CORS errors

### 4. Run Automated Tests

```bash
./test-production-deployment.sh
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Issue: Service won't start

**Check:**
1. Render logs (click "Logs" tab)
2. Look for errors in startup
3. Common issues:
   - Missing environment variables
   - Database connection failed
   - Port already in use

**Solution:**
1. Verify all environment variables are set
2. Check MongoDB Atlas IP whitelist (allow all: `0.0.0.0/0`)
3. Restart service

#### Issue: 502 Bad Gateway

**Causes:**
- Backend crashed
- Backend taking too long to start
- Port misconfiguration

**Solution:**
1. Check logs for errors
2. Verify `PORT` environment variable is set to `5000`
3. Check that your app listens on `process.env.PORT`

#### Issue: Database connection failed

**Solution:**
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas:
   - Network Access → Add IP: `0.0.0.0/0` (allow all)
   - Database Access → Verify user credentials
3. Test connection string locally

### Frontend Issues

#### Issue: Still seeing localhost:5000

**Solution:**
1. Verify `VITE_API_BASE_URL` is set in Render
2. Rebuild frontend (trigger new deploy)
3. Clear browser cache completely
4. Hard refresh (Ctrl+Shift+R)

#### Issue: CORS errors

**Solution:**
1. Verify backend `CORS_ORIGINS` includes frontend URL
2. Restart backend service
3. Check backend logs for CORS configuration
4. Verify frontend URL matches exactly (no trailing slash)

#### Issue: 404 on routes

**Solution:**
1. Add `_redirects` file to frontend:
   ```
   /*    /index.html   200
   ```
2. Or configure in Render:
   - Settings → Redirects/Rewrites
   - Add: `/*` → `/index.html` (200)

---

## 📊 Monitoring

### View Logs

**Backend:**
1. Go to backend service
2. Click "Logs" tab
3. Monitor for errors

**Frontend:**
1. Go to frontend service
2. Click "Logs" tab
3. Check build logs

### Set Up Alerts

1. Go to service settings
2. Click "Notifications"
3. Add email or Slack webhook
4. Get notified of:
   - Deploy failures
   - Service crashes
   - High error rates

---

## 🔄 Updating Deployment

### Update Environment Variables

1. Go to service → Environment tab
2. Edit or add variables
3. Click "Save Changes"
4. **Important:** Service will automatically restart

### Update Code

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Render will auto-deploy if enabled
# Or manually deploy from dashboard
```

---

## 💡 Best Practices

1. **Use Environment Variables**
   - Never hardcode secrets in code
   - Set all config in Render dashboard

2. **Enable Auto-Deploy**
   - Automatic deployments on push
   - Faster iteration

3. **Monitor Logs**
   - Check logs regularly
   - Set up alerts for errors

4. **Use Health Checks**
   - Render can auto-restart on health check failures
   - Configure in Settings → Health Check Path: `/api/health`

5. **Database Backups**
   - Set up MongoDB Atlas automated backups
   - Test restore process

6. **Staging Environment**
   - Create separate Render services for staging
   - Test changes before production

---

## 📞 Support

### Render Support
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

### MongoDB Atlas Support
- [MongoDB Documentation](https://docs.atlas.mongodb.com)
- [MongoDB Community](https://community.mongodb.com)

### Project Documentation
- `PRODUCTION_FIX_SUMMARY.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`

---

**Last Updated:** 2025-10-06
**Status:** ✅ Ready for Deployment
