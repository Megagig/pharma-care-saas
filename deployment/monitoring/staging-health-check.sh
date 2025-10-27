#!/bin/bash

# Patient Engagement Staging Health Check Script
# Version: 1.0
# Description: Comprehensive health monitoring for staging environment
# Author: System
# Date: 2025-10-27

set -euo pipefail

# Configuration
STAGING_BACKEND_PORT="${STAGING_BACKEND_PORT:-5001}"
STAGING_FRONTEND_PORT="${STAGING_FRONTEND_PORT:-5174}"
STAGING_DB_NAME="${STAGING_DB_NAME:-PharmacyCopilot-staging}"
STAGING_REDIS_DB="${STAGING_REDIS_DB:-1}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"
CHECK_TYPE="${1:-quick}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
declare -A health_results
health_results[overall]="unknown"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        return
    fi
    
    case $level in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
}

# Check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    log INFO "Checking $service_name health..."
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        health_results[$service_name]="healthy"
        log INFO "$service_name is healthy"
        return 0
    else
        health_results[$service_name]="unhealthy"
        log ERROR "$service_name is unhealthy"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log INFO "Checking MongoDB connectivity..."
    
    if command -v mongosh &> /dev/null; then
        if mongosh --host "localhost:27017" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            health_results[database]="healthy"
            log INFO "MongoDB is healthy"
            
            # Check staging database exists
            if mongosh --host "localhost:27017" --eval "use $STAGING_DB_NAME; db.stats()" --quiet > /dev/null 2>&1; then
                health_results[staging_database]="healthy"
                log INFO "Staging database exists and is accessible"
            else
                health_results[staging_database]="missing"
                log WARN "Staging database does not exist or is not accessible"
            fi
        else
            health_results[database]="unhealthy"
            health_results[staging_database]="unhealthy"
            log ERROR "MongoDB is not responding"
        fi
    else
        health_results[database]="unavailable"
        health_results[staging_database]="unavailable"
        log ERROR "MongoDB client not available"
    fi
}

# Check Redis connectivity
check_redis() {
    log INFO "Checking Redis connectivity..."
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping > /dev/null 2>&1; then
            health_results[redis]="healthy"
            log INFO "Redis is healthy"
            
            # Check staging Redis database
            if redis-cli -n "$STAGING_REDIS_DB" ping > /dev/null 2>&1; then
                health_results[staging_redis]="healthy"
                log INFO "Staging Redis database is accessible"
            else
                health_results[staging_redis]="unhealthy"
                log WARN "Staging Redis database is not accessible"
            fi
        else
            health_results[redis]="unhealthy"
            health_results[staging_redis]="unhealthy"
            log ERROR "Redis is not responding"
        fi
    else
        health_results[redis]="unavailable"
        health_results[staging_redis]="unavailable"
        log WARN "Redis client not available"
    fi
}

# Check process status
check_processes() {
    log INFO "Checking process status..."
    
    # Check PM2 processes
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "PharmacyCopilot-patient-engagement-staging"; then
            local pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="PharmacyCopilot-patient-engagement-staging") | .pm2_env.status' 2>/dev/null || echo "unknown")
            if [[ "$pm2_status" == "online" ]]; then
                health_results[backend_process]="healthy"
                log INFO "Backend process is running (PM2)"
            else
                health_results[backend_process]="unhealthy"
                log ERROR "Backend process is not running properly (PM2 status: $pm2_status)"
            fi
        else
            health_results[backend_process]="not_found"
            log WARN "Backend process not found in PM2"
        fi
    else
        # Check by PID file
        if [[ -f "/tmp/PharmacyCopilot-staging-backend.pid" ]]; then
            local pid=$(cat /tmp/PharmacyCopilot-staging-backend.pid)
            if kill -0 "$pid" 2>/dev/null; then
                health_results[backend_process]="healthy"
                log INFO "Backend process is running (PID: $pid)"
            else
                health_results[backend_process]="unhealthy"
                log ERROR "Backend process is not running (stale PID file)"
            fi
        else
            health_results[backend_process]="not_found"
            log WARN "Backend process PID file not found"
        fi
    fi
    
    # Check frontend process
    if [[ -f "/tmp/PharmacyCopilot-staging-frontend.pid" ]]; then
        local pid=$(cat /tmp/PharmacyCopilot-staging-frontend.pid)
        if kill -0 "$pid" 2>/dev/null; then
            health_results[frontend_process]="healthy"
            log INFO "Frontend process is running (PID: $pid)"
        else
            health_results[frontend_process]="unhealthy"
            log ERROR "Frontend process is not running (stale PID file)"
        fi
    else
        health_results[frontend_process]="not_found"
        log WARN "Frontend process PID file not found"
    fi
}

