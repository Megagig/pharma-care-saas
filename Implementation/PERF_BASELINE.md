# Performance Baseline Documentation

## Overview

This document establishes the performance baseline for the PharmaPilot MERN-stack SaaS application as of the Phase 0: Discovery & Baseline Measurement implementation. All measurements are taken after the MUI to shadcn/ui migration and serve as the foundation for tracking performance improvements throughout the optimization process.

## Measurement Environment

### Test Environment Specifications
- **Node.js Version**: 18.x
- **Browser**: Chrome 120+ (for Lighthouse tests)
- **Network**: Simulated 3G/4G for mobile, Cable for desktop
- **Hardware**: Standard CI/CD environment (GitHub Actions)
- **Database**: MongoDB with standard configuration
- **Cache**: Redis (when applicable)

### Measurement Methodology
All measurements are taken using:
- **Lighthouse CI**: Automated performance testing with 3 runs averaged
- **Web Vitals**: Real user monitoring data collection
- **Bundle Analysis**: Vite build output analysis with compression
- **API Latency**: Server-side middleware measurement
- **Database Profiling**: MongoDB profiler with 100ms threshold

## Baseline Metrics

### 1. Lighthouse Performance Scores

#### Desktop Performance
```bash
# Command to reproduce
cd frontend && npm run lighthouse

# Expected baseline results (to be updated with actual measurements)
Performance Score: TBD
Accessibility Score: TBD
Best Practices Score: TBD
SEO Score: TBD

# Core Web Vitals
First Contentful Paint (FCP): TBD ms
Largest Contentful Paint (LCP): TBD ms
Cumulative Layout Shift (CLS): TBD
Total Blocking Time (TBT): TBD ms
Speed Index (SI): TBD ms
```

#### Mobile Performance
```bash
# Command to reproduce
cd frontend && npm run lighthouse

# Expected baseline results (to be updated with actual measurements)
Performance Score: TBD
Accessibility Score: TBD
Best Practices Score: TBD
SEO Score: TBD

# Core Web Vitals
First Contentful Paint (FCP): TBD ms
Largest Contentful Paint (LCP): TBD ms
Cumulative Layout Shift (CLS): TBD
Total Blocking Time (TBT): TBD ms
Speed Index (SI): TBD ms
```

### 2. Web Vitals Metrics

#### Real User Monitoring (RUM) Data
```bash
# Command to collect
# Web Vitals are automatically collected when the app is running
# Access via: /api/analytics/web-vitals/summary

# Baseline metrics (to be updated with actual measurements)
FCP (First Contentful Paint):
  P50: TBD ms
  P75: TBD ms
  P95: TBD ms

LCP (Largest Contentful Paint):
  P50: TBD ms
  P75: TBD ms
  P95: TBD ms

CLS (Cumulative Layout Shift):
  P50: TBD
  P75: TBD
  P95: TBD

FID (First Input Delay):
  P50: TBD ms
  P75: TBD ms
  P95: TBD ms

TTFB (Time to First Byte):
  P50: TBD ms
  P75: TBD ms
  P95: TBD ms

INP (Interaction to Next Paint):
  P50: TBD ms
  P75: TBD ms
  P95: TBD ms
```

### 3. Bundle Size Analysis

```bash
# Command to reproduce
cd frontend && npm run build && npm run bundle:size

# Baseline bundle sizes (to be updated with actual measurements)
Total Bundle Size:
  Raw: TBD MB
  Gzip: TBD KB
  Brotli: TBD KB

Main Chunk:
  Raw: TBD KB
  Gzip: TBD KB
  Brotli: TBD KB

Vendor Chunks:
  Raw: TBD KB
  Gzip: TBD KB
  Brotli: TBD KB

Largest Individual Chunks:
1. TBD
2. TBD
3. TBD
```

### 4. API Latency Metrics

```bash
# Command to collect
# API latency is automatically measured via middleware
# Access via: GET /api/admin/performance/latency

# Top 10 Most Frequently Used Endpoints (to be updated with actual measurements)
1. GET /api/patients - P50: TBD ms, P95: TBD ms
2. GET /api/dashboard/overview - P50: TBD ms, P95: TBD ms
3. GET /api/notes - P50: TBD ms, P95: TBD ms
4. GET /api/medications - P50: TBD ms, P95: TBD ms
5. GET /api/auth/me - P50: TBD ms, P95: TBD ms
6. POST /api/auth/login - P50: TBD ms, P95: TBD ms
7. GET /api/mtr - P50: TBD ms, P95: TBD ms
8. GET /api/clinical-interventions - P50: TBD ms, P95: TBD ms
9. GET /api/notifications - P50: TBD ms, P95: TBD ms
10. GET /api/communication - P50: TBD ms, P95: TBD ms

# Overall API Performance
Average Response Time: TBD ms
P50 Response Time: TBD ms
P95 Response Time: TBD ms
P99 Response Time: TBD ms
```

