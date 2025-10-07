# AI Diagnostics & Therapeutics API Documentation

## Overview

The AI Diagnostics & Therapeutics API provides comprehensive clinical decision support capabilities for pharmacists. This module integrates AI assistance (DeepSeek V3.1 via OpenRouter) with external clinical APIs (RxNorm, OpenFDA, LOINC, FHIR) to support end-to-end patient assessment workflows.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints require JWT authentication with appropriate role-based permissions:

```
Authorization: Bearer <your_jwt_token>
```

## Required Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-Workspace-ID: <workspace_id>
```

## API Endpoints

### Diagnostic Requests

#### POST /api/diagnostics

Create a new diagnostic request for AI-assisted patient assessment.

**Required Permissions:** `diagnostic:create`, pharmacist role

**Request Body:**

```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "symptoms": {
    "subjective": ["chest pain", "shortness of breath"],
    "objective": ["elevated blood pressure", "rapid heart rate"],
    "duration": "2 days",
    "severity": "moderate",
    "onset": "acute"
  },
  "vitals": {
    "bloodPressure": "150/95",
    "heartRate": 110,
    "temperature": 98.6,
    "respiratoryRate": 22
  },
  "currentMedications": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily"
    }
  ],
  "allergies": ["penicillin", "sulfa"],
  "medicalHistory": ["hypertension", "diabetes"],
  "labResultIds": ["507f1f77bcf86cd799439012"],
  "consent": true
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "status": "processing",
    "estimatedCompletionTime": "2024-01-15T10:30:00Z",
    "message": "Diagnostic request created successfully. AI analysis in progress."
  }
}
```

#### GET /api/diagnostics/:id

Retrieve diagnostic request and results with polling support.

**Required Permissions:** `diagnostic:read`, pharmacist role

**Response (200 OK - Processing):**

```json
{
  "success": true,
  "data": {
    "request": {
      "id": "507f1f77bcf86cd799439013",
      "patientId": "507f1f77bcf86cd799439011",
      "status": "processing",
      "createdAt": "2024-01-15T10:25:00Z",
      "inputSnapshot": {
        "symptoms": {
          "subjective": ["chest pain", "shortness of breath"],
          "objective": ["elevated blood pressure", "rapid heart rate"],
          "duration": "2 days",
          "severity": "moderate",
          "onset": "acute"
        }
      }
    },
    "result": null,
    "processingStatus": {
      "stage": "ai_analysis",
      "progress": 75,
      "estimatedTimeRemaining": "30 seconds"
    }
  }
}
```

**Response (200 OK - Completed):**

```json
{
  "success": true,
  "data": {
    "request": {
      "id": "507f1f77bcf86cd799439013",
      "status": "completed"
    },
    "result": {
      "id": "507f1f77bcf86cd799439014",
      "diagnoses": [
        {
          "condition": "Acute Coronary Syndrome",
          "probability": 0.75,
          "reasoning": "Chest pain with elevated BP and tachycardia in patient with cardiovascular risk factors",
          "severity": "high",
          "icdCode": "I20.9",
          "snomedCode": "394659003"
        }
      ],
      "suggestedTests": [
        {
          "testName": "Troponin I",
          "priority": "urgent",
          "reasoning": "Rule out myocardial infarction",
          "loincCode": "10839-9"
        }
      ],
      "medicationSuggestions": [
        {
          "drugName": "Aspirin",
          "dosage": "81mg",
          "frequency": "once daily",
          "duration": "ongoing",
          "reasoning": "Cardioprotective therapy for suspected ACS",
          "safetyNotes": [
            "Monitor for bleeding",
            "Contraindicated with active GI bleeding"
          ],
          "rxcui": "1191"
        }
      ],
      "redFlags": [
        {
          "flag": "Chest pain with cardiovascular risk factors",
          "severity": "high",
          "action": "Consider immediate cardiology referral"
        }
      ],
      "referralRecommendation": {
        "recommended": true,
        "urgency": "within_24h",
        "specialty": "Cardiology",
        "reason": "Suspected acute coronary syndrome requires specialist evaluation"
      },
      "aiMetadata": {
        "modelId": "deepseek-v3.1",
        "confidenceScore": 0.82,
        "processingTime": 18.5,
        "tokenUsage": {
          "promptTokens": 1250,
          "completionTokens": 890,
          "totalTokens": 2140
        }
      },
      "disclaimer": "This AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by qualified healthcare professionals."
    }
  }
}
```

#### POST /api/diagnostics/:id/approve

Approve AI-generated diagnostic results (pharmacist review).

**Required Permissions:** `diagnostic:approve`, pharmacist role

**Request Body:**

```json
{
  "status": "approved",
  "modifications": "Agreed with AI assessment. Will proceed with cardiology referral.",
  "createIntervention": true,
  "interventionNotes": "Patient counseled on chest pain symptoms and advised to seek immediate care if symptoms worsen."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "reviewStatus": "approved",
    "reviewedAt": "2024-01-15T10:45:00Z",
    "reviewedBy": "507f1f77bcf86cd799439015",
    "interventionCreated": true,
    "interventionId": "507f1f77bcf86cd799439016"
  }
}
```

#### POST /api/diagnostics/:id/reject

Reject AI-generated diagnostic results.

**Request Body:**

```json
{
  "status": "rejected",
  "rejectionReason": "AI assessment does not align with clinical presentation. Patient symptoms more consistent with anxiety rather than cardiac etiology.",
  "alternativeAssessment": "Recommend anxiety screening and stress management counseling."
}
```

#### GET /api/diagnostics/history/:patientId

Get patient diagnostic history with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)
- `status` (optional): Filter by status
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "507f1f77bcf86cd799439013",
        "createdAt": "2024-01-15T10:25:00Z",
        "status": "completed",
        "primaryDiagnosis": "Acute Coronary Syndrome",
        "confidence": 0.75,
        "reviewStatus": "approved"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalResults": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /api/diagnostics/dashboard

Get diagnostic dashboard analytics.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 150,
      "completedRequests": 142,
      "pendingReviews": 8,
      "averageProcessingTime": 22.5,
      "aiAccuracyRate": 0.87
    },
    "recentActivity": [
      {
        "id": "507f1f77bcf86cd799439013",
        "patientName": "John D.",
        "status": "pending_review",
        "createdAt": "2024-01-15T10:25:00Z",
        "primaryDiagnosis": "Acute Coronary Syndrome"
      }
    ],
    "performanceMetrics": {
      "averageConfidenceScore": 0.82,
      "mostCommonDiagnoses": [
        { "condition": "Hypertension", "count": 25 },
        { "condition": "Diabetes Type 2", "count": 18 }
      ],
      "referralRate": 0.35
    }
  }
}
```