# Check API endpoints
check_api_endpoints() {
    log INFO "Checking API endpoints..."
    
    local api_base="http://localhost:$STAGING_BACKEND_PORT/api"
    
    # Health endpoint
    if check_service_health "health_endpoint" "http://localhost:$STAGING_BACKEND_PORT/health" 5; then
        # Get detailed health info
        local health_response=$(curl -s "http://localhost:$STAGING_BACKEND_PORT/health" 2>/dev/null || echo "{}")
        health_results[api_health]="healthy"
    else
        health_results[api_health]="unhealthy"
    fi
    
    # Metrics endpoint
    if check_service_health "metrics_endpoint" "http://localhost:$STAGING_BACKEND_PORT/metrics" 5; then
        health_results[metrics]="healthy"
    else
        health_results[metrics]="unhealthy"
    fi
    
    # API documentation
    if check_service_health "api_docs" "http://localhost:$STAGING_BACKEND_PORT/api-docs" 5; then
        health_results[api_docs]="healthy"
    else
        health_results[api_docs]="unhealthy"
    fi
}

# Check patient engagement features
check_patient_engagement_features() {
    log INFO "Checking patient engagement features..."
    
    local api_base="http://localhost:$STAGING_BACKEND_PORT/api"
    
    # Test appointments endpoint (without auth - should return 401)
    local appointments_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base/appointments" 2>/dev/null || echo "000")
    if [[ "$appointments_response" == "401" ]]; then
        health_results[appointments_endpoint]="healthy"
        log INFO "Appointments endpoint is properly secured"
    else
        health_results[appointments_endpoint]="unhealthy"
        log WARN "Appointments endpoint returned unexpected status: $appointments_response"
    fi
    
    # Test follow-ups endpoint (without auth - should return 401)
    local followups_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base/follow-ups" 2>/dev/null || echo "000")
    if [[ "$followups_response" == "401" ]]; then
        health_results[followups_endpoint]="healthy"
        log INFO "Follow-ups endpoint is properly secured"
    else
        health_results[followups_endpoint]="unhealthy"
        log WARN "Follow-ups endpoint returned unexpected status: $followups_response"
    fi
    
    # Test reminders endpoint
    local reminders_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base/reminders/templates" 2>/dev/null || echo "000")
    if [[ "$reminders_response" == "401" ]]; then
        health_results[reminders_endpoint]="healthy"
        log INFO "Reminders endpoint is properly secured"
    else
        health_results[reminders_endpoint]="unhealthy"
        log WARN "Reminders endpoint returned unexpected status: $reminders_response"
    fi
}

# Check system resources
check_system_resources() {
    log INFO "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ "$disk_usage" -lt 80 ]]; then
        health_results[disk_space]="healthy"
        log INFO "Disk space usage: ${disk_usage}% (healthy)"
    elif [[ "$disk_usage" -lt 90 ]]; then
        health_results[disk_space]="warning"
        log WARN "Disk space usage: ${disk_usage}% (warning)"
    else
        health_results[disk_space]="critical"
        log ERROR "Disk space usage: ${disk_usage}% (critical)"
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ "$memory_usage" -lt 80 ]]; then
        health_results[memory_usage]="healthy"
        log INFO "Memory usage: ${memory_usage}% (healthy)"
    elif [[ "$memory_usage" -lt 90 ]]; then
        health_results[memory_usage]="warning"
        log WARN "Memory usage: ${memory_usage}% (warning)"
    else
        health_results[memory_usage]="critical"
        log ERROR "Memory usage: ${memory_usage}% (critical)"
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local cpu_load_percent=$(echo "$cpu_load * 100 / $cpu_cores" | bc -l | cut -d. -f1)
    
    if [[ "$cpu_load_percent" -lt 70 ]]; then
        health_results[cpu_load]="healthy"
        log INFO "CPU load: ${cpu_load_percent}% (healthy)"
    elif [[ "$cpu_load_percent" -lt 90 ]]; then
        health_results[cpu_load]="warning"
        log WARN "CPU load: ${cpu_load_percent}% (warning)"
    else
        health_results[cpu_load]="critical"
        log ERROR "CPU load: ${cpu_load_percent}% (critical)"
    fi
}

