# Patient Engagement & Follow-up Management API Documentation

## Overview

The Patient Engagement & Follow-up Management API provides comprehensive endpoints for managing appointments, follow-up tasks, reminders, and pharmacist schedules. This API transforms PharmacyCopilot from an episodic care system to a continuous care platform.

## Base URL

```
Production: https://api.pharmacycopilot.com/api
Staging: https://staging-api.pharmacycopilot.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using JWT Bearer tokens:

```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **Standard endpoints**: 1000 requests per hour per user
- **Public endpoints**: 100 requests per hour per IP
- **Bulk operations**: 50 requests per hour per user

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid appointment date",
    "details": {
      "field": "scheduledDate",
      "value": "2025-10-20",
      "constraint": "Date must be in the future"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (e.g., appointment time conflict) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Data Models

### Appointment

```typescript
interface Appointment {
  _id: string;
  workplaceId: string;
  locationId?: string;
  patientId: string;
  assignedTo: string;
  type: 'mtm_session' | 'chronic_disease_review' | 'new_medication_consultation' | 
        'vaccination' | 'health_check' | 'smoking_cessation' | 'general_followup';
  title: string;
  description?: string;
  scheduledDate: string; // ISO date
  scheduledTime: string; // HH:mm format
  duration: number; // minutes
  timezone: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 
          'cancelled' | 'no_show' | 'rescheduled';
  confirmationStatus: 'pending' | 'confirmed' | 'declined';
  confirmedAt?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  reminders: Reminder[];
  relatedRecords: RelatedRecords;
  createdAt: string;
  updatedAt: string;
}
```

### Follow-up Task

```typescript
interface FollowUpTask {
  _id: string;
  workplaceId: string;
  patientId: string;
  assignedTo: string;
  type: 'medication_start_followup' | 'lab_result_review' | 'hospital_discharge_followup' |
        'medication_change_followup' | 'chronic_disease_monitoring' | 'adherence_check' |
        'refill_reminder' | 'preventive_care' | 'general_followup';
  title: string;
  description: string;
  objectives: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' | 'converted_to_appointment';
  trigger: TaskTrigger;
  relatedRecords: RelatedRecords;
  escalationHistory: EscalationRecord[];
  createdAt: string;
  updatedAt: string;
}
```

## Appointments API

### Create Appointment

Creates a new appointment for a patient.

**Endpoint:** `POST /appointments`

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "type": "mtm_session",
  "scheduledDate": "2025-10-25",
  "scheduledTime": "10:00",
  "duration": 30,
  "assignedTo": "507f1f77bcf86cd799439012",
  "description": "Monthly medication therapy review",
  "isRecurring": false,
  "patientPreferences": {
    "preferredChannel": "email",
    "language": "en"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439013",
      "patientId": "507f1f77bcf86cd799439011",
      "type": "mtm_session",
      "scheduledDate": "2025-10-25",
      "scheduledTime": "10:00",
      "duration": 30,
      "status": "scheduled",
      "confirmationStatus": "pending",
      "createdAt": "2025-10-24T10:00:00Z"
    },
    "reminders": [
      {
        "type": "email",
        "scheduledFor": "2025-10-24T10:00:00Z"
      }
    ]
  }
}
```

### Get Appointments (Calendar View)

Retrieves appointments for calendar display with filtering options.

**Endpoint:** `GET /appointments/calendar`

**Query Parameters:**
- `view` (required): `day` | `week` | `month`
- `date` (required): ISO date string (e.g., `2025-10-25`)
- `pharmacistId` (optional): Filter by pharmacist
- `locationId` (optional): Filter by location
- `status` (optional): Filter by status
- `type` (optional): Filter by appointment type

**Example Request:**
```http
GET /appointments/calendar?view=week&date=2025-10-25&pharmacistId=507f1f77bcf86cd799439012
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "patientId": "507f1f77bcf86cd799439011",
        "patient": {
          "name": "John Doe",
          "phone": "+234-xxx-xxxx"
        },
        "type": "mtm_session",
        "scheduledDate": "2025-10-25",
        "scheduledTime": "10:00",
        "duration": 30,
        "status": "scheduled"
      }
    ],
    "summary": {
      "total": 15,
      "byStatus": {
        "scheduled": 10,
        "completed": 5
      },
      "byType": {
        "mtm_session": 5,
        "health_check": 10
      }
    }
  }
}
```

### Update Appointment Status

Updates the status of an appointment (confirm, complete, cancel, etc.).

**Endpoint:** `PATCH /appointments/:id/status`

**Request Body:**
```json
{
  "status": "completed",
  "outcome": {
    "status": "successful",
    "notes": "Patient responded well to medication changes",
    "nextActions": ["Schedule follow-up in 3 months"],
    "visitCreated": true
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "completed",
      "completedAt": "2025-10-25T10:30:00Z",
      "outcome": {
        "status": "successful",
        "notes": "Patient responded well to medication changes"
      }
    }
  }
}
```

### Reschedule Appointment

Reschedules an appointment to a new date and time.

**Endpoint:** `POST /appointments/:id/reschedule`

**Request Body:**
```json
{
  "newDate": "2025-10-27",
  "newTime": "15:00",
  "reason": "Patient requested change",
  "notifyPatient": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439013",
      "scheduledDate": "2025-10-27",
      "scheduledTime": "15:00",
      "rescheduledFrom": "2025-10-25T10:00:00Z",
      "rescheduledAt": "2025-10-24T14:30:00Z"
    },
    "notificationSent": true
  }
}
```

### Get Available Slots

Retrieves available appointment slots for a specific date and criteria.

**Endpoint:** `GET /appointments/available-slots`

**Query Parameters:**
- `date` (required): ISO date string
- `pharmacistId` (optional): Specific pharmacist
- `duration` (optional): Appointment duration in minutes
- `type` (optional): Appointment type

**Example Request:**
```http
GET /appointments/available-slots?date=2025-10-25&duration=30&type=mtm_session
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "time": "09:00",
        "available": true,
        "pharmacistId": "507f1f77bcf86cd799439012",
        "pharmacistName": "Dr. Jane Smith"
      },
      {
        "time": "09:30",
        "available": true,
        "pharmacistId": "507f1f77bcf86cd799439012",
        "pharmacistName": "Dr. Jane Smith"
      },
      {
        "time": "10:00",
        "available": false,
        "reason": "Already booked"
      }
    ],
    "pharmacists": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Jane Smith",
        "specializations": ["MTM", "Chronic Disease Management"]
      }
    ]
  }
}
```

## Follow-up Tasks API

### Create Follow-up Task

Creates a new follow-up task for a patient.

**Endpoint:** `POST /follow-ups`

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "type": "medication_start_followup",
  "title": "Follow-up for new Warfarin prescription",
  "description": "Check INR levels and assess for bleeding",
  "objectives": [
    "Review INR results",
    "Assess for bleeding symptoms",
    "Adjust dosage if needed"
  ],
  "priority": "high",
  "dueDate": "2025-10-30",
  "assignedTo": "507f1f77bcf86cd799439012",
  "trigger": {
    "type": "medication_start",
    "sourceId": "507f1f77bcf86cd799439014",
    "sourceType": "Medication"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "followUpTask": {
      "_id": "507f1f77bcf86cd799439015",
      "patientId": "507f1f77bcf86cd799439011",
      "type": "medication_start_followup",
      "title": "Follow-up for new Warfarin prescription",
      "priority": "high",
      "dueDate": "2025-10-30",
      "status": "pending",
      "createdAt": "2025-10-24T10:00:00Z"
    }
  }
}
```

