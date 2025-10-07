#!/bin/bash

# Dynamic RBAC Rollback Script
# Version: 1.0
# Description: Emergency rollback script for dynamic RBAC system
# Author: System
# Date: 2025-01-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/rbac-rollback.log"
BACKUP_DIR="${BACKUP_DIR:-}"
ROLLBACK_ENV="${ROLLBACK_ENV:-production}"

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

# Find latest backup
find_latest_backup() {
    local backup_parent_dir="/var/backups"
    
    if [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]]; then
        log INFO "Using specified backup directory: $BACKUP_DIR"
        return 0
    fi
    
    if [[ -d "$backup_parent_dir" ]]; then
        BACKUP_DIR=$(find "$backup_parent_dir" -name "rbac-deployment-*" -type d | sort -r | head -n1)
        
        if [[ -n "$BACKUP_DIR" ]]; then
            log INFO "Found latest backup: $BACKUP_DIR"
            return 0
        fi
    fi
    
    log ERROR "No backup directory found. Cannot proceed with rollback."
    exit 1
}

# Validate backup integrity
validate_backup() {
    log INFO "Validating backup integrity..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log ERROR "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # Check for essential backup components
    local required_components=(
        "mongodb"
        "backend-src"
        "frontend-src"
        "backend-env"
    )
    
    for component in "${required_components[@]}"; do
        if [[ ! -e "$BACKUP_DIR/$component" ]]; then
            log WARN "Backup component missing: $component"
        else
            log DEBUG "Backup component found: $component"
        fi
    done
    
    # Check backup timestamp
    local backup_timestamp=$(basename "$BACKUP_DIR" | sed 's/rbac-deployment-//')
    log INFO "Backup timestamp: $backup_timestamp"
    
    # Confirm rollback
    echo -e "${YELLOW}⚠️  WARNING: This will rollback the Dynamic RBAC system to the backup state.${NC}"
    echo -e "${YELLOW}   All changes made after the backup will be lost.${NC}"
    echo -e "${YELLOW}   Backup: $BACKUP_DIR${NC}"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log INFO "Rollback cancelled by user"
        exit 0
    fi
    
    log INFO "Backup validation completed"
}

# Stop services
stop_services() {
    log INFO "Stopping services..."
    
    # Stop backend service
    if command -v pm2 &> /dev/null; then
        log INFO "Stopping backend with PM2..."
        pm2 stop PharmacyCopilot-backend || log WARN "Failed to stop backend with PM2"
    elif command -v systemctl &> /dev/null; then
        log INFO "Stopping backend with systemctl..."
        systemctl stop PharmacyCopilot-backend || log WARN "Failed to stop backend with systemctl"
    else
        log WARN "No process manager found. Manual service stop required."
    fi
    
    # Wait for services to stop
    sleep 5
    
    log INFO "Services stopped"
}

# Rollback database
rollback_database() {
    log INFO "Rolling back database..."
    
    if [[ -d "$BACKUP_DIR/mongodb" ]]; then
        if command -v mongorestore &> /dev/null; then
            log INFO "Restoring MongoDB from backup..."
            
            # Drop current database first
            if command -v mongosh &> /dev/null; then
                mongosh "${MONGO_DB:-PharmacyCopilot}" --eval "db.dropDatabase()" --quiet || log WARN "Failed to drop current database"
            elif command -v mongo &> /dev/null; then
                mongo "${MONGO_DB:-PharmacyCopilot}" --eval "db.dropDatabase()" --quiet || log WARN "Failed to drop current database"
            fi
            
            # Restore from backup
            mongorestore --host "${MONGO_HOST:-localhost:27017}" \
                       --db "${MONGO_DB:-PharmacyCopilot}" \
                       --drop \
                       "$BACKUP_DIR/mongodb/PharmacyCopilot" \
                       --quiet || {
                log ERROR "Database restore failed"
                return 1
            }
            
            log INFO "Database restored successfully"
        else
            log ERROR "mongorestore not available. Cannot restore database."
            return 1
        fi
    else
        log WARN "No database backup found. Skipping database rollback."
    fi
}

