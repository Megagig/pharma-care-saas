#!/bin/bash

# Test script for Workspace Team Management fixes
# This script tests all the fixed endpoints

echo "🧪 Testing Workspace Team Management Fixes"
echo "=========================================="
echo ""

# Set your backend URL
BACKEND_URL="http://localhost:5000"
API_BASE="${BACKEND_URL}/api/workspace/team"

# You need to set your auth token here
# Get it from browser dev tools after logging in as pharmacy_outlet user
AUTH_TOKEN="your-auth-token-here"

echo "📝 Note: Update AUTH_TOKEN in this script with a valid pharmacy_outlet user token"
echo ""

# Test 1: Get workspace stats
echo "1️⃣  Testing GET /api/workspace/team/stats"
curl -s -X GET "${API_BASE}/stats" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 2: Get members list
echo "2️⃣  Testing GET /api/workspace/team/members"
curl -s -X GET "${API_BASE}/members?page=1&limit=20" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 3: Get pending approvals
echo "3️⃣  Testing GET /api/workspace/team/invites/pending"
curl -s -X GET "${API_BASE}/invites/pending" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 4: Get invites list
echo "4️⃣  Testing GET /api/workspace/team/invites"
curl -s -X GET "${API_BASE}/invites?page=1&limit=20" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 5: Get audit logs
echo "5️⃣  Testing GET /api/workspace/team/audit"
curl -s -X GET "${API_BASE}/audit?page=1&limit=20" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 6: Generate invite (optional - uncomment to test)
# echo "6️⃣  Testing POST /api/workspace/team/invites"
# curl -s -X POST "${API_BASE}/invites" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "test@example.com",
#     "workplaceRole": "Staff",
#     "expiresInDays": 7,
#     "maxUses": 1,
#     "requiresApproval": false,
#     "personalMessage": "Welcome to our team!"
#   }' | jq '.'
# echo ""

echo "✅ All tests completed!"
echo ""
echo "Expected response format for all endpoints:"
echo '{'
echo '  "success": true,'
echo '  "data": {'
echo '    "members": [...],  // or invites, logs, etc.'
echo '    "pagination": {...}'
echo '  }'
echo '}'
echo ""
echo "If you see 'data is undefined' errors, the backend response format is incorrect."
