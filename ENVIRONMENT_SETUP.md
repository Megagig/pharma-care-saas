# Environment Setup Guide

## Overview

This project uses different environment configurations for development and production to ensure smooth local development while maintaining production stability.

## Environment Files

### `.env` (Production - Committed to Git)
Contains production URLs. This file is committed to git and used for production builds.

```env
VITE_API_BASE_URL=https://PharmaPilot-nttq.onrender.com/api
VITE_API_URL=https://PharmaPilot-nttq.onrender.com
VITE_FRONTEND_URL=https://PharmaPilot-nttq.onrender.com
```

### `.env.local` (Development - NOT Committed)
Contains local development URLs. This file is NOT committed to git and overrides `.env` for local development.

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
```

### `.env.example` (Template - Committed to Git)
Template file for other developers to copy.

## Setup Instructions

### For Local Development

1. **Copy the example file**:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Verify the local URLs** in `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_API_URL=http://localhost:5000
   VITE_FRONTEND_URL=http://localhost:5173
   ```

3. **Start your local backend**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Start your local frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the app** at `http://localhost:5173`

### For Production Deployment

**No changes needed!** The production build automatically uses the `.env` file with production URLs.

```bash
cd frontend
npm run build
```

The build will use the production URLs from `.env`.

## How It Works

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Loaded in all cases (production URLs)
2. `.env.local` - Loaded in all cases, overrides `.env` (development URLs)
3. `.env.production` - Only loaded in production builds
4. `.env.production.local` - Only loaded in production builds, overrides all

For local development:
- `.env.local` overrides `.env`
- Your local URLs are used

For production builds:
- `.env.local` is ignored (not committed to git)
- Production URLs from `.env` are used

## Troubleshooting

### Issue: Getting 401 errors or "session expired" in development

**Cause**: Frontend is pointing to production API instead of local backend.

**Solution**:
1. Check if `.env.local` exists in the `frontend` folder
2. If not, create it: `cp .env.example .env.local`
3. Verify it contains `http://localhost:5000` URLs
4. Restart the frontend dev server: `npm run dev`
5. Clear browser cookies and cache
6. Try logging in again

### Issue: Production is broken after pushing changes

**Cause**: Accidentally committed `.env.local` or modified `.env` incorrectly.

**Solution**:
1. Check that `.env` still has production URLs
2. Ensure `.env.local` is in `.gitignore`
3. Remove `.env.local` from git if accidentally committed:
   ```bash
   git rm --cached frontend/.env.local
   git commit -m "Remove .env.local from git"
   ```

### Issue: Other developers can't run the app locally

**Cause**: They don't have `.env.local` file.

**Solution**:
1. Tell them to copy the example file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

## Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | `https://PharmaPilot-nttq.onrender.com/api` |
| `VITE_API_URL` | `http://localhost:5000` | `https://PharmaPilot-nttq.onrender.com` |
| `VITE_FRONTEND_URL` | `http://localhost:5173` | `https://PharmaPilot-nttq.onrender.com` |

## Best Practices

1. ✅ **DO** commit `.env` with production URLs
2. ✅ **DO** commit `.env.example` with development URLs
3. ✅ **DO** create `.env.local` for local development
4. ❌ **DON'T** commit `.env.local` to git
5. ❌ **DON'T** put sensitive data in `.env` (use backend environment variables for secrets)
6. ❌ **DON'T** modify `.env` for local development (use `.env.local` instead)

## Quick Reference

```bash
# Setup for new developers
cd frontend
cp .env.example .env.local

# Start development
npm run dev

# Build for production (uses .env automatically)
npm run build

# Check which environment variables are loaded
npm run dev -- --debug
```

## Files Summary

| File | Committed? | Used In | Purpose |
|------|-----------|---------|---------|
| `.env` | ✅ Yes | All environments | Production URLs |
| `.env.local` | ❌ No | Development only | Local development URLs |
| `.env.example` | ✅ Yes | Template | Example for developers |
| `.gitignore` | ✅ Yes | Git | Prevents committing `.env.local` |

## Support

If you encounter any issues with environment setup, check:
1. `.env.local` exists and has correct URLs
2. Backend is running on `http://localhost:5000`
3. Frontend is running on `http://localhost:5173`
4. Browser cookies are cleared
5. No CORS errors in browser console
