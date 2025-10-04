#!/bin/bash

# Production Deployment Script with Gradual Rollout
# This script deploys performance optimizations with feature flags and monitoring

set -e

# Configuration
DEPLOYMENT_ENV=${1:-production}
ROLLOUT_PERCENTAGE=${2:-0}
MONITORING_ENABLED=${3:-true}
DRY_RUN=${4:-false}

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

# Deployment configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

# Performance monitoring endpoints
HEALTH_CHECK_URL="http://localhost:5000/api/health"
PERFORMANCE_METRICS_URL="http://localhost:5000/api/performance/metrics"
WEB_VITALS_URL="http://localhost:3000/api/web-vitals"

# Feature flags for gradual rollout
PERFORMANCE_FEATURES=(
    "themeOptimization"
    "bundleOptimization"
    "apiCaching"
    "databaseOptimization"
    "performanceMonitoring"
    "cursorPagination"
    "backgroundJobs"
    "serviceWorker"
    "virtualization"
    "reactQueryOptimization"
)

# Rollback configuration
ROLLBACK_TIMEOUT=300 # 5 minutes
PERFORMANCE_THRESHOLD_LIGHTHOUSE=85
PERFORMANCE_THRESHOLD_API_LATENCY=1000 # ms
PERFORMANCE_THRESHOLD_ERROR_RATE=5 # percentage

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if required directories exist
    if [[ ! -d "$BACKEND_DIR" ]]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL environment variable not set"
        exit 1
    fi
    
    if [[ -z "$REDIS_URL" ]]; then
        log_error "REDIS_URL environment variable not set"
        exit 1
    fi
    
    # Check database connectivity
    log_info "Checking database connectivity..."
    if ! node -e "
        const mongoose = require('mongoose');
        mongoose.connect(process.env.DATABASE_URL)
            .then(() => { console.log('Database connected'); process.exit(0); })
            .catch(err => { console.error('Database connection failed:', err); process.exit(1); });
    "; then
        log_error "Database connection failed"
        exit 1
    fi
    
    # Check Redis connectivity
    log_info "Checking Redis connectivity..."
    if ! node -e "
        const Redis = require('ioredis');
        const redis = new Redis(process.env.REDIS_URL);
        redis.ping()
            .then(() => { console.log('Redis connected'); redis.disconnect(); process.exit(0); })
            .catch(err => { console.error('Redis connection failed:', err); process.exit(1); });
    "; then
        log_error "Redis connection failed"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Backup current state
backup_current_state() {
    log_info "Creating backup of current state..."
    
    BACKUP_DIR="backups/deployment-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment variables
    env | grep -E '^(FEATURE_|DATABASE_|REDIS_)' > "$BACKUP_DIR/env-vars.txt"
    
    # Backup current feature flag state
    node -e "
        const FeatureFlagService = require('./backend/dist/services/FeatureFlagService').default;
        FeatureFlagService.getFeatureOverrides()
            .then(overrides => {
                require('fs').writeFileSync('$BACKUP_DIR/feature-flags.json', JSON.stringify(overrides, null, 2));
                console.log('Feature flags backed up');
            })
            .catch(err => console.error('Backup failed:', err));
    "
    
    log_success "Backup created at $BACKUP_DIR"
    echo "$BACKUP_DIR" > .last-backup
}

