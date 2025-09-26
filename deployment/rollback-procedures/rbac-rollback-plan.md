# Dynamic RBAC Rollback Procedures

## Overview

This document outlines comprehensive rollback procedures for the Dynamic RBAC system, including emergency response plans, automated rollback scripts, and manual recovery procedures.

## Table of Contents

1. [Rollback Triggers](#rollback-triggers)
2. [Pre-Rollback Assessment](#pre-rollback-assessment)
3. [Automated Rollback Procedures](#automated-rollback-procedures)
4. [Manual Rollback Procedures](#manual-rollback-procedures)
5. [Emergency Response Plans](#emergency-response-plans)
6. [Data Recovery Procedures](#data-recovery-procedures)
7. [Communication Plans](#communication-plans)
8. [Post-Rollback Validation](#post-rollback-validation)
9. [Lessons Learned Process](#lessons-learned-process)

## Rollback Triggers

### Automatic Rollback Triggers

The system will automatically initiate rollback procedures when:

```javascript
const automaticRollbackTriggers = {
  // Performance degradation
  performance: {
    permissionCheckLatency: {
      threshold: '2 seconds',
      duration: '5 minutes',
      action: 'automatic_rollback',
    },
    errorRate: {
      threshold: '10%',
      duration: '2 minutes',
      action: 'automatic_rollback',
    },
    cacheHitRate: {
      threshold: '30%',
      duration: '10 minutes',
      action: 'automatic_rollback',
    },
  },

  // System availability
  availability: {
    serviceDown: {
      threshold: '100% failure rate',
      duration: '1 minute',
      action: 'immediate_rollback',
    },
    databaseConnectionFailure: {
      threshold: '50% connection failures',
      duration: '2 minutes',
      action: 'automatic_rollback',
    },
  },

  // Security incidents
  security: {
    privilegeEscalationDetected: {
      threshold: '1 incident',
      duration: 'immediate',
      action: 'emergency_rollback',
    },
    massivePermissionFailures: {
      threshold: '90% permission denials',
      duration: '1 minute',
      action: 'immediate_rollback',
    },
  },
};
```

### Manual Rollback Triggers

Manual rollback may be initiated for:

- **Business Impact**: Critical business processes affected
- **Data Integrity Issues**: Inconsistent permission states
- **Compliance Violations**: Regulatory requirement breaches
- **User Experience**: Widespread user access issues
- **Security Concerns**: Potential security vulnerabilities

## Pre-Rollback Assessment

### Assessment Checklist

Before initiating rollback, complete this assessment:

```bash
#!/bin/bash
# Pre-rollback assessment script

echo "=== RBAC Rollback Pre-Assessment ==="

# 1. Check system health
echo "1. Checking system health..."
curl -s http://localhost:3000/health/rbac | jq .

# 2. Assess impact scope
echo "2. Assessing impact scope..."
AFFECTED_USERS=$(psql -d pharma_care -t -c "SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '1 hour';")
echo "Active users in last hour: $AFFECTED_USERS"

# 3. Check data consistency
echo "3. Checking data consistency..."
INCONSISTENT_PERMISSIONS=$(psql -d pharma_care -t -c "
  SELECT COUNT(*) FROM user_roles ur
  LEFT JOIN roles r ON ur.role_id = r._id
  WHERE r._id IS NULL;
")
echo "Inconsistent role assignments: $INCONSISTENT_PERMISSIONS"

# 4. Verify backup availability
echo "4. Verifying backup availability..."
LATEST_BACKUP=$(aws s3 ls s3://pharma-care-backups/rbac/ --recursive | sort | tail -n 1)
echo "Latest backup: $LATEST_BACKUP"

# 5. Check rollback readiness
echo "5. Checking rollback readiness..."
if [ -f "/opt/rbac/rollback/static-rbac-backup.sql" ]; then
  echo "✓ Static RBAC backup available"
else
  echo "✗ Static RBAC backup missing"
fi

echo "=== Assessment Complete ==="
```

### Impact Assessment Matrix

| Impact Level | Criteria                            | Response Time | Approval Required   |
| ------------ | ----------------------------------- | ------------- | ------------------- |
| **Critical** | System down, security breach        | Immediate     | CTO/CISO            |
| **High**     | Major functionality impaired        | 15 minutes    | Engineering Manager |
| **Medium**   | Some features affected              | 1 hour        | Team Lead           |
| **Low**      | Minor issues, workarounds available | 4 hours       | Developer           |

## Automated Rollback Procedures

### Automated Rollback Script

```bash
#!/bin/bash
# automated-rbac-rollback.sh
# Automated rollback script for Dynamic RBAC system

set -e

ROLLBACK_LOG="/var/log/rbac-rollback-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/opt/rbac/backups"
ROLLBACK_DIR="/opt/rbac/rollback"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_LOG"
}

# Function to send alerts
send_alert() {
  local severity=$1
  local message=$2

  # Send to Slack
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 RBAC Rollback Alert [$severity]: $message\"}" \
    "$SLACK_WEBHOOK_URL"

  # Send email alert
  echo "$message" | mail -s "RBAC Rollback Alert [$severity]" "$ALERT_EMAIL"
}

# Function to check prerequisites
check_prerequisites() {
  log "Checking rollback prerequisites..."

  # Check if backup exists
  if [ ! -f "$BACKUP_DIR/pre-dynamic-rbac-backup.sql" ]; then
    log "ERROR: Pre-dynamic RBAC backup not found"
    send_alert "CRITICAL" "Rollback failed: No backup available"
    exit 1
  fi

  # Check database connectivity
  if ! psql -d pharma_care -c "SELECT 1;" > /dev/null 2>&1; then
    log "ERROR: Cannot connect to database"
    send_alert "CRITICAL" "Rollback failed: Database connection error"
    exit 1
  fi

  # Check if static RBAC code is available
  if [ ! -d "$ROLLBACK_DIR/static-rbac" ]; then
    log "ERROR: Static RBAC code not available"
    send_alert "CRITICAL" "Rollback failed: Static RBAC code missing"
    exit 1
  fi

  log "Prerequisites check passed"
}

# Function to create emergency backup
create_emergency_backup() {
  log "Creating emergency backup of current state..."

  local backup_file="$BACKUP_DIR/emergency-backup-$(date +%Y%m%d-%H%M%S).sql"

  pg_dump pharma_care \
    --table=permissions \
    --table=roles \
    --table=role_permissions \
    --table=user_roles \
    --table=user_permissions \
    --table=rbac_audit_logs \
    > "$backup_file"

  if [ $? -eq 0 ]; then
    log "Emergency backup created: $backup_file"
  else
    log "ERROR: Failed to create emergency backup"
    send_alert "CRITICAL" "Rollback failed: Could not create emergency backup"
    exit 1
  fi
}

# Function to stop application services
stop_services() {
  log "Stopping application services..."

  # Stop main application
  systemctl stop pharma-care-api

  # Stop background workers
  systemctl stop pharma-care-workers

  # Stop cache services if needed
  systemctl stop redis-rbac

  log "Services stopped"
}

# Function to restore database
restore_database() {
  log "Restoring database to pre-dynamic RBAC state..."

  # Drop dynamic RBAC tables
  psql -d pharma_care -c "
    DROP TABLE IF EXISTS rbac_audit_logs CASCADE;
    DROP TABLE IF EXISTS permission_cache CASCADE;
    DROP TABLE IF EXISTS role_hierarchy_cache CASCADE;
    DROP TABLE IF EXISTS user_permissions CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
  "

  # Restore static RBAC backup
  psql -d pharma_care < "$BACKUP_DIR/pre-dynamic-rbac-backup.sql"

  if [ $? -eq 0 ]; then
    log "Database restored successfully"
  else
    log "ERROR: Database restoration failed"
    send_alert "CRITICAL" "Rollback failed: Database restoration error"
    exit 1
  fi
}

# Function to deploy static RBAC code
deploy_static_code() {
  log "Deploying static RBAC code..."

  # Backup current code
  cp -r /opt/pharma-care/current /opt/pharma-care/rollback-backup-$(date +%Y%m%d-%H%M%S)

  # Deploy static RBAC version
  cp -r "$ROLLBACK_DIR/static-rbac/"* /opt/pharma-care/current/

  # Update configuration
  cp "$ROLLBACK_DIR/config/static-rbac.env" /opt/pharma-care/current/.env

  # Install dependencies if needed
  cd /opt/pharma-care/current
  npm install --production

  log "Static RBAC code deployed"
}

# Function to start services
start_services() {
  log "Starting services with static RBAC..."

  # Start cache services
  systemctl start redis-rbac

  # Start main application
  systemctl start pharma-care-api

  # Start background workers
  systemctl start pharma-care-workers

  # Wait for services to be ready
  sleep 30

  log "Services started"
}

# Function to validate rollback
validate_rollback() {
  log "Validating rollback..."

  # Check service health
  local health_status=$(curl -s http://localhost:3000/health | jq -r '.status')
  if [ "$health_status" != "healthy" ]; then
    log "ERROR: Service health check failed"
    send_alert "CRITICAL" "Rollback validation failed: Service unhealthy"
    return 1
  fi

  # Test authentication
  local auth_test=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3000/api/auth/verify)

  if [ "$auth_test" != "200" ]; then
    log "ERROR: Authentication test failed"
    send_alert "CRITICAL" "Rollback validation failed: Authentication error"
    return 1
  fi

  # Test basic permission check
  local permission_test=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3000/api/patients)

  if [ "$permission_test" != "200" ]; then
    log "ERROR: Permission test failed"
    send_alert "CRITICAL" "Rollback validation failed: Permission error"
    return 1
  fi

  log "Rollback validation passed"
  return 0
}

# Main rollback execution
main() {
  log "Starting automated RBAC rollback..."
  send_alert "WARNING" "Automated RBAC rollback initiated"

  # Execute rollback steps
  check_prerequisites
  create_emergency_backup
  stop_services
  restore_database
  deploy_static_code
  start_services

  # Validate rollback
  if validate_rollback; then
    log "Rollback completed successfully"
    send_alert "INFO" "RBAC rollback completed successfully"
  else
    log "Rollback validation failed"
    send_alert "CRITICAL" "RBAC rollback completed but validation failed"
    exit 1
  fi

  log "Rollback process finished"
}

# Execute main function
main "$@"
```

### Automated Monitoring Integration

```javascript
// monitoring/rollback-monitor.js
const RBACMetricsCollector = require('./rbac-metrics-collector');
const { exec } = require('child_process');

class RollbackMonitor {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
    this.rollbackInProgress = false;
    this.thresholds = {
      permissionCheckLatency: 2.0, // seconds
      errorRate: 0.1, // 10%
      cacheHitRate: 0.3, // 30%
      serviceAvailability: 0.5, // 50%
    };

    this.startMonitoring();
  }

  startMonitoring() {
    // Check metrics every 30 seconds
    setInterval(() => {
      this.checkRollbackTriggers();
    }, 30000);
  }

  async checkRollbackTriggers() {
    if (this.rollbackInProgress) {
      return; // Don't trigger multiple rollbacks
    }

    const health = this.metrics.getHealthStatus();

    // Check for automatic rollback triggers
    if (this.shouldTriggerRollback(health)) {
      console.log('Automatic rollback triggered:', health);
      await this.initiateRollback('automatic', health);
    }
  }

  shouldTriggerRollback(health) {
    const { metrics } = health;

    // Check permission check latency
    if (
      metrics.permissionCheckLatency > this.thresholds.permissionCheckLatency
    ) {
      return true;
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      return true;
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      return true;
    }

    // Check service availability
    if (health.status === 'unhealthy') {
      return true;
    }

    return false;
  }

  async initiateRollback(trigger, reason) {
    this.rollbackInProgress = true;

    console.log(`Initiating rollback - Trigger: ${trigger}, Reason:`, reason);

    // Send immediate alert
    await this.sendAlert(
      'CRITICAL',
      `Automatic rollback initiated: ${trigger}`,
      reason
    );

    // Execute rollback script
    exec(
      '/opt/rbac/scripts/automated-rbac-rollback.sh',
      (error, stdout, stderr) => {
        if (error) {
          console.error('Rollback script failed:', error);
          this.sendAlert('CRITICAL', 'Rollback script execution failed', error);
        } else {
          console.log('Rollback script completed:', stdout);
          this.sendAlert(
            'INFO',
            'Rollback script completed successfully',
            stdout
          );
        }

        this.rollbackInProgress = false;
      }
    );
  }

  async sendAlert(severity, message, details) {
    // Implementation depends on your alerting system
    console.log(`[${severity}] ${message}`, details);

    // Send to monitoring system
    this.metrics.recordError('rollback_triggered', 'rollback_monitor');
  }
}

module.exports = RollbackMonitor;
```

## Manual Rollback Procedures

### Step-by-Step Manual Rollback

#### Phase 1: Preparation (5-10 minutes)

1. **Assess Current Situation**

   ```bash
   # Check system status
   curl http://localhost:3000/health/rbac

   # Check active users
   psql -d pharma_care -c "SELECT COUNT(*) FROM active_sessions;"

   # Check recent errors
   tail -n 100 /var/log/pharma-care/error.log
   ```

2. **Notify Stakeholders**

   ```bash
   # Send notification
   ./scripts/send-rollback-notification.sh "Manual RBAC rollback initiated"
   ```

3. **Create Emergency Backup**
   ```bash
   # Backup current state
   pg_dump pharma_care > /backups/emergency-$(date +%Y%m%d-%H%M%S).sql
   ```

#### Phase 2: Service Shutdown (2-5 minutes)

1. **Enable Maintenance Mode**

   ```bash
   # Enable maintenance page
   touch /opt/pharma-care/maintenance.flag

   # Update load balancer
   aws elbv2 modify-target-group --target-group-arn $TARGET_GROUP_ARN \
     --health-check-path /maintenance
   ```

2. **Stop Application Services**

   ```bash
   # Stop in reverse dependency order
   systemctl stop pharma-care-workers
   systemctl stop pharma-care-api
   systemctl stop pharma-care-scheduler
   ```

3. **Verify Services Stopped**
   ```bash
   # Check no processes are running
   ps aux | grep pharma-care
   netstat -tlnp | grep :3000
   ```

#### Phase 3: Database Rollback (10-20 minutes)

1. **Backup Dynamic RBAC Data**

   ```bash
   # Export dynamic RBAC tables
   pg_dump pharma_care \
     --table=permissions \
     --table=roles \
     --table=role_permissions \
     --table=user_roles \
     --table=user_permissions \
     > /backups/dynamic-rbac-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Drop Dynamic RBAC Tables**

   ```sql
   -- Connect to database
   psql -d pharma_care

   -- Drop tables in dependency order
   DROP TABLE IF EXISTS rbac_audit_logs CASCADE;
   DROP TABLE IF EXISTS permission_cache CASCADE;
   DROP TABLE IF EXISTS role_hierarchy_cache CASCADE;
   DROP TABLE IF EXISTS user_permissions CASCADE;
   DROP TABLE IF EXISTS user_roles CASCADE;
   DROP TABLE IF EXISTS role_permissions CASCADE;
   DROP TABLE IF EXISTS roles CASCADE;
   DROP TABLE IF EXISTS permissions CASCADE;

   -- Drop functions
   DROP FUNCTION IF EXISTS get_user_permissions(UUID, UUID);
   DROP FUNCTION IF EXISTS rebuild_role_hierarchy_cache();
   DROP FUNCTION IF EXISTS validate_role_hierarchy(UUID, UUID);
   DROP FUNCTION IF EXISTS cleanup_expired_rbac_data();
   ```

3. **Restore Static RBAC Schema**

   ```bash
   # Restore pre-dynamic RBAC backup
   psql -d pharma_care < /backups/pre-dynamic-rbac-backup.sql
   ```

4. **Verify Database State**

   ```sql
   -- Check table structure
   \dt

   -- Verify user data integrity
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM user_roles_static;

   -- Test basic queries
   SELECT u.email, ur.role_name
   FROM users u
   JOIN user_roles_static ur ON u._id = ur.user_id
   LIMIT 5;
   ```

#### Phase 4: Code Deployment (5-10 minutes)

1. **Backup Current Code**

   ```bash
   # Create backup of current deployment
   cp -r /opt/pharma-care/current /opt/pharma-care/rollback-backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Deploy Static RBAC Code**

   ```bash
   # Deploy static RBAC version
   cp -r /opt/rbac/rollback/static-rbac/* /opt/pharma-care/current/

   # Update configuration
   cp /opt/rbac/rollback/config/static-rbac.env /opt/pharma-care/current/.env

   # Install dependencies
   cd /opt/pharma-care/current
   npm install --production
   ```

3. **Update Configuration**

   ```bash
   # Update environment variables
   export RBAC_MODE=static
   export DYNAMIC_RBAC_ENABLED=false

   # Update configuration files
   sed -i 's/RBAC_MODE=dynamic/RBAC_MODE=static/g' /opt/pharma-care/current/.env
   ```

#### Phase 5: Service Restart (5-10 minutes)

1. **Start Services**

   ```bash
   # Start services in dependency order
   systemctl start redis
   systemctl start pharma-care-api
   systemctl start pharma-care-workers
   systemctl start pharma-care-scheduler
   ```

2. **Verify Service Health**

   ```bash
   # Check service status
   systemctl status pharma-care-api
   systemctl status pharma-care-workers

   # Check application health
   curl http://localhost:3000/health
   ```

3. **Disable Maintenance Mode**

   ```bash
   # Remove maintenance flag
   rm /opt/pharma-care/maintenance.flag

   # Update load balancer
   aws elbv2 modify-target-group --target-group-arn $TARGET_GROUP_ARN \
     --health-check-path /health
   ```

#### Phase 6: Validation (10-15 minutes)

1. **Functional Testing**

   ```bash
   # Test authentication
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass"}'

   # Test permission checks
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/patients

   # Test role-based access
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3000/api/admin/users
   ```

2. **Performance Validation**

   ```bash
   # Check response times
   ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/patients

   # Monitor system resources
   top -n 1 -b | head -20
   free -h
   df -h
   ```

3. **User Acceptance Testing**

   ```bash
   # Notify test users
   ./scripts/notify-test-users.sh "System restored - please test"

   # Monitor for user reports
   tail -f /var/log/pharma-care/access.log
   ```

## Emergency Response Plans

### Severity Level 1: Critical System Failure

**Trigger**: Complete system unavailability, security breach, data corruption

**Response Time**: Immediate (0-15 minutes)

**Actions**:

1. **Immediate Response** (0-5 minutes)

   - Activate incident response team
   - Isolate affected systems
   - Enable emergency access procedures
   - Notify executive leadership

2. **Emergency Rollback** (5-15 minutes)

   - Execute automated rollback script
   - Activate backup systems
   - Implement emergency user access
   - Continuous monitoring

3. **Communication** (Parallel)
   - Internal stakeholders notification
   - Customer communication (if needed)
   - Regulatory notification (if required)

### Severity Level 2: Major Functionality Impaired

**Trigger**: Significant performance degradation, partial system failure

**Response Time**: 15-30 minutes

**Actions**:

1. **Assessment** (0-10 minutes)

   - Evaluate impact scope
   - Determine rollback necessity
   - Prepare rollback resources

2. **Controlled Rollback** (10-30 minutes)
   - Execute manual rollback procedures
   - Gradual service restoration
   - User communication

### Emergency Contact List

```yaml
emergency_contacts:
  incident_commander:
    primary: 'John Doe <john.doe@pharma-care.com>'
    backup: 'Jane Smith <jane.smith@pharma-care.com>'
    phone: '+1-555-0101'

  technical_lead:
    primary: 'Tech Lead <tech.lead@pharma-care.com>'
    phone: '+1-555-0102'

  database_admin:
    primary: 'DBA <dba@pharma-care.com>'
    phone: '+1-555-0103'

  security_team:
    primary: 'Security <security@pharma-care.com>'
    phone: '+1-555-0104'

  executive_escalation:
    cto: 'CTO <cto@pharma-care.com>'
    ciso: 'CISO <ciso@pharma-care.com>'
```

## Data Recovery Procedures

### Database Recovery Options

1. **Point-in-Time Recovery**

   ```bash
   # Restore to specific timestamp
   pg_restore --clean --if-exists \
     --dbname=pharma_care_recovery \
     --jobs=4 \
     /backups/pharma_care_$(date +%Y%m%d).backup

   # Apply WAL files up to specific time
   pg_ctl start -D /var/lib/postgresql/data \
     -o "-c recovery_target_time='2024-01-01 12:00:00'"
   ```

2. **Selective Data Recovery**

   ```sql
   -- Recover specific user permissions
   INSERT INTO user_roles_static (user_id, role_name)
   SELECT user_id, 'PHARMACY_STAFF'
   FROM users
   WHERE email LIKE '%@pharmacy.com'
   AND _id NOT IN (SELECT user_id FROM user_roles_static);
   ```

3. **Data Validation and Cleanup**

   ```sql
   -- Validate data integrity
   SELECT COUNT(*) as orphaned_roles
   FROM user_roles_static ur
   LEFT JOIN users u ON ur.user_id = u._id
   WHERE u._id IS NULL;

   -- Clean up orphaned records
   DELETE FROM user_roles_static
   WHERE user_id NOT IN (SELECT _id FROM users);
   ```

## Communication Plans

### Internal Communication Template

```markdown
**RBAC System Rollback Notification**

**Status**: [IN PROGRESS / COMPLETED / FAILED]
**Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
**Start Time**: [TIMESTAMP]
**Expected Duration**: [DURATION]

**Issue Summary**:
[Brief description of the issue that triggered rollback]

**Impact**:

- Affected Users: [NUMBER]
- Affected Features: [LIST]
- Business Impact: [DESCRIPTION]

**Actions Taken**:

- [ACTION 1]
- [ACTION 2]
- [ACTION 3]

**Current Status**:
[DETAILED STATUS UPDATE]

**Next Steps**:

- [NEXT ACTION]
- [TIMELINE]

**Contact Information**:

- Incident Commander: [NAME] - [PHONE]
- Technical Lead: [NAME] - [PHONE]

**Updates**: This message will be updated every 30 minutes until resolution.
```

### External Communication Template

```markdown
**Service Maintenance Notification**

Dear [CUSTOMER/USER],

We are currently performing emergency maintenance on our system to ensure optimal performance and security.

**Maintenance Window**: [START TIME] - [END TIME]
**Expected Impact**: [DESCRIPTION]
**Affected Services**: [LIST]

**What We're Doing**:
We are implementing system improvements to enhance reliability and performance.

**What You Can Expect**:

- [EXPECTATION 1]
- [EXPECTATION 2]

We apologize for any inconvenience and appreciate your patience.

For updates, please visit: [STATUS PAGE URL]
For support, contact: [SUPPORT EMAIL/PHONE]

Thank you,
[COMPANY NAME] Technical Team
```

## Post-Rollback Validation

### Comprehensive Validation Checklist

```bash
#!/bin/bash
# post-rollback-validation.sh

echo "=== Post-Rollback Validation ==="

# 1. System Health Check
echo "1. System Health Check"
HEALTH_STATUS=$(curl -s http://localhost:3000/health | jq -r '.status')
echo "Health Status: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" != "healthy" ]; then
  echo "❌ System health check failed"
  exit 1
else
  echo "✅ System health check passed"
fi

# 2. Authentication Test
echo "2. Authentication Test"
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}')

if [ "$AUTH_RESPONSE" = "200" ]; then
  echo "✅ Authentication test passed"
else
  echo "❌ Authentication test failed (HTTP $AUTH_RESPONSE)"
fi

# 3. Permission Check Test
echo "3. Permission Check Test"
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' | jq -r '.token')

PERMISSION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/patients)

if [ "$PERMISSION_RESPONSE" = "200" ]; then
  echo "✅ Permission check test passed"
else
  echo "❌ Permission check test failed (HTTP $PERMISSION_RESPONSE)"
fi

# 4. Database Integrity Check
echo "4. Database Integrity Check"
USER_COUNT=$(psql -d pharma_care -t -c "SELECT COUNT(*) FROM users;")
ROLE_COUNT=$(psql -d pharma_care -t -c "SELECT COUNT(*) FROM user_roles_static;")

echo "Users: $USER_COUNT"
echo "Role assignments: $ROLE_COUNT"

if [ "$USER_COUNT" -gt 0 ] && [ "$ROLE_COUNT" -gt 0 ]; then
  echo "✅ Database integrity check passed"
else
  echo "❌ Database integrity check failed"
fi

# 5. Performance Test
echo "5. Performance Test"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/patients)

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
  echo "✅ Performance test passed (${RESPONSE_TIME}s)"
else
  echo "⚠️ Performance test warning (${RESPONSE_TIME}s)"
fi

echo "=== Validation Complete ==="
```

### Business Function Validation

1. **Core Workflows**

   - User login and authentication
   - Patient data access
   - Prescription processing
   - Inventory management
   - Reporting functionality

2. **Role-Based Access**

   - Pharmacy Owner access
   - Pharmacy Manager permissions
   - Staff member limitations
   - Admin panel functionality

3. **Integration Points**
   - External API connections
   - Third-party service integrations
   - Database synchronization
   - Backup system functionality

## Lessons Learned Process

### Post-Incident Review Template

```markdown
# RBAC Rollback Post-Incident Review

**Incident ID**: [UNIQUE_ID]
**Date**: [DATE]
**Duration**: [TOTAL_DURATION]
**Severity**: [LEVEL]

## Incident Summary

[Brief description of what happened]

## Timeline

| Time   | Event   | Action Taken | Owner    |
| ------ | ------- | ------------ | -------- |
| [TIME] | [EVENT] | [ACTION]     | [PERSON] |

## Root Cause Analysis

### Primary Cause

[Description of the primary cause]

### Contributing Factors

- [FACTOR 1]
- [FACTOR 2]
- [FACTOR 3]

## Impact Assessment

- **Users Affected**: [NUMBER]
- **Duration of Impact**: [TIME]
- **Business Impact**: [DESCRIPTION]
- **Financial Impact**: [AMOUNT]

## Response Effectiveness

### What Went Well

- [POSITIVE 1]
- [POSITIVE 2]

### What Could Be Improved

- [IMPROVEMENT 1]
- [IMPROVEMENT 2]

## Action Items

| Action   | Owner    | Due Date | Priority       |
| -------- | -------- | -------- | -------------- |
| [ACTION] | [PERSON] | [DATE]   | [HIGH/MED/LOW] |

## Prevention Measures

- [MEASURE 1]
- [MEASURE 2]
- [MEASURE 3]

## Documentation Updates

- [UPDATE 1]
- [UPDATE 2]

**Review Completed By**: [NAME]
**Review Date**: [DATE]
**Next Review**: [DATE]
```

### Continuous Improvement Process

1. **Immediate Actions** (Within 24 hours)

   - Document incident timeline
   - Identify immediate fixes
   - Update monitoring alerts

2. **Short-term Actions** (Within 1 week)

   - Implement quick wins
   - Update procedures
   - Enhance monitoring

3. **Long-term Actions** (Within 1 month)
   - Architectural improvements
   - Process enhancements
   - Training updates

This comprehensive rollback plan ensures that the Dynamic RBAC system can be safely and efficiently rolled back in case of issues, with minimal impact on business operations and user experience.
