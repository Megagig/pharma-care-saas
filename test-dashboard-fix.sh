#!/bin/bash

# Dashboard Data Fix Verification Script
# This script helps verify that the dashboard data display fix is working

echo "🔍 Dashboard Data Fix Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if frontend files were modified
echo "📁 Checking modified files..."
echo ""

FILES_TO_CHECK=(
    "frontend/src/components/dashboard/RoleSwitcher.tsx"
    "frontend/src/services/roleBasedDashboardService.ts"
    "frontend/src/components/dashboard/SuperAdminDashboard.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
        
        # Check for key fixes
        if [ "$file" == "frontend/src/components/dashboard/RoleSwitcher.tsx" ]; then
            if grep -q "useAuth" "$file" && grep -q "user?.role" "$file"; then
                echo -e "  ${GREEN}✓${NC} Contains useAuth hook and user role parameter"
            else
                echo -e "  ${RED}✗${NC} Missing useAuth hook or user role parameter"
            fi
        fi
        
        if [ "$file" == "frontend/src/services/roleBasedDashboardService.ts" ]; then
            if grep -q "console.log.*API URL" "$file"; then
                echo -e "  ${GREEN}✓${NC} Contains enhanced logging"
            else
                echo -e "  ${YELLOW}⚠${NC} May be missing enhanced logging"
            fi
        fi
        
        if [ "$file" == "frontend/src/components/dashboard/SuperAdminDashboard.tsx" ]; then
            if grep -q "if (!data)" "$file"; then
                echo -e "  ${GREEN}✓${NC} Contains null data check"
            else
                echo -e "  ${YELLOW}⚠${NC} May be missing null data check"
            fi
        fi
    else
        echo -e "${RED}✗${NC} Not found: $file"
    fi
    echo ""
done

echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Restart the frontend development server:"
echo "   ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "2. Clear browser cache and reload:"
echo "   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   - Or open DevTools → Application → Clear storage"
echo ""
echo "3. Login as super admin and check console for these logs:"
echo "   ${GREEN}✓${NC} 🔄 Starting to fetch super admin dashboard data..."
echo "   ${GREEN}✓${NC} 🌐 Fetching super admin dashboard data from API..."
echo "   ${GREEN}✓${NC} ✅ Super admin dashboard data received"
echo "   ${GREEN}✓${NC} ✅ SuperAdminDashboard: Rendering dashboard with data"
echo ""
echo "4. Verify data is displayed in the dashboard:"
echo "   - System metrics cards show numbers"
echo "   - Workspaces table has rows"
echo "   - Charts display data"
echo ""
echo "=================================="
echo ""
echo "🐛 If issues persist, check:"
echo ""
echo "1. Browser console for errors"
echo "2. Network tab for API response"
echo "3. Backend logs for API errors"
echo "4. User role in database (should be 'super_admin')"
echo ""
echo "📖 See DASHBOARD_DATA_FIX_SUMMARY.md for detailed information"
echo ""
