# Diagnostic History API Documentation

## Overview

The Diagnostic History API provides comprehensive management of AI-powered diagnostic analysis results, patient diagnostic timelines, and clinical documentation. This system enables persistent storage of diagnostic insights, notes management, referral tracking, and analytics.

## Base URL

```
/api/diagnostics
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Patient Diagnostic History

#### Get Patient Diagnostic History
```http
GET /diagnostics/patients/:patientId/history
```

**Parameters:**
- `patientId` (path, required): Patient ID
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 10)
- `includeArchived` (query, optional): Include archived records (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "_id": "history_id",
        "patientId": "patient_id",
        "caseId": "DX-001",
        "diagnosticCaseId": "case_id",
        "pharmacistId": {
          "_id": "pharmacist_id",
          "firstName": "John",
          "lastName": "Doe"
        },
        "analysisSnapshot": {
          "differentialDiagnoses": [
            {
              "condition": "Viral infection",
              "probability": 85,
              "reasoning": "Common symptoms match viral pattern",
              "severity": "medium"
            }
          ],
          "recommendedTests": [],
          "therapeuticOptions": [],
          "redFlags": [],
          "confidenceScore": 85,
          "processingTime": 1500
        },
        "clinicalContext": {
          "symptoms": {
            "subjective": ["headache", "fatigue"],
            "objective": ["fever"],
            "duration": "3 days",
            "severity": "moderate",
            "onset": "acute"
          },
          "vitalSigns": {
            "bloodPressure": "120/80",
            "heartRate": 72,
            "temperature": 38.5
          }
        },
        "notes": [
          {
            "_id": "note_id",
            "content": "Patient responded well to treatment",
            "addedBy": {
              "_id": "user_id",
              "firstName": "Jane",
              "lastName": "Smith"
            },
            "addedAt": "2024-01-15T10:00:00Z",
            "type": "clinical"
          }
        ],
        "followUp": {
          "required": true,
          "scheduledDate": "2024-01-20T10:00:00Z",
          "completed": false
        },
        "referral": {
          "generated": true,
          "generatedAt": "2024-01-15T10:00:00Z",
          "specialty": "cardiology",
          "urgency": "routine",
          "status": "pending"
        },
        "status": "active",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "count": 10,
      "totalRecords": 45
    },
    "patient": {
      "id": "patient_id",
      "name": "John Doe",
      "age": 35,
      "gender": "male"
    }
  }
}
```

### 2. Add Diagnostic History Note

#### Add Note to Diagnostic History
```http
POST /diagnostics/history/:historyId/notes
```

**Parameters:**
- `historyId` (path, required): Diagnostic history ID

**Request Body:**
```json
{
  "content": "Patient responded well to treatment",
  "type": "clinical"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "noteId": "note_id",
    "addedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 3. Diagnostic Analytics

#### Get Diagnostic Analytics
```http
GET /diagnostics/analytics
```

**Parameters:**
- `dateFrom` (query, optional): Start date (YYYY-MM-DD)
- `dateTo` (query, optional): End date (YYYY-MM-DD)
- `patientId` (query, optional): Filter by patient ID

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCases": 156,
      "averageConfidence": 87.5,
      "averageProcessingTime": 2000,
      "completedCases": 142,
      "pendingFollowUps": 14,
      "referralsGenerated": 23
    },
    "topDiagnoses": [
      {
        "condition": "Viral infection",
        "count": 45,
        "averageConfidence": 85
      }
    ],
    "completionTrends": [
      {
        "_id": "2024-01-15",
        "casesCreated": 12,
        "casesCompleted": 10
      }
    ],
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    }
  }
}
```

### 4. All Diagnostic Cases

#### Get All Diagnostic Cases
```http
GET /diagnostics/cases/all
```

**Parameters:**
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20)
- `status` (query, optional): Filter by status
- `patientId` (query, optional): Filter by patient ID
- `search` (query, optional): Search term
- `sortBy` (query, optional): Sort field (default: createdAt)
- `sortOrder` (query, optional): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "_id": "case_id",
        "caseId": "DX-001",
        "patientId": {
          "_id": "patient_id",
          "firstName": "John",
          "lastName": "Doe",
          "age": 35,
          "gender": "male"
        },
        "pharmacistId": {
          "_id": "pharmacist_id",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "symptoms": {
          "subjective": ["headache", "fatigue"],
          "objective": ["fever"],
          "duration": "3 days",
          "severity": "moderate",
          "onset": "acute"
        },
        "status": "completed",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 8,
      "count": 20,
      "totalCases": 156
    },
    "filters": {
      "status": "completed",
      "search": "headache",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 5. Diagnostic Referrals

#### Get Diagnostic Referrals
```http
GET /diagnostics/referrals
```

**Parameters:**
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20)
- `status` (query, optional): Filter by referral status
- `specialty` (query, optional): Filter by specialty

