# Patient Engagement & Follow-up Management - Staging Environment Guide

This guide provides comprehensive instructions for setting up, deploying, and managing the staging environment for the Patient Engagement & Follow-up Management module.

## 📁 Directory Structure

```
deployment/
├── scripts/
│   ├── deploy-patient-engagement-staging.sh    # Main staging deployment script
│   └── test-staging-environment.sh             # Comprehensive testing script
├── monitoring/
│   ├── staging-health-check.sh                 # Health monitoring script
│   ├── prometheus-staging.yml                  # Prometheus configuration
│   └── staging-alerts.yml                      # Alert rules for staging
└── README-staging.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

Before deploying to staging, ensure you have:

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Redis (optional, for caching and job queues)
- PM2 or systemd for process management
- Sufficient disk space (minimum 2GB free for staging)
- Available ports: 5001 (backend), 5174 (frontend), 27018 (MongoDB), 6380 (Redis)

### 1. Deploy Staging Environment

```bash
# Standard staging deployment
./deployment/scripts/deploy-patient-engagement-staging.sh

# Dry run (test without making changes)
./deployment/scripts/deploy-patient-engagement-staging.sh --dry-run

# With custom ports
STAGING_BACKEND_PORT=5001 STAGING_FRONTEND_PORT=5174 ./deployment/scripts/deploy-patient-engagement-staging.sh
```

### 2. Verify Deployment

```bash
# Run comprehensive tests
./deployment/scripts/test-staging-environment.sh

# Check service status
./deployment/scripts/deploy-patient-engagement-staging.sh --status

# Run health checks
./deployment/monitoring/staging-health-check.sh full
```

### 3. Access Staging Environment

Once deployed, you can access:

- **Backend API**: http://localhost:5001
- **Frontend App**: http://localhost:5174
- **API Documentation**: http://localhost:5001/api-docs
- **Health Check**: http://localhost:5001/health
- **Metrics**: http://localhost:5001/metrics

## 🔧 Configuration

### Environment Variables

The staging environment uses the following key configuration:

```bash
# Core Settings
NODE_ENV=staging
PORT=5001
STAGING_BACKEND_PORT=5001
STAGING_FRONTEND_PORT=5174
STAGING_DB_NAME=PharmacyCopilot-staging
STAGING_REDIS_DB=1

# Feature Flags
PATIENT_ENGAGEMENT_ENABLED=true
APPOINTMENT_SCHEDULING_ENABLED=true
FOLLOW_UP_MANAGEMENT_ENABLED=true
REMINDER_SYSTEM_ENABLED=true
PATIENT_PORTAL_ENABLED=true
ANALYTICS_REPORTING_ENABLED=true

# Debug Settings
DEBUG_MODE=true
VERBOSE_LOGGING=true
ENABLE_SWAGGER=true
NOTIFICATION_TEST_MODE=true
```

### Database Configuration

Staging uses a separate MongoDB database:

- **Database Name**: `PharmacyCopilot-staging`
- **Port**: 27018 (to avoid conflicts with production)
- **Connection**: `mongodb://localhost:27018/PharmacyCopilot-staging`

### Redis Configuration

Staging uses a separate Redis database:

- **Database**: 1 (production uses 0)
- **Port**: 6380 (to avoid conflicts with production)
- **Connection**: `redis://localhost:6380/1`

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start staging environment with Docker
docker-compose -f docker-compose.staging.yml up -d

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop staging environment
docker-compose -f docker-compose.staging.yml down

# Rebuild and restart
docker-compose -f docker-compose.staging.yml up -d --build
```

### Individual Services

```bash
# Start only backend and database
docker-compose -f docker-compose.staging.yml up -d app-staging db-staging redis-staging

# Start monitoring stack
docker-compose -f docker-compose.staging.yml up -d prometheus-staging grafana-staging
```

## 📊 Monitoring and Logging

### Health Monitoring

```bash
# Quick health check
./deployment/monitoring/staging-health-check.sh quick

# Full system assessment
./deployment/monitoring/staging-health-check.sh full

