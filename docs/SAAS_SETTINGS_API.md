# SaaS Settings Module API Documentation

## Overview

The SaaS Settings Module provides comprehensive system administration and configuration interfaces for super administrators. This API enables centralized control over users, subscriptions, security, analytics, and system-wide configurations across multiple pharmacy tenants.

## Base URL

```
/api/admin/saas
```

## Authentication

All endpoints require super administrator privileges. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **Analytics endpoints**: 50 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "SAAS_001",
    "message": "Insufficient permissions",
    "details": {},
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123456789"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| SAAS_001 | Insufficient permissions |
| SAAS_002 | User not found |
| SAAS_003 | Role assignment failed |
| SAAS_004 | Feature flag not found |
| SAAS_005 | Security policy violation |
| SAAS_006 | Tenant limit exceeded |
| SAAS_007 | Notification delivery failed |
| SAAS_008 | Analytics data unavailable |
| SAAS_009 | System maintenance mode |
| SAAS_010 | Rate limit exceeded |

---

## System Overview Endpoints

### Get System Metrics

Retrieve comprehensive system metrics including users, subscriptions, and revenue.

**Endpoint:** `GET /overview/metrics`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "newUsersToday": 15,
    "activeSubscriptions": 45,
    "totalWorkspaces": 52,
    "monthlyRevenue": 125000,
    "systemUptime": "99.9%",
    "activeFeatureFlags": 12,
    "pendingLicenses": 3,
    "supportTickets": {
      "open": 8,
      "resolved": 142,
      "critical": 1
    }
  }
}
```

### Get System Health

Monitor system health including database, API, and cache status.

**Endpoint:** `GET /overview/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "connections": 12
    },
    "api": {
      "status": "healthy",
      "responseTime": 120,
      "requestsPerMinute": 450
    },
    "cache": {
      "status": "healthy",
      "hitRate": 0.85,
      "memoryUsage": 0.65
    },
    "memory": {
      "status": "warning",
      "usage": 0.78,
      "available": "2.1GB"
    }
  }
}
```

### Get Recent Activities

Retrieve recent system activities and administrative actions.

**Endpoint:** `GET /overview/activities`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20, max: 100)
- `type` (optional): Filter by activity type (user_registration, feature_flag_change, license_approval)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_123456",
      "type": "user_registration",
      "description": "New user registered: john.doe@pharmacy.com",
      "timestamp": "2024-01-01T10:30:00Z",
      "userId": "user_789",
      "metadata": {
        "email": "john.doe@pharmacy.com",
        "pharmacy": "Central Pharmacy"
      }
    },
    {
      "id": "act_123457",
      "type": "feature_flag_change",
      "description": "Feature flag 'advanced_analytics' enabled for Premium users",
      "timestamp": "2024-01-01T09:15:00Z",
      "adminId": "admin_456",
      "metadata": {
        "flagName": "advanced_analytics",
        "action": "enabled",
        "targeting": "premium_users"
      }
    }
  ]
}
```

---

## User Management Endpoints

### List Users

Retrieve paginated list of users with filtering and search capabilities.

