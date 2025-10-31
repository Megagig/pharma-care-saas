#!/bin/bash

# =============================================================================
# Patient Engagement & Follow-up Management - Production Health Check Script
# =============================================================================

set -euo pipefail

# Configuration
BACKEND_URL="http://localhost:3000"
TIMEOUT=10
VERBOSE=false
OUTPUT_FORMAT="text"
HEALTH_CHECK_LOG="/var/log/patient-engagement-health.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --help)
            cat << EOF
Patient Engagement Health Check Script

Usage: $0 [OPTIONS] [CHECK_TYPE]

OPTIONS:
    --verbose       Enable verbose output
    --json          Output results in JSON format
    --timeout N     Set timeout in seconds (default: 10)
    --url URL       Backend URL (default: http://localhost:3000)
    --help          Show this help message

CHECK_TYPES:
    quick           Basic health checks (default)
    full            Comprehensive health checks
    performance     Performance-focused checks
    security        Security-focused checks
    database        Database-specific checks
    api             API endpoint checks
    integration     Integration checks

EXAMPLES:
    $0                          # Quick health check
    $0 full --verbose           # Full health check with verbose output
    $0 performance --json       # Performance check with JSON output
    $0 database --timeout 30    # Database check with 30s timeout
EOF
            exit 0
            ;;
        *)
            CHECK_TYPE="$1"
            shift
            ;;
    esac
done

# Default check type
CHECK_TYPE="${CHECK_TYPE:-quick}"

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ $OUTPUT_FORMAT == "json" ]]; then
        return 0
    fi
    
    case $level in
        "INFO")  
            if [[ $VERBOSE == true ]]; then
                echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message"
            fi
            ;;
        "WARN")  
            echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message"
            ;;
        "ERROR") 
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message"
            ;;
        "PASS")  
            echo -e "${GREEN}[PASS]${NC}  [$timestamp] $message"
            ;;
        "FAIL")  
            echo -e "${RED}[FAIL]${NC}  [$timestamp] $message"
            ;;
    esac
    
    # Log to file
    echo "[$level] [$timestamp] $message" >> "$HEALTH_CHECK_LOG"
}

increment_counter() {
    local result=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    case $result in
        "pass")
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            ;;
        "fail")
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            ;;
        "warn")
            WARNINGS=$((WARNINGS + 1))
            ;;
    esac
}

check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=${3:-"$endpoint"}
    
    log "INFO" "Checking $description..."
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$BACKEND_URL$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        log "PASS" "$description is healthy (HTTP $response)"
        increment_counter "pass"
        return 0
    else
        log "FAIL" "$description is unhealthy (HTTP $response)"
        increment_counter "fail"
        return 1
    fi
}

check_endpoint_with_auth() {
    local endpoint=$1
    local expected_status=${2:-401}
    local description=${3:-"$endpoint (auth required)"}
    
    log "INFO" "Checking $description..."
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$BACKEND_URL$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        log "PASS" "$description is properly secured (HTTP $response)"
        increment_counter "pass"
        return 0
    else
        log "FAIL" "$description security check failed (HTTP $response)"
        increment_counter "fail"
        return 1
    fi
}

check_database_connectivity() {
    log "INFO" "Checking database connectivity..."
    
    if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "PASS" "Database is accessible"
        increment_counter "pass"
        
        # Check collections exist
        local collections=("appointments" "followuptasks" "remindertemplates" "pharmacistschedules")
        for collection in "${collections[@]}"; do
            local exists=$(mongosh PharmacyCopilot --quiet --eval "db.listCollectionNames().includes('$collection')" 2>/dev/null || echo "false")
            if [[ "$exists" == "true" ]]; then
                log "PASS" "Collection '$collection' exists"
                increment_counter "pass"
            else
                log "FAIL" "Collection '$collection' not found"
                increment_counter "fail"
            fi
        done
        
        # Check indexes
        for collection in "${collections[@]}"; do
            local index_count=$(mongosh PharmacyCopilot --quiet --eval "db.$collection.getIndexes().length" 2>/dev/null || echo "0")
            if [[ $index_count -gt 1 ]]; then
                log "PASS" "Collection '$collection' has $index_count indexes"
                increment_counter "pass"
            else
                log "WARN" "Collection '$collection' has insufficient indexes ($index_count)"
                increment_counter "warn"
            fi
        done
        
    else
        log "FAIL" "Database is not accessible"
        increment_counter "fail"
        return 1
    fi
}

