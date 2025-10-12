#!/bin/bash

# Test script for all fixes
echo "🧪 Testing All Fixes"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="http://localhost:5000"
API_BASE="${BACKEND_URL}/api"

# You need to set your auth token here
AUTH_TOKEN="your-auth-token-here"

echo "📝 Note: Update AUTH_TOKEN in this script with a valid pharmacy_outlet user token"
echo ""

# Test 1: Generate Invite Link (should not return undefined)
echo "1️⃣  Testing Invite Link Generation"
echo "-----------------------------------"
INVITE_RESPONSE=$(curl -s -X POST "${API_BASE}/workspace/team/invites" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "workplaceRole": "Staff",
    "expiresInDays": 7,
    "maxUses": 1,
    "requiresApproval": true,
    "personalMessage": "Welcome to our team!"
  }')

echo "$INVITE_RESPONSE" | jq '.'

# Check if inviteUrl is not undefined
INVITE_URL=$(echo "$INVITE_RESPONSE" | jq -r '.data.invite.inviteUrl')
if [[ "$INVITE_URL" == *"undefined"* ]]; then
  echo -e "${RED}❌ FAIL: Invite URL contains 'undefined'${NC}"
  echo "URL: $INVITE_URL"
else
  echo -e "${GREEN}✅ PASS: Invite URL is valid${NC}"
  echo "URL: $INVITE_URL"
fi
echo ""

# Test 2: Register with Invite Token
echo "2️⃣  Testing Registration with Invite Token"
echo "-------------------------------------------"
INVITE_TOKEN=$(echo "$INVITE_RESPONSE" | jq -r '.data.invite.inviteToken')
if [ "$INVITE_TOKEN" != "null" ] && [ -n "$INVITE_TOKEN" ]; then
  REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"Test\",
      \"lastName\": \"User\",
      \"email\": \"test@example.com\",
      \"password\": \"Test123!@#\",
      \"phone\": \"+1234567890\",
      \"inviteToken\": \"$INVITE_TOKEN\"
    }")
  
  echo "$REGISTER_RESPONSE" | jq '.'
  
  # Check if user was assigned to workspace
  WORKSPACE_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.workplaceId')
  if [ "$WORKSPACE_ID" != "null" ] && [ -n "$WORKSPACE_ID" ]; then
    echo -e "${GREEN}✅ PASS: User assigned to workspace${NC}"
  else
    echo -e "${RED}❌ FAIL: User not assigned to workspace${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP: No invite token available${NC}"
fi
echo ""

# Test 3: Register with Invite Code
echo "3️⃣  Testing Registration with Invite Code"
echo "------------------------------------------"
echo "Enter your workspace invite code (e.g., BN4QYW):"
read -r INVITE_CODE

if [ -n "$INVITE_CODE" ]; then
  REGISTER_CODE_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"Code\",
      \"lastName\": \"User\",
      \"email\": \"codeuser@example.com\",
      \"password\": \"Test123!@#\",
      \"phone\": \"+1234567890\",
      \"inviteCode\": \"$INVITE_CODE\"
    }")
  
  echo "$REGISTER_CODE_RESPONSE" | jq '.'
  
  # Check if user was assigned to workspace
  WORKSPACE_ID=$(echo "$REGISTER_CODE_RESPONSE" | jq -r '.user.workplaceId')
  REQUIRES_APPROVAL=$(echo "$REGISTER_CODE_RESPONSE" | jq -r '.requiresApproval')
  
  if [ "$WORKSPACE_ID" != "null" ] && [ -n "$WORKSPACE_ID" ]; then
    echo -e "${GREEN}✅ PASS: User assigned to workspace${NC}"
  else
    echo -e "${RED}❌ FAIL: User not assigned to workspace${NC}"
  fi
  
  if [ "$REQUIRES_APPROVAL" == "true" ]; then
    echo -e "${GREEN}✅ PASS: Requires approval is true${NC}"
  else
    echo -e "${RED}❌ FAIL: Requires approval should be true${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP: No invite code provided${NC}"
fi
echo ""

# Test 4: Pending User Login (should fail)
echo "4️⃣  Testing Pending User Login Block"
echo "-------------------------------------"
echo "This test requires a pending user. Creating one..."

# First register a user
PENDING_EMAIL="pending_$(date +%s)@example.com"
curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Pending\",
    \"lastName\": \"User\",
    \"email\": \"$PENDING_EMAIL\",
    \"password\": \"Test123!@#\",
    \"inviteCode\": \"$INVITE_CODE\"
  }" > /dev/null

# Try to login (should fail)
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$PENDING_EMAIL\",
    \"password\": \"Test123!@#\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

# Check if login was blocked
if echo "$LOGIN_RESPONSE" | grep -q "pending approval"; then
  echo -e "${GREEN}✅ PASS: Pending user blocked from login${NC}"
  echo -e "${GREEN}✅ PASS: Clear error message provided${NC}"
else
  echo -e "${RED}❌ FAIL: Pending user should be blocked${NC}"
fi
echo ""

# Test 5: Check Pending Approvals List
echo "5️⃣  Testing Pending Approvals List"
echo "-----------------------------------"
PENDING_RESPONSE=$(curl -s -X GET "${API_BASE}/workspace/team/invites/pending" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")

echo "$PENDING_RESPONSE" | jq '.'

PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq -r '.data.count')
if [ "$PENDING_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ PASS: Pending members found${NC}"
  echo "Count: $PENDING_COUNT"
else
  echo -e "${YELLOW}⚠️  INFO: No pending members (this is OK if none exist)${NC}"
fi
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo ""
echo "Tests completed. Review the results above."
echo ""
echo "Expected Results:"
echo "1. ✅ Invite URL should NOT contain 'undefined'"
echo "2. ✅ User registered with invite token should have workplaceId"
echo "3. ✅ User registered with invite code should have workplaceId and requiresApproval=true"
echo "4. ✅ Pending user should be blocked from login with clear message"
echo "5. ✅ Pending users should appear in pending approvals list"
echo ""
echo "🔍 Manual Tests Required:"
echo "1. Open frontend and generate invite link"
echo "2. Check that 'Generate Invite Link' button is visible"
echo "3. Try to login as pending user and verify toast message appears"
echo "4. Check that pending user appears in Pending Approvals tab"
echo ""
echo "✅ All automated tests complete!"
