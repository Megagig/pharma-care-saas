# Feature Flags API Documentation

## Overview

The Feature Flags API provides comprehensive endpoints for managing feature flags, tier mappings, and role-based access control in the PharmaCare SaaS application. This system enables super administrators to control feature availability across subscription tiers and user roles with full CRUD operations and bulk management capabilities.

## Base URL

```
/api/feature-flags
```

## Authentication & Authorization

All Feature Flags endpoints require:

- **Authentication**: Valid JWT token in httpOnly cookie
- **Super Admin Privileges**: User must have `super_admin` role
- **Session Validation**: Active session with valid credentials

### Authentication Flow

```
Request → auth middleware → requireSuperAdmin middleware → Controller
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Error Codes

| HTTP Status | Error Message | Description |
|-------------|---------------|-------------|
| 400 | Validation failed | Invalid request data or parameters |
| 401 | Access denied. No token provided. | Missing authentication token |
| 401 | Invalid token | JWT token is invalid or expired |
| 403 | Super Administrator access required | User does not have super_admin role |
| 404 | Feature flag not found | Requested feature flag does not exist |
| 409 | Feature flag with key 'X' already exists | Duplicate feature key |
| 500 | Internal server error | Server-side error occurred |

---

## Endpoints

### 1. Get All Feature Flags

Retrieve all feature flags sorted by creation date (newest first).

**Endpoint:** `GET /api/feature-flags`

**Authentication:** Required (super_admin)

**Request:**
```http
GET /api/feature-flags HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "key": "clinical_decision_support",
      "name": "Clinical Decision Support",
      "description": "AI-powered clinical decision support system",
      "allowedTiers": ["pro", "enterprise"],
      "allowedRoles": ["pharmacist", "owner"],
      "isActive": true,
      "metadata": {
        "category": "clinical",
        "priority": "high",
        "tags": ["ai", "clinical"]
      },
      "createdBy": "60f7b3b3b3b3b3b3b3b3b3b6",
      "updatedBy": "60f7b3b3b3b3b3b3b3b3b3b6",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
      "key": "advanced_reports",
      "name": "Advanced Reports",
      "description": "Comprehensive analytics and reporting dashboard",
      "allowedTiers": ["enterprise"],
      "allowedRoles": ["owner", "super_admin"],
      "isActive": true,
      "metadata": {
        "category": "analytics",
        "priority": "medium",
        "tags": ["reports", "analytics"]
      },
      "createdBy": "60f7b3b3b3b3b3b3b3b3b3b6",
      "updatedBy": "60f7b3b3b3b3b3b3b3b3b3b6",
      "createdAt": "2024-01-14T09:30:00.000Z",
      "updatedAt": "2024-01-14T09:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "message": "Access denied. No token provided.",
  "code": "NO_TOKEN"
}

// 403 Forbidden
{
  "message": "Super Administrator access required.",
  "userRole": "pharmacist"
}
```

---

### 2. Create Feature Flag

Create a new feature flag with tier and role mappings.

**Endpoint:** `POST /api/feature-flags`

**Authentication:** Required (super_admin)

**Request:**
```http
POST /api/feature-flags HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
Content-Type: application/json

{
  "key": "inventory_management",
  "name": "Inventory Management",
  "description": "Advanced inventory tracking and management system",
  "allowedTiers": ["basic", "pro", "enterprise"],
  "allowedRoles": ["pharmacy_team", "pharmacy_outlet", "owner"],
  "isActive": true,
  "metadata": {
    "category": "operations",
    "priority": "high",
    "tags": ["inventory", "operations"]
  }
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | Yes | Unique feature identifier (lowercase, alphanumeric, underscores) |
| name | string | Yes | Human-readable display name |
| description | string | No | Feature description |
| allowedTiers | string[] | Yes | Array of subscription tiers (free_trial, basic, pro, Pharmily, Network, enterprise) |
| allowedRoles | string[] | Yes | Array of user roles (pharmacist, pharmacy_team, pharmacy_outlet, owner, super_admin) |
| isActive | boolean | No | Feature active status (default: true) |
| metadata | object | No | Additional metadata (category, priority, tags) |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
    "key": "inventory_management",
    "name": "Inventory Management",
    "description": "Advanced inventory tracking and management system",
    "allowedTiers": ["basic", "pro", "enterprise"],
    "allowedRoles": ["pharmacy_team", "pharmacy_outlet", "owner"],
    "isActive": true,
    "metadata": {
      "category": "operations",
      "priority": "high",
      "tags": ["inventory", "operations"]
    },
    "createdBy": "60f7b3b3b3b3b3b3b3b3b3b6",
    "updatedBy": "60f7b3b3b3b3b3b3b3b3b3b6",
    "createdAt": "2024-01-16T11:00:00.000Z",
    "updatedAt": "2024-01-16T11:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "message": "Feature key must contain only lowercase letters, numbers, and underscores"
}

