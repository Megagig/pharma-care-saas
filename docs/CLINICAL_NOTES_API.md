# Clinical Notes API Documentation

## Overview

The Clinical Notes API provides comprehensive functionality for managing clinical documentation in the pharmaceutical care application. This API supports SOAP (Subjective, Objective, Assessment, Plan) note creation, advanced search capabilities, file attachments, and robust security controls.

## Base URL

```
/api/notes
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Data Models

### Clinical Note

```typescript
interface ClinicalNote {
  _id: string;
  patient: ObjectId | PopulatedPatient;
  pharmacist: ObjectId | PopulatedUser;
  workplaceId: ObjectId;
  locationId?: string;
  type:
    | 'consultation'
    | 'medication_review'
    | 'follow_up'
    | 'adverse_event'
    | 'other';
  title: string;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  medications: ObjectId[];
  vitalSigns?: VitalSigns;
  laborResults: LabResult[];
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments: Attachment[];
  priority: 'low' | 'medium' | 'high';
  isConfidential: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  lastModifiedBy: ObjectId;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}
```

### Supporting Interfaces

```typescript
interface VitalSigns {
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
  };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  recordedAt?: Date;
}

interface LabResult {
  test: string;
  result: string;
  normalRange: string;
  date: Date;
  status: 'normal' | 'abnormal' | 'critical';
}

interface Attachment {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: ObjectId;
}
```

## Endpoints

### 1. List Clinical Notes

**GET** `/api/notes`

Retrieves a paginated list of clinical notes for the authenticated user's workplace.

#### Query Parameters

| Parameter | Type   | Required | Description                                        |
| --------- | ------ | -------- | -------------------------------------------------- |
| page      | number | No       | Page number (default: 1)                           |
| limit     | number | No       | Items per page (default: 10, max: 100)             |
| sortBy    | string | No       | Sort field (createdAt, updatedAt, title, priority) |
| sortOrder | string | No       | Sort direction (asc, desc)                         |

#### Response

```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "patient": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "firstName": "John",
          "lastName": "Doe",
          "mrn": "MRN001"
        },
        "pharmacist": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "firstName": "Dr. Jane",
          "lastName": "Smith"
        },
        "type": "consultation",
        "title": "Initial Consultation",
        "priority": "medium",
        "isConfidential": false,
        "createdAt": "2023-09-06T10:30:00.000Z",
        "updatedAt": "2023-09-06T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Single Clinical Note

**GET** `/api/notes/:id`

Retrieves a specific clinical note by ID.

#### Path Parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| id        | string | Yes      | Clinical note ID |

#### Response

