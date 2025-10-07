# Workspace Subscription & RBAC API Documentation

## Overview

This document provides comprehensive API documentation for the workspace-level subscription management, invitation system, usage enforcement, and enhanced RBAC features in the PharmacyCopilot SaaS application.

## Base URL

```
Production: https://api.PharmacyCopilot.com
Development: http://localhost:5000
```

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

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
  "details": {
    // Additional error details
  },
  "upgradeRequired": false,
  "upgradeTo": "premium",
  "retryAfter": 3600
}
```

## Error Codes

| Code                        | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `INVITATION_LIMIT_EXCEEDED` | Workspace has reached maximum pending invitations |
| `USAGE_LIMIT_EXCEEDED`      | Plan usage limits have been reached               |
| `SUBSCRIPTION_EXPIRED`      | Workspace subscription has expired                |
| `INSUFFICIENT_PERMISSIONS`  | User lacks required permissions                   |
| `INVITATION_EXPIRED`        | Invitation code is expired or invalid             |
| `WORKSPACE_NOT_FOUND`       | Specified workspace does not exist                |
| `PLAN_NOT_FOUND`            | Subscription plan not found                       |
| `RATE_LIMIT_EXCEEDED`       | Too many requests, rate limit exceeded            |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Invitation Creation**: 10 requests per hour per user
- **Subscription Changes**: 5 requests per hour per user
- **Payment Attempts**: 3 requests per 10 minutes per user
- **General API**: 1000 requests per hour per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

---

# Invitation Management API

## Create Invitation

Creates a new invitation for a workspace.

**Endpoint:** `POST /api/workspaces/:id/invitations`

**Permissions Required:** `invitation.create` (Workspace Owner only)

**Rate Limits:**

- 10 requests per hour per user
- 5 requests per minute per IP

### Request Parameters

| Parameter | Type   | Location | Required | Description  |
| --------- | ------ | -------- | -------- | ------------ |
| `id`      | string | path     | Yes      | Workspace ID |

### Request Body

```json
{
  "email": "user@example.com",
  "role": "Pharmacist",
  "customMessage": "Welcome to our pharmacy team!"
}
```

| Field           | Type   | Required | Description                                           |
| --------------- | ------ | -------- | ----------------------------------------------------- |
| `email`         | string | Yes      | Valid email address of invitee                        |
| `role`          | string | Yes      | One of: `Owner`, `Pharmacist`, `Technician`, `Intern` |
| `customMessage` | string | No       | Optional custom message (max 500 chars)               |

### Response

**Success (201):**

```json
{
  "success": true,
  "message": "Invitation created and sent successfully",
  "data": {
    "invitation": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "code": "ABC12345",
      "role": "Pharmacist",
      "status": "active",
      "expiresAt": "2024-01-02T10:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "metadata": {
        "inviterName": "John Doe",
        "workspaceName": "Main Pharmacy",
        "customMessage": "Welcome to our pharmacy team!"
      }
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid input data
- **403 Forbidden:** Insufficient permissions
- **409 Conflict:** Invitation limit exceeded
- **429 Too Many Requests:** Rate limit exceeded

---

## Get Workspace Invitations

Retrieves all invitations for a workspace.

**Endpoint:** `GET /api/workspaces/:id/invitations`

**Permissions Required:** `invitation.view` (Workspace Owner only)

### Query Parameters

| Parameter | Type   | Required | Description                                               |
| --------- | ------ | -------- | --------------------------------------------------------- |
| `status`  | string | No       | Filter by status: `active`, `expired`, `used`, `canceled` |
| `page`    | number | No       | Page number (default: 1)                                  |
| `limit`   | number | No       | Items per page (default: 20, max: 100)                    |
| `sort`    | string | No       | Sort field: `createdAt`, `expiresAt`, `email`             |
| `order`   | string | No       | Sort order: `asc`, `desc` (default: `desc`)               |

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "email": "user@example.com",
        "code": "ABC12345",
        "role": "Pharmacist",
        "status": "active",
        "expiresAt": "2024-01-02T10:00:00.000Z",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "metadata": {
          "inviterName": "John Doe",
          "workspaceName": "Main Pharmacy"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20
    },
    "stats": {
      "active": 1,
      "expired": 0,
      "used": 5,
      "canceled": 0,
      "total": 6
    }
  }
}
```

---

## Accept Invitation

Accepts an invitation and adds user to workspace.

**Endpoint:** `POST /api/invitations/:code/accept`

**Authentication:** Required (any authenticated user)

### Request Parameters

| Parameter | Type   | Location | Required | Description                 |
| --------- | ------ | -------- | -------- | --------------------------- |
| `code`    | string | path     | Yes      | 8-character invitation code |

### Request Body

```json
{
  "userData": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "+2348012345678"
  }
}
```

| Field                  | Type   | Required | Description                        |
| ---------------------- | ------ | -------- | ---------------------------------- |
| `userData`             | object | No       | Additional user data for new users |
| `userData.firstName`   | string | No       | User's first name                  |
| `userData.lastName`    | string | No       | User's last name                   |
| `userData.phoneNumber` | string | No       | User's phone number                |

### Response

**Success (200):**

```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "workspace": {
      "id": "64a1b2c3d4e5f6789012345",
      "name": "Main Pharmacy",
      "role": "Pharmacist"
    },
    "user": {
      "id": "64a1b2c3d4e5f6789012346",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "isNewUser": false
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid invitation code
- **404 Not Found:** Invitation not found
- **409 Conflict:** Invitation expired or already used
- **422 Unprocessable Entity:** User already in workspace

---

## Validate Invitation

Validates an invitation code without accepting it.

**Endpoint:** `GET /api/invitations/:code/validate`

**Authentication:** Not required (public endpoint)

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "invitation": {
      "workspaceName": "Main Pharmacy",
      "role": "Pharmacist",
      "inviterName": "John Doe",
      "expiresAt": "2024-01-02T10:00:00.000Z",
      "customMessage": "Welcome to our team!"
    }
  }
}
```

**Invalid Invitation (200):**

```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "expired",
    "message": "This invitation has expired"
  }
}
```

---

# Workspace Subscription Management API

## Get Workspace Subscription

Retrieves subscription details for a workspace.

**Endpoint:** `GET /api/subscriptions/workspace/:workspaceId`

**Permissions Required:** Workspace member or super_admin

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "64a1b2c3d4e5f6789012345",
      "workspaceId": "64a1b2c3d4e5f6789012346",
      "planId": "64a1b2c3d4e5f6789012347",
      "status": "active",
      "tier": "premium",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "trialEndDate": null,
      "priceAtPurchase": 25000,
      "billingInterval": "monthly",
      "nextBillingDate": "2024-02-01T00:00:00.000Z",
      "features": [
        "dashboard",
        "patient_management",
        "clinical_notes",
        "advanced_reports",
        "team_management",
        "api_access"
      ],
      "limits": {
        "patients": 500,
        "users": 5,
        "locations": 1,
        "storage": 5000,
        "apiCalls": 10000
      }
    },
    "workspace": {
      "id": "64a1b2c3d4e5f6789012346",
      "name": "Main Pharmacy",
      "subscriptionStatus": "active",
      "trialEndDate": null,
      "isTrialExpired": false
    },
    "plan": {
      "id": "64a1b2c3d4e5f6789012347",
      "name": "Premium",
      "code": "premium",
      "tier": "premium",
      "priceNGN": 25000,
      "description": "Advanced features for growing pharmacies"
    },
    "usage": {
      "patients": 245,
      "users": 3,
      "locations": 1,
      "storage": 2500,
      "apiCalls": 5420
    },
    "billing": {
      "daysRemaining": 15,
      "isExpired": false,
      "isInGracePeriod": false,
      "autoRenew": true
    }
  }
}
```

