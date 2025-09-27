#!/bin/bash

# Visual Regression Testing Script
# Runs comprehensive visual regression tests for theme switching

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5173}"
HEADLESS="${HEADLESS:-true}"
BROWSERS="${BROWSERS:-chromium,firefox,webkit}"
UPDATE_SNAPSHOTS="${UPDATE_SNAPSHOTS:-false}"
REPORT_DIR="visual-test-results"

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

# Check if Playwright is installed
check_playwright() {
    if ! command -v npx playwright &> /dev/null; then
        log_error "Playwright is not installed. Please install it first:"
        log_info "  npm install -D @playwright/test"
        log_info "  npx playwright install"
        exit 1
    fi
    
    log_success "Playwright is available"
}

# Check if browsers are installed
check_browsers() {
    log_info "Checking browser installations..."
    
    if ! npx playwright install --dry-run &> /dev/null; then
        log_warning "Some browsers may not be installed. Installing now..."
        npx playwright install
    fi
    
    log_success "Browsers are ready"
}

# Check if development server is running
check_dev_server() {
    log_info "Checking development server at $BASE_URL..."
    
    local retries=30
    while [ $retries -gt 0 ]; do
        if curl -s -f "$BASE_URL" > /dev/null 2>&1; then
            log_success "Development server is running"
            return 0
        fi
        
        retries=$((retries - 1))
        if [ $retries -eq 0 ]; then
            log_error "Development server is not running at $BASE_URL"
            log_info "Please start the development server with: npm run dev"
            exit 1
        fi
        
        sleep 1
    done
}

# Setup test environment
setup_environment() {
    log_info "Setting up visual testing environment..."
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    # Set environment variables
    export PLAYWRIGHT_BASE_URL="$BASE_URL"
    export PLAYWRIGHT_HEADLESS="$HEADLESS"
    
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        export PLAYWRIGHT_UPDATE_SNAPSHOTS="true"
    fi
    
    log_success "Environment setup completed"
}

# Run visual regression tests
run_visual_tests() {
    log_info "Running visual regression tests..."
    
    local test_args=""
    
    # Add browser selection
    if [ "$BROWSERS" != "all" ]; then
        IFS=',' read -ra BROWSER_ARRAY <<< "$BROWSERS"
        for browser in "${BROWSER_ARRAY[@]}"; do
            test_args="$test_args --project=$browser-desktop"
        done
    fi
    
    # Add update snapshots flag if needed
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        test_args="$test_args --update-snapshots"
        log_warning "Running in update snapshots mode - this will update baseline images"
    fi
    
    # Run the tests
    if npx playwright test --config=playwright.visual.config.ts $test_args; then
        log_success "Visual regression tests completed successfully"
        return 0
    else
        log_error "Visual regression tests failed"
        return 1
    fi
}

# Generate visual test report
generate_report() {
    log_info "Generating visual test report..."
    
    # Generate HTML report
    if npx playwright show-report --config=playwright.visual.config.ts; then
        log_success "Visual test report generated"
    else
        log_warning "Failed to generate visual test report"
    fi
    
    # Copy report to results directory
    if [ -d "playwright-report" ]; then
        cp -r playwright-report/* "$REPORT_DIR/" 2>/dev/null || true
        log_info "Report copied to $REPORT_DIR"
    fi
}

# Analyze test results
analyze_results() {
    log_info "Analyzing visual test results..."
    
    local results_file="$REPORT_DIR/results.json"
    
    if [ -f "$results_file" ]; then
        local total_tests=$(jq -r '.stats.total // 0' "$results_file")
        local passed_tests=$(jq -r '.stats.passed // 0' "$results_file")
        local failed_tests=$(jq -r '.stats.failed // 0' "$results_file")
        local duration=$(jq -r '.stats.duration // 0' "$results_file")
        
        log_info "Test Results Summary:"
        echo "  Total Tests: $total_tests"
        echo "  Passed: $passed_tests"
        echo "  Failed: $failed_tests"
        echo "  Duration: $((duration / 1000))s"
        
        if [ "$failed_tests" -gt 0 ]; then
            log_warning "$failed_tests visual regression test(s) failed"
            log_info "Check the HTML report for details: $REPORT_DIR/index.html"
        else
            log_success "All visual regression tests passed!"
        fi
    else
        log_warning "No test results file found"
    fi
}

# Clean up old test artifacts
cleanup_old_artifacts() {
    log_info "Cleaning up old test artifacts..."
    
    # Remove old screenshots and diffs
    find "$REPORT_DIR" -name "*.png" -mtime +7 -delete 2>/dev/null || true
    find "$REPORT_DIR" -name "*-diff.png" -delete 2>/dev/null || true
    
    # Remove old reports
    find "$REPORT_DIR" -name "*.html" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Print usage information
print_usage() {
    echo "Visual Regression Testing Script"
    echo "================================"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --update-snapshots    Update baseline screenshots"
    echo "  --browsers <list>     Comma-separated list of browsers (chromium,firefox,webkit)"
    echo "  --headless <bool>     Run in headless mode (true/false)"
    echo "  --base-url <url>      Base URL for testing"
    echo "  --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL             Base URL for testing (default: http://localhost:5173)"
    echo "  HEADLESS             Run in headless mode (default: true)"
    echo "  BROWSERS             Browsers to test (default: chromium,firefox,webkit)"
    echo "  UPDATE_SNAPSHOTS     Update baseline screenshots (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 --update-snapshots                # Update baseline screenshots"
    echo "  $0 --browsers chromium               # Test only Chromium"
    echo "  $0 --base-url http://localhost:3000  # Use custom base URL"
    echo ""
    echo "Reports will be generated in: $REPORT_DIR"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --update-snapshots)
                UPDATE_SNAPSHOTS="true"
                shift
                ;;
            --browsers)
                BROWSERS="$2"
                shift 2
                ;;
            --headless)
                HEADLESS="$2"
                shift 2
                ;;
            --base-url)
                BASE_URL="$2"
                shift 2
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    log_info "Starting visual regression testing..."
    
    # Pre-flight checks
    check_playwright
    check_browsers
    check_dev_server
    
    # Setup
    setup_environment
    cleanup_old_artifacts
    
    # Run tests
    local test_exit_code=0
    if ! run_visual_tests; then
        test_exit_code=1
    fi
    
    # Generate reports
    generate_report
    analyze_results
    
    # Print final status
    if [ $test_exit_code -eq 0 ]; then
        log_success "Visual regression testing completed successfully!"
        log_info "View the report at: $REPORT_DIR/index.html"
    else
        log_error "Visual regression testing failed"
        log_info "Check the report for details: $REPORT_DIR/index.html"
    fi
    
    exit $test_exit_code
}

# Handle script arguments
if [ $# -eq 0 ]; then
    main
else
    parse_arguments "$@"
    main
fi