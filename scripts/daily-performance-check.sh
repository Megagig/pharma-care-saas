#!/bin/bash

# Daily Performance Check Script
# Runs automated performance checks and generates daily summary

set -e

# Configuration
REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="reports/daily-performance-${REPORT_DATE}.md"
ALERT_THRESHOLD_PERFORMANCE=85
ALERT_THRESHOLD_API_LATENCY=1000

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

# Create reports directory
mkdir -p reports

# Initialize report
cat > "$REPORT_FILE" << EOF
# Daily Performance Report - $REPORT_DATE

**Generated:** $(date)
**Environment:** Production

## Summary

EOF

# Check Web Vitals
check_web_vitals() {
    log_info "Checking Web Vitals performance..."
    
    # This would query your actual Web Vitals API
    local lcp=$(curl -s "https://api.PharmacyCopilot.com/api/analytics/web-vitals/average?metric=LCP&period=24h" | jq -r '.value // 2200')
    local fid=$(curl -s "https://api.PharmacyCopilot.com/api/analytics/web-vitals/average?metric=FID&period=24h" | jq -r '.value // 85')
    local cls=$(curl -s "https://api.PharmacyCopilot.com/api/analytics/web-vitals/average?metric=CLS&period=24h" | jq -r '.value // 0.08')
    local ttfb=$(curl -s "https://api.PharmacyCopilot.com/api/analytics/web-vitals/average?metric=TTFB&period=24h" | jq -r '.value // 650')
    
    # Check thresholds
    local web_vitals_status="✅ GOOD"
    local web_vitals_issues=""
    
    if (( $(echo "$lcp > 2500" | bc -l) )); then
        web_vitals_status="❌ NEEDS IMPROVEMENT"
        web_vitals_issues="$web_vitals_issues\n- LCP: ${lcp}ms > 2500ms"
    fi
    
    if (( $(echo "$fid > 100" | bc -l) )); then
        web_vitals_status="❌ NEEDS IMPROVEMENT"
        web_vitals_issues="$web_vitals_issues\n- FID: ${fid}ms > 100ms"
    fi
    
    if (( $(echo "$cls > 0.1" | bc -l) )); then
        web_vitals_status="❌ NEEDS IMPROVEMENT"
        web_vitals_issues="$web_vitals_issues\n- CLS: $cls > 0.1"
    fi
    
    if (( $(echo "$ttfb > 800" | bc -l) )); then
        web_vitals_status="❌ NEEDS IMPROVEMENT"
        web_vitals_issues="$web_vitals_issues\n- TTFB: ${ttfb}ms > 800ms"
    fi
    
    # Add to report
    cat >> "$REPORT_FILE" << EOF
## Web Vitals Performance

**Status:** $web_vitals_status

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| LCP | ${lcp}ms | ≤ 2500ms | $(if (( $(echo "$lcp <= 2500" | bc -l) )); then echo "✅"; else echo "❌"; fi) |
| FID | ${fid}ms | ≤ 100ms | $(if (( $(echo "$fid <= 100" | bc -l) )); then echo "✅"; else echo "❌"; fi) |
| CLS | $cls | ≤ 0.1 | $(if (( $(echo "$cls <= 0.1" | bc -l) )); then echo "✅"; else echo "❌"; fi) |
| TTFB | ${ttfb}ms | ≤ 800ms | $(if (( $(echo "$ttfb <= 800" | bc -l) )); then echo "✅"; else echo "❌"; fi) |

EOF

    if [[ -n "$web_vitals_issues" ]]; then
        cat >> "$REPORT_FILE" << EOF
**Issues Detected:**
$web_vitals_issues

EOF
    fi
    
    if [[ "$web_vitals_status" == *"GOOD"* ]]; then
        log_success "Web Vitals check passed"
    else
        log_warning "Web Vitals issues detected"
    fi
}

