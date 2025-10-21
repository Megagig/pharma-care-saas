const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharma-care-saas', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testSubscriptionDisplay() {
  try {
    console.log('Testing subscription display after model updates...');
    
    // Get models
    const Workplace = mongoose.model('Workplace');
    const Subscription = mongoose.model('Subscription');
    const PricingPlan = mongoose.model('PricingPlan');
    
    // Find a workspace with a subscription
    console.log('\n1. Finding workspaces with subscriptions...');
    const workspaces = await Workplace.find({ currentSubscriptionId: { $exists: true } }).limit(3);
    
    if (workspaces.length === 0) {
      console.log('❌ No workspaces with subscriptions found');
      return;
    }
    
    for (const workspace of workspaces) {
      console.log(`\n--- Workspace: ${workspace.name} ---`);
      console.log(`Subscription ID: ${workspace.currentSubscriptionId}`);
      console.log(`Plan ID: ${workspace.currentPlanId}`);
      console.log(`Status: ${workspace.subscriptionStatus}`);
      
      // Test subscription lookup
      if (workspace.currentSubscriptionId) {
        const subscription = await Subscription.findById(workspace.currentSubscriptionId);
        if (subscription) {
          console.log(`✅ Subscription found: ${subscription.status}, tier: ${subscription.tier}`);
          console.log(`Plan ID in subscription: ${subscription.planId}`);
          
          // Test plan lookup
          const plan = await PricingPlan.findById(subscription.planId);
          if (plan) {
            console.log(`✅ Plan found: ${plan.name} (${plan.tier}) - ₦${plan.price}/${plan.billingPeriod}`);
          } else {
            console.log(`❌ Plan not found for ID: ${subscription.planId}`);
          }
        } else {
          console.log(`❌ Subscription not found for ID: ${workspace.currentSubscriptionId}`);
        }
      }
      
      // Test direct plan lookup from workspace
      if (workspace.currentPlanId) {
        const directPlan = await PricingPlan.findById(workspace.currentPlanId);
        if (directPlan) {
          console.log(`✅ Direct plan lookup: ${directPlan.name}`);
        } else {
          console.log(`❌ Direct plan not found for ID: ${workspace.currentPlanId}`);
        }
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSubscriptionDisplay();