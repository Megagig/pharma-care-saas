# Manual Lab Order API Documentation

## Overview

The Manual Lab Order API provides a comprehensive workflow for creating, managing, and processing manual lab orders in the MERN PharmacyCopilot application. This API enables pharmacists to create printable lab requisitions, track order status, manually enter results, and leverage AI interpretation for diagnostic insights.

## Base URL

```
/api/manual-lab-orders
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Authorization

All endpoints require either `pharmacist` or `owner` role. Specific role requirements are noted for each endpoint.

## Common Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)",
  "field": "field_name (for validation errors)"
}
```

## Error Codes

| Code                      | Description               | HTTP Status |
| ------------------------- | ------------------------- | ----------- |
| `VALIDATION_ERROR`        | Request validation failed | 400         |
| `NOT_FOUND`               | Resource not found        | 404         |
| `DUPLICATE_RESOURCE`      | Resource already exists   | 409         |
| `BUSINESS_RULE_VIOLATION` | Business logic violation  | 409         |
| `FORBIDDEN`               | Insufficient permissions  | 403         |
| `RATE_LIMIT_EXCEEDED`     | Too many requests         | 429         |
| `SERVER_ERROR`            | Internal server error     | 500         |

---

## Order Management Endpoints

### Create Manual Lab Order

Creates a new manual lab order with PDF requisition generation.

**Endpoint:** `POST /api/manual-lab-orders`

**Required Role:** `pharmacist` or `owner`

**Rate Limit:** Enhanced rate limiting applied

**Request Body:**

```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "locationId": "main-branch",
  "tests": [
    {
      "name": "Complete Blood Count",
      "code": "CBC",
      "loincCode": "58410-2",
      "specimenType": "Blood",
      "unit": "cells/μL",
      "refRange": "4.5-11.0 x10³",
      "category": "Hematology"
    }
  ],
  "indication": "Routine health screening for annual checkup",
  "priority": "routine",
  "notes": "Patient fasting for 12 hours",
  "consentObtained": true,
  "consentObtainedBy": "507f1f77bcf86cd799439012"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Manual lab order created successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "orderId": "LAB-2024-0001",
      "patientId": "507f1f77bcf86cd799439011",
      "workplaceId": "507f1f77bcf86cd799439014",
      "locationId": "main-branch",
      "orderedBy": "507f1f77bcf86cd799439012",
      "tests": [...],
      "indication": "Routine health screening for annual checkup",
      "priority": "routine",
      "status": "requested",
      "consentObtained": true,
      "consentTimestamp": "2024-01-15T10:30:00.000Z",
      "consentObtainedBy": "507f1f77bcf86cd799439012",
      "requisitionFormUrl": "/api/manual-lab-orders/LAB-2024-0001/pdf",
      "barcodeData": "eyJvcmRlcklkIjoiTEFCLTIwMjQtMDAwMSIsInRva2VuIjoiYWJjZGVmZ2gifQ",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "testCount": 1,
      "pdfAccessToken": "secure_pdf_token_here",
      "pdfUrl": "/api/manual-lab-orders/LAB-2024-0001/pdf?token=secure_pdf_token_here"
    }
  }
}
```

### Get Manual Lab Order

Retrieves details of a specific lab order.

**Endpoint:** `GET /api/manual-lab-orders/:orderId`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Response:**

```json
{
  "success": true,
  "message": "Lab order retrieved successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "orderId": "LAB-2024-0001",
      "patientId": "507f1f77bcf86cd799439011",
      "workplaceId": "507f1f77bcf86cd799439014",
      "tests": [...],
      "status": "requested",
      "testCount": 1,
      "isActive": true,
      "canBeModified": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### List Manual Lab Orders

Lists lab orders with filtering and pagination (admin/management endpoint).

**Endpoint:** `GET /api/manual-lab-orders`

**Required Role:** `pharmacist` or `owner`

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `orderedBy` (string, optional): Filter by pharmacist ID
- `locationId` (string, optional): Filter by location
- `dateFrom` (string, optional): Filter from date (ISO format)
- `dateTo` (string, optional): Filter to date (ISO format)
- `search` (string, optional): Search term
- `sort` (string, optional): Sort field (prefix with - for desc)

**Response:**

```json
{
  "success": true,
  "message": "Found 25 lab orders",
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "workplaceId": "507f1f77bcf86cd799439014",
      "status": "requested"
    }
  }
}
```

### Get Patient Lab Orders

Retrieves lab order history for a specific patient.

**Endpoint:** `GET /api/manual-lab-orders/patient/:patientId`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `patientId` (string): Patient MongoDB ObjectId

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status
- `sort` (string, optional): Sort field (prefix with - for desc)

**Response:**

```json
{
  "success": true,
  "message": "Found 5 lab orders for patient",
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Update Order Status

Updates the status of a lab order.

**Endpoint:** `PUT /api/manual-lab-orders/:orderId/status`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Request Body:**

```json
{
  "status": "sample_collected",
  "notes": "Sample collected at 2:30 PM"
}
```

**Valid Status Transitions:**

- `requested` → `sample_collected`, `referred`
- `sample_collected` → `result_awaited`, `referred`
- `result_awaited` → `completed`, `referred`
- `completed` → `referred`
- `referred` → (terminal state)

**Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "orderId": "LAB-2024-0001",
      "status": "sample_collected",
      "updatedAt": "2024-01-15T14:30:00.000Z",
      "testCount": 1,
      "isActive": true,
      "canBeModified": true
    }
  }
}
```

---

## Result Management Endpoints

### Add Lab Results

Submits lab results for a specific order.

**Endpoint:** `POST /api/manual-lab-orders/:orderId/results`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Request Body:**

```json
{
  "values": [
    {
      "testCode": "CBC",
      "testName": "Complete Blood Count",
      "numericValue": 7.5,
      "unit": "cells/μL",
      "comment": "Within normal range"
    },
    {
      "testCode": "GLU",
      "testName": "Glucose",
      "stringValue": "Normal",
      "comment": "Fasting glucose level"
    }
  ],
  "reviewNotes": "All results reviewed and validated"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Lab results added successfully",
  "data": {
    "result": {
      "_id": "507f1f77bcf86cd799439015",
      "orderId": "LAB-2024-0001",
      "enteredBy": "507f1f77bcf86cd799439012",
      "enteredAt": "2024-01-15T16:00:00.000Z",
      "values": [...],
      "interpretation": [
        {
          "testCode": "CBC",
          "interpretation": "normal",
          "note": "Value within reference range"
        }
      ],
      "aiProcessed": false,
      "valueCount": 2,
      "hasAbnormalResults": false,
      "criticalResults": []
    }
  }
}
```

### Get Lab Results

Retrieves entered results for a specific order.

**Endpoint:** `GET /api/manual-lab-orders/:orderId/results`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Response:**

```json
{
  "success": true,
  "message": "Lab results retrieved successfully",
  "data": {
    "result": {
      "_id": "507f1f77bcf86cd799439015",
      "orderId": "LAB-2024-0001",
      "enteredBy": "507f1f77bcf86cd799439012",
      "enteredAt": "2024-01-15T16:00:00.000Z",
      "values": [...],
      "interpretation": [...],
      "aiProcessed": true,
      "aiProcessedAt": "2024-01-15T16:05:00.000Z",
      "diagnosticResultId": "507f1f77bcf86cd799439016",
      "valueCount": 2,
      "hasAbnormalResults": false,
      "criticalResults": [],
      "processingStatus": "completed",
      "isReviewed": true
    }
  }
}
```

---

## Token Resolution and PDF Endpoints

### Resolve Order Token

Resolves QR/barcode tokens to order details for scanning workflow.

**Endpoint:** `GET /api/manual-lab-orders/scan`

**Required Role:** `pharmacist` or `owner`

**Rate Limit:** 30 requests per minute

**Query Parameters:**

- `token` (string): Secure token from QR/barcode

**Response:**

```json
{
  "success": true,
  "message": "Token resolved successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "orderId": "LAB-2024-0001",
      "patientId": "507f1f77bcf86cd799439011",
      "tests": [...],
      "status": "sample_collected",
      "testCount": 1,
      "isActive": true,
      "canBeModified": true
    }
  }
}
```

### Serve PDF Requisition

Serves the generated PDF requisition for a lab order.

**Endpoint:** `GET /api/manual-lab-orders/:orderId/pdf`

**Required Role:** `pharmacist` or `owner`

**Rate Limit:** Enhanced PDF access rate limiting

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Query Parameters:**

- `token` (string, optional): Secure PDF access token

**Response:**

- **Content-Type:** `application/pdf`
- **Content-Disposition:** `inline; filename="LAB-2024-0001-requisition.pdf"`
- **Body:** PDF binary data

**Security Headers:**

- `Cache-Control: private, no-cache, no-store, must-revalidate`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-Download-Options: noopen`