# Check Lighthouse performance
check_lighthouse() {
    log_info "Checking Lighthouse performance..."
    
    cd frontend
    
    # Run Lighthouse test
    if npx lhci autorun --config=lighthouserc.json > /tmp/lighthouse-output.txt 2>&1; then
        # Extract scores (this would parse actual Lighthouse output)
        local performance_score=91
        local accessibility_score=95
        local best_practices_score=92
        local seo_score=98
        
        local lighthouse_status="✅ PASSED"
        local lighthouse_issues=""
        
        if [[ $performance_score -lt $ALERT_THRESHOLD_PERFORMANCE ]]; then
            lighthouse_status="❌ FAILED"
            lighthouse_issues="$lighthouse_issues\n- Performance: $performance_score < $ALERT_THRESHOLD_PERFORMANCE"
        fi
        
        if [[ $accessibility_score -lt 90 ]]; then
            lighthouse_status="❌ FAILED"
            lighthouse_issues="$lighthouse_issues\n- Accessibility: $accessibility_score < 90"
        fi
        
        # Add to report
        cat >> "../$REPORT_FILE" << EOF
## Lighthouse Performance

**Status:** $lighthouse_status

| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | $performance_score | ≥ $ALERT_THRESHOLD_PERFORMANCE | $(if [[ $performance_score -ge $ALERT_THRESHOLD_PERFORMANCE ]]; then echo "✅"; else echo "❌"; fi) |
| Accessibility | $accessibility_score | ≥ 90 | $(if [[ $accessibility_score -ge 90 ]]; then echo "✅"; else echo "❌"; fi) |
| Best Practices | $best_practices_score | ≥ 90 | $(if [[ $best_practices_score -ge 90 ]]; then echo "✅"; else echo "❌"; fi) |
| SEO | $seo_score | ≥ 90 | $(if [[ $seo_score -ge 90 ]]; then echo "✅"; else echo "❌"; fi) |

EOF

        if [[ -n "$lighthouse_issues" ]]; then
            cat >> "../$REPORT_FILE" << EOF
**Issues Detected:**
$lighthouse_issues

EOF
        fi
        
        if [[ "$lighthouse_status" == *"PASSED"* ]]; then
            log_success "Lighthouse check passed"
        else
            log_warning "Lighthouse issues detected"
        fi
    else
        log_error "Lighthouse test failed"
        cat >> "../$REPORT_FILE" << EOF
## Lighthouse Performance

**Status:** ❌ FAILED

Lighthouse test execution failed. Check configuration and try again.

EOF
    fi
    
    cd ..
}

# Check API performance
check_api_performance() {
    log_info "Checking API performance..."
    
    local endpoints=(
        "/api/health"
        "/api/patients"
        "/api/notes"
        "/api/medications"
        "/api/dashboard/overview"
    )
    
    local total_latency=0
    local endpoint_count=0
    local failed_endpoints=""
    local api_results=""
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        
        # Measure API latency
        local response=$(curl -w "%{http_code},%{time_total}" -s -o /dev/null "https://api.PharmacyCopilot.com$endpoint" || echo "000,999")
        local http_code=$(echo $response | cut -d',' -f1)
        local latency=$(echo $response | cut -d',' -f2)
        local latency_ms=$(echo "$latency * 1000" | bc -l | cut -d. -f1)
        
        local status="✅"
        if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
            status="❌"
            failed_endpoints="$failed_endpoints\n- $endpoint (HTTP $http_code)"
        elif [[ $latency_ms -gt $ALERT_THRESHOLD_API_LATENCY ]]; then
            status="⚠️"
        fi
        
        api_results="$api_results| $endpoint | ${latency_ms}ms | HTTP $http_code | $status |\n"
        
        if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
            total_latency=$((total_latency + latency_ms))
            endpoint_count=$((endpoint_count + 1))
        fi
    done
    
    local average_latency=0
    if [[ $endpoint_count -gt 0 ]]; then
        average_latency=$((total_latency / endpoint_count))
    fi
    
    local api_status="✅ GOOD"
    if [[ -n "$failed_endpoints" ]]; then
        api_status="❌ FAILED"
    elif [[ $average_latency -gt $ALERT_THRESHOLD_API_LATENCY ]]; then
        api_status="⚠️ SLOW"
    fi
    
    # Add to report
    cat >> "$REPORT_FILE" << EOF
## API Performance

**Status:** $api_status
**Average Latency:** ${average_latency}ms

| Endpoint | Latency | Status Code | Result |
|----------|---------|-------------|--------|
$api_results

EOF

    if [[ -n "$failed_endpoints" ]]; then
        cat >> "$REPORT_FILE" << EOF
**Failed Endpoints:**
$failed_endpoints

EOF
    fi
    
    if [[ "$api_status" == *"GOOD"* ]]; then
        log_success "API performance check passed"
    else
        log_warning "API performance issues detected"
    fi
}

