# 🚀 Activate Subscription for Paid User

## Quick Steps

### 1. Run the activation script

```bash
cd backend
npm run activate-subscription megagigsolution@example.com
```

**Replace `megagigsolution@example.com` with the actual email address of the user who paid.**

### 2. What the script does:

1. ✅ Finds the user by email
2. ✅ Finds their completed payment record
3. ✅ Finds the plan they paid for
4. ✅ Creates an active Subscription document
5. ✅ Updates user's `subscriptionTier` to the paid tier
6. ✅ Updates user's `currentSubscriptionId`
7. ✅ Shows confirmation with subscription details

### 3. Expected Output:

```
Connecting to MongoDB...
Connected to MongoDB

Looking for user: megagigsolution@example.com
✅ User found: { id: '...', email: '...', currentTier: 'free_trial' }

Looking for payment record...
✅ Payment found: { id: '...', reference: 'ps_...', amount: 2500 }

Looking for plan...
✅ Plan found: { id: '...', name: 'Basic', tier: 'basic', price: 2500 }

Creating new subscription...
✅ Subscription created: { id: '...', tier: 'basic', status: 'active' }

Updating user...
✅ User updated: { subscriptionTier: 'basic', currentSubscriptionId: '...' }

✅ SUBSCRIPTION ACTIVATED SUCCESSFULLY!

Final Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: megagigsolution@example.com
Tier: basic
Plan: Basic
Status: active
Valid Until: 11/8/2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ User should now have access to all features!
```

### 4. After running the script:

1. ✅ User should refresh their browser
2. ✅ User should now see their paid tier (e.g., "BASIC PLAN" instead of "FREE TRIAL")
3. ✅ User should be able to access all restricted modules without the "Subscription Required" modal
4. ✅ Billing history should show the payment

### 5. Troubleshooting:

**If script fails with "User not found":**
- Check the email address is correct
- Check the user exists in the database

**If script fails with "No completed payment found":**
- Check the Payment collection in MongoDB
- Verify the payment status is "completed"
- The payment might still be "pending"

**If script fails with "Plan not found":**
- Check the PricingPlan collection
- Verify the planId in the payment record matches a plan

### 6. Verify in MongoDB Atlas:

After running the script, check in MongoDB Atlas:

```javascript
// Check user
db.users.findOne(
  { email: "megagigsolution@example.com" },
  { subscriptionTier: 1, currentSubscriptionId: 1, email: 1 }
)

// Should show:
// {
//   email: "megagigsolution@example.com",
//   subscriptionTier: "basic", // or "pro", etc.
//   currentSubscriptionId: ObjectId("...")
// }

// Check subscription
db.subscriptions.findOne(
  { userId: ObjectId("user_id_here") },
  { tier: 1, status: 1, endDate: 1 }
)

// Should show:
// {
//   tier: "basic",
//   status: "active",
//   endDate: ISODate("2025-11-08...")
// }
```

---

## ⚠️ Important Notes:

1. **Run this ONCE per user** - Running multiple times will create duplicate subscriptions
2. **Backup first** - If you're worried, export your database first
3. **Test user** - The script will ask for confirmation if an active subscription already exists

---

## 🎉 Success!

Once the script completes successfully, the user will have full access to all features based on their paid subscription tier!