check_redis_connectivity() {
    log "INFO" "Checking Redis connectivity..."
    
    if redis-cli ping > /dev/null 2>&1; then
        log "PASS" "Redis is accessible"
        increment_counter "pass"
        
        # Check Redis memory usage
        local memory_usage=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        log "INFO" "Redis memory usage: $memory_usage"
        
        # Check Redis connected clients
        local connected_clients=$(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')
        log "INFO" "Redis connected clients: $connected_clients"
        
    else
        log "FAIL" "Redis is not accessible"
        increment_counter "fail"
        return 1
    fi
}

check_feature_flags() {
    log "INFO" "Checking feature flags..."
    
    local flags=("PATIENT_ENGAGEMENT_ENABLED" "APPOINTMENT_SCHEDULING_ENABLED" "FOLLOW_UP_MANAGEMENT_ENABLED" "REMINDER_SYSTEM_ENABLED")
    
    for flag in "${flags[@]}"; do
        local flag_status=$(mongosh PharmacyCopilot --quiet --eval "db.featureflags.findOne({name: '$flag'}).enabled" 2>/dev/null || echo "null")
        local rollout=$(mongosh PharmacyCopilot --quiet --eval "db.featureflags.findOne({name: '$flag'}).rolloutPercentage" 2>/dev/null || echo "0")
        
        if [[ "$flag_status" != "null" ]]; then
            log "PASS" "Feature flag '$flag': $flag_status ($rollout%)"
            increment_counter "pass"
        else
            log "FAIL" "Feature flag '$flag' not found"
            increment_counter "fail"
        fi
    done
}

check_background_jobs() {
    log "INFO" "Checking background jobs..."
    
    # Check if PM2 processes are running
    if command -v pm2 &> /dev/null; then
        local pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name | contains("PharmacyCopilot")) | .pm2_env.status' 2>/dev/null || echo "")
        
        if [[ "$pm2_status" == "online" ]]; then
            log "PASS" "PM2 processes are running"
            increment_counter "pass"
        else
            log "FAIL" "PM2 processes are not running properly"
            increment_counter "fail"
        fi
    else
        log "WARN" "PM2 not available for process check"
        increment_counter "warn"
    fi
    
    # Check job queue health via API
    check_endpoint "/api/health/jobs" 200 "Background job queue"
}

check_performance_metrics() {
    log "INFO" "Checking performance metrics..."
    
    # Check API response time
    local start_time=$(date +%s%N)
    curl -sf "$BACKEND_URL/health" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [[ $response_time -lt 500 ]]; then
        log "PASS" "API response time: ${response_time}ms (good)"
        increment_counter "pass"
    elif [[ $response_time -lt 1000 ]]; then
        log "WARN" "API response time: ${response_time}ms (acceptable)"
        increment_counter "warn"
    else
        log "FAIL" "API response time: ${response_time}ms (too slow)"
        increment_counter "fail"
    fi
    
    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local memory_usage_int=${memory_usage%.*}
    
    if [[ $memory_usage_int -lt 80 ]]; then
        log "PASS" "Memory usage: ${memory_usage}% (good)"
        increment_counter "pass"
    elif [[ $memory_usage_int -lt 90 ]]; then
        log "WARN" "Memory usage: ${memory_usage}% (high)"
        increment_counter "warn"
    else
        log "FAIL" "Memory usage: ${memory_usage}% (critical)"
        increment_counter "fail"
    fi
    
    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local cpu_usage_int=${cpu_usage%.*}
    
    if [[ $cpu_usage_int -lt 70 ]]; then
        log "PASS" "CPU usage: ${cpu_usage}% (good)"
        increment_counter "pass"
    elif [[ $cpu_usage_int -lt 85 ]]; then
        log "WARN" "CPU usage: ${cpu_usage}% (high)"
        increment_counter "warn"
    else
        log "FAIL" "CPU usage: ${cpu_usage}% (critical)"
        increment_counter "fail"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -lt 80 ]]; then
        log "PASS" "Disk usage: ${disk_usage}% (good)"
        increment_counter "pass"
    elif [[ $disk_usage -lt 90 ]]; then
        log "WARN" "Disk usage: ${disk_usage}% (high)"
        increment_counter "warn"
    else
        log "FAIL" "Disk usage: ${disk_usage}% (critical)"
        increment_counter "fail"
    fi
}

