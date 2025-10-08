# Quick Start - Testing Your Subscription Changes

## 🚀 Start Here

### Step 1: Start Your Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Open Your Browser
Navigate to: `http://localhost:5173`

---

## ✅ Test 1: Route Redirect (30 seconds)

1. In your browser, go to: `http://localhost:5173/subscription-management`
2. **Expected**: Should automatically redirect to `http://localhost:5173/subscriptions`
3. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 2: Sidebar Navigation (30 seconds)

1. Look at the left sidebar
2. **Check**: "Subscription Management" should NOT be visible
3. **Check**: "Subscriptions" should be visible in the main navigation section
4. Click on "Subscriptions"
5. **Expected**: Should navigate to subscriptions page with tabs
6. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 3: Subscription Page Tabs (1 minute)

1. On the subscriptions page, you should see 4 tabs:
   - Plans
   - Billing History
   - Payment Methods
   - Analytics

2. Click each tab
3. **Expected**: Each tab should display content (even if it's "No data available")
4. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 4: Plan Button Logic (2 minutes)

### Check Your Current Tier
1. Look at the "Current Status" card at the top
2. Note your current tier (e.g., "FREE TRIAL", "BASIC", "PRO")

### Check Plan Buttons
3. Look at all the plan cards
4. **Expected Button States**:
   - Your current tier plan → "Current Plan" (button disabled/grayed out)
   - Plans above your tier → "Upgrade"
   - Plans below your tier → "Downgrade"
   - Enterprise plan → "Contact Sales"

5. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 5: Trial Period Access (2 minutes)

### If You're on Free Trial (Days Remaining > 0):

1. Click on "Clinical Notes" in the sidebar
2. **Expected**: Should load the Clinical Notes page WITHOUT showing "Subscription Required" error
3. Try clicking on "Patients"
4. **Expected**: Should load the Patients page WITHOUT blocking
5. **Result**: ✅ Pass / ❌ Fail

### If Your Trial Has Expired (Days Remaining = 0):

1. Click on "Clinical Notes" in the sidebar
2. **Expected**: Should show "Subscription Required" dialog
3. **Expected**: Dialog should have "Upgrade Subscription" button
4. Click "Upgrade Subscription"
5. **Expected**: Should redirect to `/subscriptions` page
6. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 6: Billing Interval Toggle (30 seconds)

1. On the subscriptions page, look for the billing interval buttons
2. Click "Monthly"
3. **Expected**: Plans should show monthly prices
4. Click "Yearly"
5. **Expected**: Plans should show yearly prices
6. **Expected**: "Save 17%" chip should appear on the Yearly button
7. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 7: Payment Dialog (1 minute)

1. Find a plan that shows "Upgrade" button
2. Click the "Upgrade" button
3. **Expected**: A dialog should open with:
   - Title: "Complete Payment"
   - Plan name
   - Amount
   - Billing interval
   - "Cancel" button
   - "Proceed to Payment" button
4. Click "Cancel" to close the dialog
5. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 8: Enterprise Contact Sales (30 seconds)

1. Find the "Enterprise" plan card
2. Click "Contact Sales" button
3. **Expected**: Should open WhatsApp in a new tab with a pre-filled message
4. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 9: Current Status Display (1 minute)

1. Look at the "Current Status" card at the top of the subscriptions page
2. **Should Display**:
   - Your current tier (e.g., "FREE TRIAL", "BASIC", "PRO")
   - Status chip with color:
     - Blue (info) for trial
     - Green (success) for active subscription
     - Red (error) for expired
   - If on trial: Days remaining chip
   - If on trial: Progress bar showing trial progress

3. **Result**: ✅ Pass / ❌ Fail

---

## ✅ Test 10: Plan Features Display (1 minute)

1. Look at any plan card
2. **Should Display**:
   - Plan name
   - Plan description
   - Price (or "Custom" for Enterprise)
   - List of features with checkmark icons
   - All features should match the pricing page

3. Compare with pricing page: `http://localhost:5173/pricing`
4. **Expected**: Features should match exactly
5. **Result**: ✅ Pass / ❌ Fail

---

## 🔧 Advanced Testing (Optional)

### Test Payment Flow (Requires Nomba Test Credentials)

1. Click "Upgrade" on a plan
2. Click "Proceed to Payment" in the dialog
3. **Expected**: Should redirect to Nomba payment page
4. Complete payment with test card
5. **Expected**: Should redirect back to `/subscriptions?payment=success`
6. **Expected**: Your subscription tier should update
7. **Result**: ✅ Pass / ❌ Fail

---

## 📊 Test Results Summary

Fill this out as you test:

| Test | Status | Notes |
|------|--------|-------|
| 1. Route Redirect | ⬜ | |
| 2. Sidebar Navigation | ⬜ | |
| 3. Subscription Tabs | ⬜ | |
| 4. Plan Button Logic | ⬜ | |
| 5. Trial Access | ⬜ | |
| 6. Billing Toggle | ⬜ | |
| 7. Payment Dialog | ⬜ | |
| 8. Contact Sales | ⬜ | |
| 9. Status Display | ⬜ | |
| 10. Features Display | ⬜ | |

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Subscription Required" shows during trial
**Fix**: Check your user's `trialEndDate` in the database. Should be 14 days from `trialStartDate`.

```javascript
// In MongoDB
db.users.findOne({ email: "your-email" }, { 
  trialStartDate: 1, 
  trialEndDate: 1,
  subscriptionTier: 1 
})
```

### Issue: Plans not loading
**Fix**: Check backend console for errors. Verify plans exist in database.

```bash
# Check backend logs
# Should see: "GET /api/subscriptions/plans?billingInterval=monthly"
```

### Issue: All plans show "Current Plan"
**Fix**: Check that `subscriptionStatus.tier` is being fetched correctly.

```javascript
// In browser console
console.log(subscriptionStatus);
// Should show: { tier: "free_trial", status: "trial", ... }
```

### Issue: Payment redirect fails
**Fix**: Check Nomba credentials in backend `.env` file.

```bash
cd backend
cat .env | grep NOMBA
# Should show:
# NOMBA_CLIENT_ID=...
# NOMBA_PRIVATE_KEY=...
# NOMBA_ACCOUNT_ID=...
```

---

## 📞 Need Help?

If any test fails:

1. **Check browser console** for JavaScript errors (F12 → Console tab)
2. **Check backend logs** for API errors
3. **Check network tab** to see if API calls are succeeding (F12 → Network tab)
4. **Review the implementation docs**: `SUBSCRIPTION_REFACTOR_IMPLEMENTATION.md`

---

## ✨ Success Criteria

All tests should pass (✅) for the implementation to be considered complete.

**Minimum Required**:
- Tests 1-4: Must pass (core functionality)
- Tests 5-10: Should pass (user experience)

**Optional**:
- Advanced payment flow test (requires Nomba setup)

---

**Estimated Testing Time**: 10-15 minutes
**Difficulty**: Easy
**Prerequisites**: Running frontend and backend servers

Good luck! 🚀
