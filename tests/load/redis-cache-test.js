/**
 * K6 Redis Cache Performance Test
 * Tests Redis caching performance and cache hit rates under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Redis-specific metrics
const cacheHitRate = new Rate('redis_cache_hits');
const cacheMissRate = new Rate('redis_cache_misses');
const cacheResponseTime = new Trend('redis_response_time');
const cacheOperations = new Counter('redis_operations');
const redisConnections = new Gauge('redis_connections');

export const options = {
  stages: [
    { duration: '1m', target: 25 },   // Warm up cache
    { duration: '3m', target: 25 },   // Sustained cache usage
    { duration: '2m', target: 75 },   // Increased cache load
    { duration: '5m', target: 75 },   // Sustained high cache usage
    { duration: '2m', target: 150 },  // Peak cache load
    { duration: '3m', target: 150 },  // Sustained peak load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Cache performance budgets
    redis_cache_hits: ['rate>0.8'], // 80% cache hit rate
    redis_response_time: ['p(95)<50'], // 95% of cache operations under 50ms
    http_req_duration: ['p(95)<200'], // API responses under 200ms with cache
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

if (__ENV.AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${__ENV.AUTH_TOKEN}`;
}

// Cache test patterns
const CACHE_PATTERNS = {
  // Frequently accessed data (should have high hit rate)
  HOT_DATA: [
    '/api/patients/statistics',
    '/api/analytics/dashboard',
    '/api/system/health',
    '/api/performance/metrics',
  ],
  
  // Moderately accessed data
  WARM_DATA: [
    '/api/patients?limit=10',
    '/api/notes/recent',
    '/api/analytics/monthly',
    '/api/users/profile',
  ],
  
  // Rarely accessed data (likely cache misses)
  COLD_DATA: [
    '/api/patients/search?q=rare-condition',
    '/api/analytics/yearly',
    '/api/reports/detailed',
    '/api/audit/logs',
  ],
};

export default function () {
  const testType = Math.random();
  
  if (testType < 0.6) {
    // 60% - Test hot data (high cache hit rate expected)
    testHotDataCache();
  } else if (testType < 0.85) {
    // 25% - Test warm data (moderate cache hit rate)
    testWarmDataCache();
  } else {
    // 15% - Test cold data and cache invalidation
    testColdDataAndInvalidation();
  }
  
  sleep(Math.random() * 0.5 + 0.2);
}

function testHotDataCache() {
  const group = 'Hot Data Cache';
  const endpoint = CACHE_PATTERNS.HOT_DATA[
    Math.floor(Math.random() * CACHE_PATTERNS.HOT_DATA.length)
  ];
  
  // Make multiple requests to the same endpoint to test cache effectiveness
  for (let i = 0; i < 3; i++) {
    const response = http.get(`${BASE_URL}${endpoint}`, { 
      headers: {
        ...headers,
        'X-Cache-Test': 'hot-data',
      }
    });
    
    const success = check(response, {
      [`${group} - Request ${i + 1} status is 200`]: (r) => r.status === 200,
      [`${group} - Request ${i + 1} response time < 100ms`]: (r) => r.timings.duration < 100,
    });
    
    recordCacheMetrics(response, success, 'hot');
    
    // Very short delay to test rapid successive requests
    sleep(0.05);
  }
}

function testWarmDataCache() {
  const group = 'Warm Data Cache';
  const endpoint = CACHE_PATTERNS.WARM_DATA[
    Math.floor(Math.random() * CACHE_PATTERNS.WARM_DATA.length)
  ];
  
  const response = http.get(`${BASE_URL}${endpoint}`, { 
    headers: {
      ...headers,
      'X-Cache-Test': 'warm-data',
    }
  });
  
  const success = check(response, {
    [`${group} - Status is 200`]: (r) => r.status === 200,
    [`${group} - Response time < 150ms`]: (r) => r.timings.duration < 150,
  });
  
  recordCacheMetrics(response, success, 'warm');
  
  // Test cache with query parameters
  const queryParams = [
    '?page=1&limit=20',
    '?sort=name&order=asc',
    '?filter=active&date=today',
  ];
  
  const paramEndpoint = endpoint + queryParams[Math.floor(Math.random() * queryParams.length)];
  const paramResponse = http.get(`${BASE_URL}${paramEndpoint}`, { headers });
  
  const paramSuccess = check(paramResponse, {
    [`${group} - Parameterized request status is 200`]: (r) => r.status === 200,
    [`${group} - Parameterized request response time < 200ms`]: (r) => r.timings.duration < 200,
  });
  
  recordCacheMetrics(paramResponse, paramSuccess, 'warm_param');
}

function testColdDataAndInvalidation() {
  const group = 'Cold Data & Invalidation';
  
  // Test cold data (likely cache miss)
  const coldEndpoint = CACHE_PATTERNS.COLD_DATA[
    Math.floor(Math.random() * CACHE_PATTERNS.COLD_DATA.length)
  ];
  
  const coldResponse = http.get(`${BASE_URL}${coldEndpoint}`, { 
    headers: {
      ...headers,
      'X-Cache-Test': 'cold-data',
    }
  });
  
  const coldSuccess = check(coldResponse, {
    [`${group} - Cold data status is 200`]: (r) => r.status === 200,
    [`${group} - Cold data response time acceptable`]: (r) => r.timings.duration < 500,
  });
  
  recordCacheMetrics(coldResponse, coldSuccess, 'cold');
  
  // Test cache invalidation
  const invalidationData = {
    pattern: 'patients:*',
    reason: 'load_test',
  };
  
  const invalidateResponse = http.post(
    `${BASE_URL}/api/cache/invalidate`,
    JSON.stringify(invalidationData),
    { headers }
  );
  
  const invalidateSuccess = check(invalidateResponse, {
    [`${group} - Cache invalidation status is 200`]: (r) => r.status === 200,
    [`${group} - Cache invalidation response time < 50ms`]: (r) => r.timings.duration < 50,
  });
  
  recordCacheMetrics(invalidateResponse, invalidateSuccess, 'invalidation');
  
  // Test data after invalidation (should be cache miss)
  const postInvalidateResponse = http.get(`${BASE_URL}/api/patients/statistics`, { 
    headers: {
      ...headers,
      'X-Cache-Test': 'post-invalidation',
    }
  });
  
  const postInvalidateSuccess = check(postInvalidateResponse, {
    [`${group} - Post-invalidation status is 200`]: (r) => r.status === 200,
    [`${group} - Post-invalidation response time higher`]: (r) => r.timings.duration > 50, // Should be slower due to cache miss
  });
  
  recordCacheMetrics(postInvalidateResponse, postInvalidateSuccess, 'post_invalidation');
}

function recordCacheMetrics(response, success, operation) {
  cacheOperations.add(1);
  cacheResponseTime.add(response.timings.duration);
  
  // Check cache status from response headers
  const cacheStatus = response.headers['X-Cache-Status'] || 'UNKNOWN';
  const isHit = cacheStatus === 'HIT';
  const isMiss = cacheStatus === 'MISS';
  
  cacheHitRate.add(isHit);
  cacheMissRate.add(isMiss);
  
  // Simulate Redis connection count
  const connectionCount = Math.floor(Math.random() * 10) + 2; // 2-12 connections
  redisConnections.add(connectionCount);
  
  // Log cache performance insights
  if (operation === 'hot' && !isHit) {
    console.warn(`Unexpected cache miss for hot data: ${response.url}`);
  }
  
  if (response.timings.duration > 100 && isHit) {
    console.warn(`Slow cache hit: ${response.timings.duration}ms for ${response.url}`);
  }
}

// Test cache warming
export function setup() {
  console.log('Starting Redis cache performance test...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Verify Redis connectivity
  const redisHealthResponse = http.get(`${BASE_URL}/api/health/redis`, { headers });
  if (redisHealthResponse.status !== 200) {
    console.error(`Redis health check failed: ${redisHealthResponse.status}`);
    throw new Error('Redis is not accessible');
  }
  
  // Warm up cache with hot data
  console.log('Warming up cache...');
  CACHE_PATTERNS.HOT_DATA.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`, { 
      headers: {
        ...headers,
        'X-Cache-Test': 'warmup',
      }
    });
    
    if (response.status === 200) {
      console.log(`Cache warmed: ${endpoint}`);
    }
    
    sleep(0.1);
  });
  
  return { 
    startTime: Date.now(),
    warmedEndpoints: CACHE_PATTERNS.HOT_DATA.length,
  };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Redis cache test completed in ${duration} seconds`);
  
  // Get final cache statistics
  const cacheStatsResponse = http.get(`${BASE_URL}/api/performance/cache-stats`, { headers });
  if (cacheStatsResponse.status === 200) {
    try {
      const stats = JSON.parse(cacheStatsResponse.body);
      console.log('Final Redis cache statistics:');
      console.log(`- Total cache operations: ${stats.totalOperations}`);
      console.log(`- Cache hit rate: ${stats.hitRate}%`);
      console.log(`- Cache miss rate: ${stats.missRate}%`);
      console.log(`- Average cache response time: ${stats.averageResponseTime}ms`);
      console.log(`- Active Redis connections: ${stats.activeConnections}`);
      console.log(`- Memory usage: ${stats.memoryUsage}MB`);
      console.log(`- Keys in cache: ${stats.totalKeys}`);
    } catch (error) {
      console.warn('Could not parse cache statistics');
    }
  }
  
  // Clean up test data
  const cleanupResponse = http.post(
    `${BASE_URL}/api/cache/cleanup`,
    JSON.stringify({ pattern: 'test:*' }),
    { headers }
  );
  
  if (cleanupResponse.status === 200) {
    console.log('Test cache data cleaned up');
  }
}