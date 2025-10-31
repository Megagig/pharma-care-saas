#!/bin/bash

# Patient Engagement Load Testing Execution Script
# 
# This script orchestrates the complete load testing process including:
# - Environment setup and validation
# - Test data preparation
# - Load test execution
# - Results analysis and reporting
# - Cleanup operations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
RESULTS_DIR="$SCRIPT_DIR/results"
REPORTS_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/load-test-execution.log"

# Test configuration
TARGET_URL="${TARGET_URL:-http://localhost:5000}"
TEST_DURATION="${TEST_DURATION:-600}"  # 10 minutes default
CONCURRENT_USERS="${CONCURRENT_USERS:-1000}"
CLEANUP_AFTER="${CLEANUP_AFTER:-true}"

# Ensure directories exist
mkdir -p "$RESULTS_DIR" "$REPORTS_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
        error_exit "Backend directory not found. Please run from the correct location."
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm is not installed"
    fi
    
    # Check if Artillery is available
    if ! command -v artillery &> /dev/null && ! npm list artillery &> /dev/null; then
        log "WARN" "Artillery not found globally, installing locally..."
        cd "$BACKEND_DIR"
        npm install artillery --save-dev
    fi
    
    # Check MongoDB connection
    if ! mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        log "WARN" "MongoDB connection test failed. Make sure MongoDB is running."
    fi
    
    # Check Redis connection
    if ! redis-cli ping &> /dev/null; then
        log "WARN" "Redis connection test failed. Make sure Redis is running."
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Setup test environment
setup_environment() {
    log "INFO" "Setting up test environment..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log "INFO" "Installing dependencies..."
        npm install
    fi
    
    # Set environment variables for testing
    export NODE_ENV=test
    export DISABLE_RATE_LIMITING=true
    export MEMORY_MONITORING_ENABLED=false
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        set -a
        source .env
        set +a
    fi
    
    log "INFO" "Environment setup completed"
}

# Setup test data
setup_test_data() {
    log "INFO" "Setting up test data..."
    
    cd "$BACKEND_DIR"
    
    # Run test data setup script
    if ! npm run load-test:setup setup; then
        error_exit "Failed to setup test data"
    fi
    
    # Generate authentication token
    log "INFO" "Generating authentication token..."
    if ! npm run load-test:setup token > /tmp/auth_token.txt 2>&1; then
        error_exit "Failed to generate authentication token"
    fi
    
    # Extract token from output
    AUTH_TOKEN=$(grep "export TEST_AUTH_TOKEN" /tmp/auth_token.txt | cut -d'"' -f2)
    if [[ -n "$AUTH_TOKEN" ]]; then
        export TEST_AUTH_TOKEN="$AUTH_TOKEN"
        log "INFO" "Authentication token generated successfully"
    else
        log "WARN" "Could not extract authentication token from output"
    fi
    
    log "INFO" "Test data setup completed"
}

# Start backend server if not running
start_backend_server() {
    log "INFO" "Checking backend server status..."
    
    # Check if server is already running
    if curl -s "$TARGET_URL/api/health" > /dev/null 2>&1; then
        log "INFO" "Backend server is already running at $TARGET_URL"
        return 0
    fi
    
    log "INFO" "Starting backend server..."
    cd "$BACKEND_DIR"
    
    # Start server in background
    npm run dev > "$SCRIPT_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    local attempts=0
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if curl -s "$TARGET_URL/api/health" > /dev/null 2>&1; then
            log "INFO" "Backend server started successfully (PID: $SERVER_PID)"
            echo "$SERVER_PID" > "$SCRIPT_DIR/server.pid"
            return 0
        fi
        
        sleep 2
        ((attempts++))
        log "DEBUG" "Waiting for server to start... (attempt $attempts/$max_attempts)"
    done
    
    error_exit "Backend server failed to start within $((max_attempts * 2)) seconds"
}

# Stop backend server
stop_backend_server() {
    if [[ -f "$SCRIPT_DIR/server.pid" ]]; then
        local pid=$(cat "$SCRIPT_DIR/server.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Stopping backend server (PID: $pid)..."
            kill "$pid"
            rm -f "$SCRIPT_DIR/server.pid"
        fi
    fi
}

# Run individual load test
run_load_test() {
    local test_name=$1
    local test_file=$2
    local output_file="$RESULTS_DIR/${test_name}-$(date +%Y%m%d-%H%M%S).json"
    
    log "INFO" "Running $test_name load test..."
    log "DEBUG" "Test file: $test_file"
    log "DEBUG" "Output file: $output_file"
    log "DEBUG" "Target URL: $TARGET_URL"
    
    cd "$SCRIPT_DIR"
    
    # Run Artillery test with custom configuration
    local artillery_cmd="artillery run"
    artillery_cmd="$artillery_cmd --target $TARGET_URL"
    artillery_cmd="$artillery_cmd --output $output_file"
    
    # Add custom overrides if specified
    if [[ -n "$TEST_DURATION" ]]; then
        local override="{\"config\":{\"phases\":[{\"duration\":$TEST_DURATION,\"arrivalRate\":50,\"rampTo\":$CONCURRENT_USERS}]}}"
        artillery_cmd="$artillery_cmd --overrides '$override'"
    fi
    
    artillery_cmd="$artillery_cmd $test_file"
    
    log "DEBUG" "Artillery command: $artillery_cmd"
    
    # Execute the test
    if eval "$artillery_cmd"; then
        log "INFO" "$test_name test completed successfully"
        
        # Generate report
        if [[ -f "$output_file" ]]; then
            log "INFO" "Generating report for $test_name..."
            cd "$BACKEND_DIR"
            npm run load-test:report generate "$test_name" "$output_file" || log "WARN" "Report generation failed for $test_name"
        fi
        
        return 0
    else
        log "ERROR" "$test_name test failed"
        return 1
    fi
}

# Run all load tests
run_all_tests() {
    log "INFO" "Starting comprehensive load test suite..."
    
    local tests=(
        "main:load-test-config.yml"
        "appointments:appointments-load-test.yml"
        "followups:followups-load-test.yml"
        "websockets:websockets-load-test.yml"
        "database:database-load-test.yml"
    )
    
    local passed_tests=0
    local failed_tests=0
    local test_results=()
    
    for test_spec in "${tests[@]}"; do
        IFS=':' read -r test_name test_file <<< "$test_spec"
        
        log "INFO" "=========================================="
        log "INFO" "Running test: $test_name"
        log "INFO" "=========================================="
        
        if run_load_test "$test_name" "$test_file"; then
            ((passed_tests++))
            test_results+=("✅ $test_name: PASSED")
        else
            ((failed_tests++))
            test_results+=("❌ $test_name: FAILED")
        fi
        
        # Wait between tests to allow system recovery
        if [[ $test_name != "database" ]]; then  # Don't wait after the last test
            log "INFO" "Waiting 30 seconds before next test..."
            sleep 30
        fi
    done
    
    # Print summary
    log "INFO" "=========================================="
    log "INFO" "LOAD TEST SUITE SUMMARY"
    log "INFO" "=========================================="
    log "INFO" "Total tests: $((passed_tests + failed_tests))"
    log "INFO" "Passed: $passed_tests"
    log "INFO" "Failed: $failed_tests"
    log "INFO" ""
    
    for result in "${test_results[@]}"; do
        log "INFO" "$result"
    done
    
    log "INFO" "=========================================="
    
    # Generate combined report
    log "INFO" "Generating combined test report..."
    cd "$BACKEND_DIR"
    npm run load-test:report run-all || log "WARN" "Combined report generation failed"
    
    return $failed_tests
}

# Monitor system resources during tests
start_monitoring() {
    log "INFO" "Starting system monitoring..."
    
    local monitor_file="$SCRIPT_DIR/system-monitor.log"
    
    # Monitor system resources
    {
        echo "Timestamp,CPU%,Memory%,DiskIO,NetworkIO"
        while true; do
            local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            local cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
            local memory=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
            local disk_io=$(iostat -d 1 1 | tail -n +4 | awk '{sum+=$4} END {print sum}')
            local network_io=$(cat /proc/net/dev | awk 'NR>2{sum+=$2+$10} END {print sum}')
            
            echo "$timestamp,$cpu,$memory,$disk_io,$network_io"
            sleep 5
        done
    } > "$monitor_file" &
    
    MONITOR_PID=$!
    echo "$MONITOR_PID" > "$SCRIPT_DIR/monitor.pid"
    log "DEBUG" "System monitoring started (PID: $MONITOR_PID)"
}

# Stop system monitoring
stop_monitoring() {
    if [[ -f "$SCRIPT_DIR/monitor.pid" ]]; then
        local pid=$(cat "$SCRIPT_DIR/monitor.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Stopping system monitoring (PID: $pid)..."
            kill "$pid"
            rm -f "$SCRIPT_DIR/monitor.pid"
        fi
    fi
}

# Cleanup test data
cleanup_test_data() {
    if [[ "$CLEANUP_AFTER" == "true" ]]; then
        log "INFO" "Cleaning up test data..."
        cd "$BACKEND_DIR"
        npm run load-test:cleanup full || log "WARN" "Test data cleanup failed"
    else
        log "INFO" "Skipping test data cleanup (CLEANUP_AFTER=false)"
    fi
}

# Validate test results
validate_results() {
    log "INFO" "Validating test results..."
    
    local validation_passed=true
    local result_files=("$RESULTS_DIR"/*.json)
    
    if [[ ${#result_files[@]} -eq 0 ]]; then
        log "ERROR" "No test result files found"
        return 1
    fi
    
    for result_file in "${result_files[@]}"; do
        if [[ -f "$result_file" ]]; then
            # Basic validation - check if file contains expected structure
            if ! jq -e '.aggregate' "$result_file" > /dev/null 2>&1; then
                log "WARN" "Invalid result file format: $(basename "$result_file")"
                validation_passed=false
            else
                log "DEBUG" "Valid result file: $(basename "$result_file")"
            fi
        fi
    done
    
    if [[ "$validation_passed" == "true" ]]; then
        log "INFO" "Result validation passed"
        return 0
    else
        log "ERROR" "Result validation failed"
        return 1
    fi
}

# Generate performance summary
generate_summary() {
    log "INFO" "Generating performance summary..."
    
    local summary_file="$REPORTS_DIR/performance-summary-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "PATIENT ENGAGEMENT LOAD TEST SUMMARY"
        echo "====================================="
        echo "Date: $(date)"
        echo "Target: $TARGET_URL"
        echo "Duration: ${TEST_DURATION}s"
        echo "Max Concurrent Users: $CONCURRENT_USERS"
        echo ""
        
        echo "SYSTEM INFORMATION:"
        echo "OS: $(uname -s) $(uname -r)"
        echo "CPU: $(nproc) cores"
        echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
        echo "Node.js: $(node --version)"
        echo ""
        
        echo "TEST RESULTS:"
        local result_files=("$RESULTS_DIR"/*.json)
        for result_file in "${result_files[@]}"; do
            if [[ -f "$result_file" ]]; then
                local test_name=$(basename "$result_file" | cut -d'-' -f1)
                echo "- $test_name: $(jq -r '.aggregate.counters."http.requests"' "$result_file" 2>/dev/null || echo "N/A") requests"
            fi
        done
        
        echo ""
        echo "FILES GENERATED:"
        echo "- Results: $RESULTS_DIR"
        echo "- Reports: $REPORTS_DIR"
        echo "- Logs: $LOG_FILE"
        
    } > "$summary_file"
    
    log "INFO" "Performance summary saved to: $summary_file"
    
    # Display summary
    cat "$summary_file"
}

# Main execution function
main() {
    local command=${1:-"all"}
    
    log "INFO" "Starting Patient Engagement Load Testing Suite"
    log "INFO" "Command: $command"
    log "INFO" "Target URL: $TARGET_URL"
    log "INFO" "Log file: $LOG_FILE"
    
    # Trap to ensure cleanup on exit
    trap 'stop_backend_server; stop_monitoring; log "INFO" "Load testing interrupted"' INT TERM
    
    case $command in
        "setup")
            check_prerequisites
            setup_environment
            setup_test_data
            ;;
        "run")
            local test_name=${2:-"main"}
            local test_file=${3:-"load-test-config.yml"}
            check_prerequisites
            setup_environment
            start_backend_server
            start_monitoring
            run_load_test "$test_name" "$test_file"
            stop_monitoring
            validate_results
            ;;
        "all"|"full")
            check_prerequisites
            setup_environment
            setup_test_data
            start_backend_server
            start_monitoring
            
            local exit_code=0
            if ! run_all_tests; then
                exit_code=1
            fi
            
            stop_monitoring
            validate_results
            generate_summary
            cleanup_test_data
            
            if [[ $exit_code -eq 0 ]]; then
                log "INFO" "🎉 All load tests completed successfully!"
            else
                log "ERROR" "❌ Some load tests failed. Check the logs for details."
            fi
            
            exit $exit_code
            ;;
        "cleanup")
            cleanup_test_data
            ;;
        "report")
            cd "$BACKEND_DIR"
            npm run load-test:report run-all
            ;;
        "help"|"--help"|"-h")
            echo "Patient Engagement Load Testing Suite"
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  setup          Setup test environment and data"
            echo "  run [test]     Run specific load test"
            echo "  all|full       Run complete load test suite (default)"
            echo "  cleanup        Clean up test data"
            echo "  report         Generate reports from existing results"
            echo "  help           Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  TARGET_URL           Target server URL (default: http://localhost:5000)"
            echo "  TEST_DURATION        Test duration in seconds (default: 600)"
            echo "  CONCURRENT_USERS     Maximum concurrent users (default: 1000)"
            echo "  CLEANUP_AFTER        Cleanup test data after tests (default: true)"
            echo ""
            echo "Examples:"
            echo "  $0 setup                    # Setup test environment"
            echo "  $0 run appointments         # Run appointments test only"
            echo "  $0 all                      # Run complete test suite"
            echo "  TARGET_URL=http://staging.example.com $0 all"
            ;;
        *)
            log "ERROR" "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"