#!/bin/bash

# Comprehensive Performance Testing Script
# Runs all performance tests and generates final validation report

set -e

# Configuration
REPORT_DIR="comprehensive-performance-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BASE_URL="${BASE_URL:-http://localhost:5173}"
API_URL="${API_URL:-http://localhost:3001}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_section() {
    echo -e "${PURPLE}[SECTION]${NC} $1"
    echo "=================================================="
}

# Initialize test environment
initialize_environment() {
    log_section "Initializing Comprehensive Performance Testing Environment"
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    # Check if servers are running
    if ! curl -s -f "$BASE_URL" > /dev/null; then
        log_error "Frontend server not running at $BASE_URL"
        log_info "Please start with: cd frontend && npm run dev"
        exit 1
    fi
    
    if ! curl -s -f "$API_URL/api/health" > /dev/null; then
        log_error "Backend server not running at $API_URL"
        log_info "Please start with: cd backend && npm run dev"
        exit 1
    fi
    
    # Check required tools
    local missing_tools=()
    
    if ! command -v k6 &> /dev/null; then
        missing_tools+=("k6")
    fi
    
    if ! command -v npx &> /dev/null; then
        missing_tools+=("npx")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools before continuing"
        exit 1
    fi
    
    log_success "Environment initialization completed"
}

# Run performance test suite
run_performance_test_suite() {
    log_section "Running Automated Performance Test Suite"
    
    local suite_report="$REPORT_DIR/performance-suite-$TIMESTAMP.json"
    local suite_success=true
    
    cd frontend
    
    if npm run test:performance:suite -- --reporter=json > "$suite_report" 2>&1; then
        log_success "Performance test suite completed"
    else
        log_error "Performance test suite failed"
        suite_success=false
    fi
    
    cd ..
    
    # Parse results
    if [ -f "$suite_report" ] && [ "$suite_success" = true ]; then
        local passed_tests=$(jq -r '.stats.passed // 0' "$suite_report" 2>/dev/null || echo "0")
        local failed_tests=$(jq -r '.stats.failed // 0' "$suite_report" 2>/dev/null || echo "0")
        local total_tests=$(jq -r '.stats.total // 0' "$suite_report" 2>/dev/null || echo "0")
        
        log_info "Test Suite Results: $passed_tests/$total_tests passed"
        
        if [ "$failed_tests" -gt 0 ]; then
            log_warning "$failed_tests test(s) failed in performance suite"
        fi
    fi
    
    return $([ "$suite_success" = true ] && echo 0 || echo 1)
}

# Run load testing
run_load_testing() {
    log_section "Running Load Testing Suite"
    
    local load_success=true
    
    # Run API load test
    log_info "Running API load test..."
    if ./scripts/run-load-tests.sh api > "$REPORT_DIR/api-load-test-$TIMESTAMP.log" 2>&1; then
        log_success "API load test completed"
    else
        log_error "API load test failed"
        load_success=false
    fi
    
    # Run database load test
    log_info "Running database load test..."
    if ./scripts/run-load-tests.sh database > "$REPORT_DIR/database-load-test-$TIMESTAMP.log" 2>&1; then
        log_success "Database load test completed"
    else
        log_error "Database load test failed"
        load_success=false
    fi
    
    # Run Redis cache test
    log_info "Running Redis cache test..."
    if ./scripts/run-load-tests.sh redis > "$REPORT_DIR/redis-cache-test-$TIMESTAMP.log" 2>&1; then
        log_success "Redis cache test completed"
    else
        log_error "Redis cache test failed"
        load_success=false
    fi
    
    return $([ "$load_success" = true ] && echo 0 || echo 1)
}

