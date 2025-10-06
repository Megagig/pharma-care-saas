# 🚀 Production Deployment Checklist

## Pre-Deployment Checks

### ✅ Environment Configuration

- [x] **Backend .env** - FRONTEND_URL set to production URL
- [x] **Backend .env** - CORS_ORIGINS includes production URL
- [x] **Backend .env.production** - Created with production-only settings
- [x] **Frontend .env** - VITE_API_BASE_URL set to production backend
- [x] **No hardcoded localhost** - Verified with `./verify-no-localhost.sh`

### ✅ Code Quality

- [x] **No duplicate declarations** - Fixed in clinicalInterventionService.ts
- [x] **Environment variables used** - All services use env vars, not hardcoded URLs
- [x] **CORS properly configured** - Backend allows production frontend origin
- [x] **Fallback URLs** - All services have production fallbacks

## Deployment Steps

### 1️⃣ Backend Deployment (Render)

#### Set Environment Variables in Render Dashboard

Go to your backend service settings and add these environment variables:

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

#### Deploy Backend

```bash
cd backend
git add .
git commit -m "Fix production environment configuration"
git push origin main
```

Or trigger manual deploy in Render dashboard.

### 2️⃣ Frontend Deployment

#### Verify Configuration

```bash
cat frontend/.env
# Should show production URLs
```

#### Build and Deploy

```bash
cd frontend
npm run build
git add .
git commit -m "Production deployment ready"
git push origin main
```

### 3️⃣ Post-Deployment Verification

Run the verification script:

```bash
chmod +x test-production-deployment.sh
./test-production-deployment.sh
```

Or manually test:

#### Test Backend Health
```bash
curl https://pharmacare-nttq.onrender.com/api/health
```
Expected: `{"status":"OK",...}`

#### Test CORS
```bash
curl -I -X OPTIONS https://pharmacare-nttq.onrender.com/api/auth/login \
  -H "Origin: https://pharmacare-nttq.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```
Expected: Headers include `Access-Control-Allow-Origin: https://pharmacare-nttq.onrender.com`

#### Test Frontend
1. Open https://pharmacare-nttq.onrender.com in browser
2. Open DevTools (F12) → Network tab
3. Try to login
4. Verify:
   - ✅ No CORS errors in console
   - ✅ Requests go to `https://pharmacare-nttq.onrender.com/api/...`
   - ✅ No `localhost:5000` references
   - ✅ Login works correctly

## Common Issues & Solutions

### Issue: "Network Error" on login

**Causes:**
- Backend not running
- Backend sleeping (Render free tier)
- Wrong API URL in frontend

**Solutions:**
1. Check backend status in Render dashboard
2. Wake up backend: `curl https://pharmacare-nttq.onrender.com/api/health`
3. Verify frontend .env has correct API URL
4. Check backend logs in Render

### Issue: CORS errors persist

**Causes:**
- Environment variables not set in Render
- Old cached frontend
- Backend not restarted after env var changes

**Solutions:**
1. Verify env vars in Render dashboard
2. Restart backend service in Render
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh frontend (Ctrl+Shift+R)
5. Check backend logs for CORS configuration

### Issue: 401 Unauthorized

**Causes:**
- Not logged in
- Session expired
- Cookies not being sent

**Solutions:**
1. Login first
2. Check that `credentials: 'include'` is set in API calls
3. Verify cookies are being set (DevTools → Application → Cookies)
4. Check that CORS allows credentials

### Issue: Still seeing localhost:5000

**Causes:**
- Frontend not rebuilt with new .env
- Browser cache
- Service worker cache

**Solutions:**
1. Rebuild frontend: `npm run build`
2. Clear browser cache completely
3. Unregister service workers (DevTools → Application → Service Workers)
4. Try incognito/private browsing mode

## Rollback Plan

If deployment fails:

1. **Revert environment variables** in Render to previous values
2. **Rollback code**:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Clear caches** and test
4. **Check logs** to identify the issue

## Success Criteria

✅ Backend health check returns 200 OK
✅ Frontend loads without errors
✅ Login works correctly
✅ No CORS errors in browser console
✅ No localhost references in production
✅ All API calls go to production backend
✅ Workspace settings load correctly
✅ No network errors

## Monitoring

After deployment, monitor:

1. **Backend logs** in Render dashboard
2. **Frontend console** for errors
3. **Network requests** in DevTools
4. **User reports** of issues
5. **MongoDB Atlas** for database connections

## Next Steps

After successful deployment:

1. ✅ Test all major features
2. ✅ Monitor error rates
3. ✅ Set up proper monitoring (Sentry, DataDog, etc.)
4. ✅ Configure production database backups
5. ✅ Set up SSL/TLS certificates (if not automatic)
6. ✅ Configure CDN for static assets
7. ✅ Set up CI/CD pipeline
8. ✅ Document deployment process for team

## Support

If you encounter issues not covered here:

1. Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Review backend logs in Render dashboard
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Test API endpoints directly with curl

---

**Last Updated:** 2025-10-06
**Status:** ✅ Ready for Production Deployment
