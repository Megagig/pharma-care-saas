# Security Settings - Bug Fixes

## Issues Fixed

### 1. ❌ 400 Bad Request - Active Sessions & Audit Logs
**Problem:** Empty filter values were being sent as empty strings, causing validation errors.

**Solution:** Filter out empty values before sending to API
- Added `cleanFilters` function in `saasService.ts`
- Only sends non-empty filter values to backend

### 2. ❌ 500 Internal Server Error - Password Policy Update
**Problem:** Backend controller and service had mismatched interfaces
- Controller expected `lockoutThreshold` and `lockoutDuration` in `PasswordPolicy`
- Service expected them in separate `AccountLockout` object
- Model has them in `accountLockout`, not `passwordPolicy`

**Solution:** Split into two separate endpoints
- `/api/admin/saas/security/password-policy` - Updates password requirements only
- `/api/admin/saas/security/account-lockout` - Updates lockout settings only
- Frontend now saves both when "Save" is clicked

## Files Modified

### Backend

1. **`backend/src/controllers/saasSecurityController.ts`**
   - Removed `lockoutThreshold` and `lockoutDuration` from `PasswordPolicy` interface
   - Updated `updatePasswordPolicy` to only handle password fields
   - Added new `updateAccountLockout` method

2. **`backend/src/services/SaaSSecurityMonitoringService.ts`**
   - Added `updateAccountLockout` method
   - Imports `IAccountLockout` from models
   - Includes audit logging for lockout changes

3. **`backend/src/routes/saasSecurityRoutes.ts`**
   - Removed lockout validation from password-policy route
   - Added new `/account-lockout` route with validation

### Frontend

4. **`frontend/src/services/saasService.ts`**
   - Added `cleanFilters` logic to `getActiveSessions`
   - Added `cleanFilters` logic to `getSecurityAuditLogs`
   - Added `updateAccountLockout` method

5. **`frontend/src/queries/useSaasSettings.ts`**
   - Added `updateAccountLockout` to `useSaasSettings` hook

6. **`frontend/src/components/saas/SecuritySettings.tsx`**
   - Updated `handleSavePasswordPolicy` to save both settings
   - Now calls both `updatePasswordPolicy` and `updateAccountLockout`

## API Endpoints

### Password Policy
```
PUT /api/admin/saas/security/password-policy
Body: {
  minLength: number,
  requireUppercase: boolean,
  requireLowercase: boolean,
  requireNumbers: boolean,
  requireSpecialChars: boolean,
  maxAge: number,
  preventReuse: number
}
```

### Account Lockout
```
PUT /api/admin/saas/security/account-lockout
Body: {
  maxFailedAttempts: number,
  lockoutDuration: number,
  autoUnlock: boolean,
  notifyOnLockout: boolean
}
```

### Active Sessions
```
GET /api/admin/saas/security/sessions?isActive=true&ipAddress=1.2.3.4
```
- Empty filter values are now excluded from query string

### Audit Logs
```
GET /api/admin/saas/security/audit-logs?action=LOGIN&severity=high
```
- Empty filter values are now excluded from query string

## Testing

### Password Policy
- ✅ Load settings - Should show current values
- ✅ Change password requirements - Should update UI
- ✅ Change lockout settings - Should update UI
- ✅ Click "Save" - Should save both and show success

### Active Sessions
- ✅ Load sessions - Should work without errors
- ✅ Filter by status - Should work
- ✅ Filter by IP - Should work
- ✅ Clear filters - Should work

### Audit Logs
- ✅ Load logs - Should work without errors
- ✅ Filter by action - Should work
- ✅ Filter by severity - Should work
- ✅ Clear filters - Should work

## What's Now Working

1. ✅ Password policy loads correctly
2. ✅ Password policy saves correctly
3. ✅ Account lockout settings load correctly
4. ✅ Account lockout settings save correctly
5. ✅ Active sessions load without 400 error
6. ✅ Audit logs load without 400 error
7. ✅ Filters work correctly (empty values ignored)
8. ✅ All operations have proper error handling

## Summary

All three tabs in Security Settings are now fully functional:
- **Password Policy** ✅ - Loads and saves correctly
- **Active Sessions** ✅ - Loads and filters correctly
- **Audit Logs** ✅ - Loads and filters correctly

No more 400 or 500 errors!
