# AI Diagnostics & Therapeutics Module - Rollback Procedures and Emergency Response

## Overview

This document outlines comprehensive rollback procedures and emergency response plans for the AI Diagnostics & Therapeutics module in production environments. These procedures ensure rapid recovery from deployment issues, service failures, or critical bugs.

## Emergency Contact Information

### Primary Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX (24/7)
- **DevOps Lead**: devops-lead@PharmacyCopilot.com
- **AI/ML Engineer**: ai-team@PharmacyCopilot.com
- **Security Team**: security@PharmacyCopilot.com
- **Clinical Team Lead**: clinical-lead@PharmacyCopilot.com

### Escalation Matrix

1. **Level 1** (0-15 minutes): On-call engineer
2. **Level 2** (15-30 minutes): DevOps lead + AI/ML engineer
3. **Level 3** (30+ minutes): CTO + Clinical director
4. **Level 4** (Critical patient safety): CEO + Chief Medical Officer

## Rollback Triggers

### Automatic Rollback Triggers

- Health check failures > 3 consecutive attempts
- Error rate > 5% for 2 minutes
- Response time > 30 seconds for 95th percentile
- Memory usage > 95% for 5 minutes
- AI service failure rate > 10%

### Manual Rollback Triggers

- Critical security vulnerability discovered
- Data corruption detected
- Patient safety concerns
- Regulatory compliance violations
- Unrecoverable service degradation

## Rollback Procedures

### 1. Application Code Rollback

#### Quick Rollback (< 5 minutes)

```bash
#!/bin/bash
# Emergency rollback script

set -e

echo "=== EMERGENCY ROLLBACK INITIATED ==="
echo "Timestamp: $(date)"
echo "Initiated by: ${USER}"

# Set variables
NAMESPACE="PharmacyCopilot-prod"
DEPLOYMENT="ai-diagnostics-api"
PREVIOUS_VERSION="${1:-previous}"

# Get current deployment info
echo "Current deployment status:"
kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} -o wide

# Rollback to previous version
echo "Rolling back to previous version..."
kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}

# Wait for rollback to complete
echo "Waiting for rollback to complete..."
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE} --timeout=300s

# Verify rollback
echo "Verifying rollback..."
kubectl get pods -n ${NAMESPACE} -l app=ai-diagnostics-api

# Health check
echo "Performing health check..."
for i in {1..10}; do
  if kubectl exec -n ${NAMESPACE} deployment/${DEPLOYMENT} -- curl -f http://localhost:5000/api/health; then
    echo "Health check passed"
    break
  else
    echo "Health check failed, attempt $i/10"
    sleep 10
  fi
done

echo "=== ROLLBACK COMPLETED ==="
```

#### Detailed Rollback Process

```bash
#!/bin/bash
# Comprehensive rollback procedure

# 1. Stop traffic to affected pods
kubectl patch service ai-diagnostics-api-service -n PharmacyCopilot-prod -p '{"spec":{"selector":{"version":"stable"}}}'

# 2. Scale down current deployment
kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=0

# 3. Rollback to previous version
kubectl rollout undo deployment/ai-diagnostics-api -n PharmacyCopilot-prod

# 4. Scale up previous version
kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=3

# 5. Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=ai-diagnostics-api -n PharmacyCopilot-prod --timeout=300s

# 6. Restore traffic
kubectl patch service ai-diagnostics-api-service -n PharmacyCopilot-prod -p '{"spec":{"selector":{"app":"ai-diagnostics-api"}}}'

# 7. Verify rollback
kubectl get pods -n PharmacyCopilot-prod -l app=ai-diagnostics-api
kubectl logs -n PharmacyCopilot-prod deployment/ai-diagnostics-api --tail=50
```

### 2. Database Rollback

#### Schema Rollback

