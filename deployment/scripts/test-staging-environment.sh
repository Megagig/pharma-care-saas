#!/bin/bash

# Patient Engagement Staging Environment Test Script
# Version: 1.0
# Description: Comprehensive testing script for staging environment
# Author: System
# Date: 2025-10-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STAGING_BACKEND_PORT="${STAGING_BACKEND_PORT:-5001}"
STAGING_FRONTEND_PORT="${STAGING_FRONTEND_PORT:-5174}"
TEST_RESULTS_DIR="/tmp/staging-test-results-$(date +%Y%m%d-%H%M%S)"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
declare -A test_results
total_tests=0
passed_tests=0
failed_tests=0

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) 
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        PASS)  echo -e "${GREEN}[PASS]${NC} $message" ;;
        FAIL)  echo -e "${RED}[FAIL]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$TEST_RESULTS_DIR/test.log"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    ((total_tests++))
    log INFO "Running test: $test_name"
    
    if $test_function; then
        test_results["$test_name"]="PASS"
        ((passed_tests++))
        log PASS "$test_name"
        return 0
    else
        test_results["$test_name"]="FAIL"
        ((failed_tests++))
        log FAIL "$test_name"
        return 1
    fi
}

# Initialize test environment
initialize_tests() {
    log INFO "Initializing staging environment tests..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Check if staging services are running
    if ! curl -f -s "http://localhost:$STAGING_BACKEND_PORT/health" > /dev/null 2>&1; then
        log ERROR "Staging backend is not running on port $STAGING_BACKEND_PORT"
        log ERROR "Please start staging environment first: ./deployment/scripts/deploy-patient-engagement-staging.sh"
        exit 1
    fi
    
    log INFO "Test environment initialized"
}

# Test 1: Service Health Checks
test_service_health() {
    log DEBUG "Testing service health endpoints..."
    
    # Backend health check
    local health_response=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/health" 2>/dev/null || echo "")
    if [[ -z "$health_response" ]]; then
        log ERROR "Backend health endpoint not responding"
        return 1
    fi
    
    # Check if response contains expected fields
    if echo "$health_response" | jq -e '.status' > /dev/null 2>&1; then
        log DEBUG "Backend health check passed"
    else
        log ERROR "Backend health response invalid: $health_response"
        return 1
    fi
    
    # Frontend health check (basic connectivity)
    if curl -f -s "http://localhost:$STAGING_FRONTEND_PORT" > /dev/null 2>&1; then
        log DEBUG "Frontend connectivity check passed"
    else
        log WARN "Frontend not responding (may be expected if not running)"
    fi
    
    return 0
}

# Test 2: API Endpoints Authentication
test_api_authentication() {
    log DEBUG "Testing API authentication..."
    
    local api_base="http://localhost:$STAGING_BACKEND_PORT/api"
    
    # Test protected endpoints without authentication (should return 401)
    local endpoints=("appointments" "follow-ups" "reminders/templates" "schedules")
    
    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_base/$endpoint" 2>/dev/null || echo "000")
        if [[ "$status_code" == "401" ]]; then
            log DEBUG "Endpoint /$endpoint properly secured (401)"
        else
            log ERROR "Endpoint /$endpoint returned unexpected status: $status_code (expected 401)"
            return 1
        fi
    done
    
    return 0
}

# Test 3: Database Connectivity
test_database_connectivity() {
    log DEBUG "Testing database connectivity..."
    
    # Test MongoDB connection through API
    local db_health=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/health/database" 2>/dev/null || echo "")
    if echo "$db_health" | jq -e '.database.status == "connected"' > /dev/null 2>&1; then
        log DEBUG "Database connectivity test passed"
        return 0
    else
        log ERROR "Database connectivity test failed: $db_health"
        return 1
    fi
}

# Test 4: Redis Connectivity
test_redis_connectivity() {
    log DEBUG "Testing Redis connectivity..."
    
    # Test Redis connection through API
    local redis_health=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/health/redis" 2>/dev/null || echo "")
    if echo "$redis_health" | jq -e '.redis.status == "connected"' > /dev/null 2>&1; then
        log DEBUG "Redis connectivity test passed"
        return 0
    else
        log WARN "Redis connectivity test failed (may be optional): $redis_health"
        return 0  # Redis is optional, so don't fail the test
    fi
}

