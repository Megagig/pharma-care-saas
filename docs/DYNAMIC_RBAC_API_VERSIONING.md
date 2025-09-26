# Dynamic RBAC API Versioning Guide

## Overview

This document outlines the API versioning strategy for the Dynamic RBAC system, ensuring backward compatibility during the transition from static to dynamic RBAC implementations. It covers version management, deprecation policies, and migration paths for API consumers.

## Table of Contents

1. [Versioning Strategy](#versioning-strategy)
2. [API Version Support](#api-version-support)
3. [Backward Compatibility](#backward-compatibility)
4. [Version Headers](#version-headers)
5. [Endpoint Versioning](#endpoint-versioning)
6. [Response Format Evolution](#response-format-evolution)
7. [Deprecation Policy](#deprecation-policy)
8. [Client Migration Guide](#client-migration-guide)
9. [Version-Specific Examples](#version-specific-examples)
10. [Testing Across Versions](#testing-across-versions)

## Versioning Strategy

### Semantic Versioning

The Dynamic RBAC API follows semantic versioning (SemVer) principles:

- **Major Version (v1, v2)**: Breaking changes that require client updates
- **Minor Version (v2.1, v2.2)**: New features that are backward compatible
- **Patch Version (v2.1.1, v2.1.2)**: Bug fixes and security updates

### Version Lifecycle

```javascript
const versionLifecycle = {
  v1: {
    status: 'deprecated',
    deprecationDate: '2024-01-01',
    sunsetDate: '2024-07-01',
    description: 'Static RBAC API - Legacy support only',
  },
  v2: {
    status: 'current',
    releaseDate: '2024-01-01',
    description: 'Dynamic RBAC API - Full feature support',
  },
  v3: {
    status: 'preview',
    releaseDate: '2024-06-01',
    description: 'Enhanced Dynamic RBAC with advanced features',
  },
};
```

## API Version Support

### Current Support Matrix

| Version | Status     | Support Level       | End of Life |
| ------- | ---------- | ------------------- | ----------- |
| v1.x    | Deprecated | Security fixes only | July 2024   |
| v2.0    | Current    | Full support        | TBD         |
| v2.1    | Current    | Full support        | TBD         |
| v3.0    | Preview    | Beta testing        | TBD         |

### Version Detection

```javascript
// middleware/versionDetection.js
const detectAPIVersion = (req, res, next) => {
  // Priority order for version detection
  const version =
    req.headers['api-version'] || // Header-based
    req.query.version || // Query parameter
    req.path.match(/^\/api\/v(\d+)/)?.[1] || // URL path
    '2'; // Default to current version

  req.apiVersion = `v${version}`;

  // Validate version
  if (!supportedVersions.includes(req.apiVersion)) {
    return res.status(400).json({
      error: 'Unsupported API version',
      supportedVersions,
      requestedVersion: req.apiVersion,
    });
  }

  next();
};

const supportedVersions = ['v1', 'v2'];
```

## Backward Compatibility

### Compatibility Layer

```javascript
// middleware/compatibilityLayer.js
const compatibilityLayer = (req, res, next) => {
  if (req.apiVersion === 'v1') {
    // Transform v1 requests to v2 format
    req.body = transformV1ToV2Request(req.body);

    // Wrap response to transform back to v1 format
    const originalSend = res.send;
    res.send = function (data) {
      const transformedData = transformV2ToV1Response(data);
      originalSend.call(this, transformedData);
    };
  }

  next();
};

const transformV1ToV2Request = (v1Data) => {
  if (!v1Data) return v1Data;

  // Transform static role names to dynamic role IDs
  if (v1Data.roles) {
    v1Data.roleIds = v1Data.roles.map((roleName) => {
      const mapping = {
        SUPER_ADMIN: 'super_admin',
        PHARMACY_OWNER: 'pharmacy_owner',
        PHARMACY_MANAGER: 'pharmacy_manager',
        PHARMACY_STAFF: 'pharmacy_staff',
      };
      return mapping[roleName] || roleName;
    });
    delete v1Data.roles;
  }

  // Transform static permissions to dynamic permissions
  if (v1Data.permissions) {
    v1Data.permissions = v1Data.permissions.map((permission) => {
      const mapping = {
        VIEW_PATIENTS: 'patient.read',
        CREATE_PATIENT: 'patient.create',
        UPDATE_PATIENT: 'patient.update',
        DELETE_PATIENT: 'patient.delete',
        MANAGE_INVENTORY: 'inventory.manage',
        VIEW_REPORTS: 'reports.view',
      };
      return mapping[permission] || permission;
    });
  }

  return v1Data;
};

const transformV2ToV1Response = (v2Data) => {
  if (!v2Data || typeof v2Data !== 'object') return v2Data;

  // Transform dynamic role names back to static format
  if (v2Data.roles) {
    v2Data.roles = v2Data.roles.map((role) => {
      const mapping = {
        super_admin: 'SUPER_ADMIN',
        pharmacy_owner: 'PHARMACY_OWNER',
        pharmacy_manager: 'PHARMACY_MANAGER',
        pharmacy_staff: 'PHARMACY_STAFF',
      };

      if (typeof role === 'object') {
        return {
          ...role,
          name: mapping[role.name] || role.name,
        };
      }

      return mapping[role] || role;
    });
  }

  // Transform dynamic permissions back to static format
  if (v2Data.permissions) {
    v2Data.permissions = v2Data.permissions.map((permission) => {
      const mapping = {
        'patient.read': 'VIEW_PATIENTS',
        'patient.create': 'CREATE_PATIENT',
        'patient.update': 'UPDATE_PATIENT',
        'patient.delete': 'DELETE_PATIENT',
        'inventory.manage': 'MANAGE_INVENTORY',
        'reports.view': 'VIEW_REPORTS',
      };
      return mapping[permission] || permission;
    });
  }

  return v2Data;
};
```

## Version Headers

### Request Headers

```http
# Specify API version via header (recommended)
GET /api/admin/roles
API-Version: 2
Authorization: Bearer <token>

# Alternative: Accept header with version
GET /api/admin/roles
Accept: application/vnd.pharma-care.v2+json
Authorization: Bearer <token>
```

### Response Headers

```http
HTTP/1.1 200 OK
API-Version: 2
API-Supported-Versions: 1,2
API-Deprecated-Versions: 1
API-Sunset-Date: 2024-07-01
Content-Type: application/json

{
  "success": true,
  "data": { ... }
}
```

### Version Header Middleware

```javascript
// middleware/versionHeaders.js
const addVersionHeaders = (req, res, next) => {
  // Add version information to all responses
  res.set({
    'API-Version': req.apiVersion.replace('v', ''),
    'API-Supported-Versions': supportedVersions
      .map((v) => v.replace('v', ''))
      .join(','),
    'API-Deprecated-Versions': deprecatedVersions
      .map((v) => v.replace('v', ''))
      .join(','),
  });

  // Add sunset date for deprecated versions
  if (deprecatedVersions.includes(req.apiVersion)) {
    const sunsetDate = versionLifecycle[req.apiVersion]?.sunsetDate;
    if (sunsetDate) {
      res.set('API-Sunset-Date', sunsetDate);
      res.set('Deprecation', 'true');
    }
  }

  next();
};
```

## Endpoint Versioning

### URL Path Versioning

```javascript
// routes/versionedRoutes.js
const express = require('express');
const v1Routes = require('./v1');
const v2Routes = require('./v2');

const router = express.Router();

// Version-specific route mounting
router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

// Default to current version
router.use('/', v2Routes);

module.exports = router;
```

### Version-Specific Route Handlers

```javascript
// routes/v1/roles.js - Legacy static RBAC
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Return static role format
    const roles = await getStaticRoles();
    res.json({
      success: true,
      roles: roles.map((role) => ({
        name: role.name,
        permissions: role.permissions,
        description: role.description,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// routes/v2/roles.js - Dynamic RBAC
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Return dynamic role format
    const roles = await getDynamicRoles();
    res.json({
      success: true,
      data: {
        roles: roles.map((role) => ({
          _id: role._id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          category: role.category,
          permissions: role.permissions,
          hierarchyLevel: role.hierarchyLevel,
          parentRole: role.parentRole,
          childRoles: role.childRoles,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'ROLE_FETCH_ERROR',
    });
  }
});
```

## Response Format Evolution

### V1 Response Format (Legacy)

```json
{
  "success": true,
  "roles": [
    {
      "name": "PHARMACY_MANAGER",
      "permissions": [
        "VIEW_PATIENTS",
        "CREATE_PATIENT",
        "UPDATE_PATIENT",
        "MANAGE_INVENTORY"
      ],
      "description": "Manages pharmacy operations"
    }
  ]
}
```

### V2 Response Format (Current)

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
        "permissions": [
          "patient.read",
          "patient.create",
          "patient.update",
          "inventory.manage"
        ],
        "hierarchyLevel": 2,
        "parentRole": "60f7b3b3b3b3b3b3b3b3b3b3",
        "childRoles": ["60f7b3b3b3b3b3b3b3b3b3b7"],
        "isActive": true,
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20
    }
  }
}
```

### Response Format Adapter

```javascript
// utils/responseAdapter.js
class ResponseAdapter {
  static adaptToVersion(data, version) {
    switch (version) {
      case 'v1':
        return this.adaptToV1(data);
      case 'v2':
        return this.adaptToV2(data);
      default:
        return data;
    }
  }

  static adaptToV1(v2Data) {
    if (!v2Data.success) return v2Data;

    // Transform v2 structure to v1
    const adapted = {
      success: v2Data.success,
    };

    if (v2Data.data?.roles) {
      adapted.roles = v2Data.data.roles.map((role) => ({
        name: this.mapDynamicToStaticRole(role.name),
        permissions: role.permissions.map((p) =>
          this.mapDynamicToStaticPermission(p)
        ),
        description: role.description,
      }));
    }

    if (v2Data.data?.users) {
      adapted.users = v2Data.data.users.map((user) => ({
        id: user._id,
        email: user.email,
        roles:
          user.roles?.map((r) => this.mapDynamicToStaticRole(r.name)) || [],
        permissions:
          user.permissions?.map((p) => this.mapDynamicToStaticPermission(p)) ||
          [],
      }));
    }

    return adapted;
  }

  static adaptToV2(data) {
    // V2 is the native format, no adaptation needed
    return data;
  }

  static mapDynamicToStaticRole(dynamicRole) {
    const mapping = {
      super_admin: 'SUPER_ADMIN',
      pharmacy_owner: 'PHARMACY_OWNER',
      pharmacy_manager: 'PHARMACY_MANAGER',
      pharmacy_staff: 'PHARMACY_STAFF',
    };
    return mapping[dynamicRole] || dynamicRole.toUpperCase();
  }

  static mapDynamicToStaticPermission(dynamicPermission) {
    const mapping = {
      'patient.read': 'VIEW_PATIENTS',
      'patient.create': 'CREATE_PATIENT',
      'patient.update': 'UPDATE_PATIENT',
      'patient.delete': 'DELETE_PATIENT',
      'inventory.manage': 'MANAGE_INVENTORY',
      'reports.view': 'VIEW_REPORTS',
      'workspace.manage': 'MANAGE_WORKSPACE',
    };
    return mapping[dynamicPermission] || dynamicPermission.toUpperCase();
  }
}
```

## Deprecation Policy

### Deprecation Timeline

```javascript
// config/deprecationPolicy.js
const deprecationPolicy = {
  // Minimum support period for each version type
  major: '12 months',
  minor: '6 months',
  patch: '3 months',

  // Deprecation process stages
  stages: {
    announcement: {
      duration: '3 months',
      actions: [
        'Documentation update',
        'Client notification',
        'Migration guide',
      ],
    },
    deprecation: {
      duration: '6 months',
      actions: ['Deprecation headers', 'Warning logs', 'Limited support'],
    },
    sunset: {
      duration: '3 months',
      actions: ['Final warnings', 'Migration assistance', 'Sunset preparation'],
    },
    removal: {
      actions: ['Version removal', 'Redirect to current version'],
    },
  },
};
```

### Deprecation Warnings

```javascript
// middleware/deprecationWarnings.js
const addDeprecationWarnings = (req, res, next) => {
  const version = req.apiVersion;
  const versionInfo = versionLifecycle[version];

  if (versionInfo?.status === 'deprecated') {
    // Add deprecation headers
    res.set({
      Deprecation: 'true',
      Sunset: versionInfo.sunsetDate,
      Link: '</api/v2>; rel="successor-version"',
    });

    // Log deprecation usage
    console.warn(
      `Deprecated API usage: ${version} - ${req.method} ${req.path}`,
      {
        userAgent: req.get('User-Agent'),
        clientIP: req.ip,
        timestamp: new Date().toISOString(),
      }
    );

    // Add warning to response body
    const originalSend = res.send;
    res.send = function (data) {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          parsed._deprecation = {
            message: `API version ${version} is deprecated`,
            sunsetDate: versionInfo.sunsetDate,
            migrationGuide: 'https://docs.pharma-care.com/api/migration',
          };
          data = JSON.stringify(parsed);
        } catch (e) {
          // Not JSON, skip warning injection
        }
      }
      originalSend.call(this, data);
    };
  }

  next();
};
```

## Client Migration Guide

### JavaScript/TypeScript Client Migration

#### V1 to V2 Migration

**Before (V1):**

```javascript
// V1 Client Code
const client = new PharmaCareClient({
  baseURL: 'https://api.pharma-care.com/api/v1',
  apiKey: 'your-api-key',
});

// Get roles
const roles = await client.get('/roles');
console.log(roles.roles); // Array of roles

// Assign role to user
await client.post(`/users/${userId}/roles`, {
  roles: ['PHARMACY_MANAGER'],
});
```

**After (V2):**

```javascript
// V2 Client Code
const client = new PharmaCareClient({
  baseURL: 'https://api.pharma-care.com/api/v2',
  apiKey: 'your-api-key',
});

// Get roles
const response = await client.get('/admin/roles');
console.log(response.data.roles); // Array of roles with full metadata

// Assign role to user
await client.post(`/admin/users/${userId}/roles`, {
  roleIds: ['60f7b3b3b3b3b3b3b3b3b3b5'], // Use role IDs instead of names
});
```

#### Migration Helper

```javascript
// utils/clientMigrationHelper.js
class ClientMigrationHelper {
  constructor(baseURL, apiKey) {
    this.v1Client = new PharmaCareClient({ baseURL: `${baseURL}/v1`, apiKey });
    this.v2Client = new PharmaCareClient({ baseURL: `${baseURL}/v2`, apiKey });
    this.roleMapping = new Map();
  }

  async initialize() {
    // Build role mapping from v1 names to v2 IDs
    const v1Roles = await this.v1Client.get('/roles');
    const v2Roles = await this.v2Client.get('/admin/roles');

    for (const v1Role of v1Roles.roles) {
      const v2Role = v2Roles.data.roles.find(
        (r) => this.mapV1ToV2RoleName(v1Role.name) === r.name
      );
      if (v2Role) {
        this.roleMapping.set(v1Role.name, v2Role._id);
      }
    }
  }

  async migrateRoleAssignment(userId, v1RoleNames) {
    const v2RoleIds = v1RoleNames
      .map((name) => this.roleMapping.get(name))
      .filter((id) => id);

    return await this.v2Client.post(`/admin/users/${userId}/roles`, {
      roleIds: v2RoleIds,
    });
  }

  mapV1ToV2RoleName(v1Name) {
    const mapping = {
      SUPER_ADMIN: 'super_admin',
      PHARMACY_OWNER: 'pharmacy_owner',
      PHARMACY_MANAGER: 'pharmacy_manager',
      PHARMACY_STAFF: 'pharmacy_staff',
    };
    return mapping[v1Name] || v1Name.toLowerCase();
  }
}
```

### Frontend Migration

#### React Hook Migration

**Before (V1):**

```javascript
// V1 Hook
const useRoles = () => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetch('/api/v1/roles')
      .then((res) => res.json())
      .then((data) => setRoles(data.roles));
  }, []);

  return { roles };
};
```

**After (V2):**

```javascript
// V2 Hook
const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v2/admin/roles', {
      headers: { 'API-Version': '2' },
    })
      .then((res) => res.json())
      .then((data) => {
        setRoles(data.data.roles);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { roles, loading, error };
};
```

## Version-Specific Examples

### User Permission Check

#### V1 Implementation

```javascript
// V1 - Static permission check
app.get('/api/v1/patients', (req, res) => {
  const userRoles = req.user.roles || [];
  const userPermissions = req.user.permissions || [];

  const hasAccess =
    userPermissions.includes('VIEW_PATIENTS') ||
    userRoles.includes('PHARMACY_MANAGER') ||
    userRoles.includes('PHARMACY_OWNER');

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Return patients...
});
```

#### V2 Implementation

```javascript
// V2 - Dynamic permission check
app.get(
  '/api/v2/patients',
  requireDynamicPermission('patient.read'),
  (req, res) => {
    // Permission already checked by middleware
    // Return patients...
  }
);
```

### Role Creation

#### V1 Format

```http
POST /api/v1/roles
Content-Type: application/json

{
  "name": "CUSTOM_ROLE",
  "permissions": ["VIEW_PATIENTS", "CREATE_PATIENT"],
  "description": "Custom role for specific users"
}
```

#### V2 Format

```http
POST /api/v2/admin/roles
Content-Type: application/json
API-Version: 2

{
  "name": "custom_role",
  "displayName": "Custom Role",
  "description": "Custom role for specific users",
  "category": "custom",
  "permissions": ["patient.read", "patient.create"],
  "parentRoleId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

## Testing Across Versions

### Version-Specific Test Suite

```javascript
// tests/versioning/crossVersionTests.js
describe('Cross-Version API Tests', () => {
  const versions = ['v1', 'v2'];

  versions.forEach((version) => {
    describe(`API ${version}`, () => {
      let client;

      beforeEach(() => {
        client = new TestClient({ version });
      });

      test('should get roles', async () => {
        const response = await client.get('/roles');

        if (version === 'v1') {
          expect(response.roles).toBeDefined();
          expect(Array.isArray(response.roles)).toBe(true);
        } else {
          expect(response.data.roles).toBeDefined();
          expect(Array.isArray(response.data.roles)).toBe(true);
        }
      });

      test('should handle authentication', async () => {
        const response = await client.get('/roles', {
          headers: { Authorization: 'Bearer invalid-token' },
        });

        expect(response.status).toBe(401);
      });
    });
  });
});
```

### Compatibility Testing

```javascript
// tests/versioning/compatibilityTests.js
describe('Version Compatibility', () => {
  test('should maintain data consistency across versions', async () => {
    const v1Client = new TestClient({ version: 'v1' });
    const v2Client = new TestClient({ version: 'v2' });

    // Create role via V2
    const v2Role = await v2Client.post('/admin/roles', {
      name: 'test_role',
      displayName: 'Test Role',
      permissions: ['patient.read'],
    });

    // Verify it appears in V1 with correct format
    const v1Roles = await v1Client.get('/roles');
    const v1Role = v1Roles.roles.find((r) => r.name === 'TEST_ROLE');

    expect(v1Role).toBeDefined();
    expect(v1Role.permissions).toContain('VIEW_PATIENTS');
  });

  test('should handle version-specific errors gracefully', async () => {
    const v1Client = new TestClient({ version: 'v1' });

    // Try to use V2-specific feature in V1
    const response = await v1Client.get('/admin/roles/hierarchy-tree');

    expect(response.status).toBe(404);
  });
});
```

### Performance Testing Across Versions

```javascript
// tests/performance/versionPerformance.js
describe('Version Performance Comparison', () => {
  test('should compare response times across versions', async () => {
    const v1Client = new TestClient({ version: 'v1' });
    const v2Client = new TestClient({ version: 'v2' });

    const v1Start = Date.now();
    await v1Client.get('/roles');
    const v1Time = Date.now() - v1Start;

    const v2Start = Date.now();
    await v2Client.get('/admin/roles');
    const v2Time = Date.now() - v2Start;

    console.log(`V1 response time: ${v1Time}ms`);
    console.log(`V2 response time: ${v2Time}ms`);

    // V2 should not be significantly slower than V1
    expect(v2Time).toBeLessThan(v1Time * 2);
  });
});
```

This comprehensive API versioning guide ensures smooth transitions between RBAC system versions while maintaining backward compatibility and providing clear migration paths for API consumers.
