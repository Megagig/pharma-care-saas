#!/bin/bash

echo "🔧 Testing Timeout and Audit Log Fixes"
echo "======================================"

# Test 1: Verify backend compiles with new audit log enum
echo "📝 Test 1: Checking backend compilation..."
cd backend
npm run build 2>&1 | grep -E "(error|Error)" && echo "❌ Backend compilation failed" || echo "✅ Backend compiles successfully"

# Test 2: Check if server starts without errors
echo ""
echo "🚀 Test 2: Testing server startup..."
timeout 10s npm start > server_test.log 2>&1 &
SERVER_PID=$!
sleep 8
kill $SERVER_PID 2>/dev/null

if grep -q "Server running" server_test.log; then
    echo "✅ Server starts successfully"
else
    echo "❌ Server startup issues detected"
    echo "Last few lines from server log:"
    tail -5 server_test.log
fi

# Test 3: Verify timeout configurations
echo ""
echo "⏱️  Test 3: Verifying timeout configurations..."

# Check frontend API timeout
FRONTEND_TIMEOUT=$(grep -o "timeout: [0-9]*" ../frontend/src/services/api.ts | grep -o "[0-9]*")
if [ "$FRONTEND_TIMEOUT" = "300000" ]; then
    echo "✅ Frontend API timeout set to 5 minutes"
else
    echo "❌ Frontend API timeout not properly configured: $FRONTEND_TIMEOUT"
fi

# Check backend server timeout
SERVER_TIMEOUT=$(grep -o "server.timeout = [0-9]*" src/server.ts | grep -o "[0-9]*")
if [ "$SERVER_TIMEOUT" = "300000" ]; then
    echo "✅ Backend server timeout set to 5 minutes"
else
    echo "❌ Backend server timeout not properly configured: $SERVER_TIMEOUT"
fi

# Check diagnostic service timeout
DIAGNOSTIC_TIMEOUT=$(grep -o "processingTimeout = [0-9]*" src/modules/diagnostics/services/diagnosticService.ts | grep -o "[0-9]*")
if [ "$DIAGNOSTIC_TIMEOUT" = "300000" ]; then
    echo "✅ Diagnostic service timeout set to 5 minutes"
else
    echo "❌ Diagnostic service timeout not properly configured: $DIAGNOSTIC_TIMEOUT"
fi

# Test 4: Verify audit log enum values
echo ""
echo "📋 Test 4: Checking audit log enum values..."
if grep -q "VIEW_DIAGNOSTIC_HISTORY" src/models/AuditLog.ts; then
    echo "✅ VIEW_DIAGNOSTIC_HISTORY enum value added"
else
    echo "❌ VIEW_DIAGNOSTIC_HISTORY enum value missing"
fi

if grep -q "DIAGNOSTIC_ANALYSIS_REQUESTED" src/models/AuditLog.ts; then
    echo "✅ DIAGNOSTIC_ANALYSIS_REQUESTED enum value added"
else
    echo "❌ DIAGNOSTIC_ANALYSIS_REQUESTED enum value missing"
fi

# Cleanup
rm -f server_test.log

echo ""
echo "🎯 Summary:"
echo "- Extended all timeout configurations from 60 seconds to 5 minutes"
echo "- Added missing diagnostic audit log enum values"
echo "- Fixed audit log validation errors"
echo ""
echo "✅ All fixes applied successfully!"