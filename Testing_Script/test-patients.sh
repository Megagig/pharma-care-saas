#!/bin/bash

# Test script to check patients and create one if needed
API_URL="http://localhost:5000/api"

echo "🧪 Testing Patients API"
echo "======================"

# Test list patients
echo ""
echo "1. Listing existing patients..."
curl -s -X GET "$API_URL/patients?limit=5" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" | jq '.'

# Create a test patient
echo ""
echo "2. Creating a test patient..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/patients" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phoneNumber": "+1234567890",
    "email": "john.doe@test.com",
    "mrn": "TEST001"
  }')

echo "$PATIENT_RESPONSE" | jq '.'

# Extract patient ID for intervention test
PATIENT_ID=$(echo "$PATIENT_RESPONSE" | jq -r '.data._id // empty')

if [ -n "$PATIENT_ID" ] && [ "$PATIENT_ID" != "null" ]; then
    echo ""
    echo "3. Testing intervention creation with real patient ID: $PATIENT_ID"
    curl -s -X POST "$API_URL/clinical-interventions" \
      -H "Content-Type: application/json" \
      -H "X-Super-Admin-Test: true" \
      -d "{
        \"patientId\": \"$PATIENT_ID\",
        \"category\": \"drug_therapy_problem\",
        \"priority\": \"medium\",
        \"issueDescription\": \"Test intervention with real patient\",
        \"strategies\": [],
        \"estimatedDuration\": 7
      }" | jq '.'
else
    echo ""
    echo "❌ Failed to create patient or extract patient ID"
fi

echo ""
echo "✅ Patient Test Complete"