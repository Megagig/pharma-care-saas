# Dynamic RBAC Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when implementing and using the Dynamic RBAC system. It covers backend problems, frontend integration issues, performance concerns, and debugging strategies.

## Table of Contents

1. [Authentication & Authorization Issues](#authentication--authorization-issues)
2. [Permission Resolution Problems](#permission-resolution-problems)
3. [Role Hierarchy Issues](#role-hierarchy-issues)
4. [Cache-Related Problems](#cache-related-problems)
5. [Performance Issues](#performance-issues)
6. [Database Problems](#database-problems)
7. [Frontend Integration Issues](#frontend-integration-issues)
8. [Migration Issues](#migration-issues)
9. [Debugging Tools](#debugging-tools)
10. [Common Error Codes](#common-error-codes)

## Authentication & Authorization Issues

### Issue: "Authentication Required" Error

**Symptoms:**

- API returns 401 status
- Error message: "JWT token missing or invalid"

**Causes & Solutions:**

1. **Missing Authorization Header**

   ```javascript
   // ❌ Incorrect
   fetch('/api/admin/roles');

   // ✅ Correct
   fetch('/api/admin/roles', {
     headers: {
       Authorization: `Bearer ${token}`,
     },
   });
   ```

2. **Expired JWT Token**

   ```javascript
   // Check token expiration
   const payload = JSON.parse(atob(token.split('.')[1]));
   const isExpired = payload.exp * 1000 < Date.now();

   if (isExpired) {
     // Refresh token or redirect to login
     await refreshToken();
   }
   ```

3. **Invalid Token Format**
   ```javascript
   // Validate token format
   const isValidFormat = token && token.split('.').length === 3;
   if (!isValidFormat) {
     console.error('Invalid JWT format');
   }
   ```

### Issue: "Insufficient Permissions" Error

**Symptoms:**

- API returns 403 status
- User has role but can't access endpoint

**Debugging Steps:**

1. **Check User's Effective Permissions**

   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
        "https://api.pharma-care.com/api/admin/users/current/effective-permissions"
   ```

2. **Verify Required Permission**

   ```javascript
   // Check what permission is required for the endpoint
   const requiredPermissions = {
     'GET /api/admin/roles': 'role:read',
     'POST /api/admin/roles': 'role:create',
     'PUT /api/admin/roles/:id': 'role:update',
     'DELETE /api/admin/roles/:id': 'role:delete',
   };
   ```

3. **Check Permission Inheritance**
   ```sql
   -- Check role hierarchy and inherited permissions
   SELECT r.name, r.hierarchy_level, rp.permission_action
   FROM roles r
   LEFT JOIN role_permissions rp ON r._id = rp.role_id
   WHERE r._id IN (
     SELECT role_id FROM user_roles WHERE user_id = 'user-id'
   )
   ORDER BY r.hierarchy_level;
   ```

## Permission Resolution Problems

### Issue: Permissions Not Updating After Role Assignment

**Symptoms:**

- User assigned new role but permissions don't reflect changes
- Cache shows old permissions

**Solutions:**

1. **Force Cache Invalidation**

   ```javascript
   // Backend - Invalidate user's permission cache
   await cacheManager.invalidateUserPermissions(userId);

   // Frontend - Refetch permissions
   const { refetch } = usePermissions();
   await refetch();
   ```

2. **Check Cache TTL Settings**

   ```javascript
   // Verify cache configuration
   const cacheConfig = {
     userPermissions: 300000, // 5 minutes
     roleHierarchy: 600000, // 10 minutes
     permissionMatrix: 1800000, // 30 minutes
   };
   ```

3. **Manual Permission Refresh**
   ```javascript
   // Force permission recalculation
   const permissions = await dynamicPermissionService.calculateUserPermissions(
     userId,
     { bypassCache: true }
   );
   ```

### Issue: Circular Dependency in Role Hierarchy

**Symptoms:**

- Error: "Role hierarchy would create a circular dependency"
- Cannot assign parent/child roles

**Detection & Resolution:**

1. **Detect Circular Dependencies**

   ```javascript
   // Check for cycles before role assignment
   const detectCycle = async (roleId, parentRoleId) => {
     const visited = new Set();
     const recursionStack = new Set();

     const hasCycle = async (currentRoleId) => {
       if (recursionStack.has(currentRoleId)) return true;
       if (visited.has(currentRoleId)) return false;

       visited.add(currentRoleId);
       recursionStack.add(currentRoleId);

       const role = await Role.findById(currentRoleId);
       if (role.parentRole) {
         if (await hasCycle(role.parentRole)) return true;
       }

       recursionStack.delete(currentRoleId);
       return false;
     };

     return await hasCycle(parentRoleId);
   };
   ```

2. **Fix Circular Dependencies**
   ```sql
   -- Find roles with circular references
   WITH RECURSIVE role_path AS (
     SELECT _id, parent_role_id, name, 1 as level, ARRAY[_id] as path
     FROM roles
     WHERE parent_role_id IS NULL

     UNION ALL

     SELECT r._id, r.parent_role_id, r.name, rp.level + 1, rp.path || r._id
     FROM roles r
     JOIN role_path rp ON r.parent_role_id = rp._id
     WHERE NOT r._id = ANY(rp.path)
   )
   SELECT * FROM role_path WHERE level > 10; -- Potential cycles
   ```

## Role Hierarchy Issues

### Issue: Incorrect Permission Inheritance

**Symptoms:**

- Child roles not inheriting parent permissions
- Unexpected permission denials

**Debugging:**

1. **Verify Hierarchy Structure**

   ```javascript
   // Get complete hierarchy for debugging
   const hierarchy = await roleHierarchyService.getFullHierarchy();
   console.log('Role Hierarchy:', JSON.stringify(hierarchy, null, 2));
   ```

2. **Check Permission Calculation**

   ```javascript
   // Debug permission inheritance
   const debugPermissions = async (userId) => {
     const user = await User.findById(userId).populate('roles');

     for (const role of user.roles) {
       console.log(`Role: ${role.name}`);
       console.log(`Direct Permissions:`, role.permissions);

       const inherited = await roleHierarchyService.getInheritedPermissions(
         role._id
       );
       console.log(`Inherited Permissions:`, inherited);
     }
   };
   ```

3. **Fix Hierarchy Levels**
   ```javascript
   // Recalculate hierarchy levels
   const recalculateHierarchyLevels = async () => {
     const roles = await Role.find({});

     for (const role of roles) {
       const level = await calculateHierarchyLevel(role._id);
       await Role.findByIdAndUpdate(role._id, { hierarchyLevel: level });
     }
   };
   ```

## Cache-Related Problems

### Issue: Stale Cache Data

**Symptoms:**

- Old permissions showing after updates
- Inconsistent behavior across requests

**Solutions:**

1. **Implement Cache Versioning**

   ```javascript
   class VersionedCache {
     constructor() {
       this.version = 1;
       this.cache = new Map();
     }

     set(key, value, ttl) {
       this.cache.set(key, {
         value,
         version: this.version,
         expires: Date.now() + ttl,
       });
     }

     invalidateVersion() {
       this.version++;
     }

     get(key) {
       const entry = this.cache.get(key);
       if (
         !entry ||
         entry.version < this.version ||
         entry.expires < Date.now()
       ) {
         return null;
       }
       return entry.value;
     }
   }
   ```

2. **Cache Warming Strategy**
   ```javascript
   // Warm cache after updates
   const warmUserCache = async (userId) => {
     const permissions =
       await dynamicPermissionService.calculateUserPermissions(userId);
     await cacheManager.set(`user:${userId}:permissions`, permissions);
   };
   ```

### Issue: Cache Memory Leaks

**Symptoms:**

- Increasing memory usage
- Performance degradation over time

**Solutions:**

1. **Implement Cache Size Limits**

   ```javascript
   class LRUCache {
     constructor(maxSize = 1000) {
       this.maxSize = maxSize;
       this.cache = new Map();
     }

     set(key, value) {
       if (this.cache.has(key)) {
         this.cache.delete(key);
       } else if (this.cache.size >= this.maxSize) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
       }
       this.cache.set(key, value);
     }
   }
   ```

2. **Regular Cache Cleanup**
   ```javascript
   // Schedule cache cleanup
   setInterval(() => {
     cacheManager.cleanup();
   }, 60000); // Every minute
   ```

## Performance Issues

### Issue: Slow Permission Checks

**Symptoms:**

- API response times > 500ms
- Database query timeouts

**Optimization Strategies:**

1. **Database Indexing**

   ```sql
   -- Create indexes for common queries
   CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
   CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
   CREATE INDEX idx_roles_parent_role ON roles(parent_role_id);
   CREATE INDEX idx_roles_hierarchy_level ON roles(hierarchy_level);
   ```

2. **Query Optimization**

   ```javascript
   // Optimize permission query
   const getUserPermissions = async (userId) => {
     // Single query instead of multiple
     const result = await db.query(
       `
       WITH RECURSIVE role_hierarchy AS (
         SELECT r._id, r.name, r.parent_role_id, 0 as level
         FROM roles r
         JOIN user_roles ur ON r._id = ur.role_id
         WHERE ur.user_id = $1
         
         UNION ALL
         
         SELECT r._id, r.name, r.parent_role_id, rh.level + 1
         FROM roles r
         JOIN role_hierarchy rh ON r._id = rh.parent_role_id
       )
       SELECT DISTINCT rp.permission_action
       FROM role_hierarchy rh
       JOIN role_permissions rp ON rh._id = rp.role_id
     `,
       [userId]
     );

     return result.rows.map((row) => row.permission_action);
   };
   ```

3. **Batch Permission Checks**
   ```javascript
   // Check multiple permissions at once
   const checkMultiplePermissions = (userPermissions, requiredPermissions) => {
     const permissionSet = new Set(userPermissions);
     return requiredPermissions.map((permission) => ({
       permission,
       hasAccess: permissionSet.has(permission),
     }));
   };
   ```

### Issue: High Memory Usage

**Solutions:**

1. **Implement Permission Pagination**

   ```javascript
   const getPermissionsPaginated = async (page = 1, limit = 50) => {
     const offset = (page - 1) * limit;
     return await Permission.find().skip(offset).limit(limit).lean(); // Use lean() for better memory efficiency
   };
   ```

2. **Stream Large Datasets**
   ```javascript
   const streamUserPermissions = (callback) => {
     const stream = User.find().cursor();

     stream.on('data', async (user) => {
       const permissions = await getUserPermissions(user._id);
       callback(user._id, permissions);
     });
   };
   ```

## Database Problems

### Issue: Permission Data Inconsistency

**Symptoms:**

- Different permissions for same user across requests
- Database constraint violations

**Solutions:**

1. **Data Validation Script**

   ```sql
   -- Check for orphaned role assignments
   SELECT ur.user_id, ur.role_id
   FROM user_roles ur
   LEFT JOIN roles r ON ur.role_id = r._id
   WHERE r._id IS NULL;

   -- Check for invalid parent role references
   SELECT r.name, r.parent_role_id
   FROM roles r
   LEFT JOIN roles pr ON r.parent_role_id = pr._id
   WHERE r.parent_role_id IS NOT NULL AND pr._id IS NULL;
   ```

2. **Data Cleanup Script**
   ```javascript
   const cleanupRBACData = async () => {
     // Remove orphaned user roles
     await db.query(`
       DELETE FROM user_roles
       WHERE role_id NOT IN (SELECT _id FROM roles)
     `);

     // Fix invalid parent role references
     await db.query(`
       UPDATE roles
       SET parent_role_id = NULL
       WHERE parent_role_id NOT IN (SELECT _id FROM roles)
     `);
   };
   ```

### Issue: Database Connection Timeouts

**Solutions:**

1. **Connection Pool Configuration**

   ```javascript
   const dbConfig = {
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     database: process.env.DB_NAME,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     max: 20, // Maximum connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   };
   ```

2. **Query Timeout Handling**
   ```javascript
   const queryWithTimeout = async (query, params, timeout = 5000) => {
     return Promise.race([
       db.query(query, params),
       new Promise((_, reject) =>
         setTimeout(() => reject(new Error('Query timeout')), timeout)
       ),
     ]);
   };
   ```

## Frontend Integration Issues

### Issue: Permission Hook Not Updating

**Symptoms:**

- usePermissions hook returns stale data
- UI doesn't reflect permission changes

**Solutions:**

1. **Force Hook Refresh**

   ```javascript
   const usePermissionsWithRefresh = (userId) => {
     const [refreshKey, setRefreshKey] = useState(0);
     const result = usePermissions(userId, refreshKey);

     const forceRefresh = useCallback(() => {
       setRefreshKey((prev) => prev + 1);
     }, []);

     return { ...result, forceRefresh };
   };
   ```

2. **WebSocket Integration**
   ```javascript
   // Listen for permission updates via WebSocket
   useEffect(() => {
     const socket = io('/rbac');

     socket.on('permissions:updated', (data) => {
       if (data.userId === currentUserId) {
         refetchPermissions();
       }
     });

     return () => socket.disconnect();
   }, [currentUserId]);
   ```

### Issue: Component Not Re-rendering

**Solutions:**

1. **Proper Dependency Arrays**

   ```javascript
   // ❌ Missing dependencies
   useEffect(() => {
     checkPermissions();
   }, []);

   // ✅ Correct dependencies
   useEffect(() => {
     checkPermissions();
   }, [permissions, requiredPermissions]);
   ```

2. **Memoization Issues**

   ```javascript
   // ❌ Object recreation on every render
   const permissionConfig = {
     required: ['patient.read'],
     optional: ['patient.write'],
   };

   // ✅ Stable reference
   const permissionConfig = useMemo(
     () => ({
       required: ['patient.read'],
       optional: ['patient.write'],
     }),
     []
   );
   ```

## Migration Issues

### Issue: Static to Dynamic RBAC Migration Failures

**Symptoms:**

- Users lose access after migration
- Permission mappings incorrect

**Solutions:**

1. **Pre-Migration Validation**

   ```javascript
   const validateMigration = async () => {
     const staticUsers = await getStaticRBACUsers();
     const migrationMap = await getMigrationMapping();

     for (const user of staticUsers) {
       const staticPermissions = user.permissions;
       const dynamicPermissions = await calculateDynamicPermissions(
         user._id,
         migrationMap
       );

       const missing = staticPermissions.filter(
         (p) => !dynamicPermissions.includes(p)
       );

       if (missing.length > 0) {
         console.warn(`User ${user._id} missing permissions:`, missing);
       }
     }
   };
   ```

2. **Rollback Strategy**
   ```javascript
   const rollbackMigration = async () => {
     // Restore from backup
     await restoreStaticRBACFromBackup();

     // Clear dynamic RBAC data
     await clearDynamicRBACData();

     // Update application config
     await updateRBACMode('static');
   };
   ```

## Debugging Tools

### Backend Debugging

1. **Permission Trace Logger**

   ```javascript
   class PermissionTracer {
     static trace(userId, permission, result) {
       console.log(
         `[RBAC] User: ${userId}, Permission: ${permission}, Result: ${result}`
       );

       // Log to file for analysis
       fs.appendFileSync(
         'rbac-trace.log',
         `${new Date().toISOString()} - ${userId} - ${permission} - ${result}\n`
       );
     }
   }
   ```

2. **Role Hierarchy Visualizer**
   ```javascript
   const visualizeHierarchy = async () => {
     const roles = await Role.find().populate('parentRole childRoles');

     const buildTree = (role, level = 0) => {
       const indent = '  '.repeat(level);
       console.log(
         `${indent}${role.name} (${role.permissions.length} permissions)`
       );

       for (const child of role.childRoles) {
         buildTree(child, level + 1);
       }
     };

     const rootRoles = roles.filter((r) => !r.parentRole);
     rootRoles.forEach((role) => buildTree(role));
   };
   ```

### Frontend Debugging

1. **Permission Debug Component**

   ```javascript
   const PermissionDebugger = ({ userId }) => {
     const { permissions, roles, loading } = usePermissions(userId);

     if (process.env.NODE_ENV !== 'development') return null;

     return (
       <div
         style={{
           position: 'fixed',
           top: 0,
           right: 0,
           background: 'white',
           padding: '10px',
         }}
       >
         <h4>RBAC Debug</h4>
         <p>Loading: {loading ? 'Yes' : 'No'}</p>
         <p>Roles: {roles.map((r) => r.name).join(', ')}</p>
         <details>
           <summary>Permissions ({permissions.length})</summary>
           <ul>
             {permissions.map((p) => (
               <li key={p}>{p}</li>
             ))}
           </ul>
         </details>
       </div>
     );
   };
   ```

2. **Permission Check Logger**
   ```javascript
   const usePermissionsWithLogging = (userId) => {
     const result = usePermissions(userId);

     const loggedHasPermission = useCallback(
       (permission) => {
         const hasAccess = result.hasPermission(permission);
         console.log(`Permission Check: ${permission} = ${hasAccess}`);
         return hasAccess;
       },
       [result.hasPermission]
     );

     return {
       ...result,
       hasPermission: loggedHasPermission,
     };
   };
   ```

## Common Error Codes

### Backend Error Codes

| Code       | Description                   | Solution                         |
| ---------- | ----------------------------- | -------------------------------- |
| `RBAC_001` | Authentication required       | Provide valid JWT token          |
| `RBAC_002` | Insufficient permissions      | Check user roles and permissions |
| `RBAC_003` | Role not found                | Verify role ID exists            |
| `RBAC_004` | Permission not found          | Check permission name spelling   |
| `RBAC_005` | Circular dependency detected  | Fix role hierarchy               |
| `RBAC_006` | Cache operation failed        | Check Redis connection           |
| `RBAC_007` | Database constraint violation | Validate data integrity          |
| `RBAC_008` | Role hierarchy depth exceeded | Limit hierarchy levels           |

### Frontend Error Codes

| Code              | Description                 | Solution                            |
| ----------------- | --------------------------- | ----------------------------------- |
| `RBAC_CLIENT_001` | RBAC provider not found     | Wrap component in RBACProvider      |
| `RBAC_CLIENT_002` | Permission hook error       | Check hook usage and dependencies   |
| `RBAC_CLIENT_003` | Network request failed      | Check API endpoint and connectivity |
| `RBAC_CLIENT_004` | Invalid permission format   | Use correct permission naming       |
| `RBAC_CLIENT_005` | Cache synchronization error | Clear local cache                   |

## Performance Monitoring

### Key Metrics to Monitor

1. **Permission Check Latency**

   ```javascript
   const monitorPermissionCheck = async (userId, permission) => {
     const start = Date.now();
     const result = await checkPermission(userId, permission);
     const duration = Date.now() - start;

     // Log slow checks
     if (duration > 100) {
       console.warn(`Slow permission check: ${permission} took ${duration}ms`);
     }

     return result;
   };
   ```

2. **Cache Hit Rates**
   ```javascript
   class CacheMetrics {
     constructor() {
       this.hits = 0;
       this.misses = 0;
     }

     recordHit() {
       this.hits++;
     }
     recordMiss() {
       this.misses++;
     }

     getHitRate() {
       const total = this.hits + this.misses;
       return total > 0 ? (this.hits / total) * 100 : 0;
     }
   }
   ```

### Alerting Rules

```javascript
// Set up alerts for critical issues
const checkRBACHealth = async () => {
  const metrics = await getRBACMetrics();

  if (metrics.avgPermissionCheckTime > 200) {
    await sendAlert('High permission check latency');
  }

  if (metrics.cacheHitRate < 80) {
    await sendAlert('Low cache hit rate');
  }

  if (metrics.errorRate > 5) {
    await sendAlert('High RBAC error rate');
  }
};
```

This troubleshooting guide provides comprehensive solutions for common Dynamic RBAC issues, helping developers quickly identify and resolve problems in both development and production environments.
