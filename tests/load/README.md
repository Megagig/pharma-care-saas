# Patient Engagement Load Testing Suite

This comprehensive load testing suite validates the performance and scalability of the Patient Engagement & Follow-up Management module under high concurrent load.

## Overview

The load testing suite includes:
- **1000 concurrent users** simulation
- **API response time** measurement under load
- **Background job processing** capacity testing
- **Database performance** validation
- **WebSocket connection** stability testing
- **Bottleneck identification** and performance optimization recommendations

## Test Scenarios

### 1. Main Load Test (`load-test-config.yml`)
- **Duration**: 10 minutes with 5 phases
- **Peak Load**: 1000 concurrent users
- **Scenarios**: Authentication (20%), Appointments (40%), Follow-ups (25%), Analytics (10%), Patient Portal (5%)
- **Thresholds**: P95 < 500ms, P99 < 1000ms, Success rate > 95%

### 2. Appointment-Focused Test (`appointments-load-test.yml`)
- **Focus**: Intensive appointment CRUD operations
- **Peak Load**: 300 concurrent users
- **Scenarios**: Rapid appointment creation, calendar viewing, status updates, rescheduling
- **Thresholds**: P95 < 400ms, Success rate > 97%

### 3. Follow-up Management Test (`followups-load-test.yml`)
- **Focus**: Follow-up task management workflows
- **Peak Load**: 250 concurrent users
- **Scenarios**: Task creation, completion, escalation, conversion to appointments
- **Thresholds**: P95 < 450ms, Success rate > 96%

### 4. WebSocket Test (`websockets-load-test.yml`)
- **Focus**: Real-time updates and notifications
- **Peak Load**: 500 concurrent connections
- **Scenarios**: Appointment updates, follow-up notifications, dashboard metrics
- **Thresholds**: Connection time < 1s, Message rate > 100/s

### 5. Database Stress Test (`database-load-test.yml`)
- **Focus**: Database-intensive operations
- **Peak Load**: 400 concurrent users
- **Scenarios**: Complex queries, heavy writes, aggregations, concurrent patient data access
- **Thresholds**: P95 < 600ms, Success rate > 95%

## Prerequisites

### 1. Install Artillery
```bash
npm install -g artillery@latest
# or locally in the project
npm install artillery --save-dev
```

### 2. Set Up Test Environment
```bash
# Navigate to backend directory
cd backend

# Install dependencies (including Artillery)
npm install

# Set up test data
npm run load-test:setup
```

### 3. Configure Environment Variables
```bash
# Create .env file with test configuration
cp .env.example .env.test

# Set test-specific variables
export NODE_ENV=test
export MONGODB_URI=mongodb://localhost:27017/pharma-care-loadtest
export REDIS_URL=redis://localhost:6379
export DISABLE_RATE_LIMITING=true
export JWT_SECRET=load-test-secret-key
```

### 4. Generate Authentication Token
```bash
# Generate test auth token for WebSocket tests
npm run load-test:setup token
export TEST_AUTH_TOKEN="<generated-token>"
```

## Running Load Tests

### Quick Start - Run All Tests
```bash
# Run complete load test suite
npm run load-test:full

# Generate comprehensive report
npm run load-test:report run-all
```

### Individual Test Execution

#### 1. Main Load Test (Comprehensive)
```bash
npm run load-test
# or
artillery run tests/load/load-test-config.yml
```

#### 2. Appointment-Focused Test
```bash
npm run load-test:appointments
# or
artillery run tests/load/appointments-load-test.yml
```

#### 3. Follow-up Management Test
```bash
npm run load-test:followups
# or
artillery run tests/load/followups-load-test.yml
```

#### 4. WebSocket Connection Test
```bash
npm run load-test:websockets
# or
artillery run tests/load/websockets-load-test.yml
```

#### 5. Database Stress Test
```bash
npm run load-test:database
# or
artillery run tests/load/database-load-test.yml
```

### Custom Test Execution
```bash
# Run with custom target
artillery run tests/load/load-test-config.yml --target http://staging.example.com

# Run with custom duration
artillery run tests/load/load-test-config.yml --overrides '{"config":{"phases":[{"duration":300,"arrivalRate":100}]}}'

# Run with output file
artillery run tests/load/load-test-config.yml --output results/custom-test.json
```

## Test Data Management

### Setup Test Data
```bash
# Create test users, patients, and workspaces
npm run load-test:setup setup

# Generate authentication token
npm run load-test:setup token
```

### Cleanup Test Data
```bash
# Full cleanup
npm run load-test:cleanup full

# Specific cleanup
npm run load-test:cleanup users
npm run load-test:cleanup patients
npm run load-test:cleanup engagement
npm run load-test:cleanup cache
```

### Check Cleanup Status
```bash
npm run load-test:cleanup stats
```

## Performance Thresholds

### API Response Times
- **P95 Latency**: < 500ms (appointments/follow-ups), < 600ms (database operations)
- **P99 Latency**: < 1000ms (all operations)
- **Average Response Time**: < 200ms (read operations), < 300ms (write operations)

### Throughput
- **Minimum RPS**: 400 requests/second (main test), 250 RPS (focused tests)
- **Peak RPS**: 800+ requests/second during peak load phases

### Success Rates
- **Overall Success Rate**: > 95%
- **Appointment Operations**: > 97%
- **Follow-up Operations**: > 96%
- **WebSocket Connections**: > 98%

### WebSocket Performance
- **Connection Time**: < 1 second
- **Message Rate**: > 100 messages/second
- **Connection Stability**: < 2% connection errors

## Monitoring During Tests

### Real-time Monitoring
```bash
# Monitor system resources
htop
iostat -x 1
free -h

# Monitor MongoDB
mongostat --host localhost:27017

# Monitor Redis
redis-cli monitor

# Monitor application logs
tail -f backend/logs/app.log
```