### 5. Database Performance Metrics

```bash
# Command to collect
# Database profiling is enabled via: POST /api/admin/performance/database/profiling/enable
# Access via: GET /api/admin/performance/database/profile

# Connection Pool Stats
Current Connections: TBD
Available Connections: TBD
Total Created: TBD

# Collection Statistics (Top 10 by document count)
1. patients - Documents: TBD, Size: TBD MB, Indexes: TBD
2. clinicalnotes - Documents: TBD, Size: TBD MB, Indexes: TBD
3. medications - Documents: TBD, Size: TBD MB, Indexes: TBD
4. users - Documents: TBD, Size: TBD MB, Indexes: TBD
5. auditlogs - Documents: TBD, Size: TBD MB, Indexes: TBD
6. conversations - Documents: TBD, Size: TBD MB, Indexes: TBD
7. messages - Documents: TBD, Size: TBD MB, Indexes: TBD
8. medicationtherapyreviews - Documents: TBD, Size: TBD MB, Indexes: TBD
9. notifications - Documents: TBD, Size: TBD MB, Indexes: TBD
10. sessions - Documents: TBD, Size: TBD MB, Indexes: TBD

# Slow Queries (>100ms)
Total Slow Queries: TBD
Most Common Slow Operations:
1. TBD
2. TBD
3. TBD
```

## Performance Budgets

### Lighthouse Performance Budgets
- **Desktop Performance Score**: ≥ 90
- **Mobile Performance Score**: ≥ 80 (stretch goal: ≥ 85)
- **Accessibility Score**: ≥ 90
- **Best Practices Score**: ≥ 90
- **SEO Score**: ≥ 80

### Web Vitals Budgets
- **FCP (First Contentful Paint)**: ≤ 1.8s
- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **FID (First Input Delay)**: ≤ 100ms
- **TTFB (Time to First Byte)**: ≤ 800ms
- **INP (Interaction to Next Paint)**: ≤ 200ms

### Bundle Size Budgets
- **Total Bundle (Gzip)**: ≤ 500KB
- **Main Chunk (Gzip)**: ≤ 200KB
- **Vendor Chunks (Gzip)**: ≤ 250KB
- **Individual Chunk (Gzip)**: ≤ 100KB

### API Latency Budgets
- **P95 Response Time**: ≤ 500ms
- **P50 Response Time**: ≤ 200ms
- **Critical Endpoints P95**: ≤ 300ms
- **Authentication Endpoints P95**: ≤ 200ms

### Database Performance Budgets
- **Query Response Time P95**: ≤ 100ms
- **Connection Pool Utilization**: ≤ 80%
- **Slow Queries per Hour**: ≤ 10
- **Index Hit Ratio**: ≥ 95%

## Measurement Scripts

### Automated Baseline Collection
```bash
#!/bin/bash
# scripts/collect-baseline.sh

echo "Collecting Performance Baseline Metrics..."

# 1. Build application
cd frontend
npm run build

# 2. Run Lighthouse tests
echo "Running Lighthouse tests..."
npm run lighthouse > ../baseline-lighthouse.txt 2>&1

# 3. Analyze bundle size
echo "Analyzing bundle size..."
npm run bundle:size > ../baseline-bundle.txt 2>&1

# 4. Start application for API testing
cd ../backend
npm start &
BACKEND_PID=$!

cd ../frontend
npm run preview &
FRONTEND_PID=$!

# Wait for services to start
sleep 10

# 5. Collect API latency (requires authentication)
echo "Collecting API latency metrics..."
curl -s "http://localhost:5000/api/admin/performance/latency" > ../baseline-api.json

# 6. Collect database stats
echo "Collecting database metrics..."
curl -s "http://localhost:5000/api/admin/performance/database/profile" > ../baseline-database.json

# 7. Collect Web Vitals summary
echo "Collecting Web Vitals summary..."
curl -s "http://localhost:5000/api/analytics/web-vitals/summary" > ../baseline-webvitals.json

# Cleanup
kill $BACKEND_PID $FRONTEND_PID

echo "Baseline collection complete!"
echo "Results saved to:"
echo "  - baseline-lighthouse.txt"
echo "  - baseline-bundle.txt"
echo "  - baseline-api.json"
echo "  - baseline-database.json"
echo "  - baseline-webvitals.json"
```