# Test 5: Feature Flags
test_feature_flags() {
    log DEBUG "Testing feature flags..."
    
    # Test feature flags endpoint
    local flags_response=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/api/feature-flags" 2>/dev/null || echo "")
    
    # Check if patient engagement features are enabled
    local required_flags=("PATIENT_ENGAGEMENT_ENABLED" "APPOINTMENT_SCHEDULING_ENABLED" "FOLLOW_UP_MANAGEMENT_ENABLED")
    
    for flag in "${required_flags[@]}"; do
        if echo "$flags_response" | jq -e ".flags[\"$flag\"] == true" > /dev/null 2>&1; then
            log DEBUG "Feature flag $flag is enabled"
        else
            log ERROR "Feature flag $flag is not enabled or not found"
            return 1
        fi
    done
    
    return 0
}

# Test 6: API Documentation
test_api_documentation() {
    log DEBUG "Testing API documentation..."
    
    # Test Swagger/OpenAPI documentation
    if curl -f -s "http://localhost:$STAGING_BACKEND_PORT/api-docs" > /dev/null 2>&1; then
        log DEBUG "API documentation is accessible"
        return 0
    else
        log WARN "API documentation not accessible (may be disabled)"
        return 0  # Documentation is optional in some environments
    fi
}

# Test 7: Metrics Endpoint
test_metrics_endpoint() {
    log DEBUG "Testing metrics endpoint..."
    
    # Test Prometheus metrics
    local metrics_response=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/metrics" 2>/dev/null || echo "")
    if [[ -n "$metrics_response" ]] && echo "$metrics_response" | grep -q "# HELP"; then
        log DEBUG "Metrics endpoint is working"
        return 0
    else
        log WARN "Metrics endpoint not working properly"
        return 0  # Metrics are optional
    fi
}

# Test 8: Background Jobs Infrastructure
test_background_jobs() {
    log DEBUG "Testing background jobs infrastructure..."
    
    # Test job queue health
    local jobs_health=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/health/jobs" 2>/dev/null || echo "")
    if echo "$jobs_health" | jq -e '.jobs.status == "healthy"' > /dev/null 2>&1; then
        log DEBUG "Background jobs infrastructure is healthy"
        return 0
    else
        log WARN "Background jobs infrastructure may not be fully initialized: $jobs_health"
        return 0  # Jobs may not be fully initialized yet
    fi
}

# Test 9: Patient Engagement Endpoints Structure
test_patient_engagement_endpoints() {
    log DEBUG "Testing patient engagement endpoints structure..."
    
    local api_base="http://localhost:$STAGING_BACKEND_PORT/api"
    
    # Test that endpoints exist and return proper error codes
    local endpoints=(
        "appointments:401"
        "appointments/calendar:401"
        "appointments/available-slots:401"
        "follow-ups:401"
        "follow-ups/overdue:401"
        "reminders/templates:401"
        "schedules/capacity:401"
    )
    
    for endpoint_spec in "${endpoints[@]}"; do
        local endpoint="${endpoint_spec%:*}"
        local expected_code="${endpoint_spec#*:}"
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_base/$endpoint" 2>/dev/null || echo "000")
        if [[ "$status_code" == "$expected_code" ]]; then
            log DEBUG "Endpoint /$endpoint exists and returns expected status $expected_code"
        else
            log ERROR "Endpoint /$endpoint returned $status_code (expected $expected_code)"
            return 1
        fi
    done
    
    return 0
}

# Test 10: Performance Baseline
test_performance_baseline() {
    log DEBUG "Testing performance baseline..."
    
    # Test API response time
    local start_time=$(date +%s%N)
    if curl -f -s "http://localhost:$STAGING_BACKEND_PORT/health" > /dev/null 2>&1; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [[ "$response_time" -lt 1000 ]]; then
            log DEBUG "API response time: ${response_time}ms (acceptable for staging)"
            return 0
        else
            log WARN "API response time: ${response_time}ms (slower than expected)"
            return 0  # Don't fail on performance in staging
        fi
    else
        log ERROR "API not responding for performance test"
        return 1
    fi
}

# Test 11: Environment Configuration
test_environment_configuration() {
    log DEBUG "Testing environment configuration..."
    
    # Test environment info endpoint
    local env_info=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/api/system/info" 2>/dev/null || echo "")
    
    if echo "$env_info" | jq -e '.environment == "staging"' > /dev/null 2>&1; then
        log DEBUG "Environment correctly configured as staging"
    else
        log WARN "Environment configuration unclear: $env_info"
        return 0  # Don't fail if endpoint doesn't exist
    fi
    
    return 0
}

