# Manual Lab Order Workflow - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Manual Lab Order workflow to production environments. The deployment is designed to be non-disruptive and can be rolled out gradually using feature flags.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **MongoDB**: Version 5.0 or higher
- **Redis**: Version 6.0 or higher (for caching)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Additional 10GB for PDF storage and caching
- **Network**: HTTPS enabled for secure PDF access

### Dependencies

- **Puppeteer**: For PDF generation (requires Chrome/Chromium)
- **QRCode Library**: For barcode generation
- **Existing Services**: OpenRouter AI, Email/SMS services

### Environment Access

- Production database access
- Environment variable management
- CI/CD pipeline access
- Monitoring and logging systems

---

## Environment Variables

### Required Environment Variables

Add the following variables to your production environment:

```bash
# Manual Lab Feature Flags
MANUAL_LAB_ENABLED=true
MANUAL_LAB_AI_INTERPRETATION_ENABLED=true
MANUAL_LAB_NOTIFICATIONS_ENABLED=true

# PDF Generation Configuration
MANUAL_LAB_PDF_STORAGE_PATH=/var/app/storage/pdfs
MANUAL_LAB_PDF_CACHE_TTL=3600
MANUAL_LAB_PDF_MAX_SIZE=10485760
MANUAL_LAB_PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Token Security
MANUAL_LAB_TOKEN_SECRET=your_secure_token_secret_here
MANUAL_LAB_TOKEN_EXPIRY=2592000
MANUAL_LAB_QR_CODE_SIZE=200

# Rate Limiting
MANUAL_LAB_ORDER_CREATION_LIMIT=10
MANUAL_LAB_ORDER_CREATION_WINDOW=900000
MANUAL_LAB_PDF_ACCESS_LIMIT=50
MANUAL_LAB_PDF_ACCESS_WINDOW=300000
MANUAL_LAB_TOKEN_SCAN_LIMIT=30
MANUAL_LAB_TOKEN_SCAN_WINDOW=60000

# AI Integration
MANUAL_LAB_AI_TIMEOUT=30000
MANUAL_LAB_AI_RETRY_ATTEMPTS=3
MANUAL_LAB_AI_RETRY_DELAY=5000

# Caching Configuration
MANUAL_LAB_REDIS_PREFIX=manual_lab:
MANUAL_LAB_CACHE_TEST_CATALOG_TTL=86400
MANUAL_LAB_CACHE_PDF_TTL=1800

# Monitoring and Logging
MANUAL_LAB_LOG_LEVEL=info
MANUAL_LAB_METRICS_ENABLED=true
MANUAL_LAB_AUDIT_DETAILED=true

# Security
MANUAL_LAB_CSRF_SECRET=your_csrf_secret_here
MANUAL_LAB_SECURITY_MONITORING=true
MANUAL_LAB_THREAT_DETECTION=true
```

### Optional Environment Variables

```bash
# Development/Testing
MANUAL_LAB_DEBUG=false
MANUAL_LAB_MOCK_AI_SERVICE=false
MANUAL_LAB_SKIP_PDF_GENERATION=false

# Performance Tuning
MANUAL_LAB_DB_POOL_SIZE=10
MANUAL_LAB_CONCURRENT_PDF_LIMIT=5
MANUAL_LAB_BATCH_SIZE=100

# Compliance
MANUAL_LAB_AUDIT_RETENTION_DAYS=2555
MANUAL_LAB_COMPLIANCE_REPORTING=true
MANUAL_LAB_HIPAA_LOGGING=true
```

---

## Pre-Deployment Checklist

### 1. Code Preparation

- [ ] All Manual Lab code merged to main branch
- [ ] Unit tests passing (>95% coverage)
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Security audit completed
- [ ] Performance testing completed

### 2. Database Preparation

- [ ] Database backup completed
- [ ] Migration scripts tested in staging
- [ ] Index creation scripts prepared
- [ ] Rollback procedures documented

### 3. Infrastructure Preparation

- [ ] Chrome/Chromium installed on servers
- [ ] PDF storage directory created with proper permissions
- [ ] Redis cache configured and tested
- [ ] Load balancer configuration updated
- [ ] SSL certificates validated

