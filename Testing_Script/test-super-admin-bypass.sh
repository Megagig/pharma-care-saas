#!/bin/bash

# Test super_admin bypass functionality
API_URL="http://localhost:5000/api"

echo "🔐 Testing Super Admin Workplace Bypass"
echo "======================================"

echo ""
echo "1. Testing intervention listing (should see all workplaces)..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions" -H "X-Super-Admin-Test: true")
COUNT=$(echo "$LIST_RESPONSE" | jq '.data.data | length')
echo "   Interventions visible to super_admin: $COUNT"

if [ "$COUNT" -gt 0 ]; then
    echo "   ✅ Super admin can see interventions!"
    echo ""
    echo "2. Intervention details:"
    echo "$LIST_RESPONSE" | jq '.data.data[0] | {
        id: ._id,
        interventionNumber: .interventionNumber,
        category: .category,
        priority: .priority,
        status: .status,
        patientName: (.patient.firstName + " " + .patient.lastName),
        issueDescription: .issueDescriptionPreview
    }'
    
    # Get the intervention ID for further testing
    INTERVENTION_ID=$(echo "$LIST_RESPONSE" | jq -r '.data.data[0]._id')
    
    echo ""
    echo "3. Testing direct intervention retrieval by ID..."
    GET_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/$INTERVENTION_ID" -H "X-Super-Admin-Test: true")
    GET_SUCCESS=$(echo "$GET_RESPONSE" | jq -r '.success')
    
    if [ "$GET_SUCCESS" = "true" ]; then
        echo "   ✅ Can retrieve intervention by ID"
        echo "   Intervention: $(echo "$GET_RESPONSE" | jq -r '.data.interventionNumber')"
    else
        echo "   ❌ Cannot retrieve intervention by ID"
    fi
    
    echo ""
    echo "4. Testing analytics endpoints..."
    
    # Test category counts
    CATEGORIES=$(curl -s -X GET "$API_URL/clinical-interventions/analytics/categories" -H "X-Super-Admin-Test: true")
    echo "   Category counts: $(echo "$CATEGORIES" | jq '.data')"
    
    # Test priority distribution
    PRIORITIES=$(curl -s -X GET "$API_URL/clinical-interventions/analytics/priorities" -H "X-Super-Admin-Test: true")
    echo "   Priority distribution: $(echo "$PRIORITIES" | jq '.data')"
    
else
    echo "   ❌ Super admin cannot see any interventions"
fi

echo ""
echo "5. Testing intervention creation with different patient..."
# Use a different patient to avoid duplicate issues
PATIENT_ID="68c32a0df3551efb457187f7"

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/clinical-interventions" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"category\": \"medication_nonadherence\",
    \"priority\": \"high\",
    \"issueDescription\": \"Patient not taking medications as prescribed - requires counseling\",
    \"strategies\": [],
    \"estimatedDuration\": 14
  }")

CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
if [ "$CREATE_SUCCESS" = "true" ]; then
    NEW_INTERVENTION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data._id')
    echo "   ✅ Successfully created new intervention: $NEW_INTERVENTION_ID"
    
    # Verify it appears in the list
    echo ""
    echo "6. Verifying new intervention appears in list..."
    UPDATED_LIST=$(curl -s -X GET "$API_URL/clinical-interventions" -H "X-Super-Admin-Test: true")
    NEW_COUNT=$(echo "$UPDATED_LIST" | jq '.data.data | length')
    echo "   Total interventions now: $NEW_COUNT"
    
    if [ "$NEW_COUNT" -gt "$COUNT" ]; then
        echo "   ✅ New intervention appears in list!"
    else
        echo "   ❌ New intervention not found in list"
    fi
else
    echo "   ❌ Failed to create intervention"
    echo "   Error: $(echo "$CREATE_RESPONSE" | jq -r '.error.message // .message // "Unknown error"')"
fi

echo ""
echo "🏁 Super Admin Bypass Test Complete"