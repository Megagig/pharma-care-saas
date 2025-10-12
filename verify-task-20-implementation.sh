#!/bin/bash

# Task 20 Implementation Verification Script
# Verifies that all code components are in place for the integration test

# Don't exit on error - we want to collect all results
set +e

echo "=========================================="
echo "Task 20: Implementation Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((CHECKS_FAILED++))
        return 1
    fi
}

check_file_silent() {
    if [ -f "$1" ]; then
        return 0
    else
        return 1
    fi
}

check_content() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}✗${NC} $3 (file not found: $1)"
        ((CHECKS_FAILED++))
        return 1
    fi
    
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $3"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo -e "${BLUE}1. Backend Components${NC}"
echo "---"
check_file "backend/src/routes/featureFlagRoutes.ts"
check_file "backend/src/controllers/featureFlagController.ts"
check_file "backend/src/models/FeatureFlag.ts"

echo ""
echo -e "${BLUE}2. Backend Route Registration${NC}"
echo "---"
check_content "backend/src/app.ts" "featureFlagRoutes" "Feature flag routes imported"
check_content "backend/src/app.ts" "/api/feature-flags" "Feature flag routes registered"

echo ""
echo -e "${BLUE}3. Frontend Components${NC}"
echo "---"
check_file "frontend/src/pages/FeatureManagement.tsx"
check_file "frontend/src/services/featureFlagService.ts"

echo ""
echo -e "${BLUE}4. Frontend Route Configuration${NC}"
echo "---"
check_content "frontend/src/App.tsx" "feature-management" "Feature management route exists"
check_content "frontend/src/App.tsx" "FeatureManagement" "FeatureManagement component imported"

echo ""
echo -e "${BLUE}5. Sidebar Navigation${NC}"
echo "---"
check_content "frontend/src/components/Sidebar.tsx" "feature-management" "Sidebar link exists"
check_content "frontend/src/components/Sidebar.tsx" "Feature Management" "Sidebar link text exists"

echo ""
echo -e "${BLUE}6. Test Files${NC}"
echo "---"
check_file "backend/src/__tests__/controllers/featureFlagController.test.ts"
check_file "frontend/src/services/__tests__/featureFlagService.test.ts"
check_file "frontend/src/pages/__tests__/FeatureManagement.test.tsx"
check_file "frontend/src/__tests__/e2e/featureManagement.e2e.test.ts"

echo ""
echo -e "${BLUE}7. Documentation${NC}"
echo "---"
check_file "docs/FEATURE_FLAGS_API.md"
check_file "TASK_20_INTEGRATION_TEST_GUIDE.md"

echo ""
echo -e "${BLUE}8. Middleware and Authorization${NC}"
echo "---"
check_content "backend/src/routes/featureFlagRoutes.ts" "requireSuperAdmin" "Super admin middleware applied"
check_content "backend/src/routes/featureFlagRoutes.ts" "auth" "Auth middleware applied"

echo ""
echo -e "${BLUE}9. Controller Methods${NC}"
echo "---"
check_content "backend/src/controllers/featureFlagController.ts" "getAllFeatureFlags" "getAllFeatureFlags method exists"
check_content "backend/src/controllers/featureFlagController.ts" "createFeatureFlag" "createFeatureFlag method exists"
check_content "backend/src/controllers/featureFlagController.ts" "updateFeatureFlag" "updateFeatureFlag method exists"
check_content "backend/src/controllers/featureFlagController.ts" "deleteFeatureFlag" "deleteFeatureFlag method exists"
check_content "backend/src/controllers/featureFlagController.ts" "updateTierFeatures" "updateTierFeatures method exists"

echo ""
echo -e "${BLUE}10. Frontend Service Methods${NC}"
echo "---"
check_content "frontend/src/services/featureFlagService.ts" "getFeatureFlags" "getFeatureFlags method exists"
check_content "frontend/src/services/featureFlagService.ts" "createFeatureFlag" "createFeatureFlag method exists"
check_content "frontend/src/services/featureFlagService.ts" "updateFeatureFlag" "updateFeatureFlag method exists"
check_content "frontend/src/services/featureFlagService.ts" "deleteFeatureFlag" "deleteFeatureFlag method exists"
check_content "frontend/src/services/featureFlagService.ts" "updateTierFeatures" "updateTierFeatures method exists"

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Checks Passed: ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Checks Failed: ${RED}${CHECKS_FAILED}${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All implementation checks passed!${NC}"
    echo ""
    echo "The code implementation is complete. You can now:"
    echo "1. Start the backend server: cd backend && npm run dev"
    echo "2. Start the frontend server: cd frontend && npm run dev"
    echo "3. Follow the integration test guide: TASK_20_INTEGRATION_TEST_GUIDE.md"
    echo "4. Run automated tests: cd frontend && npm run test:e2e"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some implementation checks failed${NC}"
    echo "Please review the missing components above"
    echo ""
    exit 1
fi
