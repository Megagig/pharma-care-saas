# Quick Fix Reference - Deployment TypeScript Errors

## The Problem
Deployment failed with errors like:
- `Property 'diskStorage' does not exist on type 'typeof import(...multer)'`
- `Namespace has no exported member 'StorageEngine'`
- `This expression is not callable`

## The Root Cause
Build-time dependencies (`typescript` and `@types/multer`) were in `devDependencies`, but deployment platforms install only `dependencies` when running production builds.

## The Solution (3 Steps)

### 1. Delete Conflicting Type File
```bash
rm backend/src/types/multer.d.ts
```

### 2. Move Build Dependencies
In `backend/package.json`, move these from `devDependencies` to `dependencies`:
- `typescript`
- `@types/multer`

### 3. Extend Express Types
In `backend/src/types/express.d.ts`, add:
```typescript
/// <reference types="multer" />
import 'express';
import { BaseUser, ExtendedUser } from './auth';

declare global {
    namespace Express {
        interface Request {
            user?: BaseUser | ExtendedUser;
            sessionId?: string;
            file?: Multer.File;
            files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
        }
    }
}
```

## Verify
```bash
cd backend
npm install
npm run build
```

Should output: `Build completed successfully! Check dist/ directory.`

## Deploy
```bash
git add backend/package.json backend/src/types/express.d.ts
git commit -m "Fix deployment build errors - move TypeScript to production dependencies"
git push origin main
```

## Why This Works
- Deployment platforms run `npm install --production` (skips devDependencies)
- But the build script runs `npx tsc` (needs TypeScript + type definitions)
- Moving them to `dependencies` ensures they're available during build
- This is the standard pattern for TypeScript apps on cloud platforms

---
**Files Changed:**
- ✅ `backend/package.json` - Moved 2 packages to dependencies
- ✅ `backend/src/types/express.d.ts` - Added Multer types
- ❌ `backend/src/types/multer.d.ts` - Deleted (was causing conflicts)

**Zero Functionality Impact** - Only dependency organization and type definitions changed.
