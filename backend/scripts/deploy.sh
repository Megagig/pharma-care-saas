#!/bin/bash

# Pharmacare Workspace Subscription RBAC Enhancement Deployment Script
# This script handles the deployment of the new workspace subscription features

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/var/backups/pharmacare"
LOG_FILE="/var/log/pharmacare/deployment.log"
APP_DIR="/opt/pharmacare"
SERVICE_NAME="pharmacare-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Use a user with sudo privileges."
    fi
    
    # Check required commands
    local required_commands=("node" "npm" "pm2" "mongo" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' is not installed"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $required_version or higher is required. Current: $node_version"
    fi
    
    # Check MongoDB connection
    if ! mongo --eval "db.runCommand('ping')" --quiet; then
        error "Cannot connect to MongoDB"
    fi
    
    # Check disk space (require at least 1GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 1048576 ]]; then
        error "Insufficient disk space. At least 1GB required."
    fi
    
    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "Creating backup directory: $BACKUP_DIR"
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown $(whoami):$(whoami) "$BACKUP_DIR"
    fi
    
    success "Pre-deployment checks completed"
}

# Create database backup
create_backup() {
    log "Creating database backup..."
    
    local backup_name="pharmacare_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create MongoDB backup
    mongodump --db pharmacare --out "$backup_path" --quiet
    
    if [[ $? -eq 0 ]]; then
        # Compress backup
        tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
        rm -rf "$backup_path"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +6 | xargs -r rm
        
        success "Database backup created: $backup_path.tar.gz"
        echo "$backup_path.tar.gz" > /tmp/pharmacare_backup_path
    else
        error "Database backup failed"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$APP_DIR/backend"
    
    # Run workspace subscription migration
    log "Running workspace subscription migration..."
    if node src/scripts/migrateToWorkspaceSubscriptions.js --environment="$ENVIRONMENT"; then
        success "Workspace subscription migration completed"
    else
        error "Workspace subscription migration failed"
    fi
    
    # Seed subscription plans
    log "Seeding subscription plans..."
    if node src/scripts/seedPlansFromConfig.js --environment="$ENVIRONMENT"; then
        success "Subscription plans seeded"
    else
        warning "Subscription plans seeding failed - may already exist"
    fi
    
    # Seed feature flags
    log "Seeding feature flags..."
    if node src/scripts/seedFeatureFlags.js --environment="$ENVIRONMENT"; then
        success "Feature flags seeded"
    else
        warning "Feature flags seeding failed - may already exist"
    fi
    
    success "Database migrations completed"
}

# Update application code
update_application() {
    log "Updating application code..."
    
    cd "$APP_DIR"
    
    # Stash any local changes
    git stash push -m "Pre-deployment stash $(date)"
    
    # Pull latest changes
    git fetch origin
    git checkout main
    git pull origin main
    
    # Install backend dependencies
    cd backend
    npm ci --production
    
    # Build application
    npm run build
    
    # Install frontend dependencies and build
    cd ../frontend
    npm ci --production
    npm run build
    
    success "Application code updated"
}

# Update environment configuration
update_environment() {
    log "Updating environment configuration..."
    
    cd "$APP_DIR/backend"
    
    # Backup current .env
    if [[ -f .env ]]; then
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Add new environment variables if they don't exist
    local new_vars=(
        "ENABLE_WORKSPACE_SUBSCRIPTIONS=true"
        "ENABLE_INVITATIONS=true"
        "ENABLE_USAGE_MONITORING=true"
        "INVITATION_EXPIRY_HOURS=24"
        "MAX_PENDING_INVITATIONS=20"
        "PLAN_CACHE_TTL=300"
        "USAGE_STATS_UPDATE_INTERVAL=3600"
    )
    
    for var in "${new_vars[@]}"; do
        local key=$(echo "$var" | cut -d'=' -f1)
        if ! grep -q "^$key=" .env 2>/dev/null; then
            echo "$var" >> .env
            log "Added environment variable: $key"
        fi
    done
    
    success "Environment configuration updated"
}

# Update database indexes
update_indexes() {
    log "Updating database indexes..."
    
    # Create indexes for new collections and fields
    mongo pharmacare --eval "
        // Workspace indexes
        db.workplaces.createIndex({ currentSubscriptionId: 1 });
        db.workplaces.createIndex({ subscriptionStatus: 1 });
        db.workplaces.createIndex({ trialEndDate: 1 });
        db.workplaces.createIndex({ 'stats.lastUpdated': 1 });
        
        // Invitation indexes
        db.invitations.createIndex({ code: 1 }, { unique: true });
        db.invitations.createIndex({ email: 1, workspaceId: 1 });
        db.invitations.createIndex({ workspaceId: 1, status: 1 });
        db.invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        db.invitations.createIndex({ status: 1, createdAt: 1 });
        
        // Subscription indexes
        db.subscriptions.createIndex({ workspaceId: 1, status: 1 });
        db.subscriptions.createIndex({ workspaceId: 1 }, { unique: true });
        db.subscriptions.createIndex({ status: 1, endDate: 1 });
        
        // User indexes
        db.users.createIndex({ email: 1, status: 1 });
        db.users.createIndex({ workspaceId: 1 });
        
        // Email delivery indexes
        db.emaildeliveries.createIndex({ status: 1, createdAt: 1 });
        db.emaildeliveries.createIndex({ type: 1, recipientEmail: 1 });
        
        // Audit log indexes
        db.auditlogs.createIndex({ workspaceId: 1, createdAt: -1 });
        db.auditlogs.createIndex({ userId: 1, createdAt: -1 });
        db.auditlogs.createIndex({ action: 1, createdAt: -1 });
        
        print('Database indexes updated successfully');
    " --quiet
    
    if [[ $? -eq 0 ]]; then
        success "Database indexes updated"
    else
        error "Failed to update database indexes"
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    cd "$APP_DIR/backend"
    
    # Stop existing services
    pm2 stop "$SERVICE_NAME" 2>/dev/null || true
    pm2 delete "$SERVICE_NAME" 2>/dev/null || true
    
    # Start main API service
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    
    # Start cron services
    pm2 start src/services/InvitationCronService.js --name "invitation-cron"
    pm2 start src/services/WorkspaceStatsCronService.js --name "workspace-stats-cron"
    pm2 start src/services/EmailDeliveryCronService.js --name "email-delivery-cron"
    pm2 start src/services/UsageAlertCronService.js --name "usage-alert-cron"
    
    # Save PM2 configuration
    pm2 save
    
    # Wait for services to start
    sleep 10
    
    # Check service health
    if pm2 list | grep -q "online"; then
        success "Services started successfully"
    else
        error "Failed to start services"
    fi
}

# Run health checks
health_checks() {
    log "Running health checks..."
    
    local api_url="http://localhost:5000"
    local max_attempts=30
    local attempt=1
    
    # Wait for API to be ready
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "$api_url/api/health" > /dev/null; then
            break
        fi
        log "Waiting for API to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "API health check failed after $max_attempts attempts"
    fi
    
    # Test critical endpoints
    local endpoints=(
        "/api/health"
        "/api/auth/profile"
        "/api/subscription-plans"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_url$endpoint")
        if [[ $status_code -eq 200 || $status_code -eq 401 ]]; then
            log "✓ $endpoint - OK"
        else
            warning "✗ $endpoint - Status: $status_code"
        fi
    done
    
    # Test database connectivity
    if mongo pharmacare --eval "db.runCommand('ping')" --quiet; then
        log "✓ Database connectivity - OK"
    else
        error "✗ Database connectivity - FAILED"
    fi
    
    # Check PM2 processes
    local running_processes=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "online") | .name' | wc -l)
    if [[ $running_processes -ge 4 ]]; then
        log "✓ PM2 processes - OK ($running_processes running)"
    else
        warning "✗ PM2 processes - Only $running_processes running"
    fi
    
    success "Health checks completed"
}

# Rollback function
rollback() {
    log "Starting rollback procedure..."
    
    # Stop current services
    pm2 stop all
    
    # Restore database backup
    local backup_path=$(cat /tmp/pharmacare_backup_path 2>/dev/null)
    if [[ -n "$backup_path" && -f "$backup_path" ]]; then
        log "Restoring database from backup: $backup_path"
        
        # Extract backup
        local temp_dir=$(mktemp -d)
        tar -xzf "$backup_path" -C "$temp_dir"
        
        # Restore database
        mongorestore --db pharmacare --drop "$temp_dir"/*/pharmacare/
        
        # Cleanup
        rm -rf "$temp_dir"
        
        success "Database restored from backup"
    else
        warning "No backup found for rollback"
    fi
    
    # Restore previous code version
    cd "$APP_DIR"
    git stash pop 2>/dev/null || true
    
    # Restart services
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    
    success "Rollback completed"
}

# Cleanup function
cleanup() {
    log "Performing cleanup..."
    
    # Remove temporary files
    rm -f /tmp/pharmacare_backup_path
    
    # Clean up old log files (keep last 30 days)
    find /var/log/pharmacare -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Clean up old backups (keep last 10)
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting Pharmacare Workspace Subscription RBAC Enhancement deployment"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $(date)"
    
    # Trap for cleanup on exit
    trap cleanup EXIT
    
    # Trap for rollback on error
    trap 'error "Deployment failed. Starting rollback..."; rollback; exit 1' ERR
    
    # Run deployment steps
    pre_deployment_checks
    create_backup
    update_application
    update_environment
    run_migrations
    update_indexes
    start_services
    health_checks
    
    success "Deployment completed successfully!"
    log "Deployment finished at: $(date)"
    
    # Display summary
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $ENVIRONMENT"
    echo "Backup created: $(cat /tmp/pharmacare_backup_path 2>/dev/null || echo 'N/A')"
    echo "Services running: $(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "online") | .name' | wc -l)"
    echo "API Health: $(curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo 'Unknown')"
    echo "=========================="
}

# Script usage
usage() {
    echo "Usage: $0 [environment]"
    echo "  environment: production, staging, development (default: production)"
    echo
    echo "Options:"
    echo "  --rollback    Rollback to previous version"
    echo "  --help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 staging"
    echo "  $0 --rollback"
}

# Handle command line arguments
case "${1:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --help)
        usage
        exit 0
        ;;
    "")
        main
        ;;
    *)
        if [[ "$1" =~ ^(production|staging|development)$ ]]; then
            main
        else
            echo "Invalid environment: $1"
            usage
            exit 1
        fi
        ;;
esac