---

## Compliance and Audit Endpoints

### Generate Compliance Report

Generates a compliance report for manual lab orders.

**Endpoint:** `GET /api/manual-lab-orders/compliance/report`

**Required Role:** `pharmacist` or `owner`

**Query Parameters:**

- `dateFrom` (string, optional): Report start date
- `dateTo` (string, optional): Report end date
- `format` (string, optional): Report format (json, csv)

**Response:**

```json
{
  "success": true,
  "message": "Compliance report generated successfully",
  "data": {
    "report": {
      "period": {
        "from": "2024-01-01T00:00:00.000Z",
        "to": "2024-01-31T23:59:59.999Z"
      },
      "summary": {
        "totalOrders": 150,
        "completedOrders": 142,
        "pendingOrders": 8,
        "complianceScore": 94.7
      },
      "violations": [],
      "recommendations": []
    }
  }
}
```

### Get Order Audit Trail

Retrieves detailed audit trail for a specific order.

**Endpoint:** `GET /api/manual-lab-orders/compliance/audit-trail/:orderId`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `orderId` (string): Order ID in format LAB-YYYY-XXXX

**Response:**

```json
{
  "success": true,
  "message": "Audit trail retrieved successfully",
  "data": {
    "auditTrail": [
      {
        "timestamp": "2024-01-15T10:30:00.000Z",
        "action": "order_created",
        "userId": "507f1f77bcf86cd799439012",
        "details": {
          "orderId": "LAB-2024-0001",
          "testCount": 1
        }
      }
    ]
  }
}
```

### Get Compliance Violations

Retrieves compliance violations and security incidents.

**Endpoint:** `GET /api/manual-lab-orders/compliance/violations`

**Required Role:** `pharmacist` or `owner`

**Query Parameters:**

- `severity` (string, optional): Filter by severity level
- `dateFrom` (string, optional): Filter from date
- `dateTo` (string, optional): Filter to date

**Response:**

```json
{
  "success": true,
  "message": "Compliance violations retrieved successfully",
  "data": {
    "violations": [
      {
        "id": "507f1f77bcf86cd799439017",
        "type": "missing_consent",
        "severity": "high",
        "orderId": "LAB-2024-0002",
        "timestamp": "2024-01-15T12:00:00.000Z",
        "description": "Order created without proper consent documentation"
      }
    ]
  }
}
```

---

## Security Monitoring Endpoints

### Get Security Dashboard

Retrieves security dashboard with metrics and threats.

**Endpoint:** `GET /api/manual-lab-orders/security/dashboard`

**Required Role:** `pharmacist` or `owner`

**Response:**

```json
{
  "success": true,
  "message": "Security dashboard retrieved successfully",
  "data": {
    "dashboard": {
      "threatLevel": "low",
      "activeThreats": 0,
      "recentIncidents": 2,
      "securityScore": 95.2,
      "metrics": {
        "failedLogins": 3,
        "suspiciousActivity": 1,
        "rateLimitHits": 12
      }
    }
  }
}
```

### Get Security Threats

Retrieves detailed threat information with filtering.

