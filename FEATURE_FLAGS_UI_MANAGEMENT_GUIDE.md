# Feature Flags Management Guide

## Quick Start - Adding All Feature Flags to UI

To populate all feature flags from the inventory into the Feature Management UI, follow these simple steps:

### 1. Run the Sync Script

```bash
cd backend
npx ts-node scripts/syncAllFeatureFlags.ts
```

This will:
- ✅ Create all missing feature flags in the database
- ✅ Update existing flags with latest configuration
- ✅ Make all flags immediately visible in the UI
- ✅ Preserve custom settings you've made

### 2. Refresh the Feature Management Page

Navigate to: `http://localhost:5173/admin/feature-management`

All 40+ feature flags should now be visible and manageable from the UI!

---

## Script Options

### Standard Mode (Default)
Creates new flags and updates existing ones:
```bash
npx ts-node scripts/syncAllFeatureFlags.ts
```

### Preserve Existing Mode
Only creates new flags, skips existing ones:
```bash
npx ts-node scripts/syncAllFeatureFlags.ts --preserve-existing
```

### Force Update Mode
Updates all flags, overwriting any manual changes:
```bash
npx ts-node scripts/syncAllFeatureFlags.ts --force
```

---

## Managing Feature Flags from UI

Once synced, you can manage all feature flags directly from the Feature Management UI without touching code:

### 1. View All Flags
- Navigate to **Feature Management** in the admin panel
- Use filters to find specific flags
- Search by name or key

### 2. Edit a Flag
- Click the **edit icon** (pencil) on any flag card
- Modify:
  - Name and description
  - Allowed tiers (free_trial, basic, pro, enterprise, etc.)
  - Allowed roles (pharmacist, pharmacy_team, etc.)
  - Active status (on/off)
  - Custom rules
  - Metadata (category, priority, tags)

### 3. Toggle Flag Status
- Click the **Active/Inactive** toggle
- Changes take effect immediately
- Affects all users on that subscription tier

### 4. Create New Flag
- Click **+ Add Feature** button
- Fill in the form:
  - **Key**: Unique identifier (lowercase_with_underscores)
  - **Name**: Display name
  - **Description**: What the feature does
  - **Tiers**: Which subscription plans can access it
  - **Roles**: Which user roles can use it
  - **Active**: Enable/disable the feature
  - **Metadata**: Category, priority, tags

### 5. Delete a Flag
- Click the **delete icon** (trash)
- Confirm the deletion
- ⚠️ Warning: This is permanent!

---

## Adding New Feature Flags

### Method 1: Via UI (Recommended)
1. Go to Feature Management page
2. Click **+ Add Feature**
3. Fill in the form
4. Click **Create**
5. Feature is immediately available

### Method 2: Via Script
1. Open `backend/scripts/syncAllFeatureFlags.ts`
2. Add your new flag to the `ALL_FEATURE_FLAGS` array:
   ```typescript
   {
     key: 'my_new_feature',
     name: 'My New Feature',
     description: 'Description of what it does',
     allowedTiers: ['pro', 'enterprise'],
     allowedRoles: ['pharmacist', 'pharmacy_team'],
     isActive: true,
     metadata: {
       category: 'core',
       priority: 'medium',
       tags: ['new', 'feature'],
     },
   }
   ```
3. Run the sync script
4. Feature appears in UI

---

## Feature Flag Categories

Organize your flags using these categories:

- **core**: Essential application features
- **analytics**: Reporting and analytics features
- **collaboration**: Team and user management
- **management**: Administrative features
- **integration**: Third-party integrations
- **compliance**: Regulatory and audit features
- **administration**: System administration
- **ai**: AI and machine learning features
- **clinical**: Clinical decision support
- **patient-engagement**: Patient portal features
- **operations**: Operational features
- **financial**: Billing and financial features
- **reporting**: Reports and dashboards
- **monitoring**: Performance monitoring
- **notifications**: Alert systems
- **templates**: Template features
- **export**: Data export features

---

## Subscription Tiers

Configure which tiers have access to each feature:

- **free_trial**: 14-day trial period
- **basic**: Essential features for individual pharmacists
- **pro**: Advanced features for growing pharmacies
- **pharmily**: Family pharmacy management
- **network**: Network of pharmacies
- **enterprise**: Full enterprise features

---

## User Roles

Configure which roles can access each feature:

- **super_admin**: System administrators
- **owner**: Pharmacy owners
- **pharmacy_outlet**: Pharmacy outlet managers
- **pharmacy_team**: Pharmacy team leads
- **pharmacist**: Licensed pharmacists
- **intern_pharmacist**: Pharmacy interns

---

## Best Practices

### 1. Naming Conventions
- **Key**: Use lowercase with underscores (e.g., `advanced_analytics`)
- **Name**: Use title case (e.g., "Advanced Analytics")
- **Description**: Clear, concise explanation of the feature

### 2. Tier Assignment
- Start restrictive (higher tiers only)
- Expand access based on user feedback
- Consider feature complexity and resource usage

### 3. Testing New Flags
1. Create flag as **inactive**
2. Test in development environment
3. Enable for internal testing
4. Gradually roll out to users
5. Monitor performance and feedback

