#!/bin/bash

echo "🧪 Phase 1: Backend API Endpoints Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backend URL
BACKEND_URL="http://localhost:5000"

echo "📋 Testing new Super Admin Dashboard endpoints..."
echo ""

# Note: These will return 401 without authentication, which is expected
# We're just checking if the endpoints exist and routes are registered

echo "1️⃣  Testing Clinical Interventions endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/super-admin/dashboard/clinical-interventions" 2>&1)
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ] || [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Endpoint exists (Status: $STATUS_CODE)"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${RED}✗${NC} Endpoint NOT FOUND (404)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected status: $STATUS_CODE"
fi
echo ""

echo "2️⃣  Testing Activities endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/super-admin/dashboard/activities" 2>&1)
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ] || [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Endpoint exists (Status: $STATUS_CODE)"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${RED}✗${NC} Endpoint NOT FOUND (404)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected status: $STATUS_CODE"
fi
echo ""

echo "3️⃣  Testing Communications endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/super-admin/dashboard/communications" 2>&1)
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ] || [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Endpoint exists (Status: $STATUS_CODE)"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${RED}✗${NC} Endpoint NOT FOUND (404)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected status: $STATUS_CODE"
fi
echo ""

echo "4️⃣  Checking existing endpoints still work..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/super-admin/dashboard/overview" 2>&1)
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ] || [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Overview endpoint still works (Status: $STATUS_CODE)"
else
    echo -e "${RED}✗${NC} Overview endpoint broken! (Status: $STATUS_CODE)"
fi
echo ""

echo "========================================"
echo ""
echo "📝 Summary:"
echo ""
echo "Expected Results:"
echo "- Status 401 = Endpoint exists, requires authentication ✓"
echo "- Status 200 = Endpoint exists and accessible ✓"
echo "- Status 404 = Endpoint not found ✗"
echo ""
echo "Next Steps:"
echo "1. If all endpoints return 401 or 200: ✅ Phase 1 Complete!"
echo "2. If any return 404: Check backend logs and route registration"
echo "3. Restart backend if needed: cd backend && npm run dev"
echo ""
echo "To test with authentication:"
echo "1. Login as super admin in the app"
echo "2. Copy the auth cookie from browser DevTools"
echo "3. Use curl with -H 'Cookie: <your-cookie>'"
echo ""
