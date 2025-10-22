#!/bin/bash

echo "🔍 Dashboard Data Population Fix Verification"
echo "============================================="

# Check if backend is running
echo ""
echo "1. Checking if backend is running..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 5000"
else
    echo "   ❌ Backend is not running on port 5000"
    echo "   Please start the backend with: npm run dev"
    exit 1
fi

# Test super admin dashboard endpoint
echo ""
echo "2. Testing super admin dashboard endpoint..."
SUPER_ADMIN_RESPONSE=$(curl -s -H "X-Super-Admin-Test: true" http://localhost:5000/api/super-admin/dashboard/overview)

if echo "$SUPER_ADMIN_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Super admin dashboard endpoint working"
    
    # Extract system stats
    TOTAL_WORKSPACES=$(echo "$SUPER_ADMIN_RESPONSE" | jq -r '.data.systemStats.totalWorkspaces // 0' 2>/dev/null || echo "0")
    TOTAL_USERS=$(echo "$SUPER_ADMIN_RESPONSE" | jq -r '.data.systemStats.totalUsers // 0' 2>/dev/null || echo "0")
    TOTAL_PATIENTS=$(echo "$SUPER_ADMIN_RESPONSE" | jq -r '.data.systemStats.totalPatients // 0' 2>/dev/null || echo "0")
    
    echo "   📊 System Stats: $TOTAL_WORKSPACES workspaces, $TOTAL_USERS users, $TOTAL_PATIENTS patients"
else
    echo "   ❌ Super admin dashboard endpoint failed"
    echo "   Response: $SUPER_ADMIN_RESPONSE"
fi

# Test debug endpoint
echo ""
echo "3. Testing debug endpoint..."
DEBUG_RESPONSE=$(curl -s -H "X-Super-Admin-Test: true" http://localhost:5000/api/dashboard/debug)

if echo "$DEBUG_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Debug endpoint working"
    
    # Extract debug info
    USER_ROLE=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.user.role // "unknown"' 2>/dev/null || echo "unknown")
    WORKPLACE_ID=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.user.workplaceId // "none"' 2>/dev/null || echo "none")
    PATIENTS_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.dataInWorkspace.patients // 0' 2>/dev/null || echo "0")
    
    echo "   🔍 Debug Info: Role=$USER_ROLE, WorkplaceId=$WORKPLACE_ID, Patients=$PATIENTS_COUNT"
else
    echo "   ❌ Debug endpoint failed"
    echo "   Response: $DEBUG_RESPONSE"
fi

# Test regular dashboard endpoint
echo ""
echo "4. Testing regular dashboard endpoint..."
REGULAR_RESPONSE=$(curl -s -H "X-Super-Admin-Test: true" http://localhost:5000/api/dashboard/overview)

if echo "$REGULAR_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Regular dashboard endpoint working"
    
    # Extract stats
    PATIENTS=$(echo "$REGULAR_RESPONSE" | jq -r '.data.stats.totalPatients // 0' 2>/dev/null || echo "0")
    NOTES=$(echo "$REGULAR_RESPONSE" | jq -r '.data.stats.totalClinicalNotes // 0' 2>/dev/null || echo "0")
    MEDICATIONS=$(echo "$REGULAR_RESPONSE" | jq -r '.data.stats.totalMedications // 0' 2>/dev/null || echo "0")
    
    echo "   📊 Workspace Stats: $PATIENTS patients, $NOTES notes, $MEDICATIONS medications"
else
    echo "   ❌ Regular dashboard endpoint failed"
    echo "   Response: $REGULAR_RESPONSE"
fi

echo ""
echo "🏁 Verification Summary:"
echo "======================="

# Check if we have any data
TOTAL_DATA=$((PATIENTS + NOTES + MEDICATIONS))

if [ "$TOTAL_DATA" -gt 0 ]; then
    echo "✅ SUCCESS: Dashboard endpoints are working and showing data!"
    echo "   - Regular users should see workspace-specific data"
    echo "   - Super admins should see system-wide data"
else
    echo "⚠️  NOTICE: Dashboard endpoints are working but showing no data"
    echo "   This could mean:"
    echo "   1. Database is empty (expected for new installations)"
    echo "   2. User is in empty workspace (expected for new users)"
    echo "   3. Data exists but workplaceId mismatch (needs investigation)"
fi

echo ""
echo "🔧 Next Steps:"
echo "============="
echo "1. Start frontend: npm start (in frontend directory)"
echo "2. Login as different user types to test dashboard"
echo "3. Use debug button (🔍) in development mode"
echo "4. Run: node test-dashboard-fix.js for detailed testing"
echo "5. Check browser console for debug information"

echo ""
echo "📚 Debug Commands:"
echo "=================="
echo "# In browser console (development mode):"
echo "debugWorkspace()           # Full workspace analysis"
echo "testDashboardEndpoints()   # Test all dashboard APIs"
echo "getCurrentUserInfo()       # Show current user info"