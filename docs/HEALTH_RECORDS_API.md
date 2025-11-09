# Patient Health Records API Documentation

## Overview
Comprehensive API documentation for the Patient Health Records system including lab interpretations, vitals verification, visit summaries, notifications, and appointment integration.

**Version:** 1.0.0  
**Base URL:** `/api`  
**Authentication:** Required for all endpoints (JWT Bearer token)

---

## Table of Contents
1. [Lab Interpretations API](#lab-interpretations-api)
2. [Vitals Verification API](#vitals-verification-api)
3. [Visit Summaries API](#visit-summaries-api)
4. [Workspace Health Records API](#workspace-health-records-api)
5. [Patient Notifications API](#patient-notifications-api)
6. [Appointment Health Records API](#appointment-health-records-api)
7. [Super Admin Health Records API](#super-admin-health-records-api)

---

## Lab Interpretations API

### Add Patient-Friendly Interpretation
Add or update a patient-friendly interpretation for lab results.

**Endpoint:** `POST /pharmacist/lab-interpretation/:caseId`  
**Auth:** Pharmacist/Admin  
**Rate Limit:** 100 requests per 15 minutes

**Path Parameters:**
- `caseId` (string, required): MongoDB ObjectId of the diagnostic case

**Request Body:**
```json
{
  "summary": "Your blood sugar levels are higher than normal...",
  "detailedExplanation": "Detailed explanation of the results...",
  "keyFindings": [
    "Blood glucose: 180 mg/dL (High)",
    "HbA1c: 7.5% (Above target)"
  ],
  "recommendations": [
    "Monitor blood sugar daily",
    "Follow prescribed medication schedule"
  ],
  "nextSteps": [
    "Schedule follow-up in 2 weeks",
    "Bring blood sugar log to next visit"
  ],
  "isVisibleToPatient": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lab interpretation added successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "caseId": "LAB-2024-001",
    "patientInterpretation": {
      "summary": "Your blood sugar levels are higher than normal...",
      "detailedExplanation": "...",
      "keyFindings": [...],
      "recommendations": [...],
      "nextSteps": [...],
      "isVisibleToPatient": true,
      "interpretedBy": "60f7b3b3b3b3b3b3b3b3b3b4",
      "interpretedByName": "Dr. John Smith",
      "interpretedAt": "2024-11-09T10:30:00Z"
    }
  }
}
```

### Get Lab Interpretation
Retrieve patient-friendly interpretation for a specific lab result.

**Endpoint:** `GET /pharmacist/lab-interpretation/:caseId`  
**Auth:** Pharmacist/Admin

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "caseId": "LAB-2024-001",
    "patientInterpretation": { /* interpretation object */ },
    "labResults": [ /* array of test results */ ]
  }
}
```

### Toggle Patient Visibility
Show or hide interpretation from patient view.

**Endpoint:** `PATCH /pharmacist/lab-interpretation/:caseId/visibility`  
**Auth:** Pharmacist/Admin

**Request Body:**
```json
{
  "isVisibleToPatient": true
}
```

### List Cases Requiring Interpretation
Get all lab results that need interpretation.

**Endpoint:** `GET /pharmacist/lab-interpretation/pending`  
**Auth:** Pharmacist/Admin  
**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "_id": "...",
        "caseId": "LAB-2024-001",
        "patientId": { "firstName": "John", "lastName": "Doe" },
        "testDate": "2024-11-09T10:00:00Z",
        "status": "completed",
        "hasInterpretation": false,
        "labResults": [...]
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

## Vitals Verification API

### Get Unverified Vitals
Retrieve all patient-logged vitals awaiting verification.

**Endpoint:** `GET /pharmacist/vitals/unverified`  
**Auth:** Pharmacist/Admin  
**Rate Limit:** 100 requests per 15 minutes

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Results per page (default: 50)
- `patientId` (string, optional): Filter by specific patient

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "vitals": [
      {
        "vitalId": "...",
        "patientId": "...",
        "patientName": "John Doe",
        "patientEmail": "john@example.com",
        "recordedDate": "2024-11-09T08:00:00Z",
        "bloodPressure": { "systolic": 120, "diastolic": 80 },
        "heartRate": 72,
        "temperature": 36.6,
        "weight": 70,
        "glucose": 95,
        "oxygenSaturation": 98,
        "isVerified": false,
        "notes": "Measured after morning walk"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### Verify Single Vital Record
Mark a specific vital record as verified by pharmacist.

**Endpoint:** `POST /pharmacist/vitals/:patientId/:vitalId/verify`  
**Auth:** Pharmacist/Admin

**Request Body:**
```json
{
  "verificationNotes": "Readings are within normal range"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vital record verified successfully",
  "data": {
    "vitalId": "...",
    "isVerified": true,
    "verifiedBy": "Dr. Jane Smith",
    "verifiedAt": "2024-11-09T11:00:00Z",
    "verificationNotes": "Readings are within normal range"
  }
}
```

### Bulk Verify Vitals
Verify multiple vital records at once.

**Endpoint:** `POST /pharmacist/vitals/bulk-verify`  
**Auth:** Pharmacist/Admin

**Request Body:**
```json
{
  "vitals": [
    {
      "patientId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "vitalId": "60f7b3b3b3b3b3b3b3b3b3b4"
    }
  ],
  "verificationNotes": "Batch verified - all readings normal"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "3 vital records verified successfully",
  "data": {
    "verifiedCount": 3,
    "failedCount": 0,
    "results": [...]
  }
}
```

### Get Patient Vitals History
Retrieve all vitals for a specific patient.

**Endpoint:** `GET /pharmacist/vitals/:patientId`  
**Auth:** Pharmacist/Admin

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "patientId": "...",
    "patientName": "John Doe",
    "vitals": [
      {
        "vitalId": "...",
        "recordedDate": "2024-11-09T08:00:00Z",
        "bloodPressure": { "systolic": 120, "diastolic": 80 },
        "heartRate": 72,
        "isVerified": true,
        "verifiedBy": "Dr. Jane Smith",
        "verifiedAt": "2024-11-09T11:00:00Z"
      }
    ],
    "stats": {
      "totalRecords": 25,
      "verifiedRecords": 20,
      "pendingVerification": 5
    }
  }
}
```

---

## Visit Summaries API

### Create Patient Summary
Create a patient-friendly summary for a visit.

**Endpoint:** `POST /pharmacist/visit-summary/:visitId`  
**Auth:** Pharmacist/Admin  
**Rate Limit:** 100 requests per 15 minutes

**Request Body:**
```json
{
  "summary": "We discussed your blood pressure management today...",
  "keyPoints": [
    "Blood pressure slightly elevated",
    "Medication dosage adjusted",
    "Lifestyle modifications discussed"
  ],
  "nextSteps": [
    "Take new medication as prescribed",
    "Monitor blood pressure daily",
    "Schedule follow-up in 2 weeks"
  ],
  "visibleToPatient": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient summary created successfully",
  "data": {
    "visitId": "...",
    "patientSummary": {
      "summary": "...",
      "keyPoints": [...],
      "nextSteps": [...],
      "visibleToPatient": true,
      "createdBy": "Dr. John Smith",
      "createdAt": "2024-11-09T15:30:00Z"
    }
  }
}
```

### Update Patient Summary
Update an existing visit summary.

**Endpoint:** `PUT /pharmacist/visit-summary/:visitId`  
**Auth:** Pharmacist/Admin

**Request Body:** Same as create

### Toggle Summary Visibility
Control patient access to visit summary.

**Endpoint:** `PATCH /pharmacist/visit-summary/:visitId/visibility`  
**Auth:** Pharmacist/Admin

**Request Body:**
```json
{
  "visibleToPatient": true
}
```

### Get Visit Summary
Retrieve summary for a specific visit.

**Endpoint:** `GET /pharmacist/visit-summary/:visitId`  
**Auth:** Pharmacist/Admin

### List Visits Needing Summary
Get visits without patient summaries.

**Endpoint:** `GET /pharmacist/visit-summary/pending`  
**Auth:** Pharmacist/Admin

**Query Parameters:**
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range filter

---

## Appointment Health Records API

### Get Appointment Health Records
Retrieve all health records associated with an appointment.

**Endpoint:** `GET /appointments/:appointmentId/health-records`  
**Auth:** Pharmacist/Admin  
**Rate Limit:** 100 requests per 15 minutes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "appointmentId": "...",
    "summary": {
      "totalRecords": 12,
      "labResults": 3,
      "visits": 2,
      "vitals": 7,
      "hasInterpretations": 2,
      "hasSummaries": 1,
      "verifiedVitals": 5
    },
    "timeline": [
      {
        "type": "lab_result",
        "timestamp": "2024-11-09T10:30:00Z",
        "id": "...",
        "data": {
          "caseId": "LAB-2024-001",
          "status": "completed",
          "hasInterpretation": true,
          "isVisibleToPatient": true
        }
      }
    ],
    "labResults": [...],
    "visits": [...],
    "vitals": [...]
  }
}
```

### Get Appointment Health Records Summary
Lightweight endpoint returning only counts.

**Endpoint:** `GET /appointments/:appointmentId/health-records/summary`  
**Auth:** Pharmacist/Admin

---

## Super Admin Health Records API

### Get Analytics
Aggregate health records statistics across all workspaces.

**Endpoint:** `GET /super-admin/health-records/analytics`  
**Auth:** Super Admin  
**Rate Limit:** 200 requests per 15 minutes

**Query Parameters:**
- `workspaceId` (string, optional): Filter by workspace
- `startDate` (ISO8601, optional): Start date for date range
- `endDate` (ISO8601, optional): End date for date range

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "labResults": {
        "totalLabResults": 1500,
        "completedLabResults": 1350,
        "pendingLabResults": 150,
        "withInterpretations": 900,
        "visibleToPatient": 850,
        "abnormalResults": 250
      },
      "vitals": {
        "totalVitalsRecords": 3200,
        "verifiedVitals": 2800,
        "pendingVerification": 400
      },
      "visits": {
        "totalVisits": 1100,
        "withSummaries": 750,
        "summariesVisible": 700
      }
    },
    "workspaceBreakdown": [
      {
        "workspaceId": "...",
        "workspaceName": "Central Pharmacy",
        "labResults": 450
      }
    ],
    "trends": {
      "labResults": [
        { "_id": "2024-11-01", "count": 45 },
        { "_id": "2024-11-02", "count": 52 }
      ],
      "vitals": [...],
      "visits": [...]
    }
  }
}
```

### Get Health Records by Workspace
Filter all health records for a specific workspace.

**Endpoint:** `GET /super-admin/health-records/by-workspace`  
**Auth:** Super Admin

**Query Parameters:**
- `workspaceId` (string, required): Workspace ID
- `type` (string, optional): Filter by type (lab | vitals | visits)
- `page`, `limit`: Pagination

### Global Search
Search across all health records.

**Endpoint:** `GET /super-admin/health-records/search`  
**Auth:** Super Admin

**Query Parameters:**
- `query` (string, required, min: 2 chars): Search query
- `type`, `workspaceId`, `status`, `startDate`, `endDate`: Filters
- `page`, `limit`: Pagination

### List All Workspaces with Summary
Get all workspaces with health records statistics.

**Endpoint:** `GET /super-admin/health-records/workspaces`  
**Auth:** Super Admin

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalWorkspaces": 25,
    "workspaces": [
      {
        "workspaceId": "...",
        "name": "Central Pharmacy",
        "email": "central@pharmacy.com",
        "phone": "+1234567890",
        "locations": [...],
        "healthRecordsSummary": {
          "labResults": 450,
          "visits": 320,
          "vitals": 1200,
          "patients": 180,
          "totalRecords": 1970
        }
      }
    ]
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "summary",
      "message": "Summary is required"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (dev mode only)"
}
```

---

## Rate Limiting

- **Standard endpoints:** 100 requests per 15 minutes
- **Super Admin endpoints:** 200 requests per 15 minutes
- Rate limits are per IP address and user account
- Headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Authentication

All endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 24 hours and must be refreshed.

---

## Changelog

### Version 1.0.0 (2024-11-09)
- Initial release
- Lab interpretations API
- Vitals verification API
- Visit summaries API
- Appointment health records API
- Super Admin analytics API
- Patient notifications API
