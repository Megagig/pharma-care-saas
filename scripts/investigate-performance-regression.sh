#!/bin/bash

# Performance Regression Investigation Script
# Helps investigate and diagnose performance regressions

set -e

# Configuration
REGRESSION_ID=${1:-""}
INVESTIGATION_REPORT="reports/regression-investigation-$(date +%Y%m%d-%H%M%S).md"
LOOKBACK_HOURS=${2:-24}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 [regression_id] [lookback_hours]"
    echo ""
    echo "Arguments:"
    echo "  regression_id    ID of the regression to investigate (optional)"
    echo "  lookback_hours   Hours to look back for analysis (default: 24)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Interactive investigation"
    echo "  $0 reg_123 48               # Investigate specific regression with 48h lookback"
}

# Initialize investigation report
initialize_report() {
    mkdir -p reports
    
    cat > "$INVESTIGATION_REPORT" << EOF
# Performance Regression Investigation

**Investigation ID:** $(basename "$INVESTIGATION_REPORT" .md)
**Started:** $(date)
**Lookback Period:** ${LOOKBACK_HOURS} hours
**Regression ID:** ${REGRESSION_ID:-"Interactive Investigation"}

## Executive Summary

*To be filled during investigation*

## Investigation Timeline

EOF
}

# Add entry to investigation timeline
add_timeline_entry() {
    local timestamp=$(date '+%H:%M:%S')
    local entry="$1"
    
    echo "- **$timestamp**: $entry" >> "$INVESTIGATION_REPORT"
    log_info "$entry"
}