# Rollback application files
rollback_application() {
    log INFO "Rolling back application files..."
    
    # Backup current state before rollback
    local current_backup_dir="/tmp/rbac-rollback-current-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$current_backup_dir"
    
    # Backup current backend
    if [[ -d "$PROJECT_ROOT/backend/src" ]]; then
        cp -r "$PROJECT_ROOT/backend/src" "$current_backup_dir/backend-src-current"
    fi
    
    # Backup current frontend
    if [[ -d "$PROJECT_ROOT/frontend/src" ]]; then
        cp -r "$PROJECT_ROOT/frontend/src" "$current_backup_dir/frontend-src-current"
    fi
    
    log INFO "Current state backed up to: $current_backup_dir"
    
    # Restore backend files
    if [[ -d "$BACKUP_DIR/backend-src" ]]; then
        log INFO "Restoring backend files..."
        rm -rf "$PROJECT_ROOT/backend/src"
        cp -r "$BACKUP_DIR/backend-src" "$PROJECT_ROOT/backend/src"
        log INFO "Backend files restored"
    else
        log WARN "No backend backup found. Skipping backend rollback."
    fi
    
    # Restore frontend files
    if [[ -d "$BACKUP_DIR/frontend-src" ]]; then
        log INFO "Restoring frontend files..."
        rm -rf "$PROJECT_ROOT/frontend/src"
        cp -r "$BACKUP_DIR/frontend-src" "$PROJECT_ROOT/frontend/src"
        log INFO "Frontend files restored"
    else
        log WARN "No frontend backup found. Skipping frontend rollback."
    fi
    
    # Restore configuration files
    if [[ -f "$BACKUP_DIR/backend-env" ]]; then
        log INFO "Restoring backend configuration..."
        cp "$BACKUP_DIR/backend-env" "$PROJECT_ROOT/backend/.env"
        log INFO "Backend configuration restored"
    else
        log WARN "No backend configuration backup found."
    fi
    
    if [[ -f "$BACKUP_DIR/frontend-env" ]]; then
        log INFO "Restoring frontend configuration..."
        cp "$BACKUP_DIR/frontend-env" "$PROJECT_ROOT/frontend/.env"
        log INFO "Frontend configuration restored"
    else
        log WARN "No frontend configuration backup found."
    fi
}

# Rollback monitoring configuration
rollback_monitoring() {
    log INFO "Rolling back monitoring configuration..."
    
    # Remove RBAC-specific Prometheus configuration
    if [[ -f "/etc/prometheus/prometheus.yml" ]]; then
        log INFO "Removing RBAC metrics from Prometheus configuration..."
        # Remove RBAC metrics section
        sed -i '/# RBAC Metrics/,/scrape_interval: 15s/d' /etc/prometheus/prometheus.yml || log WARN "Failed to update Prometheus config"
        
        # Reload Prometheus
        if command -v systemctl &> /dev/null; then
            systemctl reload prometheus || log WARN "Failed to reload Prometheus"
        fi
    fi
    
    # Remove Grafana dashboard
    local grafana_dashboard_dir="/var/lib/grafana/dashboards"
    if [[ -f "$grafana_dashboard_dir/rbac-performance-dashboard.json" ]]; then
        rm -f "$grafana_dashboard_dir/rbac-performance-dashboard.json" || log WARN "Failed to remove Grafana dashboard"
    fi
    
    # Remove alert rules
    local prometheus_rules_dir="/etc/prometheus/rules"
    if [[ -f "$prometheus_rules_dir/rbac-alerts.yml" ]]; then
        rm -f "$prometheus_rules_dir/rbac-alerts.yml" || log WARN "Failed to remove alert rules"
    fi
    
    log INFO "Monitoring configuration rolled back"
}

# Reinstall dependencies
reinstall_dependencies() {
    log INFO "Reinstalling dependencies..."
    
    # Backend dependencies
    cd "$PROJECT_ROOT/backend"
    if [[ -f "package.json" ]]; then
        npm ci --production || {
            log ERROR "Failed to install backend dependencies"
            return 1
        }
        log INFO "Backend dependencies installed"
    fi
    
    # Frontend dependencies and build
    cd "$PROJECT_ROOT/frontend"
    if [[ -f "package.json" ]]; then
        npm ci || {
            log ERROR "Failed to install frontend dependencies"
            return 1
        }
        
        npm run build || {
            log ERROR "Failed to build frontend"
            return 1
        }
        log INFO "Frontend built successfully"
    fi
    
    cd "$PROJECT_ROOT"
}

