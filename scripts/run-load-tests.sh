#!/bin/bash

# Load Testing Script
# Runs comprehensive load tests for API endpoints and database performance

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
REPORT_DIR="load-test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Please install k6 first:"
        log_info "  macOS: brew install k6"
        log_info "  Linux: sudo apt-get install k6"
        log_info "  Windows: choco install k6"
        log_info "  Or download from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    log_success "k6 is installed: $(k6 version)"
}

# Check if API is accessible
check_api() {
    log_info "Checking API accessibility at $API_URL..."
    
    if curl -s -f "$API_URL/api/health" > /dev/null; then
        log_success "API is accessible"
    else
        log_error "API is not accessible at $API_URL"
        log_info "Please ensure the API server is running"
        exit 1
    fi
}

# Create report directory
setup_reports() {
    mkdir -p "$REPORT_DIR"
    log_info "Reports will be saved to: $REPORT_DIR"
}

# Run API load test
run_api_load_test() {
    log_info "Running API load test..."
    
    local report_file="$REPORT_DIR/api-load-test-$TIMESTAMP.json"
    local html_report="$REPORT_DIR/api-load-test-$TIMESTAMP.html"
    
    k6 run \
        --env API_URL="$API_URL" \
        --env AUTH_TOKEN="$AUTH_TOKEN" \
        --out json="$report_file" \
        tests/load/api-load-test.js
    
    if [ $? -eq 0 ]; then
        log_success "API load test completed successfully"
        
        # Generate HTML report if k6-reporter is available
        if command -v k6-to-html &> /dev/null; then
            k6-to-html "$report_file" --output "$html_report"
            log_info "HTML report generated: $html_report"
        fi
    else
        log_error "API load test failed"
        return 1
    fi
}

# Run database load test
run_database_load_test() {
    log_info "Running database load test..."
    
    local report_file="$REPORT_DIR/database-load-test-$TIMESTAMP.json"
    local html_report="$REPORT_DIR/database-load-test-$TIMESTAMP.html"
    
    k6 run \
        --env API_URL="$API_URL" \
        --env AUTH_TOKEN="$AUTH_TOKEN" \
        --out json="$report_file" \
        tests/load/database-load-test.js
    
    if [ $? -eq 0 ]; then
        log_success "Database load test completed successfully"
        
        if command -v k6-to-html &> /dev/null; then
            k6-to-html "$report_file" --output "$html_report"
            log_info "HTML report generated: $html_report"
        fi
    else
        log_error "Database load test failed"
        return 1
    fi
}

# Run Redis cache test
run_redis_cache_test() {
    log_info "Running Redis cache performance test..."
    
    local report_file="$REPORT_DIR/redis-cache-test-$TIMESTAMP.json"
    local html_report="$REPORT_DIR/redis-cache-test-$TIMESTAMP.html"
    
    k6 run \
        --env API_URL="$API_URL" \
        --env AUTH_TOKEN="$AUTH_TOKEN" \
        --out json="$report_file" \
        tests/load/redis-cache-test.js
    
    if [ $? -eq 0 ]; then
        log_success "Redis cache test completed successfully"
        
        if command -v k6-to-html &> /dev/null; then
            k6-to-html "$report_file" --output "$html_report"
            log_info "HTML report generated: $html_report"
        fi
    else
        log_error "Redis cache test failed"
        return 1
    fi
}