```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "patient": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "firstName": "John",
      "lastName": "Doe",
      "mrn": "MRN001"
    },
    "pharmacist": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "firstName": "Dr. Jane",
      "lastName": "Smith"
    },
    "workplaceId": "64f8a1b2c3d4e5f6a7b8c9d3",
    "type": "consultation",
    "title": "Initial Consultation",
    "content": {
      "subjective": "Patient reports mild headache for 2 days",
      "objective": "BP: 120/80, HR: 72, Temp: 98.6°F",
      "assessment": "Tension headache, likely stress-related",
      "plan": "Recommend OTC pain relief and stress management"
    },
    "medications": [],
    "vitalSigns": {
      "bloodPressure": {
        "systolic": 120,
        "diastolic": 80
      },
      "heartRate": 72,
      "temperature": 98.6,
      "recordedAt": "2023-09-06T10:30:00.000Z"
    },
    "laborResults": [],
    "recommendations": [
      "Follow up in 1 week if symptoms persist",
      "Monitor blood pressure"
    ],
    "followUpRequired": true,
    "followUpDate": "2023-09-13T10:30:00.000Z",
    "attachments": [],
    "priority": "medium",
    "isConfidential": false,
    "tags": ["headache", "consultation"],
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

### 3. Create Clinical Note

**POST** `/api/notes`

Creates a new clinical note.

#### Request Body

```json
{
  "patient": "64f8a1b2c3d4e5f6a7b8c9d1",
  "type": "consultation",
  "title": "Initial Consultation",
  "content": {
    "subjective": "Patient reports mild headache for 2 days",
    "objective": "BP: 120/80, HR: 72, Temp: 98.6°F",
    "assessment": "Tension headache, likely stress-related",
    "plan": "Recommend OTC pain relief and stress management"
  },
  "medications": [],
  "vitalSigns": {
    "bloodPressure": {
      "systolic": 120,
      "diastolic": 80
    },
    "heartRate": 72,
    "temperature": 98.6
  },
  "laborResults": [],
  "recommendations": [
    "Follow up in 1 week if symptoms persist",
    "Monitor blood pressure"
  ],
  "followUpRequired": true,
  "followUpDate": "2023-09-13T10:30:00.000Z",
  "priority": "medium",
  "isConfidential": false,
  "tags": ["headache", "consultation"]
}
```

#### Response

```json
{
  "success": true,
  "message": "Clinical note created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0"
    // ... full note object
  }
}
```

### 4. Update Clinical Note

**PUT** `/api/notes/:id`

Updates an existing clinical note.

#### Path Parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| id        | string | Yes      | Clinical note ID |

#### Request Body

Same as create request, but all fields are optional.

#### Response

```json
{
  "success": true,
  "message": "Clinical note updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0"
    // ... updated note object
  }
}
```

### 5. Delete Clinical Note

**DELETE** `/api/notes/:id`

Soft deletes a clinical note (marks as deleted but preserves data).

#### Path Parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| id        | string | Yes      | Clinical note ID |

#### Response

```json
{
  "success": true,
  "message": "Clinical note deleted successfully"
}
```

### 6. Search Clinical Notes

**GET** `/api/notes/search`

Performs full-text search across clinical notes.

#### Query Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| q         | string | Yes      | Search query                 |
| page      | number | No       | Page number (default: 1)     |
| limit     | number | No       | Items per page (default: 10) |

#### Response

Same format as list notes, but filtered by search results.

### 7. Filter Clinical Notes

**GET** `/api/notes/filter`

Filters clinical notes by various criteria.

#### Query Parameters

| Parameter        | Type    | Required | Description                          |
| ---------------- | ------- | -------- | ------------------------------------ |
| patientId        | string  | No       | Filter by patient ID                 |
| type             | string  | No       | Filter by note type                  |
| priority         | string  | No       | Filter by priority                   |
| isConfidential   | boolean | No       | Filter by confidentiality            |
| dateFrom         | string  | No       | Filter by creation date (ISO format) |
| dateTo           | string  | No       | Filter by creation date (ISO format) |
| tags             | string  | No       | Comma-separated list of tags         |
| followUpRequired | boolean | No       | Filter by follow-up requirement      |

#### Response

Same format as list notes, but filtered by criteria.

### 8. Get Patient Notes

**GET** `/api/notes/patient/:patientId`

Retrieves all notes for a specific patient.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| patientId | string | Yes      | Patient ID  |

#### Response

Same format as list notes, but filtered by patient.

### 9. Get Note Statistics

**GET** `/api/notes/statistics`

Retrieves statistics about clinical notes for the workplace.

#### Response

```json
{
  "success": true,
  "data": {
    "totalNotes": 150,
    "notesByType": {
      "consultation": 60,
      "medication_review": 40,
      "follow_up": 30,
      "adverse_event": 15,
      "other": 5
    },
    "notesByPriority": {
      "low": 50,
      "medium": 80,
      "high": 20
    },
    "confidentialNotes": 25,
    "notesWithFollowUp": 45,
    "recentActivity": {
      "last7Days": 12,
      "last30Days": 45
    }
  }
}
```

### 10. Bulk Update Notes

**POST** `/api/notes/bulk/update`

Updates multiple notes at once.

#### Request Body

```json
{
  "noteIds": ["64f8a1b2c3d4e5f6a7b8c9d0", "64f8a1b2c3d4e5f6a7b8c9d1"],
  "updates": {
    "priority": "high",
    "tags": ["urgent", "review"]
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "2 notes updated successfully",
  "data": {
    "updatedCount": 2,
    "failedUpdates": []
  }
}
```

### 11. Bulk Delete Notes

**POST** `/api/notes/bulk/delete`

Soft deletes multiple notes at once.

#### Request Body

```json
{
  "noteIds": ["64f8a1b2c3d4e5f6a7b8c9d0", "64f8a1b2c3d4e5f6a7b8c9d1"]
}
```

#### Response

```json
{
  "success": true,
  "message": "2 notes deleted successfully",
  "data": {
    "deletedCount": 2,
    "failedDeletions": []
  }
}
```

## File Attachment Endpoints

### 12. Upload Attachment

**POST** `/api/notes/:id/attachments`

Uploads file attachments to a clinical note.

#### Path Parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| id        | string | Yes      | Clinical note ID |

#### Request Body

Multipart form data with files field containing up to 5 files.

#### Response

```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "attachments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "fileName": "lab_results_20230906.pdf",
        "originalName": "Lab Results.pdf",
        "mimeType": "application/pdf",
        "size": 1024000,
        "url": "/uploads/notes/64f8a1b2c3d4e5f6a7b8c9d0/lab_results_20230906.pdf",
        "uploadedAt": "2023-09-06T10:30:00.000Z",
        "uploadedBy": "64f8a1b2c3d4e5f6a7b8c9d2"
      }
    ]
  }
}
```

### 13. Delete Attachment

**DELETE** `/api/notes/:id/attachments/:attachmentId`

Deletes a file attachment from a clinical note.

#### Path Parameters

| Parameter    | Type   | Required | Description      |
| ------------ | ------ | -------- | ---------------- |
| id           | string | Yes      | Clinical note ID |
| attachmentId | string | Yes      | Attachment ID    |

#### Response

```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

