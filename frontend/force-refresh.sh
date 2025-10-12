#!/bin/bash

echo "🔄 Force Refresh Script for Feature Management Link"
echo "=================================================="
echo ""

# Step 1: Kill the dev server
echo "1. Stopping development server..."
pkill -f "vite.*5173" 2>/dev/null
sleep 2
echo "   ✅ Dev server stopped"

# Step 2: Clear Vite cache
echo ""
echo "2. Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
echo "   ✅ Vite cache cleared"

# Step 3: Verify the code is there
echo ""
echo "3. Verifying code implementation..."
if grep -q "Feature Management" src/components/Sidebar.tsx; then
    echo "   ✅ Feature Management found in Sidebar.tsx"
else
    echo "   ❌ Feature Management NOT found - something went wrong!"
    exit 1
fi

# Step 4: Start dev server
echo ""
echo "4. Starting development server..."
echo ""
echo "=================================================="
echo "🚀 Starting Vite dev server..."
echo "=================================================="
echo ""
echo "Once the server starts:"
echo "1. Open your browser to http://localhost:5173"
echo "2. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard refresh"
echo "3. Login as super_admin (megagigdev@gmail.com)"
echo "4. Look for ADMINISTRATION section in sidebar"
echo "5. You should see: Feature Management with 🚩 icon"
echo ""
echo "Starting server now..."
echo ""

npm run dev
