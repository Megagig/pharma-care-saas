#!/bin/bash

echo "Testing subscription update with PricingPlan model..."

echo ""
echo "1. Fetching available monthly plans..."
PLANS_RESPONSE=$(curl -s "http://localhost:5000/api/pricing/plans?billingPeriod=monthly")
echo "Plans response: $PLANS_RESPONSE"

echo ""
echo "2. Fetching tenants..."
TENANTS_RESPONSE=$(curl -s "http://localhost:5000/api/admin/saas/tenant-management/tenants")
echo "Tenants response: $TENANTS_RESPONSE"

# Extract first tenant ID (you'll need to manually get this from the response)
echo ""
echo "3. To test subscription update, use:"
echo "curl -X PUT http://localhost:5000/api/admin/saas/tenant-management/tenants/TENANT_ID/subscription \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"action\": \"upgrade\", \"planId\": \"PLAN_ID\", \"reason\": \"Testing with PricingPlan model\"}'"