### Lab Management

#### POST /api/lab/orders

Create a new lab order.

**Required Permissions:** `lab:create_order`, pharmacist role

**Request Body:**

```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "tests": [
    {
      "code": "TROP_I",
      "name": "Troponin I",
      "loincCode": "10839-9",
      "indication": "Rule out myocardial infarction",
      "priority": "urgent"
    },
    {
      "code": "BNP",
      "name": "B-type Natriuretic Peptide",
      "loincCode": "30934-4",
      "indication": "Assess heart failure",
      "priority": "routine"
    }
  ],
  "indication": "Chest pain evaluation",
  "expectedDate": "2024-01-16T08:00:00Z"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439017",
    "orderNumber": "LAB-2024-001",
    "status": "ordered",
    "orderDate": "2024-01-15T11:00:00Z",
    "expectedDate": "2024-01-16T08:00:00Z",
    "tests": [
      {
        "code": "TROP_I",
        "name": "Troponin I",
        "status": "ordered",
        "priority": "urgent"
      }
    ]
  }
}
```

#### POST /api/lab/results

Add lab result manually.

**Required Permissions:** `lab:add_result`, pharmacist role

**Request Body:**

```json
{
  "orderId": "507f1f77bcf86cd799439017",
  "patientId": "507f1f77bcf86cd799439011",
  "testCode": "TROP_I",
  "testName": "Troponin I",
  "value": "0.15",
  "unit": "ng/mL",
  "referenceRange": {
    "low": 0.0,
    "high": 0.04,
    "text": "< 0.04 ng/mL"
  },
  "interpretation": "high",
  "flags": ["H", "CRITICAL"],
  "performedAt": "2024-01-16T08:30:00Z",
  "loincCode": "10839-9"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439018",
    "testCode": "TROP_I",
    "value": "0.15",
    "interpretation": "high",
    "criticalValue": true,
    "recordedAt": "2024-01-16T09:00:00Z",
    "alerts": [
      {
        "type": "critical_value",
        "message": "Troponin I significantly elevated - possible myocardial infarction"
      }
    ]
  }
}
```

#### GET /api/lab/trends/:patientId/:testCode

Get lab result trends for a patient and specific test.

**Query Parameters:**

