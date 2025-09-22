# Dynamic RBAC Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from static RBAC implementations to the new Dynamic RBAC system. It covers data migration, code updates, testing strategies, and rollback procedures.

## Table of Contents

1. [Pre-Migration Assessment](#pre-migration-assessment)
2. [Migration Planning](#migration-planning)
3. [Data Migration](#data-migration)
4. [Code Migration](#code-migration)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Strategy](#deployment-strategy)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Migration Validation](#post-migration-validation)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## Pre-Migration Assessment

### Current System Analysis

Before starting the migration, conduct a thorough analysis of your existing RBAC implementation:

1. **Inventory Current Roles and Permissions**

   ```bash
   # Export current role definitions
   node scripts/export-static-roles.js > current-roles.json

   # Analyze permission usage
   node scripts/analyze-permission-usage.js > permission-analysis.json
   ```

2. **Identify Custom Implementations**

   ```javascript
   // Find all permission checks in codebase
   grep -r "hasPermission\|checkPermission\|requirePermission" src/ > permission-usage.txt

   // Find role checks
   grep -r "hasRole\|checkRole\|requireRole" src/ > role-usage.txt
   ```

3. **Document Current Architecture**
   ```javascript
   // Example current static structure
   const currentRoles = {
     SUPER_ADMIN: ['*'],
     PHARMACY_OWNER: ['MANAGE_PHARMACY', 'VIEW_REPORTS', 'MANAGE_STAFF'],
     PHARMACY_MANAGER: ['MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_PATIENTS'],
     PHARMACY_STAFF: ['VIEW_PATIENTS', 'DISPENSE_MEDICATION'],
   };
   ```

### Migration Readiness Checklist

- [ ] Current RBAC system documented
- [ ] All permission checks identified
- [ ] User role assignments exported
- [ ] Database backup created
- [ ] Test environment prepared
- [ ] Migration scripts developed
- [ ] Rollback plan documented
- [ ] Team training completed

## Migration Planning

### Migration Phases

#### Phase 1: Preparation (1-2 weeks)

- System analysis and documentation
- Migration script development
- Test environment setup
- Team training

#### Phase 2: Dual System Implementation (2-3 weeks)

- Deploy dynamic RBAC alongside static system
- Implement feature flags for gradual rollout
- Run parallel systems for validation

#### Phase 3: Migration Execution (1 week)

- Data migration
- Code updates
- System testing
- User acceptance testing

#### Phase 4: Cleanup (1 week)

- Remove static RBAC code
- Performance optimization
- Documentation updates

### Resource Planning

```javascript
// Migration team structure
const migrationTeam = {
  projectManager: 1,
  backendDevelopers: 2,
  frontendDevelopers: 2,
  qaEngineers: 2,
  devOpsEngineers: 1,
  databaseAdministrator: 1,
};

// Timeline estimation
const timeline = {
  preparation: '2 weeks',
  dualSystem: '3 weeks',
  migration: '1 week',
  cleanup: '1 week',
  total: '7 weeks',
};
```

c.js
const fs = require('fs');
const { User, Role } = require('../src/models');

const exportStaticRBAC = async () => {
try {
// Export users with their current roles
const users = await User.find().select('\_id email roles permissions');

    // Export current role definitions
    const staticRoles = {
      SUPER_ADMIN: {
        permissions: ['*'],
        description: 'Full system access'
      },
      PHARMACY_OWNER: {
        permissions: [
          'MANAGE_PHARMACY',
          'VIEW_REPORTS',
          'MANAGE_STAFF',
          'MANAGE_INVENTORY'
        ],
        description: 'Pharmacy owner with full pharmacy access'
      },
      // ... other roles
    };

    const exportData = {
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        roles: user.roles || [],
        directPermissions: user.permissions || []
      })),
      roles: staticRoles,
      exportDate: new Date().toISOString()
    };

    fs.writeFileSync('migration-data.json', JSON.stringify(exportData, null, 2));
    console.log('Static RBAC data exported successfully');

} catch (error) {
console.error('Export failed:', error);
process.exit(1);
}
};

exportStaticRBAC();

````

### Step 2: Create Permission Mapping

```javascript
// scripts/create-permission-mapping.js
const permissionMapping = {
  // Static permission -> Dynamic permission
  'MANAGE_PHARMACY': 'workspace.manage',
  'VIEW_REPORTS': 'reports.view',
  'MANAGE_STAFF': 'user.manage',
  'MANAGE_INVENTORY': 'inventory.manage',
  'MANAGE_PATIENTS': 'patient.manage',
  'VIEW_PATIENTS': 'patient.read',
  'DISPENSE_MEDICATION': 'medication.dispense',
  'CREATE_PATIENT': 'patient.create',
  'UPDATE_PATIENT': 'patient.update',
  'DELETE_PATIENT': 'patient.delete',
  'VIEW_ANALYTICS': 'analytics.view',
  'MANAGE_BILLING': 'billing.manage'
};

const roleMapping = {
  'SUPER_ADMIN': 'super_admin',
  'PHARMACY_OWNER': 'pharmacy_owner',
  'PHARMACY_MANAGER': 'pharmacy_manager',
  'PHARMACY_STAFF': 'pharmacy_staff',
  'PHARMACY_TECHNICIAN': 'pharmacy_technician'
};

module.exports = { permissionMapping, roleMapping };
````

### Step 3: Migration Script

```javascript
// scripts/migrate-to-dynamic-rbac.js
const {
  permissionMapping,
  roleMapping,
} = require('./create-permission-mapping');
const { DynamicRole, DynamicPermission, User } = require('../src/models');

const migrateToDynamicRBAC = async () => {
  console.log('Starting Dynamic RBAC migration...');

  try {
    // Step 1: Create dynamic permissions
    await createDynamicPermissions();

    // Step 2: Create dynamic roles
    await createDynamicRoles();

    // Step 3: Migrate user assignments
    await migrateUserAssignments();

    // Step 4: Validate migration
    await validateMigration();

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    await rollbackMigration();
    process.exit(1);
  }
};

const createDynamicPermissions = async () => {
  console.log('Creating dynamic permissions...');

  const permissions = [
    {
      action: 'workspace.manage',
      displayName: 'Manage Workspace',
      description: 'Full workspace management access',
      category: 'workspace',
    },
    {
      action: 'patient.read',
      displayName: 'View Patients',
      description: 'View patient information',
      category: 'patient_management',
    },
    {
      action: 'patient.create',
      displayName: 'Create Patients',
      description: 'Add new patients to the system',
      category: 'patient_management',
    },
    // ... more permissions
  ];

  for (const permission of permissions) {
    await DynamicPermission.findOneAndUpdate(
      { action: permission.action },
      permission,
      { upsert: true, new: true }
    );
  }

  console.log(`Created ${permissions.length} dynamic permissions`);
};

const createDynamicRoles = async () => {
  console.log('Creating dynamic roles...');

  const roles = [
    {
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full system access',
      category: 'system',
      permissions: ['*'], // All permissions
      hierarchyLevel: 0,
    },
    {
      name: 'pharmacy_owner',
      displayName: 'Pharmacy Owner',
      description: 'Pharmacy owner with full pharmacy access',
      category: 'workplace',
      permissions: [
        'workspace.manage',
        'reports.view',
        'user.manage',
        'inventory.manage',
        'patient.manage',
        'billing.manage',
      ],
      hierarchyLevel: 1,
    },
    {
      name: 'pharmacy_manager',
      displayName: 'Pharmacy Manager',
      description: 'Manages pharmacy operations',
      category: 'workplace',
      permissions: [
        'patient.read',
        'patient.update',
        'inventory.manage',
        'reports.view',
        'medication.dispense',
      ],
      hierarchyLevel: 2,
      parentRole: 'pharmacy_owner',
    },
    // ... more roles
  ];

  // Create roles in hierarchy order
  for (const roleData of roles) {
    const { parentRole, ...roleInfo } = roleData;

    const role = await DynamicRole.findOneAndUpdate(
      { name: roleInfo.name },
      roleInfo,
      { upsert: true, new: true }
    );

    // Set parent role if specified
    if (parentRole) {
      const parent = await DynamicRole.findOne({ name: parentRole });
      if (parent) {
        role.parentRole = parent._id;
        await role.save();

        // Add to parent's children
        parent.childRoles.push(role._id);
        await parent.save();
      }
    }
  }

  console.log(`Created ${roles.length} dynamic roles`);
};

const migrateUserAssignments = async () => {
  console.log('Migrating user role assignments...');

  const migrationData = JSON.parse(
    fs.readFileSync('migration-data.json', 'utf8')
  );
  let migratedUsers = 0;

  for (const userData of migrationData.users) {
    try {
      const user = await User.findById(userData.id);
      if (!user) {
        console.warn(`User ${userData.id} not found, skipping...`);
        continue;
      }

      // Clear existing dynamic roles
      user.dynamicRoles = [];

      // Migrate static roles to dynamic roles
      for (const staticRole of userData.roles) {
        const dynamicRoleName = roleMapping[staticRole];
        if (dynamicRoleName) {
          const dynamicRole = await DynamicRole.findOne({
            name: dynamicRoleName,
          });
          if (dynamicRole) {
            user.dynamicRoles.push(dynamicRole._id);
          }
        }
      }

      // Migrate direct permissions
      const dynamicPermissions = [];
      for (const staticPermission of userData.directPermissions) {
        const dynamicPermission = permissionMapping[staticPermission];
        if (dynamicPermission) {
          dynamicPermissions.push(dynamicPermission);
        }
      }
      user.directPermissions = dynamicPermissions;

      await user.save();
      migratedUsers++;
    } catch (error) {
      console.error(`Failed to migrate user ${userData.id}:`, error);
    }
  }

  console.log(`Migrated ${migratedUsers} users`);
};

const validateMigration = async () => {
  console.log('Validating migration...');

  const migrationData = JSON.parse(
    fs.readFileSync('migration-data.json', 'utf8')
  );
  const validationResults = [];

  for (const userData of migrationData.users) {
    const user = await User.findById(userData.id).populate('dynamicRoles');

    // Calculate old permissions
    const oldPermissions = new Set();
    for (const role of userData.roles) {
      const rolePerms = migrationData.roles[role]?.permissions || [];
      rolePerms.forEach((perm) => {
        if (perm === '*') {
          // Super admin - add all permissions
          Object.values(permissionMapping).forEach((p) =>
            oldPermissions.add(p)
          );
        } else {
          const mappedPerm = permissionMapping[perm];
          if (mappedPerm) oldPermissions.add(mappedPerm);
        }
      });
    }

    // Add direct permissions
    userData.directPermissions.forEach((perm) => {
      const mappedPerm = permissionMapping[perm];
      if (mappedPerm) oldPermissions.add(mappedPerm);
    });

    // Calculate new permissions
    const newPermissions = await calculateUserPermissions(user._id);
    const newPermissionSet = new Set(newPermissions);

    // Compare
    const missing = [...oldPermissions].filter((p) => !newPermissionSet.has(p));
    const extra = [...newPermissionSet].filter((p) => !oldPermissions.has(p));

    validationResults.push({
      userId: userData.id,
      email: userData.email,
      oldPermissionCount: oldPermissions.size,
      newPermissionCount: newPermissions.length,
      missingPermissions: missing,
      extraPermissions: extra,
      isValid: missing.length === 0,
    });
  }

  // Save validation results
  fs.writeFileSync(
    'migration-validation.json',
    JSON.stringify(validationResults, null, 2)
  );

  const invalidUsers = validationResults.filter((r) => !r.isValid);
  if (invalidUsers.length > 0) {
    console.error(
      `Migration validation failed for ${invalidUsers.length} users`
    );
    console.error('Check migration-validation.json for details');
    throw new Error('Migration validation failed');
  }

  console.log('Migration validation passed!');
};

migrateToDynamicRBAC();
```

## Code Migration

### Backend Code Updates

#### 1. Update Middleware

**Before (Static RBAC):**

```javascript
// middleware/auth.js
const requirePermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRoles = req.user.roles || [];

    // Check direct permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    // Check role-based permissions
    const hasRolePermission = userRoles.some((role) => {
      const rolePermissions = STATIC_ROLES[role]?.permissions || [];
      return (
        rolePermissions.includes(permission) || rolePermissions.includes('*')
      );
    });

    if (hasRolePermission) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};
