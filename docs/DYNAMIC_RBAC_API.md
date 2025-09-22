# Dynamic RBAC API Documentation

## Overview

The Dynamic RBAC (Role-Based Access Control) API provides comprehensive endpoints for managing roles, permissions, and user access control in the pharma-care-saas application. This system replaces the previous static RBAC implementation with a flexible, database-driven approach.

## Authentication & Authorization

All RBAC management endpoints require:

- **Authentication**: Valid JWT token via `Authorization: Bearer <token>` header
- **Super Admin Privileges**: User must have `super_admin` system role
- **Dynamic Permissions**: Specific permission checks for each operation

### Base URL

```
/api/admin
```

## Role Management API

### Create Role

Creates a new role with specified permissions and hierarchy.

```http
POST /api/admin/roles
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Required Permission:** `role:create`

**Request Body:**

```json
{
  "name": "pharmacy_manager",
  "displayName": "Pharmacy Manager",
  "description": "Manages pharmacy operations and staff",
  "category": "workplace",
  "parentRoleId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "permissions": [
    "patient.read",
    "patient.update",
    "medication.manage",
    "staff.supervise"
  ],
  "workspaceId": "60f7b3b3b3b3b3b3b3b3b3b4"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager",
      "displayName": "Pharmacy Manager",
      "description": "Manages pharmacy operations and staff",
      "category": "workplace",
      "parentRole": "60f7b3b3b3b3b3b3b3b3b3b3",
      "childRoles": [],
      "hierarchyLevel": 2,
      "permissions": [
        "patient.read",
        "patient.update",
        "medication.manage",
        "staff.supervise"
      ],
      "isActive": true,
      "isSystemRole": false,
      "workspaceId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "createdBy": "60f7b3b3b3b3b3b3b3b3b3b6",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Role name already exists"
    }
  ]
}

// 409 Conflict - Hierarchy Cycle
{
  "success": false,
  "message": "Role hierarchy would create a circular dependency",
  "code": "HIERARCHY_CYCLE_DETECTED"
}
```

### Get Roles

Retrieves roles with filtering, pagination, and search capabilities.

```http
GET /api/admin/roles
```

**Required Permission:** `role:read`

**Query Parameters:**

```
?page=1&limit=20&category=workplace&search=manager&includeInactive=false&workspaceId=60f7b3b3b3b3b3b3b3b3b3b4
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
        "name": "pharmacy_manager",
        "displayName": "Pharmacy Manager",
        "description": "Manages pharmacy operations and staff",
        "category": "workplace",
        "hierarchyLevel": 2,
        "permissionCount": 4,
        "userCount": 12,
        "isActive": true,
        "createdAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

### Get Role by ID

Retrieves detailed information about a specific role.

```http
GET /api/admin/roles/:id
```

**Required Permission:** `role:read`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "role": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager",
      "displayName": "Pharmacy Manager",
      "description": "Manages pharmacy operations and staff",
      "category": "workplace",
      "parentRole": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "pharmacy_owner",
        "displayName": "Pharmacy Owner"
      },
      "childRoles": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
          "name": "pharmacy_staff",
          "displayName": "Pharmacy Staff"
        }
      ],
      "permissions": [
        "patient.read",
        "patient.update",
        "medication.manage",
        "staff.supervise"
      ],
      "inheritedPermissions": ["workspace.manage", "reports.view"],
      "effectivePermissions": [
        "patient.read",
        "patient.update",
        "medication.manage",
        "staff.supervise",
        "workspace.manage",
        "reports.view"
      ],
      "assignedUsers": 12,
      "hierarchyLevel": 2,
      "isActive": true,
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  }
}
```

### Update Role

Updates role information, permissions, or hierarchy.

```http
PUT /api/admin/roles/:id
```

**Required Permission:** `role:update`

**Request Body:**

```json
{
  "displayName": "Senior Pharmacy Manager",
  "description": "Senior manager with additional responsibilities",
  "permissions": [
    "patient.read",
    "patient.update",
    "patient.create",
    "medication.manage",
    "staff.supervise",
    "reports.generate"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "role": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager",
      "displayName": "Senior Pharmacy Manager",
      "description": "Senior manager with additional responsibilities",
      "permissions": [
        "patient.read",
        "patient.update",
        "patient.create",
        "medication.manage",
        "staff.supervise",
        "reports.generate"
      ],
      "updatedAt": "2023-12-01T11:00:00.000Z"
    },
    "affectedUsers": 12,
    "cacheInvalidated": true
  }
}
```

### Delete Role

Deletes a role and handles user reassignments.

```http
DELETE /api/admin/roles/:id
```

**Required Permission:** `role:delete`

**Query Parameters:**

```
?reassignToRoleId=60f7b3b3b3b3b3b3b3b3b3b8&notifyUsers=true
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": {
    "deletedRole": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager"
    },
    "affectedUsers": 12,
    "reassignedUsers": 12,
    "notificationsSent": 12
  }
}
```

### Get Role Permissions

Retrieves all permissions for a specific role including inherited ones.

```http
GET /api/admin/roles/:id/permissions
```

**Required Permission:** `role:read`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "roleName": "pharmacy_manager",
    "directPermissions": [
      {
        "action": "patient.read",
        "displayName": "Read Patient Information",
        "category": "patient_management",
        "source": "direct"
      }
    ],
    "inheritedPermissions": [
      {
        "action": "workspace.manage",
        "displayName": "Manage Workspace",
        "category": "workspace",
        "source": "inherited",
        "inheritedFrom": "pharmacy_owner"
      }
    ],
    "effectivePermissions": [
      "patient.read",
      "patient.update",
      "medication.manage",
      "staff.supervise",
      "workspace.manage",
      "reports.view"
    ]
  }
}
```

