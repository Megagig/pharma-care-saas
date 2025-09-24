#!/bin/bash

# Dynamic RBAC Health Check Script
# Version: 1.0
# Description: Comprehensive health check for RBAC system
# Author: System
# Date: 2025-01-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/rbac-health-check.log"
HEALTH_CHECK_MODE="${1:-full}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
declare -A health_results
declare -A performance_metrics
declare -A security_metrics

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
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Query Prometheus metrics
query_prometheus() {
    local query=$1
    local result
    
    result=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$query" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")
    echo "$result"
}

# Check service availability
check_service_availability() {
    log INFO "Checking service availability..."
    
    # Check main API health endpoint
    if curl -f -s "$API_BASE_URL/health" > /dev/null 2>&1; then
        health_results["api_health"]="✅ HEALTHY"
        log INFO "API health endpoint: HEALTHY"
    else
        health_results["api_health"]="❌ UNHEALTHY"
        log ERROR "API health endpoint: UNHEALTHY"
    fi
    
    # Check RBAC-specific endpoints
    if curl -f -s "$API_BASE_URL/api/rbac/health" > /dev/null 2>&1; then
        health_results["rbac_health"]="✅ HEALTHY"
        log INFO "RBAC health endpoint: HEALTHY"
    else
        health_results["rbac_health"]="❌ UNHEALTHY"
        log ERROR "RBAC health endpoint: UNHEALTHY"
    fi
    
    # Check database connectivity
    cd "$PROJECT_ROOT/backend"
    if npm run test:db-connection > /dev/null 2>&1; then
        health_results["database"]="✅ CONNECTED"
        log INFO "Database connectivity: CONNECTED"
    else
        health_results["database"]="❌ DISCONNECTED"
        log ERROR "Database connectivity: DISCONNECTED"
    fi
    
    # Check cache service
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping > /dev/null 2>&1; then
            health_results["cache"]="✅ AVAILABLE"
            log INFO "Cache service: AVAILABLE"
        else
            health_results["cache"]="❌ UNAVAILABLE"
            log ERROR "Cache service: UNAVAILABLE"
        fi
    else
        health_results["cache"]="⚠️ NOT_CONFIGURED"
        log WARN "Cache service: NOT_CONFIGURED"
    fi
    
    # Check Prometheus metrics endpoint
    if curl -f -s "$API_BASE_URL/metrics" > /dev/null 2>&1; then
        health_results["metrics"]="✅ AVAILABLE"
        log INFO "Metrics endpoint: AVAILABLE"
    else
        health_results["metrics"]="❌ UNAVAILABLE"
        log ERROR "Metrics endpoint: UNAVAILABLE"
    fi
}

