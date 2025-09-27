/**
 * K6 Load Testing Script for API Endpoints
 * Tests API performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    // Performance budgets
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'], // Response time thresholds
    http_req_failed: ['rate<0.05'], // Error rate should be less than 5%
    errors: ['rate<0.05'],
    response_time: ['p(95)<500'],
  },
};

// Base URL configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

// Authentication token (if needed)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Request headers
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

if (AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
}

// Test data
const testPatients = [
  { name: 'John Doe', age: 35, condition: 'Hypertension' },
  { name: 'Jane Smith', age: 28, condition: 'Diabetes' },
  { name: 'Bob Johnson', age: 45, condition: 'Asthma' },
];

const testNotes = [
  { content: 'Patient shows improvement', type: 'progress' },
  { content: 'Medication adjusted', type: 'treatment' },
  { content: 'Follow-up scheduled', type: 'appointment' },
];

export default function () {
  // Test scenario selection (weighted)
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Read operations (most common)
    testReadOperations();
  } else if (scenario < 0.7) {
    // 30% - Search and filter operations
    testSearchOperations();
  } else if (scenario < 0.9) {
    // 20% - Write operations
    testWriteOperations();
  } else {
    // 10% - Analytics and reporting
    testAnalyticsOperations();
  }
  
  // Random sleep between 1-3 seconds to simulate user behavior
  sleep(Math.random() * 2 + 1);
}

function testReadOperations() {
  const group = 'Read Operations';
  
  // Get patients list
  let response = http.get(`${BASE_URL}/api/patients`, { headers });
  
  const success = check(response, {
    [`${group} - Patients list status is 200`]: (r) => r.status === 200,
    [`${group} - Patients list response time < 200ms`]: (r) => r.timings.duration < 200,
    [`${group} - Patients list has data`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) || (data.data && Array.isArray(data.data));
      } catch {
        return false;
      }
    },
  });
  
  recordMetrics(response, success);
  
  if (success && response.status === 200) {
    // Get patient details
    const patientId = extractPatientId(response.body);
    if (patientId) {
      response = http.get(`${BASE_URL}/api/patients/${patientId}`, { headers });
      
      const detailSuccess = check(response, {
        [`${group} - Patient details status is 200`]: (r) => r.status === 200,
        [`${group} - Patient details response time < 150ms`]: (r) => r.timings.duration < 150,
      });
      
      recordMetrics(response, detailSuccess);
      
      // Get patient notes
      response = http.get(`${BASE_URL}/api/patients/${patientId}/notes`, { headers });
      
      const notesSuccess = check(response, {
        [`${group} - Patient notes status is 200`]: (r) => r.status === 200,
        [`${group} - Patient notes response time < 200ms`]: (r) => r.timings.duration < 200,
      });
      
      recordMetrics(response, notesSuccess);
    }
  }
}

function testSearchOperations() {
  const group = 'Search Operations';
  
  // Search patients
  const searchTerms = ['John', 'Diabetes', 'Hypertension', 'Smith'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  let response = http.get(`${BASE_URL}/api/patients/search?q=${searchTerm}`, { headers });
  
  const success = check(response, {
    [`${group} - Search status is 200`]: (r) => r.status === 200,
    [`${group} - Search response time < 300ms`]: (r) => r.timings.duration < 300,
    [`${group} - Search returns results`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) || (data.data && Array.isArray(data.data));
      } catch {
        return false;
      }
    },
  });
  
  recordMetrics(response, success);
  
  // Filter patients by condition
  const conditions = ['Diabetes', 'Hypertension', 'Asthma'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  response = http.get(`${BASE_URL}/api/patients?condition=${condition}`, { headers });
  
  const filterSuccess = check(response, {
    [`${group} - Filter status is 200`]: (r) => r.status === 200,
    [`${group} - Filter response time < 250ms`]: (r) => r.timings.duration < 250,
  });
  
  recordMetrics(response, filterSuccess);
}

function testWriteOperations() {
  const group = 'Write Operations';
  
  // Create patient
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];
  const patientData = {
    ...patient,
    email: `test${Date.now()}@example.com`,
    phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  };
  
  let response = http.post(
    `${BASE_URL}/api/patients`,
    JSON.stringify(patientData),
    { headers }
  );
  
  const createSuccess = check(response, {
    [`${group} - Create patient status is 201`]: (r) => r.status === 201,
    [`${group} - Create patient response time < 400ms`]: (r) => r.timings.duration < 400,
    [`${group} - Create patient returns ID`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.id || data._id;
      } catch {
        return false;
      }
    },
  });
  
  recordMetrics(response, createSuccess);
  
  if (createSuccess && response.status === 201) {
    const patientId = extractPatientId(response.body);
    
    // Add note to patient
    const note = testNotes[Math.floor(Math.random() * testNotes.length)];
    const noteData = {
      ...note,
      patientId,
      timestamp: new Date().toISOString(),
    };
    
    response = http.post(
      `${BASE_URL}/api/notes`,
      JSON.stringify(noteData),
      { headers }
    );
    
    const noteSuccess = check(response, {
      [`${group} - Create note status is 201`]: (r) => r.status === 201,
      [`${group} - Create note response time < 300ms`]: (r) => r.timings.duration < 300,
    });
    
    recordMetrics(response, noteSuccess);
    
    // Update patient
    const updateData = {
      ...patientData,
      lastVisit: new Date().toISOString(),
    };
    
    response = http.put(
      `${BASE_URL}/api/patients/${patientId}`,
      JSON.stringify(updateData),
      { headers }
    );
    
    const updateSuccess = check(response, {
      [`${group} - Update patient status is 200`]: (r) => r.status === 200,
      [`${group} - Update patient response time < 350ms`]: (r) => r.timings.duration < 350,
    });
    
    recordMetrics(response, updateSuccess);
  }
}

function testAnalyticsOperations() {
  const group = 'Analytics Operations';
  
  // Get performance metrics
  let response = http.get(`${BASE_URL}/api/performance/metrics`, { headers });
  
  const metricsSuccess = check(response, {
    [`${group} - Metrics status is 200`]: (r) => r.status === 200,
    [`${group} - Metrics response time < 500ms`]: (r) => r.timings.duration < 500,
  });
  
  recordMetrics(response, metricsSuccess);
  
  // Get analytics data
  const dateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    endDate: new Date().toISOString(),
  };
  
  response = http.get(
    `${BASE_URL}/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    { headers }
  );
  
  const analyticsSuccess = check(response, {
    [`${group} - Analytics status is 200`]: (r) => r.status === 200,
    [`${group} - Analytics response time < 800ms`]: (r) => r.timings.duration < 800,
    [`${group} - Analytics has data`]: (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && typeof data === 'object';
      } catch {
        return false;
      }
    },
  });
  
  recordMetrics(response, analyticsSuccess);
  
  // Get dashboard data
  response = http.get(`${BASE_URL}/api/dashboard`, { headers });
  
  const dashboardSuccess = check(response, {
    [`${group} - Dashboard status is 200`]: (r) => r.status === 200,
    [`${group} - Dashboard response time < 600ms`]: (r) => r.timings.duration < 600,
  });
  
  recordMetrics(response, dashboardSuccess);
}

function extractPatientId(responseBody) {
  try {
    const data = JSON.parse(responseBody);
    if (Array.isArray(data) && data.length > 0) {
      return data[0].id || data[0]._id;
    }
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].id || data.data[0]._id;
    }
    return data.id || data._id;
  } catch {
    return null;
  }
}

function recordMetrics(response, success) {
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  errorRate.add(!success);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting API load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test duration: ~30 minutes`);
  console.log(`Max concurrent users: 200`);
  
  // Verify API is accessible
  const response = http.get(`${BASE_URL}/api/health`, { headers });
  if (response.status !== 200) {
    console.error(`API health check failed: ${response.status}`);
    throw new Error('API is not accessible');
  }
  
  return { startTime: Date.now() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration} seconds`);
}