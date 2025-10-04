#!/bin/bash

# Test script to verify dashboard and reports functionality
API_URL="http://localhost:5000/api"

echo "🎯 Testing Clinical Intervention Dashboard & Reports"
echo "=================================================="

echo ""
echo "1. Testing Dashboard Analytics..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/analytics/summary" -H "X-Super-Admin-Test: true")
TOTAL_INTERVENTIONS=$(echo "$DASHBOARD_RESPONSE" | jq '.data.totalInterventions')
ACTIVE_INTERVENTIONS=$(echo "$DASHBOARD_RESPONSE" | jq '.data.activeInterventions')

echo "   Dashboard Metrics:"
echo "   - Total Interventions: $TOTAL_INTERVENTIONS"
echo "   - Active Interventions: $ACTIVE_INTERVENTIONS"
echo "   - Category Distribution: $(echo "$DASHBOARD_RESPONSE" | jq '.data.categoryDistribution | length') categories"
echo "   - Priority Distribution: $(echo "$DASHBOARD_RESPONSE" | jq '.data.priorityDistribution | length') priorities"
echo "   - Recent Interventions: $(echo "$DASHBOARD_RESPONSE" | jq '.data.recentInterventions | length') items"

if [ "$TOTAL_INTERVENTIONS" -gt 0 ]; then
    echo "   ✅ Dashboard showing real data!"
else
    echo "   ❌ Dashboard showing empty data"
fi

echo ""
echo "2. Testing Outcome Reports..."
REPORTS_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/reports/outcomes" -H "X-Super-Admin-Test: true")
REPORT_TOTAL=$(echo "$REPORTS_RESPONSE" | jq '.data.summary.totalInterventions')
CATEGORY_COUNT=$(echo "$REPORTS_RESPONSE" | jq '.data.categoryAnalysis | length')
DETAILED_COUNT=$(echo "$REPORTS_RESPONSE" | jq '.data.detailedOutcomes | length')

echo "   Report Metrics:"
echo "   - Total Interventions: $REPORT_TOTAL"
echo "   - Category Analysis: $CATEGORY_COUNT categories"
echo "   - Detailed Outcomes: $DETAILED_COUNT items"

if [ "$REPORT_TOTAL" -gt 0 ]; then
    echo "   ✅ Reports showing real data!"
else
    echo "   ❌ Reports showing empty data"
fi

echo ""
echo "3. Testing Category Counts..."
CATEGORIES_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/analytics/categories" -H "X-Super-Admin-Test: true")
echo "   Category Counts: $(echo "$CATEGORIES_RESPONSE" | jq '.data')"

echo ""
echo "4. Testing Priority Distribution..."
PRIORITIES_RESPONSE=$(curl -s -X GET "$API_URL/clinical-interventions/analytics/priorities" -H "X-Super-Admin-Test: true")
echo "   Priority Distribution: $(echo "$PRIORITIES_RESPONSE" | jq '.data')"

echo ""
echo "5. Sample Category Analysis from Reports:"
echo "$REPORTS_RESPONSE" | jq '.data.categoryAnalysis[] | {category: .category, total: .total, successRate: .successRate}'

echo ""
echo "6. Sample Recent Interventions from Dashboard:"
echo "$DASHBOARD_RESPONSE" | jq '.data.recentInterventions[0:2] | .[] | {interventionNumber: .interventionNumber, category: .category, priority: .priority, patientName: .patientName}'

echo ""
echo "🏁 Test Summary:"
echo "================"

if [ "$TOTAL_INTERVENTIONS" -gt 0 ] && [ "$REPORT_TOTAL" -gt 0 ]; then
    echo "✅ SUCCESS: Both Dashboard and Reports are showing real data!"
    echo "   - Dashboard: $TOTAL_INTERVENTIONS interventions"
    echo "   - Reports: $REPORT_TOTAL interventions"
    echo "   - Data is properly flowing from database to frontend"
else
    echo "❌ ISSUE: Some endpoints are not showing real data"
    echo "   - Dashboard Total: $TOTAL_INTERVENTIONS"
    echo "   - Reports Total: $REPORT_TOTAL"
fi

echo ""
echo "🚀 Ready for frontend testing!"