# Check performance metrics
check_performance_metrics() {
    log INFO "Checking performance metrics..."
    
    # Permission check latency
    local latency_avg=$(query_prometheus "avg(rbac_permission_check_duration_seconds)")
    local latency_95th=$(query_prometheus "histogram_quantile(0.95, rbac_permission_check_duration_seconds_bucket)")
    local latency_99th=$(query_prometheus "histogram_quantile(0.99, rbac_permission_check_duration_seconds_bucket)")
    
    performance_metrics["latency_avg"]="$latency_avg"
    performance_metrics["latency_95th"]="$latency_95th"
    performance_metrics["latency_99th"]="$latency_99th"
    
    # Evaluate latency health
    if (( $(echo "$latency_95th > 2.0" | bc -l 2>/dev/null || echo "0") )); then
        health_results["latency"]="❌ HIGH (${latency_95th}s)"
        log ERROR "Permission check latency is high: ${latency_95th}s"
    elif (( $(echo "$latency_95th > 0.5" | bc -l 2>/dev/null || echo "0") )); then
        health_results["latency"]="⚠️ ELEVATED (${latency_95th}s)"
        log WARN "Permission check latency is elevated: ${latency_95th}s"
    else
        health_results["latency"]="✅ GOOD (${latency_95th}s)"
        log INFO "Permission check latency is good: ${latency_95th}s"
    fi
    
    # Cache hit rate
    local cache_hits=$(query_prometheus "rate(rbac_cache_hits_total[5m])")
    local cache_misses=$(query_prometheus "rate(rbac_cache_misses_total[5m])")
    local cache_hit_rate
    
    if (( $(echo "$cache_hits + $cache_misses > 0" | bc -l 2>/dev/null || echo "0") )); then
        cache_hit_rate=$(echo "scale=2; $cache_hits / ($cache_hits + $cache_misses) * 100" | bc -l 2>/dev/null || echo "0")
        performance_metrics["cache_hit_rate"]="$cache_hit_rate"
        
        if (( $(echo "$cache_hit_rate < 70" | bc -l 2>/dev/null || echo "0") )); then
            health_results["cache_performance"]="❌ LOW (${cache_hit_rate}%)"
            log ERROR "Cache hit rate is low: ${cache_hit_rate}%"
        elif (( $(echo "$cache_hit_rate < 90" | bc -l 2>/dev/null || echo "0") )); then
            health_results["cache_performance"]="⚠️ MODERATE (${cache_hit_rate}%)"
            log WARN "Cache hit rate is moderate: ${cache_hit_rate}%"
        else
            health_results["cache_performance"]="✅ GOOD (${cache_hit_rate}%)"
            log INFO "Cache hit rate is good: ${cache_hit_rate}%"
        fi
    else
        health_results["cache_performance"]="⚠️ NO_DATA"
        performance_metrics["cache_hit_rate"]="0"
        log WARN "No cache performance data available"
    fi
    
    # Error rate
    local error_rate=$(query_prometheus "rate(rbac_errors_total[5m])")
    performance_metrics["error_rate"]="$error_rate"
    
    if (( $(echo "$error_rate > 1" | bc -l 2>/dev/null || echo "0") )); then
        health_results["error_rate"]="❌ HIGH (${error_rate}/sec)"
        log ERROR "Error rate is high: ${error_rate}/sec"
    elif (( $(echo "$error_rate > 0.1" | bc -l 2>/dev/null || echo "0") )); then
        health_results["error_rate"]="⚠️ ELEVATED (${error_rate}/sec)"
        log WARN "Error rate is elevated: ${error_rate}/sec"
    else
        health_results["error_rate"]="✅ LOW (${error_rate}/sec)"
        log INFO "Error rate is low: ${error_rate}/sec"
    fi
    
    # Throughput
    local throughput=$(query_prometheus "rate(rbac_permission_checks_total[5m])")
    performance_metrics["throughput"]="$throughput"
    
    if (( $(echo "$throughput > 100" | bc -l 2>/dev/null || echo "0") )); then
        health_results["throughput"]="✅ HIGH (${throughput}/sec)"
    elif (( $(echo "$throughput > 10" | bc -l 2>/dev/null || echo "0") )); then
        health_results["throughput"]="✅ NORMAL (${throughput}/sec)"
    else
        health_results["throughput"]="⚠️ LOW (${throughput}/sec)"
    fi
    
    # Memory usage
    local memory_usage=$(query_prometheus "rbac_memory_usage_bytes")
    local memory_usage_mb=$(echo "scale=2; $memory_usage / 1024 / 1024" | bc -l 2>/dev/null || echo "0")
    performance_metrics["memory_usage_mb"]="$memory_usage_mb"
    
    if (( $(echo "$memory_usage > 2147483648" | bc -l 2>/dev/null || echo "0") )); then # 2GB
        health_results["memory"]="❌ HIGH (${memory_usage_mb}MB)"
        log ERROR "Memory usage is high: ${memory_usage_mb}MB"
    elif (( $(echo "$memory_usage > 1073741824" | bc -l 2>/dev/null || echo "0") )); then # 1GB
        health_results["memory"]="⚠️ ELEVATED (${memory_usage_mb}MB)"
        log WARN "Memory usage is elevated: ${memory_usage_mb}MB"
    else
        health_results["memory"]="✅ NORMAL (${memory_usage_mb}MB)"
        log INFO "Memory usage is normal: ${memory_usage_mb}MB"
    fi
}

