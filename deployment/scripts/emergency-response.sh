#!/bin/bash

# Dynamic RBAC Emergency Response Script
# Version: 1.0
# Description: Emergency response procedures for RBAC system incidents
# Author: System
# Date: 2025-01-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/rbac-emergency-response.log"
INCIDENT_ID="${INCIDENT_ID:-$(date +%Y%m%d-%H%M%S)}"
RESPONSE_MODE="${1:-assess}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
        CRITICAL) echo -e "${RED}[CRITICAL]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
    
    echo "[$timestamp] [$level] [INCIDENT:$INCIDENT_ID] $message" >> "$LOG_FILE"
}

# Send alert notification
send_alert() {
    local severity=$1
    local message=$2
    
    # Send to Slack (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 RBAC Emergency Alert [$severity]\n$message\nIncident ID: $INCIDENT_ID\"}" \
            "$SLACK_WEBHOOK_URL" || log WARN "Failed to send Slack alert"
    fi
    
    # Send email (if configured)
    if command -v mail &> /dev/null && [[ -n "${EMERGENCY_EMAIL:-}" ]]; then
        echo "$message" | mail -s "RBAC Emergency Alert [$severity] - $INCIDENT_ID" "$EMERGENCY_EMAIL" || log WARN "Failed to send email alert"
    fi
    
    # Log to syslog
    logger -p user.crit "RBAC Emergency: [$severity] $message (Incident: $INCIDENT_ID)"
}

# Assess system health
assess_system() {
    log INFO "Assessing RBAC system health..."
    
    local issues=0
    
    # Check service status
    if ! curl -f -s "http://localhost:5000/health" > /dev/null 2>&1; then
        log CRITICAL "RBAC service is not responding"
        send_alert "CRITICAL" "RBAC service is down or not responding"
        ((issues++))
    else
        log INFO "RBAC service is responding"
    fi
    
    # Check database connectivity
    cd "$PROJECT_ROOT/backend"
    if ! npm run test:db-connection > /dev/null 2>&1; then
        log CRITICAL "Database connectivity issues detected"
        send_alert "CRITICAL" "RBAC database connectivity problems"
        ((issues++))
    else
        log INFO "Database connectivity is healthy"
    fi
    
    # Check cache service
    if command -v redis-cli &> /dev/null; then
        if ! redis-cli ping > /dev/null 2>&1; then
            log ERROR "Cache service (Redis) is not responding"
            send_alert "HIGH" "RBAC cache service is down"
            ((issues++))
        else
            log INFO "Cache service is healthy"
        fi
    fi
    
    # Check recent error rates
    local error_rate=$(curl -s "http://localhost:9090/api/v1/query?query=rate(rbac_errors_total[5m])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")
    if (( $(echo "$error_rate > 1" | bc -l 2>/dev/null || echo "0") )); then
        log ERROR "High error rate detected: $error_rate errors/sec"
        send_alert "HIGH" "RBAC error rate is elevated: $error_rate errors/sec"
        ((issues++))
    fi
    
    # Check permission check latency
    local latency=$(curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rbac_permission_check_duration_seconds_bucket)" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")
    if (( $(echo "$latency > 2.0" | bc -l 2>/dev/null || echo "0") )); then
        log ERROR "High permission check latency: ${latency}s"
        send_alert "HIGH" "RBAC permission checks are slow: ${latency}s"
        ((issues++))
    fi
    
    # Check for security incidents
    local security_incidents=$(curl -s "http://localhost:9090/api/v1/query?query=increase(rbac_privilege_escalation_attempts_total[1h])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")
    if (( $(echo "$security_incidents > 0" | bc -l 2>/dev/null || echo "0") )); then
        log CRITICAL "Security incidents detected: $security_incidents privilege escalation attempts"
        send_alert "CRITICAL" "RBAC security breach detected: $security_incidents privilege escalation attempts"
        ((issues++))
    fi
    
    log INFO "System assessment completed. Issues found: $issues"
    return $issues
}

# Isolate compromised accounts
isolate_accounts() {
    log INFO "Initiating account isolation procedures..."
    
    # Get list of suspicious accounts from monitoring
    local suspicious_accounts=$(curl -s "http://localhost:9090/api/v1/query?query=topk(10,sum%20by%20(user_id)%20(increase(rbac_failed_login_attempts_total[1h])))" | jq -r '.data.result[].metric.user_id' 2>/dev/null || echo "")
    
    if [[ -n "$suspicious_accounts" ]]; then
        log WARN "Suspicious accounts identified: $suspicious_accounts"
        
        # Disable accounts (this would need to be implemented in the application)
        for account in $suspicious_accounts; do
            log INFO "Isolating account: $account"
            # Call API to disable account
            curl -X POST -H "Content-Type: application/json" \
                -d "{\"action\":\"disable\",\"reason\":\"Emergency isolation - Incident $INCIDENT_ID\"}" \
                "http://localhost:5000/api/admin/users/$account/emergency-action" || log WARN "Failed to isolate account $account"
        done
        
        send_alert "HIGH" "Isolated suspicious accounts: $suspicious_accounts"
    else
        log INFO "No suspicious accounts identified"
    fi
}

