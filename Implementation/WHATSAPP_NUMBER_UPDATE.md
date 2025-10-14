# WhatsApp Number Update - Complete Guide

## Summary
Your WhatsApp number (+2348060374755) has been permanently configured for the Enterprise plan "Contact Sales" feature.

## Files Updated

### 1. Backend Configuration Files
✅ **backend/src/config/plans.json** - Line 240
   - Updated Enterprise plan `whatsappNumber` from `+2348123456789` to `+2348060374755`

✅ **backend/src/scripts/seedPricingData.ts** - Line 398
   - Updated Enterprise plan `whatsappNumber` from `2348012345678` to `2348060374755`

✅ **backend/scripts/seedSubscriptionPlans.ts** - Lines 156 & 173
   - Already has correct number: `+2348060374755` ✓

### 2. Frontend Fallback
✅ **frontend/src/pages/Pricing.tsx** - Line 54
   - Added fallback: `const phoneNumber = whatsappNumber || '2348060374755';`

## How to Apply Changes

### Option 1: Reseed the Database (Recommended for Fresh Setup)
If you want to completely refresh your pricing plans:

```bash
cd backend
npm run seed:pricing
```

This will:
- Clear existing pricing plans
- Create new plans with your updated WhatsApp number

### Option 2: Manual Database Update (For Production)
If you have existing subscriptions and don't want to reseed:

1. Connect to your MongoDB database
2. Run this update command:

```javascript
db.pricingplans.updateMany(
  { tier: 'enterprise', isContactSales: true },
  { $set: { whatsappNumber: '+2348060374755' } }
)
```

Or using MongoDB Compass:
- Find collection: `pricingplans`
- Filter: `{ "tier": "enterprise", "isContactSales": true }`
- Update: `{ "$set": { "whatsappNumber": "+2348060374755" } }`

### Option 3: Update via API (If you have admin access)
Use your admin panel at `/admin/pricing` to manually update the Enterprise plan's WhatsApp number.

## Verification

After applying changes, verify the update works:

1. **Frontend Test:**
   - Go to `/pricing` page
   - Click "Contact Sales" on Enterprise plan
   - Should open WhatsApp with your number: +2348060374755

2. **API Test:**
   ```bash
   curl http://localhost:5000/api/pricing/plans?billingInterval=monthly
   ```
   Check that Enterprise plan has `"whatsappNumber": "+2348060374755"`

## WhatsApp Link Format

When users click "Contact Sales", they'll be redirected to:
```
https://wa.me/2348060374755?text=Hello%2C%20I'm%20interested%20in%20the%20Enterprise%20plan.%20Please%20provide%20more%20information.
```

## Rollback (If Needed)

If you need to revert changes:
1. The old number was: `+2348123456789` (in plans.json)
2. Simply update the files back and reseed

## Notes

- ✅ Frontend has fallback protection - will use your number even if backend fails
- ✅ All seed scripts updated for future deployments
- ✅ Test files unchanged (they use dummy numbers)
- ⚠️ Remember to rebuild backend after changes: `npm run build`
- ⚠️ Restart your backend server to load new configuration

## Next Steps

1. Choose your preferred update method (Option 1, 2, or 3)
2. Apply the changes
3. Test the WhatsApp link on the pricing page
4. Deploy to production when ready

---
**Last Updated:** October 7, 2025
**Your WhatsApp:** +2348060374755
