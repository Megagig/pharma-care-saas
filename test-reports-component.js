#!/usr/bin/env node

/**
 * Test script to verify the Clinical Intervention Reports component loads without errors
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testReportsAPI() {
    console.log('🧪 Testing Clinical Intervention Reports API\n');
    
    try {
        // Test the outcome report endpoint
        console.log('📊 Testing outcome report generation...');
        
        const response = await fetch(`${API_BASE_URL}/clinical-interventions/reports/outcomes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Super-Admin-Test': 'true'
            }
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response Structure:');
            console.log(`   - Success: ${data.success}`);
            console.log(`   - Message: ${data.message}`);
            
            if (data.data) {
                console.log('📈 Report Data Structure:');
                console.log(`   - Summary: ${data.data.summary ? 'Present' : 'Missing'}`);
                console.log(`   - Category Analysis: ${Array.isArray(data.data.categoryAnalysis) ? data.data.categoryAnalysis.length + ' items' : 'Missing'}`);
                console.log(`   - Trend Analysis: ${Array.isArray(data.data.trendAnalysis) ? data.data.trendAnalysis.length + ' items' : 'Missing'}`);
                console.log(`   - Comparative Analysis: ${data.data.comparativeAnalysis ? 'Present' : 'Missing'}`);
                console.log(`   - Detailed Outcomes: ${Array.isArray(data.data.detailedOutcomes) ? data.data.detailedOutcomes.length + ' items' : 'Missing'}`);
                
                // Test data structure for potential issues
                if (data.data.categoryAnalysis && Array.isArray(data.data.categoryAnalysis)) {
                    console.log('\n🔍 Category Analysis Sample:');
                    data.data.categoryAnalysis.slice(0, 2).forEach((item, index) => {
                        console.log(`   Item ${index + 1}:`, {
                            category: item.category,
                            total: item.total,
                            successRate: item.successRate,
                            hasRequiredFields: !!(item.category && typeof item.total === 'number')
                        });
                    });
                }
                
                console.log('\n✅ SUCCESS: Reports API is working correctly!');
            } else {
                console.log('⚠️  WARNING: No data returned, but API is responding');
            }
        } else {
            console.log('❌ FAILED: API returned error status');
            const errorData = await response.json().catch(() => ({}));
            console.log('   Error:', errorData.message || 'Unknown error');
        }
        
    } catch (error) {
        console.log('💥 NETWORK ERROR:');
        console.log(`   ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
}

// Test data structure validation
function validateReportDataStructure(data) {
    const issues = [];
    
    if (!data) {
        issues.push('Data is null or undefined');
        return issues;
    }
    
    // Check summary
    if (!data.summary) {
        issues.push('Missing summary object');
    } else {
        const requiredSummaryFields = ['totalInterventions', 'successRate', 'totalCostSavings'];
        requiredSummaryFields.forEach(field => {
            if (typeof data.summary[field] !== 'number') {
                issues.push(`Summary.${field} is not a number`);
            }
        });
    }
    
    // Check arrays
    const arrayFields = ['categoryAnalysis', 'trendAnalysis', 'detailedOutcomes'];
    arrayFields.forEach(field => {
        if (!Array.isArray(data[field])) {
            issues.push(`${field} is not an array`);
        }
    });
    
    // Check category analysis structure
    if (Array.isArray(data.categoryAnalysis)) {
        data.categoryAnalysis.forEach((item, index) => {
            if (!item.category || typeof item.category !== 'string') {
                issues.push(`categoryAnalysis[${index}].category is missing or not a string`);
            }
            if (typeof item.total !== 'number') {
                issues.push(`categoryAnalysis[${index}].total is not a number`);
            }
        });
    }
    
    return issues;
}

// Main execution
async function main() {
    console.log('🎯 Clinical Intervention Reports - Component Test\n');
    
    await testReportsAPI();
    
    console.log('\n🏁 Test complete!');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testReportsAPI, validateReportDataStructure };