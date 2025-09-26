# Dynamic RBAC Deployment Guide

This directory contains all the deployment scripts, monitoring configurations, and emergency response procedures for the Dynamic RBAC system.

## 📁 Directory Structure

```
deployment/
├── database-migrations/
│   └── 002_dynamic_rbac_deployment.sql    # Database migration script
├── scripts/
│   ├── deploy-dynamic-rbac.sh             # Main deployment script
│   ├── rollback-rbac.sh                   # Emergency rollback script
│   └── emergency-response.sh              # Emergency response procedures
├── monitoring/
│   └── health-check.sh                    # Health check script
└── README.md                              # This file
```

## 🚀 Deployment Process

### Prerequisites

Before deploying the Dynamic RBAC system, ensure you have:

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Redis (optional, for caching)
- PM2 or systemd for process management
- Prometheus and Grafana for monitoring
- Sufficient disk space (minimum 1GB free)

### 1. Pre-Deployment Checklist

```bash
# Check system requirements
node --version
mongosh --version  # or mongo --version
redis-cli --version  # optional

# Verify database connectivity
npm run test:db-connection

# Check current system status
./deployment/monitoring/health-check.sh quick
```

### 2. Deployment

#### Standard Deployment

```bash
# Run the deployment script
./deployment/scripts/deploy-dynamic-rbac.sh
```

#### Dry Run (Recommended First)

```bash
# Test deployment without making changes
./deployment/scripts/deploy-dynamic-rbac.sh --dry-run
```

#### Custom Environment

```bash
# Deploy to staging environment
DEPLOYMENT_ENV=staging ./deployment/scripts/deploy-dynamic-rbac.sh
```

### 3. Post-Deployment Verification

```bash
# Run comprehensive health check
./deployment/monitoring/health-check.sh full

# Verify RBAC functionality
npm run test:rbac:integration

# Check monitoring dashboards
# - Grafana: http://localhost:3000/d/rbac-performance
# - Prometheus: http://localhost:9090/targets
```

## 🔄 Rollback Procedures

### Automatic Rollback

The deployment script automatically creates backups and can rollback on failure:

```bash
# The deployment script will automatically rollback on critical failures
```

### Manual Rollback

```bash
# Rollback to the latest backup
./deployment/scripts/rollback-rbac.sh

# Rollback to a specific backup
BACKUP_DIR=/var/backups/rbac-deployment-20250127-143022 ./deployment/scripts/rollback-rbac.sh
```

### Emergency Rollback

```bash
# For critical situations, use the main deployment script
./deployment/scripts/deploy-dynamic-rbac.sh --rollback
```

## 🚨 Emergency Response

### Health Monitoring

```bash
# Quick health check
./deployment/monitoring/health-check.sh quick

# Full system assessment
./deployment/monitoring/health-check.sh full

# JSON output for automation
OUTPUT_FORMAT=json ./deployment/monitoring/health-check.sh performance
```

### Emergency Response Modes

```bash
# Assess system health and collect incident data
./deployment/scripts/emergency-response.sh assess

# Isolate suspicious accounts
./deployment/scripts/emergency-response.sh isolate

# Full emergency mode (isolate + emergency configuration)
./deployment/scripts/emergency-response.sh emergency

# Recovery mode (disable emergency settings)
./deployment/scripts/emergency-response.sh recover
```

### Custom Incident ID

```bash
# Use custom incident ID for tracking
INCIDENT_ID=SEC001 ./deployment/scripts/emergency-response.sh emergency
```

## 📊 Monitoring and Alerting

### Grafana Dashboards

The deployment includes pre-configured Grafana dashboards:

1. **RBAC Performance Dashboard** (`rbac-performance-dashboard.json`)

   - Permission check latency
   - Cache hit rates
   - Error rates
   - Throughput metrics

2. **RBAC Security Dashboard** (`rbac-security-dashboard.json`)
   - Failed login attempts
   - Privilege escalation attempts
   - Suspicious access patterns
   - Security incident timeline

### Prometheus Alerts

Comprehensive alerting rules are configured in `monitoring/prometheus-alerts/rbac-alerts.yml`:

