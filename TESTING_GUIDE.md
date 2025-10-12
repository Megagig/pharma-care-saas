# Subscription Refactoring - Testing Guide

## Quick Testing Steps

### 1. Test Route Redirects
```bash
# Open browser and navigate to:
http://localhost:5173/subscription-management
# Should redirect to: http://localhost:5173/subscriptions
```

### 2. Test Sidebar Navigation
- Open the application
- Check sidebar - "Subscription Management" should NOT appear
- "Subscriptions" should appear in main navigation section
- Click "Subscriptions" - should navigate to subscriptions page

### 3. Test Subscription Page Tabs
Navigate to `/subscriptions` and verify:
- [ ] Plans tab shows all subscription plans
- [ ] Billing History tab displays (empty state for now)
- [ ] Payment Methods tab displays (empty state for now)
- [ ] Analytics tab displays (empty state for now)

### 4. Test Plan Button States

#### Scenario A: Free Trial User
- Current tier: `free_trial`
- Expected buttons:
  - Free Trial: "Current Plan" (disabled)
  - Basic: "Upgrade"
  - Pro: "Upgrade"
  - Pharmily: "Upgrade"
  - Network: "Upgrade"
  - Enterprise: "Contact Sales"

#### Scenario B: Basic Plan User
- Current tier: `basic`
- Expected buttons:
  - Free Trial: "Downgrade"
  - Basic: "Current Plan" (disabled)
  - Pro: "Upgrade"
  - Pharmily: "Upgrade"
  - Network: "Upgrade"
  - Enterprise: "Contact Sales"

#### Scenario C: Pro Plan User
- Current tier: `pro`
- Expected buttons:
  - Free Trial: "Downgrade"
  - Basic: "Downgrade"
  - Pro: "Current Plan" (disabled)
  - Pharmily: "Upgrade"
  - Network: "Upgrade"
  - Enterprise: "Contact Sales"

### 5. Test Trial Period Access

#### During Trial (Days Remaining > 0):
```bash
# User should have access to all modules
# Navigate to:
http://localhost:5173/notes
http://localhost:5173/patients
http://localhost:5173/medications
# All should load without "Subscription Required" error
```

#### After Trial Expires (Days Remaining = 0):
```bash
# User should see "Subscription Required" dialog
# Navigate to:
http://localhost:5173/notes
# Should show: "Subscription Required" with "Upgrade Subscription" button
# Click "Upgrade Subscription" → should redirect to /subscriptions
```

### 6. Test Payment Flow

#### Step 1: Click Upgrade
- Navigate to `/subscriptions`
- Click "Upgrade" on any plan (except current plan)
- Payment dialog should open

#### Step 2: Verify Dialog Content
- Plan name should be displayed
- Amount should be displayed
- Billing interval should be displayed
- "Proceed to Payment" button should be visible

#### Step 3: Initiate Payment
- Click "Proceed to Payment"
- Should redirect to Nomba payment page
- URL should start with Nomba's domain

#### Step 4: Complete Payment (Test Mode)
- Use Nomba test card details
- Complete payment
- Should redirect back to `/subscriptions?payment=success`

#### Step 5: Verify Subscription Update
- Check user's subscription tier in database
- Should be updated to selected plan
- Access to modules should be granted

### 7. Test Billing Interval Toggle
- Navigate to `/subscriptions`
- Click "Monthly" button - plans should show monthly prices
- Click "Yearly" button - plans should show yearly prices
- "Save 17%" chip should appear on Yearly button

### 8. Test Current Status Card
- Navigate to `/subscriptions`
- Status card should display:
  - Current tier (e.g., "FREE TRIAL", "BASIC", "PRO")
  - Status chip (color-coded: info for trial, success for active, error for expired)
  - Days remaining (if on trial)
  - Progress bar (if on trial)

### 9. Test Enterprise Plan
- Navigate to `/subscriptions`
- Find Enterprise plan
- Click "Contact Sales" button
- Should open WhatsApp with pre-filled message

### 10. Test Error Handling
- Disconnect from internet
- Try to upgrade a plan
- Should show error message
- Reconnect and try again

## Backend Testing

### 1. Test Nomba Service Configuration
```bash
# Check if Nomba credentials are set
cd backend
grep NOMBA .env
# Should show:
# NOMBA_CLIENT_ID=...
# NOMBA_PRIVATE_KEY=...
# NOMBA_ACCOUNT_ID=...
```

### 2. Test Checkout Endpoint
```bash
curl -X POST http://localhost:5000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "planId": "plan-id-here",
    "billingInterval": "monthly",
    "callbackUrl": "http://localhost:5173/subscriptions?payment=success"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "authorization_url": "https://checkout.nomba.com/...",
#     "reference": "ref_...",
#     "access_code": "..."
#   }
# }
```

### 3. Test Subscription Status Endpoint
```bash
curl http://localhost:5000/api/subscriptions/status \
  -H "Cookie: your-auth-cookie"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "hasWorkspace": true,
#     "hasSubscription": true,
#     "status": "trial",
#     "tier": "free_trial",
#     "isTrialActive": true,
#     "daysRemaining": 10,
#     "accessLevel": "full"
#   }
# }
```

### 4. Test Plans Endpoint
```bash
curl http://localhost:5000/api/subscriptions/plans?billingInterval=monthly \
  -H "Cookie: your-auth-cookie"

# Should return array of plans with displayFeatures
```

## Database Verification

### Check User Subscription Tier
```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "test@example.com" }, {
  subscriptionTier: 1,
  trialStartDate: 1,
  trialEndDate: 1,
  currentSubscriptionId: 1
})
```

### Check Subscription Document
```javascript
db.subscriptions.findOne({ userId: ObjectId("...") })
```

## Common Issues & Solutions

### Issue 1: "Subscription Required" shows during trial
**Solution**: Check `trialEndDate` in user document. Should be 14 days from `trialStartDate`.

### Issue 2: Plans not loading
**Solution**: Check backend logs. Verify plans exist in database.

### Issue 3: Payment redirect fails
**Solution**: 
1. Check Nomba credentials in `.env`
2. Verify `nombaService.isNombaConfigured()` returns true
3. Check backend logs for Nomba API errors

### Issue 4: Subscription tier not updating after payment
**Solution**: 
1. Check webhook endpoint is accessible
2. Verify webhook signature validation
3. Check backend logs for webhook processing errors

### Issue 5: "Current Plan" button not showing correctly
**Solution**: 
1. Verify `subscriptionStatus.tier` matches plan tier
2. Check tier comparison logic in `getPlanButtonText()`

## Performance Testing

### Load Time
- Subscriptions page should load in < 2 seconds
- Tab switching should be instant (< 100ms)
- Plan cards should render smoothly

### API Response Times
- `/api/subscriptions/status` - < 500ms
- `/api/subscriptions/plans` - < 1s
- `/api/subscriptions/checkout` - < 2s

## Accessibility Testing

- [ ] All buttons have proper labels
- [ ] Tab navigation works correctly
- [ ] Screen reader announces tab changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works for all interactive elements

## Mobile Testing

- [ ] Subscriptions page is responsive
- [ ] Plan cards stack vertically on mobile
- [ ] Tabs are scrollable on small screens
- [ ] Payment dialog is mobile-friendly
- [ ] All buttons are easily tappable (min 44x44px)

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Security Testing

- [ ] Payment data is never stored in frontend
- [ ] Nomba redirect uses HTTPS
- [ ] Webhook signature is validated
- [ ] User authentication is required for all endpoints
- [ ] CSRF protection is enabled

---

**Testing Status**: ⏳ Pending
**Last Updated**: October 8, 2025