### Performance Metrics Collection
The tests automatically collect:
- HTTP response times (min, max, median, P95, P99)
- Request rates and throughput
- Error rates and types
- WebSocket connection metrics
- Database query performance
- Memory and CPU utilization

## Report Generation

### Automatic Reports
```bash
# Generate report for specific test
npm run load-test:report generate appointments

# Generate combined report for all tests
npm run load-test:report run-all
```

### Manual Report Analysis
```bash
# View Artillery JSON output
artillery report tests/load/results/appointments-results.json

# Generate HTML report
artillery report tests/load/results/appointments-results.json --output reports/appointments-report.html
```

## Interpreting Results

### Success Criteria
✅ **PASS**: All thresholds met, no critical bottlenecks identified
❌ **FAIL**: One or more thresholds exceeded, performance issues detected

### Key Metrics to Monitor
1. **Response Time Distribution**: P95 and P99 latencies within thresholds
2. **Error Rate**: < 5% overall, < 1% for critical operations
3. **Throughput**: Sustained RPS meeting minimum requirements
4. **Resource Utilization**: CPU < 80%, Memory < 85%, DB connections < 90% of pool

### Common Performance Issues

#### High Latency (P95 > 500ms)
- **Causes**: Slow database queries, unoptimized endpoints, resource contention
- **Solutions**: Add database indexes, implement caching, optimize queries

#### Low Throughput (RPS < 400)
- **Causes**: CPU bottlenecks, database connection limits, memory constraints
- **Solutions**: Scale horizontally, optimize connection pooling, increase resources

#### High Error Rate (> 5%)
- **Causes**: Database timeouts, validation failures, server overload
- **Solutions**: Implement retry logic, optimize validation, scale infrastructure

#### WebSocket Issues
- **Causes**: Connection limits, memory leaks, event loop blocking
- **Solutions**: Optimize event handlers, implement connection pooling, monitor memory

## Optimization Recommendations

### Database Optimization
```javascript
// Add compound indexes for frequent queries
db.appointments.createIndex({ workplaceId: 1, scheduledDate: 1, status: 1 })
db.followuptasks.createIndex({ workplaceId: 1, status: 1, dueDate: 1 })

// Optimize aggregation pipelines
db.appointments.aggregate([
  { $match: { workplaceId: ObjectId("...") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

### Caching Strategy
```javascript
// Implement Redis caching for frequent queries
const cacheKey = `appointments:${workplaceId}:${date}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Cache with appropriate TTL
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 minutes
```

### Connection Pooling
```javascript
// Optimize MongoDB connection pool
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000
});
```

## Troubleshooting

### Common Issues

#### Test Setup Failures
```bash
# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check Redis connection
redis-cli ping

# Verify test data creation
npm run load-test:cleanup stats
```

#### Authentication Errors
```bash
# Regenerate auth token
npm run load-test:setup token

# Verify token in environment
echo $TEST_AUTH_TOKEN
```

#### High Error Rates During Tests
```bash
# Check server logs
tail -f backend/logs/error.log

# Monitor system resources
top -p $(pgrep -f "node.*server")

# Check database connections
mongostat --host localhost:27017
```

#### WebSocket Connection Issues
```bash
# Test WebSocket endpoint manually
wscat -c ws://localhost:5000/socket.io/?EIO=4&transport=websocket

# Check Socket.IO logs
DEBUG=socket.io* npm run dev
```

### Performance Debugging

#### Identify Slow Endpoints
```bash
# Enable MongoDB profiling
db.setProfilingLevel(2, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)

# Monitor API response times
grep "Response time" backend/logs/app.log | tail -20
```

#### Memory Leak Detection
```bash
# Monitor memory usage during tests
while true; do
  ps -p $(pgrep -f "node.*server") -o pid,vsz,rss,pmem,time
  sleep 5
done
```

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Load Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run load-test:setup setup
      - run: npm run load-test:full
      - run: npm run load-test:report run-all
      - uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: tests/load/reports/
```

### Performance Regression Detection
```bash
# Compare with baseline performance
npm run load-test:report generate current
npm run load-test:compare baseline.json current.json
```

## Best Practices

### Test Environment
- Use dedicated test database and Redis instance
- Disable rate limiting during tests
- Ensure sufficient system resources (CPU, memory, disk I/O)
- Run tests during off-peak hours

### Test Data
- Use realistic data volumes (1000+ patients, 50+ users)
- Include edge cases (long descriptions, complex schedules)
- Clean up test data after each run
- Maintain separate test and production datasets

### Monitoring
- Monitor system resources during tests
- Track database performance metrics
- Log all errors and timeouts
- Set up alerts for critical thresholds

### Reporting
- Generate reports after each test run
- Compare results with previous runs
- Document performance improvements/regressions
- Share results with development team

## Support

For issues with load testing:
1. Check the troubleshooting section above
2. Review Artillery documentation: https://artillery.io/docs/
3. Monitor system logs during test execution
4. Verify test environment configuration

## Files Structure

```
tests/load/
├── README.md                          # This documentation
├── load-test-config.yml              # Main comprehensive load test
├── appointments-load-test.yml         # Appointment-focused test
├── followups-load-test.yml           # Follow-up management test
├── websockets-load-test.yml          # WebSocket connection test
├── database-load-test.yml            # Database stress test
├── scripts/
│   ├── setupLoadTestData.ts          # Test data setup script
│   ├── generateLoadTestReport.ts     # Report generation script
│   └── cleanupLoadTestData.ts        # Test data cleanup script
├── results/                          # Test result files (JSON)
└── reports/                          # Generated HTML/PDF reports
```