#!/bin/bash

echo "🔍 Testing API Path Configuration"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Check backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://127.0.0.1:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running on port 5000"
else
    echo -e "${RED}✗${NC} Backend is NOT running on port 5000"
    echo "   Start backend with: cd backend && npm run dev"
    exit 1
fi
echo ""

# Test 2: Check super admin endpoint exists
echo "2️⃣  Checking if super admin endpoint exists..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://127.0.0.1:5000/api/super-admin/dashboard/overview 2>&1)
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} Endpoint exists (returns 401 - auth required, which is correct)"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${RED}✗${NC} Endpoint NOT FOUND (404)"
    echo "   Check backend routes are registered"
    exit 1
else
    echo -e "${YELLOW}⚠${NC} Unexpected status code: $STATUS_CODE"
fi
echo ""

# Test 3: Check roleBasedDashboardService paths
echo "3️⃣  Checking roleBasedDashboardService API paths..."
if grep -q "apiClient.get('/super-admin/dashboard/overview')" frontend/src/services/roleBasedDashboardService.ts; then
    echo -e "${GREEN}✓${NC} Super admin dashboard path is correct"
else
    echo -e "${RED}✗${NC} Super admin dashboard path may be incorrect"
fi

if grep -q "apiClient.get('/dashboard/overview')" frontend/src/services/roleBasedDashboardService.ts; then
    echo -e "${GREEN}✓${NC} Workspace dashboard path is correct"
else
    echo -e "${RED}✗${NC} Workspace dashboard path may be incorrect"
fi

if grep -q "apiClient.get('/super-admin/dashboard/workspaces')" frontend/src/services/roleBasedDashboardService.ts; then
    echo -e "${GREEN}✓${NC} Workspaces list path is correct"
else
    echo -e "${RED}✗${NC} Workspaces list path may be incorrect"
fi
echo ""

# Test 4: Check for double /api paths
echo "4️⃣  Checking for double /api paths..."
if grep -q "'/api/api/" frontend/src/services/roleBasedDashboardService.ts; then
    echo -e "${RED}✗${NC} Found double /api/api/ path!"
    exit 1
elif grep -q '"/api/api/' frontend/src/services/roleBasedDashboardService.ts; then
    echo -e "${RED}✗${NC} Found double /api/api/ path!"
    exit 1
else
    echo -e "${GREEN}✓${NC} No double /api paths found"
fi
echo ""

# Test 5: Check apiClient baseURL
echo "5️⃣  Checking apiClient configuration..."
if grep -q "baseURL: '/api'" frontend/src/services/apiClient.ts; then
    echo -e "${GREEN}✓${NC} apiClient baseURL is set to '/api'"
else
    echo -e "${YELLOW}⚠${NC} apiClient baseURL may not be configured correctly"
fi
echo ""

# Test 6: Check Vite proxy
echo "6️⃣  Checking Vite proxy configuration..."
if grep -q "'/api':" frontend/vite.config.ts; then
    echo -e "${GREEN}✓${NC} Vite proxy is configured for /api"
else
    echo -e "${RED}✗${NC} Vite proxy may not be configured"
fi
echo ""

echo "=================================="
echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Make sure frontend dev server is running: cd frontend && npm run dev"
echo "2. Clear browser cache: Ctrl+Shift+R or Cmd+Shift+R"
echo "3. Login as super admin"
echo "4. Check browser console for successful API calls"
echo "5. Check Network tab - should see /api/super-admin/dashboard/overview with 200 status"
echo ""
echo "🐛 If issues persist:"
echo "- Check browser console for errors"
echo "- Check Network tab for request/response"
echo "- Check Vite terminal for proxy logs"
echo "- Check backend terminal for request logs"
echo ""