---

## Create Trial Subscription

Creates a trial subscription for a new workspace.

**Endpoint:** `POST /api/subscriptions/workspace/trial`

**Permissions Required:** `subscription.manage` (Workspace Owner)

### Request Body

```json
{
  "workspaceId": "64a1b2c3d4e5f6789012346",
  "trialDurationDays": 14
}
```

### Response

**Success (201):**

```json
{
  "success": true,
  "message": "Trial subscription created successfully",
  "data": {
    "subscription": {
      "id": "64a1b2c3d4e5f6789012345",
      "workspaceId": "64a1b2c3d4e5f6789012346",
      "status": "trial",
      "tier": "free_trial",
      "trialEndDate": "2024-01-15T00:00:00.000Z",
      "features": ["*"],
      "limits": {
        "patients": null,
        "users": null,
        "locations": 1,
        "storage": null,
        "apiCalls": null
      }
    }
  }
}
```

---

## Upgrade Workspace Subscription

Upgrades a workspace subscription to a higher tier.

**Endpoint:** `POST /api/subscriptions/workspace/upgrade`

**Permissions Required:** `subscription.manage` (Workspace Owner)

### Request Body

```json
{
  "planId": "64a1b2c3d4e5f6789012347",
  "billingInterval": "monthly",
  "paymentMethodId": "pm_1234567890"
}
```

