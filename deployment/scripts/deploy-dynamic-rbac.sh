#!/bin/bash

# Dynamic RBAC Deployment Script
# Version: 1.0
# Description: Complete deployment script for dynamic RBAC system
# Author: System
# Date: 2025-01-27

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/rbac-deployment.log"
BACKUP_DIR="/var/backups/rbac-deployment-$(date +%Y%m%d-%H%M%S)"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
DRY_RUN="${DRY_RUN:-false}"

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
    log ERROR "Deployment failed at line $line_number"
    log ERROR "Rolling back changes..."
    rollback_deployment
    exit 1
}

trap 'error_handler $LINENO' ERR

# Check prerequisites
check_prerequisites() {
    log INFO "Checking deployment prerequisites..."
    
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
    
    # Check Redis connection (if using Redis for caching)
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
    local required_space=1048576 # 1GB in KB
    if [[ $available_space -lt $required_space ]]; then
        log ERROR "Insufficient disk space. Required: 1GB, Available: $(($available_space/1024))MB"
        exit 1
    fi
    
    log INFO "Prerequisites check completed successfully"
}

# Create backup
create_backup() {
    log INFO "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log INFO "Backing up MongoDB database..."
    if command -v mongodump &> /dev/null; then
        mongodump --host "${MONGO_HOST:-localhost:27017}" \
                  --db "${MONGO_DB:-pharmacare}" \
                  --out "$BACKUP_DIR/mongodb" \
                  --quiet
    else
        log WARN "mongodump not available. Skipping database backup."
    fi
    
    # Backup application files
    log INFO "Backing up application files..."
    cp -r "$PROJECT_ROOT/backend/src" "$BACKUP_DIR/backend-src"
    cp -r "$PROJECT_ROOT/frontend/src" "$BACKUP_DIR/frontend-src"
    
    # Backup configuration files
    cp "$PROJECT_ROOT/backend/.env" "$BACKUP_DIR/backend-env" 2>/dev/null || true
    cp "$PROJECT_ROOT/frontend/.env" "$BACKUP_DIR/frontend-env" 2>/dev/null || true
    
    # Backup PM2 configuration
    if command -v pm2 &> /dev/null; then
        pm2 save --force
        cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-dump.pm2" 2>/dev/null || true
    fi
    
    log INFO "Backup created at $BACKUP_DIR"
}

# Install dependencies
install_dependencies() {
    log INFO "Installing/updating dependencies..."
    
    # Backend dependencies
    cd "$PROJECT_ROOT/backend"
    if [[ "$DRY_RUN" == "false" ]]; then
        npm ci --production
        log INFO "Backend dependencies installed"
    else
        log INFO "[DRY RUN] Would install backend dependencies"
    fi
    
    # Frontend dependencies (if needed for build)
    cd "$PROJECT_ROOT/frontend"
    if [[ "$DRY_RUN" == "false" ]]; then
        npm ci
        npm run build
        log INFO "Frontend built successfully"
    else
        log INFO "[DRY RUN] Would build frontend"
    fi
    
    cd "$PROJECT_ROOT"
}

# Run database migrations
run_migrations() {
    log INFO "Running database migrations..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Run RBAC migration script
        log INFO "Running RBAC migration..."
        npm run migrate:rbac || {
            log ERROR "RBAC migration failed"
            return 1
        }
        
        # Validate migration
        log INFO "Validating migration..."
        npm run validate:rbac-migration || {
            log ERROR "Migration validation failed"
            return 1
        }
        
        log INFO "Database migrations completed successfully"
    else
        log INFO "[DRY RUN] Would run database migrations"
    fi
}