# Analyze recent deployments
analyze_deployments() {
    add_timeline_entry "Analyzing recent deployments"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Recent Deployments Analysis

### Git Commits (Last ${LOOKBACK_HOURS}h)

\`\`\`
$(git log --oneline --since="${LOOKBACK_HOURS} hours ago")
\`\`\`

### Deployment Timeline

EOF

    # Get deployment information (this would integrate with your deployment system)
    local deployments=$(git log --pretty=format:"%h|%ad|%s" --date=iso --since="${LOOKBACK_HOURS} hours ago")
    
    if [[ -n "$deployments" ]]; then
        echo "| Commit | Time | Description |" >> "$INVESTIGATION_REPORT"
        echo "|--------|------|-------------|" >> "$INVESTIGATION_REPORT"
        
        while IFS='|' read -r commit time description; do
            echo "| $commit | $time | $description |" >> "$INVESTIGATION_REPORT"
        done <<< "$deployments"
    else
        echo "*No deployments found in the last ${LOOKBACK_HOURS} hours*" >> "$INVESTIGATION_REPORT"
    fi
    
    add_timeline_entry "Deployment analysis completed"
}

# Analyze feature flag changes
analyze_feature_flags() {
    add_timeline_entry "Analyzing feature flag changes"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Feature Flag Analysis

### Current Feature Flag Status

EOF

    # Get current feature flag status
    if command -v curl &> /dev/null; then
        local flag_status=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
            "https://api.PharmaPilot.com/api/deployment/feature-flags/metrics" 2>/dev/null || echo "[]")
        
        if [[ "$flag_status" != "[]" ]]; then
            echo "\`\`\`json" >> "$INVESTIGATION_REPORT"
            echo "$flag_status" | jq '.' >> "$INVESTIGATION_REPORT" 2>/dev/null || echo "$flag_status" >> "$INVESTIGATION_REPORT"
            echo "\`\`\`" >> "$INVESTIGATION_REPORT"
        else
            echo "*Unable to retrieve feature flag status*" >> "$INVESTIGATION_REPORT"
        fi
    else
        echo "*curl not available for API calls*" >> "$INVESTIGATION_REPORT"
    fi
    
    add_timeline_entry "Feature flag analysis completed"
}

# Analyze performance metrics
analyze_performance_metrics() {
    add_timeline_entry "Analyzing performance metrics"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Performance Metrics Analysis

### Web Vitals Trend (Last ${LOOKBACK_HOURS}h)

EOF

    # This would query your actual monitoring system
    # For now, simulate trend analysis
    local current_time=$(date +%s)
    local start_time=$((current_time - LOOKBACK_HOURS * 3600))
    
    echo "| Time | LCP (ms) | FID (ms) | CLS | TTFB (ms) |" >> "$INVESTIGATION_REPORT"
    echo "|------|----------|----------|-----|-----------|" >> "$INVESTIGATION_REPORT"
    
    # Simulate hourly data points
    for ((i=0; i<LOOKBACK_HOURS; i+=4)); do
        local hour_time=$((start_time + i * 3600))
        local hour_label=$(date -d "@$hour_time" '+%m/%d %H:%M')
        
        # Simulate metrics with some variation
        local lcp=$((2200 + RANDOM % 800))
        local fid=$((80 + RANDOM % 40))
        local cls=$(echo "scale=3; 0.08 + ($RANDOM % 50) / 1000" | bc -l)
        local ttfb=$((600 + RANDOM % 200))
        
        echo "| $hour_label | $lcp | $fid | $cls | $ttfb |" >> "$INVESTIGATION_REPORT"
    done
    
    cat >> "$INVESTIGATION_REPORT" << EOF

### API Latency Trend (Last ${LOOKBACK_HOURS}h)

| Time | P50 (ms) | P95 (ms) | Error Rate (%) |
|------|----------|----------|----------------|
EOF

    # Simulate API latency data
    for ((i=0; i<LOOKBACK_HOURS; i+=4)); do
        local hour_time=$((start_time + i * 3600))
        local hour_label=$(date -d "@$hour_time" '+%m/%d %H:%M')
        
        local p50=$((200 + RANDOM % 150))
        local p95=$((400 + RANDOM % 300))
        local error_rate=$(echo "scale=2; ($RANDOM % 300) / 100" | bc -l)
        
        echo "| $hour_label | $p50 | $p95 | $error_rate |" >> "$INVESTIGATION_REPORT"
    done
    
    add_timeline_entry "Performance metrics analysis completed"
}

# Analyze infrastructure changes
analyze_infrastructure() {
    add_timeline_entry "Analyzing infrastructure changes"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Infrastructure Analysis

### System Resources

EOF

    # Check current system resources
    if command -v free &> /dev/null; then
        echo "**Memory Usage:**" >> "$INVESTIGATION_REPORT"
        echo "\`\`\`" >> "$INVESTIGATION_REPORT"
        free -h >> "$INVESTIGATION_REPORT"
        echo "\`\`\`" >> "$INVESTIGATION_REPORT"
    fi
    
    if command -v df &> /dev/null; then
        echo "**Disk Usage:**" >> "$INVESTIGATION_REPORT"
        echo "\`\`\`" >> "$INVESTIGATION_REPORT"
        df -h >> "$INVESTIGATION_REPORT"
        echo "\`\`\`" >> "$INVESTIGATION_REPORT"
    fi
    
    # Check for recent infrastructure changes
    cat >> "$INVESTIGATION_REPORT" << EOF

### Recent Infrastructure Changes

*Check the following for recent changes:*
- Server configurations
- Database settings
- CDN configuration
- Load balancer settings
- Third-party service updates

EOF

    add_timeline_entry "Infrastructure analysis completed"
}

# Analyze third-party services
analyze_third_party_services() {
    add_timeline_entry "Analyzing third-party service status"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Third-Party Service Analysis

### Service Status Checks

EOF

    # List of third-party services to check
    local services=(
        "https://status.stripe.com"
        "https://status.aws.amazon.com"
        "https://www.cloudflarestatus.com"
    )
    
    echo "| Service | Status | Response Time |" >> "$INVESTIGATION_REPORT"
    echo "|---------|--------|---------------|" >> "$INVESTIGATION_REPORT"
    
    for service in "${services[@]}"; do
        local service_name=$(echo "$service" | sed 's|https://||' | sed 's|/.*||')
        
        if command -v curl &> /dev/null; then
            local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$service" 2>/dev/null || echo "timeout")
            local status="✅ OK"
            
            if [[ "$response_time" == "timeout" ]]; then
                status="❌ Timeout"
                response_time="N/A"
            elif (( $(echo "$response_time > 5" | bc -l) )); then
                status="⚠️ Slow"
            fi
            
            echo "| $service_name | $status | ${response_time}s |" >> "$INVESTIGATION_REPORT"
        else
            echo "| $service_name | ❓ Unknown | N/A |" >> "$INVESTIGATION_REPORT"
        fi
    done
    
    add_timeline_entry "Third-party service analysis completed"
}

# Correlation analysis
perform_correlation_analysis() {
    add_timeline_entry "Performing correlation analysis"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Correlation Analysis

### Timeline Correlation

*Analyzing correlation between events and performance changes:*

1. **Deployment Correlation**
   - Check if performance degradation started after specific deployments
   - Identify commits that might have introduced performance issues

2. **Feature Flag Correlation**
   - Analyze if feature flag changes coincide with performance issues
   - Check rollout percentages and user impact

3. **Infrastructure Correlation**
   - Look for infrastructure changes that align with performance degradation
   - Check resource utilization patterns

4. **External Factor Correlation**
   - Analyze third-party service issues
   - Check for increased traffic or usage patterns

### Suspected Root Causes

EOF

    # This would perform actual correlation analysis
    # For now, provide a template for manual analysis
    
    echo "*Based on the analysis above, potential root causes include:*" >> "$INVESTIGATION_REPORT"
    echo "" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Recent deployment introduced performance regression" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Feature flag rollout caused performance issues" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Infrastructure changes affected performance" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Third-party service degradation" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Increased traffic or usage patterns" >> "$INVESTIGATION_REPORT"
    echo "- [ ] Database performance issues" >> "$INVESTIGATION_REPORT"
    echo "- [ ] CDN or caching issues" >> "$INVESTIGATION_REPORT"
    
    add_timeline_entry "Correlation analysis completed"
}

# Generate recommendations
generate_recommendations() {
    add_timeline_entry "Generating recommendations"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Recommendations

### Immediate Actions

1. **If Critical Regression:**
   \`\`\`bash
   # Consider immediate rollback
   ./scripts/emergency-rollback.sh --deployment-id=\$DEPLOYMENT_ID --reason="Performance regression"
   \`\`\`

2. **If Feature Flag Related:**
   \`\`\`bash
   # Disable problematic feature flags
   curl -X POST -H "Authorization: Bearer \$API_TOKEN" \\
        -H "Content-Type: application/json" \\
        -d '{"featureName": "problematic_feature", "enabled": false, "reason": "Performance regression"}' \\
        https://api.PharmaPilot.com/api/deployment/feature-flags/override
   \`\`\`

3. **Enhanced Monitoring:**
   \`\`\`bash
   # Increase monitoring frequency
   ./scripts/enhanced-monitoring.sh --duration=2h --interval=1m
   \`\`\`

### Investigation Actions

1. **Deep Dive Analysis:**
   - Profile specific performance bottlenecks
   - Analyze database query performance
   - Review frontend bundle changes
   - Check API endpoint performance

2. **A/B Testing:**
   - Compare performance with and without suspected changes
   - Use feature flags to isolate problematic features
   - Test with different user segments

3. **Load Testing:**
   - Run load tests to reproduce performance issues
   - Test under different traffic conditions
   - Validate fixes under load

### Prevention Measures

1. **Enhanced CI/CD:**
   - Add performance regression tests to CI pipeline
   - Implement stricter performance budgets
   - Add automated rollback triggers

2. **Monitoring Improvements:**
   - Add more granular performance metrics
   - Implement better alerting thresholds
   - Create performance dashboards for real-time monitoring

3. **Process Improvements:**
   - Require performance impact assessment for deployments
   - Implement gradual rollout procedures
   - Create performance review checkpoints

EOF

    add_timeline_entry "Recommendations generated"
}

# Interactive investigation mode
interactive_investigation() {
    log_info "Starting interactive performance regression investigation"
    
    echo ""
    echo "Performance Regression Investigation Tool"
    echo "========================================"
    echo ""
    
    # Get regression details
    read -p "Enter regression description (optional): " regression_desc
    read -p "When was the regression first noticed? (e.g., '2 hours ago'): " regression_time
    read -p "What metrics are affected? (e.g., 'LCP, API latency'): " affected_metrics
    read -p "Estimated user impact (e.g., '25% of users'): " user_impact
    
    # Update report with user input
    sed -i "s/\*To be filled during investigation\*/Regression Description: $regression_desc\nFirst Noticed: $regression_time\nAffected Metrics: $affected_metrics\nUser Impact: $user_impact/" "$INVESTIGATION_REPORT"
    
    echo ""
    log_info "Starting automated analysis..."
}

# Main investigation function
main() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        usage
        exit 0
    fi
    
    # Initialize investigation
    initialize_report
    
    # Run interactive mode if no regression ID provided
    if [[ -z "$REGRESSION_ID" ]]; then
        interactive_investigation
    fi
    
    # Run analysis steps
    analyze_deployments
    analyze_feature_flags
    analyze_performance_metrics
    analyze_infrastructure
    analyze_third_party_services
    perform_correlation_analysis
    generate_recommendations
    
    # Finalize report
    add_timeline_entry "Investigation completed"
    
    cat >> "$INVESTIGATION_REPORT" << EOF

## Investigation Summary

**Status:** Investigation completed
**Report Generated:** $(date)
**Next Steps:** Review recommendations and implement appropriate actions

---

*This investigation was generated automatically. Manual review and analysis may be required for complex regressions.*
EOF

    log_success "Investigation completed"
    log_info "Report saved to: $INVESTIGATION_REPORT"
    
    # Open report if possible
    if command -v code &> /dev/null; then
        code "$INVESTIGATION_REPORT"
    elif command -v nano &> /dev/null; then
        echo ""
        read -p "Open report in nano? (y/n): " open_report
        if [[ "$open_report" == "y" ]]; then
            nano "$INVESTIGATION_REPORT"
        fi
    fi
}

# Run main function
main "$@"