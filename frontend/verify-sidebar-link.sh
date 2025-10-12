#!/bin/bash

echo "=================================="
echo "Feature Management Link Verification"
echo "=================================="
echo ""

echo "1. Checking if Feature Management is in Sidebar.tsx..."
if grep -q "Feature Management" src/components/Sidebar.tsx; then
    echo "   ✅ FOUND: 'Feature Management' in Sidebar.tsx"
    grep -n "Feature Management" src/components/Sidebar.tsx
else
    echo "   ❌ NOT FOUND: 'Feature Management' in Sidebar.tsx"
fi

echo ""
echo "2. Checking if FlagIcon is imported..."
if grep -q "Flag as FlagIcon" src/components/Sidebar.tsx; then
    echo "   ✅ FOUND: FlagIcon import"
    grep -n "Flag as FlagIcon" src/components/Sidebar.tsx
else
    echo "   ❌ NOT FOUND: FlagIcon import"
fi

echo ""
echo "3. Checking if path is correct..."
if grep -q "/admin/feature-management" src/components/Sidebar.tsx; then
    echo "   ✅ FOUND: Correct path '/admin/feature-management'"
    grep -n "/admin/feature-management" src/components/Sidebar.tsx
else
    echo "   ❌ NOT FOUND: Path '/admin/feature-management'"
fi

echo ""
echo "4. Running tests..."
npm run test -- src/components/__tests__/Sidebar.featureManagement.test.tsx --run --reporter=verbose 2>&1 | tail -20

echo ""
echo "=================================="
echo "Verification Complete!"
echo "=================================="
echo ""
echo "If all checks passed (✅), the code is correctly implemented."
echo ""
echo "If you still don't see the link in the UI:"
echo "1. Make sure you're logged in as 'super_admin'"
echo "2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Restart the development server"
echo "4. Open the debug helper: open frontend/debug-sidebar.html"
echo ""