# Performance check
./deployment/monitoring/staging-health-check.sh performance

# JSON output for automation
OUTPUT_FORMAT=json ./deployment/monitoring/staging-health-check.sh full
```

### Log Files

Staging logs are stored in `/var/log/PharmacyCopilot-staging/`:

```bash
# Application logs
tail -f /var/log/PharmacyCopilot-staging/app.log

# Error logs
tail -f /var/log/PharmacyCopilot-staging/error.log

# Frontend logs
tail -f /var/log/PharmacyCopilot-staging/frontend.log

# Combined logs
tail -f /var/log/PharmacyCopilot-staging/*.log
```

### Prometheus Metrics

Access Prometheus at http://localhost:9091 to view:

- API response times
- Database query performance
- Job queue metrics
- System resource usage
- Patient engagement specific metrics

### Grafana Dashboards

Access Grafana at http://localhost:3001 (admin/staging-admin) for:

- Patient Engagement Performance Dashboard
- System Resource Monitoring
- API Endpoint Analytics
- Background Job Monitoring

## 🧪 Testing

### Automated Testing

```bash
# Run all staging tests
./deployment/scripts/test-staging-environment.sh

# Verbose output
./deployment/scripts/test-staging-environment.sh --verbose

# Generate test reports
./deployment/scripts/test-staging-environment.sh
# Reports generated in /tmp/staging-test-results-*/
```

### Manual Testing

#### 1. API Endpoint Testing

```bash
# Health check
curl http://localhost:5001/health

# API documentation
curl http://localhost:5001/api-docs

# Protected endpoints (should return 401)
curl http://localhost:5001/api/appointments
curl http://localhost:5001/api/follow-ups
curl http://localhost:5001/api/reminders/templates
```

#### 2. Feature Flag Testing

```bash
# Check feature flags
curl http://localhost:5001/api/feature-flags

# Verify patient engagement features are enabled
curl http://localhost:5001/api/system/info
```

#### 3. Database Testing

```bash
# Connect to staging database
mongosh mongodb://localhost:27018/PharmacyCopilot-staging

# Check collections
db.appointments.countDocuments()
db.followuptasks.countDocuments()
db.remindertemplates.countDocuments()
```

### Load Testing

```bash
# Install artillery (if not already installed)
npm install -g artillery

# Run basic load test
artillery quick --count 10 --num 5 http://localhost:5001/health

# Custom load test configuration
cat > staging-load-test.yml << EOF
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/health"
  - name: "API endpoints"
    requests:
      - get:
          url: "/api/feature-flags"
EOF

artillery run staging-load-test.yml
```

## 🔄 Management Commands

### Service Management

```bash
# Check service status
./deployment/scripts/deploy-patient-engagement-staging.sh --status

# Stop staging services
./deployment/scripts/deploy-patient-engagement-staging.sh --stop

# Restart services (using PM2)
pm2 restart PharmacyCopilot-patient-engagement-staging

# View PM2 status
pm2 status
pm2 logs PharmacyCopilot-patient-engagement-staging
```

### Database Management

```bash
# Seed staging data
cd backend
npm run seed:staging-data

# Clear staging database
mongosh mongodb://localhost:27018/PharmacyCopilot-staging --eval "db.dropDatabase()"

# Backup staging database
mongodump --host localhost:27018 --db PharmacyCopilot-staging --out /tmp/staging-backup-$(date +%Y%m%d)

# Restore staging database
mongorestore --host localhost:27018 --db PharmacyCopilot-staging /path/to/backup/PharmacyCopilot-staging
```

### Cache Management

```bash
# Clear Redis cache
redis-cli -p 6380 -n 1 FLUSHDB

# Check Redis status
redis-cli -p 6380 -n 1 INFO

# Monitor Redis commands
redis-cli -p 6380 -n 1 MONITOR
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check if ports are in use
netstat -tuln | grep -E ':(5001|5174|27018|6380)'

# Check logs for errors
tail -f /var/log/PharmacyCopilot-staging/error.log