```bash
#!/bin/bash
# Database schema rollback

set -e

ROLLBACK_VERSION="${1}"
BACKUP_FILE="${2}"

if [ -z "$ROLLBACK_VERSION" ] || [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <rollback_version> <backup_file>"
  exit 1
fi

echo "=== DATABASE ROLLBACK INITIATED ==="
echo "Target version: $ROLLBACK_VERSION"
echo "Backup file: $BACKUP_FILE"

# 1. Create emergency backup
echo "Creating emergency backup..."
mongodump --uri="$MONGODB_URI" --gzip --out="/tmp/emergency_backup_$(date +%Y%m%d_%H%M%S)"

# 2. Stop application
kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=0

# 3. Restore from backup
echo "Restoring from backup..."
mongorestore --uri="$MONGODB_URI" --drop --gzip --dir="$BACKUP_FILE"

# 4. Run migration rollback
echo "Rolling back migrations..."
npm run migration:down "$ROLLBACK_VERSION"

# 5. Verify database integrity
echo "Verifying database integrity..."
npm run migration:validate

# 6. Restart application
kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=3

echo "=== DATABASE ROLLBACK COMPLETED ==="
```

### 3. Feature Flag Emergency Disable

#### Disable AI Diagnostics Features

```bash
#!/bin/bash
# Emergency feature flag disable

echo "=== EMERGENCY FEATURE DISABLE ==="

# Disable AI diagnostics completely
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:set ai_diagnostics_enabled --enabled false

# Disable specific features
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:set lab_integration_enabled --enabled false

kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:set fhir_integration_enabled --enabled false

# Reduce rollout to 0%
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:set ai_diagnostics_rollout --percentage 0

# Verify changes
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:status

echo "=== FEATURE DISABLE COMPLETED ==="
```

## Emergency Response Procedures

### 1. Service Outage Response

#### Immediate Actions (0-5 minutes)

1. **Acknowledge the incident**

   ```bash
   # Update status page
   curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
     -H "Authorization: OAuth TOKEN" \
     -d "incident[name]=AI Diagnostics Service Degradation" \
     -d "incident[status]=investigating"
   ```

2. **Check service health**

   ```bash
   # Check pod status
   kubectl get pods -n PharmacyCopilot-prod -l app=ai-diagnostics-api

   # Check recent logs
   kubectl logs -n PharmacyCopilot-prod deployment/ai-diagnostics-api --tail=100

   # Check metrics
   curl -s http://prometheus:9090/api/v1/query?query=up{job="ai-diagnostics-api"}
   ```

3. **Initiate rollback if necessary**
   ```bash
   # Quick rollback
   ./scripts/emergency-rollback.sh
   ```

#### Investigation Actions (5-15 minutes)

1. **Gather diagnostic information**

   ```bash
   # Export logs
   kubectl logs -n PharmacyCopilot-prod deployment/ai-diagnostics-api --since=1h > /tmp/incident-logs.txt

   # Check resource usage
   kubectl top pods -n PharmacyCopilot-prod -l app=ai-diagnostics-api

   # Check external dependencies
   curl -f https://openrouter.ai/api/v1/health || echo "OpenRouter API down"
   curl -f https://rxnav.nlm.nih.gov/REST/version || echo "RxNorm API down"
   ```

2. **Check database connectivity**

   ```bash
   kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
     npm run db:health-check
   ```

3. **Verify network connectivity**
   ```bash
   kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
     nslookup mongodb-cluster
   ```

### 2. Data Corruption Response

#### Immediate Actions

1. **Stop all write operations**

   ```bash
   # Scale down to prevent further corruption
   kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=0

   # Enable read-only mode
   kubectl create configmap emergency-config -n PharmacyCopilot-prod \
     --from-literal=READ_ONLY_MODE=true
   ```

2. **Assess corruption scope**

   ```bash
   # Run data integrity checks
   kubectl run data-integrity-check -n PharmacyCopilot-prod --rm -i --tty \
     --image=mongo:7.0 -- bash -c "
     mongo '$MONGODB_URI' --eval '
       db.diagnosticrequests.find({createdAt: {\$gte: new Date(Date.now() - 24*60*60*1000)}}).count();
       db.diagnosticresults.find({createdAt: {\$gte: new Date(Date.now() - 24*60*60*1000)}}).count();
     '
   "
   ```

3. **Restore from backup**

   ```bash
   # Find latest clean backup
   aws s3 ls s3://PharmacyCopilot-backups-prod/mongodb-backups/ | tail -5

   # Initiate restore
   kubectl create job restore-from-backup -n PharmacyCopilot-prod \
     --from=cronjob/mongodb-backup \
     --dry-run=client -o yaml | \
     sed 's/mongodb-backup/disaster-recovery-restore/' | \
     kubectl apply -f -
   ```

