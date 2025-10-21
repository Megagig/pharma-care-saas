const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharma-care-saas', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateSubscriptionPlans() {
  try {
    console.log('🔄 Starting subscription plan migration...');
    
    const Subscription = mongoose.model('Subscription');
    const PricingPlan = mongoose.model('PricingPlan');
    const Workplace = mongoose.model('Workplace');
    
    // Get all pricing plans for reference
    const pricingPlans = await PricingPlan.find({});
    console.log(`📋 Found ${pricingPlans.length} pricing plans`);
    
    // Create a mapping of tier -> plan for easy lookup
    const tierToPlan = {};
    pricingPlans.forEach(plan => {
      const key = `${plan.tier}_${plan.billingPeriod}`;
      tierToPlan[key] = plan;
      
      // Also create a fallback without billing period
      if (!tierToPlan[plan.tier]) {
        tierToPlan[plan.tier] = plan;
      }
    });
    
    console.log('📋 Available tiers:', Object.keys(tierToPlan));
    
    // Fix subscriptions
    console.log('\n🔧 Fixing subscriptions...');
    const subscriptions = await Subscription.find({});
    let fixedSubscriptions = 0;
    
    for (const subscription of subscriptions) {
      const planExists = await PricingPlan.findById(subscription.planId);
      
      if (!planExists) {
        console.log(`❌ Invalid planId in subscription ${subscription._id}: ${subscription.planId}`);
        
        // Try to find a matching plan by tier
        const matchingPlan = tierToPlan[subscription.tier] || 
                           tierToPlan[`${subscription.tier}_monthly`] ||
                           tierToPlan[`${subscription.tier}_yearly`];
        
        if (matchingPlan) {
          console.log(`✅ Updating to: ${matchingPlan.name} (${matchingPlan._id})`);
          subscription.planId = matchingPlan._id;
          await subscription.save();
          fixedSubscriptions++;
        } else {
          console.log(`❌ No matching plan found for tier: ${subscription.tier}`);
        }
      } else {
        console.log(`✅ Subscription ${subscription._id} has valid plan: ${planExists.name}`);
      }
    }
    
    // Fix workplaces
    console.log('\n🔧 Fixing workplaces...');
    const workplaces = await Workplace.find({ currentPlanId: { $exists: true } });
    let fixedWorkplaces = 0;
    
    for (const workplace of workplaces) {
      if (workplace.currentPlanId) {
        const planExists = await PricingPlan.findById(workplace.currentPlanId);
        
        if (!planExists) {
          console.log(`❌ Invalid currentPlanId in workspace ${workplace.name}: ${workplace.currentPlanId}`);
          
          // Try to get plan from subscription
          if (workplace.currentSubscriptionId) {
            const subscription = await Subscription.findById(workplace.currentSubscriptionId);
            if (subscription && subscription.planId) {
              const subscriptionPlan = await PricingPlan.findById(subscription.planId);
              if (subscriptionPlan) {
                console.log(`✅ Updating workspace plan to: ${subscriptionPlan.name}`);
                workplace.currentPlanId = subscription.planId;
                await workplace.save();
                fixedWorkplaces++;
              }
            }
          }
        } else {
          console.log(`✅ Workspace ${workplace.name} has valid plan: ${planExists.name}`);
        }
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Fixed ${fixedSubscriptions} subscriptions`);
    console.log(`📊 Fixed ${fixedWorkplaces} workplaces`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateSubscriptionPlans();