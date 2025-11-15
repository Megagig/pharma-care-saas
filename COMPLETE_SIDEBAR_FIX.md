# Complete Sidebar and Page Access Fix

## Problem Summary
1. **Sidebar items not showing after login** - Patient Engagement section and Team Members/Roles items were hidden until page refresh
2. **Page access denied** - Even when sidebar items appeared, clicking them showed "Insufficient Role Permissions" error

## Root Causes

### Issue 1: Sidebar Data Loading Race Condition
- Sidebar rendered before user data and subscription data finished loading
- `hasFeature()` and `hasRole()` checks returned false because data wasn't available yet
- Navigation items were hidden on initial render

### Issue 2: Page-Level Role Mismatch
- Sidebar showed items for `pharmacist` OR `pharmacy_outlet` roles
- But actual pages only allowed `pharmacy_outlet` role
- This created inconsistency where users could see menu items but couldn't access the pages

## Solutions Applied

### Fix 1: Sidebar Data Loading (Sidebar.tsx)

**Added data ready tracking:**
```typescript
const [dataReady, setDataReady] = React.useState(false);
const { user, loading: authLoading } = useAuth();

React.useEffect(() => {
  if (!authLoading && user) {
    const timer = setTimeout(() => setDataReady(true), 100);
    return () => clearTimeout(timer);
  } else if (!authLoading && !user) {
    setDataReady(true);
  }
}, [authLoading, user, subscriptionStatus.loading]);
```

**Memoized navigation items:**
```typescript
const settingsItems = React.useMemo(() => [
  {
    name: 'Team Members',
    show: hasRole('pharmacist') || hasRole('pharmacy_outlet'),
  },
  {
    name: 'Roles & Permission',
    show: hasRole('pharmacist') || hasRole('pharmacy_outlet'),
  },
], [hasRole, dataReady]);
```

### Fix 2: Page Access Control

**WorkspaceTeam.tsx - Updated access check:**
```typescript
// Before
if (!hasRole('pharmacy_outlet')) {
  return <AccessDenied />;
}

// After
if (!hasRole('pharmacist') && !hasRole('pharmacy_outlet')) {
  return <AccessDenied />;
}
```

**WorkspaceRBACManagement.tsx - Updated access check:**
```typescript
// Before
const hasAccess = hasRole('pharmacy_outlet');

// After
const hasAccess = hasRole('pharmacist') || hasRole('pharmacy_outlet');
```

### Fix 3: Subscription Context Optimization

**Removed duplicate fetches:**
```typescript
// Before - fetched twice
useEffect(() => {
  fetchSubscriptionStatus();
}, [user]);

useEffect(() => {
  if (user) {
    const timer = setTimeout(() => fetchSubscriptionStatus(), 500);
    return () => clearTimeout(timer);
  }
}, [user?.id]);

// After - fetch once
useEffect(() => {
  fetchSubscriptionStatus();
}, [user?.id]);
```

## Files Modified

1. **frontend/src/components/Sidebar.tsx**
   - Added `dataReady` state and effect
   - Memoized all navigation arrays with proper dependencies
   - Updated role checks to include both `pharmacist` and `pharmacy_outlet`

2. **frontend/src/pages/workspace/WorkspaceTeam.tsx**
   - Updated access control to accept both roles
   - Updated error message to match new requirements

3. **frontend/src/pages/workspace/WorkspaceRBACManagement.tsx**
   - Updated access control to accept both roles
   - Updated error message to match new requirements

4. **frontend/src/context/SubscriptionContext.tsx**
   - Removed duplicate subscription fetch
   - Optimized to only fetch when user ID changes

## Testing Checklist

### Sidebar Visibility
- [ ] Log in as pharmacist - verify Team Members and Roles & Permissions appear
- [ ] Log in as pharmacy_outlet - verify Team Members and Roles & Permissions appear
- [ ] Log in as other roles - verify items are hidden appropriately
- [ ] Verify Patient Engagement section appears immediately (if feature enabled)
- [ ] No page refresh required to see menu items

### Page Access
- [ ] Click Team Members as pharmacist - page loads successfully
- [ ] Click Team Members as pharmacy_outlet - page loads successfully
- [ ] Click Roles & Permissions as pharmacist - page loads successfully
- [ ] Click Roles & Permissions as pharmacy_outlet - page loads successfully
- [ ] Try accessing as other roles - see appropriate error message

### Performance
- [ ] No excessive re-renders
- [ ] No duplicate API calls on login
- [ ] Navigation items don't flicker during load

## Benefits

1. **Immediate Visibility** - Menu items appear as soon as data loads, no refresh needed
2. **Consistent Access** - Sidebar visibility matches actual page permissions
3. **Better UX** - No confusing "access denied" errors after clicking visible menu items
4. **Improved Performance** - Reduced duplicate API calls
5. **Maintainable** - Clear dependency tracking with useMemo

## Role Access Matrix

| Feature | Pharmacist | Pharmacy Outlet | Other Roles |
|---------|-----------|-----------------|-------------|
| Team Members (Sidebar) | ✅ | ✅ | ❌ |
| Team Members (Page) | ✅ | ✅ | ❌ |
| Roles & Permissions (Sidebar) | ✅ | ✅ | ❌ |
| Roles & Permissions (Page) | ✅ | ✅ | ❌ |
| Patient Engagement | Feature-based | Feature-based | Feature-based |

## Notes

- The `pharmacist` role is the default role at login
- Both `pharmacist` and `pharmacy_outlet` roles can manage team members and permissions
- This change expands access without removing any existing permissions
- All other role-based restrictions remain unchanged