- `period` (optional): Time period (30d, 90d, 1y, all)
- `limit` (optional): Maximum results (default: 50)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "testCode": "TROP_I",
    "testName": "Troponin I",
    "unit": "ng/mL",
    "referenceRange": {
      "low": 0.0,
      "high": 0.04,
      "text": "< 0.04 ng/mL"
    },
    "results": [
      {
        "value": "0.15",
        "interpretation": "high",
        "performedAt": "2024-01-16T08:30:00Z",
        "flags": ["H", "CRITICAL"]
      },
      {
        "value": "0.02",
        "interpretation": "normal",
        "performedAt": "2024-01-10T08:30:00Z",
        "flags": []
      }
    ],
    "trend": {
      "direction": "increasing",
      "significance": "clinically_significant",
      "changePercent": 650
    }
  }
}
```

#### POST /api/lab/import/fhir

Import lab results from FHIR bundle.

**Required Permissions:** `lab:import_fhir`, pharmacist role

**Request Body:**

```json
{
  "fhirBundle": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "Observation",
          "status": "final",
          "code": {
            "coding": [
              {
                "system": "http://loinc.org",
                "code": "10839-9",
                "display": "Troponin I"
              }
            ]
          },
          "subject": {
            "reference": "Patient/123"
          },
          "valueQuantity": {
            "value": 0.15,
            "unit": "ng/mL"
          },
          "referenceRange": [
            {
              "low": {
                "value": 0.0,
                "unit": "ng/mL"
              },
              "high": {
                "value": 0.04,
                "unit": "ng/mL"
              }
            }
          ]
        }
      }
    ]
  },
  "patientMapping": {
    "Patient/123": "507f1f77bcf86cd799439011"
  }
}
```

### Drug Interactions

#### POST /api/interactions/check

Check for drug interactions and contraindications.

**Required Permissions:** `diagnostic:read`, pharmacist role

**Request Body:**

```json
{
  "medications": ["aspirin", "warfarin", "lisinopril"],
  "patientAllergies": ["penicillin", "sulfa"],
  "patientConditions": ["hypertension", "atrial fibrillation"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "drug1": "aspirin",
        "drug2": "warfarin",
        "severity": "major",
        "description": "Increased risk of bleeding when aspirin is combined with warfarin",
        "clinicalSignificance": "Monitor INR closely and watch for signs of bleeding",
        "recommendation": "Consider reducing warfarin dose or using alternative antiplatelet therapy"
      }
    ],
    "allergicReactions": [],
    "contraindications": [
      {
        "drug": "aspirin",
        "condition": "active_gi_bleeding",
        "severity": "absolute",
        "description": "Aspirin is contraindicated in patients with active gastrointestinal bleeding"
      }
    ],
    "summary": {
      "totalInteractions": 1,
      "majorInteractions": 1,
      "moderateInteractions": 0,
      "minorInteractions": 0,
      "hasContraindications": true
    }
  }
}
```

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes

#### Client Errors (4xx)

- **400 Bad Request**

  - `INVALID_REQUEST`: Malformed request data
  - `CONSENT_ERROR`: Patient consent validation failed
  - `RETRY_ERROR`: Retry operation failed

- **401 Unauthorized**

  - `AUTHENTICATION_REQUIRED`: Valid JWT token required
  - `TOKEN_EXPIRED`: JWT token has expired

- **403 Forbidden**

  - `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
  - `SUBSCRIPTION_REQUIRED`: Feature requires active subscription
  - `ROLE_REQUIRED`: Pharmacist role required

- **404 Not Found**

  - `RESOURCE_NOT_FOUND`: Requested resource does not exist
  - `PATIENT_NOT_FOUND`: Patient ID not found

- **409 Conflict**

  - `DUPLICATE_REQUEST`: Diagnostic request already in progress
  - `DUPLICATE_ERROR`: Resource already exists

- **422 Unprocessable Entity**
  - `VALIDATION_ERROR`: Input validation failed
  - `REFERENCE_RANGE_ERROR`: Invalid reference range
  - `LOINC_ERROR`: Invalid LOINC code

#### Server Errors (5xx)

- **500 Internal Server Error**

  - `INTERNAL_ERROR`: Unexpected server error

- **502 Bad Gateway**

  - `AI_SERVICE_ERROR`: AI service temporarily unavailable
  - `EXTERNAL_LAB_ERROR`: External lab system error

- **503 Service Unavailable**

  - `SERVICE_UNAVAILABLE`: Service temporarily unavailable

- **504 Gateway Timeout**
  - `PROCESSING_TIMEOUT`: AI processing timeout
  - `TIMEOUT_ERROR`: Operation timeout

### Error Response Examples

#### AI Service Unavailable

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service temporarily unavailable",
    "details": "Please try again later or contact support if the issue persists",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  },
  "fallbackOptions": {
    "manualWorkflow": true,
    "cachedData": null
  }
}
```

#### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data validation failed",
    "details": [
      "Patient consent is required",
      "At least one symptom must be provided",
      "Invalid blood pressure format"
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Rate Limits

- **Diagnostic Requests**: 10 requests per minute per user
- **Lab Operations**: 50 requests per minute per user
- **Drug Interaction Checks**: 100 requests per minute per user
- **FHIR Operations**: 20 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642248600
```

