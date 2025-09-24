# Reports & Analytics Module - Production Runbook

## Overview

This runbook provides operational procedures for managing the Reports & Analytics module in production.

## Service Architecture

### Components

- **Frontend**: React-based dashboard integrated into main application
- **Backend**: Node.js API endpoints for report generation and management
- **Database**: MongoDB collections for templates, schedules, and audit logs
- **Cache**: Redis for report data caching and session management
- **Background Jobs**: Queue-based report generation and export processing

### Dependencies

- MongoDB (primary database)
- Redis (caching and job queue)
- Elasticsearch (logging and search)
- SMTP service (email delivery)
- File storage (report exports)

## Operational Procedures

### 1. Health Monitoring

#### Service Health Checks

```bash
# Check main application health
curl -f https://api.pharma-care.com/api/health

# Check reports-specific endpoints
curl -f https://api.pharma-care.com/api/reports/health

# Check background job processor
kubectl get pods -l app=reports-job-processor -n pharma-care-prod
```

#### Database Health

```bash
# Check MongoDB connection
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo --eval "
  db.adminCommand('ping');
  db.reporttemplates.countDocuments();
  db.reportschedules.countDocuments();
"

# Check Redis cache
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli info memory
```

### 2. Performance Monitoring

#### Key Metrics to Monitor

- Report generation time (target: <10s for 95th percentile)
- Export queue size (alert if >100 pending jobs)
- Cache hit rate (target: >70%)
- Error rate (alert if >1%)
- Memory usage (alert if >80%)
- CPU usage (alert if >70%)

#### Performance Queries

```bash
# Check report generation performance
kubectl exec -it monitoring-prometheus-0 -n monitoring -- \
  promtool query instant 'histogram_quantile(0.95, rate(report_generation_duration_seconds_bucket[5m]))'

# Check cache performance
kubectl exec -it monitoring-prometheus-0 -n monitoring -- \
  promtool query instant 'rate(reports_cache_hits_total[5m]) / rate(reports_cache_requests_total[5m])'
```

### 3. Scaling Procedures

#### Horizontal Scaling

```bash
# Scale backend replicas
kubectl scale deployment pharma-care-backend --replicas=5 -n pharma-care-prod

# Scale background job processors
kubectl scale deployment reports-job-processor --replicas=4 -n pharma-care-prod

# Verify scaling
kubectl get pods -l app=pharma-care-backend -n pharma-care-prod
```

#### Vertical Scaling

```bash
# Update resource limits
kubectl patch deployment pharma-care-backend -n pharma-care-prod -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "backend",
          "resources": {
            "requests": {"memory": "1Gi", "cpu": "500m"},
            "limits": {"memory": "4Gi", "cpu": "2000m"}
          }
        }]
      }
    }
  }
}'
```

### 4. Cache Management

#### Cache Operations

```bash
# Check cache status
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli info

# Clear specific cache patterns
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli --scan --pattern "report:*" | xargs redis-cli del

# Monitor cache hit rate
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli info stats | grep hit_rate
```

#### Cache Warming

```bash
# Warm cache with common reports
curl -X POST https://api.pharma-care.com/api/reports/cache/warm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportTypes": ["patient-outcomes", "pharmacist-interventions"]}'
```

### 5. Background Job Management

#### Job Queue Monitoring

```bash
# Check job queue status
kubectl logs -l app=reports-job-processor -n pharma-care-prod --tail=100

# Monitor job processing rate
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli llen report_jobs_queue

# Check failed jobs
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli llen report_jobs_failed
```

#### Job Queue Management

```bash
# Retry failed jobs
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli eval "
  local failed = redis.call('lrange', 'report_jobs_failed', 0, -1)
  for i, job in ipairs(failed) do
    redis.call('lpush', 'report_jobs_queue', job)
  end
  redis.call('del', 'report_jobs_failed')
  return #failed
" 0

# Clear stuck jobs (use with caution)
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli del report_jobs_processing
```

### 6. Database Maintenance

#### Index Optimization

```bash
# Check index usage
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo pharma_care_prod --eval "
  db.reporttemplates.getIndexes();
  db.reportschedules.getIndexes();
  db.reportauditlogs.getIndexes();
"

# Rebuild indexes if needed
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo pharma_care_prod --eval "
  db.reportauditlogs.reIndex();
"
```

#### Data Cleanup

```bash
# Clean old audit logs (older than 1 year)
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo pharma_care_prod --eval "
  var cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  db.reportauditlogs.deleteMany({createdAt: {\$lt: cutoffDate}});
"

# Clean expired export files
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo pharma_care_prod --eval "
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  db.reportexports.deleteMany({
    status: 'completed',
    createdAt: {\$lt: cutoffDate}
  });
"
```

