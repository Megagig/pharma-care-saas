# Manual Lab Order API - Error Codes & Troubleshooting Guide

## Overview

This document provides comprehensive information about error codes, common issues, and troubleshooting steps for the Manual Lab Order API.

## Error Code Reference

### HTTP Status Codes

| Status Code | Description           | When It Occurs                                |
| ----------- | --------------------- | --------------------------------------------- |
| 200         | OK                    | Successful GET requests                       |
| 201         | Created               | Successful POST requests (resource created)   |
| 400         | Bad Request           | Invalid request data or validation errors     |
| 401         | Unauthorized          | Missing or invalid authentication token       |
| 403         | Forbidden             | Insufficient permissions for the operation    |
| 404         | Not Found             | Requested resource does not exist             |
| 409         | Conflict              | Business rule violation or duplicate resource |
| 422         | Unprocessable Entity  | Request validation failed                     |
| 429         | Too Many Requests     | Rate limit exceeded                           |
| 500         | Internal Server Error | Unexpected server error                       |

### Application Error Codes

#### Authentication & Authorization Errors

| Error Code          | HTTP Status | Description                          | Solution                                        |
| ------------------- | ----------- | ------------------------------------ | ----------------------------------------------- |
| `UNAUTHORIZED`      | 401         | Missing or invalid JWT token         | Provide valid JWT token in Authorization header |
| `FORBIDDEN`         | 403         | Insufficient role permissions        | Ensure user has pharmacist or owner role        |
| `TOKEN_EXPIRED`     | 401         | JWT token has expired                | Refresh authentication token                    |
| `INVALID_WORKSPACE` | 403         | User doesn't belong to the workspace | Verify user workspace membership                |

#### Validation Errors

| Error Code                  | HTTP Status | Description                         | Solution                                      |
| --------------------------- | ----------- | ----------------------------------- | --------------------------------------------- |
| `VALIDATION_ERROR`          | 400         | Request validation failed           | Check request format and required fields      |
| `INVALID_ID`                | 400         | Invalid MongoDB ObjectId format     | Provide valid 24-character hex string         |
| `INVALID_ORDER_ID`          | 400         | Invalid order ID format             | Use format LAB-YYYY-XXXX                      |
| `MISSING_CONSENT`           | 400         | Patient consent not obtained        | Set consentObtained to true                   |
| `INVALID_TEST_CODES`        | 400         | Result test codes don't match order | Ensure test codes match ordered tests exactly |
| `INVALID_STATUS_TRANSITION` | 409         | Invalid order status change         | Follow valid status transition rules          |

#### Resource Errors

| Error Code           | HTTP Status | Description                     | Solution                            |
| -------------------- | ----------- | ------------------------------- | ----------------------------------- |
| `NOT_FOUND`          | 404         | Resource not found              | Verify resource ID and existence    |
| `ORDER_NOT_FOUND`    | 404         | Lab order not found             | Check order ID and workspace access |
| `PATIENT_NOT_FOUND`  | 404         | Patient not found               | Verify patient exists in workspace  |
| `RESULTS_NOT_FOUND`  | 404         | Lab results not found           | Ensure results have been entered    |
| `DUPLICATE_RESOURCE` | 409         | Resource already exists         | Check for existing resources        |
| `DUPLICATE_RESULTS`  | 409         | Results already exist for order | Use update endpoint instead         |

#### Business Logic Errors

| Error Code                | HTTP Status | Description                               | Solution                                  |
| ------------------------- | ----------- | ----------------------------------------- | ----------------------------------------- |
| `BUSINESS_RULE_VIOLATION` | 409         | Business logic constraint violated        | Review business rules and requirements    |
| `ORDER_NOT_MODIFIABLE`    | 409         | Order cannot be modified in current state | Check order status and modification rules |
| `INVALID_ORDER_STATUS`    | 409         | Operation not allowed for current status  | Verify order status requirements          |
| `CONSENT_REQUIRED`        | 400         | Patient consent is required               | Obtain and document patient consent       |

#### Rate Limiting Errors

| Error Code             | HTTP Status | Description                        | Solution                                |
| ---------------------- | ----------- | ---------------------------------- | --------------------------------------- |
| `RATE_LIMIT_EXCEEDED`  | 429         | Too many requests                  | Wait before retrying, check rate limits |
| `ORDER_CREATION_LIMIT` | 429         | Order creation rate limit exceeded | Reduce order creation frequency         |
| `PDF_ACCESS_LIMIT`     | 429         | PDF access rate limit exceeded     | Limit PDF download requests             |
| `TOKEN_SCAN_LIMIT`     | 429         | Token scanning rate limit exceeded | Reduce scanning frequency               |

