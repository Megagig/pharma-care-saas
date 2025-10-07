#!/bin/bash

# PharmacyCopilot SaaS Settings Module - Backup Script
# This script creates comprehensive backups of the application, database, and user data

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="/opt/PharmacyCopilot/backups"
LOG_FILE="/var/log/PharmacyCopilot/backup.log"
RETENTION_DAYS=30

# AWS S3 Configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_REGION="${BACKUP_S3_REGION:-us-east-1}"

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
    if [[ -w "$(dirname "$LOG_FILE")" ]] || mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Error handler
error_handler() {
    local line_number=$1
    log ERROR "Backup failed at line $line_number"
    cleanup_failed_backup
    exit 1
}

# Set error trap
trap 'error_handler $LINENO' ERR

# Create backup directory structure
create_backup_structure() {
    local backup_timestamp=$1
    local backup_dir="$BACKUP_BASE_DIR/$backup_timestamp"
    
    log INFO "Creating backup directory structure: $backup_dir"
    
    mkdir -p "$backup_dir"/{database,application,uploads,config,logs}
    
    echo "$backup_dir"
}

# Backup database
backup_database() {
    local backup_dir=$1
    
    log INFO "Starting database backup..."
    
    # Load environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        source "$PROJECT_ROOT/.env.production"
    fi
    
    # Check if database container is running
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps db | grep -q "Up"; then
        log INFO "Creating PostgreSQL database dump..."
        
        # Create compressed database dump
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T db pg_dump \
            -U "${DB_USER:-PharmacyCopilot_user}" \
            -d "${DB_NAME:-PharmacyCopilot_production}" \
            --verbose \
            --no-owner \
            --no-privileges \
            --clean \
            --if-exists | gzip > "$backup_dir/database/database.sql.gz"
        
        # Create schema-only dump for quick restoration testing
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T db pg_dump \
            -U "${DB_USER:-PharmacyCopilot_user}" \
            -d "${DB_NAME:-PharmacyCopilot_production}" \
            --schema-only \
            --no-owner \
            --no-privileges > "$backup_dir/database/schema.sql"
        
        # Export database statistics
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T db psql \
            -U "${DB_USER:-PharmacyCopilot_user}" \
            -d "${DB_NAME:-PharmacyCopilot_production}" \
            -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;" \
            > "$backup_dir/database/statistics.txt"
        
        log INFO "Database backup completed"
    else
        log WARN "Database container is not running, skipping database backup"
    fi
}

# Backup Redis data
backup_redis() {
    local backup_dir=$1
    
    log INFO "Starting Redis backup..."
    
    # Check if Redis container is running
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps redis | grep -q "Up"; then
        log INFO "Creating Redis data backup..."
        
        # Create Redis dump
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T redis redis-cli BGSAVE
        
        # Wait for background save to complete
        sleep 5
        
        # Copy Redis dump file
        docker cp "$(docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps -q redis):/data/dump.rdb" "$backup_dir/database/redis-dump.rdb"
        
        # Export Redis info
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T redis redis-cli INFO > "$backup_dir/database/redis-info.txt"
        
        log INFO "Redis backup completed"
    else
        log WARN "Redis container is not running, skipping Redis backup"
    fi
}