// 400 Bad Request - Invalid Tier
{
  "success": false,
  "message": "Invalid tiers: premium, ultimate"
}

// 409 Conflict - Duplicate Key
{
  "success": false,
  "message": "Feature flag with key 'inventory_management' already exists"
}
```

---

### 3. Update Feature Flag

Update an existing feature flag by ID.

**Endpoint:** `PUT /api/feature-flags/:id`

**Authentication:** Required (super_admin)

**Request:**
```http
PUT /api/feature-flags/60f7b3b3b3b3b3b3b3b3b3b8 HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
Content-Type: application/json

{
  "name": "Advanced Inventory Management",
  "description": "Enhanced inventory tracking with predictive analytics",
  "allowedTiers": ["pro", "enterprise"],
  "isActive": true
}
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | MongoDB ObjectId of the feature flag |

**Request Body Parameters:**

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| key | string | Unique feature identifier |
| name | string | Human-readable display name |
| description | string | Feature description |
| allowedTiers | string[] | Array of subscription tiers |
| allowedRoles | string[] | Array of user roles |
| isActive | boolean | Feature active status |
| metadata | object | Additional metadata |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
    "key": "inventory_management",
    "name": "Advanced Inventory Management",
    "description": "Enhanced inventory tracking with predictive analytics",
    "allowedTiers": ["pro", "enterprise"],
    "allowedRoles": ["pharmacy_team", "pharmacy_outlet", "owner"],
    "isActive": true,
    "metadata": {
      "category": "operations",
      "priority": "high",
      "tags": ["inventory", "operations"]
    },
    "createdBy": "60f7b3b3b3b3b3b3b3b3b3b6",
    "updatedBy": "60f7b3b3b3b3b3b3b3b3b3b6",
    "createdAt": "2024-01-16T11:00:00.000Z",
    "updatedAt": "2024-01-16T14:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid ID
{
  "success": false,
  "message": "Invalid feature flag ID"
}

// 404 Not Found
{
  "success": false,
  "message": "Feature flag not found"
}

// 409 Conflict - Duplicate Key
{
  "success": false,
  "message": "Feature flag with key 'inventory_management' already exists"
}
```

---

### 4. Delete Feature Flag

Delete a feature flag by ID.

**Endpoint:** `DELETE /api/feature-flags/:id`

**Authentication:** Required (super_admin)

**Request:**
```http
DELETE /api/feature-flags/60f7b3b3b3b3b3b3b3b3b3b8 HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | MongoDB ObjectId of the feature flag |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Feature flag deleted successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid ID
{
  "success": false,
  "message": "Invalid feature flag ID"
}

// 404 Not Found
{
  "success": false,
  "message": "Feature flag not found"
}
```

---

### 5. Get Feature Flags by Tier

Retrieve all active feature flags available for a specific subscription tier.

**Endpoint:** `GET /api/feature-flags/tier/:tier`

**Authentication:** Required (super_admin)

**Request:**
```http
GET /api/feature-flags/tier/pro HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tier | string | Yes | Subscription tier (free_trial, basic, pro, Pharmily, Network, enterprise) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "key": "clinical_decision_support",
      "name": "Clinical Decision Support",
      "description": "AI-powered clinical decision support system",
      "allowedTiers": ["pro", "enterprise"],
      "allowedRoles": ["pharmacist", "owner"],
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
      "key": "inventory_management",
      "name": "Advanced Inventory Management",
      "description": "Enhanced inventory tracking with predictive analytics",
      "allowedTiers": ["pro", "enterprise"],
      "allowedRoles": ["pharmacy_team", "pharmacy_outlet", "owner"],
      "isActive": true,
      "createdAt": "2024-01-16T11:00:00.000Z",
      "updatedAt": "2024-01-16T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid Tier
{
  "success": false,
  "message": "Invalid tier: premium"
}
```

---

### 6. Bulk Update Tier Features

Add or remove multiple features from a subscription tier in a single operation.

**Endpoint:** `POST /api/feature-flags/tier/:tier/features`

**Authentication:** Required (super_admin)

**Request:**
```http
POST /api/feature-flags/tier/enterprise/features HTTP/1.1
Host: api.pharmacare.com
Cookie: accessToken=<jwt_token>
Content-Type: application/json

