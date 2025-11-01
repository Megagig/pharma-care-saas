# AI Diagnostic Permission Error - Complete Fix

## Problem
Users are getting "Permission Error: Feature not enabled for this account" when trying to use AI diagnostic analysis, even after having an active subscription.

## Root Cause
The issue is in the workspace context loading middleware. It has multiple problems:

1. **Workspace Loading**: The middleware was trying to find workplaces using `ownerId` or `teamMembers` fields, but not using the user's `workplaceId` field directly
2. **Subscription Linking**: Some subscriptions may still have the old `userId` field instead of `workspaceId`
3. **Feature Flags**: AI diagnostic features may not be properly configured
4. **Plan Features**: Subscription plans may not have AI features enabled

## Solution

### Step 1: Run the Fix Scripts

Run these scripts in order:

```bash
cd backend

# 1. Fix workspace context issues
npx ts-node src/scripts/fixWorkspaceContextIssues.ts

# 2. Fix subscription plan IDs
npx ts-node src/scripts/fixSubscriptionPlanIds.ts

# 3. Fix invalid subscriptions (missing tier/price)
npx ts-node src/scripts/fixInvalidSubscriptions.ts

# 4. Add AI diagnostics to all subscriptions
npx ts-node src/scripts/addAIDiagnosticsToSubscriptions.ts
```

These scripts will:
- ✅ Fix users without `workplaceId` set
- ✅ Migrate subscriptions from `userId` to `workspaceId`
- ✅ Enable AI diagnostic feature flags
- ✅ Add AI features to all subscription plans
- ✅ Fix subscription planId references
- ✅ Fix subscriptions missing tier or priceAtPurchase
- ✅ Add `ai_diagnostics`, `clinical_decision_support`, and `drug_information` to all active subscriptions
- ✅ Test workspace context loading for all users

### Step 2: Restart Backend Server

After running the fix script, restart your backend:

```bash
# Stop the backend
# Then start it again
npm run dev
```

### Step 3: Clear Browser Cache

Clear your browser's local storage and cookies, then log in again.

## Verification

### Option 1: Use the Debug Script

To check a specific user's workspace context:

```bash
cd backend
npx ts-node src/scripts/debugWorkspaceContext.ts user@example.com
```

This will show you:
- ✅ User details
- ✅ Workplace loading (both methods)
- ✅ Subscription status
- ✅ Plan details
- ✅ Permissions array
- ✅ Final verdict on access

### Option 2: Use the Test Script

To test subscription access for a specific user:

```bash
cd backend
npx ts-node src/scripts/testSubscriptionAccess.ts user@example.com
```

This will show you:
- ✅ User and workplace info
- ✅ Subscription details
- ✅ AI diagnostic feature access
- ✅ Tier, role, and license checks
- ✅ Final access verdict

## What Was Fixed

### 1. Workspace Context Middleware (`workspaceContext.ts`)

**Before:**
```typescript
// Only looked for workplace by ownerId or teamMembers
workspace = await Workplace.findOne({
    $or: [
        { ownerId: userId },
        { teamMembers: userId }
    ]
});
```

**After:**
```typescript
// First try user's workplaceId field (primary method)
if (user.workplaceId) {
    workspace = await Workplace.findById(user.workplaceId);
}

// Fallback to old method for backwards compatibility
if (!workspace) {
    workspace = await Workplace.findOne({
        $or: [
            { ownerId: userId },
            { teamMembers: userId }
        ]
    });
}
```

### 2. Subscription Schema

Ensured all subscriptions use `workspaceId` instead of the old `userId` field.

### 3. Feature Flags

Created/updated AI diagnostic feature flags:
- `ai_diagnostics` - Available to all tiers
- `clinical_decision_support` - Available to all tiers

### 4. Subscription Plans

Added AI features to all plans:
- `ai_diagnostics: true`
- `clinical_decision_support: true`

## How Permissions Work

The permission check flow:

1. **Authentication** (`auth` middleware)
   - Verifies JWT token
   - Loads user from database
   - Attaches `req.user`

2. **Workspace Context** (`loadWorkspaceContext` middleware)
   - Loads user's workplace using `workplaceId`
   - Loads workspace subscription
   - Loads subscription plan
   - Builds permissions array from plan features
   - Attaches `req.workspaceContext`

3. **Permission Check** (`PermissionService`)
   - Checks user status (not suspended)
   - Checks system roles (pharmacist, etc.)
   - Checks subscription status (active/trial)
   - Checks plan features (ai_diagnostics)
   - Checks plan tiers (basic, pro, etc.)

4. **RBAC Middleware** (`requireFeatures` or `requirePlanTier`)
   - Uses `req.workspaceContext.permissions`
   - Validates required features are present
   - Returns 402 if features not available

## Common Issues

### Issue: "No active subscription found"
**Fix:** User's workplace needs a subscription. Run the fix script to link subscriptions properly.

### Issue: "Required plan features not available"
**Fix:** The subscription plan doesn't have AI features enabled. Run the fix script to add features to plans.

### Issue: "User must have a workplace"
**Fix:** User's `workplaceId` field is not set. Run the fix script to assign users to workplaces.

### Issue: "Workspace context not loaded"
**Fix:** The `loadWorkspaceContext` middleware is not being called before the permission check. Check route configuration.

## Testing

After applying the fix, test the AI diagnostic flow:

1. Log in as a user with an active subscription
2. Navigate to AI Diagnostics
3. Try to submit a diagnostic case
4. Should work without permission errors

## Files Modified/Created

1. `backend/src/middlewares/workspaceContext.ts` - Fixed workspace loading to use user.workplaceId
2. `backend/src/scripts/fixWorkspaceContextIssues.ts` - Comprehensive fix script
3. `backend/src/scripts/fixSubscriptionPlanIds.ts` - Fix subscription planId references
4. `backend/src/scripts/fixInvalidSubscriptions.ts` - Fix subscriptions missing required fields
5. `backend/src/scripts/addAIDiagnosticsToSubscriptions.ts` - Add AI features to subscriptions
6. `backend/src/scripts/debugWorkspaceContext.ts` - Debug tool
7. `backend/src/scripts/testSubscriptionAccess.ts` - Test tool (already existed)
8. `backend/src/scripts/verifyAIDiagnosticFeatures.ts` - Feature flag tool (already existed)
9. `AI_DIAGNOSTIC_PERMISSION_FIX.md` - This documentation

## Prevention

To prevent this issue in the future:

1. Always use `user.workplaceId` to link users to workplaces
2. Always use `subscription.workspaceId` (never `userId`)
3. Ensure all new features are added to feature flags
4. Ensure all plans have the required features enabled
5. Test permission flow after any subscription changes

## Automatic Feature Management (NEW)

**Good news!** The system now automatically syncs subscription features when you update feature flags from the admin panel:

- ✅ Update a feature flag → All subscriptions sync automatically
- ✅ Toggle a feature on/off → All subscriptions sync automatically
- ✅ Bulk update tiers → All subscriptions sync automatically
- ✅ Create new subscriptions → Features are automatically populated

**No more manual scripts needed for feature management!**

See `FEATURE_MANAGEMENT_GUIDE.md` for complete details on managing features from the admin panel.

## Support

If issues persist after running the fix:

1. Check backend logs for errors
2. Run the debug script for the affected user
3. Verify the user has an active subscription
4. Verify the subscription has a valid plan
5. Verify the plan has AI features enabled
6. Check browser console for frontend errors
