#!/bin/bash

# Performance Optimization Deployment Script with Feature Flags
# This script deploys performance optimizations using feature flags for safe rollout

set -e

# Configuration
DEPLOYMENT_ENV=${1:-production}
ROLLOUT_PERCENTAGE=${2:-0}
DRY_RUN=${3:-false}

echo "🚀 Starting Performance Optimization Deployment"
echo "Environment: $DEPLOYMENT_ENV"
echo "Rollout Percentage: $ROLLOUT_PERCENTAGE%"
echo "Dry Run: $DRY_RUN"
echo "Timestamp: $(date)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { error "npm is required but not installed."; exit 1; }
    command -v pm2 >/dev/null 2>&1 || { error "PM2 is required but not installed."; exit 1; }
    command -v mongo >/dev/null 2>&1 || { error "MongoDB CLI is required but not installed."; exit 1; }
    command -v redis-cli >/dev/null 2>&1 || { error "Redis CLI is required but not installed."; exit 1; }
    
    # Check if services are running
    if ! pm2 list | grep -q "backend"; then
        error "Backend service not found in PM2"
        exit 1
    fi
    
    # Check database connectivity
    if ! mongo --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        error "Cannot connect to MongoDB"
        exit 1
    fi
    
    # Check Redis connectivity
    if ! redis-cli ping >/dev/null 2>&1; then
        error "Cannot connect to Redis"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup before deployment
create_backup() {
    log "Creating backup before deployment..."
    
    BACKUP_DIR="/backup/performance-optimization-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log "Backing up MongoDB..."
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb" || {
        error "MongoDB backup failed"
        exit 1
    }
    
    # Backup Redis
    log "Backing up Redis..."
    redis-cli --rdb "$BACKUP_DIR/redis-backup.rdb" || {
        error "Redis backup failed"
        exit 1
    }
    
    # Backup current application code
    log "Backing up application code..."
    tar -czf "$BACKUP_DIR/application-backup.tar.gz" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=build \
        --exclude=dist \
        . || {
        error "Application backup failed"
        exit 1
    }
    
    echo "$BACKUP_DIR" > .last-backup-path
    success "Backup created at $BACKUP_DIR"
}

# Set feature flags based on rollout percentage
set_feature_flags() {
    log "Setting feature flags for $ROLLOUT_PERCENTAGE% rollout..."
    
    # Base feature flags (always start with monitoring enabled)
    export FEATURE_PERFORMANCE_MONITORING=true
    
    # Gradual rollout feature flags
    if [ "$ROLLOUT_PERCENTAGE" -gt 0 ]; then
        export FEATURE_THEME_OPTIMIZATION=true
        export FEATURE_BUNDLE_OPTIMIZATION=true
        export FEATURE_API_CACHING=true
        export FEATURE_DATABASE_OPTIMIZATION=true
    else
        export FEATURE_THEME_OPTIMIZATION=false
        export FEATURE_BUNDLE_OPTIMIZATION=false
        export FEATURE_API_CACHING=false
        export FEATURE_DATABASE_OPTIMIZATION=false
    fi
    
    # Advanced features (enabled at higher rollout percentages)
    if [ "$ROLLOUT_PERCENTAGE" -gt 25 ]; then
        export FEATURE_VIRTUALIZATION=true
        export FEATURE_REACT_QUERY_OPTIMIZATION=true
        export FEATURE_CURSOR_PAGINATION=true
    else
        export FEATURE_VIRTUALIZATION=false
        export FEATURE_REACT_QUERY_OPTIMIZATION=false
        export FEATURE_CURSOR_PAGINATION=false
    fi
    
    # Premium features (enabled at high rollout percentages)
    if [ "$ROLLOUT_PERCENTAGE" -gt 75 ]; then
        export FEATURE_SERVICE_WORKER=true
        export FEATURE_BACKGROUND_JOBS=true
    else
        export FEATURE_SERVICE_WORKER=false
        export FEATURE_BACKGROUND_JOBS=false
    fi
    
    # Set rollout percentage
    export FEATURE_ROLLOUT_PERCENTAGE="$ROLLOUT_PERCENTAGE"
    
    # Save feature flags to environment file
    cat > .env.performance << EOF
FEATURE_PERFORMANCE_MONITORING=$FEATURE_PERFORMANCE_MONITORING
FEATURE_THEME_OPTIMIZATION=$FEATURE_THEME_OPTIMIZATION
FEATURE_BUNDLE_OPTIMIZATION=$FEATURE_BUNDLE_OPTIMIZATION
FEATURE_API_CACHING=$FEATURE_API_CACHING
FEATURE_DATABASE_OPTIMIZATION=$FEATURE_DATABASE_OPTIMIZATION
FEATURE_VIRTUALIZATION=$FEATURE_VIRTUALIZATION
FEATURE_REACT_QUERY_OPTIMIZATION=$FEATURE_REACT_QUERY_OPTIMIZATION
FEATURE_CURSOR_PAGINATION=$FEATURE_CURSOR_PAGINATION
FEATURE_SERVICE_WORKER=$FEATURE_SERVICE_WORKER
FEATURE_BACKGROUND_JOBS=$FEATURE_BACKGROUND_JOBS
FEATURE_ROLLOUT_PERCENTAGE=$FEATURE_ROLLOUT_PERCENTAGE
EOF
    
    success "Feature flags configured for $ROLLOUT_PERCENTAGE% rollout"
}