# Check security metrics
check_security_metrics() {
    log INFO "Checking security metrics..."
    
    # Failed login attempts
    local failed_logins=$(query_prometheus "increase(rbac_failed_login_attempts_total[1h])")
    security_metrics["failed_logins_1h"]="$failed_logins"
    
    if (( $(echo "$failed_logins > 50" | bc -l 2>/dev/null || echo "0") )); then
        health_results["failed_logins"]="❌ HIGH ($failed_logins in 1h)"
        log ERROR "High number of failed login attempts: $failed_logins in 1h"
    elif (( $(echo "$failed_logins > 10" | bc -l 2>/dev/null || echo "0") )); then
        health_results["failed_logins"]="⚠️ ELEVATED ($failed_logins in 1h)"
        log WARN "Elevated failed login attempts: $failed_logins in 1h"
    else
        health_results["failed_logins"]="✅ NORMAL ($failed_logins in 1h)"
        log INFO "Normal failed login attempts: $failed_logins in 1h"
    fi
    
    # Privilege escalation attempts
    local escalation_attempts=$(query_prometheus "increase(rbac_privilege_escalation_attempts_total[24h])")
    security_metrics["escalation_attempts_24h"]="$escalation_attempts"
    
    if (( $(echo "$escalation_attempts > 0" | bc -l 2>/dev/null || echo "0") )); then
        health_results["privilege_escalation"]="❌ DETECTED ($escalation_attempts in 24h)"
        log ERROR "Privilege escalation attempts detected: $escalation_attempts in 24h"
    else
        health_results["privilege_escalation"]="✅ NONE"
        log INFO "No privilege escalation attempts detected"
    fi
    
    # Suspicious access patterns
    local suspicious_access=$(query_prometheus "increase(rbac_suspicious_access_total[24h])")
    security_metrics["suspicious_access_24h"]="$suspicious_access"
    
    if (( $(echo "$suspicious_access > 10" | bc -l 2>/dev/null || echo "0") )); then
        health_results["suspicious_access"]="❌ HIGH ($suspicious_access in 24h)"
        log ERROR "High suspicious access activity: $suspicious_access in 24h"
    elif (( $(echo "$suspicious_access > 5" | bc -l 2>/dev/null || echo "0") )); then
        health_results["suspicious_access"]="⚠️ ELEVATED ($suspicious_access in 24h)"
        log WARN "Elevated suspicious access activity: $suspicious_access in 24h"
    else
        health_results["suspicious_access"]="✅ LOW ($suspicious_access in 24h)"
        log INFO "Low suspicious access activity: $suspicious_access in 24h"
    fi
    
    # Permission denial rate
    local total_checks=$(query_prometheus "rate(rbac_permission_checks_total[10m])")
    local denied_checks=$(query_prometheus "rate(rbac_permission_checks_total{result=\"denied\"}[10m])")
    local denial_rate
    
    if (( $(echo "$total_checks > 0" | bc -l 2>/dev/null || echo "0") )); then
        denial_rate=$(echo "scale=2; $denied_checks / $total_checks * 100" | bc -l 2>/dev/null || echo "0")
        security_metrics["denial_rate"]="$denial_rate"
        
        if (( $(echo "$denial_rate > 30" | bc -l 2>/dev/null || echo "0") )); then
            health_results["denial_rate"]="❌ HIGH (${denial_rate}%)"
            log ERROR "High permission denial rate: ${denial_rate}%"
        elif (( $(echo "$denial_rate > 15" | bc -l 2>/dev/null || echo "0") )); then
            health_results["denial_rate"]="⚠️ ELEVATED (${denial_rate}%)"
            log WARN "Elevated permission denial rate: ${denial_rate}%"
        else
            health_results["denial_rate"]="✅ NORMAL (${denial_rate}%)"
            log INFO "Normal permission denial rate: ${denial_rate}%"
        fi
    else
        health_results["denial_rate"]="⚠️ NO_DATA"
        security_metrics["denial_rate"]="0"
        log WARN "No permission check data available"
    fi
}

