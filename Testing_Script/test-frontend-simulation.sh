#!/bin/bash

# Simulate exactly what the frontend form does
API_URL="http://localhost:5000/api"

echo "🎯 Frontend Clinical Intervention Form Simulation"
echo "================================================"

# Use existing patient ID
PATIENT_ID="68cd7e0774e838f4e850c4c6"

echo "Patient ID: $PATIENT_ID"
echo ""

# Test the exact data structure the frontend sends
echo "1. Creating intervention with frontend data structure..."
RESPONSE=$(curl -s -X POST "$API_URL/clinical-interventions" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"category\": \"drug_therapy_problem\",
    \"priority\": \"medium\",
    \"issueDescription\": \"Patient experiencing side effects from current medication. Requires medication review and possible adjustment.\",
    \"strategies\": [],
    \"estimatedDuration\": 7,
    \"relatedMTRId\": null,
    \"relatedDTPIds\": []
  }")

echo "$RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
INTERVENTION_ID=$(echo "$RESPONSE" | jq -r '.data._id // empty')

if [ "$SUCCESS" = "true" ] && [ -n "$INTERVENTION_ID" ]; then
    echo ""
    echo "✅ SUCCESS! Intervention created with ID: $INTERVENTION_ID"
    
    echo ""
    echo "2. Verifying intervention appears in list..."
    LIST_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions?page=1&limit=10" \
      -H "X-Super-Admin-Test: true")
    
    COUNT=$(echo "$LIST_RESPONSE" | jq '.data.data | length')
    echo "   Interventions in list: $COUNT"
    
    if [ "$COUNT" -gt 0 ]; then
        echo "   ✅ Intervention appears in list!"
        echo ""
        echo "3. Intervention details from list:"
        echo "$LIST_RESPONSE" | jq '.data.data[0] | {
            id: ._id,
            interventionNumber: .interventionNumber,
            category: .category,
            priority: .priority,
            status: .status,
            patientId: .patientId,
            issueDescription: .issueDescription
        }'
    else
        echo "   ❌ Intervention NOT found in list"
        echo "   List response:"
        echo "$LIST_RESPONSE" | jq '.data'
    fi
    
    echo ""
    echo "4. Testing direct retrieval by ID..."
    GET_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/$INTERVENTION_ID" \
      -H "X-Super-Admin-Test: true")
    
    GET_SUCCESS=$(echo "$GET_RESPONSE" | jq -r '.success // false')
    if [ "$GET_SUCCESS" = "true" ]; then
        echo "   ✅ Can retrieve intervention by ID"
    else
        echo "   ❌ Cannot retrieve intervention by ID"
        echo "   Error: $(echo "$GET_RESPONSE" | jq -r '.error.message // .message // "Unknown error"')"
    fi
    
else
    echo ""
    echo "❌ FAILED to create intervention"
    echo "Error: $(echo "$RESPONSE" | jq -r '.error.message // .message // "Unknown error"')"
fi

echo ""
echo "🏁 Test Complete"