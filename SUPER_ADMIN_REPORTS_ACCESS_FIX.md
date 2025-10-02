# Super Admin Reports Access Fix

## Problem
When logged in as a super_admin, the Reports & Analytics page was still showing only data from the user's specific workplace instead of aggregated data from all workplaces.

## Root Cause
The reports system had two layers of workspace filtering that were preventing super_admin users from accessing cross-workplace data:

1. **Controller Level**: The `getUnifiedReportData` function was always using the user's `workplaceId` to filter data
2. **Middleware Level**: The `enforceWorkspaceIsolation` middleware was forcing all users to only see their own workplace data

## Solution Implemented

### 1. Updated Reports Controller (`backend/src/controllers/reportsController.ts`)

**Changes Made:**
- Modified `getUnifiedReportData` to check user role before applying workspace filtering
- For `super_admin` users, set `workplaceId` to `null` to query all workplaces
- For other users, continue using their specific `workplaceId`
- Added logging to track super admin access

**Code Changes:**
```typescript
// Before
const workplaceId = req.user?.workplaceId;

// After  
const userRole = req.user?.role;
const workplaceId = userRole === 'super_admin' ? null : userWorkplaceId?.toString() || '';
```

**Updated Functions:**
- `getUnifiedReportData()` - Main report generation function
- `getReportSummary()` - Summary statistics function
- `buildMatchStage()` - Database query builder function
- All individual report functions (patient outcomes, interventions, etc.)

### 2. Updated Reports RBAC Middleware (`backend/src/middlewares/reportsRBAC.ts`)

**Changes Made:**
- Modified `enforceWorkspaceIsolation` to allow super_admin users to bypass workspace filtering
- Added audit logging for super admin cross-workspace access
- Maintained security for non-super admin users

**Code Changes:**
```typescript
// Check if user is super_admin
if (userRole === 'super_admin') {
    // Don't add workspace filter for super admin
    return next();
}
// Continue with normal workspace isolation for other users
```

### 3. Updated Function Signatures

**Changes Made:**
- Updated all report generation functions to accept `workplaceId: string | null`
- This allows functions to handle both workspace-specific and cross-workspace queries

**Functions Updated:**
- `getPatientOutcomesData()` and `getPatientOutcomesDataOptimized()`
- `getPharmacistInterventionsData()` and `getPharmacistInterventionsDataOptimized()`
- `getTherapyEffectivenessData()` and `getTherapyEffectivenessDataOptimized()`
- All other report type functions (11 total report types)

### 4. Updated Database Query Logic

**Changes Made:**
- Modified `buildMatchStage()` to conditionally add `workplaceId` filter
- When `workplaceId` is `null` (super_admin), no workspace filter is applied
- When `workplaceId` is provided, normal workspace filtering applies

**Code Changes:**
```typescript
// Before
const matchStage: any = {
    workplaceId: new mongoose.Types.ObjectId(workplaceId),
    isDeleted: false,
};

// After
const matchStage: any = {
    isDeleted: false,
};

// Only add workplaceId filter if it's provided (not null for super_admin)
if (workplaceId) {
    matchStage.workplaceId = new mongoose.Types.ObjectId(workplaceId);
}
```

## Expected Behavior After Fix

### For Super Admin Users:
- ✅ Can see data from ALL workplaces in reports
- ✅ Report summaries show aggregated data across all workplaces
- ✅ All report types (Patient Outcomes, Interventions, etc.) show cross-workplace data
- ✅ Access is logged for audit purposes
- ✅ No workspace isolation restrictions

### For Regular Users:
- ✅ Continue to see only their own workplace data
- ✅ Workspace isolation remains enforced
- ✅ No change in existing behavior
- ✅ Security restrictions maintained

## Security Considerations

1. **Audit Logging**: All super admin cross-workspace access is logged with event type `SUPER_ADMIN_ACCESS`
2. **Role Verification**: Only users with `role === 'super_admin'` can bypass workspace isolation
3. **Controlled Access**: The bypass only applies to reports, not other system functions
4. **Risk Assessment**: Super admin access is marked as low risk (score: 5) in audit logs

## Testing the Fix

### 1. Login as Super Admin
- Ensure you're logged in with a user that has `role: 'super_admin'`

### 2. Access Reports Page
- Navigate to `http://localhost:5173/reports-analytics`
- Click on any report type (e.g., "Patient Outcomes")
- Click "Generate Report"

### 3. Verify Cross-Workplace Data
- Reports should now show data from ALL workplaces, not just the super admin's workplace
- Summary statistics should reflect aggregated numbers across all workplaces
- Charts and tables should include data from multiple workplaces

### 4. Check Console Logs
- Backend console should show: `🔍 Report request - User: [email], Role: super_admin, WorkplaceId: ALL`
- Backend console should show: `🔓 Super admin [email] accessing reports across all workplaces`

### 5. Verify Regular Users Still Restricted
- Login as a non-super admin user
- Verify they still only see their own workplace data

## Database Impact

The changes affect how MongoDB queries are constructed:

### Before (All Users):
```javascript
{
  workplaceId: ObjectId("user-workplace-id"),
  isDeleted: false,
  // other filters...
}
```

### After (Super Admin):
```javascript
{
  isDeleted: false,
  // other filters...
  // No workplaceId filter = queries all workplaces
}
```

### After (Regular Users):
```javascript
{
  workplaceId: ObjectId("user-workplace-id"),
  isDeleted: false,
  // other filters...
  // Same as before
}
```

## Files Modified

1. `backend/src/controllers/reportsController.ts` - Main controller logic
2. `backend/src/middlewares/reportsRBAC.ts` - RBAC middleware
3. All report generation functions updated for new parameter types

The fix ensures that super_admin users can now see comprehensive reports across all workplaces while maintaining security and audit compliance.