## Role Hierarchy Management API

### Add Child Roles

Adds child roles to a parent role in the hierarchy.

```http
POST /api/admin/roles/:id/children
```

**Required Permission:** `role:update`

**Request Body:**

```json
{
  "childRoleIds": ["60f7b3b3b3b3b3b3b3b3b3b7", "60f7b3b3b3b3b3b3b3b3b8"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Child roles added successfully",
  "data": {
    "parentRole": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager",
      "childRoles": ["60f7b3b3b3b3b3b3b3b3b3b7", "60f7b3b3b3b3b3b3b3b3b8"]
    },
    "hierarchyUpdated": true
  }
}
```

### Remove Child Role

Removes a child role from parent role hierarchy.

```http
DELETE /api/admin/roles/:id/children/:childId
```

**Required Permission:** `role:update`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Child role removed successfully",
  "data": {
    "parentRoleId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "removedChildRoleId": "60f7b3b3b3b3b3b3b3b3b7",
    "hierarchyUpdated": true
  }
}
```

### Get Role Hierarchy

Retrieves the complete hierarchy for a specific role.

```http
GET /api/admin/roles/:id/hierarchy
```

**Required Permission:** `role:read`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "role": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "pharmacy_manager",
      "hierarchyLevel": 2
    },
    "ancestors": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "pharmacy_owner",
        "hierarchyLevel": 1
      }
    ],
    "descendants": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "name": "pharmacy_staff",
        "hierarchyLevel": 3
      }
    ],
    "siblings": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b9",
        "name": "pharmacy_assistant_manager",
        "hierarchyLevel": 2
      }
    ]
  }
}
```

### Change Parent Role

Changes the parent role in the hierarchy.

```http
PUT /api/admin/roles/:id/parent
```

**Required Permission:** `role:update`

**Request Body:**

```json
{
  "parentRoleId": "60f7b3b3b3b3b3b3b3b3b3b9"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Parent role changed successfully",
  "data": {
    "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "oldParentRoleId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "newParentRoleId": "60f7b3b3b3b3b3b3b3b3b3b9",
    "hierarchyLevelChanged": true,
    "affectedDescendants": 5
  }
}
```

### Get Full Role Hierarchy Tree

Retrieves the complete role hierarchy tree structure.

```http
GET /api/admin/roles/hierarchy-tree
```

**Required Permission:** `role:read`

**Query Parameters:**

```
?workspaceId=60f7b3b3b3b3b3b3b3b3b3b4&includePermissions=true
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "hierarchyTree": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
        "name": "super_admin",
        "displayName": "Super Administrator",
        "hierarchyLevel": 0,
        "children": [
          {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "name": "pharmacy_owner",
            "displayName": "Pharmacy Owner",
            "hierarchyLevel": 1,
            "children": [
              {
                "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
                "name": "pharmacy_manager",
                "displayName": "Pharmacy Manager",
                "hierarchyLevel": 2,
                "children": []
              }
            ]
          }
        ]
      }
    ],
    "totalRoles": 15,
    "maxHierarchyDepth": 4
  }
}
```