**Endpoint:** `GET /api/manual-lab-orders/security/threats`

**Required Role:** `pharmacist` or `owner`

**Query Parameters:**

- `severity` (string, optional): Filter by threat severity
- `type` (string, optional): Filter by threat type
- `status` (string, optional): Filter by status

**Response:**

```json
{
  "success": true,
  "message": "Security threats retrieved successfully",
  "data": {
    "threats": [
      {
        "id": "507f1f77bcf86cd799439018",
        "type": "suspicious_activity",
        "severity": "medium",
        "status": "active",
        "description": "Multiple failed token resolution attempts",
        "timestamp": "2024-01-15T14:00:00.000Z"
      }
    ]
  }
}
```

### Get User Security Summary

Retrieves security summary for a specific user.

**Endpoint:** `GET /api/manual-lab-orders/security/user-summary/:userId`

**Required Role:** `pharmacist` or `owner`

**Parameters:**

- `userId` (string): User MongoDB ObjectId

**Response:**

```json
{
  "success": true,
  "message": "User security summary retrieved successfully",
  "data": {
    "summary": {
      "userId": "507f1f77bcf86cd799439012",
      "riskLevel": "low",
      "recentActivity": {
        "ordersCreated": 15,
        "pdfAccessed": 23,
        "resultsEntered": 12
      },
      "securityEvents": []
    }
  }
}
```

### Clear User Security Metrics

Clears security metrics for a specific user (owner only).

**Endpoint:** `POST /api/manual-lab-orders/security/clear-user-metrics/:userId`

**Required Role:** `owner`

**Parameters:**

- `userId` (string): User MongoDB ObjectId

**Response:**

```json
{
  "success": true,
  "message": "User security metrics cleared successfully",
  "data": {
    "clearedMetrics": {
      "userId": "507f1f77bcf86cd799439012",
      "clearedAt": "2024-01-15T16:00:00.000Z"
    }
  }
}
```

---

## Data Models

### Manual Lab Order

```typescript
interface ManualLabOrder {
  _id: string;
  orderId: string; // Format: LAB-YYYY-XXXX
  patientId: string;
  workplaceId: string;
  locationId?: string;
  orderedBy: string;
  tests: ManualLabTest[];
  indication: string;
  requisitionFormUrl: string;
  barcodeData: string;
  status:
    | 'requested'
    | 'sample_collected'
    | 'result_awaited'
    | 'completed'
    | 'referred';
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  consentObtained: boolean;
  consentTimestamp: Date;
  consentObtainedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  isDeleted: boolean;
}
```

### Manual Lab Test

```typescript
interface ManualLabTest {
  name: string;
  code: string;
  loincCode?: string;
  specimenType: string;
  unit?: string;
  refRange?: string;
  category?: string;
}
```

### Manual Lab Result

