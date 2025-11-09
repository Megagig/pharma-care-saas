# Feature Management Quick Reference

## 🚀 Quick Start

### Access Feature Management
1. Login as **super_admin**
2. Go to **Admin → Feature Management**
3. See 4 tabs: Features | Tier Management | Advanced Targeting | **Pricing Plans**

## 📋 Common Tasks

### Enable a Feature for a Tier
1. Go to **"Tier Management"** tab
2. Find the feature row
3. Toggle the switch for the desired tier (e.g., Pro)
4. ✅ Done! Pricing plans and subscriptions auto-sync

### View All Pricing Plans
1. Go to **"Pricing Plans"** tab
2. See all plans with their features
3. Each card shows:
   - Plan name and tier
   - Price and billing period
   - Feature count and list
   - Active/Popular status

### Manual Sync (If Needed)
1. Go to **"Pricing Plans"** tab
2. Click **"Sync All Plans"** button
3. Wait for confirmation dialog
4. Review sync results

### Fix Broken Subscriptions
1. Go to **"Pricing Plans"** tab
2. Click **"Validate Subscriptions"** button
3. Wait for confirmation dialog
4. Review how many subscriptions were fixed

## 🔧 Troubleshooting

### User Can't Access Feature

**Symptom**: User gets 402 Payment Required error

**Steps**:
1. Verify feature is enabled in **Tier Management** tab
2. Go to **Pricing Plans** tab
3. Click **"Sync All Plans"**
4. Click **"Validate Subscriptions"**
5. Ask user to **logout and login** again

### Feature Toggle Doesn't Work

**Symptom**: Toggle changes but feature access doesn't change

**Steps**:
1. Check browser console for errors
2. Go to **Pricing Plans** tab
3. Click **"Sync All Plans"**
4. Verify the plan shows the feature
5. Ask user to **clear cache and logout/login**

### New Plan Has No Features

**Symptom**: Created a new pricing plan in database, but it has no features

**Steps**:
1. Go to **Pricing Plans** tab
2. Click **"Sync All Plans"**
3. The new plan will automatically get features based on its tier
4. Verify the plan now shows features

## 🎯 Best Practices

### ✅ DO:
- Always check **Pricing Plans** tab after bulk feature changes
- Run "Validate Subscriptions" weekly
- Test feature changes on a test account first
- Keep feature keys consistent (lowercase with underscores)

### ❌ DON'T:
- Don't manually edit PricingPlan.features in database
- Don't delete features still used in code
- Don't disable critical features without user notification
- Don't change feature keys after creation

## 🔄 Automatic Processes

### On Server Startup:
- ✅ All pricing plans synced with feature flags
- ✅ All subscriptions validated
- ✅ Broken references automatically fixed

### When You Toggle a Feature:
- ✅ FeatureFlag updated
- ✅ PricingPlan documents synced
- ✅ Subscription features refreshed
- ✅ All happens in < 1 second

## 📊 Understanding Sync Results

### Sync Dialog Shows:
- **Pricing Plans Updated**: How many plans got new features
- **Pricing Plans Failed**: Plans that couldn't be updated (investigate)
- **Subscriptions Synced**: Active subscriptions refreshed
- **Subscriptions Fixed**: Broken references repaired
- **Total Subscriptions**: Total active subscriptions checked

### What Numbers Mean:
- **0 failed** = ✅ Everything perfect!
- **Some failed** = ⚠️ Check errors list, may need manual fix
- **High updated count** = ✅ Many plans got new features
- **0 fixed** = ✅ No broken subscriptions (good!)
- **Some fixed** = ⚠️ Had issues but now resolved

## 🆘 Emergency Recovery

If everything breaks and users can't access features:

### Quick Fix (from UI):
1. Go to **Feature Management → Pricing Plans** tab
2. Click **"Sync All Plans"**
3. Click **"Validate Subscriptions"**
4. Announce users to logout and login

### If UI Not Accessible:
```bash
# SSH into server
cd backend

# Restart server (triggers automatic sync)
pm2 restart pharmacare-backend
# OR
npm run dev
```

## 📱 Mobile Considerations

- **Tier Management** tab has horizontal scroll on mobile
- Scroll left/right to see all tiers
- Each toggle is responsive and touch-friendly

## 🎓 Training Notes

### For New Admins:
1. Practice on test account first
2. Understand the 3-layer system (flags → plans → permissions)
3. Always verify changes in Pricing Plans tab
4. Document any issues encountered

### For Developers:
1. Read `FEATURE_MANAGEMENT_COMPLETE_GUIDE.md` for architecture
2. Use feature checks: `context.permissions.includes('feature_key')`
3. Return 402 status for missing features
4. Log feature access attempts for analytics

## 📈 Monitoring

### Check Weekly:
- [ ] Any failed sync attempts in logs?
- [ ] All plans have expected feature counts?
- [ ] Any subscriptions with invalid planId?
- [ ] Feature usage metrics look normal?

### Check Monthly:
- [ ] Review unused features (consider removing)
- [ ] Check feature distribution across tiers
- [ ] Verify tier pricing still appropriate

## 🔗 Related Links

- [Complete Guide](./FEATURE_MANAGEMENT_COMPLETE_GUIDE.md)
- [Implementation Summary](./FEATURE_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)
- [API Documentation](./FEATURE_FLAGS_API.md)
- [RBAC Documentation](./DYNAMIC_RBAC_API.md)

---

**Need Help?** Contact the development team or check the complete guide for detailed explanations.
