# PharmaCare SaaS API Documentation

## Overview

This document provides comprehensive documentation for the PharmaCare SaaS REST API.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register

Register a new pharmacist account.

**Request Body:**

```json
{
   "firstName": "John",
   "lastName": "Doe",
   "email": "john.doe@example.com",
   "password": "securepassword",
   "licenseNumber": "12345678",
   "pharmacyName": "Community Health Pharmacy",
   "phoneNumber": "+1 (555) 123-4567"
}
```

#### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body:**

```json
{
   "email": "john.doe@example.com",
   "password": "securepassword"
}
```

#### GET /auth/me

Get current user information (requires authentication).

### Patients

#### GET /patients

Get list of patients for authenticated pharmacist.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name

#### POST /patients

Create a new patient record.

**Request Body:**

```json
{
   "firstName": "Sarah",
   "lastName": "Johnson",
   "dateOfBirth": "1958-03-15",
   "gender": "female",
   "contactInfo": {
      "phone": "(555) 123-4567",
      "email": "sarah.johnson@email.com"
   },
   "medicalInfo": {
      "allergies": ["Penicillin"],
      "chronicConditions": ["Hypertension"]
   }
}
```

#### GET /patients/:id

Get specific patient details.

#### PUT /patients/:id

Update patient information.

#### DELETE /patients/:id

Delete patient record.

### Clinical Notes

#### GET /notes

Get clinical notes for authenticated pharmacist.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (createdAt, updatedAt, title, priority)
- `sortOrder` - Sort direction (asc, desc)

#### POST /notes

Create a new clinical note.

**Request Body:**

```json
{
   "patient": "patient_id",
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
   "recommendations": ["Follow up in 1 week if symptoms persist"],
   "followUpRequired": true,
   "followUpDate": "2023-09-13T10:30:00.000Z",
   "priority": "medium",
   "isConfidential": false,
   "tags": ["headache", "consultation"]
}
```

#### GET /notes/:id

Get specific clinical note details.

#### PUT /notes/:id

Update existing clinical note.

#### DELETE /notes/:id

Soft delete clinical note.

#### GET /notes/search

Search clinical notes with full-text search.

**Query Parameters:**

- `q` - Search query (required)
- `page` - Page number
- `limit` - Items per page

#### GET /notes/filter

Filter clinical notes by various criteria.

**Query Parameters:**

- `patientId` - Filter by patient ID
- `type` - Filter by note type
- `priority` - Filter by priority
- `isConfidential` - Filter by confidentiality
- `dateFrom` - Filter by creation date (ISO format)
- `dateTo` - Filter by creation date (ISO format)
- `tags` - Comma-separated list of tags

#### GET /notes/patient/:patientId

Get all notes for a specific patient.

#### GET /notes/statistics

Get clinical notes statistics for the workplace.

#### POST /notes/bulk/update

Update multiple notes at once.

**Request Body:**

```json
{
   "noteIds": ["note_id_1", "note_id_2"],
   "updates": {
      "priority": "high",
      "tags": ["urgent", "review"]
   }
}
```

#### POST /notes/bulk/delete

Soft delete multiple notes at once.

**Request Body:**

```json
{
   "noteIds": ["note_id_1", "note_id_2"]
}
```

#### POST /notes/:id/attachments

Upload file attachments to a clinical note.

**Request:** Multipart form data with files field (max 5 files, 10MB each)

#### GET /notes/:id/attachments/:attachmentId/download

Download a file attachment from a clinical note.

#### DELETE /notes/:id/attachments/:attachmentId

Delete a file attachment from a clinical note.

**Note:** For detailed Clinical Notes API documentation, see [CLINICAL_NOTES_API.md](CLINICAL_NOTES_API.md)

### Medications

#### GET /medications

Get medications for authenticated pharmacist.

#### POST /medications

Add new medication for a patient.

**Request Body:**

```json
{
   "patient": "patient_id",
   "drugName": "Lisinopril",
   "strength": {
      "value": 10,
      "unit": "mg"
   },
   "dosageForm": "tablet",
   "instructions": {
      "dosage": "1 tablet",
      "frequency": "once daily"
   },
   "indication": "Hypertension"
}
```

### Subscriptions

#### GET /subscriptions/plans

Get available subscription plans.

#### GET /subscriptions

Get current user subscription.

#### PUT /subscriptions

Update subscription.

#### POST /subscriptions/cancel

Cancel subscription.

### Payments

#### GET /payments

Get payment history.

#### POST /payments

Create new payment.

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
   "message": "Error description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Data Validation

All input data is validated and sanitized. Required fields are marked in each endpoint specification.
