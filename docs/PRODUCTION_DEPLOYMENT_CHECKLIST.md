# Production Deployment Checklist - MUI to shadcn/ui Migration

## Overview

This checklist ensures a safe and successful deployment of the MUI to shadcn/ui migration to production. Follow each step carefully and verify completion before proceeding to the next phase.

## Pre-Deployment Phase

### Code Quality and Testing
- [ ] **All tests pass**: Unit, integration, and E2E tests complete successfully
- [ ] **Visual regression tests pass**: Screenshots match expected UI in both light and dark themes
- [ ] **Accessibility audit passes**: WCAG 2.1 AA compliance verified
- [ ] **Performance benchmarks met**: Bundle size, load times, and theme toggle performance within targets
- [ ] **Cross-browser testing complete**: Chrome, Firefox, Safari, Edge compatibility verified
- [ ] **Mobile responsiveness verified**: iOS and Android devices tested
- [ ] **TypeScript compilation clean**: No type errors or warnings
- [ ] **Linting passes**: ESLint and Prettier checks complete
- [ ] **Security scan complete**: No high or critical vulnerabilities detected

### Dependencies and Build
- [ ] **MUI dependencies removed**: All @mui packages uninstalled from package.json
- [ ] **shadcn/ui components installed**: All required components added and configured
- [ ] **Build optimization verified**: Bundle size meets performance targets
- [ ] **Tree shaking working**: Unused code properly eliminated
- [ ] **Source maps generated**: For production debugging if needed
- [ ] **Environment variables configured**: Production-specific settings applied

### Documentation and Communication
- [ ] **Migration documentation complete**: All guides and procedures documented
- [ ] **Rollback procedures tested**: Emergency rollback process verified
- [ ] **Team training complete**: All team members familiar with new components
- [ ] **Stakeholder approval obtained**: Business sign-off on migration
- [ ] **User communication prepared**: Notification templates ready if needed

## Deployment Phase

### Pre-Deployment Verification
- [ ] **Staging environment updated**: Latest code deployed and tested on staging
- [ ] **Database migrations complete**: Any required schema changes applied
- [ ] **CDN cache cleared**: Static assets cache invalidated
- [ ] **Monitoring systems ready**: Alerts and dashboards configured
- [ ] **Rollback plan activated**: Emergency procedures ready to execute

### Deployment Execution
- [ ] **Maintenance window scheduled**: Users notified of potential downtime
- [ ] **Backup created**: Full system backup completed
- [ ] **Feature flags configured**: Gradual rollout flags set if applicable
- [ ] **Load balancer updated**: Traffic routing configured
- [ ] **SSL certificates verified**: HTTPS working correctly
- [ ] **DNS propagation checked**: Domain resolution working

### Immediate Post-Deployment
- [ ] **Application starts successfully**: All services running
- [ ] **Health checks pass**: API endpoints responding correctly
- [ ] **Authentication working**: Login/logout functionality verified
- [ ] **Critical user flows tested**: Key application features working
- [ ] **Error rates normal**: No spike in application errors
- [ ] **Performance metrics normal**: Response times within expected range

## Post-Deployment Monitoring

### First Hour Monitoring
- [ ] **Error rate monitoring**: < 1% error rate maintained
- [ ] **Response time monitoring**: < 2s average response time
- [ ] **Memory usage monitoring**: Within normal operating range
- [ ] **CPU usage monitoring**: No sustained high CPU usage
- [ ] **Database performance**: Query times within normal range
- [ ] **User session monitoring**: Users able to complete workflows

### First 24 Hours Monitoring
- [ ] **User feedback monitoring**: No critical user-reported issues
- [ ] **Performance trends**: No degradation in key metrics
- [ ] **Browser compatibility**: No browser-specific issues reported
- [ ] **Mobile performance**: Mobile users experiencing normal performance
- [ ] **Accessibility compliance**: No accessibility regressions reported
- [ ] **SEO impact**: No negative impact on search rankings

### First Week Monitoring
- [ ] **Long-term performance**: Sustained performance improvements
- [ ] **User adoption**: Users adapting well to new interface
- [ ] **Bug reports**: No critical bugs related to migration
- [ ] **Performance optimization**: Identify areas for further improvement
- [ ] **Documentation updates**: Update docs based on production experience

## Monitoring and Alerting Setup

### Application Performance Monitoring
```javascript
// Performance monitoring configuration
const performanceConfig = {
  // Core Web Vitals thresholds
  coreWebVitals: {
    LCP: { warning: 2500, critical: 4000 }, // Largest Contentful Paint (ms)
    FID: { warning: 100, critical: 300 },   // First Input Delay (ms)
    CLS: { warning: 0.1, critical: 0.25 }   // Cumulative Layout Shift
  },
  
  // Application-specific metrics
  applicationMetrics: {
    pageLoadTime: { warning: 3000, critical: 5000 },
    themeToggleTime: { warning: 50, critical: 100 },
    apiResponseTime: { warning: 1000, critical: 2000 },
    errorRate: { warning: 1, critical: 5 }, // percentage
    memoryUsage: { warning: 80, critical: 95 } // percentage
  },
  
  // Business metrics
  businessMetrics: {
    conversionRate: { warning: -10, critical: -20 }, // percentage change
    bounceRate: { warning: 10, critical: 20 }, // percentage increase
    sessionDuration: { warning: -15, critical: -30 } // percentage change
  }
};
```

### Alert Configuration
```yaml
# alerts.yml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
    channels: ["slack", "email", "pagerduty"]
    
  - name: "Slow Page Load"
    condition: "page_load_time > 5s"
    duration: "10m"
    severity: "warning"
    channels: ["slack", "email"]
    
  - name: "Theme Toggle Performance"
    condition: "theme_toggle_time > 100ms"
    duration: "5m"
    severity: "warning"
    channels: ["slack"]
    
  - name: "Memory Usage High"
    condition: "memory_usage > 95%"
    duration: "15m"
    severity: "critical"
    channels: ["slack", "email", "pagerduty"]
    
  - name: "Bundle Size Increase"
    condition: "bundle_size > 2MB"
    duration: "1m"
    severity: "warning"
    channels: ["slack"]
```

### Dashboard Configuration
```json
{
  "dashboards": [
    {
      "name": "Migration Performance Dashboard",
      "panels": [
        {
          "title": "Page Load Times",
          "type": "graph",
          "metrics": ["page_load_time_p50", "page_load_time_p95", "page_load_time_p99"],
          "timeRange": "24h"
        },
        {
          "title": "Theme Toggle Performance",
          "type": "graph",
          "metrics": ["theme_toggle_time_avg", "theme_toggle_time_max"],
          "timeRange": "24h"
        },
        {
          "title": "Bundle Size Tracking",
          "type": "singlestat",
          "metrics": ["bundle_size_current", "bundle_size_change"],
          "timeRange": "7d"
        },
        {
          "title": "Error Rates",
          "type": "graph",
          "metrics": ["error_rate_total", "error_rate_by_component"],
          "timeRange": "24h"
        },
        {
          "title": "User Experience Metrics",
          "type": "table",
          "metrics": ["bounce_rate", "session_duration", "conversion_rate"],
          "timeRange": "7d"
        }
      ]
    }
  ]
}
```

## Rollback Triggers

### Automatic Rollback Conditions
- [ ] **Error rate > 10%** for more than 5 minutes
- [ ] **Page load time > 10s** for more than 10 minutes
- [ ] **Memory usage > 98%** for more than 5 minutes
- [ ] **Critical security vulnerability** detected
- [ ] **Complete service outage** lasting more than 2 minutes

### Manual Rollback Conditions
- [ ] **User complaints > 50** within first hour
- [ ] **Accessibility compliance failure** detected
- [ ] **Business metric degradation > 25%** within first day
- [ ] **Critical browser compatibility issue** affecting > 10% of users
- [ ] **Data integrity issues** detected

## Success Criteria

### Technical Success Metrics
- [ ] **Bundle size reduction**: ≥ 30% smaller than pre-migration
- [ ] **Theme toggle performance**: < 50ms average
- [ ] **Page load improvement**: ≥ 20% faster than pre-migration
- [ ] **Error rate**: < 1% for first 24 hours
- [ ] **Uptime**: > 99.9% for first week

### Business Success Metrics
- [ ] **User satisfaction**: No significant increase in support tickets
- [ ] **Conversion rate**: No decrease > 5% from baseline
- [ ] **Bounce rate**: No increase > 10% from baseline
- [ ] **Session duration**: No decrease > 15% from baseline
- [ ] **Accessibility compliance**: Maintain or improve current scores

### User Experience Success Metrics
- [ ] **Theme usage**: Users actively using light/dark mode toggle
- [ ] **Mobile performance**: No increase in mobile bounce rate
- [ ] **Browser compatibility**: < 1% browser-specific error reports
- [ ] **Accessibility**: No accessibility-related user complaints
- [ ] **Performance perception**: Positive user feedback on speed

## Emergency Procedures

### Emergency Contact List
```
Primary Contacts:
- Lead Developer: [NAME] - [PHONE] - [EMAIL]
- DevOps Engineer: [NAME] - [PHONE] - [EMAIL]
- Product Manager: [NAME] - [PHONE] - [EMAIL]

Secondary Contacts:
- CTO: [NAME] - [PHONE] - [EMAIL]
- Customer Support Lead: [NAME] - [PHONE] - [EMAIL]
- Infrastructure Team: [EMAIL] - [SLACK_CHANNEL]

External Contacts:
- Hosting Provider: [CONTACT_INFO]
- CDN Provider: [CONTACT_INFO]
- Monitoring Service: [CONTACT_INFO]
```

### Emergency Response Procedures
1. **Immediate Response** (0-15 minutes)
   - Assess severity and impact
   - Notify primary contacts
   - Begin initial troubleshooting

2. **Escalation** (15-30 minutes)
   - If issue not resolved, escalate to secondary contacts
   - Consider rollback if critical
   - Update status page

3. **Communication** (30+ minutes)
   - Regular updates to stakeholders
   - User communication if needed
   - Document incident for post-mortem

### Rollback Execution
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# 1. Switch to rollback branch
git checkout production-rollback-branch

# 2. Restore dependencies
cd frontend
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# 3. Build and deploy
npm run build
npm run deploy:production

# 4. Verify rollback
curl -f https://app.pharmacare.com/health || exit 1

echo "✅ Emergency rollback completed"
echo "Next steps: Monitor application and investigate root cause"
```

## Post-Deployment Tasks

### Immediate Tasks (Day 1)
- [ ] **Monitor all alerts**: Ensure no critical issues
- [ ] **Review performance metrics**: Verify improvements are realized
- [ ] **Check user feedback**: Monitor support channels
- [ ] **Validate functionality**: Test critical user workflows
- [ ] **Document any issues**: Create tickets for minor issues found

### Short-term Tasks (Week 1)
- [ ] **Performance optimization**: Address any performance issues found
- [ ] **Bug fixes**: Resolve any migration-related bugs
- [ ] **Documentation updates**: Update docs based on production experience
- [ ] **Team retrospective**: Gather feedback on migration process
- [ ] **Stakeholder update**: Report on migration success and metrics

### Long-term Tasks (Month 1)
- [ ] **Performance analysis**: Comprehensive analysis of performance improvements
- [ ] **User feedback analysis**: Analyze user satisfaction and adoption
- [ ] **Cost analysis**: Calculate infrastructure cost savings
- [ ] **Lessons learned**: Document lessons for future migrations
- [ ] **Process improvements**: Update deployment processes based on experience

## Validation Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "🔍 Running post-deployment health checks..."

# Check application health
curl -f https://app.pharmacare.com/api/health || exit 1
echo "✅ API health check passed"

# Check authentication
curl -f https://app.pharmacare.com/api/auth/status || exit 1
echo "✅ Authentication check passed"

# Check database connectivity
curl -f https://app.pharmacare.com/api/db/status || exit 1
echo "✅ Database connectivity check passed"

# Check theme toggle functionality
node scripts/test-theme-toggle.js || exit 1
echo "✅ Theme toggle check passed"

# Check bundle size
BUNDLE_SIZE=$(stat -c%s "dist/assets/index-*.js" | head -1)
MAX_SIZE=2000000  # 2MB
if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
    echo "❌ Bundle size too large: $BUNDLE_SIZE bytes"
    exit 1
fi
echo "✅ Bundle size check passed: $BUNDLE_SIZE bytes"

echo "🎉 All health checks passed!"
```

### Performance Validation Script
```javascript
// performance-validation.js
const puppeteer = require('puppeteer');

async function validatePerformance() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to application
  await page.goto('https://app.pharmacare.com');
  
  // Measure page load time
  const loadTime = await page.evaluate(() => {
    return performance.timing.loadEventEnd - performance.timing.navigationStart;
  });
  
  console.log(`Page load time: ${loadTime}ms`);
  
  // Test theme toggle performance
  const themeToggleTime = await page.evaluate(() => {
    const start = performance.now();
    document.documentElement.classList.toggle('dark');
    const end = performance.now();
    return end - start;
  });
  
  console.log(`Theme toggle time: ${themeToggleTime}ms`);
  
  // Validate performance thresholds
  const results = {
    pageLoad: loadTime < 3000,
    themeToggle: themeToggleTime < 50
  };
  
  await browser.close();
  
  if (Object.values(results).every(Boolean)) {
    console.log('✅ Performance validation passed');
    process.exit(0);
  } else {
    console.log('❌ Performance validation failed', results);
    process.exit(1);
  }
}

validatePerformance().catch(console.error);
```

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Rollback Plan Verified**: ___________
**Monitoring Configured**: ___________
**Success Criteria Met**: ___________

This checklist should be completed and signed off by the deployment team before considering the migration deployment successful.