# Enable emergency mode
enable_emergency_mode() {
    log INFO "Enabling RBAC emergency mode..."
    
    # Update configuration to enable emergency mode
    local backend_env="$PROJECT_ROOT/backend/.env"
    if [[ -f "$backend_env" ]]; then
        # Enable emergency mode
        if grep -q "RBAC_EMERGENCY_MODE" "$backend_env"; then
            sed -i 's/RBAC_EMERGENCY_MODE=.*/RBAC_EMERGENCY_MODE=true/' "$backend_env"
        else
            echo "RBAC_EMERGENCY_MODE=true" >> "$backend_env"
        fi
        
        # Reduce cache TTL for faster updates
        if grep -q "RBAC_CACHE_TTL" "$backend_env"; then
            sed -i 's/RBAC_CACHE_TTL=.*/RBAC_CACHE_TTL=30/' "$backend_env"
        else
            echo "RBAC_CACHE_TTL=30" >> "$backend_env"
        fi
        
        # Enable enhanced logging
        if grep -q "RBAC_ENHANCED_LOGGING" "$backend_env"; then
            sed -i 's/RBAC_ENHANCED_LOGGING=.*/RBAC_ENHANCED_LOGGING=true/' "$backend_env"
        else
            echo "RBAC_ENHANCED_LOGGING=true" >> "$backend_env"
        fi
        
        log INFO "Emergency mode configuration updated"
    fi
    
    # Restart service to apply changes
    if command -v pm2 &> /dev/null; then
        pm2 restart PharmaPilot-backend || log ERROR "Failed to restart service"
    elif command -v systemctl &> /dev/null; then
        systemctl restart PharmaPilot-backend || log ERROR "Failed to restart service"
    fi
    
    send_alert "HIGH" "RBAC emergency mode enabled"
}

# Disable emergency mode
disable_emergency_mode() {
    log INFO "Disabling RBAC emergency mode..."
    
    local backend_env="$PROJECT_ROOT/backend/.env"
    if [[ -f "$backend_env" ]]; then
        # Disable emergency mode
        sed -i 's/RBAC_EMERGENCY_MODE=.*/RBAC_EMERGENCY_MODE=false/' "$backend_env"
        
        # Restore normal cache TTL
        sed -i 's/RBAC_CACHE_TTL=.*/RBAC_CACHE_TTL=300/' "$backend_env"
        
        # Disable enhanced logging
        sed -i 's/RBAC_ENHANCED_LOGGING=.*/RBAC_ENHANCED_LOGGING=false/' "$backend_env"
        
        log INFO "Emergency mode configuration disabled"
    fi
    
    # Restart service
    if command -v pm2 &> /dev/null; then
        pm2 restart PharmaPilot-backend || log ERROR "Failed to restart service"
    elif command -v systemctl &> /dev/null; then
        systemctl restart PharmaPilot-backend || log ERROR "Failed to restart service"
    fi
    
    send_alert "INFO" "RBAC emergency mode disabled"
}

# Collect incident data
collect_incident_data() {
    log INFO "Collecting incident data..."
    
    local incident_dir="/var/log/rbac-incidents/$INCIDENT_ID"
    mkdir -p "$incident_dir"
    
    # Collect system logs
    if [[ -f "/var/log/PharmaPilot-backend.log" ]]; then
        tail -n 1000 /var/log/PharmaPilot-backend.log > "$incident_dir/backend.log"
    fi
    
    # Collect RBAC metrics
    curl -s "http://localhost:9090/api/v1/query_range?query=rbac_errors_total&start=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)&end=$(date -u +%Y-%m-%dT%H:%M:%SZ)&step=60s" > "$incident_dir/error_metrics.json" 2>/dev/null || true
    
    # Collect recent audit logs
    cd "$PROJECT_ROOT/backend"
    npm run export:audit-logs -- --since="1 hour ago" --output="$incident_dir/audit_logs.json" > /dev/null 2>&1 || log WARN "Failed to export audit logs"
    
    # Collect system status
    {
        echo "=== System Status ==="
        date
        echo ""
        echo "=== Service Status ==="
        if command -v pm2 &> /dev/null; then
            pm2 status
        elif command -v systemctl &> /dev/null; then
            systemctl status PharmaPilot-backend
        fi
        echo ""
        echo "=== Database Status ==="
        npm run test:db-connection 2>&1 || echo "Database connection failed"
        echo ""
        echo "=== Memory Usage ==="
        free -h
        echo ""
        echo "=== Disk Usage ==="
        df -h
    } > "$incident_dir/system_status.txt"
    
    log INFO "Incident data collected in: $incident_dir"
}