### 4. Deprecating Flags
1. Mark as inactive
2. Monitor usage for 30 days
3. Remove if no longer needed
4. Document reason for removal

### 5. Documentation
- Keep descriptions up-to-date
- Use meaningful tags
- Set appropriate priority levels
- Document custom rules

---

## Automatic Subscription Sync

When you update feature flags via the UI, the system automatically:

1. **Syncs Subscriptions**: All active subscriptions are updated with new feature access
2. **Updates Cache**: Redis cache is cleared for affected users
3. **Logs Changes**: All changes are audit logged
4. **Notifies Users**: (Optional) Users can be notified of new features

The sync happens in the background and typically completes within seconds.

---

## Troubleshooting

### Problem: Flags not appearing in UI

**Solution:**
```bash
# Re-run the sync script
cd backend
npx ts-node scripts/syncAllFeatureFlags.ts

# Check database connection
echo $MONGODB_URI
```

### Problem: Changes not taking effect

**Solution:**
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Restart backend server
npm run dev
```

### Problem: Permission denied errors

**Solution:**
- Ensure you're logged in as `super_admin`
- Check that `feature_flag_management` is enabled for your tier
- Verify JWT token is valid

### Problem: Script fails to run

**Solution:**
```bash
# Install dependencies
npm install

# Check TypeScript compilation
npm run build

# Run with explicit ts-node
npx ts-node --esm scripts/syncAllFeatureFlags.ts
```

---

## Monitoring Feature Flags

### View Flag Usage
```bash
# Check how many users have access to a feature
db.subscriptions.find({ 
  "features.key": "advanced_analytics" 
}).count()
```

### Check Flag Status
```bash
# List all active flags
db.featureflags.find({ isActive: true })

# List experimental flags
db.featureflags.find({ "metadata.experimental": true })
```

### Audit Flag Changes
```bash
# View recent flag changes (requires audit logging)
db.auditlogs.find({ 
  resource: "FeatureFlag" 
}).sort({ createdAt: -1 }).limit(10)
```

---

## API Endpoints Reference

All feature flags can also be managed via API:

```bash
# Get all feature flags
GET /api/admin/feature-flags

# Get single feature flag
GET /api/admin/feature-flags/:id

# Create feature flag
POST /api/admin/feature-flags
Body: { key, name, description, allowedTiers, allowedRoles, isActive }

# Update feature flag
PUT /api/admin/feature-flags/:id
Body: { name, description, allowedTiers, allowedRoles, isActive }

# Toggle feature flag
PATCH /api/admin/feature-flags/:id/toggle

# Delete feature flag
DELETE /api/admin/feature-flags/:id

# Get flags by tier
GET /api/admin/feature-flags/tier/:tier

# Bulk update tier features
POST /api/admin/feature-flags/tier/:tier/features
Body: { featureKeys: ['feature1', 'feature2'], action: 'add' | 'remove' }

# Manual subscription sync
POST /api/admin/feature-flags/sync
```

---

## Integration with Code

### Backend (Node.js/Express)

Check feature access in your routes:

```typescript
import { requireFeature } from '../middleware/featureAccess';

// Protect route with feature flag
router.get('/advanced-analytics', 
  authenticate,
  requireFeature('advanced_analytics'),
  analyticsController.getAdvanced
);
```

### Frontend (React)

Use the feature flag hook:

```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function AdvancedAnalytics() {
  const { hasFeature, loading } = useFeatureFlag('advanced_analytics');

  if (loading) return <Loading />;
  if (!hasFeature) return <UpgradePrompt />;

  return <AdvancedAnalyticsDashboard />;
}
```

### Check Multiple Features

```typescript
import { checkFeatures } from '../utils/featureFlags';

const requiredFeatures = ['api_access', 'advanced_analytics'];
const hasAccess = await checkFeatures(userId, requiredFeatures);
```

---

## NPM Scripts (Coming Soon)

Add these to `backend/package.json`:

```json
{
  "scripts": {
    "flags:sync": "ts-node scripts/syncAllFeatureFlags.ts",
    "flags:sync:preserve": "ts-node scripts/syncAllFeatureFlags.ts --preserve-existing",
    "flags:sync:force": "ts-node scripts/syncAllFeatureFlags.ts --force",
    "flags:list": "ts-node scripts/listFeatureFlags.ts",
    "flags:export": "ts-node scripts/exportFeatureFlags.ts"
  }
}
```

Usage:
```bash
npm run flags:sync
npm run flags:list
npm run flags:export
```

---

## Next Steps

1. ✅ Run the sync script to populate all flags
2. ✅ Refresh the Feature Management page
3. ✅ Review and adjust tier assignments
4. ✅ Test new flags in development
5. ✅ Document feature dependencies
6. ✅ Set up monitoring and alerts
7. ✅ Train team on flag management

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation: `docs/FEATURE_FLAGS_API.md`
- Check implementation guide: `Implementation/FEATURE_MANAGEMENT_GUIDE.md`
- Contact development team

---

**Last Updated:** November 10, 2025  
**Version:** 2.0
