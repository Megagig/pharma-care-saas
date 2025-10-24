# Feature Management Guide

## Overview

The Pharma Care SaaS platform uses a **Feature Flag System** to control access to features based on subscription tiers. This guide explains how to manage features from the admin panel without writing code.

## How It Works

### 1. Feature Flags
Feature flags are stored in the database and control which features are available to which subscription tiers. Each feature flag has:
- **Key**: Unique identifier used in code (e.g., `ai_diagnostics`)
- **Name**: Human-readable name (e.g., "AI Diagnostics")
- **Description**: What the feature does
- **Allowed Tiers**: Which subscription tiers can access this feature
- **Allowed Roles**: Which user roles can access this feature
- **Active Status**: Whether the feature is currently enabled

### 2. Subscription Features Array
When a subscription is created or updated, it gets a `features` array that contains all the feature keys it has access to. This array is built by:
1. Getting boolean features from the subscription plan (e.g., `advancedReports: true`)
2. Getting active feature flags that allow the subscription's tier
3. Combining them into a single array

### 3. Automatic Synchronization
**NEW**: Whenever you update a feature flag from the admin panel, all active subscriptions are automatically synchronized with the new feature configuration. This means:
- ✅ Enable a feature → All subscriptions in allowed tiers get it immediately
- ✅ Disable a feature → All subscriptions lose access immediately
- ✅ Change allowed tiers → Subscriptions are updated automatically
- ✅ No need to run scripts or restart the server

## Managing Features from Admin Panel

### Access the Feature Management Page
Navigate to: `http://localhost:5173/admin/feature-management`

### Create a New Feature

1. Click "Create New Feature"
2. Fill in the form:
   - **Key**: Use lowercase with underscores (e.g., `new_feature_name`)
   - **Name**: Display name (e.g., "New Feature Name")
   - **Description**: What the feature does
   - **Allowed Tiers**: Select which subscription tiers can access this feature
     - `free_trial` - 14-day trial users
     - `basic` - Basic plan subscribers
     - `pro` - Pro plan subscribers
     - `pharmily` - Pharmily plan subscribers
     - `network` - Network plan subscribers
     - `enterprise` - Enterprise plan subscribers
   - **Allowed Roles**: Select which user roles can access this feature
     - `pharmacist` - Licensed pharmacists
     - `pharmacy_team` - Pharmacy team members
     - `pharmacy_outlet` - Pharmacy outlet managers
     - `intern_pharmacist` - Intern pharmacists
     - `super_admin` - Super administrators
     - `owner` - Workplace owners
   - **Active**: Whether the feature is enabled
3. Click "Create"
4. **Automatic**: All subscriptions are synced with the new feature

### Update an Existing Feature

1. Find the feature in the list
2. Click "Edit"
3. Modify any fields:
   - Change allowed tiers
   - Change allowed roles
   - Update description
   - Toggle active status
4. Click "Save"
5. **Automatic**: All subscriptions are synced with the updated feature

### Enable/Disable a Feature

1. Find the feature in the list
2. Click the toggle switch
3. **Automatic**: All subscriptions are synced immediately

### Bulk Update Features for a Tier

1. Select multiple features
2. Choose "Add to Tier" or "Remove from Tier"
3. Select the tier
4. Click "Apply"
5. **Automatic**: All subscriptions are synced with the changes

### Manual Sync (If Needed)

If for any reason automatic sync fails, you can manually trigger a sync:

**Option 1: From Admin Panel**
- Click the "Sync All Subscriptions" button on the feature management page

**Option 2: API Call**
```bash
curl -X POST http://localhost:5000/api/admin/feature-flags/sync-subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option 3: Run Script**
```bash
cd backend
npx ts-node src/scripts/addAIDiagnosticsToSubscriptions.ts
```

## Common Use Cases

### Adding AI Diagnostics to All Plans

1. Go to Feature Management
2. Find "AI Diagnostics" feature
3. Edit the feature
4. In "Allowed Tiers", select all tiers you want:
   - ✅ free_trial
   - ✅ basic
   - ✅ pro
   - ✅ pharmily
   - ✅ network
   - ✅ enterprise
5. Click "Save"
6. Done! All subscriptions now have AI diagnostics

### Removing a Feature from Basic Plan

1. Go to Feature Management
2. Find the feature you want to remove
3. Edit the feature
4. In "Allowed Tiers", uncheck "basic"
5. Click "Save"
6. Done! Basic plan subscriptions no longer have this feature

### Creating a Premium Feature

1. Click "Create New Feature"
2. Set:
   - Key: `premium_feature`
   - Name: "Premium Feature"
   - Allowed Tiers: Only select `enterprise`
   - Active: Yes
3. Click "Create"
4. Done! Only enterprise subscriptions have this feature

### Temporarily Disabling a Feature

1. Find the feature
2. Toggle it off (set Active to false)
3. Done! No subscriptions can access this feature
4. To re-enable, toggle it back on

## How New Subscriptions Get Features

When a new subscription is created (either through payment or trial signup), the system automatically:

1. Gets the subscription plan
2. Calls `getSubscriptionFeatures(plan, tier)` which:
   - Extracts boolean features from the plan
   - Queries active feature flags for the tier
   - Combines them into a features array
3. Saves the subscription with the features array

**No manual intervention needed!**

## Technical Details

### Code Flow

```typescript
// When creating a subscription
const features = await getSubscriptionFeatures(plan, tier);