# Check system resources
check_system_resources() {
    log INFO "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' 2>/dev/null || echo "0")
    if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        health_results["cpu"]="❌ HIGH (${cpu_usage}%)"
        log ERROR "CPU usage is high: ${cpu_usage}%"
    elif (( $(echo "$cpu_usage > 60" | bc -l 2>/dev/null || echo "0") )); then
        health_results["cpu"]="⚠️ ELEVATED (${cpu_usage}%)"
        log WARN "CPU usage is elevated: ${cpu_usage}%"
    else
        health_results["cpu"]="✅ NORMAL (${cpu_usage}%)"
        log INFO "CPU usage is normal: ${cpu_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//' 2>/dev/null || echo "0")
    if (( disk_usage > 90 )); then
        health_results["disk"]="❌ HIGH (${disk_usage}%)"
        log ERROR "Disk usage is high: ${disk_usage}%"
    elif (( disk_usage > 80 )); then
        health_results["disk"]="⚠️ ELEVATED (${disk_usage}%)"
        log WARN "Disk usage is elevated: ${disk_usage}%"
    else
        health_results["disk"]="✅ NORMAL (${disk_usage}%)"
        log INFO "Disk usage is normal: ${disk_usage}%"
    fi
    
    # Memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}' 2>/dev/null || echo "0")
    if (( $(echo "$mem_usage > 90" | bc -l 2>/dev/null || echo "0") )); then
        health_results["system_memory"]="❌ HIGH (${mem_usage}%)"
        log ERROR "System memory usage is high: ${mem_usage}%"
    elif (( $(echo "$mem_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        health_results["system_memory"]="⚠️ ELEVATED (${mem_usage}%)"
        log WARN "System memory usage is elevated: ${mem_usage}%"
    else
        health_results["system_memory"]="✅ NORMAL (${mem_usage}%)"
        log INFO "System memory usage is normal: ${mem_usage}%"
    fi
}

# Generate health report
generate_health_report() {
    local overall_status="✅ HEALTHY"
    local critical_issues=0
    local warnings=0
    
    # Count issues
    for status in "${health_results[@]}"; do
        if [[ $status == *"❌"* ]]; then
            ((critical_issues++))
            overall_status="❌ UNHEALTHY"
        elif [[ $status == *"⚠️"* ]]; then
            ((warnings++))
            if [[ $overall_status == "✅ HEALTHY" ]]; then
                overall_status="⚠️ WARNING"
            fi
        fi
    done
    
    if [[ $OUTPUT_FORMAT == "json" ]]; then
        # JSON output
        cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "overall_status": "$overall_status",
    "critical_issues": $critical_issues,
    "warnings": $warnings,
    "health_checks": {
EOF
        local first=true
        for key in "${!health_results[@]}"; do
            if [[ $first == true ]]; then
                first=false
            else
                echo ","
            fi
            echo -n "        \"$key\": \"${health_results[$key]}\""
        done
        echo ""
        echo "    },"
        echo "    \"performance_metrics\": {"
        first=true
        for key in "${!performance_metrics[@]}"; do
            if [[ $first == true ]]; then
                first=false
            else
                echo ","
            fi
            echo -n "        \"$key\": \"${performance_metrics[$key]}\""
        done
        echo ""
        echo "    },"
        echo "    \"security_metrics\": {"
        first=true
        for key in "${!security_metrics[@]}"; do
            if [[ $first == true ]]; then
                first=false
            else
                echo ","
            fi
            echo -n "        \"$key\": \"${security_metrics[$key]}\""
        done
        echo ""
        echo "    }"
        echo "}"
    else
        # Text output
        cat << EOF

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}
${BLUE}                        RBAC SYSTEM HEALTH CHECK REPORT                        ${NC}
${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}

📊 Overall Status: $overall_status
🔴 Critical Issues: $critical_issues
⚠️  Warnings: $warnings
📅 Timestamp: $(date)

${YELLOW}SERVICE AVAILABILITY${NC}
────────────────────────────────────────────────────────────────────────────────
API Health:           ${health_results["api_health"]}
RBAC Health:          ${health_results["rbac_health"]}
Database:             ${health_results["database"]}
Cache Service:        ${health_results["cache"]}
Metrics Endpoint:     ${health_results["metrics"]}

${YELLOW}PERFORMANCE METRICS${NC}
────────────────────────────────────────────────────────────────────────────────
Latency:              ${health_results["latency"]}
Cache Performance:    ${health_results["cache_performance"]}
Error Rate:           ${health_results["error_rate"]}
Throughput:           ${health_results["throughput"]}
Memory Usage:         ${health_results["memory"]}

${YELLOW}SECURITY METRICS${NC}
────────────────────────────────────────────────────────────────────────────────
Failed Logins:        ${health_results["failed_logins"]}
Privilege Escalation: ${health_results["privilege_escalation"]}
Suspicious Access:    ${health_results["suspicious_access"]}
Permission Denials:   ${health_results["denial_rate"]}

${YELLOW}SYSTEM RESOURCES${NC}
────────────────────────────────────────────────────────────────────────────────
CPU Usage:            ${health_results["cpu"]}
Disk Usage:           ${health_results["disk"]}
System Memory:        ${health_results["system_memory"]}

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}

EOF
        
        if [[ $critical_issues -gt 0 ]]; then
            echo -e "${RED}⚠️  CRITICAL ISSUES DETECTED - IMMEDIATE ATTENTION REQUIRED${NC}"
        elif [[ $warnings -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  WARNINGS DETECTED - MONITORING RECOMMENDED${NC}"
        else
            echo -e "${GREEN}✅ ALL SYSTEMS HEALTHY${NC}"
        fi
        
        echo ""
        echo "📁 Detailed logs: $LOG_FILE"
        echo "🔧 For emergency response: $SCRIPT_DIR/../scripts/emergency-response.sh"
        echo ""
    fi
}

# Main health check function
main() {
    log INFO "Starting RBAC health check - Mode: $HEALTH_CHECK_MODE"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    case "$HEALTH_CHECK_MODE" in
        "quick")
            check_service_availability
            ;;
        "performance")
            check_service_availability
            check_performance_metrics
            ;;
        "security")
            check_service_availability
            check_security_metrics
            ;;
        "full"|*)
            check_service_availability
            check_performance_metrics
            check_security_metrics
            check_system_resources
            ;;
    esac
    
    generate_health_report
    
    # Exit with appropriate code
    local exit_code=0
    for status in "${health_results[@]}"; do
        if [[ $status == *"❌"* ]]; then
            exit_code=2
            break
        elif [[ $status == *"⚠️"* ]] && [[ $exit_code -eq 0 ]]; then
            exit_code=1
        fi
    done
    
    exit $exit_code
}

# Handle command line arguments
case "${1:-full}" in
    "quick"|"performance"|"security"|"full")
        main
        ;;
    "--help"|"-h")
        cat << EOF
RBAC Health Check Script

Usage: $0 [MODE]

Modes:
    quick       - Basic service availability check
    performance - Service + performance metrics
    security    - Service + security metrics  
    full        - Complete health check (default)

Environment Variables:
    OUTPUT_FORMAT     - Output format: text (default) or json
    PROMETHEUS_URL    - Prometheus server URL (default: http://localhost:9090)
    API_BASE_URL      - API base URL (default: http://localhost:5000)

Exit Codes:
    0 - All checks passed
    1 - Warnings detected
    2 - Critical issues detected

Examples:
    $0 quick                           # Quick check
    $0 full                           # Full health check
    OUTPUT_FORMAT=json $0 performance # Performance check with JSON output

EOF
        ;;
    *)
        log ERROR "Unknown mode: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac