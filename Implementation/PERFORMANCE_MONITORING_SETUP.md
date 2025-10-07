# Performance Monitoring Setup Guide

## Overview

This guide provides step-by-step instructions for setting up comprehensive performance monitoring for the PharmacyCopilot application, including baseline measurement, continuous monitoring, and automated alerting.

## Prerequisites

- Node.js 18+ installed
- MongoDB running
- Redis running (optional, for caching)
- GitHub repository with Actions enabled
- Admin access to the application

## 1. Initial Setup

### Install Dependencies

```bash
# Frontend performance tools
cd frontend
npm install --save-dev @lhci/cli rollup-plugin-visualizer
npm install web-vitals

# Backend monitoring tools are already included
```

### Environment Variables

Add the following environment variables to your `.env` files:

```bash
# Backend (.env)
MEMORY_MONITORING_ENABLED=true
DATABASE_PROFILING_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true

# Frontend (.env)
VITE_ENABLE_WEB_VITALS=true
VITE_PERFORMANCE_MONITORING=true
```

## 2. Baseline Measurement

### Collect Initial Baseline

```bash
# Run the automated baseline collection
./scripts/collect-baseline.sh

# Review results
cd performance-baseline
ls -la

# Update baseline documentation
# Edit PERF_BASELINE.md with actual measurements from the results
```

### Manual Baseline Collection (with Authentication)

```bash
# Start the application
npm run dev

# In another terminal, get authentication token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email","password":"your-password"}' | \
  jq -r '.token')

# Collect authenticated metrics
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/latency > api-latency-baseline.json

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/profile > database-baseline.json
```

## 3. GitHub Actions Setup

### Lighthouse CI Configuration

The Lighthouse CI workflow is already configured in `.github/workflows/lighthouse-ci.yml`. To enable it:

1. **Create Lighthouse CI Project** (optional):
   ```bash
   # Install LHCI globally
   npm install -g @lhci/cli

   # Create project (optional, for result storage)
   lhci wizard
   ```

2. **Add GitHub Secrets** (if using LHCI server):
   - Go to GitHub repository → Settings → Secrets
   - Add `LHCI_GITHUB_APP_TOKEN` if using Lighthouse CI server

### Bundle Size Monitoring

The bundle size check workflow is configured in `.github/workflows/bundle-size-check.yml`. It will:
- Run on every PR and push to main
- Check bundle size budgets
- Comment on PRs with results
- Fail CI if budgets are exceeded

## 4. Web Vitals Monitoring

### Frontend Integration

Web Vitals monitoring is automatically enabled when the application starts. To customize:

```typescript
// In your main component or App.tsx
import { useWebVitals } from './hooks/useWebVitals';

const App = () => {
  const { metrics, budgetViolations } = useWebVitals({
    enabled: true,
    performanceBudgets: {
      FCP: 1800,
      LCP: 2500,
      CLS: 0.1,
      FID: 100,
      TTFB: 800,
    },
    onBudgetExceeded: (entry, budget) => {
      // Custom handling for budget violations
      console.warn(`Performance budget exceeded: ${entry.name}`);
    },
  });

  // Your app content
};
```

### Backend Data Collection

Web Vitals data is automatically collected via the `/api/analytics/web-vitals` endpoint. To view collected data:

```bash
# Get Web Vitals summary
curl http://localhost:5000/api/analytics/web-vitals/summary
```

## 5. API Latency Monitoring

### Automatic Collection

API latency is automatically measured for all endpoints via middleware. No additional setup required.

### View Latency Metrics

```bash
# Get overall latency stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/latency

# Get stats for specific endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/performance/latency?endpoint=/api/patients"
```

### Custom Latency Budgets

Update the latency tracker configuration in `backend/src/middlewares/latencyMeasurement.ts`:

```typescript
// Custom alert thresholds
const LATENCY_BUDGETS = {
  '/api/patients': 200,      // 200ms budget
  '/api/auth/login': 150,    // 150ms budget
  '/api/dashboard': 300,     // 300ms budget
};
```

## 6. Database Performance Monitoring

### Enable Database Profiling

```bash
# Enable profiling for operations slower than 100ms
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slowMs": 100}' \
  http://localhost:5000/api/admin/performance/database/profiling/enable
```

### Create Optimal Indexes

```bash
# Create recommended indexes for better performance
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/indexes/optimize
```

### Monitor Database Performance

```bash
# Get database performance profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/profile
```

## 7. Performance Dashboard

### Access the Dashboard

The performance dashboard is available at `/performance` (add this route to your application):

```typescript
// Add to your router
import PerformanceDashboard from './components/PerformanceDashboard';

// In your routes
<Route path="/performance" element={<PerformanceDashboard />} />
```

### Dashboard Features

- **Overview**: Key performance metrics at a glance
- **Web Vitals**: Real-time Core Web Vitals monitoring
- **Bundle Size**: Bundle analysis and optimization recommendations
- **API Latency**: Endpoint performance statistics
- **Database**: Database performance and slow query analysis