**Response:**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "_id": "referral_id",
        "patientId": {
          "_id": "patient_id",
          "firstName": "John",
          "lastName": "Doe",
          "age": 35,
          "gender": "male"
        },
        "pharmacistId": {
          "_id": "pharmacist_id",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "caseId": "DX-001",
        "referral": {
          "generated": true,
          "generatedAt": "2024-01-15T10:00:00Z",
          "specialty": "cardiology",
          "urgency": "routine",
          "status": "pending"
        },
        "analysisSnapshot": {
          "referralRecommendation": {
            "recommended": true,
            "urgency": "routine",
            "specialty": "cardiology",
            "reason": "Abnormal ECG findings require specialist evaluation"
          }
        },
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 3,
      "count": 20,
      "totalReferrals": 45
    },
    "statistics": {
      "pending": 15,
      "sent": 20,
      "acknowledged": 8,
      "completed": 2
    },
    "filters": {
      "status": "pending",
      "specialty": "cardiology"
    }
  }
}
```

### 6. Export Diagnostic History

#### Export as PDF
```http
GET /diagnostics/history/:historyId/export/pdf
```

**Parameters:**
- `historyId` (path, required): Diagnostic history ID
- `purpose` (query, optional): Export purpose (patient_record, referral, consultation, audit)

**Response:** Binary PDF file

#### Export as Word Document
```http
GET /diagnostics/history/:historyId/export/docx
```

**Parameters:**
- `historyId` (path, required): Diagnostic history ID
- `purpose` (query, optional): Export purpose

**Response:** Binary DOCX file

#### Export as JSON
```http
GET /diagnostics/history/:historyId/export/json
```

**Parameters:**
- `historyId` (path, required): Diagnostic history ID
- `purpose` (query, optional): Export purpose

**Response:**
```json
{
  "success": true,
  "data": {
    // Complete diagnostic history object with all fields
  }
}
```

### 7. Generate Referral Document

#### Generate Referral Document
```http
POST /diagnostics/history/:historyId/referral/generate
```

**Parameters:**
- `historyId` (path, required): Diagnostic history ID

**Request Body:**
```json
{
  "specialty": "cardiology"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral document generated successfully",
  "data": {
    "referralId": "REF-123456",
    "documentUrl": "/api/diagnostics/referrals/REF-123456/document"
  }
}
```

### 8. Compare Diagnostic Histories

#### Compare Two Diagnostic Histories
```http
POST /diagnostics/history/compare
```

**Request Body:**
```json
{
  "historyId1": "history_id_1",
  "historyId2": "history_id_2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "diagnosisChanges": [
        "Added: Bacterial infection",
        "Removed: Viral infection"
      ],
      "confidenceChange": 5,
      "newSymptoms": ["chest pain"],
      "resolvedSymptoms": ["headache"],
      "medicationChanges": [
        "Added: Amoxicillin",
        "Discontinued: Paracetamol"
      ],
      "improvementScore": 15
    },
    "recommendations": [
      "Diagnostic confidence has improved significantly",
      "Patient shows symptom improvement",
      "Review medication changes and their effects"
    ]
  }
}
```

## Patient Integration Endpoints

### Get Patient Diagnostic History
```http
GET /patients/:patientId/diagnostic-history
```

Same as `/diagnostics/patients/:patientId/history` but accessed through patient routes.

### Get Patient Diagnostic Summary
```http
GET /patients/:patientId/diagnostic-summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "patient_id",
      "name": "John Doe",
      "age": 35,
      "gender": "male"
    },
    "diagnosticSummary": {
      "totalCases": 5,
      "pendingFollowUps": 2,
      "referralsGenerated": 1,
      "latestCase": {
        "id": "history_id",
        "caseId": "DX-001",
        "createdAt": "2024-01-15T10:00:00Z",
        "pharmacist": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "confidenceScore": 85
      }
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "content",
      "message": "Note content is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Diagnostic history not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message (development only)"
}
```

## Rate Limits

- General diagnostic endpoints: 100 requests per 15 minutes
- AI diagnostic requests: 10 requests per 15 minutes
- Export endpoints: 20 requests per hour

## Data Models

### DiagnosticHistory Schema
```typescript
interface DiagnosticHistory {
  _id: string;
  patientId: string;
  caseId: string;
  diagnosticCaseId: string;
  pharmacistId: ObjectId;
  workplaceId: ObjectId;
  analysisSnapshot: {
    differentialDiagnoses: DiagnosisItem[];
    recommendedTests: TestItem[];
    therapeuticOptions: TherapyItem[];
    redFlags: RedFlagItem[];
    referralRecommendation?: ReferralRecommendation;
    disclaimer: string;
    confidenceScore: number;
    processingTime: number;
  };
  clinicalContext: {
    symptoms: SymptomData;
    vitalSigns?: VitalSigns;
    currentMedications?: Medication[];
    labResults?: LabResult[];
  };
  notes: Note[];
  followUp: FollowUpData;
  referral?: ReferralData;
  exports: ExportRecord[];
  auditTrail: AuditTrail;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Examples

### JavaScript/TypeScript
```typescript
// Get patient diagnostic history
const response = await fetch('/api/diagnostics/patients/patient123/history', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Add note to diagnostic history
await fetch('/api/diagnostics/history/history123/notes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Patient responded well to treatment',
    type: 'clinical'
  })
});

// Get analytics
const analyticsResponse = await fetch('/api/diagnostics/analytics?dateFrom=2024-01-01&dateTo=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL Examples
```bash
# Get patient diagnostic history
curl -X GET "https://api.example.com/api/diagnostics/patients/patient123/history" \
  -H "Authorization: Bearer your-token"

# Add diagnostic note
curl -X POST "https://api.example.com/api/diagnostics/history/history123/notes" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"content": "Patient responded well", "type": "clinical"}'

# Export as PDF
curl -X GET "https://api.example.com/api/diagnostics/history/history123/export/pdf?purpose=referral" \
  -H "Authorization: Bearer your-token" \
  --output diagnostic-history.pdf
```

## Best Practices

1. **Pagination**: Always use pagination for list endpoints to avoid performance issues
2. **Filtering**: Use appropriate filters to reduce data transfer
3. **Caching**: Implement client-side caching for analytics data
4. **Error Handling**: Always handle error responses appropriately
5. **Rate Limiting**: Respect rate limits and implement exponential backoff
6. **Security**: Never expose sensitive patient data in logs or error messages
7. **Audit Trail**: All access to diagnostic data is logged for compliance