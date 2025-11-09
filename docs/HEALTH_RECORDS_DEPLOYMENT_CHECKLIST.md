# Patient Health Records - Deployment Checklist

## Overview
This checklist ensures all components of the Patient Health Records system are properly configured, tested, and deployed to production.

---

## Pre-Deployment Checklist

### 1. Environment Setup

#### Backend Environment Variables
```bash
# Required Variables
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://[credentials]@[host]/pharma-care-production
JWT_SECRET=[secure-random-string-min-32-chars]
JWT_EXPIRE=24h

# Redis (for rate limiting)
REDIS_URL=redis://[credentials]@[host]:6379
REDIS_TLS_ENABLED=true

# Email Service (for notifications)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=[email-username]
EMAIL_PASSWORD=[email-password]
EMAIL_FROM=noreply@pharmacare.com

# Optional: SMS Service
SMS_ENABLED=false
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=[twilio-account-sid]
SMS_AUTH_TOKEN=[twilio-auth-token]
SMS_FROM_NUMBER=[phone-number]

# Feature Flags (default: disabled, enable via admin UI)
FEATURE_LAB_INTERPRETATIONS=false
FEATURE_VITALS_VERIFICATION=false
FEATURE_VISIT_SUMMARIES=false
FEATURE_HEALTH_NOTIFICATIONS=false

# File Upload Configuration
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

#### Frontend Environment Variables
```bash
# API Configuration
VITE_API_URL=https://api.pharmacare.com
VITE_API_VERSION=v1

# Environment
VITE_ENV=production

# Feature Flags (sync with backend)
VITE_FEATURE_LAB_INTERPRETATIONS=false
VITE_FEATURE_VITALS_VERIFICATION=false
VITE_FEATURE_VISIT_SUMMARIES=false
VITE_FEATURE_HEALTH_NOTIFICATIONS=false

# Analytics (optional)
VITE_GA_TRACKING_ID=[google-analytics-id]

# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=[sentry-dsn]
VITE_SENTRY_ENVIRONMENT=production
```

### 2. Database Setup

#### MongoDB Indexes

Run the following commands in MongoDB shell or via migration script:

```javascript
// DiagnosticCase Indexes
db.diagnosticcases.createIndex({ appointmentId: 1 });
db.diagnosticcases.createIndex({ patientId: 1, testDate: -1 });
db.diagnosticcases.createIndex({ workplaceId: 1, status: 1 });
db.diagnosticcases.createIndex({ 
  "patientInterpretation.isVisibleToPatient": 1, 
  "patientInterpretation.interpretedAt": -1 
});

// Patient Indexes (for vitals)
db.patients.createIndex({ "patientLoggedVitals.recordedDate": -1 });
db.patients.createIndex({ "patientLoggedVitals.isVerified": 1 });
db.patients.createIndex({ "patientLoggedVitals.appointmentId": 1 });

// Visit Indexes
db.visits.createIndex({ appointmentId: 1 });
db.visits.createIndex({ patientId: 1, visitDate: -1 });
db.visits.createIndex({ workplaceId: 1, visitDate: -1 });
db.visits.createIndex({ "patientSummary.visibleToPatient": 1 });

// Workplace Indexes
db.workplaces.createIndex({ 
  "healthRecordsFeatures.labInterpretations.enabled": 1 
});
db.workplaces.createIndex({ 
  "healthRecordsFeatures.vitalsVerification.enabled": 1 
});