**Endpoint:** `GET /users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role
- `status` (optional): Filter by status (active, suspended, pending)
- `workspace` (optional): Filter by workspace/pharmacy

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john.doe@pharmacy.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "pharmacist",
        "status": "active",
        "workspace": {
          "id": "workspace_456",
          "name": "Central Pharmacy"
        },
        "lastLogin": "2024-01-01T08:30:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

### Update User Role

Assign or update a user's role within their workspace.

**Endpoint:** `PUT /users/:userId/role`

**Request Body:**
```json
{
  "roleId": "role_pharmacist",
  "workspaceId": "workspace_456",
  "reason": "Promotion to senior pharmacist"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "previousRole": "cashier",
    "newRole": "pharmacist",
    "updatedAt": "2024-01-01T10:30:00Z",
    "updatedBy": "admin_456"
  }
}
```

### Impersonate User

Create an impersonation session for support purposes.

**Endpoint:** `POST /users/:userId/impersonate`

**Request Body:**
```json
{
  "reason": "Customer support - billing inquiry",
  "duration": 3600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "imp_token_789",
    "expiresAt": "2024-01-01T11:30:00Z",
    "targetUser": {
      "id": "user_123",
      "email": "john.doe@pharmacy.com",
      "name": "John Doe"
    },
    "impersonationId": "imp_session_456"
  }
}
```

### Suspend User

Suspend a user account with audit trail.

**Endpoint:** `POST /users/:userId/suspend`

**Request Body:**
```json
{
  "reason": "Policy violation - unauthorized access attempt",
  "duration": "indefinite"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "status": "suspended",
    "reason": "Policy violation - unauthorized access attempt",
    "suspendedAt": "2024-01-01T10:30:00Z",
    "suspendedBy": "admin_456"
  }
}
```

---

## Feature Flags Management Endpoints

### List Feature Flags

Retrieve all feature flags with their current status and targeting rules.

**Endpoint:** `GET /feature-flags`

**Response:**
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "id": "flag_advanced_analytics",
        "name": "advanced_analytics",
        "description": "Enable advanced analytics dashboard",
        "isEnabled": true,
        "targeting": {
          "pharmacies": ["pharmacy_123", "pharmacy_456"],
          "userGroups": ["premium_users"],
          "subscriptionPlans": ["professional", "enterprise"],
          "percentage": 100
        },
        "usageMetrics": {
          "affectedUsers": 245,
          "affectedPharmacies": 12
        },
        "createdAt": "2023-11-01T10:00:00Z",
        "updatedAt": "2024-01-01T09:15:00Z"
      }
    ],
    "categories": ["analytics", "billing", "security", "ui"],
    "totalCount": 15
  }
}
```

### Update Feature Flag Targeting

Configure targeting rules for a specific feature flag.

**Endpoint:** `PUT /feature-flags/:flagId/targeting`

**Request Body:**
```json
{
  "targetingRules": {
    "pharmacies": ["pharmacy_123", "pharmacy_789"],
    "userGroups": ["premium_users", "beta_testers"],
    "subscriptionPlans": ["professional", "enterprise"],
    "percentage": 75
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flagId": "flag_advanced_analytics",
    "targeting": {
      "pharmacies": ["pharmacy_123", "pharmacy_789"],
      "userGroups": ["premium_users", "beta_testers"],
      "subscriptionPlans": ["professional", "enterprise"],
      "percentage": 75
    },
    "estimatedImpact": {
      "affectedUsers": 320,
      "affectedPharmacies": 18
    },
    "updatedAt": "2024-01-01T10:30:00Z"
  }
}
```

### Get Feature Flag Usage Metrics

Retrieve detailed usage metrics for feature flags.

**Endpoint:** `GET /feature-flags/usage-metrics`

**Query Parameters:**
- `flagId` (optional): Specific flag ID
- `timeRange` (optional): Time range (7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "flagId": "flag_advanced_analytics",
        "flagName": "advanced_analytics",
        "usageStats": {
          "totalChecks": 15420,
          "enabledChecks": 12336,
          "disabledChecks": 3084,
          "enabledPercentage": 80
        },
        "userImpact": {
          "affectedUsers": 245,
          "totalUsers": 1250,
          "impactPercentage": 19.6
        },
        "timeRange": "30d"
      }
    ]
  }
}
```

---

## Security Settings Endpoints

### Get Security Settings

Retrieve current security configuration and policies.

**Endpoint:** `GET /security/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true,
      "maxAge": 90,
      "preventReuse": 5
    },
    "sessionSettings": {
      "maxDuration": 28800,
      "idleTimeout": 3600,
      "maxConcurrentSessions": 3
    },
    "accountLockout": {
      "maxFailedAttempts": 5,
      "lockoutDuration": 1800,
      "autoUnlock": true
    },
    "twoFactorAuth": {
      "enforced": false,
      "methods": ["email_otp"],
      "gracePeriod": 7
    }
  }
}
```

### Update Password Policy

Configure system-wide password requirements.

**Endpoint:** `PUT /security/password-policy`

**Request Body:**
```json
{
  "minLength": 10,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumbers": true,
  "requireSpecialChars": true,
  "maxAge": 60,
  "preventReuse": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "passwordPolicy": {
      "minLength": 10,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true,
      "maxAge": 60,
      "preventReuse": 8
    },
    "updatedAt": "2024-01-01T10:30:00Z",
    "updatedBy": "admin_456"
  }
}
```

### Get Active Sessions

Monitor active user sessions across the system.

**Endpoint:** `GET /security/sessions`

**Query Parameters:**
- `userId` (optional): Filter by specific user
- `suspicious` (optional): Filter suspicious sessions only

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "sess_123456",
        "userId": "user_789",
        "userEmail": "john.doe@pharmacy.com",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "location": "Lagos, Nigeria",
        "loginTime": "2024-01-01T08:00:00Z",
        "lastActivity": "2024-01-01T10:25:00Z",
        "isActive": true,
        "isSuspicious": false
      }
    ],
    "totalSessions": 245,
    "suspiciousSessions": 3
  }
}
```