#### System Errors

| Error Code             | HTTP Status | Description                      | Solution                                 |
| ---------------------- | ----------- | -------------------------------- | ---------------------------------------- |
| `SERVER_ERROR`         | 500         | Internal server error            | Contact system administrator             |
| `DATABASE_ERROR`       | 500         | Database operation failed        | Check database connectivity              |
| `PDF_GENERATION_ERROR` | 500         | PDF generation failed            | Verify template and data integrity       |
| `AI_SERVICE_ERROR`     | 500         | AI interpretation service failed | Check AI service availability            |
| `NOTIFICATION_ERROR`   | 500         | Notification delivery failed     | Check notification service configuration |

---

## Common Issues & Solutions

### 1. Order Creation Issues

#### Issue: "Patient consent is required for manual lab orders"

**Error Code:** `VALIDATION_ERROR`
**Cause:** `consentObtained` field is false or missing
**Solution:**

```json
{
  "consentObtained": true,
  "consentObtainedBy": "valid_user_id"
}
```

#### Issue: "Invalid order ID format"

**Error Code:** `VALIDATION_ERROR`
**Cause:** Order ID doesn't match LAB-YYYY-XXXX format
**Solution:** Use auto-generated order IDs or ensure manual IDs follow the correct format

#### Issue: "At least one test is required"

**Error Code:** `VALIDATION_ERROR`
**Cause:** Empty tests array
**Solution:**

```json
{
  "tests": [
    {
      "name": "Complete Blood Count",
      "code": "CBC",
      "specimenType": "Blood"
    }
  ]
}
```

### 2. Status Update Issues

#### Issue: "Invalid status transition from requested to completed"

**Error Code:** `BUSINESS_RULE_VIOLATION`
**Cause:** Attempting invalid status transition
**Solution:** Follow valid transition paths:

- `requested` → `sample_collected` → `result_awaited` → `completed`

#### Issue: "Order not found"

**Error Code:** `NOT_FOUND`
**Cause:** Order doesn't exist or user lacks access
**Solution:** Verify order ID and ensure user has access to the workspace

### 3. Result Entry Issues

#### Issue: "Invalid test codes: [INVALID_CODE]"

**Error Code:** `VALIDATION_ERROR`
**Cause:** Result test codes don't match ordered tests
**Solution:** Ensure test codes in results exactly match those in the original order

#### Issue: "Results already exist for this order"

**Error Code:** `DUPLICATE_RESOURCE`
**Cause:** Attempting to add results when they already exist
**Solution:** Use GET endpoint to retrieve existing results or contact administrator

#### Issue: "Either numeric value or string value must be provided"

**Error Code:** `VALIDATION_ERROR`
**Cause:** Result value missing both numeric and string values
**Solution:**

```json
{
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "numericValue": 7.5,
  "unit": "cells/μL"
}
```

### 4. PDF Generation Issues

#### Issue: "PDF generation failed"

**Error Code:** `SERVER_ERROR`
**Cause:** Missing required data or template issues
**Solution:**

- Verify all required fields are present
- Check template accessibility
- Contact system administrator if issue persists

#### Issue: "Required data not found for PDF generation"

**Error Code:** `NOT_FOUND`
**Cause:** Missing patient, workplace, or pharmacist data
**Solution:** Ensure all referenced entities exist and are accessible

### 5. Token Resolution Issues

#### Issue: "Invalid or expired token"

**Error Code:** `NOT_FOUND`
**Cause:** Token is malformed, expired, or doesn't exist
**Solution:**

- Generate new QR/barcode from order
- Use manual order lookup as alternative
- Check token expiration settings

#### Issue: "Token format is invalid"

**Error Code:** `VALIDATION_ERROR`
**Cause:** Token doesn't match expected format
**Solution:** Ensure token is properly encoded and not truncated

### 6. Authentication Issues

#### Issue: "Authorization header missing"

**Error Code:** `UNAUTHORIZED`
**Cause:** No JWT token provided
**Solution:**

```http
Authorization: Bearer your_jwt_token_here
```