# Backup application code
backup_application() {
    local backup_dir=$1
    
    log INFO "Starting application backup..."
    
    # Backup source code (excluding node_modules and build artifacts)
    tar -czf "$backup_dir/application/source-code.tar.gz" \
        -C "$PROJECT_ROOT" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude="build" \
        --exclude=".git" \
        --exclude="logs" \
        --exclude="uploads" \
        --exclude="*.log" \
        .
    
    # Backup package files for dependency tracking
    cp "$PROJECT_ROOT/package.json" "$backup_dir/application/"
    cp "$PROJECT_ROOT/package-lock.json" "$backup_dir/application/" 2>/dev/null || true
    
    if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
        cp "$PROJECT_ROOT/backend/package.json" "$backup_dir/application/backend-package.json"
        cp "$PROJECT_ROOT/backend/package-lock.json" "$backup_dir/application/backend-package-lock.json" 2>/dev/null || true
    fi
    
    if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
        cp "$PROJECT_ROOT/frontend/package.json" "$backup_dir/application/frontend-package.json"
        cp "$PROJECT_ROOT/frontend/package-lock.json" "$backup_dir/application/frontend-package-lock.json" 2>/dev/null || true
    fi
    
    # Backup Docker configurations
    cp "$PROJECT_ROOT/Dockerfile" "$backup_dir/application/" 2>/dev/null || true
    cp "$PROJECT_ROOT/docker-compose.yml" "$backup_dir/application/" 2>/dev/null || true
    cp "$PROJECT_ROOT/ecosystem.config.js" "$backup_dir/application/" 2>/dev/null || true
    
    # Get current Git commit information
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        cd "$PROJECT_ROOT"
        git log -1 --pretty=format:"Commit: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s" > "$backup_dir/application/git-info.txt"
        git status --porcelain > "$backup_dir/application/git-status.txt"
    fi
    
    log INFO "Application backup completed"
}

# Backup user uploads and data
backup_uploads() {
    local backup_dir=$1
    
    log INFO "Starting uploads backup..."
    
    # Backup user uploads
    if [[ -d "/var/lib/PharmacyCopilot/uploads" ]]; then
        tar -czf "$backup_dir/uploads/user-uploads.tar.gz" -C "/var/lib/PharmacyCopilot" uploads
        
        # Create file inventory
        find "/var/lib/PharmacyCopilot/uploads" -type f -exec ls -la {} \; > "$backup_dir/uploads/file-inventory.txt"
        
        # Calculate total size
        du -sh "/var/lib/PharmacyCopilot/uploads" > "$backup_dir/uploads/size-summary.txt"
        
        log INFO "Uploads backup completed"
    else
        log WARN "Uploads directory not found, skipping uploads backup"
    fi
    
    # Backup temporary files if they exist
    if [[ -d "/var/lib/PharmacyCopilot/temp" ]]; then
        tar -czf "$backup_dir/uploads/temp-files.tar.gz" -C "/var/lib/PharmacyCopilot" temp
    fi
}

# Backup configuration files
backup_config() {
    local backup_dir=$1
    
    log INFO "Starting configuration backup..."
    
    # Backup environment files (excluding sensitive data)
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        # Create sanitized version of environment file
        grep -v -E "(PASSWORD|SECRET|KEY|TOKEN)" "$PROJECT_ROOT/.env.production" > "$backup_dir/config/env-sanitized.txt" || true
    fi
    
    # Backup Nginx configuration
    if [[ -d "$PROJECT_ROOT/nginx" ]]; then
        cp -r "$PROJECT_ROOT/nginx" "$backup_dir/config/"
    fi
    
    # Backup monitoring configuration
    if [[ -d "$PROJECT_ROOT/monitoring" ]]; then
        cp -r "$PROJECT_ROOT/monitoring" "$backup_dir/config/"
    fi
    
    # Backup SSL certificates (if they exist and are not sensitive)
    if [[ -d "/etc/nginx/ssl" ]]; then
        mkdir -p "$backup_dir/config/ssl"
        # Only backup certificate files, not private keys
        find "/etc/nginx/ssl" -name "*.crt" -o -name "*.pem" | xargs -I {} cp {} "$backup_dir/config/ssl/" 2>/dev/null || true
    fi
    
    log INFO "Configuration backup completed"
}

