# Assign Roles - ObjectId Cast Error Fix

## Error Details

```
Cast to ObjectId failed for value "default" (type string) at path "_id" for model "Workplace"
```

**Location**: `backend/src/controllers/userRoleController.ts` line 199

## Root Cause

The frontend was sending:
```typescript
{
  userIds: [...],
  roleIds: [...],
  workspaceId: 'default',  // ❌ Invalid - not a valid ObjectId
  isTemporary: false
}
```

The backend validation tried to look up workspace:
```typescript
if (workspaceId) {
  const workspace = await mongoose.model('Workplace').findById(workspaceId);
  // findById expects ObjectId, but got string "default" ❌
}
```

## Solution

Since `workspaceId` is **optional** in the backend, simply don't send it:

### Before:
```typescript
const response = await rbacService.assignUserRoles({
    userIds: selectedUserIds,
    roleIds: selectedRoleIds,
    workspaceId: 'default',  // ❌ Causes error
    isTemporary: false,
});
```

### After:
```typescript
const response = await rbacService.assignUserRoles({
    userIds: selectedUserIds,
    roleIds: selectedRoleIds,
    // Don't send workspaceId if not needed
    isTemporary: false,
});
```

## Backend Logic

The backend handles optional `workspaceId` correctly:

```typescript
// Line 197-206: Only validates if provided
if (workspaceId) {
  const workspace = await mongoose.model('Workplace').findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }
}

// Line 246: Uses undefined if not provided
workspaceId: workspaceId || undefined,
```

## Testing

### Expected Behavior:
1. ✅ Select user(s) via checkbox
2. ✅ Click "Assign Roles (X)" button
3. ✅ Dialog opens
4. ✅ Select role(s) from dropdown
5. ✅ Click "Assign Roles" button
6. ✅ Success message: "Roles assigned successfully"
7. ✅ Dialog closes
8. ✅ Users list refreshes
9. ✅ Dynamic Roles column shows assigned roles

### Error Should Be Gone:
- ❌ No more "Cast to ObjectId failed" error
- ✅ Role assignment succeeds
- ✅ Status code 200 (not 500)

## File Modified

**`frontend/src/pages/EnhancedUserManagement.tsx`** (Line 348-352)
- Removed `workspaceId: 'default'` parameter
- Added comment explaining why it's omitted

## Additional Notes

### When to Use workspaceId:
- **Send workspaceId** when assigning roles specific to a workplace/organization
- **Omit workspaceId** for global role assignments (like system admin, super admin)

### If You Need Workplace-Specific Roles Later:
```typescript
// Get actual workplace ID from user context or selection
const actualWorkplaceId = user.workplaceId || selectedWorkplace?._id;

const response = await rbacService.assignUserRoles({
    userIds: selectedUserIds,
    roleIds: selectedRoleIds,
    workspaceId: actualWorkplaceId, // Valid ObjectId
    isTemporary: false,
});
```

## Status

✅ **FIXED** - Ready to test

---

**Next Steps:**
1. Refresh the browser page
2. Try assigning roles again
3. Check for Dynamic Roles display (debug logs should show in console)