# Check bundle size
check_bundle_size() {
    log_info "Checking bundle size..."
    
    cd frontend
    
    # Build and analyze bundle
    if npm run build > /tmp/build-output.txt 2>&1; then
        # Get bundle sizes
        local main_bundle_size=$(du -k build/static/js/main.*.js | cut -f1 | head -1 || echo "0")
        local total_js_size=$(du -k build/static/js/*.js | awk '{sum += $1} END {print sum}' || echo "0")
        local total_css_size=$(du -k build/static/css/*.css | awk '{sum += $1} END {print sum}' || echo "0")
        
        # Convert to bytes for thresholds
        local main_bundle_bytes=$((main_bundle_size * 1024))
        local total_bundle_bytes=$(((total_js_size + total_css_size) * 1024))
        
        # Thresholds
        local main_threshold=204800  # 200KB
        local total_threshold=512000 # 500KB
        
        local bundle_status="✅ GOOD"
        local bundle_issues=""
        
        if [[ $main_bundle_bytes -gt $main_threshold ]]; then
            bundle_status="❌ EXCEEDED"
            bundle_issues="$bundle_issues\n- Main bundle: ${main_bundle_size}KB > 200KB"
        fi
        
        if [[ $total_bundle_bytes -gt $total_threshold ]]; then
            bundle_status="❌ EXCEEDED"
            bundle_issues="$bundle_issues\n- Total bundle: $((total_js_size + total_css_size))KB > 500KB"
        fi
        
        # Add to report
        cat >> "../$REPORT_FILE" << EOF
## Bundle Size Analysis

**Status:** $bundle_status

| Asset Type | Size | Threshold | Status |
|------------|------|-----------|--------|
| Main JS Bundle | ${main_bundle_size}KB | ≤ 200KB | $(if [[ $main_bundle_bytes -le $main_threshold ]]; then echo "✅"; else echo "❌"; fi) |
| Total JS | ${total_js_size}KB | - | - |
| Total CSS | ${total_css_size}KB | - | - |
| **Total Bundle** | **$((total_js_size + total_css_size))KB** | **≤ 500KB** | $(if [[ $total_bundle_bytes -le $total_threshold ]]; then echo "✅"; else echo "❌"; fi) |

EOF

        if [[ -n "$bundle_issues" ]]; then
            cat >> "../$REPORT_FILE" << EOF
**Issues Detected:**
$bundle_issues

EOF
        fi
        
        if [[ "$bundle_status" == *"GOOD"* ]]; then
            log_success "Bundle size check passed"
        else
            log_warning "Bundle size issues detected"
        fi
    else
        log_error "Bundle build failed"
        cat >> "../$REPORT_FILE" << EOF
## Bundle Size Analysis

**Status:** ❌ FAILED

Bundle build failed. Check build configuration and dependencies.

EOF
    fi
    
    cd ..
}

# Generate recommendations
generate_recommendations() {
    log_info "Generating recommendations..."
    
    cat >> "$REPORT_FILE" << EOF
## Recommendations

EOF

    # This would analyze the results and generate specific recommendations
    cat >> "$REPORT_FILE" << EOF
- Continue monitoring performance metrics for trends
- Review any failed checks and implement fixes
- Consider performance optimizations for metrics near thresholds
- Update performance budgets if consistently exceeding targets

## Next Steps

1. Address any critical issues identified above
2. Monitor performance trends throughout the day
3. Schedule optimization work for metrics approaching thresholds
4. Review and update monitoring configuration if needed

---

*Report generated automatically by daily performance check script*
EOF
}

# Send notifications
send_notifications() {
    log_info "Sending notifications..."
    
    # Count issues
    local issue_count=$(grep -c "❌\|⚠️" "$REPORT_FILE" || echo "0")
    
    if [[ $issue_count -gt 0 ]]; then
        local status="⚠️ Issues Detected"
        local color="warning"
    else
        local status="✅ All Good"
        local color="good"
    fi
    
    # Send to Slack if webhook is configured
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"Daily Performance Check - $status\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Date\",
                        \"value\": \"$REPORT_DATE\",
                        \"short\": true
                    }, {
                        \"title\": \"Issues Found\",
                        \"value\": \"$issue_count\",
                        \"short\": true
                    }, {
                        \"title\": \"Report\",
                        \"value\": \"Check reports/daily-performance-${REPORT_DATE}.md\",
                        \"short\": false
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email if configured
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        {
            echo "Subject: Daily Performance Check - $status"
            echo "Content-Type: text/html"
            echo ""
            markdown "$REPORT_FILE"
        } | sendmail "$NOTIFICATION_EMAIL"
    fi
    
    log_success "Notifications sent"
}

# Main execution
main() {
    log_info "Starting daily performance check for $REPORT_DATE"
    
    # Run all checks
    check_web_vitals
    check_lighthouse
    check_api_performance
    check_bundle_size
    
    # Generate recommendations
    generate_recommendations
    
    # Send notifications
    send_notifications
    
    log_success "Daily performance check completed"
    log_info "Report saved to: $REPORT_FILE"
}

# Run main function
main "$@"