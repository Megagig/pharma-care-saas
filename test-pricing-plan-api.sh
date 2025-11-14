#!/bin/bash

# Test Pricing Plan API Endpoints
# Run this to verify all endpoints are working correctly

echo "🧪 Testing Pricing Plan Management API Endpoints..."
echo ""

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Test 1: Get All Pricing Plans"
echo "GET $BASE_URL/admin/pricing-plans"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  "$BASE_URL/admin/pricing-plans")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Success (200)${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE" | grep -v "HTTP_CODE"
fi
echo ""

echo "🔄 Test 2: Sync All Pricing Plans"
echo "POST $BASE_URL/admin/pricing-plans/sync"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  "$BASE_URL/admin/pricing-plans/sync")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Success (200)${NC}"
    echo "$RESPONSE" | grep -v "HTTP_CODE" | jq -r '.message'
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE" | grep -v "HTTP_CODE"
fi
echo ""

echo "🔍 Test 3: Validate Subscriptions"
echo "POST $BASE_URL/admin/pricing-plans/validate-subscriptions"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  "$BASE_URL/admin/pricing-plans/validate-subscriptions")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Success (200)${NC}"
    echo "$RESPONSE" | grep -v "HTTP_CODE" | jq -r '.message'
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE" | grep -v "HTTP_CODE"
fi
echo ""

echo "📊 Summary:"
echo "- All endpoints should return 200 or 401 (if not authenticated)"
echo "- If getting 404, check that routes are registered in app.ts"
echo "- If getting 401, login first and get cookies"
echo ""
echo "🎉 Testing complete!"