// Notification Indexes
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });
db.notifications.createIndex({ workspaceId: 1, type: 1, createdAt: -1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL
```

#### Database Migrations

**Migration 1: Add appointmentId to existing records**
```javascript
// migration-001-add-appointment-id.js
// Run this migration before deploying

// Add appointmentId field to DiagnosticCase
db.diagnosticcases.updateMany(
  { appointmentId: { $exists: false } },
  { $set: { appointmentId: null } }
);

// Add appointmentId field to patient vitals
db.patients.updateMany(
  { },
  { 
    $set: { 
      "patientLoggedVitals.$[].appointmentId": null 
    } 
  }
);
```

**Migration 2: Add patient-friendly interpretation structure**
```javascript
// migration-002-add-interpretation-structure.js

db.diagnosticcases.updateMany(
  { "patientInterpretation": { $exists: false } },
  { 
    $set: { 
      patientInterpretation: {
        summary: "",
        detailedExplanation: "",
        keyFindings: [],
        recommendations: [],
        nextSteps: [],
        isVisibleToPatient: false,
        interpretedBy: null,
        interpretedByName: "",
        interpretedAt: null
      }
    } 
  }
);
```

**Migration 3: Add verification fields to vitals**
```javascript
// migration-003-add-vitals-verification.js

db.patients.find().forEach(function(patient) {
  if (patient.patientLoggedVitals && patient.patientLoggedVitals.length > 0) {
    patient.patientLoggedVitals.forEach(function(vital, index) {
      if (!vital.hasOwnProperty('isVerified')) {
        db.patients.updateOne(
          { _id: patient._id },
          { 
            $set: { 
              [`patientLoggedVitals.${index}.isVerified`]: false,
              [`patientLoggedVitals.${index}.verifiedBy`]: null,
              [`patientLoggedVitals.${index}.verifiedAt`]: null,
              [`patientLoggedVitals.${index}.verificationNotes`]: ""
            } 
          }
        );
      }
    });
  }
});
```

**Migration 4: Add visit summary structure**
```javascript
// migration-004-add-visit-summary.js

db.visits.updateMany(
  { "patientSummary": { $exists: false } },
  { 
    $set: { 
      patientSummary: {
        summary: "",
        keyPoints: [],
        nextSteps: [],
        visibleToPatient: false,
        createdBy: null,
        createdByName: "",
        createdAt: null,
        updatedAt: null
      }
    } 
  }
);
```

**Migration 5: Add workspace health records features**
```javascript
// migration-005-add-workspace-features.js

db.workplaces.updateMany(
  { "healthRecordsFeatures": { $exists: false } },
  { 
    $set: { 
      healthRecordsFeatures: {
        labInterpretations: {
          enabled: false,
          autoNotify: true,
          requireVerification: false,
          defaultVisibility: true
        },
        vitalsVerification: {
          enabled: false,
          autoVerifyNormal: false,
          verificationTimeframe: 24,
          criticalValueAlerts: true
        },
        visitSummaries: {
          enabled: false,
          mandatory: false,
          autoRelease: true
        },
        notifications: {
          enabled: false,
          email: true,
          sms: false,
          inApp: true
        }
      }
    } 
  }
);
```

### 3. Dependencies Installation

#### Backend Dependencies
```bash
cd backend
npm install

# Verify critical packages
npm list mongoose express-rate-limit nodemailer express-validator
```

#### Frontend Dependencies
```bash
cd frontend
npm install

# Verify critical packages
npm list @mui/material @mui/lab @emotion/react recharts
```

### 4. Build Verification

#### Backend Build
```bash
cd backend
npm run build

# Verify build output
ls -la dist/
# Should see compiled JavaScript files

# Run type check
npm run type-check
# Should complete with 0 errors
```

#### Frontend Build
```bash
cd frontend
npm run build

# Verify build output
ls -la dist/
# Should see index.html, assets/, etc.

# Check bundle size
du -sh dist/
# Should be < 5MB for optimal performance
```

---

## Deployment Steps

### Step 1: Database Preparation

**1.1 Backup Current Database**
```bash
mongodump --uri="mongodb://[credentials]@[host]/pharma-care-production" --out=backup-$(date +%Y%m%d)
```

**1.2 Run Migrations**
```bash
cd backend/scripts
node migration-001-add-appointment-id.js
node migration-002-add-interpretation-structure.js
node migration-003-add-vitals-verification.js
node migration-004-add-visit-summary.js
node migration-005-add-workspace-features.js
```

**1.3 Verify Migration Success**
```bash
# Check sample documents
mongo [connection-string] --eval "db.diagnosticcases.findOne()"
# Should have appointmentId and patientInterpretation fields

mongo [connection-string] --eval "db.patients.findOne().patientLoggedVitals[0]"
# Should have isVerified, verifiedBy fields

mongo [connection-string] --eval "db.visits.findOne()"
# Should have patientSummary field

mongo [connection-string] --eval "db.workplaces.findOne()"
# Should have healthRecordsFeatures field
```

**1.4 Create Indexes**
```bash
cd backend/scripts
node create-health-records-indexes.js
```

### Step 2: Backend Deployment

**2.1 Deploy Backend Code**
```bash
cd backend
npm run build
```

**2.2 Update Environment Variables**
```bash
# Copy .env.production to server
scp .env.production user@server:/app/backend/.env

# Or set via hosting platform (Heroku, AWS, etc.)
```

**2.3 Start Backend Server**
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js --env production
pm2 save

# Or using systemd
systemctl restart pharma-care-backend
```

**2.4 Verify Backend Health**
```bash
curl https://api.pharmacare.com/health
# Expected: { "status": "ok", "timestamp": "..." }

curl https://api.pharmacare.com/api/appointments/health-records-test
# Should return 401 (auth required) - confirms routes are registered
```

### Step 3: Frontend Deployment

**3.1 Build Frontend**
```bash
cd frontend
npm run build
```

**3.2 Deploy to CDN/Hosting**
```bash
# AWS S3 + CloudFront
aws s3 sync dist/ s3://pharma-care-frontend/
aws cloudfront create-invalidation --distribution-id [ID] --paths "/*"

# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

**3.3 Verify Frontend**
```bash
# Open browser and check
# https://app.pharmacare.com

# Verify API connectivity
# Open browser console, should see successful API calls
```

### Step 4: Feature Rollout

**4.1 Enable Features Gradually**

**Phase 1: Week 1 - Lab Interpretations Only**
```bash
# In super admin UI or via API:
PATCH /api/super-admin/workspaces/[workspace-id]/features
{
  "healthRecordsFeatures": {
    "labInterpretations": { "enabled": true }
  }
}

# Start with 1-2 pilot workspaces
```

**Phase 2: Week 2 - Add Vitals Verification**
```bash
# Enable for pilot workspaces
PATCH /api/super-admin/workspaces/[workspace-id]/features
{
  "healthRecordsFeatures": {
    "labInterpretations": { "enabled": true },
    "vitalsVerification": { "enabled": true }
  }
}
```

**Phase 3: Week 3 - Add Visit Summaries**
```bash
# Enable for pilot workspaces
PATCH /api/super-admin/workspaces/[workspace-id]/features
{
  "healthRecordsFeatures": {
    "labInterpretations": { "enabled": true },
    "vitalsVerification": { "enabled": true },
    "visitSummaries": { "enabled": true }
  }
}
```

**Phase 4: Week 4 - Enable Notifications**
```bash
# Enable all features
PATCH /api/super-admin/workspaces/[workspace-id]/features
{
  "healthRecordsFeatures": {
    "labInterpretations": { "enabled": true },
    "vitalsVerification": { "enabled": true },
    "visitSummaries": { "enabled": true },
    "notifications": { "enabled": true }
  }
}
```

**Phase 5: Month 2 - Gradual Rollout to All Workspaces**
- Enable for 25% of workspaces per week
- Monitor performance and feedback
- Address issues before next batch
- Complete rollout by end of month 2

### Step 5: Monitoring Setup

**5.1 Application Monitoring**

**Configure Logging:**
```javascript
// backend/src/utils/logger.ts
// Already configured, verify log files are being written
tail -f logs/combined.log
tail -f logs/error.log
```

**Set Up Error Tracking (Sentry):**
```bash
# Backend
npm install @sentry/node

# Add to backend/src/app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

# Frontend - already configured in vite.config.ts
```

**5.2 Performance Monitoring**

**Key Metrics to Track:**
- API response times (target: < 500ms p95)
- Database query times (target: < 200ms average)
- Error rates (target: < 0.1%)
- Rate limit hits
- Cache hit rates

**Set Up Alerts:**
```yaml
# Example: New Relic / DataDog alerts
alerts:
  - name: "High API Latency"
    condition: "p95 response time > 1000ms"
    action: "notify-on-call"
  
  - name: "High Error Rate"
    condition: "error rate > 1%"
    action: "page-on-call"
  
  - name: "Database Slow Queries"
    condition: "query time > 1000ms"
    action: "notify-team"
```

**5.3 Health Checks**

**Create Health Check Script:**
```bash
#!/bin/bash
# scripts/health-check.sh

# Check backend health
curl -f https://api.pharmacare.com/health || exit 1

# Check database connectivity
curl -f https://api.pharmacare.com/health/db || exit 1

# Check Redis connectivity
curl -f https://api.pharmacare.com/health/redis || exit 1

echo "All health checks passed"
```

**Schedule Health Checks:**
```bash
# crontab -e
*/5 * * * * /path/to/scripts/health-check.sh || /path/to/scripts/alert-on-call.sh
```

### Step 6: Documentation Deployment

**6.1 Update Public Documentation**
```bash
# Copy docs to documentation site
cp docs/HEALTH_RECORDS_USER_GUIDES.md /path/to/docs-site/user-guides/
cp docs/HEALTH_RECORDS_API.md /path/to/docs-site/api-reference/

# Generate API docs (if using tool like Swagger UI)
npm run generate-api-docs
cp api-docs.json /path/to/swagger-ui/
```

**6.2 Internal Knowledge Base**
- Upload training videos
- Create FAQ document
- Set up internal support portal
- Add troubleshooting guides

---

## Post-Deployment Verification

### 1. Functional Testing

**Test Lab Interpretations:**
```bash
# 1. Login as pharmacist
# 2. Navigate to Lab Interpretations dashboard
# 3. Click on a pending lab result
# 4. Add interpretation
# 5. Verify patient can see it
# 6. Test visibility toggle
```

**Test Vitals Verification:**
```bash
# 1. Login as patient
# 2. Log vital signs
# 3. Login as pharmacist
# 4. Verify the vitals
# 5. Verify patient sees verified status
# 6. Test bulk verification
```

**Test Visit Summaries:**
```bash
# 1. Login as pharmacist
# 2. Create visit record
# 3. Add patient summary
# 4. Login as patient
# 5. Verify summary is visible
# 6. Test download PDF
```

**Test Appointment Integration:**
```bash
# 1. Create appointment
# 2. Add lab result with appointmentId
# 3. Log vitals with appointmentId
# 4. Create visit with appointmentId
# 5. View appointment health records
# 6. Verify timeline is correct
```

**Test Super Admin Analytics:**
```bash
# 1. Login as super admin
# 2. Navigate to Health Records Analytics
# 3. Verify data loads for all workspaces
# 4. Test workspace filtering
# 5. Test global search
# 6. Export data (JSON)
```

### 2. Performance Testing

**Load Testing:**
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://api.pharmacare.com/api/pharmacist/lab-interpretation/pending

# Using Artillery
artillery quick --count 100 --num 10 https://api.pharmacare.com/api/pharmacist/vitals/unverified
```

**Target Performance:**
- Lab interpretation list: < 500ms
- Vitals verification: < 300ms
- Appointment health records: < 800ms
- Super admin analytics: < 2s

### 3. Security Testing

**Authentication:**
```bash
# Test endpoints without auth - should return 401
curl https://api.pharmacare.com/api/pharmacist/lab-interpretation/pending
# Expected: 401 Unauthorized

# Test with valid token
curl -H "Authorization: Bearer [token]" https://api.pharmacare.com/api/pharmacist/lab-interpretation/pending
# Expected: 200 OK
```

**Authorization:**
```bash
# Test patient accessing pharmacist endpoint - should return 403
# Login as patient, get token
curl -H "Authorization: Bearer [patient-token]" https://api.pharmacare.com/api/pharmacist/lab-interpretation/pending
# Expected: 403 Forbidden
```

**Rate Limiting:**
```bash
# Send 101 requests in rapid succession
for i in {1..101}; do
  curl -H "Authorization: Bearer [token]" https://api.pharmacare.com/api/pharmacist/vitals/unverified
done
# Expected: 101st request returns 429 Too Many Requests
```

### 4. Accessibility Testing

**Keyboard Navigation:**
- Tab through all forms
- Verify focus indicators are visible
- Test keyboard shortcuts
- Verify screen reader announcements

**Screen Reader Testing:**
- Test with NVDA (Windows) or VoiceOver (Mac)
- Verify all content is accessible
- Check ARIA labels and roles
- Test dynamic content announcements

**Color Contrast:**
```bash
# Run automated accessibility tests
npm run test:a11y

# Manual check with tools
# - Chrome DevTools Lighthouse
# - axe DevTools extension
```

### 5. Browser Compatibility

**Test in Multiple Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Known Issues:**
- MUI v7 Grid warnings (cosmetic, no runtime impact)
- Timeline component requires @mui/lab (ensure included)

---

## Rollback Procedures

### When to Rollback

**Critical Issues:**
- Data corruption
- Security vulnerability discovered
- System-wide crashes
- Data loss

**Major Issues:**
- High error rates (> 5%)
- Severe performance degradation
- Critical features not working
- Authentication/authorization failures

### Rollback Steps

**1. Stop New Deployments**
```bash
# Pause any automated deployment pipelines
# Alert team that rollback is in progress
```

**2. Revert Frontend**
```bash
# Redeploy previous version
aws s3 sync s3://pharma-care-frontend-backup/ s3://pharma-care-frontend/
aws cloudfront create-invalidation --distribution-id [ID] --paths "/*"

# Or use hosting platform rollback
netlify rollback
vercel rollback
```

**3. Revert Backend**
```bash
# Using Git
cd backend
git revert HEAD
npm run build
pm2 restart pharma-care-backend

# Or redeploy previous version
git checkout [previous-commit-hash]
npm run build
pm2 restart pharma-care-backend
```

**4. Restore Database (if needed)**
```bash
# Only if database changes caused issues
# Stop application first
pm2 stop pharma-care-backend

# Restore from backup
mongorestore --uri="mongodb://[credentials]@[host]/pharma-care-production" backup-[date]/

# Restart application
pm2 start pharma-care-backend
```

**5. Verify Rollback Success**
```bash
# Check frontend version
curl https://app.pharmacare.com/version.txt

# Check backend version
curl https://api.pharmacare.com/health

# Run smoke tests
npm run test:smoke
```

**6. Disable Feature Flags**
```bash
# If issue is with specific feature, disable it
PATCH /api/super-admin/workspaces/all/features
{
  "healthRecordsFeatures": {
    "labInterpretations": { "enabled": false },
    "vitalsVerification": { "enabled": false },
    "visitSummaries": { "enabled": false }
  }
}
```

**7. Investigate Root Cause**
- Review error logs
- Analyze metrics during incident
- Identify fix required
- Plan re-deployment

---

## Monitoring and Maintenance

### Daily Checks

**Morning (9 AM):**
- [ ] Review overnight error logs
- [ ] Check system performance metrics
- [ ] Review queue sizes (pending interpretations, verifications, summaries)
- [ ] Check email delivery success rate
- [ ] Review patient feedback/complaints

**Evening (5 PM):**
- [ ] Review day's activity metrics
- [ ] Check for slow queries
- [ ] Review rate limiting hits
- [ ] Check disk space and database size
- [ ] Review backup success

### Weekly Maintenance

**Every Monday:**
- [ ] Generate weekly usage report
- [ ] Review top errors/issues
- [ ] Check feature adoption rates
- [ ] Review workspace health scores
- [ ] Identify underperforming workspaces
- [ ] Plan training/support interventions

### Monthly Maintenance

**First of Month:**
- [ ] Comprehensive system audit
- [ ] Review and rotate logs
- [ ] Update dependencies (security patches)
- [ ] Review and adjust rate limits
- [ ] Conduct security scan
- [ ] Generate executive summary report
- [ ] Plan next month's improvements

**Database Maintenance:**
```bash
# Archive old notifications (older than 30 days)
db.notifications.deleteMany({ 
  createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) } 
});

# Analyze and optimize indexes
db.diagnosticcases.stats();
db.visits.stats();
db.patients.stats();

# Compact database if needed
db.runCommand({ compact: "diagnosticcases" });
```

---

## Support Escalation

### Issue Severity Levels

**P0 - Critical:**
- System down
- Data loss
- Security breach
- Action: Page on-call engineer immediately

**P1 - High:**
- Major feature broken
- High error rates
- Performance severely degraded
- Action: Notify team, fix within 2 hours

**P2 - Medium:**
- Minor feature broken
- Moderate performance issues
- Non-critical bugs
- Action: Fix within 24 hours

**P3 - Low:**
- Cosmetic issues
- Enhancement requests
- Documentation updates
- Action: Fix in next sprint

### Contact Information

**Engineering Team:**
- Email: eng@pharmacare.com
- Slack: #pharma-care-eng
- On-call: PagerDuty rotation

**Product Team:**
- Email: product@pharmacare.com
- Slack: #pharma-care-product

**Support Team:**
- Email: support@pharmacare.com
- Slack: #pharma-care-support
- Phone: 1-800-PHARMA-CARE

---

## Success Criteria

### Launch Success Metrics (Week 1)

- [ ] Zero P0/P1 incidents
- [ ] < 0.5% error rate
- [ ] > 95% uptime
- [ ] API p95 latency < 1s
- [ ] All pilot workspaces enabled
- [ ] All pilot pharmacists trained
- [ ] > 80% pilot pharmacist adoption

### 30-Day Success Metrics

- [ ] 50% of workspaces using at least one feature
- [ ] > 500 lab interpretations created
- [ ] > 1000 vitals verified
- [ ] > 300 visit summaries created
- [ ] > 80% patient satisfaction
- [ ] < 0.1% error rate
- [ ] 99.9% uptime

### 90-Day Success Metrics

- [ ] 90% of workspaces using at least one feature
- [ ] 70% of workspaces using all features
- [ ] > 5000 lab interpretations
- [ ] > 10000 vitals verified
- [ ] > 3000 visit summaries
- [ ] > 85% patient satisfaction
- [ ] > 90% pharmacist satisfaction
- [ ] Measurable patient engagement improvement
- [ ] ROI positive

---

## Appendix

### A. Useful Commands

```bash
# Check backend logs
pm2 logs pharma-care-backend

# Restart backend
pm2 restart pharma-care-backend

# View database size
mongo [connection] --eval "db.stats()"

# Count documents
mongo [connection] --eval "db.diagnosticcases.count()"
mongo [connection] --eval "db.patients.aggregate([{$unwind:'$patientLoggedVitals'},{$count:'vitals'}])"

# Check Redis
redis-cli ping
redis-cli info stats

# Test email service
node backend/scripts/test-email.js

# Generate test data
node backend/scripts/seed-test-data.js
```

### B. Common Issues and Solutions

**Issue: High API latency**
- Solution: Check database indexes, review slow query logs, consider caching

**Issue: Email notifications not sent**
- Solution: Check SMTP configuration, verify email service credentials, check spam folder

**Issue: Rate limit hit frequently**
- Solution: Review rate limit configuration, check for legitimate high-traffic use cases

**Issue: Frontend not connecting to backend**
- Solution: Verify VITE_API_URL is correct, check CORS configuration, verify SSL certificates

### C. Reference Documentation

- [MongoDB Indexing Best Practices](https://docs.mongodb.com/manual/indexes/)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)
- [Material-UI v7 Migration Guide](https://mui.com/material-ui/migration/migration-v6/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

*Last Updated: November 9, 2024*  
*Version: 1.0.0*
*Prepared by: Engineering Team*