## 8. Automated Alerting

### Performance Budget Violations

Alerts are automatically triggered when:
- Lighthouse scores drop below thresholds
- Web Vitals exceed budgets
- Bundle size increases beyond limits
- API latency exceeds budgets
- Database queries become slow

### Alert Channels

Configure alert channels in your monitoring setup:

```typescript
// Example: Slack webhook integration
const sendSlackAlert = async (alert: PerformanceAlert) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Performance Alert: ${alert.message}`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Value', value: alert.value, short: true },
          { title: 'Budget', value: alert.budget, short: true },
          { title: 'URL', value: alert.url, short: false },
        ],
      }],
    }),
  });
};
```

## 9. Continuous Monitoring

### Daily Performance Reports

Set up a cron job or scheduled task to generate daily performance reports:

```bash
#!/bin/bash
# scripts/daily-performance-report.sh

echo "Generating daily performance report..."

# Collect current metrics
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/overview > daily-report.json

# Compare with baseline
node scripts/compare-with-baseline.js daily-report.json

# Send report via email/Slack
node scripts/send-performance-report.js daily-report.json
```

### Weekly Performance Review

Schedule weekly team reviews to:
- Analyze performance trends
- Review optimization opportunities
- Update performance budgets
- Plan optimization work

## 10. Performance Budget Management

### Current Budgets

Based on baseline measurements, the following budgets are set:

```javascript
const PERFORMANCE_BUDGETS = {
  lighthouse: {
    performance: 90,      // Desktop performance score
    accessibility: 90,
    bestPractices: 90,
    seo: 80,
  },
  webVitals: {
    FCP: 1800,           // First Contentful Paint (ms)
    LCP: 2500,           // Largest Contentful Paint (ms)
    CLS: 0.1,            // Cumulative Layout Shift
    FID: 100,            // First Input Delay (ms)
    TTFB: 800,           // Time to First Byte (ms)
  },
  bundleSize: {
    total: 500 * 1024,   // 500KB gzipped
    main: 200 * 1024,    // 200KB gzipped
    vendor: 250 * 1024,  // 250KB gzipped
  },
  apiLatency: {
    p95: 500,            // 95th percentile (ms)
    p50: 200,            // 50th percentile (ms)
  },
};
```

### Updating Budgets

To update performance budgets:

1. **Lighthouse**: Update `lighthouserc.json`
2. **Web Vitals**: Update `WebVitalsMonitor.ts`
3. **Bundle Size**: Update `bundle-size-check.js`
4. **API Latency**: Update `latencyMeasurement.ts`

## 11. Troubleshooting

### Common Issues

#### Lighthouse CI Fails
```bash
# Check Lighthouse configuration
cat lighthouserc.json

# Run Lighthouse locally
cd frontend && npm run lighthouse
```

#### Web Vitals Not Collecting
```bash
# Check if Web Vitals is enabled
echo $VITE_ENABLE_WEB_VITALS

# Check browser console for errors
# Verify /api/analytics/web-vitals endpoint is accessible
```

#### Bundle Analysis Not Working
```bash
# Check if build completed successfully
cd frontend && npm run build

# Run bundle analysis manually
npm run analyze
```

#### Database Profiling Issues
```bash
# Check if profiling is enabled
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/profile

# Enable profiling manually
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/profiling/enable
```

### Performance Debugging

#### Slow API Endpoints
1. Check API latency metrics
2. Enable database profiling
3. Analyze slow queries
4. Check for missing indexes
5. Review caching opportunities

#### Poor Web Vitals
1. Run Lighthouse audit
2. Check for layout shifts
3. Analyze loading performance
4. Review image optimization
5. Check for render-blocking resources

#### Large Bundle Size
1. Run bundle analysis
2. Check for duplicate dependencies
3. Review code splitting opportunities
4. Analyze unused code
5. Check compression settings

## 12. Performance Optimization Workflow

### Regular Optimization Cycle

1. **Weekly**: Review performance metrics
2. **Bi-weekly**: Identify optimization opportunities
3. **Monthly**: Implement optimizations
4. **Quarterly**: Comprehensive performance audit

### Optimization Priorities

1. **Critical**: Performance budget violations
2. **High**: User-facing performance issues
3. **Medium**: Optimization opportunities
4. **Low**: Nice-to-have improvements

### Performance Testing Checklist

Before deploying optimizations:
- [ ] Run full baseline collection
- [ ] Compare with previous baseline
- [ ] Verify all budgets are met
- [ ] Test on different devices/networks
- [ ] Validate monitoring is working
- [ ] Update documentation

---

## Support and Resources

- **Performance Dashboard**: `/performance`
- **Lighthouse Reports**: GitHub Actions artifacts
- **Bundle Analysis**: `frontend/dist/bundle-analysis.html`
- **API Metrics**: `/api/admin/performance/*`
- **Documentation**: `PERF_BASELINE.md`

For questions or issues, contact the development team or create an issue in the repository.