## Permission Management API

### Get Permissions

Retrieves all available permissions with filtering and categorization.

```http
GET /api/admin/permissions
```

**Required Permission:** `permission:read`

**Query Parameters:**

```
?category=patient_management&search=patient&includeSystem=true&page=1&limit=50
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "action": "patient.read",
        "displayName": "Read Patient Information",
        "description": "View patient details and medical history",
        "category": "patient_management",
        "isSystemPermission": true,
        "requiresSubscription": false,
        "allowTrialAccess": true,
        "requiredPlanTiers": ["basic", "premium"],
        "dependsOn": [],
        "conflicts": [],
        "usageCount": 45,
        "createdAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 234,
      "itemsPerPage": 50
    }
  }
}
```

### Get Permission Matrix

Retrieves the complete permission matrix organized by categories.

```http
GET /api/admin/permissions/matrix
```

**Required Permission:** `permission:read`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "matrix": {
      "patient_management": [
        {
          "action": "patient.create",
          "displayName": "Create Patient",
          "description": "Add new patients to the system"
        },
        {
          "action": "patient.read",
          "displayName": "Read Patient Information",
          "description": "View patient details and medical history"
        }
      ],
      "medication_management": [
        {
          "action": "medication.dispense",
          "displayName": "Dispense Medication",
          "description": "Process medication dispensing"
        }
      ]
    },
    "totalPermissions": 234,
    "categories": [
      "patient_management",
      "medication_management",
      "workspace",
      "reporting",
      "administration"
    ]
  }
}
```

### Create Permission

Creates a new permission in the system.

```http
POST /api/admin/permissions
```

**Required Permission:** `permission:create`

**Request Body:**

```json
{
  "action": "inventory.audit",
  "displayName": "Audit Inventory",
  "description": "Perform inventory audits and reconciliation",
  "category": "inventory_management",
  "requiresSubscription": true,
  "allowTrialAccess": false,
  "requiredPlanTiers": ["premium"],
  "dependsOn": ["inventory.read"],
  "conflicts": []
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3c1",
      "action": "inventory.audit",
      "displayName": "Audit Inventory",
      "description": "Perform inventory audits and reconciliation",
      "category": "inventory_management",
      "isSystemPermission": false,
      "requiresSubscription": true,
      "allowTrialAccess": false,
      "requiredPlanTiers": ["premium"],
      "dependsOn": ["inventory.read"],
      "conflicts": [],
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  }
}
```

### Update Permission

Updates an existing permission.

```http
PUT /api/admin/permissions/:action
```

**Required Permission:** `permission:update`

**Request Body:**

```json
{
  "displayName": "Advanced Inventory Audit",
  "description": "Perform comprehensive inventory audits with analytics",
  "requiredPlanTiers": ["premium", "enterprise"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "permission": {
      "action": "inventory.audit",
      "displayName": "Advanced Inventory Audit",
      "description": "Perform comprehensive inventory audits with analytics",
      "requiredPlanTiers": ["premium", "enterprise"],
      "updatedAt": "2023-12-01T11:00:00.000Z"
    },
    "affectedRoles": 3,
    "affectedUsers": 15
  }
}
```

## User Role Assignment API

### Assign User Roles

Assigns one or more roles to a user.

```http
POST /api/admin/users/:id/roles
```

**Required Permission:** `user:update`

**Request Body:**

```json
{
  "roleIds": ["60f7b3b3b3b3b3b3b3b3b3b5", "60f7b3b3b3b3b3b3b3b3b7"],
  "workspaceId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "expiresAt": "2024-12-01T10:00:00.000Z",
  "isTemporary": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Roles assigned successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "assignedRoles": [
      {
        "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "roleName": "pharmacy_manager",
        "assignedAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "effectivePermissions": [
      "patient.read",
      "patient.update",
      "medication.manage"
    ],
    "cacheInvalidated": true
  }
}
```

### Revoke User Role

Removes a specific role from a user.

```http
DELETE /api/admin/users/:id/roles/:roleId
```

**Required Permission:** `user:update`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Role revoked successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "revokedRole": {
      "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
      "roleName": "pharmacy_manager"
    },
    "remainingRoles": [
      {
        "roleId": "60f7b3b3b3b3b3b3b3b3b3b7",
        "roleName": "pharmacy_staff"
      }
    ],
    "effectivePermissions": ["patient.read", "medication.view"]
  }
}
```