### 3. Security Incident Response

#### Immediate Actions

1. **Isolate affected systems**

   ```bash
   # Apply network policy to block traffic
   kubectl apply -f - <<EOF
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: emergency-isolation
     namespace: PharmacyCopilot-prod
   spec:
     podSelector:
       matchLabels:
         app: ai-diagnostics-api
     policyTypes:
     - Ingress
     - Egress
     ingress: []
     egress: []
   EOF
   ```

2. **Preserve evidence**

   ```bash
   # Capture memory dumps
   kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
     kill -USR1 $(pgrep node)

   # Export all logs
   kubectl logs -n PharmacyCopilot-prod deployment/ai-diagnostics-api --all-containers=true > \
     /tmp/security-incident-logs-$(date +%Y%m%d_%H%M%S).txt
   ```

3. **Rotate credentials**

   ```bash
   # Generate new secrets
   kubectl create secret generic ai-diagnostics-secrets-new -n PharmacyCopilot-prod \
     --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
     --from-literal=OPENROUTER_API_KEY="new-api-key"

   # Update deployment
   kubectl patch deployment ai-diagnostics-api -n PharmacyCopilot-prod \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"ai-diagnostics-api","envFrom":[{"secretRef":{"name":"ai-diagnostics-secrets-new"}}]}]}}}}'
   ```

## Recovery Verification

### 1. Health Check Verification

```bash
#!/bin/bash
# Comprehensive health check after recovery

echo "=== POST-RECOVERY VERIFICATION ==="

# 1. Service health
echo "Checking service health..."
for endpoint in /api/health /api/health/database /api/health/redis /api/health/ai-services; do
  if curl -f "http://ai-diagnostics-api-service.PharmacyCopilot-prod.svc.cluster.local:80$endpoint"; then
    echo "✓ $endpoint - OK"
  else
    echo "✗ $endpoint - FAILED"
  fi
done

# 2. Database connectivity
echo "Checking database connectivity..."
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run db:health-check

# 3. External API connectivity
echo "Checking external APIs..."
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run external-apis:health-check

# 4. Feature flags
echo "Checking feature flags..."
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run feature-flags:status

# 5. Sample diagnostic request
echo "Testing diagnostic workflow..."
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run test:smoke:diagnostic-workflow

echo "=== VERIFICATION COMPLETED ==="
```

### 2. Performance Verification

```bash
#!/bin/bash
# Performance verification after recovery

echo "=== PERFORMANCE VERIFICATION ==="

# Check response times
echo "Checking response times..."
for i in {1..10}; do
  time curl -s http://ai-diagnostics-api-service.PharmacyCopilot-prod.svc.cluster.local:80/api/health > /dev/null
done

# Check resource usage
echo "Checking resource usage..."
kubectl top pods -n PharmacyCopilot-prod -l app=ai-diagnostics-api

# Check error rates
echo "Checking error rates..."
kubectl exec -n PharmacyCopilot-prod deployment/ai-diagnostics-api -- \
  npm run metrics:error-rate

echo "=== PERFORMANCE VERIFICATION COMPLETED ==="
```

## Post-Incident Procedures

### 1. Incident Documentation

```bash
#!/bin/bash
# Generate incident report

INCIDENT_ID="${1:-$(date +%Y%m%d_%H%M%S)}"
REPORT_FILE="/tmp/incident-report-${INCIDENT_ID}.md"

cat > "$REPORT_FILE" << EOF
# Incident Report - ${INCIDENT_ID}

## Summary
- **Incident ID**: ${INCIDENT_ID}
- **Date**: $(date)
- **Duration**: [TO BE FILLED]
- **Severity**: [TO BE FILLED]
- **Services Affected**: AI Diagnostics & Therapeutics Module

## Timeline
- **Detection**: [TO BE FILLED]
- **Response**: [TO BE FILLED]
- **Mitigation**: [TO BE FILLED]
- **Resolution**: [TO BE FILLED]

## Root Cause
[TO BE FILLED]

## Impact Assessment
- **Users Affected**: [TO BE FILLED]
- **Diagnostic Requests Lost**: [TO BE FILLED]
- **Revenue Impact**: [TO BE FILLED]

## Actions Taken
[TO BE FILLED]

## Lessons Learned
[TO BE FILLED]

## Action Items
[TO BE FILLED]
EOF

echo "Incident report template created: $REPORT_FILE"
```