### 7. Security Operations

#### Access Monitoring

```bash
# Check for unauthorized access attempts
kubectl logs -l app=pharma-care-backend -n pharma-care-prod | grep "Unauthorized report access"

# Monitor suspicious activity
kubectl exec -it monitoring-prometheus-0 -n monitoring -- \
  promtool query instant 'rate(report_access_unauthorized_total[5m])'
```

#### Security Audits

```bash
# Generate security audit report
curl -X POST https://api.pharma-care.com/api/reports/security-audit \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRange": {"startDate": "2024-01-01", "endDate": "2024-01-31"}}'
```

### 8. Backup and Recovery

#### Backup Procedures

```bash
# Backup report templates and schedules
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongodump \
  --db pharma_care_prod \
  --collection reporttemplates \
  --collection reportschedules \
  --collection reportauditlogs \
  --out /backup/reports-$(date +%Y%m%d-%H%M%S)

# Backup Redis cache (if needed)
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli bgsave
```

#### Recovery Procedures

```bash
# Restore from backup
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongorestore \
  --db pharma_care_prod \
  --collection reporttemplates \
  /backup/reports-20240101-120000/pharma_care_prod/reporttemplates.bson
```

## Troubleshooting Guide

### Common Issues

#### 1. Report Generation Timeouts

**Symptoms**: Reports taking longer than 30 seconds to generate
**Diagnosis**:

```bash
# Check database performance
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo pharma_care_prod --eval "
  db.currentOp({'ns': /pharma_care_prod/, 'secs_running': {\$gt: 10}})
"

# Check for slow queries
kubectl logs -l app=pharma-care-backend -n pharma-care-prod | grep "Slow query"
```

**Resolution**:

- Add database indexes for frequently queried fields
- Optimize aggregation pipelines
- Increase timeout limits if necessary

#### 2. Export Queue Backlog

**Symptoms**: Export jobs accumulating in queue
**Diagnosis**:

```bash
# Check queue size
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli llen report_jobs_queue

# Check processor status
kubectl get pods -l app=reports-job-processor -n pharma-care-prod
```

**Resolution**:

- Scale up job processors
- Check for stuck jobs and clear them
- Investigate job failures

#### 3. High Memory Usage

**Symptoms**: Memory usage above 80%
**Diagnosis**:

```bash
# Check memory usage by pod
kubectl top pods -l app=pharma-care-backend -n pharma-care-prod

# Check for memory leaks
kubectl logs -l app=pharma-care-backend -n pharma-care-prod | grep "Memory"
```

**Resolution**:

- Restart affected pods
- Increase memory limits
- Investigate memory leaks in code

#### 4. Cache Miss Rate High

**Symptoms**: Cache hit rate below 50%
**Diagnosis**:

```bash
# Check cache statistics
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli info stats

# Check cache key patterns
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli --scan --pattern "*" | head -20
```

**Resolution**:

- Adjust cache TTL settings
- Implement cache warming strategies
- Review cache key patterns

## Emergency Procedures

### 1. Service Outage

1. Check service health endpoints
2. Review recent deployments
3. Check resource utilization
4. Scale up if needed
5. Initiate rollback if necessary

### 2. Data Corruption

1. Stop all write operations
2. Assess extent of corruption
3. Restore from latest backup
4. Verify data integrity
5. Resume operations

### 3. Security Incident

1. Isolate affected systems
2. Preserve logs and evidence
3. Notify security team
4. Implement containment measures
5. Conduct forensic analysis

## Maintenance Windows

### Weekly Maintenance

- Review performance metrics
- Clean up old logs and exports
- Update monitoring dashboards
- Check backup integrity

### Monthly Maintenance

- Database index optimization
- Security audit review
- Capacity planning review
- Update documentation

### Quarterly Maintenance

- Full system backup
- Disaster recovery testing
- Performance benchmarking
- Security penetration testing

## Contact Information

### On-Call Rotation

- **Primary**: DevOps Engineer (+1-XXX-XXX-XXXX)
- **Secondary**: Backend Developer (+1-XXX-XXX-XXXX)
- **Escalation**: Engineering Manager (+1-XXX-XXX-XXXX)

### Vendor Contacts

- **MongoDB Support**: support@mongodb.com
- **Redis Support**: support@redis.com
- **AWS Support**: (if using AWS services)

---

**Last Updated**: $(date)
**Version**: 1.0
**Next Review**: $(date -d "+3 months")