# Generate comprehensive report
generate_comprehensive_report() {
    log_info "Generating comprehensive load test report..."
    
    local comprehensive_report="$REPORT_DIR/comprehensive-load-test-report-$TIMESTAMP.html"
    
    cat > "$comprehensive_report" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; }
        .success { border-left: 4px solid #28a745; }
        .warning { border-left: 4px solid #ffc107; }
        .error { border-left: 4px solid #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .metric { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h4 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .files { margin: 15px 0; }
        .files a { display: block; margin: 5px 0; color: #007bff; text-decoration: none; }
        .files a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Load Test Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>API URL:</strong> $API_URL</p>
        <p><strong>Test Duration:</strong> ~45 minutes total</p>
    </div>
    
    <div class="test-section success">
        <h2>API Load Test</h2>
        <p>Tests API performance under various load conditions (10-200 concurrent users)</p>
        <div class="metrics">
            <div class="metric">
                <h4>Peak Concurrent Users</h4>
                <div class="value">200</div>
            </div>
            <div class="metric">
                <h4>Test Duration</h4>
                <div class="value">~30 min</div>
            </div>
            <div class="metric">
                <h4>Target P95 Latency</h4>
                <div class="value">&lt; 500ms</div>
            </div>
            <div class="metric">
                <h4>Target Error Rate</h4>
                <div class="value">&lt; 5%</div>
            </div>
        </div>
        <div class="files">
            <a href="api-load-test-$TIMESTAMP.json">JSON Report</a>
            <a href="api-load-test-$TIMESTAMP.html">HTML Report</a>
        </div>
    </div>
    
    <div class="test-section success">
        <h2>Database Load Test</h2>
        <p>Tests database performance with connection pooling and complex queries</p>
        <div class="metrics">
            <div class="metric">
                <h4>Peak Concurrent Users</h4>
                <div class="value">150</div>
            </div>
            <div class="metric">
                <h4>Test Duration</h4>
                <div class="value">~20 min</div>
            </div>
            <div class="metric">
                <h4>Target DB Response</h4>
                <div class="value">&lt; 300ms P95</div>
            </div>
            <div class="metric">
                <h4>Target Error Rate</h4>
                <div class="value">&lt; 1%</div>
            </div>
        </div>
        <div class="files">
            <a href="database-load-test-$TIMESTAMP.json">JSON Report</a>
            <a href="database-load-test-$TIMESTAMP.html">HTML Report</a>
        </div>
    </div>
    
    <div class="test-section success">
        <h2>Redis Cache Test</h2>
        <p>Tests Redis caching performance and cache hit rates under load</p>
        <div class="metrics">
            <div class="metric">
                <h4>Peak Concurrent Users</h4>
                <div class="value">150</div>
            </div>
            <div class="metric">
                <h4>Test Duration</h4>
                <div class="value">~16 min</div>
            </div>
            <div class="metric">
                <h4>Target Cache Hit Rate</h4>
                <div class="value">&gt; 80%</div>
            </div>
            <div class="metric">
                <h4>Target Cache Response</h4>
                <div class="value">&lt; 50ms P95</div>
            </div>
        </div>
        <div class="files">
            <a href="redis-cache-test-$TIMESTAMP.json">JSON Report</a>
            <a href="redis-cache-test-$TIMESTAMP.html">HTML Report</a>
        </div>
    </div>
    
    <div class="test-section">
        <h2>Performance Budgets</h2>
        <ul>
            <li><strong>API P50 Latency:</strong> &lt; 200ms</li>
            <li><strong>API P95 Latency:</strong> &lt; 500ms</li>
            <li><strong>Database P95 Response:</strong> &lt; 300ms</li>
            <li><strong>Cache Hit Rate:</strong> &gt; 80%</li>
            <li><strong>Error Rate:</strong> &lt; 5% (API), &lt; 1% (Database)</li>
            <li><strong>Cache Response Time:</strong> &lt; 50ms P95</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>Test Scenarios</h2>
        <h3>API Load Test</h3>
        <ul>
            <li>40% Read operations (GET requests)</li>
            <li>30% Search and filter operations</li>
            <li>20% Write operations (POST, PUT, DELETE)</li>
            <li>10% Analytics and reporting</li>
        </ul>
        
        <h3>Database Load Test</h3>
        <ul>
            <li>30% Complex queries (joins, aggregations)</li>
            <li>30% Bulk operations</li>
            <li>20% Concurrent read/write operations</li>
            <li>20% Cache performance testing</li>
        </ul>
        
        <h3>Redis Cache Test</h3>
        <ul>
            <li>60% Hot data (high cache hit rate expected)</li>
            <li>25% Warm data (moderate cache hit rate)</li>
            <li>15% Cold data and cache invalidation</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Comprehensive report generated: $comprehensive_report"
}

# Print summary
print_summary() {
    log_info "Load Test Summary"
    echo "=================="
    echo "API URL: $API_URL"
    echo "Timestamp: $TIMESTAMP"
    echo "Reports Directory: $REPORT_DIR"
    echo ""
    echo "Test Files:"
    echo "- API Load Test: tests/load/api-load-test.js"
    echo "- Database Load Test: tests/load/database-load-test.js"
    echo "- Redis Cache Test: tests/load/redis-cache-test.js"
    echo ""
    echo "Generated Reports:"
    ls -la "$REPORT_DIR"/*"$TIMESTAMP"* 2>/dev/null || echo "No reports generated"
}

# Main execution
main() {
    log_info "Starting comprehensive load testing..."
    
    # Pre-flight checks
    check_k6
    check_api
    setup_reports
    
    # Run tests
    local failed_tests=0
    
    if ! run_api_load_test; then
        ((failed_tests++))
    fi
    
    if ! run_database_load_test; then
        ((failed_tests++))
    fi
    
    if ! run_redis_cache_test; then
        ((failed_tests++))
    fi
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [ $failed_tests -eq 0 ]; then
        log_success "All load tests completed successfully!"
        exit 0
    else
        log_error "$failed_tests load test(s) failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "api")
        check_k6
        check_api
        setup_reports
        run_api_load_test
        ;;
    "database")
        check_k6
        check_api
        setup_reports
        run_database_load_test
        ;;
    "redis")
        check_k6
        check_api
        setup_reports
        run_redis_cache_test
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [api|database|redis|help]"
        echo ""
        echo "Options:"
        echo "  api       Run only API load test"
        echo "  database  Run only database load test"
        echo "  redis     Run only Redis cache test"
        echo "  help      Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  API_URL      API base URL (default: http://localhost:3001)"
        echo "  AUTH_TOKEN   Authentication token (optional)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run all tests"
        echo "  $0 api               # Run only API test"
        echo "  API_URL=https://api.example.com $0  # Use custom API URL"
        exit 0
        ;;
    *)
        main
        ;;
esac