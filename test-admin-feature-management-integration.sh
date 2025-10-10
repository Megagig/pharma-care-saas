#!/bin/bash

# Admin Feature Management - Complete Integration Test Script
# This script tests the entire workflow for task 20

set -e

echo "=========================================="
echo "Admin Feature Management Integration Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to check if backend is running
check_backend() {
    echo "1. Checking if backend server is running..."
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        print_result 0 "Backend server is running"
        return 0
    else
        print_result 1 "Backend server is not running"
        echo "   Please start the backend server with: cd backend && npm run dev"
        return 1
    fi
}

# Function to verify routes are registered
check_routes() {
    echo ""
    echo "2. Verifying feature flag routes are registered..."
    
    # Try to access the endpoint (should get 401 without auth, which means route exists)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/feature-flags)
    
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Feature flag routes are registered (HTTP $HTTP_CODE)"
    else
        print_result 1 "Feature flag routes not found (HTTP $HTTP_CODE)"
    fi
}

# Function to check frontend
check_frontend() {
    echo ""
    echo "3. Checking if frontend is running..."
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_result 0 "Frontend is running"
        return 0
    else
        print_result 1 "Frontend is not running"
        echo "   Please start the frontend with: cd frontend && npm run dev"
        return 1
    fi
}

# Function to verify database connection
check_database() {
    echo ""
    echo "4. Verifying database connection..."
    
    # Check if MongoDB is accessible through backend
    if curl -s http://localhost:5000/api/health | grep -q "ok\|healthy" 2>/dev/null; then
        print_result 0 "Database connection verified"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Could not verify database connection"
    fi
}

# Main test execution
main() {
    echo "Starting integration tests..."
    echo ""
    
    # Run checks
    check_backend || exit 1
    check_routes
    check_frontend || exit 1
    check_database
    
    echo ""
    echo "=========================================="
    echo "Manual Testing Checklist"
    echo "=========================================="
    echo ""
    echo "Please complete the following manual tests:"
    echo ""
    echo "□ 1. Login as super_admin user"
    echo "     - Navigate to http://localhost:5173/login"
    echo "     - Use super_admin credentials"
    echo ""
    echo "□ 2. Navigate to /admin/feature-management"
    echo "     - Click on 'Feature Management' in admin sidebar"
    echo "     - Verify page loads without errors"
    echo "     - Check browser console for errors (F12)"
    echo ""
    echo "□ 3. Create a new feature"
    echo "     - Click 'Add Feature' button"
    echo "     - Fill in all fields:"
    echo "       * Key: test_integration_feature"
    echo "       * Name: Test Integration Feature"
    echo "       * Description: Testing complete workflow"
    echo "       * Select tiers: basic, pro"
    echo "       * Select roles: pharmacist, owner"
    echo "       * Toggle isActive: ON"
    echo "     - Click Save"
    echo "     - Verify success toast appears"
    echo ""
    echo "□ 4. Verify feature appears in list"
    echo "     - Check Features tab"
    echo "     - Find 'Test Integration Feature' card"
    echo "     - Verify all details are correct"
    echo "     - Verify badges show: basic, pro, pharmacist, owner"
    echo ""
    echo "□ 5. Edit the feature"
    echo "     - Click Edit button on the feature"
    echo "     - Change description to: 'Updated during integration test'"
    echo "     - Add 'enterprise' tier"
    echo "     - Click Update"
    echo "     - Verify success toast appears"
    echo "     - Verify changes are reflected"
    echo ""
    echo "□ 6. Toggle tier access in matrix"
    echo "     - Switch to 'Tier Management' tab"
    echo "     - Find 'Test Integration Feature' row"
    echo "     - Toggle OFF the 'basic' tier"
    echo "     - Verify success toast appears"
    echo "     - Toggle it back ON"
    echo "     - Verify success toast appears"
    echo ""
    echo "□ 7. Delete the feature"
    echo "     - Go back to Features tab"
    echo "     - Click Delete button"
    echo "     - Confirm deletion in dialog"
    echo "     - Verify success toast appears"
    echo "     - Verify feature is removed from list"
    echo ""
    echo "□ 8. Test with non-super_admin user"
    echo "     - Logout from super_admin"
    echo "     - Login as regular user (pharmacist/owner)"
    echo "     - Try to navigate to /admin/feature-management"
    echo "     - Verify access is denied (403 or redirect)"
    echo "     - Verify appropriate error message"
    echo ""
    echo "□ 9. Verify existing workspace features work"
    echo "     - Login as workspace admin"
    echo "     - Navigate to workspace settings"
    echo "     - Verify workspace-level feature toggles work"
    echo "     - Toggle a feature ON/OFF"
    echo "     - Verify it works independently"
    echo ""
    echo "□ 10. Check browser console"
    echo "     - Open DevTools (F12)"
    echo "     - Check Console tab"
    echo "     - Verify no errors during operations"
    echo "     - Check Network tab for failed requests"
    echo ""
    echo "□ 11. Verify mobile responsiveness"
    echo "     - Open DevTools (F12)"
    echo "     - Toggle device toolbar (Ctrl+Shift+M)"
    echo "     - Test on mobile viewport (375px)"
    echo "     - Verify form is usable"
    echo "     - Verify matrix has horizontal scroll"
    echo "     - Test on tablet viewport (768px)"
    echo "     - Test on desktop viewport (1024px+)"
    echo ""
    echo "□ 12. Run automated E2E tests"
    echo "     - Execute: cd frontend && npm run test:e2e"
    echo "     - Verify all tests pass"
    echo ""
    
    echo ""
    echo "=========================================="
    echo "Automated Test Results"
    echo "=========================================="
    echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
    echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All automated checks passed!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Complete the manual testing checklist above"
        echo "2. Run E2E tests: cd frontend && npm run test:e2e"
        echo "3. Mark task 20 as complete if all tests pass"
    else
        echo -e "${RED}✗ Some automated checks failed${NC}"
        echo "Please fix the issues before proceeding with manual tests"
        exit 1
    fi
}

# Run main function
main