# Check log files
check_log_files() {
    log INFO "Checking log files..."
    
    local log_dir="/var/log/PharmacyCopilot-staging"
    
    if [[ -d "$log_dir" ]]; then
        health_results[log_directory]="healthy"
        
        # Check for recent errors
        local error_count=0
        if [[ -f "$log_dir/error.log" ]]; then
            error_count=$(tail -n 100 "$log_dir/error.log" 2>/dev/null | grep -c "ERROR" || echo "0")
        fi
        
        if [[ "$error_count" -eq 0 ]]; then
            health_results[recent_errors]="healthy"
            log INFO "No recent errors in logs"
        elif [[ "$error_count" -lt 5 ]]; then
            health_results[recent_errors]="warning"
            log WARN "Found $error_count recent errors in logs"
        else
            health_results[recent_errors]="critical"
            log ERROR "Found $error_count recent errors in logs"
        fi
        
        # Check log file sizes
        local total_log_size=$(du -sm "$log_dir" 2>/dev/null | cut -f1 || echo "0")
        if [[ "$total_log_size" -lt 100 ]]; then
            health_results[log_size]="healthy"
            log INFO "Log directory size: ${total_log_size}MB (healthy)"
        elif [[ "$total_log_size" -lt 500 ]]; then
            health_results[log_size]="warning"
            log WARN "Log directory size: ${total_log_size}MB (warning)"
        else
            health_results[log_size]="critical"
            log ERROR "Log directory size: ${total_log_size}MB (critical)"
        fi
    else
        health_results[log_directory]="missing"
        health_results[recent_errors]="unknown"
        health_results[log_size]="unknown"
        log WARN "Log directory not found: $log_dir"
    fi
}

# Performance check
check_performance() {
    log INFO "Running performance checks..."
    
    # API response time check
    local start_time=$(date +%s%N)
    if curl -f -s "http://localhost:$STAGING_BACKEND_PORT/health" > /dev/null 2>&1; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [[ "$response_time" -lt 500 ]]; then
            health_results[api_response_time]="healthy"
            log INFO "API response time: ${response_time}ms (healthy)"
        elif [[ "$response_time" -lt 1000 ]]; then
            health_results[api_response_time]="warning"
            log WARN "API response time: ${response_time}ms (warning)"
        else
            health_results[api_response_time]="critical"
            log ERROR "API response time: ${response_time}ms (critical)"
        fi
    else
        health_results[api_response_time]="unhealthy"
        log ERROR "API not responding for performance test"
    fi
    
    # Database query performance
    if command -v mongosh &> /dev/null; then
        local db_start_time=$(date +%s%N)
        if mongosh --host "localhost:27017" --eval "use $STAGING_DB_NAME; db.stats()" --quiet > /dev/null 2>&1; then
            local db_end_time=$(date +%s%N)
            local db_response_time=$(( (db_end_time - db_start_time) / 1000000 ))
            
            if [[ "$db_response_time" -lt 100 ]]; then
                health_results[db_response_time]="healthy"
                log INFO "Database response time: ${db_response_time}ms (healthy)"
            elif [[ "$db_response_time" -lt 500 ]]; then
                health_results[db_response_time]="warning"
                log WARN "Database response time: ${db_response_time}ms (warning)"
            else
                health_results[db_response_time]="critical"
                log ERROR "Database response time: ${db_response_time}ms (critical)"
            fi
        else
            health_results[db_response_time]="unhealthy"
            log ERROR "Database not responding for performance test"
        fi
    fi
}