# Deploy backend optimizations
deploy_backend() {
    log "Deploying backend optimizations..."
    
    cd backend
    
    # Install dependencies
    log "Installing backend dependencies..."
    npm ci --production || {
        error "Backend dependency installation failed"
        exit 1
    }
    
    # Build backend
    log "Building backend..."
    npm run build || {
        error "Backend build failed"
        exit 1
    }
    
    # Run database migrations if needed
    if [ "$FEATURE_DATABASE_OPTIMIZATION" = "true" ]; then
        log "Running database optimizations..."
        node dist/scripts/optimizeDatabaseIndexes.js || {
            warning "Database optimization script failed, continuing..."
        }
    fi
    
    # Restart backend service
    if [ "$DRY_RUN" = "false" ]; then
        log "Restarting backend service..."
        pm2 restart backend || {
            error "Backend restart failed"
            exit 1
        }
        
        # Wait for service to be ready
        sleep 10
        
        # Health check
        if ! curl -f http://localhost:5000/health >/dev/null 2>&1; then
            error "Backend health check failed"
            exit 1
        fi
    else
        log "DRY RUN: Would restart backend service"
    fi
    
    cd ..
    success "Backend deployment completed"
}

# Deploy frontend optimizations
deploy_frontend() {
    log "Deploying frontend optimizations..."
    
    cd frontend
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci || {
        error "Frontend dependency installation failed"
        exit 1
    }
    
    # Build frontend with optimizations
    log "Building frontend with optimizations..."
    npm run build || {
        error "Frontend build failed"
        exit 1
    }
    
    # Deploy frontend
    if [ "$DRY_RUN" = "false" ]; then
        log "Deploying frontend..."
        npm run deploy || {
            error "Frontend deployment failed"
            exit 1
        }
        
        # Wait for deployment to propagate
        sleep 5
        
        # Health check
        if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
            error "Frontend health check failed"
            exit 1
        fi
    else
        log "DRY RUN: Would deploy frontend"
    fi
    
    cd ..
    success "Frontend deployment completed"
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    
    # Basic health checks
    log "Running health checks..."
    if ! curl -f http://localhost:3000/health >/dev/null 2>&1; then
        error "Frontend health check failed"
        return 1
    fi
    
    if ! curl -f http://localhost:5000/health >/dev/null 2>&1; then
        error "Backend health check failed"
        return 1
    fi
    
    # Performance validation
    log "Running performance validation..."
    if command -v lighthouse >/dev/null 2>&1; then
        LIGHTHOUSE_SCORE=$(lighthouse http://localhost:3000 --output=json --quiet | jq -r '.categories.performance.score * 100' 2>/dev/null || echo "0")
        if [ "${LIGHTHOUSE_SCORE%.*}" -lt 80 ]; then
            warning "Lighthouse performance score is low: $LIGHTHOUSE_SCORE"
        else
            success "Lighthouse performance score: $LIGHTHOUSE_SCORE"
        fi
    else
        warning "Lighthouse not available for performance validation"
    fi
    
    # API response time validation
    log "Validating API response times..."
    API_RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:5000/api/patients 2>/dev/null || echo "999")
    if [ "${API_RESPONSE_TIME%.*}" -gt 2 ]; then
        warning "API response time is high: ${API_RESPONSE_TIME}s"
    else
        success "API response time: ${API_RESPONSE_TIME}s"
    fi
    
    # Feature flag validation
    log "Validating feature flags..."
    if curl -s http://localhost:5000/api/admin/feature-flags >/dev/null 2>&1; then
        success "Feature flags endpoint accessible"
    else
        warning "Feature flags endpoint not accessible"
    fi
    
    success "Deployment validation completed"
}

