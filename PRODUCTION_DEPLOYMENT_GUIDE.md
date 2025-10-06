# Production Deployment Guide - PharmaCare

## 🚨 Issues Identified

Based on the console errors, the main issues were:

1. **Frontend trying to connect to localhost:5000** instead of production backend
2. **CORS errors** due to missing production URL in backend configuration
3. **401 Unauthorized errors** on workspace settings endpoint
4. **Duplicate FRONTEND_URL** in backend .env file

## ✅ Fixes Applied

### 1. Backend Environment Configuration

**File: `backend/.env`**
- ✅ Removed duplicate `FRONTEND_URL` entry
- ✅ Set `FRONTEND_URL=https://pharmacare-nttq.onrender.com`
- ✅ Added multiple origins to `CORS_ORIGINS` for both production and development

**File: `backend/.env.production`** (NEW)
- ✅ Created production-specific environment file
- ✅ Set `NODE_ENV=production`
- ✅ Configured production URLs only

### 2. Frontend Environment Configuration

**File: `frontend/.env`**
- ✅ Already correctly configured:
  ```env
  VITE_API_BASE_URL=https://pharmacare-nttq.onrender.com/api
  VITE_FRONTEND_URL=https://pharmacare-nttq.onrender.com
  ```

### 3. Code Fixes

**File: `frontend/src/services/clinicalInterventionService.ts`**
- ✅ Removed duplicate `API_BASE_URL` declaration

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to your Render dashboard** for the backend service
2. **Set Environment Variables** in Render:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://megagigdev:9svFmZ3VCP5ONzfU@cluster0.vf50xoc.mongodb.net/PharmaCare?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=5ac844c5da41609d1f99c6fcfdc8486824e767e9c30a0b38271be167cc23afb1
   JWT_REFRESH_SECRET=4nzyO7MxnSnCCfs8qNwxQHBRVqrryYAq
   FRONTEND_URL=https://pharmacare-nttq.onrender.com
   CORS_ORIGINS=https://pharmacare-nttq.onrender.com
   RESEND_API_KEY=re_cRCkGHT8_2duhxzbv3HsPzADnmU1FvJit
   SENDER_EMAIL=admin@megagigsolution.com
   SENDER_NAME=Pharmacare Hub
   OPENFDA_API_KEY=GjyRI4APszhf01Bc7sPSUWg59nrShJt6C5tRy7ws
   OPENROUTER_API_KEY=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
   PAYSTACK_SECRET_KEY=sk_test_a67af4a215bb1d536eec24d017d88eb17df50011
   PAYSTACK_PUBLIC_KEY=pk_test_8bd2650f18936d4ab9eaf0e51aff51905816b60e
   CACHE_PROVIDER=memory
   DISABLE_BACKGROUND_JOBS=true
   DISABLE_PERFORMANCE_JOBS=true
   DISABLE_PROFILING=true
   NOMBA_CLIENT_ID=910b9b4f-ee3b-4b2b-b5d1-34185f599b84
   NOMBA_PRIVATE_KEY=6XKu6F7A4UFJ7U/KpN8/CC1oYSTtyPrOX+/XE6PgB1EnB5Agfd7O1ijhsgWAH/MrOfc4eWcOMHhB68LercqThg==
   NOMBA_ACCOUNT_ID=91216542-0744-4bdb-a2cc-fcc2ecca6eb2
   ```

3. **Deploy the backend**:
   ```bash
   cd backend
   git add .
   git commit -m "Fix production environment configuration"
   git push
   ```

### Step 2: Rebuild Frontend

1. **Verify frontend .env is correct**:
   ```bash
   cat frontend/.env
   # Should show:
   # VITE_API_BASE_URL=https://pharmacare-nttq.onrender.com/api
   # VITE_FRONTEND_URL=https://pharmacare-nttq.onrender.com
   ```

2. **Rebuild frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy frontend** (push to your hosting):
   ```bash
   git add .
   git commit -m "Fix production deployment configuration"
   git push
   ```

### Step 3: Verify Deployment

1. **Check backend health**:
   ```bash
   curl https://pharmacare-nttq.onrender.com/api/health
   ```
   Expected: `{"status":"OK",...}`

2. **Check CORS headers**:
   ```bash
   curl -I -X OPTIONS https://pharmacare-nttq.onrender.com/api/auth/login \
     -H "Origin: https://pharmacare-nttq.onrender.com" \
     -H "Access-Control-Request-Method: POST"
   ```
   Expected: Should include `Access-Control-Allow-Origin: https://pharmacare-nttq.onrender.com`

3. **Test login from browser**:
   - Open https://pharmacare-nttq.onrender.com
   - Open browser DevTools (F12)
   - Try to login
   - Check Network tab - should see requests to `https://pharmacare-nttq.onrender.com/api/...`
   - No CORS errors should appear

## 🔍 Troubleshooting

### Issue: Still seeing localhost:5000 in console

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check that frontend was rebuilt with correct .env file
4. Verify `VITE_API_BASE_URL` in frontend/.env

### Issue: CORS errors persist

**Solution:**
1. Verify backend environment variables in Render dashboard
2. Check that `FRONTEND_URL` and `CORS_ORIGINS` are set correctly
3. Restart backend service in Render
4. Check backend logs for CORS configuration

### Issue: 401 Unauthorized on workspace settings

**Solution:**
1. This is expected if not logged in
2. Login first, then the endpoint should work
3. Check that cookies are being sent with requests (credentials: 'include')

### Issue: Network Error on login

**Solution:**
1. Verify backend is running: `curl https://pharmacare-nttq.onrender.com/api/health`
2. Check backend logs in Render dashboard
3. Verify MongoDB connection string is correct
4. Check that backend service is not sleeping (Render free tier)

## 📝 Local Development

For local development, the configuration now supports both:

**Backend .env:**
```env
FRONTEND_URL=https://pharmacare-nttq.onrender.com
CORS_ORIGINS=https://pharmacare-nttq.onrender.com,http://localhost:5173,http://localhost:3000
```

This allows:
- ✅ Production frontend to connect to production backend
- ✅ Local frontend (localhost:5173) to connect to local backend
- ✅ Local frontend to connect to production backend (for testing)

**To run locally:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🎯 Key Points

1. **No hardcoded localhost references** - All services use environment variables
2. **Proper CORS configuration** - Backend allows production frontend origin
3. **Separate production config** - `.env.production` for production-specific settings
4. **Development still works** - CORS allows both production and local origins
5. **Environment variables in Render** - Must be set in Render dashboard, not just in .env files

## ✨ Expected Result

After deployment:
- ✅ No CORS errors
- ✅ No localhost:5000 references in production
- ✅ Login works correctly
- ✅ All API calls go to production backend
- ✅ Workspace settings load correctly
- ✅ Development environment still works

## 🔐 Security Notes

1. **JWT Secrets** - Consider rotating these for production
2. **API Keys** - Verify all API keys are production keys, not test keys
3. **Database** - Ensure MongoDB Atlas has proper IP whitelist
4. **CORS** - Only production frontend URL is allowed in production
5. **Environment Variables** - Never commit .env files with real secrets to git

## 📞 Support

If issues persist after following this guide:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly with curl
5. Check MongoDB Atlas connection and IP whitelist
