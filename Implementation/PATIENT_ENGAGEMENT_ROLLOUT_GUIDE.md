# Patient Engagement Gradual Rollout Guide

This guide provides comprehensive instructions for managing the gradual rollout of the Patient Engagement & Follow-up Management module.

## Overview

The Patient Engagement module rollout follows a 4-week gradual deployment strategy:

- **Week 1**: 10% of eligible workspaces
- **Week 2**: 25% of eligible workspaces  
- **Week 3**: 50% of eligible workspaces
- **Week 4**: 100% of eligible workspaces

## Prerequisites

1. **Database Connection**: Ensure MongoDB connection is configured
2. **Feature Flags**: Patient engagement feature flags must be created
3. **Monitoring**: Set up monitoring and alerting systems
4. **Rollback Plan**: Have rollback procedures ready

## Quick Start

### 1. Initial Setup

```bash
# Set up patient engagement feature flags
npm run patient-engagement:setup

# Check current rollout status
npm run rollout status
```

### 2. Execute Rollout Phases

```bash
# Week 1: 10% rollout
npm run rollout phase 1 admin@pharmacy.com

# Week 2: 25% rollout (after monitoring Week 1)
npm run rollout phase 2 admin@pharmacy.com

# Week 3: 50% rollout (after monitoring Week 2)
npm run rollout phase 3 admin@pharmacy.com

# Week 4: 100% rollout (after monitoring Week 3)
npm run rollout phase 4 admin@pharmacy.com
```

### 3. Continuous Monitoring

```bash
# Check rollout health (run every hour during rollout)
npm run monitor-rollout

# Get detailed status
npm run rollout status

# Generate comprehensive report
npm run rollout report
```

## Detailed Commands

### Setup Commands

```bash
# Initialize patient engagement feature flags
npm run patient-engagement:setup
```

### Rollout Management Commands

```bash
# Show current rollout status
npm run rollout status

# Execute specific rollout phase (1-4)
npm run rollout phase <1-4> [updatedBy]

# Set rollout to specific percentage
npm run rollout set <0-100> [updatedBy]

# Pause rollout (emergency stop)
npm run rollout pause [reason] [updatedBy]

# Resume rollout at specific percentage
npm run rollout resume <0-100> [updatedBy]

# Generate detailed rollout report
npm run rollout report
```

### Monitoring Commands

```bash
# Perform full monitoring check
npm run monitor-rollout

# Show health score only
npm run monitor-rollout health

# Show alerts only
npm run monitor-rollout alerts
```

## Rollout Phases

### Phase 1: Initial Rollout (Week 1)
- **Target**: 10% of eligible workspaces
- **Monitoring**: Every 2 hours for first 48 hours
- **Error Threshold**: 2%
- **Success Criteria**: 
  - Error rate < 2%
  - Adoption rate > 30%
  - No critical issues

```bash
npm run rollout phase 1 admin@pharmacy.com
```

### Phase 2: Expanded Rollout (Week 2)
- **Target**: 25% of eligible workspaces
- **Monitoring**: Every 4 hours for 24 hours
- **Error Threshold**: 3%
- **Success Criteria**:
  - Error rate < 3%
  - Adoption rate > 40%
  - Positive user feedback

```bash
npm run rollout phase 2 admin@pharmacy.com
```

### Phase 3: Scale Rollout (Week 3)
- **Target**: 50% of eligible workspaces
- **Monitoring**: Every 6 hours for 12 hours
- **Error Threshold**: 5%
- **Success Criteria**:
  - Error rate < 5%
  - Adoption rate > 50%
  - System stability maintained

```bash
npm run rollout phase 3 admin@pharmacy.com
```

### Phase 4: Complete Rollout (Week 4)
- **Target**: 100% of eligible workspaces
- **Monitoring**: Every 8 hours for 6 hours
- **Error Threshold**: 5%
- **Success Criteria**:
  - Error rate < 5%
  - Adoption rate > 60%
  - Full feature availability

```bash
npm run rollout phase 4 admin@pharmacy.com
```

## Monitoring and Alerts

### Health Score Calculation

The system calculates a health score (0-100) based on:
- **Error Rate** (0-30 point deduction)
- **Adoption Rate** (0-25 point deduction)
- **Critical Issues** (20 points per issue)
- **High Priority Issues** (10 points per issue)

### Alert Levels

- **🔴 Critical (90-100)**: Immediate action required, consider rollback
- **🟠 Error (70-89)**: High priority, investigate within 2 hours
- **🟡 Warning (50-69)**: Monitor closely, investigate within 8 hours
- **🔵 Info (0-49)**: Informational, no immediate action needed

### Automated Monitoring

Set up a cron job to run monitoring every hour during rollout:

```bash
# Add to crontab
0 * * * * cd /path/to/backend && npm run monitor-rollout >> /var/log/rollout-monitor.log 2>&1
```

## Emergency Procedures

### Pause Rollout

If critical issues are detected:

```bash
# Immediate pause
npm run rollout pause "Critical error rate detected" admin@pharmacy.com

# Check status
npm run rollout status
```

### Rollback Procedure

1. **Pause rollout** to prevent new workspaces from being enabled
2. **Investigate issues** using logs and monitoring data
3. **Fix critical issues** in the codebase
4. **Test fixes** in staging environment
5. **Resume rollout** at appropriate percentage

```bash
# Step 1: Pause
npm run rollout pause "Investigating critical issues" admin@pharmacy.com

# Step 2-4: Fix issues (manual process)

# Step 5: Resume at lower percentage
npm run rollout resume 15 admin@pharmacy.com
```

### Complete Rollback (Nuclear Option)

If severe issues require complete rollback:

```bash
# Disable all patient engagement features
npm run rollout set 0 admin@pharmacy.com

# Verify rollback
npm run rollout status
```

## Metrics and KPIs

### Key Metrics to Monitor

1. **Error Rate**: < 5% (target < 2%)
2. **Adoption Rate**: > 60% (target > 70%)
3. **Daily Active Users**: Track engagement
4. **Appointments Created**: Feature usage
5. **Follow-ups Completed**: Feature effectiveness

### Success Criteria

- ✅ Error rate consistently below 2%
- ✅ Adoption rate above 70%
- ✅ No critical unresolved issues
- ✅ Positive user feedback
- ✅ System performance maintained

## Troubleshooting

### Common Issues

#### High Error Rate
```bash
# Check detailed metrics
npm run rollout report

# Review application logs
tail -f /var/log/pharma-care-backend.log

# Check database performance
npm run db:health-check
```

#### Low Adoption Rate
```bash
# Check user feedback
npm run rollout report

# Review feature flag configuration
npm run feature-flags:status

# Analyze user behavior
npm run monitor-rollout alerts
```

#### System Performance Issues
```bash
# Check system health
npm run monitor-rollout health

# Review database performance
npm run db:performance:check

# Check cache performance
npm run cache:init
```

### Getting Help

1. **Check logs**: Application and rollout logs
2. **Review metrics**: Use monitoring dashboard
3. **Contact team**: Escalate to development team
4. **Emergency contact**: For critical issues

## Best Practices

### Before Each Phase
1. ✅ Review previous phase metrics
2. ✅ Check system health
3. ✅ Verify monitoring is working
4. ✅ Prepare rollback plan
5. ✅ Notify stakeholders

### During Rollout
1. 📊 Monitor metrics continuously
2. 🔍 Watch for alerts
3. 📞 Stay available for issues
4. 📝 Document any problems
5. 🚨 Be ready to pause if needed

### After Each Phase
1. 📈 Analyze performance data
2. 📋 Generate rollout report
3. 💬 Collect user feedback
4. 🔧 Address any issues
5. ✅ Approve next phase

## Automation

### Scheduled Monitoring

Create a monitoring script that runs every hour:

```bash
#!/bin/bash
# /usr/local/bin/monitor-patient-engagement-rollout.sh

cd /path/to/backend
npm run monitor-rollout > /tmp/rollout-check.log 2>&1

# Check exit code
if [ $? -ne 0 ]; then
    # Send alert (customize for your alerting system)
    echo "Patient Engagement rollout monitoring failed" | mail -s "Rollout Alert" admin@pharmacy.com
fi
```

### Automated Rollout (Advanced)

For fully automated rollout with safety checks:

```bash
#!/bin/bash
# /usr/local/bin/auto-rollout-patient-engagement.sh

PHASE=$1
ADMIN_EMAIL="admin@pharmacy.com"

# Check health before proceeding
npm run monitor-rollout health
if [ $? -ne 0 ]; then
    echo "Health check failed, aborting rollout"
    exit 1
fi

# Execute phase
npm run rollout phase $PHASE $ADMIN_EMAIL

# Monitor for 2 hours
sleep 7200

# Check health after rollout
npm run monitor-rollout health
if [ $? -ne 0 ]; then
    echo "Post-rollout health check failed, consider rollback"
    npm run rollout pause "Automated health check failed" $ADMIN_EMAIL
fi
```

## Reporting

### Daily Rollout Report

Generate daily reports during rollout:

```bash
# Generate comprehensive report
npm run rollout report > daily-rollout-report-$(date +%Y%m%d).json

# Email report (customize for your system)
npm run rollout status | mail -s "Daily Rollout Status" stakeholders@pharmacy.com
```

### Weekly Summary

At the end of each week, generate a summary:

```bash
# Week summary
echo "Week $WEEK_NUMBER Rollout Summary" > week-$WEEK_NUMBER-summary.txt
npm run rollout report >> week-$WEEK_NUMBER-summary.txt
```

## Support and Escalation

### Contact Information

- **Development Team**: dev-team@pharmacy.com
- **DevOps Team**: devops@pharmacy.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

### Escalation Matrix

1. **Level 1**: Monitoring alerts → Development team
2. **Level 2**: Critical issues → DevOps team + Management
3. **Level 3**: System-wide impact → Emergency contact + All stakeholders

---

## Appendix

### Feature Flags

The following feature flags control patient engagement functionality:

- `patient_engagement_module`: Core module
- `appointment_scheduling`: Appointment system
- `followup_task_management`: Follow-up tasks
- `smart_reminder_system`: Reminders
- `patient_portal`: Patient self-service
- `recurring_appointments`: Recurring appointments
- `clinical_alerts`: Clinical alerts
- `engagement_analytics`: Analytics
- `schedule_management`: Schedule management
- `engagement_module_integration`: Module integration

### Eligible Workspaces

Workspaces are eligible for patient engagement if they have:
- Active subscription with tier: `professional`, `enterprise`, or `premium`
- Users with roles: `pharmacist`, `pharmacy_manager`, or `super_admin`
- Subscription status: `active` or `trial`

### Rollout Algorithm

The system uses consistent hashing to determine which workspaces are enabled:
1. Sort eligible workspaces by ID
2. Calculate target count based on percentage
3. Enable first N workspaces from sorted list
4. This ensures consistent rollout across restarts