# Backup logs
backup_logs() {
    local backup_dir=$1
    
    log INFO "Starting logs backup..."
    
    # Backup application logs
    if [[ -d "/var/log/PharmacyCopilot" ]]; then
        # Compress and backup recent logs (last 7 days)
        find "/var/log/PharmacyCopilot" -name "*.log" -mtime -7 -exec tar -czf "$backup_dir/logs/application-logs.tar.gz" {} +
        
        # Create log summary
        find "/var/log/PharmacyCopilot" -name "*.log" -exec wc -l {} \; > "$backup_dir/logs/log-summary.txt"
    fi
    
    # Backup Docker logs
    if command -v docker &> /dev/null; then
        mkdir -p "$backup_dir/logs/docker"
        
        # Get logs from running containers
        for container in $(docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps -q); do
            container_name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/^.//')
            docker logs --since="7d" "$container" > "$backup_dir/logs/docker/${container_name}.log" 2>&1 || true
        done
    fi
    
    log INFO "Logs backup completed"
}

# Create backup metadata
create_backup_metadata() {
    local backup_dir=$1
    local backup_timestamp=$2
    
    log INFO "Creating backup metadata..."
    
    cat > "$backup_dir/backup-info.json" << EOF
{
    "timestamp": "$backup_timestamp",
    "date": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "backup_type": "full",
    "application": "PharmacyCopilot-saas-settings",
    "version": "$(cat "$PROJECT_ROOT/package.json" | grep '"version"' | cut -d'"' -f4 2>/dev/null || echo 'unknown')",
    "git_commit": "$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "backup_size": "$(du -sh "$backup_dir" | cut -f1)",
    "components": {
        "database": $([ -f "$backup_dir/database/database.sql.gz" ] && echo "true" || echo "false"),
        "redis": $([ -f "$backup_dir/database/redis-dump.rdb" ] && echo "true" || echo "false"),
        "application": $([ -f "$backup_dir/application/source-code.tar.gz" ] && echo "true" || echo "false"),
        "uploads": $([ -f "$backup_dir/uploads/user-uploads.tar.gz" ] && echo "true" || echo "false"),
        "config": $([ -d "$backup_dir/config" ] && echo "true" || echo "false"),
        "logs": $([ -d "$backup_dir/logs" ] && echo "true" || echo "false")
    }
}
EOF
    
    # Create checksums for integrity verification
    find "$backup_dir" -type f -exec sha256sum {} \; > "$backup_dir/checksums.sha256"
    
    log INFO "Backup metadata created"
}

# Upload to S3 (if configured)
upload_to_s3() {
    local backup_dir=$1
    local backup_timestamp=$2
    
    if [[ -n "$S3_BUCKET" ]]; then
        log INFO "Uploading backup to S3..."
        
        # Check if AWS CLI is available
        if command -v aws &> /dev/null; then
            # Create compressed archive
            local archive_name="PharmacyCopilot-saas-backup-$backup_timestamp.tar.gz"
            tar -czf "/tmp/$archive_name" -C "$BACKUP_BASE_DIR" "$backup_timestamp"
            
            # Upload to S3
            aws s3 cp "/tmp/$archive_name" "s3://$S3_BUCKET/backups/$archive_name" --region "$S3_REGION"
            
            # Clean up local archive
            rm "/tmp/$archive_name"
            
            log INFO "Backup uploaded to S3: s3://$S3_BUCKET/backups/$archive_name"
        else
            log WARN "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log INFO "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
    
    # Cleanup S3 backups if configured
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        aws s3 ls "s3://$S3_BUCKET/backups/" | while read -r line; do
            local file_date=$(echo "$line" | awk '{print $4}' | grep -o '[0-9]\{8\}' | head -1)
            if [[ "$file_date" < "$cutoff_date" ]]; then
                local file_name=$(echo "$line" | awk '{print $4}')
                aws s3 rm "s3://$S3_BUCKET/backups/$file_name"
                log INFO "Removed old S3 backup: $file_name"
            fi
        done
    fi
    
    log INFO "Cleanup completed"
}