check_security() {
    log "INFO" "Checking security configuration..."
    
    # Check that protected endpoints require authentication
    check_endpoint_with_auth "/api/appointments" 401 "Appointments API (auth required)"
    check_endpoint_with_auth "/api/follow-ups" 401 "Follow-ups API (auth required)"
    check_endpoint_with_auth "/api/reminders/templates" 401 "Reminder templates API (auth required)"
    
    # Check HTTPS redirect (if applicable)
    if curl -s -I "http://localhost:3000/health" | grep -q "Location.*https"; then
        log "PASS" "HTTPS redirect is configured"
        increment_counter "pass"
    else
        log "WARN" "HTTPS redirect not detected (may be handled by load balancer)"
        increment_counter "warn"
    fi
    
    # Check security headers
    local security_headers=$(curl -s -I "$BACKEND_URL/health" | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)" | wc -l)
    
    if [[ $security_headers -gt 0 ]]; then
        log "PASS" "Security headers present ($security_headers found)"
        increment_counter "pass"
    else
        log "WARN" "Security headers not detected"
        increment_counter "warn"
    fi
}

check_integration_points() {
    log "INFO" "Checking integration points..."
    
    # Check notification service integration
    check_endpoint "/api/health/notifications" 200 "Notification service integration"
    
    # Check MTR integration
    check_endpoint "/api/health/mtr-integration" 200 "MTR integration"
    
    # Check patient module integration
    check_endpoint "/api/health/patient-integration" 200 "Patient module integration"
    
    # Check visit module integration
    check_endpoint "/api/health/visit-integration" 200 "Visit module integration"
}

run_quick_checks() {
    log "INFO" "Running quick health checks..."
    
    # Basic health endpoints
    check_endpoint "/health" 200 "Basic health check"
    check_endpoint "/api/health" 200 "API health check"
    
    # Core module health
    check_endpoint "/api/appointments/health" 200 "Appointments module"
    check_endpoint "/api/follow-ups/health" 200 "Follow-ups module"
    check_endpoint "/api/reminders/health" 200 "Reminders module"
    
    # Database connectivity
    check_database_connectivity
    
    # Redis connectivity
    check_redis_connectivity
}

run_full_checks() {
    log "INFO" "Running comprehensive health checks..."
    
    # All quick checks
    run_quick_checks
    
    # Feature flags
    check_feature_flags
    
    # Background jobs
    check_background_jobs
    
    # Performance metrics
    check_performance_metrics
    
    # Security checks
    check_security
    
    # Integration points
    check_integration_points
}

run_performance_checks() {
    log "INFO" "Running performance-focused checks..."
    
    # Basic health
    check_endpoint "/health" 200 "Basic health check"
    
    # Performance metrics
    check_performance_metrics
    
    # Database performance
    check_database_connectivity
    
    # Cache performance
    check_redis_connectivity
}

run_security_checks() {
    log "INFO" "Running security-focused checks..."
    
    # Basic health
    check_endpoint "/health" 200 "Basic health check"
    
    # Security configuration
    check_security
    
    # Authentication checks
    check_endpoint_with_auth "/api/appointments" 401 "Appointments API security"
    check_endpoint_with_auth "/api/follow-ups" 401 "Follow-ups API security"
    check_endpoint_with_auth "/api/reminders/templates" 401 "Reminder templates API security"
}

run_database_checks() {
    log "INFO" "Running database-focused checks..."
    
    # Database connectivity and structure
    check_database_connectivity
    
    # Redis connectivity
    check_redis_connectivity
    
    # Database health via API
    check_endpoint "/api/health/database" 200 "Database health API"
}

run_api_checks() {
    log "INFO" "Running API endpoint checks..."
    
    # Public endpoints
    check_endpoint "/health" 200 "Health endpoint"
    check_endpoint "/api/health" 200 "API health endpoint"
    check_endpoint "/metrics" 200 "Metrics endpoint"
    
    # Protected endpoints (should require auth)
    check_endpoint_with_auth "/api/appointments" 401 "Appointments API"
    check_endpoint_with_auth "/api/follow-ups" 401 "Follow-ups API"
    check_endpoint_with_auth "/api/reminders/templates" 401 "Reminder templates API"
    check_endpoint_with_auth "/api/schedules/pharmacist" 401 "Pharmacist schedules API"
}

run_integration_checks() {
    log "INFO" "Running integration checks..."
    
    # Basic health
    check_endpoint "/health" 200 "Basic health check"
    
    # Integration points
    check_integration_points
    
    # Feature flags
    check_feature_flags
}

generate_json_output() {
    local status="healthy"
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        status="unhealthy"
    elif [[ $WARNINGS -gt 0 ]]; then
        status="warning"
    fi
    
    cat << EOF
{
    "status": "$status",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "check_type": "$CHECK_TYPE",
    "summary": {
        "total_checks": $TOTAL_CHECKS,
        "passed": $PASSED_CHECKS,
        "failed": $FAILED_CHECKS,
        "warnings": $WARNINGS,
        "success_rate": $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
    },
    "system_info": {
        "hostname": "$(hostname)",
        "uptime": "$(uptime -p)",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}')",
        "memory_usage": "$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%",
        "disk_usage": "$(df / | awk 'NR==2 {print $5}')"
    }
}
EOF
}

# Main execution
main() {
    # Create log directory
    mkdir -p "$(dirname "$HEALTH_CHECK_LOG")"
    
    log "INFO" "Starting Patient Engagement health check (type: $CHECK_TYPE)"
    
    case $CHECK_TYPE in
        "quick")
            run_quick_checks
            ;;
        "full")
            run_full_checks
            ;;
        "performance")
            run_performance_checks
            ;;
        "security")
            run_security_checks
            ;;
        "database")
            run_database_checks
            ;;
        "api")
            run_api_checks
            ;;
        "integration")
            run_integration_checks
            ;;
        *)
            log "ERROR" "Unknown check type: $CHECK_TYPE"
            exit 1
            ;;
    esac
    
    # Generate output
    if [[ $OUTPUT_FORMAT == "json" ]]; then
        generate_json_output
    else
        echo
        log "INFO" "Health check completed"
        log "INFO" "Total checks: $TOTAL_CHECKS"
        log "INFO" "Passed: $PASSED_CHECKS"
        log "INFO" "Failed: $FAILED_CHECKS"
        log "INFO" "Warnings: $WARNINGS"
        
        if [[ $FAILED_CHECKS -gt 0 ]]; then
            log "ERROR" "Health check FAILED - $FAILED_CHECKS critical issues found"
            exit 1
        elif [[ $WARNINGS -gt 0 ]]; then
            log "WARN" "Health check completed with $WARNINGS warnings"
            exit 0
        else
            log "PASS" "All health checks PASSED"
            exit 0
        fi
    fi
}

# Execute main function
main "$@"