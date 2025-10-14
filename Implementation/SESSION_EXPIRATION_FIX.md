# Session Expiration Issue - Fix Documentation

## Problem
Users were experiencing immediate session expiration after login, being redirected to `/login?session=expired`.

## Root Causes Identified

### 1. Inconsistent Status Field Handling
The `suspendUser()` and `reactivateUser()` methods were only updating the `isActive` field but not the `status` field:
- `suspendUser()` set `isActive: false` but didn't set `status: 'suspended'`
- `reactivateUser()` set `isActive: true` but didn't set `status: 'active'`

This caused a mismatch where:
- Auth middleware checks `status` field
- User management methods were only updating `isActive` field
- Users could have `status: 'active'` but `isActive: false`, causing auth failures

### 2. Auth Middleware Status Validation
The auth middleware was blocking users based on `status` field, but the user management methods weren't consistently updating it.

## Fixes Applied

### 1. Updated `suspendUser()` Method
**File**: `backend/src/services/UserManagementService.ts`

```typescript
// Before
await User.findByIdAndUpdate(userId, {
  isActive: false,
  suspendedAt: new Date(),
  suspensionReason: reason,
  updatedAt: new Date()
});

// After
await User.findByIdAndUpdate(userId, {
  status: 'suspended',  // ✅ Added
  isActive: false,
  suspendedAt: new Date(),
  suspensionReason: reason,
  updatedAt: new Date()
});
```

### 2. Updated `reactivateUser()` Method
**File**: `backend/src/services/UserManagementService.ts`

```typescript
// Before
await User.findByIdAndUpdate(userId, {
  isActive: true,
  $unset: {
    suspendedAt: 1,
    suspensionReason: 1
  },
  updatedAt: new Date()
});

// After
await User.findByIdAndUpdate(userId, {
  status: 'active',  // ✅ Added
  isActive: true,
  $unset: {
    suspendedAt: 1,
    suspensionReason: 1
  },
  updatedAt: new Date()
});
```

### 3. Enhanced Auth Middleware
**File**: `backend/src/middlewares/auth.ts`

Added explicit checks for suspended and rejected users before the general status check:

```typescript
// Block suspended users explicitly
if (user.status === 'suspended') {
  res.status(401).json({
    message: 'Account is suspended. Please contact support.',
    status: user.status,
    requiresAction: 'contact_support',
  });
  return;
}

// Block license_rejected users
if (user.status === 'license_rejected') {
  res.status(401).json({
    message: 'License verification was rejected. Please resubmit your license.',
    status: user.status,
    requiresAction: 'license_resubmission',
  });
  return;
}
```

### 4. Created Migration Script
**File**: `backend/scripts/fixUserStatuses.ts`

Created a script to fix any existing users with inconsistent status/isActive fields:

```bash
# Run the migration script
cd backend
npx ts-node scripts/fixUserStatuses.ts
```

The script:
- Fixes active users with `isActive: false`
- Fixes suspended users with `isActive: true`
- Fixes pending users with `isActive: true`
- Reports current status distribution

## User Status Flow

### Valid Status Combinations
| Status | isActive | Can Login? | Notes |
|--------|----------|------------|-------|
| `active` | `true` | ✅ Yes | Normal active user |
| `pending` | `false` | ❌ No (Dev: ✅ Yes) | Awaiting email verification |
| `suspended` | `false` | ❌ No | Account suspended by admin |
| `license_pending` | `true` | ✅ Yes | Awaiting license verification |
| `license_rejected` | `false` | ❌ No | License verification failed |

### Status Transitions
```
Registration → pending (isActive: false)
    ↓
Email Verification → active (isActive: true)
    ↓
Admin Suspend → suspended (isActive: false)
    ↓
Admin Reactivate → active (isActive: true)
```

## Testing Steps

### 1. Run Migration Script
```bash
cd backend
npx ts-node scripts/fixUserStatuses.ts
```

### 2. Restart Backend Server
```bash
npm run dev
```

### 3. Test Login
1. Try logging in with your credentials
2. Verify you can access the dashboard
3. Check that session persists across page refreshes

### 4. Test User Management (Super Admin)
1. Navigate to SaaS Settings → User Management
2. Test suspending a user
3. Verify suspended user cannot login
4. Test reactivating the user
5. Verify reactivated user can login

## Prevention

To prevent this issue in the future:

1. **Always update both fields**: When changing user access, update both `status` and `isActive`
2. **Use consistent status values**: Stick to the defined status enum values
3. **Test auth flow**: Always test login/logout after user management changes
4. **Run migration scripts**: After any user model changes, create and run migration scripts

## Rollback Plan

If issues persist:

1. Check database for inconsistent users:
```javascript
db.users.find({ 
  $or: [
    { status: 'active', isActive: false },
    { status: 'suspended', isActive: true }
  ]
})
```

2. Manually fix specific users:
```javascript
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { status: 'active', isActive: true } }
)
```

3. Clear all sessions and force re-login:
```javascript
db.sessions.deleteMany({})
```

## Related Files
- `backend/src/services/UserManagementService.ts`
- `backend/src/middlewares/auth.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/models/User.ts`
- `backend/scripts/fixUserStatuses.ts`
