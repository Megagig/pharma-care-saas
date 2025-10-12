#!/bin/bash

# Test script to verify feature flag routes are accessible
# Usage: ./test-feature-flag-routes.sh

API_BASE_URL="${API_URL:-http://localhost:5000}"

echo "========================================================"
echo "Feature Flag Routes Accessibility Test (curl)"
echo "========================================================"
echo "Testing API at: $API_BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local description=$3
    local expected_status=$4
    
    echo "Testing: $method $path"
    echo "Description: $description"
    
    # Make request and capture status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_BASE_URL$path" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if [[ "$expected_status" == *"$status_code"* ]]; then
            echo -e "${GREEN}✓ Route is accessible (Status: $status_code)${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ Unexpected status code: $status_code (Expected: $expected_status)${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ Connection error - Is the server running?${NC}"
        ((FAILED++))
    fi
    echo ""
}

# Check if server is running
echo "Checking if backend server is running..."
if ! curl -s "$API_BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: Server does not appear to be running${NC}"
    echo "Start the server with: npm run dev"
    echo ""
fi

# Test endpoints
test_endpoint "GET" "/api/health" "Health check endpoint" "200"
test_endpoint "GET" "/api/feature-flags" "Get all feature flags (requires auth)" "200 401"
test_endpoint "GET" "/api/feature-flags/tier/pro" "Get features by tier (requires auth)" "200 401 403"

# Summary
echo "========================================================"
echo "Test Summary"
echo "========================================================"
echo "Total Tests: $((PASSED + FAILED))"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All routes are properly registered and accessible!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some routes failed. Please check the server is running.${NC}"
    echo "Start the server with: npm run dev"
    exit 1
fi
