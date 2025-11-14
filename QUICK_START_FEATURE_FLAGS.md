# 🚀 Quick Start: Add All Feature Flags to UI

## TL;DR - Just 3 Steps

```bash
# Step 1: Navigate to backend
cd backend

# Step 2: Run the sync script
npm run flags:sync

# Step 3: Refresh browser at http://localhost:5173/admin/feature-management
```

**That's it!** All 40+ feature flags will now be visible and manageable from the UI. ✨

---

## What Gets Added?

Running the sync script adds **40+ feature flags** across these categories:

### 📦 Core Features (6 flags)
- Patient Management
- Medication Management  
- Basic Clinical Notes
- Clinical Decision Support
- Drug Information
- AI Diagnostics

### 📊 Analytics (4 flags)
- Basic Reports
- Advanced Analytics
- Predictive Analytics
- Diagnostic Analytics

### 👥 Collaboration (4 flags)
- User Management
- Team Management
- Role Management
- Pharmacy Network

### 🏢 Operations (6 flags)
- Multi-Location Management
- Inventory Management
- Purchase Orders
- Supplier Management
- Clinical Interventions
- Bulk Operations

### 🔌 Integration (3 flags)
- API Access
- Health System Integration
- MTR Integration

### ✅ Compliance (2 flags)
- Compliance Tracking
- Audit Logs

### ⚙️ Administration (2 flags)
- Feature Flag Management
- System Settings

### 💰 Financial (3 flags)
- Billing & Invoicing
- Insurance Claims
- Financial Reports

### 📱 Patient Engagement (4 flags)
- Patient Portal
- Appointment Scheduling
- Follow-up Management
- Reminder System

### 📈 Additional Features (6+ flags)
- Advanced Reporting
- Performance Monitoring
- Data Export
- Notifications
- Intervention Templates (experimental)
- AI Recommendations (experimental)

---

## Alternative Methods

### Method 1: NPM Script (Recommended)
```bash
cd backend
npm run flags:sync
```

### Method 2: Direct Script Execution
```bash
cd backend
npx ts-node scripts/syncAllFeatureFlags.ts
```

### Method 3: Interactive Script
```bash
cd backend
./scripts/quick-setup-flags.sh
```

---

## Script Options

### Standard Mode (Default)
Creates new + updates existing flags:
```bash
npm run flags:sync
```

### Preserve Existing
Only creates new flags, preserves your customizations:
```bash
npm run flags:sync:preserve
```

### Force Update
Overwrites all flags with latest config:
```bash
npm run flags:sync:force
```

---

## After Running the Script

### ✅ What Works Immediately

1. **View All Flags**: All flags visible in Feature Management UI
2. **Edit Any Flag**: Change tiers, roles, status, descriptions
3. **Toggle Features**: Enable/disable any feature instantly
4. **Create New Flags**: Add custom flags via UI
5. **Delete Flags**: Remove unused flags
6. **Bulk Operations**: Assign features to entire tiers at once

### 🔄 What Happens Automatically

- ✅ All active subscriptions get updated with new feature access
- ✅ Redis cache is cleared for affected users
- ✅ Changes are audit logged
- ✅ Users see changes on next API call (immediate)

---

## Managing Flags from UI

### View Flags
Navigate to: **Admin Panel → Feature Management**

Filter by:
- Category (Core, Analytics, etc.)
- Tier (Basic, Pro, Enterprise)
- Status (Active/Inactive)
- Search by name or key

### Edit a Flag
1. Click the **pencil icon** on any flag card
2. Modify:
   - Name and description
   - Allowed tiers
   - Allowed roles  
   - Active/inactive status
   - Custom rules
   - Metadata (category, priority, tags)
3. Click **Save**
4. Changes apply immediately

### Create New Flag
1. Click **+ Add Feature** button
2. Fill in:
   - **Key**: `my_new_feature` (lowercase_with_underscores)
   - **Name**: "My New Feature"
   - **Description**: What it does
   - **Tiers**: Which plans can access it
   - **Roles**: Which roles can use it
   - **Active**: Enable/disable
