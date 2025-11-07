#!/bin/bash
echo "Testing patient login cookie settings..."
echo ""

# Replace these with actual test credentials
WORKSPACE_ID="your-workspace-id-here"
EMAIL="test@example.com"
PASSWORD="testpassword"

echo "Making login request..."
RESPONSE=$(curl -i -X POST http://localhost:5000/api/patient-auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"workplaceId\":\"$WORKSPACE_ID\"}" \
  2>&1)

echo "$RESPONSE" | grep -i "set-cookie"
echo ""
echo "Check if cookies have SameSite=Lax or SameSite=Strict"