### Get Follow-up Tasks

Retrieves follow-up tasks with filtering and pagination.

**Endpoint:** `GET /follow-ups`

**Query Parameters:**
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assignedTo` (optional): Filter by assigned pharmacist
- `patientId` (optional): Filter by patient
- `type` (optional): Filter by task type
- `overdue` (optional): `true` to show only overdue tasks
- `limit` (optional): Number of results (default: 50)
- `page` (optional): Page number (default: 1)

**Example Request:**
```http
GET /follow-ups?status=pending&priority=high&assignedTo=507f1f77bcf86cd799439012&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "patientId": "507f1f77bcf86cd799439011",
        "patient": {
          "name": "John Doe",
          "age": 65
        },
        "type": "medication_start_followup",
        "title": "Follow-up for new Warfarin prescription",
        "priority": "high",
        "dueDate": "2025-10-30",
        "status": "pending",
        "assignedTo": "507f1f77bcf86cd799439012"
      }
    ],
    "summary": {
      "total": 25,
      "overdue": 5,
      "dueToday": 10,
      "byPriority": {
        "critical": 2,
        "high": 8,
        "medium": 12,
        "low": 3
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "totalItems": 25
    }
  }
}
```

### Complete Follow-up Task

Marks a follow-up task as completed with outcome details.

**Endpoint:** `POST /follow-ups/:id/complete`

**Request Body:**
```json
{
  "outcome": {
    "status": "successful",
    "notes": "INR levels within target range. Patient reports no bleeding symptoms.",
    "nextActions": [
      "Continue current Warfarin dose",
      "Schedule next INR check in 4 weeks"
    ],
    "appointmentCreated": false
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439015",
      "status": "completed",
      "completedAt": "2025-10-28T14:30:00Z",
      "outcome": {
        "status": "successful",
        "notes": "INR levels within target range. Patient reports no bleeding symptoms."
      }
    }
  }
}
```

### Convert Follow-up to Appointment

Converts a follow-up task into a scheduled appointment.

**Endpoint:** `POST /follow-ups/:id/convert-to-appointment`

**Request Body:**
```json
{
  "scheduledDate": "2025-10-26",
  "scheduledTime": "10:00",
  "duration": 30,
  "type": "general_followup"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439016",
      "patientId": "507f1f77bcf86cd799439011",
      "type": "general_followup",
      "scheduledDate": "2025-10-26",
      "scheduledTime": "10:00",
      "status": "scheduled"
    },
    "task": {
      "_id": "507f1f77bcf86cd799439015",
      "status": "converted_to_appointment",
      "relatedRecords": {
        "appointmentId": "507f1f77bcf86cd799439016"
      }
    }
  }
}
```

## Reminders API

### Get Reminder Templates

Retrieves available reminder templates.

**Endpoint:** `GET /reminders/templates`

**Query Parameters:**
- `type` (optional): Filter by template type
- `isActive` (optional): Filter by active status

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "name": "24h Appointment Reminder",
        "type": "appointment",
        "category": "pre_appointment",
        "channels": ["email", "sms"],
        "timing": {
          "unit": "hours",
          "value": 24,
          "relativeTo": "before_appointment"
        },
        "messageTemplates": {
          "email": {
            "subject": "Appointment Reminder - {{appointmentDate}}",
            "body": "Dear {{patientName}}, this is a reminder..."
          }
        }
      }
    ]
  }
}
```

