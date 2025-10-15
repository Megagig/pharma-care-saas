#!/bin/bash

# Test script for participant search API
# This script tests if the participant search endpoint is working

echo "=========================================="
echo "Testing Participant Search API"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is running"
else
    echo "✗ Backend is not running on port 5000"
    echo "  Please start the backend first"
    exit 1
fi

echo ""
echo "2. Testing participant search endpoint..."
echo "   (This will fail with 401 if not authenticated)"
echo ""

# Test without authentication (should get 401)
echo "Test 1: Without authentication (should get 401)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:5000/api/communication/participants/search?limit=10

echo ""
echo ""
echo "=========================================="
echo "To test with authentication:"
echo "=========================================="
echo ""
echo "1. Log in to the application in your browser"
echo "2. Open browser console (F12)"
echo "3. Run: localStorage.getItem('token')"
echo "4. Copy the token"
echo "5. Run this command with your token:"
echo ""
echo "curl -H \"Authorization: Bearer YOUR_TOKEN_HERE\" \\"
echo "  http://localhost:5000/api/communication/participants/search?limit=10"
echo ""
echo "Expected response:"
echo "{"
echo "  \"success\": true,"
echo "  \"message\": \"Participants retrieved successfully\","
echo "  \"data\": [...],"
echo "  \"count\": ..."
echo "}"
echo ""
