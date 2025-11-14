# Feature Management System - Complete Guide

## Overview

The PharmaCare SaaS platform uses a **three-layer permission system** to control feature access:

1. **Feature Flags** (UI-managed) - Enable/disable features dynamically per tier
2. **Pricing Plans** (Database) - Store feature arrays for each subscription tier
3. **Permission Checks** (Code) - Validate user access to features based on their subscription

This system is now **fully UI-driven** - you can manage everything from the Feature Management dashboard without touching code or database scripts.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN FEATURE MANAGEMENT UI                  │
│  (Feature Flags Tab + Tier Management Tab + Pricing Plans Tab)  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Toggle Feature for Tier
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API CONTROLLER                      │
│          /api/feature-flags/tier/:tier/features                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   FeatureFlag Model      │   │  PricingPlan Model       │
│  (MongoDB Collection)    │   │  (MongoDB Collection)    │
│                          │   │                          │
│  allowedTiers: [...]     │───▶  features: [...]        │
│                          │   │  (auto-synced)           │
└──────────────────────────┘   └──────────────────────────┘
                                         │
                                         │ Referenced by
                                         ▼
                              ┌──────────────────────────┐
                              │  Subscription Model      │
                              │  (MongoDB Collection)    │
                              │                          │
                              │  planId: ObjectId        │
                              │  features: [...]         │
                              │  (cached from plan)      │
                              └──────────────────────────┘
                                         │
                                         │ Loaded into
                                         ▼
                              ┌──────────────────────────┐
                              │  Workspace Context       │
                              │  (Request Middleware)    │
                              │                          │
                              │  permissions: [...]      │
                              └──────────────────────────┘
                                         │
                                         │ Checked by
                                         ▼
                              ┌──────────────────────────┐
                              │  Permission Service      │
                              │  (Access Control)        │
                              │                          │
                              │  ALLOW / DENY            │
                              └──────────────────────────┘
```

## How It Works

### 1. Feature Flag Creation
```
Admin creates a feature flag with:
- key: "ai_diagnostics"
- name: "AI Diagnostics"
- allowedTiers: ["pro", "enterprise"]
```

### 2. Automatic Sync to Pricing Plans
```
When you toggle a feature for a tier:
1. FeatureFlag.allowedTiers is updated
2. PricingPlanSyncService automatically updates all PricingPlan documents
3. All Pro plans get "ai_diagnostics" added to their features array
4. All active subscriptions refresh their cached features
```

### 3. Permission Check Flow
```
User makes request → 
  Workspace Context Middleware loads subscription →
    Subscription.populate('planId') gets PricingPlan →
      Plan.features array loaded into context.permissions →
        Permission check: context.permissions.includes('ai_diagnostics') →
          ALLOW or DENY (402 Payment Required)
