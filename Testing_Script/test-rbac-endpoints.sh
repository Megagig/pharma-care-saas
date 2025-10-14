#!/bin/bash

# RBAC Endpoints Test Script
# Tests all critical RBAC endpoints after fixes

echo "🧪 Testing RBAC Endpoints..."
echo "================================"
echo ""

BASE_URL="http://localhost:5000"
TOKEN="your-auth-token-here"  # Replace with actual token from browser cookies

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local name=$3
    
    echo -n "Testing ${name}... "
    
    response=$(curl -s -w "\n%{http_code}" -X ${method} \
        -H "Content-Type: application/json" \
        -H "Cookie: accessToken=${TOKEN}" \
        "${BASE_URL}${endpoint}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 304 ]; then
        echo -e "${GREEN}✅ PASS${NC} (${http_code})"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (${http_code})"
        return 1
    fi
}

# Test critical endpoints
echo "📋 Core RBAC Endpoints:"
test_endpoint "GET" "/api/admin/users" "Users List"
test_endpoint "GET" "/api/admin/roles" "Roles List"
test_endpoint "GET" "/api/admin/permissions" "Permissions List"
echo ""

echo "🔄 Role Hierarchy Endpoints:"
test_endpoint "GET" "/api/role-hierarchy/hierarchy-tree" "Hierarchy Tree"
echo ""

echo "📊 Audit & Monitoring:"
test_endpoint "GET" "/api/rbac-audit/dashboard" "Audit Dashboard"
test_endpoint "GET" "/api/rbac-audit/logs" "Audit Logs"
echo ""

echo "================================"
echo "✅ Test completed!"
echo ""
echo "Note: If tests fail with 401, update the TOKEN variable with your actual auth token."
echo "You can find it in browser DevTools > Application > Cookies > accessToken"