```

**After (Dynamic RBAC):**

```javascript
// middleware/rbac.js
const requireDynamicPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const hasPermission = await dynamicPermissionService.checkUserPermission(
        userId,
        permission
      );

      if (hasPermission) {
        return next();
      }

      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
```

#### 2. Update Route Definitions

**Before:**

```javascript
// routes/patients.js
router.get('/', requirePermission('VIEW_PATIENTS'), getPatients);
router.post('/', requirePermission('CREATE_PATIENT'), createPatient);
router.put('/:id', requirePermission('UPDATE_PATIENT'), updatePatient);
router.delete('/:id', requirePermission('DELETE_PATIENT'), deletePatient);
```

**After:**

```javascript
// routes/patients.js
router.get('/', requireDynamicPermission('patient.read'), getPatients);
router.post('/', requireDynamicPermission('patient.create'), createPatient);
router.put('/:id', requireDynamicPermission('patient.update'), updatePatient);
router.delete(
  '/:id',
  requireDynamicPermission('patient.delete'),
  deletePatient
);
```

#### 3. Update Service Layer

**Before:**

```javascript
// services/patientService.js
const canUserAccessPatient = (user, patientId) => {
  const userRoles = user.roles || [];
  const userPermissions = user.permissions || [];

  // Check if user has general patient access
  if (
    userPermissions.includes('VIEW_PATIENTS') ||
    userRoles.includes('PHARMACY_MANAGER')
  ) {
    return true;
  }

  return false;
};
```

**After:**

```javascript
// services/patientService.js
const canUserAccessPatient = async (userId, patientId) => {
  // Check general patient read permission
  const hasGeneralAccess = await dynamicPermissionService.checkUserPermission(
    userId,
    'patient.read'
  );

  if (hasGeneralAccess) {
    return true;
  }

  // Check patient-specific permissions if implemented
  const hasSpecificAccess = await dynamicPermissionService.checkUserPermission(
    userId,
    `patient.read.${patientId}`
  );

  return hasSpecificAccess;
};
```

### Frontend Code Updates

#### 1. Update Permission Checks

**Before:**

```javascript
// components/PatientList.jsx
import { hasPermission } from '../utils/staticRBAC';

