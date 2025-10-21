const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharma-care-saas', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugSubscriptionAuth() {
  try {
    console.log('🔍 Debugging subscription authentication...');
    
    // Get models
    const User = mongoose.model('User');
    const Subscription = mongoose.model('Subscription');
    const PricingPlan = mongoose.model('PricingPlan');
    
    // Find a user with workplaceId (like megagigsolution@gmail.com)
    console.log('\n1. Finding user with workplaceId...');
    const user = await User.findOne({ email: 'megagigsolution@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Workplace ID: ${user.workplaceId}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    
    // Check subscription lookup (same as auth middleware)
    console.log('\n2. Looking up subscription...');
    const subscription = await Subscription.findOne({
      workspaceId: user.workplaceId,
      status: { $in: ['active', 'trial', 'past_due'] },
    });
    
    if (!subscription) {
      console.log('❌ No subscription found');
      return;
    }
    
    console.log(`✅ Subscription found: ${subscription._id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Tier: ${subscription.tier}`);
    console.log(`   Plan ID: ${subscription.planId}`);
    
    // Try to populate planId
    console.log('\n3. Trying to populate planId...');
    const subscriptionWithPlan = await Subscription.findById(subscription._id).populate('planId');
    
    if (subscriptionWithPlan && subscriptionWithPlan.planId) {
      console.log(`✅ Plan populated successfully: ${subscriptionWithPlan.planId.name}`);
    } else {
      console.log('❌ Plan population failed');
      
      // Try to find the plan manually
      const plan = await PricingPlan.findById(subscription.planId);
      if (plan) {
        console.log(`✅ Plan found manually: ${plan.name}`);
      } else {
        console.log(`❌ Plan not found in PricingPlan collection: ${subscription.planId}`);
      }
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSubscriptionAuth();