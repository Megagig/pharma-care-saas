# Appointment Analytics Permission Fix

## Issue
Analytics endpoints were returning 400/500 errors because the `pharmacy_outlet` role didn't have the required permissions to access analytics features.

## Root Cause
1. The permission matrix only granted analytics permissions to `Owner` and `Pharmacist` roles
2. The actual user in the database has the `pharmacy_outlet` role
3. The `WorkplaceRole` TypeScript type didn't include `pharmacy_outlet`

## Changes Made

### 1. Added `pharmacy_outlet` to WorkplaceRole Type
**File:** `backend/src/types/auth.ts`

```typescript
export type WorkplaceRole =
  | 'Owner'
  | 'Staff'
  | 'Pharmacist'
  | 'Cashier'
  | 'Technician'
  | 'Assistant'
  | 'pharmacy_outlet';  // Added this
```

### 2. Updated Analytics Permissions
**File:** `backend/src/config/permissionMatrix.ts`

Added `pharmacy_outlet` role to:
- `view_appointment_analytics`
- `view_followup_analytics`
- `view_reminder_analytics`
- `view_capacity_analytics`
- `export_analytics`

### 3. Updated Appointment Management Permissions
**File:** `backend/src/config/permissionMatrix.ts`

Added `pharmacy_outlet` role to:
- `appointment.create`
- `appointment.read`
- `appointment.update`
- `appointment.delete`
- `appointment.manage`

## Files Modified
1. `backend/src/types/auth.ts` - Added `pharmacy_outlet` to WorkplaceRole type
2. `backend/src/config/permissionMatrix.ts` - Updated permissions

## Expected Results
After these changes:
- ✅ TypeScript compilation succeeds
- ✅ Server starts without errors
- ✅ Analytics cards load data properly
- ✅ Appointment management features work
- ✅ Schedule management displays data
- ✅ No more 403 Forbidden errors for pharmacy_outlet users

## Testing
To verify the fix works:
1. Refresh the frontend application
2. Navigate to Appointment Management page
3. Check that analytics cards display data
4. Verify schedule management shows pharmacist data
5. Confirm no permission errors in console

## Note
The `pharmacy_outlet` role appears to be the primary role for pharmacy owners/managers in this system. All pharmacy management features should be accessible to this role.