### Terminate Session

Forcefully terminate a user session.

**Endpoint:** `DELETE /security/sessions/:sessionId`

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_123456",
    "terminatedAt": "2024-01-01T10:30:00Z",
    "terminatedBy": "admin_456",
    "reason": "Suspicious activity detected"
  }
}
```

---

## Analytics and Reporting Endpoints

### Get Subscription Analytics

Retrieve comprehensive subscription and revenue metrics.

**Endpoint:** `GET /analytics/subscriptions`

**Query Parameters:**
- `timeRange` (optional): Time range (7d, 30d, 90d, 1y)
- `granularity` (optional): Data granularity (daily, weekly, monthly)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "mrr": 125000,
      "arr": 1500000,
      "ltv": 2400,
      "cac": 150,
      "churnRate": 0.05,
      "upgradeRate": 0.12,
      "downgradeRate": 0.03
    },
    "planDistribution": [
      {
        "planName": "Basic",
        "subscribers": 25,
        "revenue": 25000,
        "percentage": 55.6
      },
      {
        "planName": "Professional",
        "subscribers": 15,
        "revenue": 75000,
        "percentage": 33.3
      },
      {
        "planName": "Enterprise",
        "subscribers": 5,
        "revenue": 25000,
        "percentage": 11.1
      }
    ],
    "timeRange": "30d"
  }
}
```

### Get Pharmacy Usage Reports

Analyze pharmacy usage patterns and clinical outcomes.

**Endpoint:** `GET /analytics/pharmacy-usage`