# Run visual regression testing
run_visual_regression_testing() {
    log_section "Running Visual Regression Testing"
    
    local visual_success=true
    
    if ./scripts/run-visual-tests.sh > "$REPORT_DIR/visual-regression-$TIMESTAMP.log" 2>&1; then
        log_success "Visual regression testing completed"
    else
        log_error "Visual regression testing failed"
        visual_success=false
    fi
    
    # Copy visual test results
    if [ -d "visual-test-results" ]; then
        cp -r visual-test-results/* "$REPORT_DIR/" 2>/dev/null || true
    fi
    
    return $([ "$visual_success" = true ] && echo 0 || echo 1)
}

# Run Lighthouse performance testing
run_lighthouse_testing() {
    log_section "Running Lighthouse Performance Testing"
    
    local lighthouse_success=true
    
    cd frontend
    
    log_info "Running Lighthouse CI..."
    if npm run lighthouse > "../$REPORT_DIR/lighthouse-$TIMESTAMP.log" 2>&1; then
        log_success "Lighthouse testing completed"
    else
        log_error "Lighthouse testing failed"
        lighthouse_success=false
    fi
    
    cd ..
    
    # Copy Lighthouse reports
    if [ -d "frontend/lhci_reports" ]; then
        cp -r frontend/lhci_reports/* "$REPORT_DIR/" 2>/dev/null || true
    fi
    
    return $([ "$lighthouse_success" = true ] && echo 0 || echo 1)
}

# Validate performance targets
validate_performance_targets() {
    log_section "Validating Performance Targets"
    
    local validation_success=true
    
    if node scripts/validate-performance-targets.js > "$REPORT_DIR/performance-validation-$TIMESTAMP.log" 2>&1; then
        log_success "Performance targets validation completed"
    else
        log_error "Performance targets validation failed"
        validation_success=false
    fi
    
    # Copy validation reports
    if [ -d "performance-validation-reports" ]; then
        cp -r performance-validation-reports/* "$REPORT_DIR/" 2>/dev/null || true
    fi
    
    return $([ "$validation_success" = true ] && echo 0 || echo 1)
}

# Create performance benchmarks
create_performance_benchmarks() {
    log_section "Creating Performance Benchmarks"
    
    local benchmark_success=true
    
    if node scripts/create-performance-benchmarks.js > "$REPORT_DIR/benchmark-creation-$TIMESTAMP.log" 2>&1; then
        log_success "Performance benchmarks created"
    else
        log_error "Performance benchmark creation failed"
        benchmark_success=false
    fi
    
    # Copy benchmark reports
    if [ -d "performance-benchmark-reports" ]; then
        cp -r performance-benchmark-reports/* "$REPORT_DIR/" 2>/dev/null || true
    fi
    
    # Copy benchmark data
    if [ -f "performance-benchmarks.json" ]; then
        cp performance-benchmarks.json "$REPORT_DIR/"
    fi
    
    return $([ "$benchmark_success" = true ] && echo 0 || echo 1)
}

# Generate comprehensive report
generate_comprehensive_report() {
    log_section "Generating Comprehensive Performance Report"
    
    local report_file="$REPORT_DIR/comprehensive-performance-report-$TIMESTAMP.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .success { border-left: 4px solid #28a745; background: #f8fff9; }
        .warning { border-left: 4px solid #ffc107; background: #fffbf0; }
        .error { border-left: 4px solid #dc3545; background: #fff8f8; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .file-list { margin: 15px 0; }
        .file-list a { display: block; margin: 5px 0; color: #007bff; text-decoration: none; }
        .file-list a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Performance Test Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Frontend URL:</strong> $BASE_URL</p>
        <p><strong>API URL:</strong> $API_URL</p>
        <p><strong>Test Duration:</strong> Approximately 45-60 minutes</p>
    </div>
    
    <div class="section success">
        <h2>Test Suite Overview</h2>
        <p>This comprehensive performance test report covers all aspects of application performance:</p>
        <ul>
            <li><strong>Automated Performance Test Suite</strong> - Theme switching, bundle size, API latency, Web Vitals</li>
            <li><strong>Load Testing</strong> - API endpoints, database performance, Redis cache performance</li>
            <li><strong>Visual Regression Testing</strong> - Theme consistency, layout stability, cross-browser compatibility</li>
            <li><strong>Lighthouse Performance Testing</strong> - Performance scores, accessibility, best practices</li>
            <li><strong>Performance Target Validation</strong> - Comprehensive validation against all targets</li>
            <li><strong>Benchmark Creation</strong> - Historical performance tracking and trend analysis</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Performance Targets</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">≥ 90</div>
                <div class="metric-label">Lighthouse Performance</div>
            </div>
            <div class="metric">
                <div class="metric-value">≤ 16ms</div>
                <div class="metric-label">Theme Switch Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">≤ 350ms</div>
                <div class="metric-label">API P95 Latency</div>
            </div>
            <div class="metric">
                <div class="metric-value">≤ 500KB</div>
                <div class="metric-label">Bundle Size (Gzipped)</div>
            </div>
            <div class="metric">
                <div class="metric-value">≤ 2.5s</div>
                <div class="metric-label">Largest Contentful Paint</div>
            </div>
            <div class="metric">
                <div class="metric-value">> 80%</div>
                <div class="metric-label">Cache Hit Rate</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Test Results and Reports</h2>
        <div class="file-list">
            <h3>Performance Test Suite</h3>
            <a href="performance-suite-$TIMESTAMP.json">Performance Suite Results (JSON)</a>
            
            <h3>Load Testing</h3>
            <a href="api-load-test-$TIMESTAMP.log">API Load Test Log</a>
            <a href="database-load-test-$TIMESTAMP.log">Database Load Test Log</a>
            <a href="redis-cache-test-$TIMESTAMP.log">Redis Cache Test Log</a>
            
            <h3>Visual Regression Testing</h3>
            <a href="visual-regression-$TIMESTAMP.log">Visual Regression Test Log</a>
            <a href="visual-regression-report.html">Visual Regression Report</a>
            
            <h3>Lighthouse Testing</h3>
            <a href="lighthouse-$TIMESTAMP.log">Lighthouse Test Log</a>
            
            <h3>Performance Validation</h3>
            <a href="performance-validation-$TIMESTAMP.log">Validation Log</a>
            
            <h3>Benchmarks</h3>
            <a href="benchmark-creation-$TIMESTAMP.log">Benchmark Creation Log</a>
            <a href="performance-benchmarks.json">Performance Benchmarks Data</a>
        </div>
    </div>
    
    <div class="section">
        <h2>Performance Budget Compliance</h2>
        <p>All performance targets are validated against the following budgets:</p>
        <ul>
            <li><strong>Lighthouse Performance:</strong> ≥ 90 (Desktop)</li>
            <li><strong>Theme Switching:</strong> ≤ 16ms per switch</li>
            <li><strong>API Latency:</strong> P50 ≤ 140ms, P95 ≤ 350ms</li>
            <li><strong>Bundle Size:</strong> Total ≤ 500KB gzipped</li>
            <li><strong>Web Vitals:</strong> LCP ≤ 2.5s, CLS ≤ 0.1, FID ≤ 100ms</li>
            <li><strong>Cache Performance:</strong> Hit rate > 80%</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review individual test reports for detailed results</li>
            <li>Address any performance issues identified</li>
            <li>Implement recommended optimizations</li>
            <li>Set up continuous performance monitoring</li>
            <li>Schedule regular performance reviews</li>
        </ol>
    </div>
</body>
</html>
EOF
    
    log_success "Comprehensive report generated: $report_file"
}

# Print final summary
print_final_summary() {
    log_section "Comprehensive Performance Testing Summary"
    
    local total_tests=6
    local passed_tests=0
    local failed_tests=0
    
    # Count results (simplified)
    if [ -f "$REPORT_DIR/performance-suite-$TIMESTAMP.json" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    if [ -f "$REPORT_DIR/api-load-test-$TIMESTAMP.log" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    if [ -f "$REPORT_DIR/visual-regression-$TIMESTAMP.log" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    if [ -f "$REPORT_DIR/lighthouse-$TIMESTAMP.log" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    if [ -f "$REPORT_DIR/performance-validation-$TIMESTAMP.log" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    if [ -f "$REPORT_DIR/benchmark-creation-$TIMESTAMP.log" ]; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
    
    echo ""
    echo "📊 Final Results:"
    echo "  Test Categories Completed: $passed_tests/$total_tests"
    echo "  Test Categories Failed: $failed_tests"
    echo "  Reports Directory: $REPORT_DIR"
    echo "  Comprehensive Report: $REPORT_DIR/comprehensive-performance-report-$TIMESTAMP.html"
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        log_success "🎉 All performance test categories completed successfully!"
        echo "  View the comprehensive report for detailed results and recommendations."
    else
        log_warning "⚠️  $failed_tests test category(ies) had issues"
        echo "  Check individual logs in $REPORT_DIR for details."
    fi
    
    echo ""
    echo "📄 Available Reports:"
    ls -la "$REPORT_DIR"/ | grep -E "\.(html|json|log)$" | awk '{print "  " $9}'
    echo ""
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    echo "🚀 Starting Comprehensive Performance Testing Suite"
    echo "=================================================="
    echo "This will run all performance tests and generate a comprehensive report."
    echo "Estimated duration: 45-60 minutes"
    echo ""
    
    # Initialize
    initialize_environment
    
    # Run all test categories
    local test_results=()
    
    run_performance_test_suite
    test_results+=($?)
    
    run_load_testing
    test_results+=($?)
    
    run_visual_regression_testing
    test_results+=($?)
    
    run_lighthouse_testing
    test_results+=($?)
    
    validate_performance_targets
    test_results+=($?)
    
    create_performance_benchmarks
    test_results+=($?)
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Calculate total time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo ""
    log_info "Total execution time: ${minutes}m ${seconds}s"
    
    # Print summary
    print_final_summary
    
    # Exit with appropriate code
    local failed_count=0
    for result in "${test_results[@]}"; do
        if [ $result -ne 0 ]; then
            ((failed_count++))
        fi
    done
    
    if [ $failed_count -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Comprehensive Performance Testing Script"
        echo "========================================"
        echo ""
        echo "Usage: $0 [help]"
        echo ""
        echo "This script runs all performance tests:"
        echo "  1. Automated Performance Test Suite"
        echo "  2. Load Testing (API, Database, Redis)"
        echo "  3. Visual Regression Testing"
        echo "  4. Lighthouse Performance Testing"
        echo "  5. Performance Target Validation"
        echo "  6. Performance Benchmark Creation"
        echo ""
        echo "Environment Variables:"
        echo "  BASE_URL    Frontend URL (default: http://localhost:5173)"
        echo "  API_URL     Backend URL (default: http://localhost:3001)"
        echo ""
        echo "Prerequisites:"
        echo "  - Frontend server running at BASE_URL"
        echo "  - Backend server running at API_URL"
        echo "  - k6 installed for load testing"
        echo "  - Playwright installed for visual testing"
        echo ""
        echo "Reports will be generated in: $REPORT_DIR"
        exit 0
        ;;
    *)
        main
        ;;
esac