### Response

**Success (200):**

```json
{
  "success": true,
  "message": "Subscription upgraded successfully",
  "data": {
    "subscription": {
      "id": "64a1b2c3d4e5f6789012345",
      "status": "active",
      "tier": "premium",
      "upgradedAt": "2024-01-01T10:00:00.000Z"
    },
    "payment": {
      "id": "64a1b2c3d4e5f6789012348",
      "amount": 25000,
      "status": "succeeded",
      "proratedAmount": 15000
    },
    "featuresActivated": ["advanced_reports", "team_management", "api_access"]
  }
}
```

---

# Usage Monitoring API

## Get Workspace Usage Statistics

Retrieves current usage statistics for a workspace.

**Endpoint:** `GET /api/usage/stats`

**Authentication:** Required (workspace member)

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "64a1b2c3d4e5f6789012346",
      "name": "Main Pharmacy"
    },
    "plan": {
      "name": "Premium",
      "tier": "premium"
    },
    "usage": {
      "patients": {
        "current": 245,
        "limit": 500,
        "percentage": 49,
        "unlimited": false
      },
      "users": {
        "current": 3,
        "limit": 5,
        "percentage": 60,
        "unlimited": false
      },
      "locations": {
        "current": 1,
        "limit": 1,
        "percentage": 100,
        "unlimited": false
      },
      "storage": {
        "current": 2500,
        "limit": 5000,
        "percentage": 50,
        "unlimited": false,
        "unit": "MB"
      },
      "apiCalls": {
        "current": 5420,
        "limit": 10000,
        "percentage": 54.2,
        "unlimited": false,
        "period": "monthly"
      }
    },
    "alerts": [
      {
        "type": "warning",
        "resource": "users",
        "message": "You're using 60% of your user limit",
        "threshold": 60,
        "upgradeRecommended": false
      }
    ],
    "lastUpdated": "2024-01-01T10:00:00.000Z"
  }
}
```

---

## Get Usage Analytics

Retrieves detailed usage analytics (owners only).

**Endpoint:** `GET /api/usage/analytics`

**Permissions Required:** `workspace.analytics` (Workspace Owner)

### Query Parameters

| Parameter  | Type   | Required | Description                                                   |
| ---------- | ------ | -------- | ------------------------------------------------------------- |
| `period`   | string | No       | Time period: `7d`, `30d`, `90d`, `1y` (default: `30d`)        |
| `resource` | string | No       | Specific resource: `patients`, `users`, `storage`, `apiCalls` |

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "trends": {
      "patients": {
        "current": 245,
        "previous": 220,
        "change": 25,
        "changePercentage": 11.36,
        "trend": "increasing"
      },
      "users": {
        "current": 3,
        "previous": 2,
        "change": 1,
        "changePercentage": 50,
        "trend": "increasing"
      }
    },
    "dailyUsage": [
      {
        "date": "2024-01-01",
        "patients": 240,
        "users": 3,
        "apiCalls": 450
      }
    ],
    "projections": {
      "patients": {
        "nextMonth": 270,
        "limitReachedDate": "2024-06-15",
        "upgradeRecommendedDate": "2024-05-15"
      }
    }
  }
}
```

