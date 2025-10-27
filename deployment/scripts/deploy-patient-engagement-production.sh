#!/bin/bash

# =============================================================================
# Patient Engagement & Follow-up Management - Production Deployment Script
# =============================================================================
# 
# This script handles the complete production deployment of the Patient 
# Engagement & Follow-up Management module with zero-downtime deployment,
# database migrations, feature flag management, and comprehensive monitoring.
#
# Usage:
#   ./deploy-patient-engagement-production.sh [OPTIONS]
#
# Options:
#   --dry-run              Test deployment without making changes
#   --rollback             Rollback to previous version
#   --status               Check deployment status
#   --health-check         Run health checks only
#   --migrate-only         Run database migrations only
#   --feature-flags-only   Update feature flags only
#   --monitoring-only      Setup monitoring only
#   --help                 Show this help message
#
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
BACKUP_DIR="/var/backups/patient-engagement-production"
LOG_DIR="/var/log/patient-engagement-deployment"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOYMENT_ID="patient-engagement-prod-$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DRY_RUN=false
ROLLBACK=false
STATUS_CHECK=false
HEALTH_CHECK_ONLY=false
MIGRATE_ONLY=false
FEATURE_FLAGS_ONLY=false
MONITORING_ONLY=false
VERBOSE=false

# Production configuration
PRODUCTION_ENV="production"
BACKEND_SERVICE="PharmacyCopilot-backend"
FRONTEND_SERVICE="PharmacyCopilot-frontend"
DATABASE_SERVICE="PharmacyCopilot-db"
REDIS_SERVICE="PharmacyCopilot-redis"
NGINX_SERVICE="PharmacyCopilot-nginx"

# Deployment configuration
ZERO_DOWNTIME=true
HEALTH_CHECK_TIMEOUT=300
MIGRATION_TIMEOUT=600
ROLLBACK_TIMEOUT=300
MAX_DEPLOYMENT_TIME=1800

# Feature flags for gradual rollout
FEATURE_FLAGS=(
    "PATIENT_ENGAGEMENT_ENABLED"
    "APPOINTMENT_SCHEDULING_ENABLED"
    "FOLLOW_UP_MANAGEMENT_ENABLED"
    "REMINDER_SYSTEM_ENABLED"
    "PATIENT_PORTAL_ENABLED"
    "ANALYTICS_REPORTING_ENABLED"
)

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" ;;
        "DEBUG") [[ $VERBOSE == true ]] && echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" ;;
    esac
    
    # Also log to file
    mkdir -p "$LOG_DIR"
    echo "[$level] [$timestamp] $message" >> "$LOG_DIR/deployment-$TIMESTAMP.log"
}

error_exit() {
    log "ERROR" "$1"
    exit 1
}

check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        error_exit "This script should not be run as root for security reasons"
    fi
    
    # Check required commands
    local required_commands=("node" "npm" "mongosh" "redis-cli" "docker" "docker-compose" "pm2" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' not found"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        error_exit "Node.js version $node_version is below required $required_version"
    fi
    
    # Check available disk space (minimum 5GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=5242880 # 5GB in KB
    if [[ $available_space -lt $required_space ]]; then
        error_exit "Insufficient disk space. Required: 5GB, Available: $(($available_space/1024/1024))GB"
    fi
    
    # Check if services are running
    check_service_status "$DATABASE_SERVICE" "MongoDB"
    check_service_status "$REDIS_SERVICE" "Redis"
    
    log "INFO" "Prerequisites check completed successfully"
}

check_service_status() {
    local service_name=$1
    local display_name=$2
    
    if systemctl is-active --quiet "$service_name" || docker ps --format "table {{.Names}}" | grep -q "$service_name"; then
        log "INFO" "$display_name service is running"
    else
        error_exit "$display_name service is not running. Please start it before deployment."
    fi
}

create_backup() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would create backup in $BACKUP_DIR/$DEPLOYMENT_ID"
        return 0
    fi
    
    log "INFO" "Creating deployment backup..."
    
    local backup_path="$BACKUP_DIR/$DEPLOYMENT_ID"
    mkdir -p "$backup_path"
    
    # Backup database
    log "INFO" "Backing up MongoDB database..."
    if ! mongodump --host localhost:27017 --db PharmacyCopilot --out "$backup_path/mongodb" --quiet; then
        error_exit "Database backup failed"
    fi
    
    # Backup Redis data
    log "INFO" "Backing up Redis data..."
    if ! redis-cli --rdb "$backup_path/redis-dump.rdb" > /dev/null 2>&1; then
        log "WARN" "Redis backup failed, continuing without Redis backup"
    fi
    
    # Backup configuration files
    log "INFO" "Backing up configuration files..."
    mkdir -p "$backup_path/config"
    cp -r "$PROJECT_ROOT/backend/.env"* "$backup_path/config/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/frontend/.env"* "$backup_path/config/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/docker-compose.yml" "$backup_path/config/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/nginx" "$backup_path/config/" 2>/dev/null || true
    
    # Backup current application code
    log "INFO" "Backing up application code..."
    mkdir -p "$backup_path/application"
    tar -czf "$backup_path/application/backend.tar.gz" -C "$PROJECT_ROOT" backend --exclude=node_modules --exclude=dist
    tar -czf "$backup_path/application/frontend.tar.gz" -C "$PROJECT_ROOT" frontend --exclude=node_modules --exclude=dist
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
    "deployment_id": "$DEPLOYMENT_ID",
    "timestamp": "$TIMESTAMP",
    "backup_type": "pre_deployment",
    "services": {
        "mongodb": "$(mongosh --quiet --eval 'db.version()')",
        "redis": "$(redis-cli info server | grep redis_version | cut -d: -f2 | tr -d '\r')",
        "node": "$(node --version)",
        "npm": "$(npm --version)"
    },
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    log "INFO" "Backup created successfully at $backup_path"
    echo "$backup_path" > "$BACKUP_DIR/latest-backup.txt"
}