# Monitor deployment
monitor_deployment() {
    log "Starting deployment monitoring..."
    
    MONITOR_DURATION=300  # 5 minutes
    MONITOR_INTERVAL=30   # 30 seconds
    ITERATIONS=$((MONITOR_DURATION / MONITOR_INTERVAL))
    
    for i in $(seq 1 $ITERATIONS); do
        log "Monitoring iteration $i/$ITERATIONS"
        
        # Check error rates
        ERROR_RATE=$(curl -s http://localhost:5000/api/admin/metrics/error-rate 2>/dev/null | jq -r '.rate // 0' 2>/dev/null || echo "0")
        if [ "${ERROR_RATE%.*}" -gt 5 ]; then
            error "High error rate detected: $ERROR_RATE%"
            return 1
        fi
        
        # Check response times
        RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:5000/api/patients 2>/dev/null || echo "999")
        if [ "${RESPONSE_TIME%.*}" -gt 5 ]; then
            error "High response time detected: ${RESPONSE_TIME}s"
            return 1
        fi
        
        log "Metrics OK - Error rate: $ERROR_RATE%, Response time: ${RESPONSE_TIME}s"
        
        if [ $i -lt $ITERATIONS ]; then
            sleep $MONITOR_INTERVAL
        fi
    done
    
    success "Deployment monitoring completed successfully"
}

# Rollback function
rollback_deployment() {
    error "Rolling back deployment..."
    
    # Disable all performance features
    export FEATURE_THEME_OPTIMIZATION=false
    export FEATURE_BUNDLE_OPTIMIZATION=false
    export FEATURE_API_CACHING=false
    export FEATURE_DATABASE_OPTIMIZATION=false
    export FEATURE_VIRTUALIZATION=false
    export FEATURE_REACT_QUERY_OPTIMIZATION=false
    export FEATURE_CURSOR_PAGINATION=false
    export FEATURE_SERVICE_WORKER=false
    export FEATURE_BACKGROUND_JOBS=false
    export FEATURE_ROLLOUT_PERCENTAGE=0
    
    # Restart services
    pm2 restart all
    
    # Restore from backup if available
    if [ -f .last-backup-path ]; then
        BACKUP_PATH=$(cat .last-backup-path)
        if [ -d "$BACKUP_PATH" ]; then
            log "Restoring from backup: $BACKUP_PATH"
            
            # Restore database
            mongorestore --uri="$MONGODB_URI" --drop "$BACKUP_PATH/mongodb" || {
                error "Database restore failed"
            }
            
            # Restore Redis
            redis-cli --rdb "$BACKUP_PATH/redis-backup.rdb" || {
                error "Redis restore failed"
            }
        fi
    fi
    
    error "Rollback completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f .env.performance
    success "Cleanup completed"
}

# Signal handlers
trap 'error "Deployment interrupted"; rollback_deployment; cleanup; exit 1' INT TERM

# Main deployment flow
main() {
    log "Starting performance optimization deployment..."
    
    # Pre-deployment checks
    check_prerequisites
    create_backup
    set_feature_flags
    
    # Deployment
    if ! deploy_backend; then
        rollback_deployment
        cleanup
        exit 1
    fi
    
    if ! deploy_frontend; then
        rollback_deployment
        cleanup
        exit 1
    fi
    
    # Post-deployment validation
    if ! validate_deployment; then
        rollback_deployment
        cleanup
        exit 1
    fi
    
    # Monitor deployment
    if ! monitor_deployment; then
        rollback_deployment
        cleanup
        exit 1
    fi
    
    # Success
    success "🎉 Performance optimization deployment completed successfully!"
    success "Rollout percentage: $ROLLOUT_PERCENTAGE%"
    success "Monitoring dashboard: http://localhost:3000/admin/performance"
    
    cleanup
}

# Run main function
main "$@"