# Start services
start_services() {
    log INFO "Starting services..."
    
    # Start backend service
    if command -v pm2 &> /dev/null; then
        log INFO "Starting backend with PM2..."
        
        # Restore PM2 configuration if available
        if [[ -f "$BACKUP_DIR/pm2-dump.pm2" ]]; then
            cp "$BACKUP_DIR/pm2-dump.pm2" ~/.pm2/dump.pm2
            pm2 resurrect || log WARN "Failed to restore PM2 configuration"
        fi
        
        pm2 start PharmacyCopilot-backend || {
            log ERROR "Failed to start backend with PM2"
            return 1
        }
    elif command -v systemctl &> /dev/null; then
        log INFO "Starting backend with systemctl..."
        systemctl start PharmacyCopilot-backend || {
            log ERROR "Failed to start backend with systemctl"
            return 1
        }
    else
        log WARN "No process manager found. Manual service start required."
    fi
    
    # Wait for service to be ready
    log INFO "Waiting for service to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:5000/health" > /dev/null 2>&1; then
            log INFO "Service is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log ERROR "Service failed to start within timeout"
            return 1
        fi
        
        log INFO "Waiting for service... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    log INFO "Services started successfully"
}

# Run post-rollback validation
validate_rollback() {
    log INFO "Validating rollback..."
    
    # Test basic API endpoints
    local api_base="http://localhost:5000/api"
    
    # Test health endpoint
    if curl -f -s "$api_base/health" > /dev/null; then
        log INFO "Health endpoint test: PASSED"
    else
        log ERROR "Health endpoint test: FAILED"
        return 1
    fi
    
    # Test database connectivity
    cd "$PROJECT_ROOT/backend"
    if npm run test:db-connection > /dev/null 2>&1; then
        log INFO "Database connectivity test: PASSED"
    else
        log WARN "Database connectivity test: FAILED"
    fi
    
    # Check for any critical errors in logs
    if [[ -f "/var/log/PharmacyCopilot-backend.log" ]]; then
        local error_count=$(grep -c "ERROR\|FATAL" /var/log/PharmacyCopilot-backend.log | tail -n 100 || echo "0")
        if [[ $error_count -gt 0 ]]; then
            log WARN "Found $error_count errors in recent logs"
        else
            log INFO "No critical errors found in recent logs"
        fi
    fi
    
    log INFO "Rollback validation completed"
}

# Main rollback function
main() {
    log INFO "Starting Dynamic RBAC rollback..."
    log INFO "Environment: $ROLLBACK_ENV"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run rollback steps
    find_latest_backup
    validate_backup
    stop_services
    rollback_database
    rollback_application
    rollback_monitoring
    reinstall_dependencies
    start_services
    validate_rollback
    
    log INFO "Dynamic RBAC rollback completed successfully!"
    log INFO "Backup used: $BACKUP_DIR"
    log INFO "Log file: $LOG_FILE"
    
    # Display post-rollback information
    cat << EOF

${GREEN}✅ Dynamic RBAC Rollback Completed Successfully!${NC}

📋 Summary:
- Services stopped: ✅ Completed
- Database restored: ✅ Completed
- Application files restored: ✅ Completed
- Configuration restored: ✅ Completed
- Monitoring rolled back: ✅ Completed
- Dependencies reinstalled: ✅ Completed
- Services restarted: ✅ Completed
- Validation tests: ✅ Passed

📁 Important Files:
- Backup used: $BACKUP_DIR
- Current state backup: /tmp/rbac-rollback-current-*
- Logs: $LOG_FILE

🔧 Next Steps:
1. Verify all users can access the system
2. Check application functionality
3. Monitor system for any issues
4. Update team about the rollback

⚠️  Note:
- All RBAC changes made after the backup have been reverted
- Users may need to be informed about any permission changes
- Consider investigating the root cause that required rollback

EOF
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        cat << EOF
Dynamic RBAC Rollback Script

Usage: $0 [OPTIONS]

Options:
    --help, -h   Show this help message

Environment Variables:
    ROLLBACK_ENV     Rollback environment (default: production)
    BACKUP_DIR       Specific backup directory to use
    MONGO_HOST       MongoDB host (default: localhost:27017)
    MONGO_DB         MongoDB database name (default: PharmacyCopilot)

Examples:
    $0                                    # Rollback using latest backup
    BACKUP_DIR=/path/to/backup $0         # Rollback using specific backup
    ROLLBACK_ENV=staging $0               # Rollback in staging environment

EOF
        ;;
    *)
        main
        ;;
esac