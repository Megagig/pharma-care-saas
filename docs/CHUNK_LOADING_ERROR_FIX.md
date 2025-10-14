# Chunk Loading Error Fix - Deployment Guide

## Problem
After deployment, users encounter "Failed to load dynamically imported module" errors that disappear after refresh. This happens because:

1. **Browser caches old `index.html`** with references to old asset hashes
2. **New deployment generates new hashes** (e.g., `ModernDashboardPage-ABC123.js` → `ModernDashboardPage-XYZ789.js`)
3. **Cached HTML tries to load old files** that no longer exist
4. **Refresh works** because it fetches the new `index.html` with correct hashes

## Solutions Implemented

### 1. ✅ Chunk Error Boundary (Immediate Fix)
**File**: `frontend/src/components/ChunkErrorBoundary.tsx`

- Catches chunk loading errors
- Auto-reloads the page after 2 seconds
- Shows user-friendly "Updating..." message
- Wraps the entire app in `main.tsx`

**How it works**:
```tsx
<ChunkErrorBoundary>
  <App />
</ChunkErrorBoundary>
```

### 2. ✅ Proper Cache Headers (Backend)
**File**: `backend/src/app.ts`

**Cache Strategy**:
- **`index.html`**: `no-cache` (always fetch latest)
- **Hashed assets** (`*.js`, `*.css` with hash): `max-age=31536000` (1 year)
- **Other assets** (images, fonts): `max-age=604800` (1 week)

```typescript
app.use(
  express.static(path.join(__dirname, "../../frontend/build"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.match(/\.(js|css)$/) && filePath.match(/-[a-f0-9]{8}\./)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);
```

### 3. ✅ Version Check Service
**File**: `frontend/src/services/versionCheckService.ts`

- Checks for updates every 5 minutes in production
- Compares `ETag` and `Last-Modified` headers
- Prompts user to reload when new version detected
- Auto-starts in production mode

**Initialized in**: `frontend/src/App.tsx`

### 4. ✅ Optimized Vite Build Config
**File**: `frontend/vite.config.ts`

**Features**:
- Smart code splitting (React, Router, MUI, etc.)
- Consistent hash-based filenames
- Tree shaking enabled
- CSS code splitting
- Source maps in development only

## Testing the Fix

### Local Testing
1. Build the app:
   ```bash
   cd frontend
   npm run build
   ```

2. Simulate deployment:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run build && npm start
   
   # The backend now serves frontend/build with proper headers
   ```

3. Test cache behavior:
   ```bash
   # Check headers
   curl -I http://localhost:5000/
   curl -I http://localhost:5000/assets/index-ABC123.js
   ```

### Production Testing
1. Deploy to Render.com
2. Open DevTools → Network tab
3. Check response headers for `index.html` and assets
4. Verify:
   - `index.html` has `Cache-Control: no-cache`
   - JS/CSS assets have `Cache-Control: max-age=31536000`

### Simulate the Error
1. Deploy version 1
2. Open app, let it load completely
3. Deploy version 2 (changes chunk hashes)
4. Navigate to a lazy-loaded route
5. **Expected**: ChunkErrorBoundary catches error and auto-reloads
6. **Verify**: Console shows "Chunk error detected - auto-reloading..."

## Render.com Specific Configuration

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### Environment Variables
Add to Render dashboard:
```
NODE_ENV=production
VITE_APP_VERSION=1.0.0  # Optional, increment on each deploy
```

### Static File Serving
Render serves from `backend/src/../../frontend/build` via Express.

## Monitoring

### Check Logs
```bash
# Render logs
# Look for:
# - [VersionCheck] Starting version monitoring
# - [VersionCheck] New version detected!
```

### Browser Console
```javascript
// Check cache headers
fetch('/').then(r => console.log(r.headers.get('cache-control')))
fetch('/assets/index-ABC123.js').then(r => console.log(r.headers.get('cache-control')))
```

## Additional Recommendations

### 1. Service Worker Cache Strategy
Update `vite-plugin-pwa` config:
```typescript
registerSW({
  onNeedRefresh: () => {
    // Prompt user to reload
    window.location.reload();
  },
})
```

### 2. CI/CD Pipeline
Add cache-busting to deployment:
```yaml
# .github/workflows/deploy.yml
- name: Build Frontend
  env:
    VITE_APP_VERSION: ${{ github.sha }}
  run: npm run build
```

### 3. CDN Configuration (if using)
```
# CloudFlare, etc.
Cache-Control for /:
  - Browser TTL: 0
  - Edge TTL: 0

Cache-Control for /assets/*:
  - Browser TTL: 31536000
  - Edge TTL: 31536000
```

## Troubleshooting

### Issue: Still getting chunk errors
**Solution**: Clear browser cache completely
```bash
# Chrome DevTools
Right-click reload → Empty Cache and Hard Reload
```

### Issue: Version check not working
**Check**: 
1. `import.meta.env.PROD` is `true` in production
2. ETag headers are being sent by server
3. Browser console for `[VersionCheck]` logs

### Issue: Infinite reload loop
**Solution**: Check if chunk error boundary is catching non-chunk errors
```typescript
// In ChunkErrorBoundary.tsx
const isChunkError = 
  error.message.includes('Failed to fetch dynamically imported module') ||
  error.message.includes('error loading dynamically imported module');
```

## Success Metrics

✅ **No chunk loading errors** after deployment  
✅ **Auto-reload on error** (invisible to user)  
✅ **Version notification** every 5 minutes  
✅ **Proper cache headers** on all assets  
✅ **Fast subsequent loads** (hashed assets cached)

## Deployment Checklist

- [ ] ChunkErrorBoundary wrapping App
- [ ] Version check service initialized
- [ ] Backend serves static files with proper headers
- [ ] `index.html` has no-cache headers
- [ ] Hashed assets have long-term cache
- [ ] Build generates consistent hashes
- [ ] Test deployment cycle (v1 → v2)
- [ ] Verify auto-reload on chunk error
- [ ] Check browser console for errors
- [ ] Monitor production logs

## References

- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [HTTP Caching Best Practices](https://web.dev/http-cache/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Module Preloading](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/modulepreload)