{
  "featureKeys": [
    "clinical_decision_support",
    "advanced_reports",
    "inventory_management"
  ],
  "action": "add"
}
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tier | string | Yes | Subscription tier (free_trial, basic, pro, Pharmily, Network, enterprise) |

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| featureKeys | string[] | Yes | Array of feature keys to add or remove |
| action | string | Yes | Operation to perform: "add" or "remove" |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully updated 3 features for tier 'enterprise'"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid Tier
{
  "success": false,
  "message": "Invalid tier: premium"
}

// 400 Bad Request - Invalid Action
{
  "success": false,
  "message": "Invalid action. Must be 'add' or 'remove'"
}

// 400 Bad Request - Empty Array
{
  "success": false,
  "message": "featureKeys array cannot be empty"
}

// 400 Bad Request - Missing Parameters
{
  "success": false,
  "message": "Missing required parameters: featureKeys, action"
}
```

---

## Data Models

### FeatureFlag Schema

```typescript
interface IFeatureFlag {
  _id: ObjectId;
  key: string;                    // Unique identifier (lowercase, alphanumeric, underscores)
  name: string;                   // Display name
  description?: string;           // Feature description
  isActive: boolean;              // Global enable/disable
  allowedTiers: string[];         // Subscription tiers with access
  allowedRoles: string[];         // User roles with access
  customRules?: {                 // Additional rules
    requiredLicense?: boolean;
    maxUsers?: number;
    [key: string]: any;
  };
  metadata?: {                    // Categorization
    category: string;
    priority: string;
    tags: string[];
    [key: string]: any;
  };
  createdBy?: ObjectId;           // User who created the feature
  updatedBy?: ObjectId;           // User who last updated the feature
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
}
```

### Available Tiers

```typescript
const AVAILABLE_TIERS = [
  'free_trial',
  'basic',
  'pro',
  'Pharmily',
  'Network',
  'enterprise'
];
```

### Available Roles

```typescript
const AVAILABLE_ROLES = [
  'pharmacist',
  'pharmacy_team',
  'pharmacy_outlet',
  'owner',
  'super_admin'
];
```

---

## Usage Examples

### Example 1: Create a New Feature for Pro and Enterprise Tiers

```javascript
const response = await fetch('/api/feature-flags', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    key: 'ai_diagnostics',
    name: 'AI Diagnostics',
    description: 'AI-powered diagnostic recommendations',
    allowedTiers: ['pro', 'enterprise'],
    allowedRoles: ['pharmacist', 'owner'],
    isActive: true,
    metadata: {
      category: 'clinical',
      priority: 'high',
      tags: ['ai', 'diagnostics']
    }
  })
});

const data = await response.json();
console.log(data);
```

### Example 2: Update Feature to Add More Tiers

```javascript
const featureId = '60f7b3b3b3b3b3b3b3b3b3b8';

const response = await fetch(`/api/feature-flags/${featureId}`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    allowedTiers: ['basic', 'pro', 'enterprise']
  })
});

const data = await response.json();
console.log(data);
```

### Example 3: Bulk Add Features to Enterprise Tier

```javascript
const response = await fetch('/api/feature-flags/tier/enterprise/features', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    featureKeys: [
      'ai_diagnostics',
      'advanced_reports',
      'clinical_decision_support'
    ],
    action: 'add'
  })
});

const data = await response.json();
console.log(data);
```

### Example 4: Get All Features for Pro Tier

```javascript
const response = await fetch('/api/feature-flags/tier/pro', {
  credentials: 'include'
});