### 2. System Hardening

After each incident, implement additional safeguards:

```bash
#!/bin/bash
# Post-incident hardening

# 1. Update monitoring thresholds
kubectl patch configmap prometheus-config -n monitoring --patch '
data:
  alert_rules.yml: |
    # Updated alert rules based on incident learnings
'

# 2. Implement additional circuit breakers
kubectl patch deployment ai-diagnostics-api -n PharmacyCopilot-prod --patch '
spec:
  template:
    spec:
      containers:
      - name: ai-diagnostics-api
        env:
        - name: CIRCUIT_BREAKER_ENABLED
          value: "true"
        - name: CIRCUIT_BREAKER_THRESHOLD
          value: "5"
'

# 3. Add chaos engineering tests
kubectl apply -f chaos-engineering/network-partition-test.yml
```

## Testing and Validation

### 1. Rollback Testing

```bash
#!/bin/bash
# Regular rollback testing (run monthly)

echo "=== ROLLBACK TESTING ==="

# 1. Deploy test version
kubectl set image deployment/ai-diagnostics-api -n PharmacyCopilot-staging \
  ai-diagnostics-api=PharmacyCopilot/ai-diagnostics-api:test-rollback

# 2. Verify deployment
kubectl rollout status deployment/ai-diagnostics-api -n PharmacyCopilot-staging

# 3. Perform rollback
kubectl rollout undo deployment/ai-diagnostics-api -n PharmacyCopilot-staging

# 4. Verify rollback
kubectl rollout status deployment/ai-diagnostics-api -n PharmacyCopilot-staging

# 5. Test functionality
npm run test:e2e:rollback-verification

echo "=== ROLLBACK TESTING COMPLETED ==="
```

### 2. Disaster Recovery Testing

```bash
#!/bin/bash
# Disaster recovery testing (run quarterly)

echo "=== DISASTER RECOVERY TESTING ==="

# 1. Create test backup
kubectl create job test-backup -n PharmacyCopilot-staging \
  --from=cronjob/mongodb-backup

# 2. Simulate data loss
kubectl exec -n PharmacyCopilot-staging deployment/mongodb -- \
  mongo --eval "db.diagnosticrequests.drop()"

# 3. Restore from backup
kubectl create job test-restore -n PharmacyCopilot-staging \
  --from=job/disaster-recovery-restore

# 4. Verify restoration
kubectl exec -n PharmacyCopilot-staging deployment/ai-diagnostics-api -- \
  npm run test:data-integrity

echo "=== DISASTER RECOVERY TESTING COMPLETED ==="
```

## Maintenance Windows

### Planned Maintenance Procedure

```bash
#!/bin/bash
# Planned maintenance window procedure

echo "=== PLANNED MAINTENANCE INITIATED ==="

# 1. Notify users
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -H "Authorization: OAuth TOKEN" \
  -d "incident[name]=Scheduled Maintenance" \
  -d "incident[status]=scheduled"

# 2. Enable maintenance mode
kubectl patch configmap ai-diagnostics-config -n PharmacyCopilot-prod \
  --patch '{"data":{"MAINTENANCE_MODE":"true"}}'

# 3. Drain traffic gradually
for i in {3..1}; do
  kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=$i
  sleep 30
done

# 4. Perform maintenance tasks
# [Maintenance tasks here]

# 5. Restore service
kubectl scale deployment ai-diagnostics-api -n PharmacyCopilot-prod --replicas=3
kubectl patch configmap ai-diagnostics-config -n PharmacyCopilot-prod \
  --patch '{"data":{"MAINTENANCE_MODE":"false"}}'

# 6. Update status
curl -X PATCH "https://api.statuspage.io/v1/pages/PAGE_ID/incidents/INCIDENT_ID" \
  -H "Authorization: OAuth TOKEN" \
  -d "incident[status]=resolved"

echo "=== PLANNED MAINTENANCE COMPLETED ==="
```

This comprehensive rollback and emergency response documentation ensures rapid recovery from any production issues while maintaining patient safety and data integrity.
