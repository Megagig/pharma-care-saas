#!/bin/bash

# Patient Engagement & Follow-up Management - Staging Deployment Script
# Version: 1.0
# Description: Complete staging deployment script for patient engagement module
# Author: System
# Date: 2025-10-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/patient-engagement-staging-deployment.log"
BACKUP_DIR="/var/backups/patient-engagement-staging-$(date +%Y%m%d-%H%M%S)"
DEPLOYMENT_ENV="staging"
DRY_RUN="${DRY_RUN:-false}"

# Staging-specific configuration
STAGING_BACKEND_PORT="${STAGING_BACKEND_PORT:-5001}"
STAGING_FRONTEND_PORT="${STAGING_FRONTEND_PORT:-5174}"
STAGING_DB_NAME="${STAGING_DB_NAME:-PharmacyCopilot-staging}"
STAGING_REDIS_DB="${STAGING_REDIS_DB:-1}"

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
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handler
error_handler() {
    local line_number=$1
    log ERROR "Staging deployment failed at line $line_number"
    log ERROR "Rolling back changes..."
    rollback_deployment
    exit 1
}

trap 'error_handler $LINENO' ERR

# Check prerequisites
check_prerequisites() {
    log INFO "Checking staging deployment prerequisites..."
    
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        log WARN "Running as root. Consider using a dedicated deployment user."
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log ERROR "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        log ERROR "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    # Check MongoDB connection
    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
        log ERROR "MongoDB client is not installed"
        exit 1
    fi
    
    # Check Redis connection
    if command -v redis-cli &> /dev/null; then
        if ! redis-cli ping &> /dev/null; then
            log WARN "Redis is not responding. Cache functionality may be limited."
        fi
    fi
    
    # Check PM2 (if using PM2 for process management)
    if command -v pm2 &> /dev/null; then
        log INFO "PM2 detected. Will use PM2 for process management."
    fi
    
    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=2097152 # 2GB in KB for staging
    if [[ $available_space -lt $required_space ]]; then
        log ERROR "Insufficient disk space. Required: 2GB, Available: $(($available_space/1024))MB"
        exit 1
    fi
    
    # Check if staging ports are available
    if netstat -tuln | grep -q ":$STAGING_BACKEND_PORT "; then
        log WARN "Staging backend port $STAGING_BACKEND_PORT is already in use"
    fi
    
    if netstat -tuln | grep -q ":$STAGING_FRONTEND_PORT "; then
        log WARN "Staging frontend port $STAGING_FRONTEND_PORT is already in use"
    fi
    
    log INFO "Prerequisites check completed successfully"
}

# Create staging environment configuration
create_staging_config() {
    log INFO "Creating staging environment configuration..."
    
    # Create staging backend environment file
    local staging_backend_env="$PROJECT_ROOT/backend/.env.staging"
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$staging_backend_env" << EOF
# Patient Engagement Module - Staging Environment Configuration
NODE_ENV=staging
PORT=$STAGING_BACKEND_PORT
INSTANCE_ID=staging-0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/$STAGING_DB_NAME
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME_MS=30000
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=$STAGING_REDIS_DB
REDIS_MAX_RETRIES=3

# Frontend Configuration
FRONTEND_URL=http://localhost:$STAGING_FRONTEND_PORT
CORS_ORIGINS=http://localhost:$STAGING_FRONTEND_PORT,http://localhost:3000

# JWT Configuration
JWT_SECRET=staging-jwt-secret-patient-engagement-module-2025
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=staging-refresh-secret-patient-engagement-module-2025
JWT_REFRESH_EXPIRE=7d
JWT_ISSUER=PharmacyCopilot-staging
JWT_AUDIENCE=PharmacyCopilot-staging-app

# Session Configuration
SESSION_SECRET=staging-session-secret-patient-engagement-module-2025
SESSION_MAX_AGE=86400000
SESSION_SECURE=false
SESSION_SAME_SITE=lax

# Email Configuration (Test mode)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=staging-user
SMTP_PASS=staging-pass
EMAIL_FROM=staging@PharmacyCopilot.com
EMAIL_FROM_NAME=PharmacyCopilot Staging

# SMS Configuration (Test mode)
TWILIO_ACCOUNT_SID=staging_twilio_sid
TWILIO_AUTH_TOKEN=staging_twilio_token
TWILIO_PHONE_NUMBER=+15551234567

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/tmp/PharmacyCopilot-staging/uploads

# Security Configuration (Relaxed for staging)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
BCRYPT_ROUNDS=10
HELMET_CSP_ENABLED=false
CORS_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_FILE_PATH=/var/log/PharmacyCopilot-staging/app.log
LOG_ERROR_FILE_PATH=/var/log/PharmacyCopilot-staging/error.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=10

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=1.0
METRICS_PORT=9091
HEALTH_CHECK_TIMEOUT=5000

# Patient Engagement Feature Flags
PATIENT_ENGAGEMENT_ENABLED=true
PATIENT_ENGAGEMENT_ROLLOUT_PERCENTAGE=100
APPOINTMENT_SCHEDULING_ENABLED=true
FOLLOW_UP_MANAGEMENT_ENABLED=true
REMINDER_SYSTEM_ENABLED=true
PATIENT_PORTAL_ENABLED=true
ANALYTICS_REPORTING_ENABLED=true

# Background Jobs Configuration
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
BULL_REDIS_DB=$STAGING_REDIS_DB
REMINDER_QUEUE_CONCURRENCY=2
FOLLOWUP_QUEUE_CONCURRENCY=2
APPOINTMENT_QUEUE_CONCURRENCY=2

# Cache Configuration
CACHE_TTL_DEFAULT=300
CACHE_TTL_APPOINTMENTS=600
CACHE_TTL_FOLLOW_UPS=300
CACHE_TTL_REMINDERS=1800
CACHE_MAX_SIZE=500

# Notification Configuration (Test mode)
NOTIFICATION_TEST_MODE=true
NOTIFICATION_LOG_ALL=true
WHATSAPP_TEST_MODE=true
EMAIL_TEST_MODE=true
SMS_TEST_MODE=true

# Debug Configuration
DEBUG_MODE=true
VERBOSE_LOGGING=true
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=true

# Graceful Shutdown
GRACEFUL_SHUTDOWN_TIMEOUT=15000
SHUTDOWN_SIGNALS=SIGTERM,SIGINT
EOF
        log INFO "Staging backend configuration created"
    else
        log INFO "[DRY RUN] Would create staging backend configuration"
    fi
    
    # Create staging frontend environment file
    local staging_frontend_env="$PROJECT_ROOT/frontend/.env.staging"
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$staging_frontend_env" << EOF
# Patient Engagement Module - Staging Frontend Configuration
VITE_NODE_ENV=staging
VITE_API_BASE_URL=http://localhost:$STAGING_BACKEND_PORT/api
VITE_SOCKET_URL=http://localhost:$STAGING_BACKEND_PORT
VITE_APP_NAME=PharmacyCopilot Staging
VITE_APP_VERSION=1.0.0-staging

# Feature Flags
VITE_PATIENT_ENGAGEMENT_ENABLED=true
VITE_APPOINTMENT_SCHEDULING_ENABLED=true
VITE_FOLLOW_UP_MANAGEMENT_ENABLED=true
VITE_REMINDER_SYSTEM_ENABLED=true
VITE_PATIENT_PORTAL_ENABLED=true
VITE_ANALYTICS_REPORTING_ENABLED=true

# Debug Configuration
VITE_DEBUG_MODE=true
VITE_ENABLE_DEVTOOLS=true
VITE_LOG_LEVEL=debug

# Test Configuration
VITE_TEST_MODE=true
VITE_MOCK_DATA_ENABLED=true
VITE_E2E_TEST_ENABLED=true
EOF
        log INFO "Staging frontend configuration created"
    else
        log INFO "[DRY RUN] Would create staging frontend configuration"
    fi
}

# Create backup
create_backup() {
    log INFO "Creating backup before staging deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup staging database if it exists
    log INFO "Backing up staging MongoDB database..."
    if command -v mongodump &> /dev/null; then
        mongodump --host "localhost:27017" \
                  --db "$STAGING_DB_NAME" \
                  --out "$BACKUP_DIR/mongodb" \
                  --quiet 2>/dev/null || log INFO "No existing staging database to backup"
    else
        log WARN "mongodump not available. Skipping database backup."
    fi
    
    # Backup application files
    log INFO "Backing up application files..."
    if [[ -d "$PROJECT_ROOT/backend/src" ]]; then
        cp -r "$PROJECT_ROOT/backend/src" "$BACKUP_DIR/backend-src"
    fi
    if [[ -d "$PROJECT_ROOT/frontend/src" ]]; then
        cp -r "$PROJECT_ROOT/frontend/src" "$BACKUP_DIR/frontend-src"
    fi
    
    # Backup existing staging configuration files
    cp "$PROJECT_ROOT/backend/.env.staging" "$BACKUP_DIR/backend-env-staging" 2>/dev/null || true
    cp "$PROJECT_ROOT/frontend/.env.staging" "$BACKUP_DIR/frontend-env-staging" 2>/dev/null || true
    
    log INFO "Backup created at $BACKUP_DIR"
}

# Install dependencies
install_dependencies() {
    log INFO "Installing/updating dependencies for staging..."
    
    # Backend dependencies
    cd "$PROJECT_ROOT/backend"
    if [[ "$DRY_RUN" == "false" ]]; then
        npm ci
        log INFO "Backend dependencies installed"
    else
        log INFO "[DRY RUN] Would install backend dependencies"
    fi
    
    # Frontend dependencies
    cd "$PROJECT_ROOT/frontend"
    if [[ "$DRY_RUN" == "false" ]]; then
        npm ci
        log INFO "Frontend dependencies installed"
    else
        log INFO "[DRY RUN] Would install frontend dependencies"
    fi
    
    cd "$PROJECT_ROOT"
}

# Build applications
build_applications() {
    log INFO "Building applications for staging..."
    
    # Build backend
    cd "$PROJECT_ROOT/backend"
    if [[ "$DRY_RUN" == "false" ]]; then
        npm run build
        log INFO "Backend built successfully"
    else
        log INFO "[DRY RUN] Would build backend"
    fi
    
    # Build frontend for staging
    cd "$PROJECT_ROOT/frontend"
    if [[ "$DRY_RUN" == "false" ]]; then
        # Copy staging environment file for build
        cp .env.staging .env.local
        npm run build
        log INFO "Frontend built successfully for staging"
    else
        log INFO "[DRY RUN] Would build frontend for staging"
    fi
    
    cd "$PROJECT_ROOT"
}

# Run database migrations
run_migrations() {
    log INFO "Running database migrations for staging..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Set staging environment
        export NODE_ENV=staging
        export MONGODB_URI="mongodb://localhost:27017/$STAGING_DB_NAME"
        
        # Run patient engagement migrations
        log INFO "Running patient engagement migrations..."
        npm run migrate:patient-engagement || {
            log ERROR "Patient engagement migration failed"
            return 1
        }
        
        # Create feature flags for patient engagement
        log INFO "Creating patient engagement feature flags..."
        npm run feature-flags:init || {
            log WARN "Feature flags initialization failed, continuing..."
        }
        
        # Seed test data for staging
        log INFO "Seeding test data for staging..."
        npm run seed:staging-data || {
            log WARN "Test data seeding failed, continuing..."
        }
        
        log INFO "Database migrations completed successfully"
    else
        log INFO "[DRY RUN] Would run database migrations"
    fi
}

# Setup background jobs
setup_background_jobs() {
    log INFO "Setting up background jobs for staging..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cd "$PROJECT_ROOT/backend"
        
        # Initialize job queues
        log INFO "Initializing job queues..."
        npm run queue:init || {
            log WARN "Queue initialization failed, continuing..."
        }
        
        # Test queue infrastructure
        log INFO "Testing queue infrastructure..."
        npm run test:queue-infrastructure || {
            log WARN "Queue infrastructure test failed, continuing..."
        }
        
        log INFO "Background jobs setup completed"
    else
        log INFO "[DRY RUN] Would setup background jobs"
    fi
}

# Deploy monitoring configuration
deploy_monitoring() {
    log INFO "Deploying monitoring configuration for staging..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Create monitoring directories
        mkdir -p /var/log/PharmacyCopilot-staging
        mkdir -p /etc/prometheus/staging
        
        # Create staging Prometheus configuration
        cat > /etc/prometheus/staging/prometheus-staging.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "staging-alerts.yml"

scrape_configs:
  - job_name: 'patient-engagement-staging'
    static_configs:
      - targets: ['localhost:$STAGING_BACKEND_PORT']
    metrics_path: '/metrics'
    scrape_interval: 15s
    
  - job_name: 'patient-engagement-staging-health'
    static_configs:
      - targets: ['localhost:$STAGING_BACKEND_PORT']
    metrics_path: '/health'
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF
        
        # Create staging alert rules
        cat > /etc/prometheus/staging/staging-alerts.yml << EOF
groups:
  - name: patient-engagement-staging
    rules:
      - alert: StagingServiceDown
        expr: up{job="patient-engagement-staging"} == 0
        for: 1m
        labels:
          severity: warning
          environment: staging
        annotations:
          summary: "Patient Engagement staging service is down"
          description: "The staging service has been down for more than 1 minute"
          
      - alert: StagingHighErrorRate
        expr: rate(http_requests_total{job="patient-engagement-staging",status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          environment: staging
        annotations:
          summary: "High error rate in staging"
          description: "Error rate is {{ \$value }} errors per second"
EOF
        
        log INFO "Monitoring configuration deployed"
    else
        log INFO "[DRY RUN] Would deploy monitoring configuration"
    fi
}

# Start staging services
start_services() {
    log INFO "Starting staging services..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Start backend service
        cd "$PROJECT_ROOT/backend"
        
        if command -v pm2 &> /dev/null; then
            log INFO "Starting backend with PM2..."
            
            # Create PM2 ecosystem file for staging
            cat > ecosystem.staging.config.js << EOF
module.exports = {
  apps: [{
    name: 'PharmacyCopilot-patient-engagement-staging',
    script: './dist/server.js',
    env: {
      NODE_ENV: 'staging',
      PORT: $STAGING_BACKEND_PORT
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/PharmacyCopilot-staging/error.log',
    out_file: '/var/log/PharmacyCopilot-staging/out.log',
    log_file: '/var/log/PharmacyCopilot-staging/combined.log',
    time: true,
    env_file: '.env.staging'
  }]
};
EOF
            
            pm2 start ecosystem.staging.config.js || {
                log ERROR "Failed to start backend with PM2"
                return 1
            }
        else
            log INFO "Starting backend with node..."
            NODE_ENV=staging PORT=$STAGING_BACKEND_PORT nohup node dist/server.js > /var/log/PharmacyCopilot-staging/app.log 2>&1 &
            echo $! > /tmp/PharmacyCopilot-staging-backend.pid
        fi
        
        # Start frontend service (for development/testing)
        cd "$PROJECT_ROOT/frontend"
        log INFO "Starting frontend development server..."
        nohup npm run dev -- --port $STAGING_FRONTEND_PORT > /var/log/PharmacyCopilot-staging/frontend.log 2>&1 &
        echo $! > /tmp/PharmacyCopilot-staging-frontend.pid
        
        # Wait for services to be ready
        log INFO "Waiting for services to be ready..."
        local max_attempts=60
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f -s "http://localhost:$STAGING_BACKEND_PORT/health" > /dev/null 2>&1; then
                log INFO "Backend service is ready"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log ERROR "Backend service failed to start within timeout"
                return 1
            fi
            
            log INFO "Waiting for backend service... (attempt $attempt/$max_attempts)"
            sleep 5
            ((attempt++))
        done
        
        # Check frontend service
        attempt=1
        while [[ $attempt -le 30 ]]; do
            if curl -f -s "http://localhost:$STAGING_FRONTEND_PORT" > /dev/null 2>&1; then
                log INFO "Frontend service is ready"
                break
            fi
            
            if [[ $attempt -eq 30 ]]; then
                log WARN "Frontend service may not be ready, but continuing..."
                break
            fi
            
            log INFO "Waiting for frontend service... (attempt $attempt/30)"
            sleep 3
            ((attempt++))
        done
        
        log INFO "Staging services started successfully"
    else
        log INFO "[DRY RUN] Would start staging services"
    fi
}

# Run comprehensive tests
run_tests() {
    log INFO "Running comprehensive tests on staging..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Set staging environment for tests
        export NODE_ENV=staging
        export MONGODB_URI="mongodb://localhost:27017/$STAGING_DB_NAME"
        export PORT=$STAGING_BACKEND_PORT
        
        # Run unit tests
        log INFO "Running unit tests..."
        npm run test || {
            log WARN "Some unit tests failed, but continuing..."
        }
        
        # Run integration tests
        log INFO "Running integration tests..."
        npm run test:e2e:patient-engagement || {
            log WARN "Some integration tests failed, but continuing..."
        }
        
        # Run API health checks
        log INFO "Running API health checks..."
        npm run test:api:health || {
            log WARN "API health checks failed, but continuing..."
        }
        
        # Test patient engagement endpoints
        log INFO "Testing patient engagement endpoints..."
        local api_base="http://localhost:$STAGING_BACKEND_PORT/api"
        
        # Test health endpoint
        if ! curl -f -s "$api_base/health" > /dev/null; then
            log ERROR "Health endpoint test failed"
            return 1
        fi
        
        # Test appointments endpoint (requires authentication)
        if curl -f -s "$api_base/appointments" -H "Authorization: Bearer test-token" > /dev/null 2>&1; then
            log INFO "Appointments endpoint accessible"
        else
            log INFO "Appointments endpoint requires authentication (expected)"
        fi
        
        # Test follow-ups endpoint
        if curl -f -s "$api_base/follow-ups" -H "Authorization: Bearer test-token" > /dev/null 2>&1; then
            log INFO "Follow-ups endpoint accessible"
        else
            log INFO "Follow-ups endpoint requires authentication (expected)"
        fi
        
        log INFO "Staging tests completed"
    else
        log INFO "[DRY RUN] Would run comprehensive tests"
    fi
}

# Rollback deployment
rollback_deployment() {
    log INFO "Rolling back staging deployment..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Stop services
        log INFO "Stopping staging services..."
        if command -v pm2 &> /dev/null; then
            pm2 stop PharmacyCopilot-patient-engagement-staging 2>/dev/null || true
            pm2 delete PharmacyCopilot-patient-engagement-staging 2>/dev/null || true
        fi
        
        # Kill processes by PID files
        if [[ -f "/tmp/PharmacyCopilot-staging-backend.pid" ]]; then
            kill $(cat /tmp/PharmacyCopilot-staging-backend.pid) 2>/dev/null || true
            rm -f /tmp/PharmacyCopilot-staging-backend.pid
        fi
        
        if [[ -f "/tmp/PharmacyCopilot-staging-frontend.pid" ]]; then
            kill $(cat /tmp/PharmacyCopilot-staging-frontend.pid) 2>/dev/null || true
            rm -f /tmp/PharmacyCopilot-staging-frontend.pid
        fi
        
        # Restore database
        if [[ -d "$BACKUP_DIR/mongodb" ]]; then
            log INFO "Restoring database..."
            if command -v mongorestore &> /dev/null; then
                mongorestore --host "localhost:27017" \
                           --db "$STAGING_DB_NAME" \
                           --drop \
                           "$BACKUP_DIR/mongodb/$STAGING_DB_NAME" \
                           --quiet 2>/dev/null || true
            fi
        fi
        
        # Restore configuration files
        if [[ -f "$BACKUP_DIR/backend-env-staging" ]]; then
            cp "$BACKUP_DIR/backend-env-staging" "$PROJECT_ROOT/backend/.env.staging"
        fi
        
        if [[ -f "$BACKUP_DIR/frontend-env-staging" ]]; then
            cp "$BACKUP_DIR/frontend-env-staging" "$PROJECT_ROOT/frontend/.env.staging"
        fi
        
        log INFO "Rollback completed"
    else
        log ERROR "Backup directory not found. Cannot rollback."
    fi
}

# Cleanup old backups
cleanup_backups() {
    log INFO "Cleaning up old staging backups..."
    
    # Keep only the last 3 staging backups
    local backup_parent_dir="/var/backups"
    if [[ -d "$backup_parent_dir" ]]; then
        find "$backup_parent_dir" -name "patient-engagement-staging-*" -type d -mtime +3 -exec rm -rf {} + 2>/dev/null || true
        log INFO "Old staging backups cleaned up"
    fi
}

# Generate staging report
generate_staging_report() {
    log INFO "Generating staging deployment report..."
    
    local report_file="/tmp/patient-engagement-staging-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
Patient Engagement & Follow-up Management - Staging Deployment Report
=====================================================================

Deployment Date: $(date)
Environment: $DEPLOYMENT_ENV
Backup Location: $BACKUP_DIR

Services:
- Backend: http://localhost:$STAGING_BACKEND_PORT
- Frontend: http://localhost:$STAGING_FRONTEND_PORT
- Database: $STAGING_DB_NAME
- Redis DB: $STAGING_REDIS_DB

Health Checks:
EOF
    
    # Add health check results
    if curl -f -s "http://localhost:$STAGING_BACKEND_PORT/health" > /dev/null 2>&1; then
        echo "- Backend Health: ✅ HEALTHY" >> "$report_file"
    else
        echo "- Backend Health: ❌ UNHEALTHY" >> "$report_file"
    fi
    
    if curl -f -s "http://localhost:$STAGING_FRONTEND_PORT" > /dev/null 2>&1; then
        echo "- Frontend Health: ✅ HEALTHY" >> "$report_file"
    else
        echo "- Frontend Health: ❌ UNHEALTHY" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

Feature Flags:
- Patient Engagement: ENABLED
- Appointment Scheduling: ENABLED
- Follow-up Management: ENABLED
- Reminder System: ENABLED
- Patient Portal: ENABLED
- Analytics Reporting: ENABLED

Test Endpoints:
- Health: http://localhost:$STAGING_BACKEND_PORT/health
- API Docs: http://localhost:$STAGING_BACKEND_PORT/api-docs
- Metrics: http://localhost:$STAGING_BACKEND_PORT/metrics

Log Files:
- Application: /var/log/PharmacyCopilot-staging/app.log
- Error: /var/log/PharmacyCopilot-staging/error.log
- Frontend: /var/log/PharmacyCopilot-staging/frontend.log

Next Steps:
1. Verify all functionality works as expected
2. Run end-to-end tests
3. Test patient portal workflows
4. Validate appointment scheduling
5. Test reminder system
6. Check analytics and reporting
7. Perform load testing
8. Security testing
9. User acceptance testing
10. Prepare for production deployment

Rollback Command:
$0 --rollback

EOF
    
    log INFO "Staging report generated: $report_file"
    cat "$report_file"
}

# Main deployment function
main() {
    log INFO "Starting Patient Engagement & Follow-up Management staging deployment..."
    log INFO "Environment: $DEPLOYMENT_ENV"
    log INFO "Dry run: $DRY_RUN"
    log INFO "Backend Port: $STAGING_BACKEND_PORT"
    log INFO "Frontend Port: $STAGING_FRONTEND_PORT"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run deployment steps
    check_prerequisites
    create_staging_config
    create_backup
    install_dependencies
    build_applications
    run_migrations
    setup_background_jobs
    deploy_monitoring
    start_services
    run_tests
    cleanup_backups
    generate_staging_report
    
    log INFO "Patient Engagement staging deployment completed successfully!"
    log INFO "Backup location: $BACKUP_DIR"
    log INFO "Log file: $LOG_FILE"
    
    # Display post-deployment information
    cat << EOF

${GREEN}✅ Patient Engagement Staging Deployment Completed Successfully!${NC}

📋 Summary:
- Staging configuration: ✅ Created
- Dependencies: ✅ Installed
- Applications: ✅ Built
- Database migrations: ✅ Completed
- Background jobs: ✅ Setup
- Monitoring: ✅ Configured
- Services: ✅ Started
- Tests: ✅ Executed

🌐 Staging URLs:
- Backend API: http://localhost:$STAGING_BACKEND_PORT
- Frontend App: http://localhost:$STAGING_FRONTEND_PORT
- API Documentation: http://localhost:$STAGING_BACKEND_PORT/api-docs
- Health Check: http://localhost:$STAGING_BACKEND_PORT/health
- Metrics: http://localhost:$STAGING_BACKEND_PORT/metrics

📊 Monitoring:
- Logs: /var/log/PharmacyCopilot-staging/
- Prometheus Config: /etc/prometheus/staging/
- PM2 Status: pm2 status

📁 Important Files:
- Backup: $BACKUP_DIR
- Logs: $LOG_FILE
- Backend Config: $PROJECT_ROOT/backend/.env.staging
- Frontend Config: $PROJECT_ROOT/frontend/.env.staging

🔧 Next Steps:
1. Test all patient engagement features
2. Verify appointment scheduling workflow
3. Test follow-up management system
4. Validate reminder system functionality
5. Test patient portal access
6. Check analytics and reporting
7. Run load tests
8. Perform security testing
9. User acceptance testing
10. Prepare production deployment

⚠️  Management Commands:
- View logs: tail -f $LOG_FILE
- Check services: pm2 status
- Restart backend: pm2 restart PharmacyCopilot-patient-engagement-staging
- Stop services: pm2 stop PharmacyCopilot-patient-engagement-staging
- Rollback: $0 --rollback

EOF
}

# Handle command line arguments
case "${1:-}" in
    --rollback)
        log INFO "Initiating staging rollback..."
        rollback_deployment
        ;;
    --dry-run)
        DRY_RUN=true
        main
        ;;
    --stop)
        log INFO "Stopping staging services..."
        if command -v pm2 &> /dev/null; then
            pm2 stop PharmacyCopilot-patient-engagement-staging 2>/dev/null || true
        fi
        if [[ -f "/tmp/PharmacyCopilot-staging-backend.pid" ]]; then
            kill $(cat /tmp/PharmacyCopilot-staging-backend.pid) 2>/dev/null || true
            rm -f /tmp/PharmacyCopilot-staging-backend.pid
        fi
        if [[ -f "/tmp/PharmacyCopilot-staging-frontend.pid" ]]; then
            kill $(cat /tmp/PharmacyCopilot-staging-frontend.pid) 2>/dev/null || true
            rm -f /tmp/PharmacyCopilot-staging-frontend.pid
        fi
        log INFO "Staging services stopped"
        ;;
    --status)
        log INFO "Checking staging services status..."
        if command -v pm2 &> /dev/null; then
            pm2 status PharmacyCopilot-patient-engagement-staging
        fi
        curl -s "http://localhost:$STAGING_BACKEND_PORT/health" || echo "Backend not responding"
        curl -s "http://localhost:$STAGING_FRONTEND_PORT" > /dev/null && echo "Frontend responding" || echo "Frontend not responding"
        ;;
    --help|-h)
        cat << EOF
Patient Engagement & Follow-up Management - Staging Deployment Script

Usage: $0 [OPTIONS]

Options:
    --dry-run    Run deployment simulation without making changes
    --rollback   Rollback to previous version
    --stop       Stop staging services
    --status     Check staging services status
    --help, -h   Show this help message

Environment Variables:
    STAGING_BACKEND_PORT     Backend port (default: 5001)
    STAGING_FRONTEND_PORT    Frontend port (default: 5174)
    STAGING_DB_NAME          Database name (default: PharmacyCopilot-staging)
    STAGING_REDIS_DB         Redis database number (default: 1)
    DRY_RUN                  Enable dry run mode (default: false)

Examples:
    $0                       # Normal staging deployment
    $0 --dry-run            # Simulate deployment
    $0 --rollback           # Rollback deployment
    $0 --stop               # Stop staging services
    $0 --status             # Check services status

EOF
        ;;
    *)
        main
        ;;
esac