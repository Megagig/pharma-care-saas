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
- `page` - Page number
- `limit` - Items per page
- `type` - Note type filter
- `priority` - Priority filter

#### POST /notes
Create a new clinical note.

**Request Body:**
```json
{
  "patient": "patient_id",
  "type": "medication_review",
  "title": "Hypertension Medication Review",
  "content": {
    "subjective": "Patient reports feeling dizzy...",
    "objective": "BP: 145/92 mmHg...",
    "assessment": "Suboptimal blood pressure control...",
    "plan": "Increase Lisinopril to 15mg daily..."
  },
  "priority": "medium"
}
```

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