const data = await response.json();
console.log(data.data); // Array of features
```

### Example 5: Delete a Feature Flag

```javascript
const featureId = '60f7b3b3b3b3b3b3b3b3b3b8';

const response = await fetch(`/api/feature-flags/${featureId}`, {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
console.log(data.message);
```

---

## Security Considerations

### Authentication Requirements

1. **JWT Token Validation**:
   - All requests must include valid JWT token in httpOnly cookie
   - Token expiration checked on every request
   - Invalid/expired tokens return 401 Unauthorized

2. **Role-Based Access Control**:
   - Only `super_admin` role can access feature management
   - Role checked via `requireSuperAdmin` middleware
   - Non-super_admin users receive 403 Forbidden

3. **Input Validation**:
   - Feature key must be unique and lowercase
   - Tier values must be from allowed list
   - Role values must be from allowed list
   - MongoDB ObjectId validation for IDs

4. **CSRF Protection**:
   - Credentials included in requests
   - SameSite cookie policy enforced

### Best Practices

1. **Feature Key Naming**:
   - Use lowercase with underscores
   - Be descriptive and consistent
   - Examples: `clinical_decision_support`, `advanced_reports`

2. **Tier Assignment**:
   - Start with higher tiers and expand down
   - Consider feature complexity and value
   - Document tier rationale in description

3. **Role Assignment**:
   - Assign minimum required roles
   - Consider user responsibilities
   - Review role assignments regularly

4. **Audit Logging**:
   - All changes logged with user ID
   - Timestamps tracked automatically
   - Review audit logs regularly

---

## Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| GET /api/feature-flags | 100 requests/minute |
| POST /api/feature-flags | 20 requests/minute |
| PUT /api/feature-flags/:id | 50 requests/minute |
| DELETE /api/feature-flags/:id | 20 requests/minute |
| GET /api/feature-flags/tier/:tier | 100 requests/minute |
| POST /api/feature-flags/tier/:tier/features | 10 requests/minute |

---

## Backward Compatibility

The Feature Flags API maintains full backward compatibility with existing workspace-level feature flag functionality:

1. **Workspace-Level Toggles**: Continue to function independently
2. **Existing Routes**: No conflicts with existing routes
3. **Database Schema**: Supports both global and workspace-level operations
4. **Runtime Checking**: Respects both global tier/role mappings and workspace overrides

---

## Troubleshooting

### Common Issues

**Issue: 401 Unauthorized**
- **Cause**: Missing or invalid JWT token
- **Solution**: Ensure user is logged in and token is included in cookie

**Issue: 403 Forbidden**
- **Cause**: User does not have super_admin role
- **Solution**: Verify user role in database, only super_admin can access

**Issue: 409 Conflict - Duplicate Key**
- **Cause**: Feature key already exists
- **Solution**: Use a unique feature key or update existing feature

**Issue: 400 Bad Request - Invalid Tier**
- **Cause**: Tier value not in allowed list
- **Solution**: Use one of: free_trial, basic, pro, Pharmily, Network, enterprise

**Issue: 404 Not Found**
- **Cause**: Feature flag ID does not exist
- **Solution**: Verify the feature flag ID is correct

### Debug Tips

1. **Check Authentication**:
   ```javascript
   // Verify token is included
   console.log(document.cookie);
   ```

2. **Validate Request Data**:
   ```javascript
   // Ensure data matches schema
   console.log(JSON.stringify(requestData, null, 2));
   ```

3. **Review Error Messages**:
   - Error messages provide specific details
   - Check `message` field in error response
   - Review server logs for additional context

---

## Changelog

### Version 1.0.0 (2024-01-16)

**Initial Release**
- Complete CRUD operations for feature flags
- Tier-based feature management
- Role-based access control
- Bulk operations support
- Super admin authorization
- Comprehensive error handling

---

## Support

For additional support or questions:

- **Documentation**: See related docs in `/docs` directory
- **API Issues**: Check server logs and error responses
- **Feature Requests**: Contact development team

---

## Related Documentation

- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)
- [Dynamic RBAC API](./DYNAMIC_RBAC_API.md)
- [SaaS Settings API](./SAAS_SETTINGS_API.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