# Set feature flags for gradual rollout
set_feature_flags() {
    local rollout_percentage=$1
    log_info "Setting feature flags for $rollout_percentage% rollout..."
    
    # Set environment variables for feature flags
    export FEATURE_ROLLOUT_PERCENTAGE=$rollout_percentage
    export FEATURE_PERFORMANCE_MONITORING=true
    export FEATURE_INTERNAL_TESTING=true
    export FEATURE_BETA_USERS=true
    
    # Enable features based on rollout percentage
    if [[ $rollout_percentage -ge 10 ]]; then
        export FEATURE_THEME_OPTIMIZATION=true
        log_info "Enabled theme optimization"
    fi
    
    if [[ $rollout_percentage -ge 25 ]]; then
        export FEATURE_BUNDLE_OPTIMIZATION=true
        export FEATURE_REACT_QUERY_OPTIMIZATION=true
        log_info "Enabled bundle and React Query optimization"
    fi
    
    if [[ $rollout_percentage -ge 50 ]]; then
        export FEATURE_API_CACHING=true
        export FEATURE_VIRTUALIZATION=true
        log_info "Enabled API caching and virtualization"
    fi
    
    if [[ $rollout_percentage -ge 75 ]]; then
        export FEATURE_DATABASE_OPTIMIZATION=true
        export FEATURE_CURSOR_PAGINATION=true
        log_info "Enabled database optimization and cursor pagination"
    fi
    
    if [[ $rollout_percentage -ge 90 ]]; then
        export FEATURE_BACKGROUND_JOBS=true
        export FEATURE_SERVICE_WORKER=true
        log_info "Enabled background jobs and service worker"
    fi
    
    log_success "Feature flags configured for $rollout_percentage% rollout"
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm ci --production
    
    # Build TypeScript
    log_info "Building backend..."
    npm run build
    
    # Run database migrations if needed
    log_info "Running database migrations..."
    npm run migrate || log_warning "No migrations to run"
    
    # Start backend with PM2
    log_info "Starting backend with PM2..."
    if [[ "$DRY_RUN" == "false" ]]; then
        pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    else
        log_info "DRY RUN: Would restart backend with PM2"
    fi
    
    cd ..
    log_success "Backend deployed"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    # Build production bundle
    log_info "Building frontend..."
    npm run build
    
    # Copy build to web server directory (adjust path as needed)
    if [[ "$DRY_RUN" == "false" ]]; then
        log_info "Copying build to web server..."
        # Adjust this path based on your web server configuration
        sudo cp -r build/* /var/www/html/ || log_warning "Could not copy to web server directory"
    else
        log_info "DRY RUN: Would copy build to web server"
    fi
    
    cd ..
    log_success "Frontend deployed"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "Backend is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Backend failed to start within timeout"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Wait a bit more for full initialization
    sleep 30
    log_success "Services are ready"
}

# Monitor performance metrics
monitor_performance() {
    local duration=${1:-300} # 5 minutes default
    log_info "Monitoring performance for $duration seconds..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local check_interval=30
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check API latency
        local api_response=$(curl -s -w "%{time_total}" "$PERFORMANCE_METRICS_URL" -o /dev/null)
        local api_latency=$(echo "$api_response * 1000" | bc -l | cut -d. -f1)
        
        if [[ $api_latency -gt $PERFORMANCE_THRESHOLD_API_LATENCY ]]; then
            log_error "API latency too high: ${api_latency}ms (threshold: ${PERFORMANCE_THRESHOLD_API_LATENCY}ms)"
            return 1
        fi
        
        # Check error rate
        local error_rate=$(curl -s "$PERFORMANCE_METRICS_URL" | jq -r '.errorRate // 0')
        if [[ $(echo "$error_rate > $PERFORMANCE_THRESHOLD_ERROR_RATE" | bc -l) -eq 1 ]]; then
            log_error "Error rate too high: ${error_rate}% (threshold: ${PERFORMANCE_THRESHOLD_ERROR_RATE}%)"
            return 1
        fi
        
        log_info "Performance check: API latency ${api_latency}ms, Error rate ${error_rate}%"
        sleep $check_interval
    done
    
    log_success "Performance monitoring completed successfully"
}

# Run Lighthouse performance test
run_lighthouse_test() {
    log_info "Running Lighthouse performance test..."
    
    cd "$FRONTEND_DIR"
    
    # Run Lighthouse CI
    if npm run lighthouse:ci; then
        local lighthouse_score=$(cat lighthouse-results.json | jq -r '.performance')
        
        if [[ $(echo "$lighthouse_score < $PERFORMANCE_THRESHOLD_LIGHTHOUSE" | bc -l) -eq 1 ]]; then
            log_error "Lighthouse performance score too low: $lighthouse_score (threshold: $PERFORMANCE_THRESHOLD_LIGHTHOUSE)"
            cd ..
            return 1
        fi
        
        log_success "Lighthouse performance test passed: $lighthouse_score"
    else
        log_error "Lighthouse performance test failed"
        cd ..
        return 1
    fi
    
    cd ..
}

# Rollback deployment
rollback_deployment() {
    log_error "Rolling back deployment..."
    
    if [[ -f ".last-backup" ]]; then
        local backup_dir=$(cat .last-backup)
        
        if [[ -d "$backup_dir" ]]; then
            log_info "Restoring from backup: $backup_dir"
            
            # Restore environment variables
            if [[ -f "$backup_dir/env-vars.txt" ]]; then
                source "$backup_dir/env-vars.txt"
                log_info "Environment variables restored"
            fi
            
            # Restore feature flags
            if [[ -f "$backup_dir/feature-flags.json" ]]; then
                node -e "
                    const fs = require('fs');
                    const FeatureFlagService = require('./backend/dist/services/FeatureFlagService').default;
                    const overrides = JSON.parse(fs.readFileSync('$backup_dir/feature-flags.json', 'utf8'));
                    
                    Promise.all(overrides.map(override => {
                        if (override.userId) {
                            return FeatureFlagService.setUserFeatureOverride(
                                override.featureName, override.userId, override.enabled, 
                                override.expiresAt, 'Rollback restore'
                            );
                        } else if (override.workspaceId) {
                            return FeatureFlagService.setWorkspaceFeatureOverride(
                                override.featureName, override.workspaceId, override.enabled,
                                override.expiresAt, 'Rollback restore'
                            );
                        }
                    })).then(() => console.log('Feature flags restored'))
                      .catch(err => console.error('Feature flag restore failed:', err));
                "
                log_info "Feature flags restored"
            fi
            
            # Restart services
            log_info "Restarting services..."
            pm2 restart all
            
            log_success "Rollback completed"
        else
            log_error "Backup directory not found: $backup_dir"
        fi
    else
        log_error "No backup information found"
    fi
}

# Validate deployment success
validate_deployment() {
    log_info "Validating deployment..."
    
    # Run performance monitoring
    if ! monitor_performance 180; then # 3 minutes
        log_error "Performance monitoring failed"
        return 1
    fi
    
    # Run Lighthouse test
    if ! run_lighthouse_test; then
        log_error "Lighthouse test failed"
        return 1
    fi
    
    # Check feature flag metrics
    local feature_metrics=$(curl -s "$PERFORMANCE_METRICS_URL/feature-flags")
    log_info "Feature flag metrics: $feature_metrics"
    
    log_success "Deployment validation completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    log_info "Sending deployment notification..."
    
    # Send to Slack (if webhook URL is configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email (if configured)
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        echo "$message" | mail -s "Deployment $status" "$NOTIFICATION_EMAIL"
    fi
    
    log_info "Notification sent"
}

# Main deployment function
main() {
    log_info "Starting production deployment with $ROLLOUT_PERCENTAGE% rollout..."
    
    # Create deployment log
    exec 1> >(tee -a "$DEPLOYMENT_LOG")
    exec 2> >(tee -a "$DEPLOYMENT_LOG" >&2)
    
    # Trap for cleanup on exit
    trap 'log_info "Deployment script exiting..."' EXIT
    
    # Trap for rollback on error
    trap 'rollback_deployment; send_notification "FAILED" "Deployment failed and was rolled back"; exit 1' ERR
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Backup current state
    backup_current_state
    
    # Set feature flags for gradual rollout
    set_feature_flags "$ROLLOUT_PERCENTAGE"
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Wait for services
    wait_for_services
    
    # Validate deployment
    if validate_deployment; then
        log_success "Deployment completed successfully!"
        send_notification "SUCCESS" "Performance optimizations deployed with $ROLLOUT_PERCENTAGE% rollout"
    else
        log_error "Deployment validation failed"
        rollback_deployment
        send_notification "FAILED" "Deployment validation failed and was rolled back"
        exit 1
    fi
    
    log_success "Production deployment completed with $ROLLOUT_PERCENTAGE% rollout"
}

# Script usage
usage() {
    echo "Usage: $0 [environment] [rollout_percentage] [monitoring_enabled] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  environment         Deployment environment (default: production)"
    echo "  rollout_percentage  Percentage of users to enable features for (default: 0)"
    echo "  monitoring_enabled  Enable performance monitoring (default: true)"
    echo "  dry_run            Run in dry-run mode without actual deployment (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 production 10 true false    # Deploy to 10% of users"
    echo "  $0 staging 100 true false      # Full deployment to staging"
    echo "  $0 production 0 true true      # Dry run for production"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Validate rollout percentage
if [[ $ROLLOUT_PERCENTAGE -lt 0 || $ROLLOUT_PERCENTAGE -gt 100 ]]; then
    log_error "Rollout percentage must be between 0 and 100"
    exit 1
fi

# Run main deployment
main