### Manual Measurement Commands
```bash
# Lighthouse Performance Test
cd frontend && npm run lighthouse

# Bundle Size Analysis
cd frontend && npm run build && npm run bundle:size

# Web Vitals Collection (requires running app)
curl http://localhost:5000/api/analytics/web-vitals/summary

# API Latency Metrics (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/admin/performance/latency

# Database Performance Profile (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/admin/performance/database/profile
```

## Performance Regression Detection

### Automated Thresholds
The following thresholds trigger performance regression alerts:

#### Lighthouse Scores
- Performance score decrease > 5 points
- Any Core Web Vital increase > 20%
- Accessibility score decrease > 3 points

#### Bundle Size
- Total bundle size increase > 10%
- Any individual chunk increase > 15%
- New chunks added without justification

#### API Latency
- P95 latency increase > 25%
- P50 latency increase > 30%
- New slow endpoints (>1s P95)

#### Database Performance
- Slow query count increase > 50%
- Connection pool utilization > 90%
- New collections without indexes

### Regression Response Procedure
1. **Immediate**: Automated alert sent to development team
2. **Within 1 hour**: Investigation begins
3. **Within 4 hours**: Root cause identified
4. **Within 8 hours**: Fix implemented or rollback initiated
5. **Within 24 hours**: Post-mortem completed

## Optimization Targets

Based on the baseline measurements, the following optimization targets are established:

### Phase 1 Targets (Theme System Enhancement)
- Theme switching time: < 16ms (1 frame)
- CLS during theme switch: < 0.05
- Zero visible flicker during theme transitions

### Phase 2 Targets (Frontend Optimization)
- Lighthouse Performance (Desktop): ≥ 90
- LCP improvement: 30% reduction from baseline
- TTI improvement: 30% reduction from baseline
- Bundle size reduction: 20% from baseline

### Phase 3 Targets (Backend Optimization)
- API response time improvement: 30% reduction in P95
- Database query optimization: 50% reduction in slow queries
- Cache hit ratio: ≥ 80% for cached endpoints

### Phase 4 Targets (Monitoring & Observability)
- Real-time performance monitoring: 100% coverage
- Automated regression detection: < 5 minute alert time
- Performance budget compliance: 95% adherence

## Monitoring and Alerting Setup

### Continuous Monitoring
- **Web Vitals**: Real-time collection from all users
- **Lighthouse CI**: Automated runs on every PR and deployment
- **Bundle Size**: Automated analysis on every build
- **API Latency**: Continuous measurement via middleware
- **Database Performance**: Profiling enabled for operations >100ms

### Alert Channels
- **Slack**: #performance-alerts channel
- **Email**: development team distribution list
- **GitHub**: Automated PR comments for regressions
- **Dashboard**: Real-time performance dashboard

### Performance Review Schedule
- **Daily**: Automated performance report
- **Weekly**: Team performance review meeting
- **Monthly**: Performance optimization planning
- **Quarterly**: Comprehensive performance audit

## Baseline Update Procedure

This baseline should be updated:
1. After each major optimization phase completion
2. When significant application changes are deployed
3. Monthly as part of regular performance reviews
4. When performance budgets are adjusted

### Update Process
1. Run complete baseline collection script
2. Compare results with previous baseline
3. Update this document with new measurements
4. Adjust performance budgets if necessary
5. Communicate changes to development team

## Tools and Dependencies

### Frontend Performance Tools
- `@lhci/cli`: Lighthouse CI for automated testing
- `web-vitals`: Core Web Vitals measurement library
- `rollup-plugin-visualizer`: Bundle analysis and visualization

### Backend Performance Tools
- Custom latency measurement middleware
- MongoDB profiler for database performance
- Redis for caching layer (when implemented)

### Monitoring Infrastructure
- Performance dashboard components
- Automated alerting system
- CI/CD integration for regression detection

---

**Last Updated**: [Date to be filled when baseline is established]
**Next Review**: [Date + 1 month]
**Baseline Version**: 1.0
**Application Version**: [Current version at time of baseline]