const PatientList = () => {
  const { user } = useAuth();
  const canCreatePatient = hasPermission(user, 'CREATE_PATIENT');
  const canEditPatient = hasPermission(user, 'UPDATE_PATIENT');

  return (
    <div>
      {canCreatePatient && (
        <button onClick={handleCreatePatient}>Create Patient</button>
      )}
      {/* ... */}
    </div>
  );
};
```

**After:**

```javascript
// components/PatientList.jsx
import { usePermissions } from '../hooks/usePermissions';

const PatientList = () => {
  const { hasPermission, loading } = usePermissions();

  if (loading) return <LoadingSpinner />;

  const canCreatePatient = hasPermission('patient.create');
  const canEditPatient = hasPermission('patient.update');

  return (
    <div>
      {canCreatePatient && (
        <button onClick={handleCreatePatient}>Create Patient</button>
      )}
      {/* ... */}
    </div>
  );
};
```

#### 2. Update Route Protection

**Before:**

```javascript
// App.jsx
import { ProtectedRoute } from './components/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route
        path="/patients"
        element={
          <ProtectedRoute requiredPermission="VIEW_PATIENTS">
            <PatientList />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

**After:**

```javascript
// App.jsx
import { PermissionGate } from './components/PermissionGate';

const App = () => {
  return (
    <Routes>
      <Route
        path="/patients"
        element={
          <PermissionGate
            permission="patient.read"
            fallback={<Navigate to="/unauthorized" />}
          >
            <PatientList />
          </PermissionGate>
        }
      />
    </Routes>
  );
};
```

## Testing Strategy

### Unit Tests

```javascript
// tests/rbac/dynamicPermission.test.js
describe('Dynamic Permission Service', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  test('should calculate user permissions correctly', async () => {
    const userId = 'test-user-id';
    const permissions = await dynamicPermissionService.calculateUserPermissions(
      userId
    );

    expect(permissions).toContain('patient.read');
    expect(permissions).toContain('medication.dispense');
  });

  test('should handle role hierarchy correctly', async () => {
    const managerId = 'manager-user-id';
    const permissions = await dynamicPermissionService.calculateUserPermissions(
      managerId
    );

    // Should inherit permissions from parent roles
    expect(permissions).toContain('workspace.manage'); // From parent role
    expect(permissions).toContain('patient.read'); // Direct permission
  });
});
```

### Integration Tests

```javascript
// tests/integration/rbacMigration.test.js
describe('RBAC Migration Integration', () => {
  test('should maintain user access after migration', async () => {
    // Setup: Create user with static roles
    const user = await createTestUser({
      roles: ['PHARMACY_MANAGER'],
      permissions: ['VIEW_ANALYTICS'],
    });

    // Execute migration
    await migrateToDynamicRBAC();

    // Verify: User should have equivalent dynamic permissions
    const dynamicPermissions =
      await dynamicPermissionService.calculateUserPermissions(user._id);

    expect(dynamicPermissions).toContain('patient.read');
    expect(dynamicPermissions).toContain('analytics.view');
  });
});
```

### End-to-End Tests

```javascript
// tests/e2e/rbacWorkflow.test.js
describe('RBAC E2E Workflow', () => {
  test('pharmacy manager workflow', async () => {
    // Login as pharmacy manager
    await loginAs('pharmacy_manager');

    // Should be able to access patient list
    await page.goto('/patients');
    expect(await page.isVisible('[data-testid="patient-list"]')).toBe(true);

    // Should be able to create patient
    expect(await page.isVisible('[data-testid="create-patient-btn"]')).toBe(
      true
    );

    // Should not be able to access admin panel
    await page.goto('/admin');
    expect(await page.isVisible('[data-testid="access-denied"]')).toBe(true);
  });
});
```

## Deployment Strategy

### Blue-Green Deployment

```yaml
# deployment/blue-green-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pharma-care-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pharma-care
      version: blue
  template:
    metadata:
      labels:
        app: pharma-care
        version: blue
    spec:
      containers:
        - name: app
          image: pharma-care:v2.0.0-dynamic-rbac
          env:
            - name: RBAC_MODE
              value: 'dynamic'
            - name: ENABLE_DUAL_RBAC
              value: 'true'
```

### Feature Flag Implementation

```javascript
// config/featureFlags.js
const featureFlags = {
  DYNAMIC_RBAC_ENABLED: process.env.DYNAMIC_RBAC_ENABLED === 'true',
  DUAL_RBAC_MODE: process.env.DUAL_RBAC_MODE === 'true',
  RBAC_MIGRATION_MODE: process.env.RBAC_MIGRATION_MODE || 'static',
};

// middleware/rbacSelector.js
const selectRBACMiddleware = (permission) => {
  if (featureFlags.DUAL_RBAC_MODE) {
    return dualRBACMiddleware(permission);
  } else if (featureFlags.DYNAMIC_RBAC_ENABLED) {
    return requireDynamicPermission(permission);
  } else {
    return requirePermission(permission);
  }
};

const dualRBACMiddleware = (permission) => {
  return async (req, res, next) => {
    // Check both systems and log discrepancies
    const staticResult = await checkStaticPermission(req.user, permission);
    const dynamicResult = await checkDynamicPermission(
      req.user._id,
      permission
    );

    if (staticResult !== dynamicResult) {
      console.warn('RBAC Discrepancy:', {
        userId: req.user._id,
        permission,
        static: staticResult,
        dynamic: dynamicResult,
      });
    }

    // Use dynamic result but log for validation
    if (dynamicResult) {
      return next();
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
```

### Gradual Rollout

```javascript
// services/rbacRollout.js
class RBACRolloutService {
  constructor() {
    this.rolloutPercentage = parseInt(process.env.DYNAMIC_RBAC_ROLLOUT) || 0;
  }

  shouldUseDynamicRBAC(userId) {
    if (this.rolloutPercentage === 100) return true;
    if (this.rolloutPercentage === 0) return false;

    // Use consistent hash to determine rollout
    const hash = this.hashUserId(userId);
    return hash % 100 < this.rolloutPercentage;
  }

  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

## Rollback Procedures

### Automated Rollback Script

```javascript
// scripts/rollback-dynamic-rbac.js
const rollbackDynamicRBAC = async () => {
  console.log('Starting Dynamic RBAC rollback...');

  try {
    // Step 1: Restore static role assignments
    await restoreStaticRoleAssignments();

    // Step 2: Update application configuration
    await updateApplicationConfig('static');

    // Step 3: Clear dynamic RBAC cache
    await clearDynamicRBACCache();

    // Step 4: Restart application services
    await restartApplicationServices();

    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    await emergencyRecovery();
  }
};

const restoreStaticRoleAssignments = async () => {
  const backupData = JSON.parse(fs.readFileSync('pre-migration-backup.json'));

  for (const userData of backupData.users) {
    await User.findByIdAndUpdate(userData.id, {
      roles: userData.roles,
      permissions: userData.permissions,
      dynamicRoles: [], // Clear dynamic roles
      directPermissions: [], // Clear dynamic permissions
    });
  }
};

const updateApplicationConfig = async (mode) => {
  // Update environment variables
  process.env.RBAC_MODE = mode;
  process.env.DYNAMIC_RBAC_ENABLED = 'false';

  // Update configuration files
  const config = await fs.readFile('config/app.json', 'utf8');
  const updatedConfig = JSON.parse(config);
  updatedConfig.rbac.mode = mode;
  await fs.writeFile('config/app.json', JSON.stringify(updatedConfig, null, 2));
};
```

### Emergency Recovery

```javascript
// scripts/emergency-recovery.js
const emergencyRecovery = async () => {
  console.log('Initiating emergency recovery...');

  // Disable all RBAC checks temporarily
  process.env.RBAC_EMERGENCY_BYPASS = 'true';

  // Restore from last known good backup
  await restoreFromBackup('last-known-good');

  // Send alerts to operations team
  await sendEmergencyAlert(
    'RBAC system failure - emergency recovery initiated'
  );

  // Enable maintenance mode
  await enableMaintenanceMode();
};
```

## Post-Migration Validation

### Validation Checklist

```javascript
// scripts/post-migration-validation.js
const postMigrationValidation = async () => {
  const validationResults = {
    userPermissions: await validateUserPermissions(),
    roleHierarchy: await validateRoleHierarchy(),
    apiEndpoints: await validateAPIEndpoints(),
    frontendAccess: await validateFrontendAccess(),
    performance: await validatePerformance(),
  };

  const overallSuccess = Object.values(validationResults).every(
    (result) => result.success
  );

  if (!overallSuccess) {
    console.error('Post-migration validation failed');
    await generateValidationReport(validationResults);
    throw new Error('Migration validation failed');
  }

  console.log('Post-migration validation passed');
  return validationResults;
};

const validateUserPermissions = async () => {
  const sampleUsers = await User.find().limit(100);
  let successCount = 0;
  const failures = [];

  for (const user of sampleUsers) {
    try {
      const permissions =
        await dynamicPermissionService.calculateUserPermissions(user._id);

      if (permissions.length > 0) {
        successCount++;
      } else {
        failures.push({ userId: user._id, error: 'No permissions found' });
      }
    } catch (error) {
      failures.push({ userId: user._id, error: error.message });
    }
  }

  return {
    success: failures.length === 0,
    successRate: (successCount / sampleUsers.length) * 100,
    failures,
  };
};
```

### Performance Validation

```javascript
// scripts/performance-validation.js
const validatePerformance = async () => {
  const performanceMetrics = {
    permissionCheckLatency: await measurePermissionCheckLatency(),
    cacheHitRate: await measureCacheHitRate(),
    databaseQueryTime: await measureDatabaseQueryTime(),
    memoryUsage: await measureMemoryUsage(),
  };

  const thresholds = {
    maxPermissionCheckLatency: 100, // ms
    minCacheHitRate: 80, // %
    maxDatabaseQueryTime: 50, // ms
    maxMemoryIncrease: 20, // %
  };

  const issues = [];

  if (
    performanceMetrics.permissionCheckLatency >
    thresholds.maxPermissionCheckLatency
  ) {
    issues.push('Permission check latency too high');
  }

  if (performanceMetrics.cacheHitRate < thresholds.minCacheHitRate) {
    issues.push('Cache hit rate too low');
  }

  return {
    success: issues.length === 0,
    metrics: performanceMetrics,
    issues,
  };
};
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX CONCURRENTLY idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX CONCURRENTLY idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX CONCURRENTLY idx_roles_parent_role ON roles(parent_role_id);
CREATE INDEX CONCURRENTLY idx_roles_hierarchy_level ON roles(hierarchy_level);
CREATE INDEX CONCURRENTLY idx_permissions_action ON permissions(action);

-- Optimize permission calculation query
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS TABLE(permission_action TEXT) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_hierarchy AS (
    -- Base case: direct user roles
    SELECT r._id, r.name, r.parent_role_id, 0 as level
    FROM roles r
    JOIN user_roles ur ON r._id = ur.role_id
    WHERE ur.user_id = user_id_param

    UNION ALL

    -- Recursive case: parent roles
    SELECT r._id, r.name, r.parent_role_id, rh.level + 1
    FROM roles r
    JOIN role_hierarchy rh ON r._id = rh.parent_role_id
    WHERE rh.level < 10 -- Prevent infinite recursion
  )
  SELECT DISTINCT rp.permission_action
  FROM role_hierarchy rh
  JOIN role_permissions rp ON rh._id = rp.role_id;
END;
$$ LANGUAGE plpgsql;
```

### Cache Optimization

```javascript
// services/optimizedCacheManager.js
class OptimizedCacheManager {
  constructor() {
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.maxSize = 10000;
  }

  async getUserPermissions(userId) {
    const cacheKey = `user:${userId}:permissions`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      this.hitCount++;
      return cached.data;
    }

    this.missCount++;

    // Calculate permissions
    const permissions = await this.calculatePermissions(userId);

    // Cache with TTL
    this.cache.set(cacheKey, {
      data: permissions,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Cleanup if cache is too large
    if (this.cache.size > this.maxSize) {
      this.cleanup();
    }

    return permissions;
  }

  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      cacheSize: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }
}
```

## Troubleshooting

### Common Migration Issues

1. **Permission Mapping Errors**

   ```javascript
   // Check for unmapped permissions
   const findUnmappedPermissions = async () => {
     const staticData = JSON.parse(fs.readFileSync('migration-data.json'));
     const unmapped = new Set();

     for (const user of staticData.users) {
       for (const permission of user.directPermissions) {
         if (!permissionMapping[permission]) {
           unmapped.add(permission);
         }
       }
     }

     console.log('Unmapped permissions:', [...unmapped]);
   };
   ```

2. **Role Hierarchy Issues**

   ```javascript
   // Detect and fix hierarchy problems
   const fixRoleHierarchy = async () => {
     const roles = await DynamicRole.find();

     for (const role of roles) {
       if (role.parentRole) {
         const parent = await DynamicRole.findById(role.parentRole);
         if (!parent) {
           console.warn(`Orphaned role: ${role.name}`);
           role.parentRole = null;
           await role.save();
         }
       }
     }
   };
   ```

3. **Performance Degradation**
   ```javascript
   // Monitor and optimize slow queries
   const monitorSlowQueries = () => {
     const originalQuery = db.query;

     db.query = function (sql, params) {
       const start = Date.now();
       const result = originalQuery.call(this, sql, params);
       const duration = Date.now() - start;

       if (duration > 100) {
         console.warn(`Slow query (${duration}ms):`, sql);
       }

       return result;
     };
   };
   ```

### Migration Health Check

```javascript
// scripts/migration-health-check.js
const migrationHealthCheck = async () => {
  const checks = [
    checkDatabaseIntegrity,
    checkPermissionConsistency,
    checkRoleHierarchy,
    checkUserAccess,
    checkPerformance,
  ];

  const results = [];

  for (const check of checks) {
    try {
      const result = await check();
      results.push({ check: check.name, ...result });
    } catch (error) {
      results.push({
        check: check.name,
        success: false,
        error: error.message,
      });
    }
  }

  const overallHealth = results.every((r) => r.success);

  console.log('Migration Health Check Results:');
  console.table(results);

  if (!overallHealth) {
    console.error('Migration health check failed');
    process.exit(1);
  }

  console.log('Migration health check passed');
};
```

This comprehensive migration guide provides all the necessary tools and procedures for successfully migrating from static to dynamic RBAC while minimizing risks and ensuring system reliability.

## Data Migration

### Step 1: Export Current Data

```javascript
// scripts/export-static-rba
```