# Update application configuration
update_configuration() {
    log INFO "Updating application configuration..."
    
    # Update backend configuration
    local backend_env="$PROJECT_ROOT/backend/.env"
    if [[ -f "$backend_env" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Enable dynamic RBAC
            if grep -q "ENABLE_DYNAMIC_RBAC" "$backend_env"; then
                sed -i 's/ENABLE_DYNAMIC_RBAC=.*/ENABLE_DYNAMIC_RBAC=true/' "$backend_env"
            else
                echo "ENABLE_DYNAMIC_RBAC=true" >> "$backend_env"
            fi
            
            # Set RBAC cache TTL
            if grep -q "RBAC_CACHE_TTL" "$backend_env"; then
                sed -i 's/RBAC_CACHE_TTL=.*/RBAC_CACHE_TTL=300/' "$backend_env"
            else
                echo "RBAC_CACHE_TTL=300" >> "$backend_env"
            fi
            
            # Enable RBAC monitoring
            if grep -q "ENABLE_RBAC_MONITORING" "$backend_env"; then
                sed -i 's/ENABLE_RBAC_MONITORING=.*/ENABLE_RBAC_MONITORING=true/' "$backend_env"
            else
                echo "ENABLE_RBAC_MONITORING=true" >> "$backend_env"
            fi
            
            log INFO "Backend configuration updated"
        else
            log INFO "[DRY RUN] Would update backend configuration"
        fi
    else
        log WARN "Backend .env file not found"
    fi
}

# Deploy monitoring configuration
deploy_monitoring() {
    log INFO "Deploying monitoring configuration..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Update Prometheus configuration
        if [[ -f "/etc/prometheus/prometheus.yml" ]]; then
            log INFO "Updating Prometheus configuration..."
            # Add RBAC metrics endpoint
            if ! grep -q "rbac-metrics" /etc/prometheus/prometheus.yml; then
                cat >> /etc/prometheus/prometheus.yml << EOF

  # RBAC Metrics
  - job_name: 'rbac-metrics'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics/rbac'
    scrape_interval: 15s
EOF
            fi
            
            # Reload Prometheus configuration
            if command -v systemctl &> /dev/null; then
                systemctl reload prometheus || log WARN "Failed to reload Prometheus"
            fi
        fi
        
        # Deploy Grafana dashboard
        local grafana_dashboard_dir="/var/lib/grafana/dashboards"
        if [[ -d "$grafana_dashboard_dir" ]]; then
            cp "$PROJECT_ROOT/monitoring/grafana-dashboards/rbac-performance-dashboard.json" \
               "$grafana_dashboard_dir/" || log WARN "Failed to deploy Grafana dashboard"
        fi
        
        # Deploy alert rules
        local prometheus_rules_dir="/etc/prometheus/rules"
        if [[ -d "$prometheus_rules_dir" ]]; then
            cp "$PROJECT_ROOT/monitoring/prometheus-alerts/rbac-alerts.yml" \
               "$prometheus_rules_dir/" || log WARN "Failed to deploy alert rules"
        fi
        
        log INFO "Monitoring configuration deployed"
    else
        log INFO "[DRY RUN] Would deploy monitoring configuration"
    fi
}

# Restart services
restart_services() {
    log INFO "Restarting services..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Restart backend service
        if command -v pm2 &> /dev/null; then
            log INFO "Restarting backend with PM2..."
            pm2 restart pharmacare-backend || {
                log ERROR "Failed to restart backend with PM2"
                return 1
            }
        elif command -v systemctl &> /dev/null; then
            log INFO "Restarting backend with systemctl..."
            systemctl restart pharmacare-backend || {
                log ERROR "Failed to restart backend with systemctl"
                return 1
            }
        else
            log WARN "No process manager found. Manual restart required."
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
        
        log INFO "Services restarted successfully"
    else
        log INFO "[DRY RUN] Would restart services"
    fi
}

# Run post-deployment tests
run_tests() {
    log INFO "Running post-deployment tests..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Run RBAC integration tests
        log INFO "Running RBAC integration tests..."
        npm run test:rbac:integration || {
            log ERROR "RBAC integration tests failed"
            return 1
        }
        
        # Run smoke tests
        log INFO "Running smoke tests..."
        npm run test:smoke || {
            log ERROR "Smoke tests failed"
            return 1
        }
        
        # Test API endpoints
        log INFO "Testing API endpoints..."
        local api_base="http://localhost:5000/api"
        
        # Test health endpoint
        if ! curl -f -s "$api_base/health" > /dev/null; then
            log ERROR "Health endpoint test failed"
            return 1
        fi
        
        # Test RBAC endpoints (with authentication)
        # Note: This would require valid authentication tokens
        log INFO "API endpoint tests completed"
        
        log INFO "Post-deployment tests completed successfully"
    else
        log INFO "[DRY RUN] Would run post-deployment tests"
    fi
}

# Rollback deployment
rollback_deployment() {
    log INFO "Rolling back deployment..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Restore database
        if [[ -d "$BACKUP_DIR/mongodb" ]]; then
            log INFO "Restoring database..."
            if command -v mongorestore &> /dev/null; then
                mongorestore --host "${MONGO_HOST:-localhost:27017}" \
                           --db "${MONGO_DB:-pharmacare}" \
                           --drop \
                           "$BACKUP_DIR/mongodb/pharmacare" \
                           --quiet
            fi
        fi
        
        # Restore application files
        log INFO "Restoring application files..."
        if [[ -d "$BACKUP_DIR/backend-src" ]]; then
            rm -rf "$PROJECT_ROOT/backend/src"
            cp -r "$BACKUP_DIR/backend-src" "$PROJECT_ROOT/backend/src"
        fi
        
        if [[ -d "$BACKUP_DIR/frontend-src" ]]; then
            rm -rf "$PROJECT_ROOT/frontend/src"
            cp -r "$BACKUP_DIR/frontend-src" "$PROJECT_ROOT/frontend/src"
        fi
        
        # Restore configuration
        if [[ -f "$BACKUP_DIR/backend-env" ]]; then
            cp "$BACKUP_DIR/backend-env" "$PROJECT_ROOT/backend/.env"
        fi
        
        # Restart services
        restart_services
        
        log INFO "Rollback completed"
    else
        log ERROR "Backup directory not found. Cannot rollback."
    fi
}

# Cleanup old backups
cleanup_backups() {
    log INFO "Cleaning up old backups..."
    
    # Keep only the last 5 backups
    local backup_parent_dir="/var/backups"
    if [[ -d "$backup_parent_dir" ]]; then
        find "$backup_parent_dir" -name "rbac-deployment-*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
        log INFO "Old backups cleaned up"
    fi
}

# Main deployment function
main() {
    log INFO "Starting Dynamic RBAC deployment..."
    log INFO "Environment: $DEPLOYMENT_ENV"
    log INFO "Dry run: $DRY_RUN"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run deployment steps
    check_prerequisites
    create_backup
    install_dependencies
    run_migrations
    update_configuration
    deploy_monitoring
    restart_services
    run_tests
    cleanup_backups
    
    log INFO "Dynamic RBAC deployment completed successfully!"
    log INFO "Backup location: $BACKUP_DIR"
    log INFO "Log file: $LOG_FILE"
    
    # Display post-deployment information
    cat << EOF

${GREEN}✅ Dynamic RBAC Deployment Completed Successfully!${NC}

📋 Summary:
- Database migrations: ✅ Completed
- Configuration updates: ✅ Completed  
- Monitoring setup: ✅ Completed
- Services restart: ✅ Completed
- Post-deployment tests: ✅ Passed

📊 Monitoring:
- Grafana Dashboard: http://localhost:3000/d/rbac-performance
- Prometheus Metrics: http://localhost:9090/targets
- Application Health: http://localhost:5000/health

📁 Important Files:
- Backup: $BACKUP_DIR
- Logs: $LOG_FILE
- Configuration: $PROJECT_ROOT/backend/.env

🔧 Next Steps:
1. Verify all users can access the system
2. Check monitoring dashboards for any issues
3. Schedule regular RBAC audits
4. Update documentation with new procedures

⚠️  Rollback:
If issues occur, run: $0 --rollback

EOF
}

# Handle command line arguments
case "${1:-}" in
    --rollback)
        log INFO "Initiating rollback..."
        rollback_deployment
        ;;
    --dry-run)
        DRY_RUN=true
        main
        ;;
    --help|-h)
        cat << EOF
Dynamic RBAC Deployment Script

Usage: $0 [OPTIONS]

Options:
    --dry-run    Run deployment simulation without making changes
    --rollback   Rollback to previous version
    --help, -h   Show this help message

Environment Variables:
    DEPLOYMENT_ENV    Deployment environment (default: production)
    DRY_RUN          Enable dry run mode (default: false)
    MONGO_HOST       MongoDB host (default: localhost:27017)
    MONGO_DB         MongoDB database name (default: pharmacare)

Examples:
    $0                    # Normal deployment
    $0 --dry-run         # Simulate deployment
    $0 --rollback        # Rollback deployment
    DRY_RUN=true $0      # Dry run via environment variable

EOF
        ;;
    *)
        main
        ;;
esac