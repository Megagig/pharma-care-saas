# Patient Engagement & Follow-up Management - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Patient Engagement & Follow-up Management module to production with zero downtime, database migrations, feature flag management, and comprehensive monitoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Preparation](#pre-deployment-preparation)
3. [Deployment Execution](#deployment-execution)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Gradual Rollout Strategy](#gradual-rollout-strategy)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ or CentOS 8+)
- **Node.js**: Version 18.0.0 or higher
- **MongoDB**: Version 4.4 or higher
- **Redis**: Version 6.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection

### Required Tools

```bash
# Install required tools
sudo apt update
sudo apt install -y curl wget git jq

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB tools
sudo apt install -y mongodb-clients

# Install Redis tools
sudo apt install -y redis-tools
```

### Access Requirements

- SSH access to production servers
- Database administrator credentials
- Redis access credentials
- SSL certificates for HTTPS
- External service API keys (Twilio, Resend, etc.)

## Pre-Deployment Preparation

### 1. Environment Setup

Create the production environment configuration:

```bash
# Copy environment template
cp deployment/production/patient-engagement-environment.env backend/.env.production

# Edit configuration with production values
nano backend/.env.production
```

Key environment variables to configure:

```bash
# Database
MONGODB_URI=mongodb://production-db:27017/PharmacyCopilot
REDIS_URL=redis://production-redis:6379

# Security
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
RESEND_API_KEY=your-resend-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### 2. Database Preparation

Ensure MongoDB is properly configured:

```bash
# Check MongoDB status
sudo systemctl status mongod

# Create database backup
mongodump --host localhost:27017 --db PharmacyCopilot --out /backup/pre-deployment-$(date +%Y%m%d)

# Verify backup integrity
mongorestore --host localhost:27017 --db PharmacyCopilot-test --drop /backup/pre-deployment-$(date +%Y%m%d)/PharmacyCopilot
```

### 3. Security Configuration

Configure SSL/TLS and security headers:

```bash
# Update Nginx configuration
sudo nano /etc/nginx/sites-available/PharmacyCopilot

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Deployment Execution

### 1. Run Pre-Deployment Checks

```bash
# Navigate to project directory
cd /path/to/PharmacyCopilot

# Run deployment script with dry-run
./deployment/scripts/deploy-patient-engagement-production.sh --dry-run --verbose

# Review output and ensure all checks pass
```

### 2. Execute Full Deployment

```bash
# Run full production deployment
./deployment/scripts/deploy-patient-engagement-production.sh --verbose

# Monitor deployment progress
tail -f /var/log/patient-engagement-deployment/deployment-$(date +%Y%m%d-*)*.log
```

### 3. Deployment Steps Overview

The deployment script performs the following steps:

1. **Prerequisites Check**
   - Verifies system requirements
   - Checks service availability
   - Validates disk space and resources

2. **Backup Creation**
   - Creates full database backup
   - Backs up configuration files
   - Backs up current application code

3. **Database Migration**
   - Executes production migration script
   - Creates optimized indexes
   - Migrates existing MTR follow-ups
   - Creates default reminder templates

4. **Backend Deployment**
   - Builds production backend
   - Performs zero-downtime deployment
   - Updates load balancer configuration
   - Verifies service health

5. **Frontend Deployment**
   - Builds production frontend
   - Deploys static assets
   - Updates web server configuration
   - Invalidates CDN cache

6. **Feature Flag Configuration**
   - Sets all features to disabled initially
   - Configures gradual rollout settings
   - Prepares monitoring for rollout

7. **Monitoring Setup**
   - Configures Prometheus metrics
   - Sets up Grafana dashboards
   - Configures alerting rules
   - Sets up health checks

## Post-Deployment Verification

### 1. System Health Checks

```bash
# Run comprehensive health check
./deployment/monitoring/patient-engagement-production-health-check.sh full --verbose

# Check specific components
./deployment/monitoring/patient-engagement-production-health-check.sh database
./deployment/monitoring/patient-engagement-production-health-check.sh api
./deployment/monitoring/patient-engagement-production-health-check.sh performance
```

### 2. Manual Verification

#### API Endpoints
```bash
# Test health endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health

# Test protected endpoints (should return 401)
curl https://your-domain.com/api/appointments
curl https://your-domain.com/api/follow-ups
```

#### Database Verification
```bash
# Connect to MongoDB
mongosh PharmacyCopilot

# Check collections
db.appointments.countDocuments()
db.followuptasks.countDocuments()
db.remindertemplates.countDocuments()
db.pharmacistschedules.countDocuments()

# Check indexes
db.appointments.getIndexes()
db.followuptasks.getIndexes()
```

#### Feature Flags Verification
```bash
# Check feature flag status
mongosh PharmacyCopilot --eval "db.featureflags.find({name: /PATIENT_ENGAGEMENT/})"
```

### 3. Performance Verification

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/health

# Monitor system resources
htop
iostat -x 1
```

## Gradual Rollout Strategy

### Phase 1: Initial Rollout (10% of workspaces)

```bash
# Enable core features for 10% of workspaces
mongosh PharmacyCopilot --eval "
db.featureflags.updateOne(
  {name: 'APPOINTMENT_SCHEDULING_ENABLED'},
  {\$set: {enabled: true, rolloutPercentage: 10}}
)
db.featureflags.updateOne(
  {name: 'FOLLOW_UP_MANAGEMENT_ENABLED'},
  {\$set: {enabled: true, rolloutPercentage: 10}}
)
db.featureflags.updateOne(
  {name: 'REMINDER_SYSTEM_ENABLED'},
  {\$set: {enabled: true, rolloutPercentage: 10}}
)
"

# Restart backend to pick up changes
pm2 restart PharmacyCopilot-backend

# Monitor for 24-48 hours
./deployment/monitoring/patient-engagement-production-health-check.sh performance --json > /tmp/phase1-metrics.json
```

### Phase 2: Expanded Rollout (25% of workspaces)

After 24-48 hours of stable operation:

```bash
# Increase rollout to 25%
mongosh PharmacyCopilot --eval "
db.featureflags.updateMany(
  {name: {$in: ['APPOINTMENT_SCHEDULING_ENABLED', 'FOLLOW_UP_MANAGEMENT_ENABLED', 'REMINDER_SYSTEM_ENABLED']}},
  {\$set: {rolloutPercentage: 25}}
)
"

# Restart backend
pm2 restart PharmacyCopilot-backend

# Monitor for 48 hours
```

### Phase 3: Majority Rollout (50% of workspaces)

After successful Phase 2:

```bash
# Increase rollout to 50% and enable patient portal
mongosh PharmacyCopilot --eval "
db.featureflags.updateMany(
  {name: {$in: ['APPOINTMENT_SCHEDULING_ENABLED', 'FOLLOW_UP_MANAGEMENT_ENABLED', 'REMINDER_SYSTEM_ENABLED']}},
  {\$set: {rolloutPercentage: 50}}
)
db.featureflags.updateOne(
  {name: 'PATIENT_PORTAL_ENABLED'},
  {\$set: {enabled: true, rolloutPercentage: 25}}
)
"

# Restart backend
pm2 restart PharmacyCopilot-backend
```

### Phase 4: Full Rollout (100% of workspaces)

After successful Phase 3:

```bash
# Enable all features for all workspaces
mongosh PharmacyCopilot --eval "
db.featureflags.updateMany(
  {name: {$regex: /PATIENT_ENGAGEMENT|APPOINTMENT|FOLLOW_UP|REMINDER|PORTAL|ANALYTICS/}},
  {\$set: {enabled: true, rolloutPercentage: 100}}
)
"

# Restart backend
pm2 restart PharmacyCopilot-backend
```

## Monitoring and Alerting

### 1. Prometheus Metrics

Access Prometheus at `http://your-domain:9090` to monitor:

- `appointment_creation_total` - Total appointments created
- `appointment_creation_failures_total` - Failed appointment creations
- `followup_tasks_total` - Total follow-up tasks
- `followup_tasks_overdue` - Overdue follow-up tasks
- `reminder_delivery_total` - Total reminders sent
- `reminder_delivery_failures_total` - Failed reminder deliveries
- `http_request_duration_seconds` - API response times
- `process_resident_memory_bytes` - Memory usage

### 2. Grafana Dashboards

Access Grafana at `http://your-domain:3001` (admin/admin) to view:

- **Patient Engagement Overview Dashboard**
  - Appointment metrics
  - Follow-up task metrics
  - Reminder effectiveness
  - System performance

- **System Health Dashboard**
  - API response times
  - Error rates
  - Resource utilization
  - Database performance

### 3. Alert Configuration

Key alerts configured:

- **Critical Alerts** (immediate notification):
  - High appointment creation failure rate (>10%)
  - Database connection failure
  - High memory usage (>90%)
  - API response time >2000ms

- **Warning Alerts** (email notification):
  - Many overdue follow-up tasks (>10)
  - High reminder delivery failure rate (>5%)
  - High memory usage (>80%)
  - API response time >1000ms

### 4. Log Monitoring

Monitor logs in real-time:

```bash
# Application logs
tail -f /var/log/PharmacyCopilot/patient-engagement/*.log

# Health check logs
tail -f /var/log/patient-engagement-health.log

# Deployment logs
tail -f /var/log/patient-engagement-deployment/*.log
```

## Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back if:
- Database migration fails
- Service health checks fail after deployment
- Critical errors detected during deployment

### Manual Rollback

If issues are detected after deployment:

```bash
# Immediate rollback
./deployment/scripts/deploy-patient-engagement-production.sh --rollback

# Or disable features immediately
mongosh PharmacyCopilot --eval "
db.featureflags.updateMany(
  {name: {$regex: /PATIENT_ENGAGEMENT/}},
  {\$set: {enabled: false, rolloutPercentage: 0}}
)
"

# Restart backend
pm2 restart PharmacyCopilot-backend
```

### Rollback Verification

After rollback:

```bash
# Verify system health
./deployment/monitoring/patient-engagement-production-health-check.sh full

# Check feature flags are disabled
mongosh PharmacyCopilot --eval "db.featureflags.find({name: /PATIENT_ENGAGEMENT/})"

# Verify API endpoints
curl -f https://your-domain.com/health
```

## Troubleshooting

### Common Issues

#### 1. Database Migration Fails

```bash
# Check migration logs
tail -f /var/log/patient-engagement-deployment/*.log

# Manually run migration
mongosh PharmacyCopilot deployment/database-migrations/003_patient_engagement_production.js

# Verify migration status
mongosh PharmacyCopilot --eval "db.migrationlogs.findOne({migration: '003_patient_engagement_production'})"
```

#### 2. Service Won't Start

```bash
# Check PM2 status
pm2 status
pm2 logs PharmacyCopilot-backend

# Check configuration
node -e "console.log(require('./backend/.env.production'))"

# Test database connection
mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
```

#### 3. High Memory Usage

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart services
pm2 restart PharmacyCopilot-backend

# Check for memory leaks
node --inspect backend/dist/server.js
```

#### 4. API Endpoints Not Responding

```bash
# Check service status
curl -f http://localhost:3000/health

# Check logs
pm2 logs PharmacyCopilot-backend --lines 100

# Check network configuration
netstat -tuln | grep 3000
```

### Performance Issues

#### 1. Slow API Response Times

```bash
# Check database performance
mongosh PharmacyCopilot --eval "db.runCommand({serverStatus: 1}).opcounters"

# Check slow queries
mongosh PharmacyCopilot --eval "db.setProfilingLevel(2, {slowms: 100})"

# Analyze query performance
mongosh PharmacyCopilot --eval "db.system.profile.find().sort({ts: -1}).limit(5)"
```

#### 2. High Database Load

```bash
# Check database connections
mongosh PharmacyCopilot --eval "db.serverStatus().connections"

# Check index usage
mongosh PharmacyCopilot --eval "db.appointments.getIndexes()"

# Optimize queries
mongosh PharmacyCopilot --eval "db.appointments.explain('executionStats').find({workplaceId: ObjectId('...')})"
```

### Emergency Procedures

#### 1. Complete System Failure

```bash
# Stop all services
pm2 stop all

# Restore from backup
mongorestore --host localhost:27017 --db PharmacyCopilot --drop /backup/latest-backup/PharmacyCopilot

# Start services with features disabled
export PATIENT_ENGAGEMENT_ENABLED=false
pm2 start ecosystem.config.js
```

#### 2. Data Corruption

```bash
# Stop services immediately
pm2 stop all

# Restore from latest backup
mongorestore --host localhost:27017 --db PharmacyCopilot --drop /backup/$(cat /var/backups/patient-engagement-production/latest-backup.txt)/mongodb/PharmacyCopilot

# Verify data integrity
mongosh PharmacyCopilot --eval "db.appointments.countDocuments()"

# Restart services
pm2 start ecosystem.config.js
```

## Support and Escalation

### Contact Information

- **Development Team**: dev-team@pharma-care.com
- **DevOps Team**: devops@pharma-care.com
- **On-Call Engineer**: +1-555-EMERGENCY
- **CTO**: cto@pharma-care.com

### Escalation Matrix

1. **Level 1** (0-30 minutes): Development team
2. **Level 2** (30-60 minutes): DevOps team + Development lead
3. **Level 3** (60+ minutes): CTO + All teams

### Documentation

- **API Documentation**: `/docs/PATIENT_ENGAGEMENT_API.md`
- **Troubleshooting Guide**: `/docs/PATIENT_ENGAGEMENT_TROUBLESHOOTING.md`
- **Architecture Guide**: `/docs/PATIENT_ENGAGEMENT_ARCHITECTURE.md`

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-27  
**Next Review**: 2025-11-27  
**Owner**: Development Team  
**Approver**: CTO