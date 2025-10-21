const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharma-care-saas', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixOrphanedSubscriptions() {
  try {
    console.log('Checking for orphaned subscriptions...');
    
    // Get models
    const Subscription = mongoose.model('Subscription');
    const PricingPlan = mongoose.model('PricingPlan');
    const SubscriptionPlan = mongoose.model('SubscriptionPlan');
    
    // Find all subscriptions
    const subscriptions = await Subscription.find({});
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    let fixedCount = 0;
    
    for (const subscription of subscriptions) {
      // Check if the plan exists in PricingPlan
      const pricingPlan = await PricingPlan.findById(subscription.planId);
      
      if (!pricingPlan) {
        console.log(`\n❌ Subscription ${subscription._id} has invalid planId: ${subscription.planId}`);
        
        // Try to find a matching plan in SubscriptionPlan (old model)
        const oldPlan = await SubscriptionPlan.findById(subscription.planId);
        if (oldPlan) {
          console.log(`Found old plan: ${oldPlan.name} (${oldPlan.tier})`);
          
          // Try to find equivalent in PricingPlan
          const equivalentPlan = await PricingPlan.findOne({ 
            tier: oldPlan.tier,
            billingPeriod: oldPlan.billingInterval || 'monthly'
          });
          
          if (equivalentPlan) {
            console.log(`✅ Found equivalent plan: ${equivalentPlan.name} (${equivalentPlan._id})`);
            subscription.planId = equivalentPlan._id;
            await subscription.save();
            fixedCount++;
          } else {
            console.log(`❌ No equivalent plan found for tier: ${oldPlan.tier}`);
          }
        } else {
          console.log(`❌ Plan not found in either model`);
        }
      } else {
        console.log(`✅ Subscription ${subscription._id} has valid plan: ${pricingPlan.name}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} orphaned subscriptions`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrphanedSubscriptions();