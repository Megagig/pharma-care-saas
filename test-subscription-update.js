const axios = require('axios');

async function testSubscriptionUpdate() {
  try {
    console.log('Testing subscription update with PricingPlan model...');
    
    // First, get available plans
    console.log('\n1. Fetching available plans...');
    const plansResponse = await axios.get('http://localhost:5000/api/pricing/plans?billingPeriod=monthly');
    console.log(`Found ${plansResponse.data.data.plans.length} monthly plans`);
    
    const plans = plansResponse.data.data.plans;
    const basicPlan = plans.find(p => p.tier === 'basic');
    const proPlan = plans.find(p => p.tier === 'pro');
    
    if (!basicPlan || !proPlan) {
      console.log('❌ Could not find basic or pro plans');
      return;
    }
    
    console.log(`✅ Found Basic plan: ${basicPlan.name} (${basicPlan._id})`);
    console.log(`✅ Found Pro plan: ${proPlan.name} (${proPlan._id})`);
    
    // Get tenants to find one to test with
    console.log('\n2. Fetching tenants...');
    const tenantsResponse = await axios.get('http://localhost:5000/api/admin/saas/tenant-management/tenants');
    const tenants = tenantsResponse.data.data.tenants;
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found');
      return;
    }
    
    const testTenant = tenants[0];
    console.log(`✅ Using tenant: ${testTenant.name} (${testTenant._id})`);
    
    // Test subscription upgrade
    console.log('\n3. Testing subscription upgrade...');
    const upgradeResponse = await axios.put(
      `http://localhost:5000/api/admin/saas/tenant-management/tenants/${testTenant._id}/subscription`,
      {
        action: 'upgrade',
        planId: proPlan._id,
        reason: 'Testing subscription update with PricingPlan model'
      }
    );
    
    console.log('✅ Subscription upgrade successful!');
    console.log('Response:', upgradeResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSubscriptionUpdate();