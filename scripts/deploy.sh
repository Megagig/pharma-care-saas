#!/bin/bash

# PharmacyCopilot SaaS Settings Module - Production Deployment Script
# This script handles the complete deployment process for the SaaS Settings Module

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_NAME="PharmacyCopilot-saas-settings"
DEPLOY_USER="PharmacyCopilot"
BACKUP_DIR="/opt/PharmacyCopilot/backups"
LOG_FILE="/var/log/PharmacyCopilot/deploy.log"

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
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    # Log to file if log file is writable
    if [[ -w "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Error handler
error_handler() {
    local line_number=$1
    log ERROR "Deployment failed at line $line_number"
    log ERROR "Rolling back changes..."
    rollback_deployment
    exit 1
}

# Set error trap
trap 'error_handler $LINENO' ERR

# Check if running as correct user
check_user() {
    if [[ "$USER" != "$DEPLOY_USER" ]]; then
        log ERROR "This script must be run as user '$DEPLOY_USER'"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "git" "npm" "node")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log ERROR "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log ERROR "Docker daemon is not running"
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log ERROR "Production environment file not found: $PROJECT_ROOT/.env.production"
        exit 1
    fi
    
    log INFO "Prerequisites check passed"
}

# Create backup
create_backup() {
    log INFO "Creating backup..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup application code
    if [[ -d "$PROJECT_ROOT" ]]; then
        cp -r "$PROJECT_ROOT" "$backup_path/app"
        log INFO "Application code backed up to $backup_path/app"
    fi
    
    # Backup database
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps db | grep -q "Up"; then
        log INFO "Creating database backup..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$backup_path/database.sql"
        log INFO "Database backed up to $backup_path/database.sql"
    fi
    
    # Backup uploads
    if [[ -d "/var/lib/PharmacyCopilot/uploads" ]]; then
        cp -r "/var/lib/PharmacyCopilot/uploads" "$backup_path/uploads"
        log INFO "Uploads backed up to $backup_path/uploads"
    fi
    
    # Store backup path for potential rollback
    echo "$backup_path" > "$PROJECT_ROOT/.last_backup"
    
    log INFO "Backup completed: $backup_path"
}

# Update source code
update_source() {
    log INFO "Updating source code..."
    
    cd "$PROJECT_ROOT"
    
    # Fetch latest changes
    git fetch origin
    
    # Get current branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log INFO "Current branch: $current_branch"
    
    # Pull latest changes
    git pull origin "$current_branch"
    
    # Get current commit hash
    local commit_hash=$(git rev-parse HEAD)
    log INFO "Updated to commit: $commit_hash"
    
    # Store commit hash for rollback
    echo "$commit_hash" > "$PROJECT_ROOT/.last_commit"
}

# Build application
build_application() {
    log INFO "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log INFO "Installing dependencies..."
    npm ci --production
    
    # Build backend
    log INFO "Building backend..."
    cd backend
    npm ci --production
    npm run build
    
    # Build frontend
    log INFO "Building frontend..."
    cd ../frontend
    npm ci --production
    npm run build
    
    cd "$PROJECT_ROOT"
    log INFO "Application build completed"
}

# Run database migrations
run_migrations() {
    log INFO "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if database is running
    if ! docker-compose ps db | grep -q "Up"; then
        log WARN "Database container is not running, starting it..."
        docker-compose up -d db
        
        # Wait for database to be ready
        log INFO "Waiting for database to be ready..."
        sleep 30
    fi
    
    # Run migrations
    docker-compose exec -T app npm run migrate
    
    log INFO "Database migrations completed"
}

# Update Docker containers
update_containers() {
    log INFO "Updating Docker containers..."
    
    cd "$PROJECT_ROOT"
    
    # Build new images
    log INFO "Building Docker images..."
    docker-compose build --no-cache
    
    # Stop existing containers
    log INFO "Stopping existing containers..."
    docker-compose down
    
    # Start updated containers
    log INFO "Starting updated containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    log INFO "Waiting for services to be ready..."
    sleep 60
    
    log INFO "Docker containers updated"
}

# Health check
health_check() {
    log INFO "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log INFO "Health check attempt $attempt/$max_attempts"
        
        if node "$PROJECT_ROOT/healthcheck.js"; then
            log INFO "Health check passed"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log ERROR "Health check failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Rollback deployment
rollback_deployment() {
    log WARN "Rolling back deployment..."
    
    if [[ -f "$PROJECT_ROOT/.last_backup" ]]; then
        local backup_path=$(cat "$PROJECT_ROOT/.last_backup")
        
        if [[ -d "$backup_path" ]]; then
            log INFO "Restoring from backup: $backup_path"
            
            # Stop current containers
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down
            
            # Restore application code
            if [[ -d "$backup_path/app" ]]; then
                rm -rf "$PROJECT_ROOT"
                cp -r "$backup_path/app" "$PROJECT_ROOT"
            fi
            
            # Restore database
            if [[ -f "$backup_path/database.sql" ]]; then
                docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d db
                sleep 30
                docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T db psql -U "$DB_USER" -d "$DB_NAME" < "$backup_path/database.sql"
            fi
            
            # Restore uploads
            if [[ -d "$backup_path/uploads" ]]; then
                rm -rf "/var/lib/PharmacyCopilot/uploads"
                cp -r "$backup_path/uploads" "/var/lib/PharmacyCopilot/uploads"
            fi
            
            # Start containers
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d
            
            log INFO "Rollback completed"
        else
            log ERROR "Backup directory not found: $backup_path"
        fi
    else
        log ERROR "No backup information found"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log INFO "Cleaning up old backups..."
    
    # Keep only last 10 backups
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +11 | xargs -r rm -rf
    
    log INFO "Backup cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send Slack notification if webhook URL is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local payload="{\"text\":\"🚀 PharmacyCopilot SaaS Deployment $status: $message\"}"
        curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Send email notification if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "PharmacyCopilot SaaS Deployment $status" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main deployment function
main() {
    log INFO "Starting PharmacyCopilot SaaS Settings deployment..."
    
    # Load environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        source "$PROJECT_ROOT/.env.production"
    fi
    
    # Check user
    check_user
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Update source code
    update_source
    
    # Build application
    build_application
    
    # Run database migrations
    run_migrations
    
    # Update Docker containers
    update_containers
    
    # Perform health check
    if ! health_check; then
        log ERROR "Deployment failed health check"
        rollback_deployment
        send_notification "FAILED" "Deployment failed health check and was rolled back"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_backups
    
    # Send success notification
    send_notification "SUCCESS" "Deployment completed successfully"
    
    log INFO "Deployment completed successfully!"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --dry-run      Perform a dry run without making changes"
    echo "  --rollback     Rollback to the last backup"
    echo ""
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK_URL    Slack webhook URL for notifications"
    echo "  NOTIFICATION_EMAIL   Email address for notifications"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    --dry-run)
        log INFO "Dry run mode - no changes will be made"
        # Add dry run logic here
        exit 0
        ;;
    --rollback)
        log INFO "Rolling back to last backup..."
        rollback_deployment
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log ERROR "Unknown option: $1"
        usage
        exit 1
        ;;
esac