### 4. Security Preparation

- [ ] Security tokens generated and stored securely
- [ ] Rate limiting configurations tested
- [ ] CSRF protection enabled
- [ ] Security monitoring configured
- [ ] Audit logging verified

### 5. Monitoring Preparation

- [ ] Application metrics configured
- [ ] Error tracking enabled
- [ ] Performance monitoring setup
- [ ] Alert thresholds configured
- [ ] Dashboard created

---

## Deployment Steps

### Step 1: Database Migration

Run the database migrations to create required collections and indexes:

```bash
# Connect to production database
mongo "mongodb://your-production-uri"

# Or use the migration script
cd backend
npm run migrate:manual-lab up

# Verify migration success
npm run migrate:manual-lab validate
```

**Migration Script Usage:**

```bash
# Run all migrations
node src/migrations/manualLabMigrations.js up

# Validate setup
node src/migrations/manualLabMigrations.js validate

# Rollback (if needed)
node src/migrations/manualLabMigrations.js down
```

### Step 2: Environment Configuration

Deploy environment variables to production:

```bash
# Using AWS Systems Manager Parameter Store
aws ssm put-parameter --name "/app/manual-lab/enabled" --value "true" --type "String"
aws ssm put-parameter --name "/app/manual-lab/pdf-storage-path" --value "/var/app/storage/pdfs" --type "String"

# Using Kubernetes ConfigMap
kubectl create configmap manual-lab-config --from-env-file=manual-lab.env

# Using Docker Compose
docker-compose --env-file manual-lab.env up -d
```

### Step 3: Application Deployment

Deploy the application with Manual Lab features:

```bash
# Build application
npm run build

# Deploy to production
npm run deploy:production

# Or using Docker
docker build -t PharmaPilot-app:manual-lab .
docker push your-registry/PharmaPilot-app:manual-lab
docker service update --image your-registry/PharmaPilot-app:manual-lab PharmaPilot-app
```

### Step 4: Feature Flag Configuration

Enable Manual Lab features gradually:

```bash
# Enable for specific workplaces first
curl -X POST "https://your-api.com/api/admin/feature-flags" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "manual_lab_orders",
    "enabled": true,
    "scope": "workplace",
    "conditions": {
      "workplaceIds": ["workplace_id_1", "workplace_id_2"]
    }
  }'

# Monitor and gradually expand
curl -X PUT "https://your-api.com/api/admin/feature-flags/manual_lab_orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "scope": "percentage",
    "conditions": {
      "percentage": 25
    }
  }'
```

### Step 5: Service Verification

Verify all services are working correctly:

```bash
# Health check
curl -X GET "https://your-api.com/api/health" \
  -H "Authorization: Bearer $TOKEN"

# Manual Lab specific health check
curl -X GET "https://your-api.com/api/manual-lab-orders/health" \
  -H "Authorization: Bearer $TOKEN"

# Test PDF generation
curl -X POST "https://your-api.com/api/manual-lab-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

### Step 6: Monitoring Setup

Configure monitoring and alerting:

```bash
# Application metrics
curl -X GET "https://your-api.com/api/metrics" | grep manual_lab

# Error tracking
curl -X GET "https://your-api.com/api/manual-lab-orders/security/dashboard" \
  -H "Authorization: Bearer $TOKEN"

# Performance monitoring
curl -X GET "https://your-api.com/api/admin/performance/manual-lab" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Rollback Procedures

### Immediate Rollback (Emergency)

If critical issues are detected:

```bash
# 1. Disable feature flags immediately
curl -X PUT "https://your-api.com/api/admin/feature-flags/manual_lab_orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# 2. Revert to previous application version
docker service update --image your-registry/PharmaPilot-app:previous-version PharmaPilot-app

# 3. Monitor for stability
curl -X GET "https://your-api.com/api/health"
```

### Partial Rollback

If issues affect specific functionality:

```bash
# Disable specific features
curl -X PUT "https://your-api.com/api/admin/feature-flags/manual_lab_ai_interpretation" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Reduce scope to specific workplaces
curl -X PUT "https://your-api.com/api/admin/feature-flags/manual_lab_orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "scope": "workplace",
    "conditions": {
      "workplaceIds": ["safe_workplace_id"]
    }
  }'
```

### Database Rollback

If database issues occur:

```bash
# Stop application
docker service scale PharmaPilot-app=0

# Restore database from backup
mongorestore --uri="mongodb://your-production-uri" --drop /path/to/backup

# Rollback migrations if needed
node src/migrations/manualLabMigrations.js down

# Restart application with previous version
docker service update --image your-registry/PharmaPilot-app:previous-version PharmaPilot-app
docker service scale PharmaPilot-app=3
```

---

## Post-Deployment Verification

### 1. Functional Testing

Run post-deployment tests to verify functionality:

```bash
# Run automated test suite
npm run test:post-deployment

# Manual verification checklist
curl -X POST "https://your-api.com/api/manual-lab-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "test_patient_id",
    "tests": [{"name": "Test", "code": "TEST", "specimenType": "Blood"}],
    "indication": "Test order",
    "consentObtained": true,
    "consentObtainedBy": "test_user_id"
  }'
```

### 2. Performance Verification

Monitor performance metrics:

```bash
# Check response times
curl -w "@curl-format.txt" -X GET "https://your-api.com/api/manual-lab-orders" \
  -H "Authorization: Bearer $TOKEN"

# Monitor resource usage
kubectl top pods -l app=PharmaPilot-app

# Check database performance
mongo --eval "db.manuallaborders.getIndexes()"
```

### 3. Security Verification

Verify security measures:

```bash
# Test rate limiting
for i in {1..20}; do
  curl -X POST "https://your-api.com/api/manual-lab-orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"invalid": "data"}'
done

# Verify CSRF protection
curl -X POST "https://your-api.com/api/manual-lab-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "without_csrf_token"}'

# Check audit logging
curl -X GET "https://your-api.com/api/manual-lab-orders/compliance/audit-trail/TEST-ORDER" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Metrics**

   - Request rate and response times
   - Error rates by endpoint
   - Feature flag usage statistics
   - User adoption rates

2. **Business Metrics**

   - Orders created per hour/day
   - PDF generation success rate
   - AI interpretation success rate
   - Result entry completion rate

3. **System Metrics**
   - Database query performance
   - Redis cache hit rates
   - PDF storage usage
   - Memory and CPU utilization

### Alert Configuration

```yaml
# Prometheus alert rules
groups:
  - name: manual_lab_alerts
    rules:
      - alert: ManualLabHighErrorRate
        expr: rate(manual_lab_errors_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate in Manual Lab API'

      - alert: ManualLabPDFGenerationFailure
        expr: rate(manual_lab_pdf_generation_failures_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'PDF generation failing'

      - alert: ManualLabAIServiceDown
        expr: manual_lab_ai_service_up == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: 'AI interpretation service unavailable'
```

### Dashboard Configuration

Create monitoring dashboards with:

- Request volume and response time graphs
- Error rate trends
- Feature adoption metrics
- System resource utilization
- Business KPIs (orders, results, interpretations)

---

## Troubleshooting

### Common Deployment Issues

#### 1. PDF Generation Fails

**Symptoms:** PDF endpoints return 500 errors
**Causes:** Missing Chrome/Chromium, insufficient permissions
**Solutions:**

```bash
# Install Chrome/Chromium
apt-get update && apt-get install -y chromium-browser

# Set executable path
export MANUAL_LAB_PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Fix permissions
chmod +x /usr/bin/chromium-browser
chown app:app /var/app/storage/pdfs
```

#### 2. Database Connection Issues

**Symptoms:** Migration failures, connection timeouts
**Causes:** Network issues, authentication problems
**Solutions:**

```bash
# Test connection
mongo "mongodb://your-production-uri" --eval "db.runCommand('ping')"

# Check connection pool
mongo "mongodb://your-production-uri" --eval "db.serverStatus().connections"

# Verify authentication
mongo "mongodb://your-production-uri" --eval "db.runCommand({connectionStatus: 1})"
```

#### 3. Feature Flag Issues

**Symptoms:** Features not appearing, inconsistent behavior
**Causes:** Cache issues, configuration problems
**Solutions:**

```bash
# Clear feature flag cache
redis-cli DEL "feature_flags:*"

# Verify feature flag configuration
curl -X GET "https://your-api.com/api/admin/feature-flags/manual_lab_orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Force feature flag refresh
curl -X POST "https://your-api.com/api/admin/feature-flags/refresh" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 4. Rate Limiting Issues

**Symptoms:** 429 errors, blocked requests
**Causes:** Aggressive rate limits, cache issues
**Solutions:**

```bash
# Check rate limit status
redis-cli KEYS "rate_limit:*"

# Reset rate limits for testing
redis-cli DEL "rate_limit:manual_lab:*"

# Adjust rate limits
export MANUAL_LAB_ORDER_CREATION_LIMIT=20
export MANUAL_LAB_PDF_ACCESS_LIMIT=100
```

### Performance Issues

#### 1. Slow PDF Generation

**Solutions:**

```bash
# Increase PDF generation timeout
export MANUAL_LAB_PDF_GENERATION_TIMEOUT=60000

# Limit concurrent PDF generation
export MANUAL_LAB_CONCURRENT_PDF_LIMIT=3

# Enable PDF caching
export MANUAL_LAB_PDF_CACHE_TTL=3600
```

#### 2. Database Query Performance

**Solutions:**

```bash
# Analyze slow queries
mongo "mongodb://your-production-uri" --eval "db.setProfilingLevel(2, {slowms: 100})"

# Check index usage
mongo "mongodb://your-production-uri" --eval "db.manuallaborders.find({}).explain('executionStats')"

# Optimize queries
mongo "mongodb://your-production-uri" --eval "db.manuallaborders.createIndex({workplaceId: 1, status: 1, createdAt: -1})"
```

---

## Security Considerations

### 1. Data Protection

- Ensure all patient data is encrypted at rest and in transit
- Implement proper access controls for PDF storage
- Use secure tokens for QR/barcode generation
- Enable audit logging for all operations

### 2. Network Security

- Use HTTPS for all API endpoints
- Implement proper CORS policies
- Configure rate limiting to prevent abuse
- Monitor for suspicious activity

### 3. Compliance

- Ensure HIPAA compliance for all patient data
- Implement proper audit trails
- Configure data retention policies
- Enable compliance reporting

---

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**

   - Review error logs and metrics
   - Check PDF storage usage
   - Verify backup integrity
   - Update security patches

2. **Monthly**

   - Analyze performance trends
   - Review feature adoption metrics
   - Update test catalog if needed
   - Conduct security audit

3. **Quarterly**
   - Performance optimization review
   - Capacity planning assessment
   - Disaster recovery testing
   - Compliance audit

### Backup and Recovery

```bash
# Database backup
mongodump --uri="mongodb://your-production-uri" --out=/backup/manual-lab-$(date +%Y%m%d)

# PDF storage backup
rsync -av /var/app/storage/pdfs/ /backup/pdfs-$(date +%Y%m%d)/

# Configuration backup
kubectl get configmap manual-lab-config -o yaml > /backup/config-$(date +%Y%m%d).yaml
```

---

## Support and Escalation

### Support Levels

1. **Level 1**: Basic troubleshooting, configuration issues
2. **Level 2**: Database issues, performance problems
3. **Level 3**: Security incidents, data corruption

### Contact Information

- **Technical Support**: support@PharmaPilot.com
- **Security Issues**: security@PharmaPilot.com
- **Emergency Escalation**: +1-XXX-XXX-XXXX

### Documentation

- API Documentation: `/docs/MANUAL_LAB_API.md`
- Error Codes: `/docs/MANUAL_LAB_ERROR_CODES.md`
- Integration Guide: `/docs/MANUAL_LAB_INTEGRATION_POINTS.md`
- User Training: `/docs/MANUAL_LAB_USER_TRAINING.md`