3. Click **Create**
4. Feature is immediately available

### Toggle Feature On/Off
- Click the **Active/Inactive** badge
- Confirm the change
- Takes effect immediately

### Delete a Flag
- Click the **trash icon**
- Confirm deletion
- ⚠️ This is permanent!

---

## Subscription Tiers Reference

| Tier | Description | Typical Feature Count |
|------|-------------|----------------------|
| `free_trial` | 14-day trial, full access | ~25 features |
| `basic` | Essential features | ~12 features |
| `pro` | Advanced features | ~25 features |
| `pharmily` | Family pharmacy | ~28 features |
| `network` | Network features | ~30 features |
| `enterprise` | Full platform | ~40+ features |

---

## User Roles Reference

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | System administrator | All features |
| `owner` | Pharmacy owner | Management features |
| `pharmacy_outlet` | Outlet manager | Operational features |
| `pharmacy_team` | Team lead | Team features |
| `pharmacist` | Licensed pharmacist | Clinical features |
| `intern_pharmacist` | Intern | Limited clinical features |

---

## Troubleshooting

### Flags not showing in UI?

```bash
# 1. Re-run sync
cd backend && npm run flags:sync

# 2. Check MongoDB connection
echo $MONGODB_URI

# 3. Restart backend
npm run dev

# 4. Clear browser cache
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### "Cannot find module" error?

```bash
# Install dependencies
npm install

# Rebuild TypeScript
npm run build
```

### Permission denied?

```bash
# Make script executable
chmod +x scripts/quick-setup-flags.sh
```

### MongoDB connection failed?

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check .env file
cat .env | grep MONGODB_URI
```

---

## Adding More Flags

### Option 1: Via UI (Easiest)
Just click **+ Add Feature** in the Feature Management page!

### Option 2: Via Script
1. Edit `backend/scripts/syncAllFeatureFlags.ts`
2. Add to `ALL_FEATURE_FLAGS` array:
   ```typescript
   {
     key: 'my_feature',
     name: 'My Feature',
     description: 'What it does',
     allowedTiers: ['pro', 'enterprise'],
     allowedRoles: ['pharmacist'],
     isActive: true,
     metadata: {
       category: 'core',
       priority: 'medium',
       tags: ['custom'],
     },
   }
   ```
3. Run: `npm run flags:sync`

---

## Best Practices

### ✅ DO
- Start features as inactive for testing
- Use descriptive names and keys
- Assign to appropriate tiers
- Document what each flag controls
- Test before enabling widely
- Monitor flag usage

### ❌ DON'T
- Delete flags that are in use
- Enable experimental features in production
- Give free tier access to premium features
- Use unclear or abbreviated names
- Skip testing new flags

---

## Next Steps

After syncing flags:

1. ✅ Review all flags in UI
2. ✅ Adjust tier assignments if needed
3. ✅ Test flags in development
4. ✅ Enable features gradually
5. ✅ Monitor performance
6. ✅ Collect user feedback
7. ✅ Document dependencies

---

## Full Documentation

- **Complete Inventory**: `FEATURE_FLAGS_INVENTORY.md` (All 56+ flags documented)
- **Management Guide**: `FEATURE_FLAGS_UI_MANAGEMENT_GUIDE.md`
- **API Reference**: `docs/FEATURE_FLAGS_API.md`
- **Implementation**: `Implementation/FEATURE_MANAGEMENT_GUIDE.md`

---

## Support

Need help?
- 📖 Check the troubleshooting section above
- 📚 Read the full documentation
- 🐛 Check console for errors
- 💬 Contact development team

---

**Quick Links:**
- Feature Management UI: http://localhost:5173/admin/feature-management
- Backend API: http://localhost:5000/api/admin/feature-flags
- Script Location: `backend/scripts/syncAllFeatureFlags.ts`

---

**Last Updated:** November 10, 2025  
**Version:** 1.0