### Update User Permissions

Updates direct permissions for a user.

```http
PUT /api/admin/users/:id/permissions
```

**Required Permission:** `user:update`

**Request Body:**

```json
{
  "directPermissions": ["reports.generate", "analytics.view"],
  "deniedPermissions": ["patient.delete"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User permissions updated successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "directPermissions": ["reports.generate", "analytics.view"],
    "deniedPermissions": ["patient.delete"],
    "effectivePermissions": [
      "patient.read",
      "patient.update",
      "medication.manage",
      "reports.generate",
      "analytics.view"
    ]
  }
}
```

### Get User Effective Permissions

Retrieves all effective permissions for a user including role-based and direct permissions.

```http
GET /api/admin/users/:id/effective-permissions
```

**Required Permission:** `user:read`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@pharmacy.com"
    },
    "assignedRoles": [
      {
        "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "roleName": "pharmacy_manager",
        "displayName": "Pharmacy Manager"
      }
    ],
    "permissionSources": {
      "rolePermissions": [
        {
          "permission": "patient.read",
          "source": "pharmacy_manager",
          "inherited": false
        },
        {
          "permission": "workspace.manage",
          "source": "pharmacy_owner",
          "inherited": true,
          "inheritedFrom": "pharmacy_manager"
        }
      ],
      "directPermissions": [
        {
          "permission": "reports.generate",
          "source": "direct"
        }
      ],
      "deniedPermissions": [
        {
          "permission": "patient.delete",
          "source": "direct"
        }
      ]
    },
    "effectivePermissions": [
      "patient.read",
      "patient.update",
      "medication.manage",
      "workspace.manage",
      "reports.generate"
    ],
    "deniedPermissions": ["patient.delete"]
  }
}
```

### Bulk Update Users

Performs bulk role and permission updates for multiple users.

```http
POST /api/admin/users/bulk-update
```

**Required Permission:** `user:update`

**Request Body:**

```json
{
  "updates": [
    {
      "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
      "roleIds": ["60f7b3b3b3b3b3b3b3b3b3b5"],
      "directPermissions": ["reports.generate"]
    },
    {
      "userId": "60f7b3b3b3b3b3b3b3b3b3b7",
      "roleIds": ["60f7b3b3b3b3b3b3b3b3b3b8"],
      "deniedPermissions": ["patient.delete"]
    }
  ],
  "notifyUsers": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Bulk update completed",
  "data": {
    "totalUsers": 2,
    "successfulUpdates": 2,
    "failedUpdates": 0,
    "results": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "status": "success",
        "rolesAssigned": 1,
        "permissionsUpdated": 1
      },
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b7",
        "status": "success",
        "rolesAssigned": 1,
        "permissionsDenied": 1
      }
    ],
    "notificationsSent": 2
  }
}
```

## Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field that caused error",
    "value": "invalid value"
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes

| Code                       | Status | Description                                     |
| -------------------------- | ------ | ----------------------------------------------- |
| `AUTHENTICATION_REQUIRED`  | 401    | JWT token missing or invalid                    |
| `INSUFFICIENT_PERMISSIONS` | 403    | User lacks required permissions                 |
| `ROLE_NOT_FOUND`           | 404    | Specified role does not exist                   |
| `PERMISSION_NOT_FOUND`     | 404    | Specified permission does not exist             |
| `USER_NOT_FOUND`           | 404    | Specified user does not exist                   |
| `ROLE_NAME_EXISTS`         | 409    | Role name already in use                        |
| `HIERARCHY_CYCLE_DETECTED` | 409    | Role hierarchy would create circular dependency |
| `ROLE_IN_USE`              | 409    | Cannot delete role that is assigned to users    |
| `VALIDATION_FAILED`        | 422    | Request data validation failed                  |
| `CACHE_ERROR`              | 500    | Permission cache operation failed               |
| `DATABASE_ERROR`           | 500    | Database operation failed                       |

### Permission-Specific Errors

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredPermissions": ["role:create"],
  "userPermissions": ["role:read"],
  "suggestions": [
    "Contact your administrator to request role:create permission",
    "Use the role:read permission to view existing roles instead"
  ]
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Role Management**: 100 requests per minute per user
- **Permission Management**: 50 requests per minute per user
- **User Assignment**: 200 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701432000
```