- **Performance Alerts**: High latency, low cache hit rate, slow database queries
- **Error Alerts**: High error rates, permission check failures, database connection errors
- **Security Alerts**: Failed logins, privilege escalation, suspicious access patterns
- **Availability Alerts**: Service down, high memory usage, cache unavailable
- **Compliance Alerts**: Audit log gaps, overdue access reviews, expired permissions
- **Business Alerts**: High denial rates, unusual usage patterns, role assignment anomalies

### Alert Routing

Alerts are routed based on severity:

- **Critical**: Immediate Slack notification + email
- **Warning**: Email notification
- **Info**: Webhook notification

## 🔧 Configuration

### Environment Variables

Key environment variables for the RBAC system:

```bash
# Core RBAC Settings
ENABLE_DYNAMIC_RBAC=true
RBAC_CACHE_TTL=300
ENABLE_RBAC_MONITORING=true

# Emergency Mode Settings
RBAC_EMERGENCY_MODE=false
RBAC_ENHANCED_LOGGING=false

# Database Settings
MONGO_HOST=localhost:27017
MONGO_DB=pharmacare

# Monitoring Settings
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000

# Alert Settings
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
EMERGENCY_EMAIL=security-team@pharma-care.com
```

### Database Migration

The database migration script (`002_dynamic_rbac_deployment.sql`) includes:

- Collection indexes for optimal performance
- System roles and permissions setup
- Role-permission mappings
- Validation queries
- Rollback procedures

## 📋 Maintenance Tasks

### Regular Health Checks

Set up cron jobs for regular health monitoring:

```bash
# Add to crontab
# Health check every 15 minutes
*/15 * * * * /path/to/deployment/monitoring/health-check.sh quick >> /var/log/rbac-health.log 2>&1

# Full health check daily
0 2 * * * /path/to/deployment/monitoring/health-check.sh full >> /var/log/rbac-health-daily.log 2>&1
```

### Log Rotation

Configure log rotation for RBAC logs:

```bash
# Add to /etc/logrotate.d/rbac
/var/log/rbac-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

### Backup Cleanup

The deployment script automatically cleans up old backups (keeps last 5), but you can also run manual cleanup:

```bash
# Clean backups older than 7 days
find /var/backups -name "rbac-deployment-*" -type d -mtime +7 -exec rm -rf {} +
```

## 🔍 Troubleshooting

### Common Issues

1. **Service Won't Start**

   ```bash
   # Check logs
   tail -f /var/log/pharmacare-backend.log

   # Check configuration
   npm run validate:config

   # Test database connection
   npm run test:db-connection
   ```

2. **High Latency**

   ```bash
   # Check cache status
   redis-cli info stats

   # Analyze slow queries
   npm run analyze:slow-queries

   # Check system resources
   ./deployment/monitoring/health-check.sh performance
   ```

3. **Permission Errors**

   ```bash
   # Validate role assignments
   npm run validate:rbac-assignments

   # Check audit logs
   npm run export:audit-logs --since="1 hour ago"

   # Test specific permissions
   npm run test:permission -- --user=USER_ID --permission=PERMISSION
   ```

### Emergency Contacts

- **Security Team**: security-team@pharma-care.com
- **DevOps Team**: devops-team@pharma-care.com
- **On-Call Engineer**: +1-555-EMERGENCY

### Escalation Procedures

1. **Level 1**: Automated alerts → On-call engineer
2. **Level 2**: Critical issues → Security team + DevOps team
3. **Level 3**: System compromise → All teams + Management

## 📚 Additional Resources

- [RBAC API Documentation](../docs/DYNAMIC_RBAC_API.md)
- [Security Guidelines](../docs/RBAC_SECURITY_GUIDELINES.md)
- [Best Practices](../docs/RBAC_BEST_PRACTICES.md)
- [Troubleshooting Guide](../docs/DYNAMIC_RBAC_TROUBLESHOOTING.md)
- [User Guide](../docs/USER_GUIDE_ROLE_MANAGEMENT.md)

## 📝 Change Log

### Version 1.0 (2025-01-27)

- Initial deployment scripts
- Monitoring and alerting setup
- Emergency response procedures
- Health check automation
- Comprehensive documentation

---

For questions or issues, please contact the development team or create an issue in the project repository.
