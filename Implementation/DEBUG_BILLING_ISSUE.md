# Debugging: No Data Showing in Billing Tab

## Issue
No real data is showing in any of the billing tabs.

## Root Causes Identified

### 1. ✅ FIXED: Routes Not Registered
**Problem**: Billing routes were not registered in `backend/src/app.ts`
**Solution**: Added the following to app.ts:
```typescript
import billingRoutes from './routes/billingRoutes';
app.use('/api/billing', billingRoutes);
```

### 2. Possible Issue: No Data in Database
**Problem**: The database might not have any billing data yet
**Check**: Need to verify if there are records in:
- `BillingSubscription` collection
- `BillingInvoice` collection
- `Payment` collection

### 3. Possible Issue: API Errors
**Problem**: API calls might be failing silently
**Check**: Need to check browser console and network tab

## Debugging Steps

### Step 1: Check if Routes are Working
```bash
# Test the analytics endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/billing/analytics

# Expected: Should return analytics data or empty arrays
```

### Step 2: Check Database for Data
```javascript
// In MongoDB shell or Compass
db.billingsubscriptions.count()
db.billinginvoices.count()
db.payments.count()
```

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests

### Step 4: Add Debug Logging
Add console.logs to see what's happening:

```typescript
// In BillingSubscriptions.tsx fetchData function
const fetchData = useCallback(async () => {
  console.log('🔍 Fetching billing data...');
  setLoading(true);
  setError(null);

  try {
    console.log('📊 Fetching analytics...');
    const analyticsRes = await billingService.getBillingAnalytics();
    console.log('Analytics response:', analyticsRes);
    
    console.log('📈 Fetching trends...');
    const trendsRes = await billingService.getRevenueTrends(timePeriod);
    console.log('Trends response:', trendsRes);
    
    // ... rest of the code
  } catch (err) {
    console.error('❌ Error fetching data:', err);
  }
}, [timePeriod]);
```

## Quick Fixes to Try

### Fix 1: Restart Backend Server
```bash
cd backend
npm run dev
```

### Fix 2: Check if User is Super Admin
The billing endpoints require `super_admin` role. Verify:
```javascript
// In browser console
localStorage.getItem('user') // Check role
```

### Fix 3: Create Test Data
If database is empty, create some test data:

```typescript
// Run this script: backend/scripts/createTestBillingData.ts
import mongoose from 'mongoose';
import BillingSubscription from '../models/BillingSubscription';
import BillingInvoice from '../models/BillingInvoice';
import Payment from '../models/Payment';

// Create test subscription
const testSub = await BillingSubscription.create({
  workspaceId: 'YOUR_WORKSPACE_ID',
  planId: 'YOUR_PLAN_ID',
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  billingCycleAnchor: new Date(),
  billingInterval: 'monthly',
  unitAmount: 25000,
  currency: 'NGN'
});

// Create test invoice
const testInvoice = await BillingInvoice.create({
  workspaceId: 'YOUR_WORKSPACE_ID',
  subscriptionId: testSub._id,
  invoiceNumber: 'INV-TEST-001',
  status: 'paid',
  total: 25000,
  currency: 'NGN',
  dueDate: new Date(),
  paidAt: new Date(),
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  lineItems: [{
    description: 'Test subscription',
    amount: 25000,
    quantity: 1,
    unitAmount: 25000
  }]
});

// Create test payment
const testPayment = await Payment.create({
  userId: 'YOUR_USER_ID',
  planId: 'YOUR_PLAN_ID',
  amount: 25000,
  currency: 'NGN',
  paymentMethod: 'paystack',
  status: 'completed',
  completedAt: new Date(),
  paymentReference: 'TEST-REF-001'
});
```

## Expected Behavior

When working correctly:
1. Analytics cards should show numbers (even if 0)
2. Charts should render (even if empty)
3. Tables should show "No data" message if empty
4. No console errors
5. Network requests should return 200 status

## Common Error Messages

### "Failed to fetch billing analytics"
- Check if backend is running
- Check if routes are registered
- Check authentication token

### "Access Denied" or 403 Error
- User doesn't have super_admin role
- Check RBAC middleware

### "Network Error"
- Backend not running
- Wrong API URL
- CORS issues

## Next Steps

1. ✅ Routes registered in app.ts
2. ⏳ Restart backend server
3. ⏳ Check browser console for errors
4. ⏳ Check network tab for API responses
5. ⏳ Verify database has data
6. ⏳ Check user has super_admin role

## Status
- Routes: ✅ FIXED
- Data: ⏳ CHECKING
- Auth: ⏳ CHECKING
- Frontend: ⏳ CHECKING