#### Issue: "Insufficient permissions"

**Error Code:** `FORBIDDEN`
**Cause:** User doesn't have required role
**Solution:** Ensure user has `pharmacist` or `owner` role

### 7. Rate Limiting Issues

#### Issue: "Too many requests, please try again later"

**Error Code:** `RATE_LIMIT_EXCEEDED`
**Cause:** Exceeded rate limits
**Solution:**

- Wait before retrying
- Implement exponential backoff
- Review rate limit policies

---

## Debugging Steps

### 1. Enable Debug Logging

Set environment variable for detailed logging:

```bash
DEBUG=manual-lab:*
```

### 2. Check Request Format

Verify request structure matches API documentation:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"patientId": "..."}' \
  http://localhost:5000/api/manual-lab-orders
```

### 3. Validate Authentication

Test authentication endpoint:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/verify
```

### 4. Check Database Connectivity

Verify database connection and collections:

```javascript
// MongoDB shell
db.manuallaborders.findOne();
db.manuallabresults.findOne();
```

### 5. Monitor System Resources

Check system health:

- Database connection pool
- Memory usage
- CPU utilization
- Network connectivity

---

## Error Response Examples

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "consentObtained",
      "message": "Patient consent is required for manual lab orders",
      "code": "custom"
    }
  ]
}
```

### Business Rule Violation

```json
{
  "success": false,
  "message": "Invalid status transition from requested to completed",
  "code": "BUSINESS_RULE_VIOLATION",
  "details": {
    "currentStatus": "requested",
    "attemptedStatus": "completed",
    "validTransitions": ["sample_collected", "referred"]
  }
}
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 10,
    "windowMs": 900000,
    "retryAfter": 300
  }
}
```

### Server Error

```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "code": "SERVER_ERROR",
  "requestId": "req_12345",
  "timestamp": "2024-01-15T16:00:00.000Z"
}
```

---

## Best Practices

### 1. Error Handling in Client Code

```javascript
try {
  const response = await fetch('/api/manual-lab-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();

  if (!result.success) {
    switch (result.code) {
      case 'VALIDATION_ERROR':
        handleValidationErrors(result.errors);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        await delay(result.details.retryAfter * 1000);
        return retryRequest();
      case 'UNAUTHORIZED':
        await refreshToken();
        return retryRequest();
      default:
        handleGenericError(result);
    }
  }

  return result.data;
} catch (error) {
  handleNetworkError(error);
}
```

### 2. Retry Logic

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### 3. Input Validation

```javascript
function validateOrderData(data) {
  const errors = [];

  if (!data.patientId || !isValidObjectId(data.patientId)) {
    errors.push({
      field: 'patientId',
      message: 'Valid patient ID is required',
    });
  }

  if (!data.tests || data.tests.length === 0) {
    errors.push({ field: 'tests', message: 'At least one test is required' });
  }

  if (!data.consentObtained) {
    errors.push({
      field: 'consentObtained',
      message: 'Patient consent is required',
    });
  }

  return errors;
}
```

---

## Support & Escalation

### Level 1 Support

- Check error codes and solutions in this guide
- Verify request format and authentication
- Review application logs for detailed error information

### Level 2 Support

- Database connectivity and performance issues
- Rate limiting configuration
- Integration service failures

### Level 3 Support

- System architecture issues
- Security incidents
- Data corruption or integrity problems

### Contact Information

- **Technical Support**: support@PharmaPilot.com
- **Security Issues**: security@PharmaPilot.com
- **Emergency Escalation**: +1-XXX-XXX-XXXX

---

## Monitoring & Alerting

### Key Metrics to Monitor

- API response times
- Error rates by endpoint
- Rate limit violations
- PDF generation failures
- AI service availability
- Database query performance

### Alert Thresholds

- Error rate > 5% over 5 minutes
- Response time > 2 seconds for 95th percentile
- Rate limit violations > 100 per hour
- PDF generation failures > 10% over 15 minutes
- AI service errors > 20% over 10 minutes

### Log Analysis

Use structured logging to analyze issues:

```bash
# Find validation errors
grep "VALIDATION_ERROR" /var/log/manual-lab-api.log

# Monitor rate limiting
grep "RATE_LIMIT_EXCEEDED" /var/log/manual-lab-api.log | wc -l

# Check PDF generation issues
grep "PDF generation failed" /var/log/manual-lab-api.log
```