**Query Parameters:**
- `pharmacyId` (optional): Specific pharmacy ID
- `timeRange` (optional): Time range (7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPharmacies": 45,
      "activePharmacies": 42,
      "totalPrescriptions": 15420,
      "totalDiagnostics": 8750,
      "totalPatients": 12500
    },
    "topPerformers": [
      {
        "pharmacyId": "pharmacy_123",
        "pharmacyName": "Central Pharmacy",
        "prescriptions": 1250,
        "diagnostics": 750,
        "patients": 980,
        "interventions": 45
      }
    ],
    "clinicalOutcomes": {
      "interventions": 420,
      "drugInteractionsPrevented": 125,
      "dosageAdjustments": 89,
      "patientSafetyImprovements": 156
    }
  }
}
```

### Export Analytics Data

Export analytics data in various formats.

**Endpoint:** `POST /analytics/export`

**Request Body:**
```json
{
  "reportType": "subscription_analytics",
  "format": "pdf",
  "timeRange": "30d",
  "includeCharts": true,
  "email": "admin@PharmaPilot.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "export_123456",
    "status": "processing",
    "estimatedCompletion": "2024-01-01T10:35:00Z",
    "downloadUrl": null,
    "emailDelivery": true
  }
}
```

---

## Notifications Management Endpoints

### Get Notification Settings

Retrieve current notification configuration and rules.

**Endpoint:** `GET /notifications/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": {
      "email": {
        "enabled": true,
        "provider": "sendgrid",
        "dailyLimit": 10000
      },
      "sms": {
        "enabled": true,
        "provider": "twilio",
        "dailyLimit": 1000
      },
      "push": {
        "enabled": true,
        "provider": "firebase",
        "dailyLimit": 50000
      },
      "whatsapp": {
        "enabled": false,
        "provider": "twilio",
        "dailyLimit": 500
      }
    },
    "rules": [
      {
        "id": "rule_system_alerts",
        "name": "System Alerts",
        "trigger": "system_error",
        "conditions": [
          {
            "field": "severity",
            "operator": "equals",
            "value": "critical"
          }
        ],
        "actions": [
          {
            "type": "email",
            "recipients": ["admin@PharmaPilot.com"],
            "template": "system_alert_template"
          }
        ],
        "isActive": true
      }
    ]
  }
}
```

### Send Bulk Notification

Send notifications to multiple users or groups.

**Endpoint:** `POST /notifications/bulk`

**Request Body:**
```json
{
  "recipients": {
    "type": "user_group",
    "criteria": {
      "subscriptionPlan": "professional",
      "status": "active"
    }
  },
  "channels": ["email", "push"],
  "template": "feature_announcement",
  "variables": {
    "featureName": "Advanced Analytics",
    "releaseDate": "2024-01-15"
  },
  "scheduledAt": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_123456",
    "estimatedRecipients": 245,
    "channels": ["email", "push"],
    "status": "scheduled",
    "scheduledAt": "2024-01-01T12:00:00Z"
  }
}
```

### Get Notification History

Retrieve notification delivery history and status.

**Endpoint:** `GET /notifications/history`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `channel` (optional): Filter by channel
- `status` (optional): Filter by delivery status

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123456",
        "type": "feature_announcement",
        "channel": "email",
        "recipient": "john.doe@pharmacy.com",
        "status": "delivered",
        "sentAt": "2024-01-01T12:00:00Z",
        "deliveredAt": "2024-01-01T12:00:15Z",
        "openedAt": "2024-01-01T12:05:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1520,
      "pages": 76
    }
  }
}
```

---

## Support and Helpdesk Endpoints

### Create Support Ticket

Create a new support ticket in the system.

**Endpoint:** `POST /support/tickets`

**Request Body:**
```json
{
  "title": "Billing inquiry - subscription not activated",
  "description": "Customer reports that their subscription payment was processed but features are not activated.",
  "priority": "high",
  "category": "billing",
  "customerId": "user_123",
  "assignedTo": "support_agent_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket_789",
    "ticketNumber": "SUPP-2024-001",
    "status": "open",
    "priority": "high",
    "createdAt": "2024-01-01T10:30:00Z",
    "estimatedResolution": "2024-01-02T10:30:00Z"
  }
}
```

### Get Knowledge Base Articles

Retrieve knowledge base articles with search functionality.

**Endpoint:** `GET /support/knowledge-base`

**Query Parameters:**
- `search` (optional): Search query
- `category` (optional): Filter by category
- `published` (optional): Filter by published status

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "kb_123",
        "title": "How to Reset User Password",
        "summary": "Step-by-step guide for resetting user passwords in the admin panel",
        "category": "user_management",
        "views": 245,
        "helpful": 89,
        "lastUpdated": "2024-01-01T10:00:00Z",
        "url": "/support/knowledge-base/kb_123"
      }
    ],
    "categories": ["user_management", "billing", "technical", "getting_started"],
    "totalCount": 156
  }
}
```

---

## API Management Endpoints

### List API Endpoints

Retrieve all documented API endpoints with their specifications.

**Endpoint:** `GET /api-management/endpoints`

**Response:**
```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "id": "endpoint_123",
        "path": "/api/admin/saas/overview/metrics",
        "method": "GET",
        "description": "Retrieve system metrics",
        "version": "v1",
        "isPublic": false,
        "rateLimit": 100,
        "authentication": "required",
        "lastUpdated": "2024-01-01T10:00:00Z"
      }
    ],
    "totalCount": 45,
    "versions": ["v1", "v2"]
  }
}
```

### Get API Usage Metrics

Monitor API usage and performance metrics.

**Endpoint:** `GET /api-management/usage-metrics`

**Query Parameters:**
- `timeRange` (optional): Time range (1h, 24h, 7d, 30d)
- `endpoint` (optional): Specific endpoint path

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 125420,
      "successfulRequests": 123890,
      "failedRequests": 1530,
      "averageResponseTime": 145,
      "errorRate": 0.012
    },
    "topEndpoints": [
      {
        "path": "/api/admin/saas/overview/metrics",
        "requests": 15420,
        "averageResponseTime": 89,
        "errorRate": 0.005
      }
    ],
    "timeRange": "24h"
  }
}
```