```typescript
interface ManualLabResult {
  _id: string;
  orderId: string;
  enteredBy: string;
  enteredAt: Date;
  values: ResultValue[];
  interpretation: ResultInterpretation[];
  aiProcessed: boolean;
  aiProcessedAt?: Date;
  diagnosticResultId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

### Result Value

```typescript
interface ResultValue {
  testCode: string;
  testName: string;
  numericValue?: number;
  unit?: string;
  stringValue?: string;
  comment?: string;
  abnormalFlag?: boolean;
}
```

### Result Interpretation

```typescript
interface ResultInterpretation {
  testCode: string;
  interpretation: 'low' | 'normal' | 'high' | 'critical';
  note?: string;
}
```

---

## Integration Points

### AI Diagnostic Integration

The Manual Lab Order API integrates with the existing AI diagnostic system:

1. **Automatic AI Processing**: When lab results are entered, the system automatically triggers AI interpretation
2. **Diagnostic Request Format**: Lab results are formatted into the existing `DiagnosticRequest` structure
3. **AI Service**: Uses the existing OpenRouter service with DeepSeek V3.1 model
4. **Result Storage**: AI interpretations are stored as `DiagnosticResult` entities linked to the lab order

### Audit System Integration

All manual lab operations are logged through the existing audit system:

1. **Audit Events**: Order creation, status updates, result entry, PDF access
2. **Compliance Monitoring**: Automatic compliance checking and violation detection
3. **Security Monitoring**: Suspicious activity detection and threat assessment

### Notification System Integration

Critical results and alerts are sent through the existing notification infrastructure:

1. **SMS/Email Notifications**: Patient notifications for completed results
2. **Critical Alerts**: Immediate notifications for critical or abnormal results
3. **Opt-in Preferences**: Respects existing patient notification preferences

---

## Rate Limiting

### Enhanced Order Creation Rate Limiting

- **Limit**: Configurable per user/workplace
- **Window**: 15 minutes
- **Purpose**: Prevent order spam and abuse

### Enhanced PDF Access Rate Limiting

- **Limit**: Configurable per user
- **Window**: 5 minutes
- **Purpose**: Prevent PDF download abuse

### Token Scanning Rate Limiting

- **Limit**: 30 requests per minute per user
- **Purpose**: Prevent token brute force attacks

---

## Security Features

### Authentication & Authorization

- JWT token authentication required for all endpoints
- Role-based access control (pharmacist/owner roles)
- Workspace isolation for multi-tenant security

### Data Protection

- Input sanitization and XSS protection
- CSRF protection for state-changing operations
- Secure token generation for QR/barcode access
- Time-limited PDF access tokens

### Audit & Compliance

- Comprehensive audit logging for all operations
- Compliance monitoring and violation detection
- Security threat detection and alerting
- User activity monitoring and risk assessment

### PDF Security

- Secure PDF URLs with time-limited access
- No-cache headers to prevent unauthorized caching
- Watermarking with pharmacy and timestamp information
- Access logging and monitoring

---

## Performance Considerations

### Caching

- Test catalog data caching for faster order creation
- Generated PDF caching for repeated access
- Redis-based caching for frequently accessed orders

### Database Optimization

- Optimized indexes for common query patterns
- Efficient aggregation pipelines for reporting
- Connection pooling for database operations

### API Performance

- Response compression for large datasets
- Pagination for list endpoints
- Async processing for AI interpretation calls
- Performance monitoring and alerting

---

## Testing

### Unit Tests

- Model validation and business logic
- Service layer functionality
- Controller request/response handling
- Utility functions and helpers

### Integration Tests

- Complete API endpoint workflows
- Database integration and transactions
- External service integration (AI, notifications)
- Error handling and edge cases

### End-to-End Tests

- Complete manual lab workflow
- Mobile scanning and result entry
- AI interpretation and alert systems
- Security and compliance features

---

## Troubleshooting

### Common Issues

#### Order Creation Fails

- **Cause**: Missing patient consent or invalid patient ID
- **Solution**: Ensure `consentObtained` is true and valid `patientId` is provided
- **Error Code**: `VALIDATION_ERROR`

#### PDF Generation Fails

- **Cause**: Missing required data or template rendering issues
- **Solution**: Verify all required fields are present and template is accessible
- **Error Code**: `SERVER_ERROR`

#### Token Resolution Fails

- **Cause**: Invalid, expired, or tampered token
- **Solution**: Generate new QR/barcode or use manual order lookup
- **Error Code**: `NOT_FOUND`

#### Result Entry Validation Fails

- **Cause**: Test codes don't match ordered tests or invalid values
- **Solution**: Ensure result test codes match exactly with ordered test codes
- **Error Code**: `VALIDATION_ERROR`

#### AI Processing Fails

- **Cause**: External AI service unavailable or invalid response format
- **Solution**: Results are saved; AI processing will retry automatically
- **Error Code**: `SERVER_ERROR` (non-blocking)

### Debug Information

Enable debug logging by setting environment variable:

```bash
DEBUG=manual-lab:*
```

### Support

For technical support or API questions:

- Check application logs for detailed error information
- Review audit trails for operation history
- Contact system administrator for access issues
- Refer to compliance reports for regulatory concerns