# Generate incident report
generate_incident_report() {
    log INFO "Generating incident report..."
    
    local incident_dir="/var/log/rbac-incidents/$INCIDENT_ID"
    local report_file="$incident_dir/incident_report.md"
    
    cat > "$report_file" << EOF
# RBAC Security Incident Report

**Incident ID:** $INCIDENT_ID  
**Date:** $(date)  
**Response Mode:** $RESPONSE_MODE  

## Summary

This report documents the RBAC security incident and emergency response actions taken.

## Timeline

$(grep "INCIDENT:$INCIDENT_ID" "$LOG_FILE" | tail -n 20)

## System Assessment

### Service Health
- RBAC Service: $(curl -f -s "http://localhost:5000/health" > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Down")
- Database: $(cd "$PROJECT_ROOT/backend" && npm run test:db-connection > /dev/null 2>&1 && echo "✅ Connected" || echo "❌ Connection Issues")
- Cache Service: $(command -v redis-cli &> /dev/null && redis-cli ping > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Down/Not Available")

### Security Metrics
- Failed Login Attempts (1h): $(curl -s "http://localhost:9090/api/v1/query?query=increase(rbac_failed_login_attempts_total[1h])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "N/A")
- Privilege Escalation Attempts (1h): $(curl -s "http://localhost:9090/api/v1/query?query=increase(rbac_privilege_escalation_attempts_total[1h])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "N/A")
- Suspicious Access Events (1h): $(curl -s "http://localhost:9090/api/v1/query?query=increase(rbac_suspicious_access_total[1h])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "N/A")

### Performance Metrics
- Error Rate (5m): $(curl -s "http://localhost:9090/api/v1/query?query=rate(rbac_errors_total[5m])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "N/A") errors/sec
- Permission Check Latency (95th): $(curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rbac_permission_check_duration_seconds_bucket)" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "N/A")s

## Actions Taken

- System assessment completed
- Incident data collected
- Emergency response procedures executed

## Recommendations

1. Review security logs for the incident period
2. Analyze failed authentication patterns
3. Verify all user permissions are appropriate
4. Consider additional security measures if needed
5. Update incident response procedures based on lessons learned

## Files

- System Status: system_status.txt
- Backend Logs: backend.log
- Error Metrics: error_metrics.json
- Audit Logs: audit_logs.json

---
*Report generated automatically by RBAC Emergency Response System*
EOF

    log INFO "Incident report generated: $report_file"
}

# Main emergency response function
main() {
    log INFO "RBAC Emergency Response initiated - Mode: $RESPONSE_MODE"
    log INFO "Incident ID: $INCIDENT_ID"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    case "$RESPONSE_MODE" in
        "assess")
            assess_system
            collect_incident_data
            generate_incident_report
            ;;
        "isolate")
            assess_system
            isolate_accounts
            collect_incident_data
            generate_incident_report
            ;;
        "emergency")
            assess_system
            isolate_accounts
            enable_emergency_mode
            collect_incident_data
            generate_incident_report
            ;;
        "recover")
            disable_emergency_mode
            assess_system
            generate_incident_report
            ;;
        *)
            log ERROR "Unknown response mode: $RESPONSE_MODE"
            echo "Usage: $0 [assess|isolate|emergency|recover]"
            exit 1
            ;;
    esac
    
    log INFO "Emergency response completed"
    
    # Display summary
    cat << EOF

${GREEN}🚨 RBAC Emergency Response Summary${NC}

📋 Incident Details:
- Incident ID: $INCIDENT_ID
- Response Mode: $RESPONSE_MODE
- Timestamp: $(date)

📁 Data Location:
- Logs: $LOG_FILE
- Incident Data: /var/log/rbac-incidents/$INCIDENT_ID/

🔧 Next Steps:
1. Review incident report
2. Analyze collected data
3. Implement corrective actions
4. Update security procedures

EOF
}

# Handle command line arguments
case "${1:-assess}" in
    "assess"|"isolate"|"emergency"|"recover")
        main
        ;;
    "--help"|"-h")
        cat << EOF
RBAC Emergency Response Script

Usage: $0 [MODE]

Modes:
    assess     - Assess system health and collect data (default)
    isolate    - Assess + isolate suspicious accounts
    emergency  - Assess + isolate + enable emergency mode
    recover    - Disable emergency mode and assess

Environment Variables:
    INCIDENT_ID        - Custom incident ID (default: timestamp)
    SLACK_WEBHOOK_URL  - Slack webhook for alerts
    EMERGENCY_EMAIL    - Email address for emergency alerts

Examples:
    $0 assess                    # Basic health assessment
    $0 isolate                   # Isolate suspicious accounts
    $0 emergency                 # Full emergency response
    $0 recover                   # Recovery mode
    INCIDENT_ID=SEC001 $0 assess # Custom incident ID

EOF
        ;;
    *)
        log ERROR "Unknown command: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac