#!/bin/bash

# Test script for clinical intervention API
API_URL="http://localhost:5000/api"

echo "🧪 Testing Clinical Intervention API"
echo "=================================="

# Test health endpoint
echo ""
echo "1. Testing Health Endpoint..."
curl -s -X GET "$API_URL/clinical-interventions/health" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" | jq '.'

# Test create intervention
echo ""
echo "2. Testing Create Intervention..."
curl -s -X POST "$API_URL/clinical-interventions" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "category": "drug_therapy_problem",
    "priority": "medium",
    "issueDescription": "Test intervention from API test",
    "strategies": [],
    "estimatedDuration": 7
  }' | jq '.'

# Test list interventions
echo ""
echo "3. Testing List Interventions..."
curl -s -X GET "$API_URL/clinical-interventions?page=1&limit=5" \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Test: true" | jq '.'

echo ""
echo "✅ API Test Complete"