const subscription = new Subscription({
  workspaceId: user.workplaceId,
  planId: plan._id,
  tier: plan.tier,
  features: features, // ← Automatically populated
  // ... other fields
});
```

### Permission Check Flow

```typescript
// When checking if user can access a feature
1. auth middleware → Loads user
2. loadWorkspaceContext middleware → Loads subscription
3. requireFeature('ai_diagnostics') middleware → Checks:
   - subscription.features.includes('ai_diagnostics') ← Must be in array
   - subscription.tier is in feature flag's allowedTiers
   - user.role is in feature flag's allowedRoles
```

### Automatic Sync Triggers

Subscriptions are automatically synced when:
- ✅ Feature flag is created
- ✅ Feature flag is updated
- ✅ Feature flag is toggled on/off
- ✅ Bulk tier update is performed
- ✅ Manual sync is triggered

### Sync Function

```typescript
// backend/src/utils/subscriptionFeatures.ts
export async function syncAllSubscriptionFeatures() {
  // 1. Get all active subscriptions
  // 2. For each subscription:
  //    - Get its plan
  //    - Build features array from plan + feature flags
  //    - Update subscription.features
  // 3. Return stats (updated, failed, total)
}
```

## Troubleshooting

### Users Can't Access a Feature

**Check:**
1. Is the feature flag active?
2. Is the user's subscription tier in the allowed tiers?
3. Is the user's role in the allowed roles?
4. Does the subscription have the feature in its `features` array?

**Fix:**
- Edit the feature flag and add the missing tier/role
- Or manually sync subscriptions

### Feature Flag Changes Not Taking Effect

**Fix:**
1. Check browser console for errors
2. Try manual sync from admin panel
3. Check backend logs for sync errors
4. Restart backend server if needed

### New Subscriptions Missing Features

**Check:**
1. Is `getSubscriptionFeatures()` being called during subscription creation?
2. Are feature flags active in the database?
3. Check backend logs for errors

**Fix:**
- Run the fix script: `npx ts-node src/scripts/addAIDiagnosticsToSubscriptions.ts`

## Best Practices

1. **Always use the admin panel** to manage features instead of editing the database directly
2. **Test feature changes** on a test account before applying to production
3. **Document feature keys** in code comments so developers know what they control
4. **Use descriptive names** for features so admins understand what they do
5. **Group related features** using the category metadata field
6. **Monitor sync results** in the response to ensure all subscriptions updated successfully

## API Endpoints

### Get All Feature Flags
```
GET /api/admin/feature-flags
```

### Create Feature Flag
```
POST /api/admin/feature-flags
Body: { key, name, description, allowedTiers, allowedRoles, isActive }
```

### Update Feature Flag
```
PUT /api/admin/feature-flags/:id
Body: { name, description, allowedTiers, allowedRoles, isActive }
Response includes: syncResult { subscriptionsUpdated, subscriptionsFailed, totalSubscriptions }
```

### Toggle Feature Flag
```
PATCH /api/admin/feature-flags/:id/toggle
Response includes: syncResult { subscriptionsUpdated, subscriptionsFailed, totalSubscriptions }
```

### Bulk Update Tier Features
```
POST /api/admin/feature-flags/tier/:tier/features
Body: { featureKeys: ['feature1', 'feature2'], action: 'add' | 'remove' }
Response includes: syncResult { subscriptionsUpdated, subscriptionsFailed, totalSubscriptions }
```

### Manual Sync All Subscriptions
```
POST /api/admin/feature-flags/sync-subscriptions
Response: { subscriptionsUpdated, subscriptionsFailed, totalSubscriptions }
```

## Summary

✅ **No more scripts needed** - Everything can be managed from the admin panel
✅ **Automatic synchronization** - Changes take effect immediately
✅ **New subscriptions work automatically** - Features are populated on creation
✅ **Existing subscriptions stay updated** - Sync happens on every feature change
✅ **Manual sync available** - If automatic sync fails, you can trigger it manually

The system is now fully self-service for feature management!
