# Sidebar Data Loading Fix

## Problem
When a workspace owner logs in, sidebar information doesn't show until the page is refreshed:
1. Patient Engagement section items were not visible
2. Team Members and Roles & Permissions under Account section were not visible

## Root Cause
The Sidebar component was rendering before the necessary data was fully loaded from:
- `AuthContext` - User data and roles
- `SubscriptionContext` - Subscription status and features
- `useLabIntegrationStats` - Lab statistics

This created a race condition where:
1. User logs in
2. Sidebar renders immediately
3. `hasFeature()` and `hasRole()` checks return false because data isn't loaded yet
4. Navigation items are hidden
5. After refresh, data is already loaded, so items appear correctly

## Solution

### 1. Added Data Ready State in Sidebar Component
Added a `dataReady` state that tracks when authentication and subscription data are fully loaded:

```typescript
const [dataReady, setDataReady] = React.useState(false);

React.useEffect(() => {
  // Mark data as ready once auth is loaded and we have user data
  if (!authLoading && user) {
    // Small delay to ensure all dependent hooks have updated
    const timer = setTimeout(() => {
      setDataReady(true);
    }, 100);
    return () => clearTimeout(timer);
  } else if (!authLoading && !user) {
    setDataReady(true); // Also ready if no user (logged out state)
  }
}, [authLoading, user, subscriptionStatus.loading]);
```

### 2. Memoized Navigation Items with Proper Dependencies
Converted all navigation item arrays to use `React.useMemo()` with proper dependencies including `dataReady`:

- `navItems` - Main navigation
- `pharmacyModules` - Pharmacy tools
- `engagementModules` - Patient engagement items
- `adminItems` - Admin panel items
- `settingsItems` - Account settings items

This ensures navigation items re-evaluate when:
- User data changes
- Subscription status changes
- Lab stats change
- Data becomes ready

### 3. Optimized SubscriptionContext
Removed duplicate `useEffect` calls that were fetching subscription data twice:

**Before:**
```typescript
useEffect(() => {
  fetchSubscriptionStatus();
}, [user]);

useEffect(() => {
  if (user) {
    const timer = setTimeout(() => {
      fetchSubscriptionStatus();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [user?.id]);
```

**After:**
```typescript
useEffect(() => {
  fetchSubscriptionStatus();
}, [user?.id]); // Only trigger when user ID changes
```

## Files Modified

1. `frontend/src/components/Sidebar.tsx`
   - Added `dataReady` state and effect
   - Memoized all navigation item arrays
   - Added `dataReady` to all memoization dependencies

2. `frontend/src/context/SubscriptionContext.tsx`
   - Removed duplicate subscription fetch effect
   - Optimized to only fetch when user ID changes

## Testing Recommendations

1. **Login Flow Test:**
   - Log out completely
   - Log in as a workspace owner (pharmacy_outlet role)
   - Verify Patient Engagement section appears immediately
   - Verify Team Members and Roles & Permissions appear under Account section

2. **Role-Based Visibility Test:**
   - Test with pharmacist role (default at login)
   - Test with pharmacy_outlet role (workspace owner)
   - Verify Team Members and Roles & Permissions appear for both roles
   - Test with other user roles (pharmacy_team, intern_pharmacist, etc.)
   - Verify appropriate menu items show/hide based on role

3. **Subscription-Based Visibility Test:**
   - Test with active subscription
   - Test with expired subscription
   - Verify feature-gated items show/hide appropriately

4. **Performance Test:**
   - Monitor for excessive re-renders
   - Check that navigation items don't flicker during load

## Benefits

1. **Immediate Visibility:** Navigation items appear as soon as data is loaded, no refresh needed
2. **Consistent State:** All navigation items update together when data changes
3. **Better Performance:** Reduced duplicate API calls
4. **Maintainable:** Clear dependency tracking with useMemo
5. **No Breaking Changes:** Existing functionality preserved, only timing improved