---

# Location Management API

## Get Workspace Locations

Retrieves all locations for a workspace.

**Endpoint:** `GET /api/locations`

**Permissions Required:** `location.read` (Multi-location feature required)

### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "name": "Main Branch",
        "address": "123 Main Street, Lagos",
        "isPrimary": true,
        "isActive": true,
        "metadata": {
          "phoneNumber": "+2348012345678",
          "email": "main@pharmacy.com",
          "manager": "John Doe"
        },
        "stats": {
          "patientsCount": 150,
          "usersCount": 2,
          "lastActivity": "2024-01-01T10:00:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total": 1,
      "active": 1,
      "primary": 1
    }
  }
}
```

---

## Create Location

Creates a new location for the workspace.

**Endpoint:** `POST /api/locations`

**Permissions Required:** `location.create` (Workspace Owner, Multi-location plan)

### Request Body

```json
{
  "name": "Branch 2",
  "address": "456 Second Street, Abuja",
  "metadata": {
    "phoneNumber": "+2348087654321",
    "email": "branch2@pharmacy.com",
    "manager": "Jane Smith"
  }
}
```

### Response

**Success (201):**

```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "location": {
      "id": "64a1b2c3d4e5f6789012346",
      "name": "Branch 2",
      "address": "456 Second Street, Abuja",
      "isPrimary": false,
      "isActive": true,
      "metadata": {
        "phoneNumber": "+2348087654321",
        "email": "branch2@pharmacy.com",
        "manager": "Jane Smith"
      },
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- **403 Forbidden:** Multi-location feature not available in current plan
- **409 Conflict:** Location limit exceeded

---

# Integration Guides

## Frontend Integration

### Authentication Setup

```typescript
// Set up API client with authentication
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Invitation Flow Integration

```typescript
// Create invitation
const createInvitation = async (
  workspaceId: string,
  invitationData: {
    email: string;
    role: string;
    customMessage?: string;
  }
) => {
  try {
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/invitations`,
      invitationData
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error('Invitation limit exceeded. Please upgrade your plan.');
    }
    throw error;
  }
};

// Accept invitation
const acceptInvitation = async (code: string, userData?: any) => {
  const response = await apiClient.post(`/api/invitations/${code}/accept`, {
    userData,
  });
  return response.data;
};
```

### Usage Monitoring Integration

```typescript
// Get usage statistics
const getUsageStats = async () => {
  const response = await apiClient.get('/api/usage/stats');
  return response.data;
};

// Usage warning component
const UsageWarning: React.FC = () => {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    getUsageStats().then(setUsage);
  }, []);

  if (!usage?.alerts?.length) return null;

  return (
    <div className="usage-alerts">
      {usage.alerts.map((alert, index) => (
        <div key={index} className={`alert alert-${alert.type}`}>
          {alert.message}
          {alert.upgradeRecommended && (
            <button onClick={() => navigateToUpgrade()}>Upgrade Plan</button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Subscription Management Integration

```typescript
// Get subscription details
const getSubscription = async (workspaceId: string) => {
  const response = await apiClient.get(
    `/api/subscriptions/workspace/${workspaceId}`
  );
  return response.data;
};

// Upgrade subscription
const upgradeSubscription = async (planId: string, billingInterval: string) => {
  const response = await apiClient.post(
    '/api/subscriptions/workspace/upgrade',
    {
      planId,
      billingInterval,
    }
  );
  return response.data;
};
```

## Webhook Integration

### Subscription Status Changes

```typescript
// Webhook endpoint for subscription updates
app.post('/webhooks/subscription', (req, res) => {
  const { workspaceId, status, planId } = req.body;

  // Update local subscription cache
  updateSubscriptionCache(workspaceId, { status, planId });

  // Notify connected users via WebSocket
  notifyWorkspaceUsers(workspaceId, {
    type: 'subscription_updated',
    status,
    planId,
  });

  res.status(200).json({ received: true });
});
```

## Error Handling Best Practices

### Graceful Degradation

```typescript
// Handle feature access gracefully
const useFeatureAccess = (feature: string) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFeatureAccess(feature)
      .then(setHasAccess)
      .catch(() => setHasAccess(false))
      .finally(() => setLoading(false));
  }, [feature]);

  return { hasAccess, loading };
};