### 14. Download Attachment

**GET** `/api/notes/:id/attachments/:attachmentId/download`

Downloads a file attachment from a clinical note.

#### Path Parameters

| Parameter    | Type   | Required | Description      |
| ------------ | ------ | -------- | ---------------- |
| id           | string | Yes      | Clinical note ID |
| attachmentId | string | Yes      | Attachment ID    |

#### Response

Binary file data with appropriate headers for download.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

### Common Error Codes

| Code              | Description                         |
| ----------------- | ----------------------------------- |
| VALIDATION_ERROR  | Request validation failed           |
| NOT_FOUND         | Resource not found                  |
| UNAUTHORIZED      | Authentication required             |
| FORBIDDEN         | Insufficient permissions            |
| CONFLICT          | Resource conflict (e.g., duplicate) |
| INTERNAL_ERROR    | Server error                        |
| FILE_TOO_LARGE    | Uploaded file exceeds size limit    |
| INVALID_FILE_TYPE | Unsupported file type               |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Standard endpoints: 100 requests per minute per user
- Search endpoints: 30 requests per minute per user
- File upload endpoints: 10 requests per minute per user

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based access control (RBAC) enforced
3. **Tenancy**: Data isolation by workplace
4. **Audit Logging**: All operations are logged for compliance
5. **File Security**: Uploaded files are scanned and validated
6. **Data Encryption**: Sensitive data encrypted at rest and in transit

## Pagination

List endpoints support cursor-based pagination:

```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "eyJfaWQiOiI2NGY4YTFiMmMzZDRlNWY2YTdiOGM5ZDAifQ==",
    "prevCursor": null
  }
}
```

## Webhooks

The system supports webhooks for real-time notifications:

- `note.created`: Triggered when a new note is created
- `note.updated`: Triggered when a note is updated
- `note.deleted`: Triggered when a note is deleted
- `attachment.uploaded`: Triggered when an attachment is uploaded

## SDK and Client Libraries

Official client libraries are available for:

- JavaScript/TypeScript (npm: @byterover/clinical-notes-client)
- Python (pip: byterover-clinical-notes)
- PHP (composer: byterover/clinical-notes)

## Support

For API support and questions:

- Documentation: https://docs.byterover.com/clinical-notes
- Support Email: api-support@byterover.com
- GitHub Issues: https://github.com/byterover/clinical-notes/issues
