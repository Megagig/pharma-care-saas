# Reports & Analytics Module - Rollback Procedures

## Overview

This document outlines the rollback procedures for the Reports & Analytics module in case of deployment issues or critical bugs in production.

## Rollback Triggers

### Automatic Rollback Triggers

- Health check failures for more than 5 minutes
- Error rate exceeding 5% for more than 2 minutes
- Memory usage exceeding 90% for more than 3 minutes
- Response time P95 exceeding 10 seconds for more than 3 minutes

### Manual Rollback Triggers

- Critical security vulnerability discovered
- Data corruption or integrity issues
- User-reported critical functionality failures
- Performance degradation affecting other modules

## Rollback Procedures

### 1. Immediate Rollback (Emergency)

#### Step 1: Disable New Report Generation

```bash
# Scale down report processors
kubectl scale deployment reports-job-processor --replicas=0 -n pharma-care-prod

# Update feature flag to disable reports module
kubectl patch configmap feature-flags -n pharma-care-prod -p '{"data":{"REPORTS_MODULE_ENABLED":"false"}}'
```

#### Step 2: Rollback Application Code

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/pharma-care-backend -n pharma-care-prod

# Verify rollback status
kubectl rollout status deployment/pharma-care-backend -n pharma-care-prod
```

#### Step 3: Rollback Database Changes (if applicable)

```bash
# Connect to database
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo

# Run rollback migration
use pharma_care_prod
db.runCommand({
  "eval": "load('/migrations/rollback/reports-analytics-rollback.js')"
})
```

### 2. Gradual Rollback (Planned)

#### Step 1: Reduce Traffic

```bash
# Scale down to single replica
kubectl scale deployment pharma-care-backend --replicas=1 -n pharma-care-prod

# Update ingress to route reports traffic to maintenance page
kubectl patch ingress pharma-care-ingress -n pharma-care-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "maintenance-service"}]'
```

#### Step 2: Backup Current State

```bash
# Backup report templates and schedules
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongodump \
  --db pharma_care_prod \
  --collection reporttemplates \
  --collection reportschedules \
  --out /backup/pre-rollback-$(date +%Y%m%d-%H%M%S)
```

#### Step 3: Execute Rollback

```bash
# Rollback application
kubectl set image deployment/pharma-care-backend backend=pharma-care-backend:previous-stable -n pharma-care-prod

# Wait for rollout to complete
kubectl rollout status deployment/pharma-care-backend -n pharma-care-prod
```

### 3. Database Rollback Scripts

#### Report Templates Rollback

```javascript
// reports-analytics-rollback.js
db.reporttemplates
  .find({ createdAt: { $gte: new Date('2024-01-01') } })
  .forEach(function (doc) {
    if (doc.version && doc.version >= 2.0) {
      // Remove new fields added in v2.0
      db.reporttemplates.updateOne(
        { _id: doc._id },
        {
          $unset: {
            advancedFilters: '',
            customChartTypes: '',
            templateInheritance: '',
          },
        }
      );
    }
  });

// Remove new report types if they exist
db.reporttemplates.deleteMany({
  reportType: {
    $in: ['advanced-analytics', 'predictive-insights', 'custom-dashboards'],
  },
});
```

#### Report Schedules Rollback

```javascript
// Remove advanced scheduling features
db.reportschedules.updateMany(
  { frequency: { $in: ['custom', 'conditional'] } },
  {
    $set: { frequency: 'weekly' },
    $unset: {
      customSchedule: '',
      conditionalTriggers: '',
      advancedDelivery: '',
    },
  }
);
```

## Verification Steps

### 1. Health Checks

```bash
# Check application health
curl -f http://pharma-care-backend-service/api/health

# Check database connectivity
kubectl exec -it mongodb-primary-0 -n pharma-care-prod -- mongo --eval "db.adminCommand('ping')"

# Check cache connectivity
kubectl exec -it reports-redis-cache-0 -n pharma-care-prod -- redis-cli ping
```

### 2. Functional Testing

```bash
# Test basic report generation
curl -X POST http://pharma-care-backend-service/api/reports/patient-outcomes \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRange": {"startDate": "2024-01-01", "endDate": "2024-01-31"}}'

# Test export functionality
curl -X POST http://pharma-care-backend-service/api/reports/export \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportType": "patient-outcomes", "format": "pdf"}'
```

### 3. Performance Verification

```bash
# Check response times
kubectl exec -it monitoring-prometheus-0 -n monitoring -- \
  promtool query instant 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'

# Check error rates
kubectl exec -it monitoring-prometheus-0 -n monitoring -- \
  promtool query instant 'rate(http_requests_total{status=~"5.."}[5m])'
```

## Post-Rollback Actions

### 1. Incident Documentation

- Document the root cause of the rollback
- Update incident response procedures
- Schedule post-mortem meeting
- Update monitoring and alerting rules

### 2. Communication

```bash
# Send notification to stakeholders
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -H 'Content-type: application/json' \
  -d '{
    "text": "Reports & Analytics module has been rolled back to previous version. All services are operational.",
    "channel": "#pharma-care-alerts"
  }'
```

### 3. Data Integrity Checks

```bash
# Run data integrity verification
kubectl create job --from=cronjob/data-integrity-check data-integrity-check-post-rollback -n pharma-care-prod

# Monitor job completion
kubectl logs job/data-integrity-check-post-rollback -n pharma-care-prod -f
```

## Recovery Planning

### 1. Fix Development

- Identify and fix the root cause
- Implement additional tests
- Update deployment procedures
- Enhance monitoring and alerting

### 2. Staged Re-deployment

- Deploy to staging environment
- Run comprehensive testing
- Gradual rollout with canary deployment
- Monitor metrics closely

### 3. Lessons Learned

- Update rollback procedures based on experience
- Improve automated testing
- Enhance monitoring coverage
- Update documentation

## Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **DevOps Lead**: +1-XXX-XXX-XXXX
- **Product Manager**: +1-XXX-XXX-XXXX
- **Database Administrator**: +1-XXX-XXX-XXXX

## Rollback Checklist

- [ ] Identify rollback trigger and severity
- [ ] Notify stakeholders
- [ ] Execute appropriate rollback procedure
- [ ] Verify system health and functionality
- [ ] Update monitoring dashboards
- [ ] Document incident and lessons learned
- [ ] Plan recovery and re-deployment strategy

---

**Last Updated**: $(date)
**Version**: 1.0
**Approved By**: DevOps Team Lead