## Webhooks (Optional)

Configure webhooks to receive real-time notifications:

### Diagnostic Completion

```json
{
  "event": "diagnostic.completed",
  "data": {
    "requestId": "507f1f77bcf86cd799439013",
    "patientId": "507f1f77bcf86cd799439011",
    "status": "completed",
    "confidence": 0.82,
    "requiresReview": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Critical Lab Result

```json
{
  "event": "lab.critical_result",
  "data": {
    "resultId": "507f1f77bcf86cd799439018",
    "patientId": "507f1f77bcf86cd799439011",
    "testCode": "TROP_I",
    "value": "0.15",
    "criticalThreshold": "0.04",
    "interpretation": "high"
  },
  "timestamp": "2024-01-16T09:00:00Z"
}
```

## SDK and Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class DiagnosticsAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createDiagnosticRequest(data) {
    try {
      const response = await this.client.post('/diagnostics', data);
      return response.data;
    } catch (error) {
      throw new Error(
        `Diagnostic request failed: ${error.response.data.error.message}`
      );
    }
  }

  async pollDiagnosticResult(requestId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.client.get(`/diagnostics/${requestId}`);

      if (response.data.data.request.status === 'completed') {
        return response.data.data.result;
      }

      if (response.data.data.request.status === 'failed') {
        throw new Error('Diagnostic processing failed');
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Diagnostic processing timeout');
  }
}

// Usage
const api = new DiagnosticsAPI('http://localhost:5000/api', 'your-jwt-token');

const diagnosticData = {
  patientId: '507f1f77bcf86cd799439011',
  symptoms: {
    subjective: ['chest pain', 'shortness of breath'],
    duration: '2 days',
    severity: 'moderate',
    onset: 'acute',
  },
  consent: true,
};

api
  .createDiagnosticRequest(diagnosticData)
  .then((result) => api.pollDiagnosticResult(result.data.id))
  .then((diagnosticResult) => {
    console.log('Diagnostic completed:', diagnosticResult);
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
```

### Python

```python
import requests
import time
from typing import Dict, Any, Optional

class DiagnosticsAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def create_diagnostic_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f'{self.base_url}/diagnostics',
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def poll_diagnostic_result(self, request_id: str, max_attempts: int = 30) -> Optional[Dict[str, Any]]:
        for _ in range(max_attempts):
            response = requests.get(
                f'{self.base_url}/diagnostics/{request_id}',
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()

            if data['data']['request']['status'] == 'completed':
                return data['data']['result']
            elif data['data']['request']['status'] == 'failed':
                raise Exception('Diagnostic processing failed')

            time.sleep(2)

        raise Exception('Diagnostic processing timeout')

# Usage
api = DiagnosticsAPI('http://localhost:5000/api', 'your-jwt-token')

diagnostic_data = {
    'patientId': '507f1f77bcf86cd799439011',
    'symptoms': {
        'subjective': ['chest pain', 'shortness of breath'],
        'duration': '2 days',
        'severity': 'moderate',
        'onset': 'acute'
    },
    'consent': True
}

try:
    result = api.create_diagnostic_request(diagnostic_data)
    diagnostic_result = api.poll_diagnostic_result(result['data']['id'])
    print('Diagnostic completed:', diagnostic_result)
except Exception as e:
    print('Error:', str(e))
```

## Testing

### Postman Collection

A comprehensive Postman collection is available at `/docs/AI_Diagnostics_API.postman_collection.json` with:

- Pre-configured authentication
- Sample requests for all endpoints
- Environment variables for easy testing
- Automated tests for response validation

### Test Data

Sample test data is available for development and testing:

```json
{
  "testPatients": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "age": 65,
      "conditions": ["hypertension", "diabetes"]
    }
  ],
  "sampleSymptoms": [
    {
      "subjective": ["chest pain", "shortness of breath"],
      "objective": ["elevated blood pressure"],
      "duration": "2 days",
      "severity": "moderate",
      "onset": "acute"
    }
  ]
}
```

## Support

For API support and questions:

- **Documentation**: [API Documentation](http://localhost:5000/api-docs)
- **Support Email**: support@PharmacyCopilot.com
- **Developer Portal**: [Developer Resources](http://localhost:5000/developers)

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release of AI Diagnostics & Therapeutics API
- Core diagnostic request and result endpoints
- Lab order and result management
- Drug interaction checking
- FHIR integration support
- Comprehensive error handling and validation