---

## Webhook Management Endpoints

### List Webhooks

Retrieve configured webhooks and their delivery status.

**Endpoint:** `GET /webhooks`

**Response:**
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "id": "webhook_123",
        "url": "https://external-system.com/webhooks/PharmaPilot",
        "events": ["user.created", "subscription.updated"],
        "isActive": true,
        "secret": "whsec_***",
        "lastDelivery": "2024-01-01T10:25:00Z",
        "deliveryStatus": "success",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "totalCount": 8
  }
}
```

### Create Webhook

Configure a new webhook endpoint.

**Endpoint:** `POST /webhooks`

**Request Body:**
```json
{
  "url": "https://external-system.com/webhooks/PharmaPilot",
  "events": ["user.created", "subscription.updated", "payment.processed"],
  "secret": "your_webhook_secret",
  "description": "Integration with external CRM system"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhookId": "webhook_456",
    "url": "https://external-system.com/webhooks/PharmaPilot",
    "events": ["user.created", "subscription.updated", "payment.processed"],
    "secret": "whsec_generated_secret",
    "isActive": true,
    "createdAt": "2024-01-01T10:30:00Z"
  }
}
```

---

## Integration Management Endpoints

### List Integrations

Retrieve configured external system integrations.

**Endpoint:** `GET /integrations`

**Response:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "integration_123",
        "name": "Nomba Payment Gateway",
        "type": "payment",
        "status": "active",
        "lastSync": "2024-01-01T10:20:00Z",
        "syncStatus": "success",
        "configuration": {
          "apiVersion": "v2",
          "environment": "production"
        }
      }
    ],
    "totalCount": 5
  }
}
```

### Test Integration

Test connectivity and functionality of an integration.

**Endpoint:** `POST /integrations/:integrationId/test`

**Response:**
```json
{
  "success": true,
  "data": {
    "integrationId": "integration_123",
    "testResults": {
      "connectivity": "passed",
      "authentication": "passed",
      "dataSync": "passed",
      "responseTime": 245
    },
    "testedAt": "2024-01-01T10:30:00Z"
  }
}
```

---

## Postman Collection

A comprehensive Postman collection is available for testing all endpoints:

[Download SaaS Settings API Postman Collection](./SaaS_Settings_API.postman_collection.json)

## SDK and Libraries

### JavaScript/Node.js SDK

```javascript
const SaaSSettingsAPI = require('@PharmaPilot/saas-settings-sdk');

const client = new SaaSSettingsAPI({
  baseURL: 'https://api.PharmaPilot.com',
  apiKey: 'your_api_key'
});

// Get system metrics
const metrics = await client.overview.getMetrics();

// List users with filtering
const users = await client.users.list({
  role: 'pharmacist',
  status: 'active',
  limit: 50
});
```

### Python SDK

```python
from PharmaPilot_saas import SaaSSettingsClient

client = SaaSSettingsClient(
    base_url='https://api.PharmaPilot.com',
    api_key='your_api_key'
)

# Get system metrics
metrics = client.overview.get_metrics()

# Update feature flag targeting
client.feature_flags.update_targeting(
    flag_id='flag_advanced_analytics',
    targeting_rules={
        'pharmacies': ['pharmacy_123'],
        'percentage': 100
    }
)
```

## Support

For API support and questions:
- **Documentation**: [https://docs.PharmaPilot.com/saas-settings](https://docs.PharmaPilot.com/saas-settings)
- **Support Email**: api-support@PharmaPilot.com
- **Developer Portal**: [https://developers.PharmaPilot.com](https://developers.PharmaPilot.com)

## Changelog

### v1.0.0 (2024-01-01)
- Initial release of SaaS Settings API
- Complete endpoint coverage for all modules
- Comprehensive authentication and authorization
- Rate limiting and security features