```

## Managing Features from the UI

### Step 1: Create Features
1. Go to **Admin → Feature Management**
2. Click **"Features"** tab
3. Click **"Add Feature"**
4. Fill in:
   - **Feature Key**: `ai_diagnostics` (used in code)
   - **Display Name**: `AI Diagnostics` (shown in UI)
   - **Description**: What this feature does
   - **Allowed Tiers**: Select tiers that should have access
   - **Active**: Toggle to enable/disable globally
5. Click **"Create"**

**Result**: Feature flag created, pricing plans automatically updated

### Step 2: Enable/Disable Features for Tiers
1. Go to **"Tier Management"** tab
2. See the feature-tier matrix (features × tiers)
3. Toggle switches to enable/disable features for specific tiers
4. Changes save automatically

**Result**: 
- FeatureFlag.allowedTiers updated
- PricingPlan documents synced with new features
- All active subscriptions refreshed

### Step 3: View Pricing Plans
1. Go to **"Pricing Plans"** tab
2. See all pricing plans with their features
3. Click **"Sync All Plans"** to manually trigger sync
4. Click **"Validate Subscriptions"** to fix broken planId references

**Result**: Confirmation that all plans and subscriptions are synced correctly

## Troubleshooting Common Issues

### Issue: User gets 402 error despite having correct subscription
**Diagnosis:**
```bash
# Check backend logs for:
hasPlanId: false
availableFeatures: 0
hasAiDiagnostics: false
```

**Solution:**
1. Go to **Feature Management → Pricing Plans** tab
2. Click **"Validate Subscriptions"** button
3. This will:
   - Find subscriptions with invalid planId references
   - Automatically assign valid plans based on tier
   - Update cached features for all subscriptions

### Issue: Feature toggle doesn't reflect in app
**Diagnosis:**
- Feature flag shows enabled in UI
- User still can't access feature

**Solution:**
1. Go to **Pricing Plans** tab
2. Click **"Sync All Plans"** button
3. This ensures pricing plans match feature flags
4. Ask user to logout and login to clear workspace context cache

### Issue: New pricing plan has no features
**Diagnosis:**
- Created a new PricingPlan document in database
- Plan has empty features array

**Solution:**
1. Go to **Feature Management → Pricing Plans** tab
2. Click **"Sync All Plans"** button
3. The new plan will automatically get features based on its tier and current feature flags

## Data Models

### FeatureFlag Document
```javascript
{
  _id: ObjectId("..."),
  key: "ai_diagnostics",
  name: "AI Diagnostics",
  description: "Access to AI-powered diagnostic tools",
  isActive: true,
  allowedTiers: ["pro", "enterprise"],
  allowedRoles: ["pharmacist", "owner"],
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### PricingPlan Document
```javascript
{
  _id: ObjectId("68e4f2a652d8789b18d1ac5a"),
  name: "Pro Plan (Monthly)",
  slug: "pro-monthly",
  tier: "pro",
  price: 50000,
  billingPeriod: "monthly",
  features: [
    "ai_diagnostics",
    "multiUserSupport",
    "reportsExport",
    "careNoteExport",
    // ... 19 features total
  ],
  isActive: true,
  isPopular: true,
  order: 3
}
```

### Subscription Document
```javascript
{
  _id: ObjectId("..."),
  workspaceId: ObjectId("68b5cd85f1f0f9758b8afbbf"),
  planId: ObjectId("68e4f2a652d8789b18d1ac5a"), // References PricingPlan
  tier: "pro",
  status: "active",
  features: [
    "ai_diagnostics",
    "multiUserSupport",
    // ... cached from plan
  ],
  startDate: ISODate("..."),
  endDate: ISODate("...")
}
```

## API Endpoints

### Feature Flag Management
```
GET    /api/feature-flags                    - List all feature flags
POST   /api/feature-flags                    - Create feature flag
PUT    /api/feature-flags/:id                - Update feature flag
DELETE /api/feature-flags/:id                - Delete feature flag
PATCH  /api/feature-flags/:id/toggle         - Toggle active status
POST   /api/feature-flags/tier/:tier/features - Bulk enable/disable for tier
```

### Pricing Plan Management
```
GET    /api/admin/pricing-plans              - List all pricing plans
GET    /api/admin/pricing-plans/:id          - Get single plan
POST   /api/admin/pricing-plans              - Create pricing plan
PUT    /api/admin/pricing-plans/:id          - Update plan details
PUT    /api/admin/pricing-plans/:id/features - Update plan features
POST   /api/admin/pricing-plans/sync         - Sync all plans with feature flags
POST   /api/admin/pricing-plans/validate-subscriptions - Fix broken subscription refs
```

## Automatic Sync Behavior

### When you toggle a feature in the UI:
1. **updateTierFeatures** API endpoint is called
2. FeatureFlag documents updated (add/remove tier from allowedTiers)
3. **PricingPlanSyncService.syncTierFeatures()** runs automatically
4. All PricingPlan documents for that tier updated
5. **syncAllSubscriptionFeatures()** runs automatically
6. All active subscriptions refresh their cached features

### On Server Startup:
1. **StartupValidationService** runs automatically
2. Syncs all pricing plans with current feature flags
3. Validates all subscription planId references
4. Fixes any broken references
5. Logs results to console

## Best Practices

### ✅ DO:
- Use the Feature Management UI to toggle features
- Click "Sync All Plans" after bulk changes
- Run "Validate Subscriptions" periodically
- Keep feature keys lowercase with underscores (e.g., `ai_diagnostics`)
- Test feature changes on a test account before enabling for all tiers

### ❌ DON'T:
- Manually edit PricingPlan.features in database
- Manually edit Subscription.features in database
- Change feature keys after creation (breaks existing code references)
- Delete features that are still referenced in code
- Disable critical features without notifying users

## Code Examples

### Checking feature access in backend:
```typescript
// In workspaceContext middleware (automatic)
const permissions = [];
if (plan.features) {
  permissions.push(...plan.features);
}
context.permissions = permissions;

// In your API endpoint
if (!context.permissions.includes('ai_diagnostics')) {
  return res.status(402).json({
    success: false,
    message: 'This feature requires a Pro or Enterprise subscription'
  });
}
```

### Checking feature access in frontend:
```typescript
import { useFeature } from '../hooks/useFeature';

const MyComponent = () => {
  const hasAiDiagnostics = useFeature('ai_diagnostics');
  
  if (!hasAiDiagnostics) {
    return <UpgradePrompt feature="AI Diagnostics" />;
  }
  
  return <AiDiagnosticsModule />;
};
```

## Monitoring and Logs

### Server Logs (on startup):
```
🚀 Starting startup validations...
📋 Syncing pricing plans with feature flags...
✅ Pricing plans synced: 6 updated
🔍 Validating subscription planId references...
✅ Subscriptions validated: 0 fixed
✅ All startup validations completed successfully
```

### Sync Logs (on feature toggle):
```
✅ Synced pricing plans for tier pro: 2 updated
✅ Synced subscription features after bulk tier update: 5 updated
```

## Support and Maintenance

### Weekly Tasks:
- Review feature usage metrics
- Check for subscriptions with missing features
- Verify pricing plans are in sync

### Monthly Tasks:
- Audit feature flags for unused features
- Review tier assignments
- Update feature descriptions

### As Needed:
- Create new features for new functionality
- Adjust tier assignments based on business strategy
- Migrate subscriptions to new plans

## Emergency Fixes

If something goes wrong and users can't access features:

### Quick Fix from UI:
1. Go to **Feature Management → Pricing Plans** tab
2. Click **"Sync All Plans"**
3. Click **"Validate Subscriptions"**
4. Users should logout and login

### If UI is not accessible:
```bash
# SSH into server
cd backend

# Run manual sync script
npx ts-node src/scripts/syncPricingPlans.ts

# Or restart server (triggers automatic sync)
pm2 restart pharmacare-backend
```

## Related Documentation
- [Dynamic RBAC Documentation](./DYNAMIC_RBAC_API.md)
- [Subscription Management](./API_WORKSPACE_SUBSCRIPTION.md)
- [Feature Flags API](./FEATURE_FLAGS_API.md)

---

**Last Updated**: 2025-01-09  
**Version**: 2.0.0  
**Maintainer**: PharmaCare Development Team