# Calculate overall health
calculate_overall_health() {
    local healthy_count=0
    local warning_count=0
    local critical_count=0
    local unhealthy_count=0
    local total_count=0
    
    for key in "${!health_results[@]}"; do
        if [[ "$key" == "overall" ]]; then
            continue
        fi
        
        case "${health_results[$key]}" in
            "healthy") ((healthy_count++)) ;;
            "warning") ((warning_count++)) ;;
            "critical"|"unhealthy") ((critical_count++)) ;;
            *) ((unhealthy_count++)) ;;
        esac
        ((total_count++))
    done
    
    if [[ "$critical_count" -gt 0 ]]; then
        health_results[overall]="critical"
    elif [[ "$unhealthy_count" -gt 2 ]]; then
        health_results[overall]="unhealthy"
    elif [[ "$warning_count" -gt 3 ]]; then
        health_results[overall]="warning"
    else
        health_results[overall]="healthy"
    fi
    
    log INFO "Overall health: ${health_results[overall]} ($healthy_count healthy, $warning_count warnings, $critical_count critical)"
}

# Output results
output_results() {
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        # JSON output
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"environment\": \"staging\","
        echo "  \"overall_health\": \"${health_results[overall]}\","
        echo "  \"checks\": {"
        
        local first=true
        for key in "${!health_results[@]}"; do
            if [[ "$key" == "overall" ]]; then
                continue
            fi
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                echo ","
            fi
            echo -n "    \"$key\": \"${health_results[$key]}\""
        done
        
        echo ""
        echo "  }"
        echo "}"
    else
        # Text output
        echo ""
        echo "=========================================="
        echo "Patient Engagement Staging Health Report"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "Environment: staging"
        echo "Overall Health: ${health_results[overall]}"
        echo ""
        echo "Detailed Results:"
        echo "------------------------------------------"
        
        for key in "${!health_results[@]}"; do
            if [[ "$key" == "overall" ]]; then
                continue
            fi
            
            local status="${health_results[$key]}"
            local icon=""
            case "$status" in
                "healthy") icon="✅" ;;
                "warning") icon="⚠️" ;;
                "critical"|"unhealthy") icon="❌" ;;
                *) icon="❓" ;;
            esac
            
            printf "%-25s %s %s\n" "$key" "$icon" "$status"
        done
        
        echo ""
        echo "Legend:"
        echo "✅ Healthy    ⚠️ Warning    ❌ Critical/Unhealthy    ❓ Unknown"
        echo ""
    fi
}

# Main function
main() {
    case "$CHECK_TYPE" in
        "quick")
            log INFO "Running quick health check..."
            check_service_health "backend" "http://localhost:$STAGING_BACKEND_PORT/health"
            check_service_health "frontend" "http://localhost:$STAGING_FRONTEND_PORT"
            check_database
            check_processes
            ;;
        "full")
            log INFO "Running full health check..."
            check_service_health "backend" "http://localhost:$STAGING_BACKEND_PORT/health"
            check_service_health "frontend" "http://localhost:$STAGING_FRONTEND_PORT"
            check_database
            check_redis
            check_processes
            check_api_endpoints
            check_patient_engagement_features
            check_system_resources
            check_log_files
            ;;
        "performance")
            log INFO "Running performance check..."
            check_service_health "backend" "http://localhost:$STAGING_BACKEND_PORT/health"
            check_database
            check_performance
            ;;
        *)
            log ERROR "Unknown check type: $CHECK_TYPE"
            echo "Usage: $0 [quick|full|performance]"
            exit 1
            ;;
    esac
    
    calculate_overall_health
    output_results
    
    # Exit with appropriate code
    case "${health_results[overall]}" in
        "healthy") exit 0 ;;
        "warning") exit 1 ;;
        "critical"|"unhealthy") exit 2 ;;
        *) exit 3 ;;
    esac
}

# Run main function
main