# Verify configuration
cat backend/.env.staging
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
mongosh mongodb://localhost:27018/PharmacyCopilot-staging --eval "db.adminCommand('ping')"

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

#### 3. High Memory Usage

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart services to free memory
pm2 restart PharmacyCopilot-patient-engagement-staging
```

#### 4. API Endpoints Not Responding

```bash
# Check if backend is running
curl http://localhost:5001/health

# Check backend logs
pm2 logs PharmacyCopilot-patient-engagement-staging

# Verify environment configuration
pm2 env PharmacyCopilot-patient-engagement-staging
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment
export DEBUG=patient-engagement:*
export LOG_LEVEL=debug

# Restart with debug logging
pm2 restart PharmacyCopilot-patient-engagement-staging --update-env
```

### Performance Issues

```bash
# Check system resources
./deployment/monitoring/staging-health-check.sh performance

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001/health

# Create curl-format.txt
cat > curl-format.txt << EOF
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

## 🔄 Rollback Procedures

### Automatic Rollback

The deployment script automatically creates backups and can rollback on failure:

```bash
# Rollback to previous version
./deployment/scripts/deploy-patient-engagement-staging.sh --rollback
```

### Manual Rollback

```bash
# Stop current services
pm2 stop PharmacyCopilot-patient-engagement-staging

# Restore from backup
BACKUP_DIR=/var/backups/patient-engagement-staging-YYYYMMDD-HHMMSS
mongorestore --host localhost:27018 --db PharmacyCopilot-staging --drop $BACKUP_DIR/mongodb/PharmacyCopilot-staging

# Restore configuration
cp $BACKUP_DIR/backend-env-staging backend/.env.staging

# Restart services
pm2 start PharmacyCopilot-patient-engagement-staging
```

## 📋 Maintenance Tasks

### Daily Tasks

```bash
# Health check
./deployment/monitoring/staging-health-check.sh quick

# Check disk space
df -h

# Review error logs
tail -n 50 /var/log/PharmacyCopilot-staging/error.log
```

### Weekly Tasks

```bash
# Full health assessment
./deployment/monitoring/staging-health-check.sh full

# Run comprehensive tests
./deployment/scripts/test-staging-environment.sh

# Clean old logs
find /var/log/PharmacyCopilot-staging -name "*.log" -mtime +7 -delete

# Clean old backups
find /var/backups -name "patient-engagement-staging-*" -mtime +7 -exec rm -rf {} +
```

### Monthly Tasks

```bash
# Update dependencies
cd backend && npm audit && npm update
cd frontend && npm audit && npm update

# Performance review
./deployment/monitoring/staging-health-check.sh performance

# Security review
npm audit --audit-level moderate
```

## 🔐 Security Considerations

### Staging-Specific Security

- Relaxed CORS policies for development
- Debug mode enabled for troubleshooting
- Test credentials and API keys
- No SSL/TLS enforcement (HTTP only)
- Permissive rate limiting

### Security Checklist

- [ ] Test data contains no real patient information
- [ ] Staging database is isolated from production
- [ ] Debug endpoints are not exposed to external networks
- [ ] Test credentials are not used in production
- [ ] Staging environment is not accessible from public internet

## 📚 Additional Resources

### Documentation

- [Patient Engagement API Documentation](../docs/PATIENT_ENGAGEMENT_API.md)
- [Feature Flags Guide](../docs/PATIENT_ENGAGEMENT_FEATURE_FLAGS.md)
- [Troubleshooting Guide](../docs/PATIENT_ENGAGEMENT_TROUBLESHOOTING.md)

### Monitoring

- Prometheus: http://localhost:9091
- Grafana: http://localhost:3001
- Application Logs: `/var/log/PharmacyCopilot-staging/`

### Support

For issues with the staging environment:

1. Check the troubleshooting section above
2. Review logs in `/var/log/PharmacyCopilot-staging/`
3. Run health checks and tests
4. Check system resources and dependencies
5. Contact the development team with detailed error information

---

**Last Updated**: 2025-10-27  
**Version**: 1.0  
**Environment**: Staging  
**Module**: Patient Engagement & Follow-up Management