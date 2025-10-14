#!/bin/bash

# Test intervention creation with existing patient
API_URL="http://localhost:5000/api"

# Use the first patient ID from the list
PATIENT_ID="68cd7e0774e838f4e850c4c6"

echo "🧪 Testing Clinical Intervention Creation with Real Patient"
echo "=========================================================="
echo "Patient ID: $PATIENT_ID"

echo ""
echo "1. Creating intervention..."
INTERVENTION_RESPONSE=$(curl -s -X POST "$API_URL/clinical-interventions" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"category\": \"drug_therapy_problem\",
    \"priority\": \"medium\",
    \"issueDescription\": \"Patient experiencing side effects from current medication regimen. Requires review and adjustment.\",
    \"strategies\": [],
    \"estimatedDuration\": 7
  }")

echo "$INTERVENTION_RESPONSE" | jq '.'

# Extract intervention ID if successful
INTERVENTION_ID=$(echo "$INTERVENTION_RESPONSE" | jq -r '.data._id // empty')

if [ -n "$INTERVENTION_ID" ] && [ "$INTERVENTION_ID" != "null" ]; then
    echo ""
    echo "✅ SUCCESS! Intervention created with ID: $INTERVENTION_ID"
    
    echo ""
    echo "2. Verifying intervention was saved to database..."
    curl -s -X GET "$API_URL/clinical-interventions/$INTERVENTION_ID" \
      -H "Content-Type: application/json" \
      -H "X-Super-Admin-Test: true" | jq '.'
      
    echo ""
    echo "3. Listing all interventions to confirm it appears in the list..."
    curl -s -X GET "$API_URL/clinical-interventions?limit=5" \
      -H "Content-Type: application/json" \
      -H "X-Super-Admin-Test: true" | jq '.data.data | length'
      
else
    echo ""
    echo "❌ FAILED to create intervention"
    echo "Response was:"
    echo "$INTERVENTION_RESPONSE" | jq '.'
fi

echo ""
echo "✅ Test Complete"