## Caching

The API implements intelligent caching for performance:

- **User Permissions**: Cached for 5 minutes, invalidated on role changes
- **Role Hierarchy**: Cached for 10 minutes, invalidated on hierarchy changes
- **Permission Matrix**: Cached for 30 minutes, invalidated on permission updates

Cache status is indicated in response headers:

```
X-Cache-Status: HIT
X-Cache-TTL: 300
```

## Webhooks

The system supports webhooks for real-time notifications:

### Role Events

- `role.created`
- `role.updated`
- `role.deleted`
- `role.hierarchy.changed`

### User Events

- `user.role.assigned`
- `user.role.revoked`
- `user.permissions.updated`

### Webhook Payload Example

```json
{
  "event": "user.role.assigned",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "roleId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "roleName": "pharmacy_manager",
    "assignedBy": "60f7b3b3b3b3b3b3b3b3b3b1",
    "workspaceId": "60f7b3b3b3b3b3b3b3b3b3b4"
  }
}
```

## SDK Examples

### JavaScript/TypeScript SDK Usage

```typescript
import { DynamicRBACClient } from '@pharma-care/rbac-sdk';

const rbacClient = new DynamicRBACClient({
  baseURL: 'https://api.pharma-care.com',
  apiKey: 'your-api-key',
});

// Create a new role
const newRole = await rbacClient.roles.create({
  name: 'pharmacy_technician',
  displayName: 'Pharmacy Technician',
  description: 'Assists pharmacists with daily operations',
  permissions: ['patient.read', 'medication.view'],
});

// Assign role to user
await rbacClient.users.assignRoles('user-id', {
  roleIds: [newRole.id],
  workspaceId: 'workspace-id',
});

// Check user permissions
const permissions = await rbacClient.users.getEffectivePermissions('user-id');
console.log('User permissions:', permissions.effectivePermissions);
```

### Python SDK Usage

```python
from pharma_care_rbac import DynamicRBACClient

client = DynamicRBACClient(
    base_url='https://api.pharma-care.com',
    api_key='your-api-key'
)

# Create role
role = client.roles.create({
    'name': 'pharmacy_technician',
    'displayName': 'Pharmacy Technician',
    'permissions': ['patient.read', 'medication.view']
})

# Assign to user
client.users.assign_roles('user-id', {
    'roleIds': [role['id']],
    'workspaceId': 'workspace-id'
})
```

## Migration Guide

### From Static to Dynamic RBAC

1. **Backup Current Configuration**

   ```bash
   # Export current role assignments
   curl -H "Authorization: Bearer $TOKEN" \
        "https://api.pharma-care.com/api/admin/migration/export-static-roles" \
        > static-roles-backup.json
   ```

2. **Run Migration Script**

   ```bash
   # Execute migration
   curl -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.pharma-care.com/api/admin/migration/static-to-dynamic"
   ```

3. **Validate Migration**
   ```bash
   # Verify user permissions
   curl -H "Authorization: Bearer $TOKEN" \
        "https://api.pharma-care.com/api/admin/migration/validate"
   ```

### Backward Compatibility

During the transition period, both static and dynamic permission checks are supported:

```typescript
// Legacy static check (deprecated)
requirePermission('patient.read');

// New dynamic check (recommended)
requireDynamicPermission('patient.read');
```

## Testing

### API Testing Examples

```javascript
// Jest test example
describe('Role Management API', () => {
  test('should create role with valid data', async () => {
    const response = await request(app)
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'test_role',
        displayName: 'Test Role',
        permissions: ['patient.read'],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.role.name).toBe('test_role');
  });
});
```

### Postman Collection

A comprehensive Postman collection is available for API testing:

```json
{
  "info": {
    "name": "Dynamic RBAC API",
    "description": "Complete API collection for Dynamic RBAC testing"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  }
}
```

## Support

For API support and questions:

- **Documentation**: [https://docs.pharma-care.com/rbac](https://docs.pharma-care.com/rbac)
- **Support Email**: api-support@pharma-care.com
- **Developer Forum**: [https://forum.pharma-care.com/api](https://forum.pharma-care.com/api)
- **Status Page**: [https://status.pharma-care.com](https://status.pharma-care.com)