### Send Manual Reminder

Sends a manual reminder for an appointment.

**Endpoint:** `POST /reminders/send`

**Request Body:**
```json
{
  "appointmentId": "507f1f77bcf86cd799439013",
  "channels": ["email", "sms"],
  "customMessage": "Please remember to bring your medication list"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "remindersSent": [
      {
        "channel": "email",
        "status": "sent",
        "sentAt": "2025-10-24T15:30:00Z"
      },
      {
        "channel": "sms",
        "status": "sent",
        "sentAt": "2025-10-24T15:30:00Z"
      }
    ]
  }
}
```

## Schedule Management API

### Get Pharmacist Schedule

Retrieves the schedule for a specific pharmacist.

**Endpoint:** `GET /schedules/pharmacist/:pharmacistId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "schedule": {
      "_id": "507f1f77bcf86cd799439018",
      "pharmacistId": "507f1f77bcf86cd799439012",
      "workingHours": [
        {
          "dayOfWeek": 1,
          "isWorkingDay": true,
          "shifts": [
            {
              "startTime": "08:00",
              "endTime": "17:00",
              "breakStart": "12:00",
              "breakEnd": "13:00"
            }
          ]
        }
      ],
      "appointmentPreferences": {
        "maxAppointmentsPerDay": 16,
        "appointmentTypes": ["mtm_session", "health_check"],
        "defaultDuration": 30
      }
    },
    "upcomingTimeOff": [],
    "capacityStats": {
      "totalSlotsAvailable": 320,
      "slotsBooked": 240,
      "utilizationRate": 75
    }
  }
}
```

### Request Time Off

Requests time off for a pharmacist.

**Endpoint:** `POST /schedules/pharmacist/:pharmacistId/time-off`

**Request Body:**
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-05",
  "reason": "Annual vacation",
  "type": "vacation"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "timeOff": {
      "_id": "507f1f77bcf86cd799439019",
      "startDate": "2025-11-01",
      "endDate": "2025-11-05",
      "type": "vacation",
      "status": "pending"
    },
    "affectedAppointments": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "scheduledDate": "2025-11-02",
        "patientName": "Jane Doe",
        "needsRescheduling": true
      }
    ]
  }
}
```

## Analytics API

### Get Appointment Analytics

Retrieves comprehensive appointment analytics and metrics.

**Endpoint:** `GET /appointments/analytics`

**Query Parameters:**
- `startDate` (required): Start date for analytics period
- `endDate` (required): End date for analytics period
- `pharmacistId` (optional): Filter by pharmacist
- `locationId` (optional): Filter by location
- `groupBy` (optional): `day` | `week` | `month`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAppointments": 150,
      "completionRate": 85,
      "noShowRate": 10,
      "cancellationRate": 5,
      "averageWaitTime": 5
    },
    "byType": {
      "mtm_session": {
        "count": 50,
        "completionRate": 90
      },
      "health_check": {
        "count": 100,
        "completionRate": 82
      }
    },
    "trends": {
      "daily": [
        {
          "date": "2025-10-01",
          "appointments": 12,
          "completed": 10
        }
      ]
    },
    "peakTimes": {
      "busiestDay": "Monday",
      "busiestHour": "10:00-11:00",
      "utilizationByHour": {
        "09:00": 75,
        "10:00": 95,
        "11:00": 80
      }
    }
  }
}
```

