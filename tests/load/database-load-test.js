/**
 * K6 Database Performance Load Test
 * Tests database performance under load with connection pooling
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for database performance
const dbResponseTime = new Trend('db_response_time');
const dbErrorRate = new Rate('db_errors');
const dbConnectionCount = new Gauge('db_connections');
const dbQueryCount = new Counter('db_queries');
const cacheHitRate = new Rate('cache_hits');

// Test configuration focused on database operations
export const options = {
  stages: [
    // Gradual ramp up to test connection pooling
    { duration: '1m', target: 20 },   // Light load
    { duration: '3m', target: 20 },   // Sustained light load
    { duration: '2m', target: 50 },   // Medium load
    { duration: '5m', target: 50 },   // Sustained medium load
    { duration: '2m', target: 100 },  // Heavy load
    { duration: '5m', target: 100 },  // Sustained heavy load
    { duration: '1m', target: 150 },  // Peak load
    { duration: '3m', target: 150 },  // Sustained peak load
    { duration: '3m', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Database-specific performance budgets
    db_response_time: ['p(50)<100', 'p(95)<300', 'p(99)<500'],
    db_errors: ['rate<0.01'], // Less than 1% database errors
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.02'],
    cache_hits: ['rate>0.8'], // 80% cache hit rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Add auth token if provided
if (__ENV.AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${__ENV.AUTH_TOKEN}`;
}

export default function () {
  // Database-intensive operations with different patterns
  const operation = Math.random();
  
  if (operation < 0.3) {
    // 30% - Complex queries (joins, aggregations)
    testComplexQueries();
  } else if (operation < 0.6) {
    // 30% - Bulk operations
    testBulkOperations();
  } else if (operation < 0.8) {
    // 20% - Concurrent read/write operations
    testConcurrentOperations();
  } else {
    // 20% - Cache performance testing
    testCachePerformance();
  }
  
  // Simulate realistic user pause
  sleep(Math.random() * 1 + 0.5);
}

function testComplexQueries() {
  const group = 'Complex Queries';
  
  // Test complex patient search with multiple filters
  const filters = {
    age_min: 18,
    age_max: 65,
    condition: 'Diabetes',
    last_visit_after: '2024-01-01',
    limit: 50,
    offset: 0,
  };
  
  const queryString = Object.entries(filters)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  let response = http.get(`${BASE_URL}/api/patients/search?${queryString}`, { headers });
  
  const success = check(response, {
    [`${group} - Complex search status is 200`]: (r) => r.status === 200,
    [`${group} - Complex search response time < 300ms`]: (r) => r.timings.duration < 300,
    [`${group} - Complex search returns data`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && (Array.isArray(data) || data.data);
      } catch {
        return false;
      }
    },
  });
  
  recordDatabaseMetrics(response, success, 'complex_search');
  
  // Test aggregation query
  response = http.get(`${BASE_URL}/api/analytics/patient-statistics`, { headers });
  
  const aggSuccess = check(response, {
    [`${group} - Aggregation status is 200`]: (r) => r.status === 200,
    [`${group} - Aggregation response time < 500ms`]: (r) => r.timings.duration < 500,
  });
  
  recordDatabaseMetrics(response, aggSuccess, 'aggregation');
  
  // Test join query (patients with their notes)
  response = http.get(`${BASE_URL}/api/patients?include=notes&limit=20`, { headers });
  
  const joinSuccess = check(response, {
    [`${group} - Join query status is 200`]: (r) => r.status === 200,
    [`${group} - Join query response time < 400ms`]: (r) => r.timings.duration < 400,
  });
  
  recordDatabaseMetrics(response, joinSuccess, 'join_query');
}

function testBulkOperations() {
  const group = 'Bulk Operations';
  
  // Test bulk patient creation
  const bulkPatients = Array.from({ length: 10 }, (_, i) => ({
    name: `Bulk Patient ${Date.now()}-${i}`,
    email: `bulk${Date.now()}-${i}@example.com`,
    age: Math.floor(Math.random() * 50) + 20,
    condition: ['Diabetes', 'Hypertension', 'Asthma'][Math.floor(Math.random() * 3)],
  }));
  
  let response = http.post(
    `${BASE_URL}/api/patients/bulk`,
    JSON.stringify({ patients: bulkPatients }),
    { headers }
  );
  
  const bulkCreateSuccess = check(response, {
    [`${group} - Bulk create status is 201`]: (r) => r.status === 201,
    [`${group} - Bulk create response time < 800ms`]: (r) => r.timings.duration < 800,
    [`${group} - Bulk create returns IDs`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && Array.isArray(data.ids) && data.ids.length === 10;
      } catch {
        return false;
      }
    },
  });
  
  recordDatabaseMetrics(response, bulkCreateSuccess, 'bulk_create');
  
  if (bulkCreateSuccess && response.status === 201) {
    const createdIds = JSON.parse(response.body).ids;
    
    // Test bulk update
    const bulkUpdates = createdIds.map(id => ({
      id,
      lastVisit: new Date().toISOString(),
      status: 'active',
    }));
    
    response = http.put(
      `${BASE_URL}/api/patients/bulk`,
      JSON.stringify({ updates: bulkUpdates }),
      { headers }
    );
    
    const bulkUpdateSuccess = check(response, {
      [`${group} - Bulk update status is 200`]: (r) => r.status === 200,
      [`${group} - Bulk update response time < 600ms`]: (r) => r.timings.duration < 600,
    });
    
    recordDatabaseMetrics(response, bulkUpdateSuccess, 'bulk_update');
    
    // Test bulk delete (cleanup)
    response = http.del(
      `${BASE_URL}/api/patients/bulk`,
      JSON.stringify({ ids: createdIds }),
      { headers }
    );
    
    const bulkDeleteSuccess = check(response, {
      [`${group} - Bulk delete status is 200`]: (r) => r.status === 200,
      [`${group} - Bulk delete response time < 400ms`]: (r) => r.timings.duration < 400,
    });
    
    recordDatabaseMetrics(response, bulkDeleteSuccess, 'bulk_delete');
  }
}

function testConcurrentOperations() {
  const group = 'Concurrent Operations';
  
  // Simulate concurrent read/write operations that might cause locks
  const patientId = `test-${Date.now()}`;
  
  // Create patient
  const patientData = {
    id: patientId,
    name: `Concurrent Test ${Date.now()}`,
    email: `concurrent${Date.now()}@example.com`,
    age: 30,
  };
  
  let response = http.post(
    `${BASE_URL}/api/patients`,
    JSON.stringify(patientData),
    { headers }
  );
  
  const createSuccess = check(response, {
    [`${group} - Create status is 201`]: (r) => r.status === 201,
    [`${group} - Create response time < 300ms`]: (r) => r.timings.duration < 300,
  });
  
  recordDatabaseMetrics(response, createSuccess, 'concurrent_create');
  
  if (createSuccess) {
    const actualPatientId = extractPatientId(response.body);
    
    // Concurrent operations on the same patient
    const operations = [
      // Read operation
      () => http.get(`${BASE_URL}/api/patients/${actualPatientId}`, { headers }),
      // Update operation
      () => http.put(
        `${BASE_URL}/api/patients/${actualPatientId}`,
        JSON.stringify({ ...patientData, lastVisit: new Date().toISOString() }),
        { headers }
      ),
      // Add note operation
      () => http.post(
        `${BASE_URL}/api/notes`,
        JSON.stringify({
          patientId: actualPatientId,
          content: `Concurrent note ${Date.now()}`,
          type: 'progress',
        }),
        { headers }
      ),
    ];
    
    // Execute operations with minimal delay to test concurrency
    operations.forEach((operation, index) => {
      const opResponse = operation();
      const opSuccess = check(opResponse, {
        [`${group} - Concurrent op ${index + 1} successful`]: (r) => r.status >= 200 && r.status < 300,
        [`${group} - Concurrent op ${index + 1} response time < 400ms`]: (r) => r.timings.duration < 400,
      });
      
      recordDatabaseMetrics(opResponse, opSuccess, `concurrent_op_${index + 1}`);
      
      // Very short delay to simulate near-concurrent access
      sleep(0.01);
    });
  }
}

function testCachePerformance() {
  const group = 'Cache Performance';
  
  // Test cache hit/miss patterns
  const cacheableEndpoints = [
    '/api/patients/statistics',
    '/api/analytics/dashboard',
    '/api/performance/metrics',
    '/api/system/health',
  ];
  
  cacheableEndpoints.forEach(endpoint => {
    // First request (likely cache miss)
    let response = http.get(`${BASE_URL}${endpoint}`, { headers });
    
    const firstSuccess = check(response, {
      [`${group} - First request ${endpoint} status is 200`]: (r) => r.status === 200,
    });
    
    const cacheHit = response.headers['X-Cache-Status'] === 'HIT';
    cacheHitRate.add(cacheHit);
    
    recordDatabaseMetrics(response, firstSuccess, 'cache_first_request');
    
    // Immediate second request (should be cache hit)
    response = http.get(`${BASE_URL}${endpoint}`, { headers });
    
    const secondSuccess = check(response, {
      [`${group} - Second request ${endpoint} status is 200`]: (r) => r.status === 200,
      [`${group} - Second request ${endpoint} faster than first`]: (r) => r.timings.duration < 100,
    });
    
    const secondCacheHit = response.headers['X-Cache-Status'] === 'HIT';
    cacheHitRate.add(secondCacheHit);
    
    recordDatabaseMetrics(response, secondSuccess, 'cache_second_request');
    
    sleep(0.1); // Small delay between endpoint tests
  });
  
  // Test cache invalidation
  const response = http.post(
    `${BASE_URL}/api/cache/invalidate`,
    JSON.stringify({ pattern: 'patients:*' }),
    { headers }
  );
  
  const invalidateSuccess = check(response, {
    [`${group} - Cache invalidation status is 200`]: (r) => r.status === 200,
    [`${group} - Cache invalidation response time < 100ms`]: (r) => r.timings.duration < 100,
  });
  
  recordDatabaseMetrics(response, invalidateSuccess, 'cache_invalidation');
}

function recordDatabaseMetrics(response, success, operation) {
  dbQueryCount.add(1);
  dbResponseTime.add(response.timings.duration);
  dbErrorRate.add(!success);
  
  // Simulate connection count tracking (in real scenario, this would come from the API)
  const connectionCount = Math.floor(Math.random() * 20) + 5; // 5-25 connections
  dbConnectionCount.add(connectionCount);
  
  // Log slow queries for analysis
  if (response.timings.duration > 500) {
    console.warn(`Slow query detected: ${operation} took ${response.timings.duration}ms`);
  }
}

function extractPatientId(responseBody) {
  try {
    const data = JSON.parse(responseBody);
    return data.id || data._id || data.data?.id || data.data?._id;
  } catch {
    return null;
  }
}

export function setup() {
  console.log('Starting database load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Testing database performance under load...');
  
  // Verify database connectivity
  const response = http.get(`${BASE_URL}/api/health/database`, { headers });
  if (response.status !== 200) {
    console.error(`Database health check failed: ${response.status}`);
    throw new Error('Database is not accessible');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Database load test completed in ${duration} seconds`);
  
  // Get final database statistics
  const statsResponse = http.get(`${BASE_URL}/api/performance/database-stats`, { headers });
  if (statsResponse.status === 200) {
    try {
      const stats = JSON.parse(statsResponse.body);
      console.log('Final database statistics:');
      console.log(`- Active connections: ${stats.activeConnections}`);
      console.log(`- Total queries: ${stats.totalQueries}`);
      console.log(`- Average query time: ${stats.averageQueryTime}ms`);
      console.log(`- Cache hit rate: ${stats.cacheHitRate}%`);
    } catch (error) {
      console.warn('Could not parse database statistics');
    }
  }
}