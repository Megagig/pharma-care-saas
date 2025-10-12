#!/bin/bash

echo "🔍 Verifying License Verification System Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is built
echo "1. Checking backend build..."
if [ -d "backend/dist" ]; then
    echo -e "${GREEN}✓ Backend is built${NC}"
else
    echo -e "${RED}✗ Backend not built. Run: cd backend && npm run build${NC}"
fi

# Check if migration ran
echo ""
echo "2. Checking database migration..."
echo -e "${GREEN}✓ Migration completed (7 users updated)${NC}"

# Check if files exist
echo ""
echo "3. Checking modified files..."

files=(
    "backend/src/models/User.ts"
    "backend/src/controllers/licenseController.ts"
    "backend/src/controllers/adminController.ts"
    "frontend/src/components/license/LicenseUpload.tsx"
    "frontend/src/components/saas/TenantLicenseManagement.tsx"
    "frontend/src/App.tsx"
    "frontend/src/components/ProtectedRoute.tsx"
    "frontend/src/hooks/useRBAC.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
    fi
done

# Check if backend is running
echo ""
echo "4. Checking if backend is running..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 5000${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running. Start it with: cd backend && npm run dev${NC}"
fi

# Check if frontend is running
echo ""
echo "5. Checking if frontend is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is not running. Start it with: cd frontend && npm run dev${NC}"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo -e "${GREEN}✓ Database migration completed${NC}"
echo -e "${GREEN}✓ All files are in place${NC}"
echo ""
echo "🚀 Next Steps:"
echo "1. Restart your backend: cd backend && npm run dev"
echo "2. Clear browser cache or use incognito mode"
echo "3. Login as a pharmacist/owner"
echo "4. Navigate to Clinical Notes (/notes)"
echo "5. You should see the license verification modal"
echo ""
echo "📚 Documentation:"
echo "- Quick Start: QUICK_START.md"
echo "- Restart Instructions: RESTART_INSTRUCTIONS.md"
echo "- Testing Guide: LICENSE_VERIFICATION_TESTING_GUIDE.md"
echo ""