## Patient Portal API

### Get Available Appointment Types

Public endpoint for patients to view available appointment types.

**Endpoint:** `GET /patient-portal/appointment-types`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointmentTypes": [
      {
        "type": "mtm_session",
        "name": "Medication Therapy Management",
        "description": "Comprehensive medication review with pharmacist",
        "duration": 30,
        "available": true
      },
      {
        "type": "health_check",
        "name": "Health Screening",
        "description": "Blood pressure, diabetes, and cholesterol screening",
        "duration": 15,
        "available": true
      }
    ]
  }
}
```

### Book Appointment (Patient Portal)

Allows patients to book appointments through the portal.

**Endpoint:** `POST /patient-portal/appointments`

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "type": "health_check",
  "scheduledDate": "2025-10-25",
  "scheduledTime": "14:00",
  "notes": "Need blood pressure check",
  "notificationPreferences": {
    "email": true,
    "sms": true
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439021",
      "confirmationNumber": "APT-2025-001234",
      "scheduledDate": "2025-10-25",
      "scheduledTime": "14:00",
      "status": "scheduled"
    },
    "confirmationSent": true
  }
}
```

## WebSocket Events

The API supports real-time updates via WebSocket connections.

### Connection

```javascript
const socket = io('wss://api.pharmacycopilot.com', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Appointment Events

```javascript
// Listen for appointment updates
socket.on('appointment:created', (appointment) => {
  console.log('New appointment created:', appointment);
});

socket.on('appointment:updated', (appointment) => {
  console.log('Appointment updated:', appointment);
});

socket.on('appointment:status_changed', (data) => {
  console.log('Appointment status changed:', data);
});
```

#### Follow-up Events

```javascript
// Listen for follow-up task updates
socket.on('followup:created', (task) => {
  console.log('New follow-up task:', task);
});

socket.on('followup:overdue', (task) => {
  console.log('Follow-up task overdue:', task);
});
```

## SDK Examples

### JavaScript/Node.js

```javascript
const PatientEngagementAPI = require('@pharmacycopilot/patient-engagement-sdk');

const api = new PatientEngagementAPI({
  baseURL: 'https://api.pharmacycopilot.com/api',
  token: 'your_jwt_token'
});

// Create an appointment
const appointment = await api.appointments.create({
  patientId: '507f1f77bcf86cd799439011',
  type: 'mtm_session',
  scheduledDate: '2025-10-25',
  scheduledTime: '10:00',
  duration: 30
});

// Get calendar view
const calendar = await api.appointments.getCalendar({
  view: 'week',
  date: '2025-10-25'
});

// Create follow-up task
const followUp = await api.followUps.create({
  patientId: '507f1f77bcf86cd799439011',
  type: 'medication_start_followup',
  title: 'Check INR levels',
  priority: 'high',
  dueDate: '2025-10-30'
});
```

### Python

```python
from pharmacycopilot import PatientEngagementAPI

api = PatientEngagementAPI(
    base_url='https://api.pharmacycopilot.com/api',
    token='your_jwt_token'
)

# Create appointment
appointment = api.appointments.create({
    'patientId': '507f1f77bcf86cd799439011',
    'type': 'mtm_session',
    'scheduledDate': '2025-10-25',
    'scheduledTime': '10:00',
    'duration': 30
})

# Get follow-up tasks
tasks = api.follow_ups.list(
    status='pending',
    priority='high'
)
```

## Postman Collection

A complete Postman collection is available for testing all API endpoints:

[Download Postman Collection](./Patient_Engagement_API.postman_collection.json)

## Support

For API support and questions:
- **Documentation**: https://docs.pharmacycopilot.com
- **Support Email**: api-support@pharmacycopilot.com
- **Developer Portal**: https://developers.pharmacycopilot.com
- **Status Page**: https://status.pharmacycopilot.com

## Changelog

### Version 1.0.0 (2025-10-24)
- Initial release of Patient Engagement & Follow-up Management API
- Support for appointments, follow-up tasks, reminders, and schedules
- Real-time WebSocket events
- Patient portal endpoints
- Comprehensive analytics and reporting