# Cleanup failed backup
cleanup_failed_backup() {
    if [[ -n "${CURRENT_BACKUP_DIR:-}" ]] && [[ -d "$CURRENT_BACKUP_DIR" ]]; then
        log WARN "Cleaning up failed backup: $CURRENT_BACKUP_DIR"
        rm -rf "$CURRENT_BACKUP_DIR"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_dir=$1
    
    log INFO "Verifying backup integrity..."
    
    # Verify checksums
    if [[ -f "$backup_dir/checksums.sha256" ]]; then
        cd "$backup_dir"
        if sha256sum -c checksums.sha256 --quiet; then
            log INFO "Backup integrity verification passed"
        else
            log ERROR "Backup integrity verification failed"
            return 1
        fi
    else
        log WARN "No checksums file found, skipping integrity verification"
    fi
    
    # Verify database dump
    if [[ -f "$backup_dir/database/database.sql.gz" ]]; then
        if gzip -t "$backup_dir/database/database.sql.gz"; then
            log INFO "Database backup file is valid"
        else
            log ERROR "Database backup file is corrupted"
            return 1
        fi
    fi
    
    # Verify application archive
    if [[ -f "$backup_dir/application/source-code.tar.gz" ]]; then
        if tar -tzf "$backup_dir/application/source-code.tar.gz" > /dev/null; then
            log INFO "Application backup file is valid"
        else
            log ERROR "Application backup file is corrupted"
            return 1
        fi
    fi
    
    return 0
}

# Send backup notification
send_notification() {
    local status=$1
    local backup_dir=$2
    local backup_size=$(du -sh "$backup_dir" | cut -f1)
    
    local message="PharmacyCopilot SaaS Backup $status
Backup Directory: $backup_dir
Backup Size: $backup_size
Timestamp: $(date)"
    
    # Send Slack notification if webhook URL is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local payload="{\"text\":\"💾 $message\"}"
        curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Send email notification if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "PharmacyCopilot SaaS Backup $status" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main backup function
main() {
    log INFO "Starting PharmacyCopilot SaaS Settings backup..."
    
    # Load environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        source "$PROJECT_ROOT/.env.production"
    fi
    
    # Create backup timestamp
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    
    # Create backup directory structure
    local backup_dir=$(create_backup_structure "$backup_timestamp")
    export CURRENT_BACKUP_DIR="$backup_dir"
    
    # Perform backups
    backup_database "$backup_dir"
    backup_redis "$backup_dir"
    backup_application "$backup_dir"
    backup_uploads "$backup_dir"
    backup_config "$backup_dir"
    backup_logs "$backup_dir"
    
    # Create metadata
    create_backup_metadata "$backup_dir" "$backup_timestamp"
    
    # Verify backup
    if ! verify_backup "$backup_dir"; then
        log ERROR "Backup verification failed"
        send_notification "FAILED" "$backup_dir"
        exit 1
    fi
    
    # Upload to S3 if configured
    upload_to_s3 "$backup_dir" "$backup_timestamp"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send success notification
    send_notification "SUCCESS" "$backup_dir"
    
    log INFO "Backup completed successfully: $backup_dir"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --database-only     Backup only the database"
    echo "  --no-uploads        Skip uploads backup"
    echo "  --no-s3             Skip S3 upload"
    echo "  --verify-only DIR   Only verify existing backup"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_S3_BUCKET       S3 bucket for backup storage"
    echo "  BACKUP_S3_REGION       S3 region (default: us-east-1)"
    echo "  SLACK_WEBHOOK_URL      Slack webhook URL for notifications"
    echo "  NOTIFICATION_EMAIL     Email address for notifications"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    --database-only)
        log INFO "Database-only backup mode"
        # Implement database-only backup logic
        exit 0
        ;;
    --verify-only)
        if [[ -n "${2:-}" ]] && [[ -d "$2" ]]; then
            verify_backup "$2"
            exit $?
        else
            log ERROR "Please provide a valid backup directory to verify"
            exit 1
        fi
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