run_database_migrations() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would run database migrations"
        return 0
    fi
    
    log "INFO" "Running database migrations..."
    
    # Check if migration script exists
    local migration_script="$DEPLOYMENT_DIR/database-migrations/003_patient_engagement_production.js"
    if [[ ! -f "$migration_script" ]]; then
        log "INFO" "Creating patient engagement migration script..."
        create_migration_script "$migration_script"
    fi
    
    # Run migration with timeout
    timeout $MIGRATION_TIMEOUT mongosh PharmacyCopilot "$migration_script" || {
        error_exit "Database migration failed or timed out"
    }
    
    # Verify migration success
    verify_database_migration
    
    log "INFO" "Database migrations completed successfully"
}

create_migration_script() {
    local script_path=$1
    
    mkdir -p "$(dirname "$script_path")"
    
    cat > "$script_path" << 'EOF'
// Patient Engagement & Follow-up Management - Production Migration Script
// This script creates indexes and performs data migrations for production deployment

print("Starting Patient Engagement production migration...");

// Create indexes for optimal performance
print("Creating database indexes...");

// Appointment indexes
db.appointments.createIndex({ "workplaceId": 1, "scheduledDate": 1, "status": 1 });
db.appointments.createIndex({ "workplaceId": 1, "patientId": 1, "scheduledDate": -1 });
db.appointments.createIndex({ "workplaceId": 1, "assignedTo": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "workplaceId": 1, "type": 1, "status": 1 });
db.appointments.createIndex({ "workplaceId": 1, "locationId": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "recurringSeriesId": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "status": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "reminders.scheduledFor": 1, "reminders.sent": 1 });
db.appointments.createIndex({ "createdAt": -1 });

// FollowUpTask indexes
db.followuptasks.createIndex({ "workplaceId": 1, "status": 1, "dueDate": 1 });
db.followuptasks.createIndex({ "workplaceId": 1, "patientId": 1, "status": 1 });
db.followuptasks.createIndex({ "workplaceId": 1, "assignedTo": 1, "status": 1, "priority": -1 });
db.followuptasks.createIndex({ "workplaceId": 1, "type": 1, "status": 1 });
db.followuptasks.createIndex({ "status": 1, "dueDate": 1 });
db.followuptasks.createIndex({ "trigger.type": 1, "trigger.sourceId": 1 });
db.followuptasks.createIndex({ "createdAt": -1 });

// ReminderTemplate indexes
db.remindertemplates.createIndex({ "workplaceId": 1, "type": 1, "isActive": 1 });
db.remindertemplates.createIndex({ "workplaceId": 1, "isDefault": 1 });
db.remindertemplates.createIndex({ "isActive": 1, "type": 1 });

// PharmacistSchedule indexes
db.pharmacistschedules.createIndex({ "workplaceId": 1, "pharmacistId": 1, "isActive": 1 });
db.pharmacistschedules.createIndex({ "workplaceId": 1, "locationId": 1, "isActive": 1 });
db.pharmacistschedules.createIndex({ "pharmacistId": 1, "effectiveFrom": 1, "effectiveTo": 1 });

print("Database indexes created successfully");

// Migrate existing MTR follow-ups to new system
print("Migrating existing MTR follow-ups...");
var mtrFollowUps = db.mtrfollowups.find({ "status": { $in: ["pending", "in_progress"] } });
var migratedCount = 0;

mtrFollowUps.forEach(function(mtr) {
    try {
        // Create corresponding appointment if scheduled
        if (mtr.scheduledDate && mtr.scheduledTime) {
            var appointment = {
                workplaceId: mtr.workplaceId,
                patientId: mtr.patientId,
                assignedTo: mtr.assignedTo || mtr.createdBy,
                type: "mtm_session",
                title: "MTR Follow-up Session",
                description: mtr.notes || "Migrated from MTR follow-up",
                scheduledDate: mtr.scheduledDate,
                scheduledTime: mtr.scheduledTime,
                duration: 30,
                timezone: "Africa/Lagos",
                status: "scheduled",
                confirmationStatus: "pending",
                isRecurring: false,
                isRecurringException: false,
                reminders: [],
                relatedRecords: {
                    mtrSessionId: mtr._id
                },
                metadata: {
                    source: "mtr_migration",
                    triggerEvent: "mtr_followup_migration"
                },
                createdBy: mtr.createdBy,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            var appointmentResult = db.appointments.insertOne(appointment);
            
            // Update MTR follow-up with appointment reference
            db.mtrfollowups.updateOne(
                { _id: mtr._id },
                { 
                    $set: { 
                        "relatedRecords.appointmentId": appointmentResult.insertedId,
                        "migrationStatus": "migrated_to_appointment",
                        "migratedAt": new Date()
                    }
                }
            );
            
            migratedCount++;
        } else {
            // Create follow-up task for unscheduled MTR follow-ups
            var followUpTask = {
                workplaceId: mtr.workplaceId,
                patientId: mtr.patientId,
                assignedTo: mtr.assignedTo || mtr.createdBy,
                type: "medication_change_followup",
                title: "MTR Follow-up Required",
                description: mtr.notes || "Migrated from MTR follow-up",
                objectives: ["Complete medication therapy review", "Address identified issues"],
                priority: mtr.priority || "medium",
                dueDate: mtr.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: "pending",
                trigger: {
                    type: "mtr_followup",
                    sourceId: mtr._id,
                    sourceType: "MTRFollowUp",
                    triggerDate: mtr.createdAt,
                    triggerDetails: {
                        originalMTRId: mtr.mtrId,
                        migrationSource: "mtr_followup"
                    }
                },
                relatedRecords: {
                    mtrSessionId: mtr._id
                },
                escalationHistory: [],
                remindersSent: [],
                createdBy: mtr.createdBy,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            var taskResult = db.followuptasks.insertOne(followUpTask);
            
            // Update MTR follow-up with task reference
            db.mtrfollowups.updateOne(
                { _id: mtr._id },
                { 
                    $set: { 
                        "relatedRecords.followUpTaskId": taskResult.insertedId,
                        "migrationStatus": "migrated_to_task",
                        "migratedAt": new Date()
                    }
                }
            );
            
            migratedCount++;
        }
    } catch (error) {
        print("Error migrating MTR follow-up " + mtr._id + ": " + error.message);
    }
});

print("Migrated " + migratedCount + " MTR follow-ups");

// Create default reminder templates
print("Creating default reminder templates...");

var workplaces = db.workplaces.find({});
workplaces.forEach(function(workplace) {
    var templates = [
        {
            workplaceId: workplace._id,
            name: "24h Appointment Reminder",
            type: "appointment",
            category: "pre_appointment",
            channels: ["email", "sms"],
            timing: {
                unit: "hours",
                value: 24,
                relativeTo: "before_appointment"
            },
            messageTemplates: {
                email: {
                    subject: "Appointment Reminder - {{appointmentDate}}",
                    body: "Dear {{patientName}},\n\nThis is a reminder that you have an appointment scheduled for {{appointmentDate}} at {{appointmentTime}} at {{pharmacyName}}.\n\nPlease arrive 10 minutes early and bring any medications you are currently taking.\n\nIf you need to reschedule, please contact us at {{pharmacyPhone}}.\n\nThank you,\n{{pharmacyName}} Team"
                },
                sms: {
                    message: "Reminder: Appointment at {{pharmacyName}} on {{appointmentDate}} at {{appointmentTime}}. Reply CONFIRM to confirm or call {{pharmacyPhone}} to reschedule."
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            workplaceId: workplace._id,
            name: "2h Appointment Reminder",
            type: "appointment",
            category: "pre_appointment",
            channels: ["sms", "push"],
            timing: {
                unit: "hours",
                value: 2,
                relativeTo: "before_appointment"
            },
            messageTemplates: {
                sms: {
                    message: "Your appointment at {{pharmacyName}} is in 2 hours ({{appointmentTime}}). See you soon!"
                },
                push: {
                    title: "Appointment in 2 hours",
                    body: "Your appointment at {{pharmacyName}} is at {{appointmentTime}}",
                    actionUrl: "/appointments/{{appointmentId}}"
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            workplaceId: workplace._id,
            name: "Medication Refill Reminder",
            type: "medication_refill",
            category: "medication",
            channels: ["email", "sms"],
            timing: {
                unit: "days",
                value: 7,
                relativeTo: "before_due_date"
            },
            messageTemplates: {
                email: {
                    subject: "Medication Refill Due - {{medicationName}}",
                    body: "Dear {{patientName}},\n\nYour prescription for {{medicationName}} is due for refill in 7 days.\n\nPlease contact us at {{pharmacyPhone}} or visit our pharmacy to arrange your refill.\n\nThank you,\n{{pharmacyName}} Team"
                },
                sms: {
                    message: "Refill reminder: {{medicationName}} due in 7 days. Contact {{pharmacyName}} at {{pharmacyPhone}} to refill."
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    templates.forEach(function(template) {
        db.remindertemplates.insertOne(template);
    });
});

print("Default reminder templates created");

// Update Patient model with appointment preferences
print("Updating patient records with appointment preferences...");
db.patients.updateMany(
    { "appointmentPreferences": { $exists: false } },
    {
        $set: {
            "appointmentPreferences": {
                "preferredDays": [1, 2, 3, 4, 5], // Monday to Friday
                "preferredTimeSlots": [
                    { "start": "09:00", "end": "12:00" },
                    { "start": "14:00", "end": "17:00" }
                ],
                "reminderPreferences": {
                    "email": true,
                    "sms": true,
                    "push": false,
                    "whatsapp": false
                },
                "language": "en",
                "timezone": "Africa/Lagos"
            }
        }
    }
);

print("Patient records updated");

// Create migration log
db.migrationlogs.insertOne({
    migration: "003_patient_engagement_production",
    version: "1.0.0",
    executedAt: new Date(),
    status: "completed",
    details: {
        indexesCreated: true,
        mtrFollowUpsMigrated: migratedCount,
        reminderTemplatesCreated: true,
        patientPreferencesUpdated: true
    }
});

print("Patient Engagement production migration completed successfully");
EOF
    
    log "INFO" "Migration script created at $script_path"
}

verify_database_migration() {
    log "INFO" "Verifying database migration..."
    
    # Check if required collections exist with proper indexes
    local collections=("appointments" "followuptasks" "remindertemplates" "pharmacistschedules")
    
    for collection in "${collections[@]}"; do
        local count=$(mongosh PharmacyCopilot --quiet --eval "db.$collection.countDocuments({})")
        log "INFO" "Collection $collection: $count documents"
        
        # Check indexes
        local indexes=$(mongosh PharmacyCopilot --quiet --eval "db.$collection.getIndexes().length")
        if [[ $indexes -lt 2 ]]; then
            error_exit "Missing indexes for collection $collection"
        fi
    done
    
    # Verify migration log
    local migration_status=$(mongosh PharmacyCopilot --quiet --eval "db.migrationlogs.findOne({migration: '003_patient_engagement_production'}).status" 2>/dev/null || echo "null")
    if [[ "$migration_status" != "completed" ]]; then
        error_exit "Migration verification failed - migration log not found or incomplete"
    fi
    
    log "INFO" "Database migration verification completed successfully"
}

deploy_backend_services() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would deploy backend services with zero downtime"
        return 0
    fi
    
    log "INFO" "Deploying backend services with zero downtime..."
    
    # Build backend
    log "INFO" "Building backend application..."
    cd "$PROJECT_ROOT/backend"
    
    # Install dependencies
    npm ci --only=production --silent
    
    # Build TypeScript
    npm run build
    
    if [[ $ZERO_DOWNTIME == true ]]; then
        deploy_backend_zero_downtime
    else
        deploy_backend_standard
    fi
    
    log "INFO" "Backend services deployed successfully"
}

deploy_backend_zero_downtime() {
    log "INFO" "Performing zero-downtime backend deployment..."
    
    # Start new instance on different port
    local new_port=3001
    local current_port=3000
    
    # Update environment for new instance
    export PORT=$new_port
    export NODE_ENV=production
    export PATIENT_ENGAGEMENT_ENABLED=false  # Start with features disabled
    
    # Start new instance
    log "INFO" "Starting new backend instance on port $new_port..."
    pm2 start ecosystem.config.js --name "$BACKEND_SERVICE-new" --env production
    
    # Wait for new instance to be ready
    wait_for_service "http://localhost:$new_port/health" $HEALTH_CHECK_TIMEOUT
    
    # Update load balancer to route traffic to new instance
    update_load_balancer "$current_port" "$new_port"
    
    # Wait for traffic to drain from old instance
    sleep 30
    
    # Stop old instance
    log "INFO" "Stopping old backend instance..."
    pm2 stop "$BACKEND_SERVICE" || true
    pm2 delete "$BACKEND_SERVICE" || true
    
    # Rename new instance to primary
    pm2 stop "$BACKEND_SERVICE-new"
    pm2 delete "$BACKEND_SERVICE-new"
    
    # Start primary instance on correct port
    export PORT=$current_port
    pm2 start ecosystem.config.js --name "$BACKEND_SERVICE" --env production
    
    # Wait for primary instance to be ready
    wait_for_service "http://localhost:$current_port/health" $HEALTH_CHECK_TIMEOUT
    
    # Update load balancer back to primary port
    update_load_balancer "$new_port" "$current_port"
    
    log "INFO" "Zero-downtime backend deployment completed"
}

deploy_backend_standard() {
    log "INFO" "Performing standard backend deployment..."
    
    # Stop current instance
    pm2 stop "$BACKEND_SERVICE" || true
    
    # Start new instance
    pm2 start ecosystem.config.js --name "$BACKEND_SERVICE" --env production
    
    # Wait for service to be ready
    wait_for_service "http://localhost:3000/health" $HEALTH_CHECK_TIMEOUT
}

deploy_frontend_services() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would deploy frontend services"
        return 0
    fi
    
    log "INFO" "Deploying frontend services..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Install dependencies
    npm ci --only=production --silent
    
    # Build frontend with feature flags disabled initially
    export VITE_PATIENT_ENGAGEMENT_ENABLED=false
    export VITE_NODE_ENV=production
    npm run build
    
    # Deploy to web server
    if command -v nginx &> /dev/null; then
        deploy_frontend_nginx
    else
        deploy_frontend_static
    fi
    
    log "INFO" "Frontend services deployed successfully"
}

deploy_frontend_nginx() {
    log "INFO" "Deploying frontend to Nginx..."
    
    local web_root="/var/www/PharmacyCopilot"
    local backup_dir="/var/www/PharmacyCopilot-backup-$TIMESTAMP"
    
    # Backup current frontend
    if [[ -d "$web_root" ]]; then
        sudo mv "$web_root" "$backup_dir"
    fi
    
    # Deploy new frontend
    sudo mkdir -p "$web_root"
    sudo cp -r dist/* "$web_root/"
    sudo chown -R www-data:www-data "$web_root"
    sudo chmod -R 755 "$web_root"
    
    # Test Nginx configuration
    sudo nginx -t || error_exit "Nginx configuration test failed"
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log "INFO" "Frontend deployed to Nginx successfully"
}

deploy_frontend_static() {
    log "INFO" "Deploying frontend as static files..."
    
    local static_dir="/opt/PharmacyCopilot/frontend"
    mkdir -p "$static_dir"
    cp -r dist/* "$static_dir/"
    
    log "INFO" "Frontend deployed as static files"
}

update_load_balancer() {
    local old_port=$1
    local new_port=$2
    
    log "INFO" "Updating load balancer from port $old_port to $new_port..."
    
    # Update Nginx upstream configuration
    if command -v nginx &> /dev/null; then
        local nginx_conf="/etc/nginx/sites-available/PharmacyCopilot"
        if [[ -f "$nginx_conf" ]]; then
            sudo sed -i "s/localhost:$old_port/localhost:$new_port/g" "$nginx_conf"
            sudo nginx -t && sudo systemctl reload nginx
        fi
    fi
    
    # Update Docker Compose if using Docker
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        sed -i "s/:$old_port:/:$new_port:/g" "$PROJECT_ROOT/docker-compose.yml"
    fi
}

wait_for_service() {
    local url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log "INFO" "Waiting for service at $url to be ready (timeout: ${timeout}s)..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            error_exit "Service at $url did not become ready within ${timeout}s"
        fi
        
        if curl -sf "$url" > /dev/null 2>&1; then
            log "INFO" "Service at $url is ready (took ${elapsed}s)"
            return 0
        fi
        
        sleep 5
    done
}

configure_feature_flags() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would configure feature flags for gradual rollout"
        return 0
    fi
    
    log "INFO" "Configuring feature flags for gradual rollout..."
    
    # Initially disable all patient engagement features
    for flag in "${FEATURE_FLAGS[@]}"; do
        update_feature_flag "$flag" false 0
    done
    
    log "INFO" "Feature flags configured - all features disabled for initial deployment"
}

update_feature_flag() {
    local flag_name=$1
    local enabled=$2
    local rollout_percentage=${3:-0}
    
    log "INFO" "Setting feature flag $flag_name to $enabled (rollout: $rollout_percentage%)"
    
    # Update feature flag in database
    mongosh PharmacyCopilot --quiet --eval "
        db.featureflags.updateOne(
            { name: '$flag_name' },
            {
                \$set: {
                    enabled: $enabled,
                    rolloutPercentage: $rollout_percentage,
                    updatedAt: new Date(),
                    updatedBy: 'deployment-script'
                }
            },
            { upsert: true }
        )
    "
    
    # Update environment variables
    if [[ -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        if grep -q "^$flag_name=" "$PROJECT_ROOT/backend/.env.production"; then
            sed -i "s/^$flag_name=.*/$flag_name=$enabled/" "$PROJECT_ROOT/backend/.env.production"
        else
            echo "$flag_name=$enabled" >> "$PROJECT_ROOT/backend/.env.production"
        fi
    fi
}

setup_monitoring() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would setup production monitoring and alerting"
        return 0
    fi
    
    log "INFO" "Setting up production monitoring and alerting..."
    
    # Setup Prometheus monitoring
    setup_prometheus_monitoring
    
    # Setup Grafana dashboards
    setup_grafana_dashboards
    
    # Setup alerting rules
    setup_alerting_rules
    
    # Setup health checks
    setup_health_checks
    
    log "INFO" "Production monitoring and alerting setup completed"
}

setup_prometheus_monitoring() {
    log "INFO" "Setting up Prometheus monitoring..."
    
    local prometheus_config="$DEPLOYMENT_DIR/monitoring/prometheus-production.yml"
    
    # Create Prometheus configuration
    cat > "$prometheus_config" << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "patient-engagement-alerts.yml"

scrape_configs:
  - job_name: 'patient-engagement-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'patient-engagement-database'
    static_configs:
      - targets: ['localhost:27017']
    scrape_interval: 30s
    
  - job_name: 'patient-engagement-redis'
    static_configs:
      - targets: ['localhost:6379']
    scrape_interval: 30s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF
    
    # Start Prometheus if not running
    if ! pgrep -f prometheus > /dev/null; then
        log "INFO" "Starting Prometheus..."
        prometheus --config.file="$prometheus_config" --storage.tsdb.path=/var/lib/prometheus --web.console.libraries=/etc/prometheus/console_libraries --web.console.templates=/etc/prometheus/consoles &
    fi
}

setup_grafana_dashboards() {
    log "INFO" "Setting up Grafana dashboards..."
    
    local dashboard_dir="$DEPLOYMENT_DIR/monitoring/grafana/dashboards"
    mkdir -p "$dashboard_dir"
    
    # Create Patient Engagement dashboard
    cat > "$dashboard_dir/patient-engagement-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Patient Engagement & Follow-up Management",
    "tags": ["patient-engagement", "appointments", "follow-ups"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Appointment Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(appointment_total)",
            "legendFormat": "Total Appointments"
          }
        ]
      },
      {
        "id": 2,
        "title": "Follow-up Task Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(followup_task_total)",
            "legendFormat": "Total Follow-ups"
          }
        ]
      },
      {
        "id": 3,
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    log "INFO" "Grafana dashboards configured"
}

setup_alerting_rules() {
    log "INFO" "Setting up alerting rules..."
    
    local alerts_file="$DEPLOYMENT_DIR/monitoring/patient-engagement-alerts.yml"
    
    cat > "$alerts_file" << EOF
groups:
  - name: patient_engagement_alerts
    rules:
      - alert: HighAppointmentCreationFailure
        expr: rate(appointment_creation_failures_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High appointment creation failure rate"
          description: "Appointment creation failure rate is {{ \$value }} per second"
          
      - alert: FollowUpTasksOverdue
        expr: followup_tasks_overdue > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Many follow-up tasks are overdue"
          description: "{{ \$value }} follow-up tasks are overdue"
          
      - alert: ReminderDeliveryFailure
        expr: rate(reminder_delivery_failures_total[10m]) > 0.05
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High reminder delivery failure rate"
          description: "Reminder delivery failure rate is {{ \$value }} per second"
          
      - alert: DatabaseConnectionFailure
        expr: up{job="patient-engagement-database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "Cannot connect to patient engagement database"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"
EOF
    
    log "INFO" "Alerting rules configured"
}

setup_health_checks() {
    log "INFO" "Setting up health checks..."
    
    # Create health check script
    local health_check_script="$DEPLOYMENT_DIR/monitoring/patient-engagement-health-check.sh"
    
    cat > "$health_check_script" << 'EOF'
#!/bin/bash

# Patient Engagement Health Check Script

set -euo pipefail

BACKEND_URL="http://localhost:3000"
TIMEOUT=10
VERBOSE=false

if [[ "${1:-}" == "--verbose" ]]; then
    VERBOSE=true
fi

log() {
    if [[ $VERBOSE == true ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    fi
}

check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    
    log "Checking $endpoint..."
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$BACKEND_URL$endpoint" || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        log "✓ $endpoint is healthy (HTTP $response)"
        return 0
    else
        log "✗ $endpoint is unhealthy (HTTP $response)"
        return 1
    fi
}

# Check basic health endpoint
check_endpoint "/health" 200

# Check appointment endpoints
check_endpoint "/api/appointments/health" 200

# Check follow-up endpoints  
check_endpoint "/api/follow-ups/health" 200

# Check reminder endpoints
check_endpoint "/api/reminders/health" 200

# Check database connectivity
check_endpoint "/api/health/database" 200

# Check Redis connectivity
check_endpoint "/api/health/redis" 200

log "All health checks passed"
exit 0
EOF
    
    chmod +x "$health_check_script"
    
    # Setup cron job for regular health checks
    (crontab -l 2>/dev/null; echo "*/5 * * * * $health_check_script >> /var/log/patient-engagement-health.log 2>&1") | crontab -
    
    log "Health checks configured"
}

verify_deployment() {
    log "INFO" "Verifying deployment..."
    
    # Check service status
    verify_service_status
    
    # Check database connectivity
    verify_database_connectivity
    
    # Check API endpoints
    verify_api_endpoints
    
    # Check feature flags
    verify_feature_flags
    
    # Check monitoring
    verify_monitoring
    
    log "INFO" "Deployment verification completed successfully"
}

verify_service_status() {
    log "INFO" "Verifying service status..."
    
    # Check backend service
    if ! pm2 list | grep -q "$BACKEND_SERVICE.*online"; then
        error_exit "Backend service is not running"
    fi
    
    # Check database service
    if ! mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        error_exit "Database service is not accessible"
    fi
    
    # Check Redis service
    if ! redis-cli ping > /dev/null 2>&1; then
        error_exit "Redis service is not accessible"
    fi
    
    log "INFO" "All services are running"
}

verify_database_connectivity() {
    log "INFO" "Verifying database connectivity..."
    
    # Test database connection
    local db_status=$(mongosh PharmacyCopilot --quiet --eval "db.runCommand({ping: 1}).ok" 2>/dev/null || echo "0")
    if [[ "$db_status" != "1" ]]; then
        error_exit "Database connectivity check failed"
    fi
    
    # Check required collections exist
    local collections=("appointments" "followuptasks" "remindertemplates" "pharmacistschedules")
    for collection in "${collections[@]}"; do
        local exists=$(mongosh PharmacyCopilot --quiet --eval "db.listCollectionNames().includes('$collection')" 2>/dev/null || echo "false")
        if [[ "$exists" != "true" ]]; then
            error_exit "Required collection '$collection' not found"
        fi
    done
    
    log "INFO" "Database connectivity verified"
}

verify_api_endpoints() {
    log "INFO" "Verifying API endpoints..."
    
    local base_url="http://localhost:3000"
    local endpoints=(
        "/health"
        "/api/health"
        "/api/appointments/health"
        "/api/follow-ups/health"
        "/api/reminders/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -sf "$base_url$endpoint" > /dev/null 2>&1; then
            error_exit "API endpoint $endpoint is not responding"
        fi
    done
    
    log "INFO" "API endpoints verified"
}

verify_feature_flags() {
    log "INFO" "Verifying feature flags..."
    
    for flag in "${FEATURE_FLAGS[@]}"; do
        local flag_status=$(mongosh PharmacyCopilot --quiet --eval "db.featureflags.findOne({name: '$flag'}).enabled" 2>/dev/null || echo "null")
        if [[ "$flag_status" == "null" ]]; then
            error_exit "Feature flag '$flag' not found in database"
        fi
        log "INFO" "Feature flag $flag: $flag_status"
    done
    
    log "INFO" "Feature flags verified"
}

verify_monitoring() {
    log "INFO" "Verifying monitoring setup..."
    
    # Check if Prometheus is accessible
    if command -v prometheus &> /dev/null; then
        if ! curl -sf "http://localhost:9090/-/healthy" > /dev/null 2>&1; then
            log "WARN" "Prometheus is not accessible"
        else
            log "INFO" "Prometheus is running"
        fi
    fi
    
    # Check if metrics endpoint is working
    if ! curl -sf "http://localhost:3000/metrics" > /dev/null 2>&1; then
        log "WARN" "Metrics endpoint is not accessible"
    else
        log "INFO" "Metrics endpoint is working"
    fi
    
    log "INFO" "Monitoring verification completed"
}

enable_gradual_rollout() {
    if [[ $DRY_RUN == true ]]; then
        log "INFO" "[DRY RUN] Would enable gradual rollout (10% of workspaces)"
        return 0
    fi
    
    log "INFO" "Enabling gradual rollout for 10% of workspaces..."
    
    # Enable core appointment scheduling for 10% of workspaces
    update_feature_flag "APPOINTMENT_SCHEDULING_ENABLED" true 10
    
    # Enable basic follow-up management for 10% of workspaces
    update_feature_flag "FOLLOW_UP_MANAGEMENT_ENABLED" true 10
    
    # Enable reminder system for 10% of workspaces
    update_feature_flag "REMINDER_SYSTEM_ENABLED" true 10
    
    # Keep advanced features disabled initially
    update_feature_flag "PATIENT_PORTAL_ENABLED" false 0
    update_feature_flag "ANALYTICS_REPORTING_ENABLED" false 0
    
    # Restart backend to pick up new feature flags
    pm2 restart "$BACKEND_SERVICE"
    
    # Wait for service to be ready
    wait_for_service "http://localhost:3000/health" 60
    
    log "INFO" "Gradual rollout enabled - monitoring for 24 hours before next phase"
}

rollback_deployment() {
    log "INFO" "Rolling back deployment..."
    
    if [[ ! -f "$BACKUP_DIR/latest-backup.txt" ]]; then
        error_exit "No backup found for rollback"
    fi
    
    local backup_path=$(cat "$BACKUP_DIR/latest-backup.txt")
    if [[ ! -d "$backup_path" ]]; then
        error_exit "Backup directory not found: $backup_path"
    fi
    
    log "INFO" "Rolling back from backup: $backup_path"
    
    # Stop current services
    pm2 stop "$BACKEND_SERVICE" || true
    
    # Restore database
    log "INFO" "Restoring database..."
    mongorestore --host localhost:27017 --db PharmacyCopilot --drop "$backup_path/mongodb/PharmacyCopilot"
    
    # Restore configuration
    log "INFO" "Restoring configuration..."
    cp -r "$backup_path/config/"* "$PROJECT_ROOT/" 2>/dev/null || true
    
    # Restore application code
    log "INFO" "Restoring application code..."
    cd "$PROJECT_ROOT"
    tar -xzf "$backup_path/application/backend.tar.gz"
    tar -xzf "$backup_path/application/frontend.tar.gz"
    
    # Rebuild and restart services
    cd "$PROJECT_ROOT/backend"
    npm ci --only=production --silent
    npm run build
    
    pm2 start ecosystem.config.js --name "$BACKEND_SERVICE" --env production
    
    # Wait for service to be ready
    wait_for_service "http://localhost:3000/health" $HEALTH_CHECK_TIMEOUT
    
    log "INFO" "Rollback completed successfully"
}

show_deployment_status() {
    log "INFO" "Deployment Status Report"
    log "INFO" "======================="
    
    # Service status
    log "INFO" "Services:"
    pm2 list | grep -E "(PharmacyCopilot|patient-engagement)" || log "WARN" "No PM2 processes found"
    
    # Database status
    local db_status=$(mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "0")
    if [[ "$db_status" == "1" ]]; then
        log "INFO" "Database: Connected"
        
        # Collection counts
        local appointments=$(mongosh PharmacyCopilot --quiet --eval "db.appointments.countDocuments({})" 2>/dev/null || echo "0")
        local followups=$(mongosh PharmacyCopilot --quiet --eval "db.followuptasks.countDocuments({})" 2>/dev/null || echo "0")
        local templates=$(mongosh PharmacyCopilot --quiet --eval "db.remindertemplates.countDocuments({})" 2>/dev/null || echo "0")
        
        log "INFO" "  - Appointments: $appointments"
        log "INFO" "  - Follow-up tasks: $followups"
        log "INFO" "  - Reminder templates: $templates"
    else
        log "ERROR" "Database: Disconnected"
    fi
    
    # Redis status
    if redis-cli ping > /dev/null 2>&1; then
        log "INFO" "Redis: Connected"
    else
        log "ERROR" "Redis: Disconnected"
    fi
    
    # Feature flags status
    log "INFO" "Feature Flags:"
    for flag in "${FEATURE_FLAGS[@]}"; do
        local flag_status=$(mongosh PharmacyCopilot --quiet --eval "db.featureflags.findOne({name: '$flag'}).enabled" 2>/dev/null || echo "null")
        local rollout=$(mongosh PharmacyCopilot --quiet --eval "db.featureflags.findOne({name: '$flag'}).rolloutPercentage" 2>/dev/null || echo "0")
        log "INFO" "  - $flag: $flag_status ($rollout%)"
    done
    
    # API endpoints status
    log "INFO" "API Endpoints:"
    local endpoints=("/health" "/api/appointments/health" "/api/follow-ups/health")
    for endpoint in "${endpoints[@]}"; do
        if curl -sf "http://localhost:3000$endpoint" > /dev/null 2>&1; then
            log "INFO" "  - $endpoint: OK"
        else
            log "ERROR" "  - $endpoint: FAILED"
        fi
    done
}

cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."
    
    # Keep last 5 backups
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "patient-engagement-prod-*" | sort -r | tail -n +6 | xargs rm -rf
    
    log "INFO" "Old backups cleaned up"
}

show_help() {
    cat << EOF
Patient Engagement & Follow-up Management - Production Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    --dry-run              Test deployment without making changes
    --rollback             Rollback to previous version
    --status               Check deployment status
    --health-check         Run health checks only
    --migrate-only         Run database migrations only
    --feature-flags-only   Update feature flags only
    --monitoring-only      Setup monitoring only
    --verbose              Enable verbose logging
    --help                 Show this help message

EXAMPLES:
    # Test deployment
    $0 --dry-run

    # Full production deployment
    $0

    # Check current status
    $0 --status

    # Run only database migrations
    $0 --migrate-only

    # Rollback deployment
    $0 --rollback

    # Setup monitoring only
    $0 --monitoring-only

ENVIRONMENT VARIABLES:
    BACKUP_DIR             Backup directory (default: /var/backups/patient-engagement-production)
    LOG_DIR                Log directory (default: /var/log/patient-engagement-deployment)
    HEALTH_CHECK_TIMEOUT   Health check timeout in seconds (default: 300)
    MIGRATION_TIMEOUT      Migration timeout in seconds (default: 600)
    ZERO_DOWNTIME          Enable zero-downtime deployment (default: true)

For more information, see the deployment documentation.
EOF
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --status)
                STATUS_CHECK=true
                shift
                ;;
            --health-check)
                HEALTH_CHECK_ONLY=true
                shift
                ;;
            --migrate-only)
                MIGRATE_ONLY=true
                shift
                ;;
            --feature-flags-only)
                FEATURE_FLAGS_ONLY=true
                shift
                ;;
            --monitoring-only)
                MONITORING_ONLY=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    log "INFO" "Starting Patient Engagement production deployment..."
    log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    log "INFO" "Timestamp: $TIMESTAMP"
    log "INFO" "Dry run: $DRY_RUN"
    
    # Handle specific operations
    if [[ $STATUS_CHECK == true ]]; then
        show_deployment_status
        exit 0
    fi
    
    if [[ $HEALTH_CHECK_ONLY == true ]]; then
        verify_deployment
        exit 0
    fi
    
    if [[ $ROLLBACK == true ]]; then
        rollback_deployment
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Execute deployment steps
    if [[ $MIGRATE_ONLY == true ]]; then
        run_database_migrations
    elif [[ $FEATURE_FLAGS_ONLY == true ]]; then
        configure_feature_flags
    elif [[ $MONITORING_ONLY == true ]]; then
        setup_monitoring
    else
        # Full deployment
        run_database_migrations
        deploy_backend_services
        deploy_frontend_services
        configure_feature_flags
        setup_monitoring
        verify_deployment
        enable_gradual_rollout
    fi
    
    # Cleanup
    cleanup_old_backups
    
    log "INFO" "Patient Engagement production deployment completed successfully!"
    log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    log "INFO" "Next steps:"
    log "INFO" "  1. Monitor system health for 24 hours"
    log "INFO" "  2. Check metrics and logs"
    log "INFO" "  3. Run gradual rollout to 25% if stable"
    log "INFO" "  4. Continue rollout phases as planned"
    
    # Show final status
    show_deployment_status
}

# Execute main function with all arguments
main "$@"