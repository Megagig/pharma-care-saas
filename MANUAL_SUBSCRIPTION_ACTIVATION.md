# Manual Subscription Activation for megagigsolution

Since the payment was already made but subscription wasn't activated, run this in MongoDB:

```javascript
// 1. Find the user
const user = db.users.findOne({ email: "megagigsolution@example.com" }); // Replace with actual email

// 2. Find the payment record
const payment = db.payments.findOne({ 
  userId: user._id,
  status: "completed" 
}).sort({ createdAt: -1 });

// 3. Find the plan they paid for
const plan = db.pricingplans.findOne({ _id: payment.planId });

// 4. Create subscription
db.subscriptions.insertOne({
  userId: user._id,
  planId: payment.planId,
  tier: plan.tier,
  status: "active",
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  priceAtPurchase: plan.price,
  autoRenew: true,
  paymentReference: payment.paymentReference,
  features: plan.features || [],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 5. Get the subscription ID
const subscription = db.subscriptions.findOne({ userId: user._id, status: "active" });

// 6. Update user
db.users.updateOne(
  { _id: user._id },
  {
    $set: {
      subscriptionTier: plan.tier,
      currentSubscriptionId: subscription._id,
      currentPlanId: payment.planId
    }
  }
);

// 7. Verify
db.users.findOne(
  { _id: user._id },
  { subscriptionTier: 1, currentSubscriptionId: 1, email: 1 }
);
```

After running this, the user should have access to all features!