// Usage in components
const AdvancedReports: React.FC = () => {
  const { hasAccess, loading } = useFeatureAccess('advanced_reports');

  if (loading) return <LoadingSpinner />;

  if (!hasAccess) {
    return (
      <UpgradePrompt
        feature="Advanced Reports"
        description="Get detailed analytics and custom reports"
      />
    );
  }

  return <ReportsComponent />;
};
```

### Rate Limit Handling

```typescript
// Handle rate limits with exponential backoff
const apiClientWithRetry = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

apiClientWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClientWithRetry.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

# Troubleshooting Guide

## Common Issues

### 1. Invitation Not Received

**Problem:** User reports not receiving invitation email

**Troubleshooting Steps:**

1. Check spam/junk folder
2. Verify email address is correct
3. Check invitation status via API:
   ```bash
   GET /api/workspaces/:id/invitations
   ```
4. Resend invitation if needed
5. Check email delivery logs

**API Check:**

```bash
curl -X GET \
  "https://api.PharmacyCopilot.com/api/workspaces/64a1b2c3d4e5f6789012345/invitations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Subscription Upgrade Failed

**Problem:** Subscription upgrade fails or doesn't activate features

**Troubleshooting Steps:**

1. Check payment status
2. Verify subscription status:
   ```bash
   GET /api/subscriptions/workspace/:workspaceId
   ```
3. Check for pending payments
4. Verify plan features are activated
5. Clear application cache

### 3. Usage Limits Not Updating

**Problem:** Usage statistics not reflecting recent changes

**Troubleshooting Steps:**

1. Check last updated timestamp
2. Trigger manual recalculation:
   ```bash
   POST /api/usage/recalculate
   ```
3. Verify database connectivity
4. Check cron job status

### 4. Permission Denied Errors

**Problem:** User getting 403 errors despite having correct role

**Troubleshooting Steps:**

1. Verify user's workspace membership
2. Check user's role in workspace
3. Verify plan includes required features
4. Check permission matrix configuration
5. Clear user session and re-authenticate

**Debug API Call:**

```bash
curl -X GET \
  "https://api.PharmacyCopilot.com/api/user/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Rate Limit Issues

**Problem:** Getting 429 Too Many Requests errors

**Solutions:**

1. Implement exponential backoff
2. Cache API responses where possible
3. Use batch operations when available
4. Contact support for rate limit increase

## Error Response Examples

### Invitation Limit Exceeded

```json
{
  "success": false,
  "message": "Invitation limit exceeded",
  "code": "INVITATION_LIMIT_EXCEEDED",
  "details": {
    "currentPendingInvitations": 20,
    "maxAllowed": 20,
    "planTier": "basic"
  },
  "upgradeRequired": true,
  "upgradeTo": "premium"
}
```

### Usage Limit Exceeded

```json
{
  "success": false,
  "message": "Patient limit exceeded",
  "code": "USAGE_LIMIT_EXCEEDED",
  "details": {
    "resource": "patients",
    "currentUsage": 100,
    "limit": 100,
    "planTier": "basic"
  },
  "upgradeRequired": true,
  "upgradeTo": "premium"
}
```

### Subscription Expired

```json
{
  "success": false,
  "message": "Workspace subscription has expired",
  "code": "SUBSCRIPTION_EXPIRED",
  "details": {
    "expiredDate": "2024-01-01T00:00:00.000Z",
    "gracePeriodEnds": "2024-01-08T00:00:00.000Z",
    "isInGracePeriod": true
  },
  "upgradeRequired": true
}
```

## Support Contacts

- **Technical Support:** tech-support@PharmacyCopilot.com
- **Billing Issues:** billing@PharmacyCopilot.com
- **API Documentation:** developers@PharmacyCopilot.com
- **Emergency Support:** +234-800-PHARMA-1

---

_Last Updated: January 2024_
_API Version: 2.0_
