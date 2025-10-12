#!/bin/bash

# Test script for workspace team suspension/activation endpoints
# This script demonstrates the API usage for manual testing

BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api/workspace/team"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Workspace Team Suspension/Activation Endpoint Tests ===${NC}\n"

# Note: Replace these with actual values from your test environment
WORKSPACE_OWNER_TOKEN="your_workspace_owner_jwt_token_here"
MEMBER_ID="member_id_to_suspend_here"

echo -e "${YELLOW}Prerequisites:${NC}"
echo "1. Backend server must be running on $BASE_URL"
echo "2. You must have a valid workspace owner JWT token"
echo "3. You must have a member ID to test with"
echo ""
echo -e "${YELLOW}Update the following variables in this script:${NC}"
echo "- WORKSPACE_OWNER_TOKEN"
echo "- MEMBER_ID"
echo ""

# Test 1: Suspend a member
echo -e "${YELLOW}Test 1: Suspend a member${NC}"
echo "POST $API_URL/members/$MEMBER_ID/suspend"
echo ""
echo "Request body:"
cat <<EOF
{
  "reason": "Policy violation - test suspension"
}
EOF
echo ""
echo "Command:"
echo "curl -X POST \"$API_URL/members/$MEMBER_ID/suspend\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"reason\": \"Policy violation - test suspension\"}'"
echo ""
echo -e "${GREEN}Expected Response:${NC}"
cat <<EOF
{
  "success": true,
  "message": "Member suspended successfully",
  "member": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "status": "suspended",
    "suspendedAt": "2025-10-10T...",
    "suspensionReason": "Policy violation - test suspension"
  },
  "audit": {
    "action": "member_suspended",
    "memberId": "...",
    "memberEmail": "...",
    "reason": "Policy violation - test suspension",
    "suspendedBy": "...",
    "suspendedAt": "2025-10-10T..."
  }
}
EOF
echo ""
echo "---"
echo ""

# Test 2: Try to suspend already suspended member (should fail)
echo -e "${YELLOW}Test 2: Try to suspend already suspended member (should fail)${NC}"
echo "POST $API_URL/members/$MEMBER_ID/suspend"
echo ""
echo "Command:"
echo "curl -X POST \"$API_URL/members/$MEMBER_ID/suspend\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"reason\": \"Another suspension\"}'"
echo ""
echo -e "${RED}Expected Response (Error):${NC}"
cat <<EOF
{
  "success": false,
  "message": "Member is already suspended"
}
EOF
echo ""
echo "---"
echo ""

# Test 3: Activate the suspended member
echo -e "${YELLOW}Test 3: Activate the suspended member${NC}"
echo "POST $API_URL/members/$MEMBER_ID/activate"
echo ""
echo "Command:"
echo "curl -X POST \"$API_URL/members/$MEMBER_ID/activate\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo -e "${GREEN}Expected Response:${NC}"
cat <<EOF
{
  "success": true,
  "message": "Member activated successfully",
  "member": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "status": "active",
    "reactivatedAt": "2025-10-10T..."
  },
  "audit": {
    "action": "member_activated",
    "memberId": "...",
    "memberEmail": "...",
    "previousSuspensionReason": "Policy violation - test suspension",
    "previousSuspendedAt": "2025-10-10T...",
    "reactivatedBy": "...",
    "reactivatedAt": "2025-10-10T..."
  }
}
EOF
echo ""
echo "---"
echo ""

# Test 4: Try to activate non-suspended member (should fail)
echo -e "${YELLOW}Test 4: Try to activate non-suspended member (should fail)${NC}"
echo "POST $API_URL/members/$MEMBER_ID/activate"
echo ""
echo "Command:"
echo "curl -X POST \"$API_URL/members/$MEMBER_ID/activate\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo -e "${RED}Expected Response (Error):${NC}"
cat <<EOF
{
  "success": false,
  "message": "Member is not suspended"
}
EOF
echo ""
echo "---"
echo ""

# Test 5: Validation - Missing suspension reason
echo -e "${YELLOW}Test 5: Validation - Missing suspension reason (should fail)${NC}"
echo "POST $API_URL/members/$MEMBER_ID/suspend"
echo ""
echo "Command:"
echo "curl -X POST \"$API_URL/members/$MEMBER_ID/suspend\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{}'"
echo ""
echo -e "${RED}Expected Response (Validation Error):${NC}"
cat <<EOF
{
  "success": false,
  "errors": [
    {
      "msg": "Suspension reason is required",
      "param": "reason",
      "location": "body"
    }
  ]
}
EOF
echo ""
echo "---"
echo ""

# Test 6: Get members list with suspended filter
echo -e "${YELLOW}Test 6: Get members list filtered by suspended status${NC}"
echo "GET $API_URL/members?status=suspended"
echo ""
echo "Command:"
echo "curl -X GET \"$API_URL/members?status=suspended\" \\"
echo "  -H \"Authorization: Bearer \$WORKSPACE_OWNER_TOKEN\""
echo ""
echo -e "${GREEN}Expected Response:${NC}"
cat <<EOF
{
  "success": true,
  "members": [
    {
      "_id": "...",
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "workplaceRole": "...",
      "status": "suspended",
      "joinedAt": "...",
      "lastLoginAt": "...",
      "permissions": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
EOF
echo ""
echo "---"
echo ""

echo -e "${YELLOW}=== Test Script Complete ===${NC}"
echo ""
echo -e "${YELLOW}To run actual tests:${NC}"
echo "1. Update WORKSPACE_OWNER_TOKEN and MEMBER_ID variables in this script"
echo "2. Make the script executable: chmod +x test-suspension-endpoints.sh"
echo "3. Run the script: ./test-suspension-endpoints.sh"
echo ""
echo -e "${YELLOW}Or use the curl commands directly with your actual values${NC}"