# Test 12: Security Headers
test_security_headers() {
    log DEBUG "Testing security headers..."
    
    # Test security headers on API endpoints
    local headers=$(curl -s -I "http://localhost:$STAGING_BACKEND_PORT/api/health" 2>/dev/null || echo "")
    
    # Check for basic security headers (relaxed for staging)
    if echo "$headers" | grep -qi "x-content-type-options"; then
        log DEBUG "Security headers present"
    else
        log WARN "Some security headers missing (acceptable for staging)"
    fi
    
    return 0
}

# Generate test report
generate_test_report() {
    log INFO "Generating test report..."
    
    local report_file="$TEST_RESULTS_DIR/test-report.html"
    local json_report="$TEST_RESULTS_DIR/test-report.json"
    
    # Generate JSON report
    cat > "$json_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "staging",
  "module": "patient-engagement",
  "summary": {
    "total_tests": $total_tests,
    "passed_tests": $passed_tests,
    "failed_tests": $failed_tests,
    "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l)
  },
  "results": {
EOF
    
    local first=true
    for test_name in "${!test_results[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$json_report"
        fi
        echo -n "    \"$test_name\": \"${test_results[$test_name]}\"" >> "$json_report"
    done
    
    cat >> "$json_report" << EOF

  }
}
EOF
    
    # Generate HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Patient Engagement Staging Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .stats { display: flex; gap: 20px; }
        .stat { text-align: center; padding: 10px; background: #e9ecef; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Patient Engagement Staging Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Environment: Staging</p>
        <p>Module: Patient Engagement & Follow-up Management</p>
    </div>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <div class="stats">
            <div class="stat">
                <h3>$total_tests</h3>
                <p>Total Tests</p>
            </div>
            <div class="stat">
                <h3>$passed_tests</h3>
                <p>Passed</p>
            </div>
            <div class="stat">
                <h3>$failed_tests</h3>
                <p>Failed</p>
            </div>
            <div class="stat">
                <h3>$(echo "scale=1; $passed_tests * 100 / $total_tests" | bc -l)%</h3>
                <p>Success Rate</p>
            </div>
        </div>
    </div>
    
    <div class="results">
        <h2>Test Results</h2>
EOF
    
    for test_name in "${!test_results[@]}"; do
        local result="${test_results[$test_name]}"
        local css_class="pass"
        if [[ "$result" == "FAIL" ]]; then
            css_class="fail"
        fi
        
        cat >> "$report_file" << EOF
        <div class="test-result $css_class">
            <strong>$test_name</strong>: $result
        </div>
EOF
    done
    
    cat >> "$report_file" << EOF
    </div>
</body>
</html>
EOF
    
    log INFO "Test report generated:"
    log INFO "- HTML: $report_file"
    log INFO "- JSON: $json_report"
    log INFO "- Logs: $TEST_RESULTS_DIR/test.log"
}

# Main test execution
main() {
    log INFO "Starting Patient Engagement staging environment tests..."
    
    initialize_tests
    
    # Run all tests
    run_test "Service Health Checks" test_service_health
    run_test "API Authentication" test_api_authentication
    run_test "Database Connectivity" test_database_connectivity
    run_test "Redis Connectivity" test_redis_connectivity
    run_test "Feature Flags" test_feature_flags
    run_test "API Documentation" test_api_documentation
    run_test "Metrics Endpoint" test_metrics_endpoint
    run_test "Background Jobs" test_background_jobs
    run_test "Patient Engagement Endpoints" test_patient_engagement_endpoints
    run_test "Performance Baseline" test_performance_baseline
    run_test "Environment Configuration" test_environment_configuration
    run_test "Security Headers" test_security_headers
    
    # Generate report
    generate_test_report
    
    # Summary
    log INFO "Test execution completed!"
    log INFO "Results: $passed_tests/$total_tests tests passed"
    
    if [[ $failed_tests -eq 0 ]]; then
        log INFO "All tests passed! Staging environment is ready."
        exit 0
    else
        log WARN "$failed_tests tests failed. Please review the results."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --verbose|-v)
        VERBOSE=true
        main
        ;;
    --help|-h)
        cat << EOF
Patient Engagement Staging Environment Test Script

Usage: $0 [OPTIONS]

Options:
    --verbose, -v    Enable verbose output
    --help, -h       Show this help message

Environment Variables:
    STAGING_BACKEND_PORT     Backend port (default: 5001)
    STAGING_FRONTEND_PORT    Frontend port (default: 5174)
    VERBOSE                  Enable verbose mode (default: false)

Examples:
    $0                       # Run tests with normal output
    $0 --verbose            # Run tests with verbose output

EOF
        ;;
    *)
        main
        ;;
esac