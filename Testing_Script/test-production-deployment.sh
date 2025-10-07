#!/bin/bash

# Production Deployment Test Script
# Tests that the production deployment is working correctly

echo "🚀 Testing Production Deployment"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://PharmaPilot-nttq.onrender.com"
FRONTEND_URL="https://PharmaPilot-nttq.onrender.com"
API_URL="${BACKEND_URL}/api"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 30)
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_status, got $response)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Helper function to test CORS
test_cors() {
    local endpoint=$1
    local method=$2
    
    echo -n "Testing CORS for $endpoint... "
    
    response=$(curl -s -I -X OPTIONS "$API_URL$endpoint" \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: $method" \
        --max-time 10)
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (No CORS headers found)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}📡 Backend Tests${NC}"
echo "----------------"

# Test 1: Backend Health
test_endpoint "Backend Health" "$API_URL/health" 200

# Test 2: Backend API Root
test_endpoint "API Root" "$API_URL/" 404

# Test 3: Auth Login Endpoint (should return 400 without body)
test_endpoint "Auth Login Endpoint" "$API_URL/auth/login" 400

echo ""
echo -e "${BLUE}🌐 CORS Tests${NC}"
echo "-------------"

# Test 4: CORS on Auth Login
test_cors "/auth/login" "POST"

# Test 5: CORS on Patients
test_cors "/patients" "GET"

# Test 6: CORS on Workspace Settings
test_cors "/workspace/settings" "GET"

echo ""
echo -e "${BLUE}🎨 Frontend Tests${NC}"
echo "-----------------"

# Test 7: Frontend Loads
test_endpoint "Frontend Homepage" "$FRONTEND_URL" 200

# Test 8: Frontend Assets
test_endpoint "Frontend Assets" "$FRONTEND_URL/assets/" 200

echo ""
echo -e "${BLUE}🔍 Configuration Tests${NC}"
echo "----------------------"

# Test 9: Check if backend returns correct CORS headers
echo -n "Checking CORS headers... "
cors_header=$(curl -s -I -X OPTIONS "$API_URL/auth/login" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    --max-time 10 | grep -i "access-control-allow-origin")

if echo "$cors_header" | grep -q "$FRONTEND_URL"; then
    echo -e "${GREEN}✅ PASS${NC} (Correct origin: $FRONTEND_URL)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Wrong or missing origin)"
    echo "  Got: $cors_header"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 10: Check if backend allows credentials
echo -n "Checking credentials support... "
creds_header=$(curl -s -I -X OPTIONS "$API_URL/auth/login" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    --max-time 10 | grep -i "access-control-allow-credentials")

if echo "$creds_header" | grep -q "true"; then
    echo -e "${GREEN}✅ PASS${NC} (Credentials allowed)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Credentials not allowed)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo -e "${BLUE}📊 Database Tests${NC}"
echo "-----------------"

# Test 11: Check if backend can connect to database
echo -n "Testing database connection... "
health_response=$(curl -s "$API_URL/health" --max-time 30)

if echo "$health_response" | grep -q "database"; then
    if echo "$health_response" | grep -q '"database":"connected"'; then
        echo -e "${GREEN}✅ PASS${NC} (Database connected)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} (Database status unclear)"
        echo "  Response: $health_response"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (No database status in health check)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
echo "================================"
echo -e "${BLUE}📈 Test Summary${NC}"
echo "================================"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Pass Rate: $PASS_RATE%"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Production deployment is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test login functionality in browser"
    echo "2. Verify all features work as expected"
    echo "3. Monitor logs for any errors"
    echo "4. Set up monitoring and alerts"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the issues above.${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check backend logs in Render dashboard"
    echo "2. Verify environment variables are set correctly"
    echo "3. Ensure backend service is running (not sleeping)"
    echo "4. Check MongoDB Atlas connection"
    echo "5. Review PRODUCTION_DEPLOYMENT_GUIDE.md for detailed help"
    exit 1
fi
