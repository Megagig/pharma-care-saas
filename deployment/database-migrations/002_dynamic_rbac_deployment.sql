-- Dynamic RBAC Database Migration Script
-- Version: 1.0
-- Description: Complete database setup for dynamic RBAC system
-- Author: System
-- Date: 2025-01-27

-- ============================================================================
-- DYNAMIC RBAC COLLECTIONS SETUP
-- ============================================================================

-- Note: This is a MongoDB migration script written in SQL-like syntax
-- for documentation purposes. Actual MongoDB migrations will be handled
-- by the Node.js migration scripts.

-- Create indexes for Role collection
-- db.roles.createIndex({ name: 1 }, { unique: true });
-- db.roles.createIndex({ category: 1, isActive: 1 });
-- db.roles.createIndex({ workspaceId: 1, isActive: 1 });
-- db.roles.createIndex({ parentRole: 1 });
-- db.roles.createIndex({ hierarchyLevel: 1 });
-- db.roles.createIndex({ isSystemRole: 1, isActive: 1 });

-- Create indexes for Permission collection
-- db.permissions.createIndex({ action: 1 }, { unique: true });
-- db.permissions.createIndex({ category: 1 });
-- db.permissions.createIndex({ isSystemPermission: 1 });
-- db.permissions.createIndex({ requiredPlanTiers: 1 });

-- Create indexes for UserRole collection
-- db.userroles.createIndex({ userId: 1, isActive: 1 });
-- db.userroles.createIndex({ roleId: 1, isActive: 1 });
-- db.userroles.createIndex({ userId: 1, workspaceId: 1, isActive: 1 });
-- db.userroles.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

-- Create indexes for RolePermission collection
-- db.rolepermissions.createIndex({ roleId: 1, permission: 1 }, { unique: true });
-- db.rolepermissions.createIndex({ permission: 1, granted: 1 });
-- db.rolepermissions.createIndex({ roleId: 1, granted: 1 });

-- ============================================================================
-- SYSTEM ROLES SETUP
-- ============================================================================

-- Insert system roles (to be handled by Node.js migration)
-- These are the default roles that will be created during migration

-- Super Admin Role
INSERT INTO roles (name, displayName, description, category, isSystemRole, isActive, permissions, hierarchyLevel)
VALUES ('super_admin', 'Super Administrator', 'Full system access with all permissions', 'system', true, true, ['*'], 0);

-- Pharmacy Owner Role
INSERT INTO roles (name, displayName, description, category, isSystemRole, isActive, hierarchyLevel)
VALUES ('pharmacy_owner', 'Pharmacy Owner', 'Full pharmacy workspace access', 'workplace', true, true, 1);

-- Pharmacist Role
INSERT INTO roles (name, displayName, description, category, isSystemRole, isActive, parentRole, hierarchyLevel)
VALUES ('pharmacist', 'Licensed Pharmacist', 'Licensed pharmacist with clinical permissions', 'workplace', true, true, 'pharmacy_owner', 2);

-- Pharmacy Team Role
INSERT INTO roles (name, displayName, description, category, isSystemRole, isActive, parentRole, hierarchyLevel)
VALUES ('pharmacy_team', 'Pharmacy Team Member', 'General pharmacy team member', 'workplace', true, true, 'pharmacist', 3);

-- Intern Pharmacist Role
INSERT INTO roles (name, displayName, description, category, isSystemRole, isActive, parentRole, hierarchyLevel)
VALUES ('intern_pharmacist', 'Intern Pharmacist', 'Pharmacist intern with limited permissions', 'workplace', true, true, 'pharmacy_team', 4);

-- ============================================================================
-- SYSTEM PERMISSIONS SETUP
-- ============================================================================

-- Core system permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('system.admin', 'System Administration', 'Full system administration access', 'system', true),
  ('workspace.manage', 'Workspace Management', 'Manage workspace settings and users', 'workspace', true),
  ('user.manage', 'User Management', 'Create, update, and manage users', 'user', true),
  ('role.manage', 'Role Management', 'Create and manage roles and permissions', 'rbac', true),
  ('permission.manage', 'Permission Management', 'Manage system permissions', 'rbac', true);

-- Patient management permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('patient.create', 'Create Patients', 'Create new patient records', 'patient', true),
  ('patient.read', 'View Patients', 'View patient information', 'patient', true),
  ('patient.update', 'Update Patients', 'Update patient records', 'patient', true),
  ('patient.delete', 'Delete Patients', 'Delete patient records', 'patient', true);

-- Medication management permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('medication.create', 'Create Medications', 'Add new medications', 'medication', true),
  ('medication.read', 'View Medications', 'View medication information', 'medication', true),
  ('medication.update', 'Update Medications', 'Update medication records', 'medication', true),
  ('medication.delete', 'Delete Medications', 'Delete medication records', 'medication', true),
  ('medication.dispense', 'Dispense Medications', 'Dispense medications to patients', 'medication', true);

-- Clinical permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('clinical.notes.create', 'Create Clinical Notes', 'Create clinical notes', 'clinical', true),
  ('clinical.notes.read', 'View Clinical Notes', 'View clinical notes', 'clinical', true),
  ('clinical.notes.update', 'Update Clinical Notes', 'Update clinical notes', 'clinical', true),
  ('clinical.interventions.create', 'Create Clinical Interventions', 'Create clinical interventions', 'clinical', true),
  ('clinical.interventions.read', 'View Clinical Interventions', 'View clinical interventions', 'clinical', true);

-- MTR permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('mtr.create', 'Create MTR', 'Create medication therapy reviews', 'mtr', true),
  ('mtr.read', 'View MTR', 'View medication therapy reviews', 'mtr', true),
  ('mtr.update', 'Update MTR', 'Update medication therapy reviews', 'mtr', true),
  ('mtr.approve', 'Approve MTR', 'Approve medication therapy reviews', 'mtr', true);

-- Communication permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('communication.send', 'Send Messages', 'Send messages in communication hub', 'communication', true),
  ('communication.read', 'Read Messages', 'Read messages in communication hub', 'communication', true),
  ('communication.moderate', 'Moderate Communications', 'Moderate communication hub content', 'communication', true);

-- Audit and reporting permissions
INSERT INTO permissions (action, displayName, description, category, isSystemPermission)
VALUES 
  ('audit.read', 'View Audit Logs', 'View system audit logs', 'audit', true),
  ('reports.generate', 'Generate Reports', 'Generate system reports', 'reports', true),
  ('analytics.view', 'View Analytics', 'View system analytics', 'analytics', true);

-- ============================================================================
-- ROLE-PERMISSION MAPPINGS
-- ============================================================================

-- Super Admin gets all permissions (handled by wildcard '*' in permissions array)

-- Pharmacy Owner permissions
INSERT INTO rolepermissions (roleId, permission, granted, grantedBy, grantedAt)
SELECT r._id, p.action, true, 'system', NOW()
FROM roles r, permissions p
WHERE r.name = 'pharmacy_owner' 
AND p.action IN (
  'workspace.manage', 'user.manage', 'role.manage',
  'patient.create', 'patient.read', 'patient.update', 'patient.delete',
  'medication.create', 'medication.read', 'medication.update', 'medication.delete', 'medication.dispense',
  'clinical.notes.create', 'clinical.notes.read', 'clinical.notes.update',
  'clinical.interventions.create', 'clinical.interventions.read',
  'mtr.create', 'mtr.read', 'mtr.update', 'mtr.approve',
  'communication.send', 'communication.read', 'communication.moderate',
  'audit.read', 'reports.generate', 'analytics.view'
);

-- Pharmacist permissions
INSERT INTO rolepermissions (roleId, permission, granted, grantedBy, grantedAt)
SELECT r._id, p.action, true, 'system', NOW()
FROM roles r, permissions p
WHERE r.name = 'pharmacist' 
AND p.action IN (
  'patient.create', 'patient.read', 'patient.update',
  'medication.create', 'medication.read', 'medication.update', 'medication.dispense',
  'clinical.notes.create', 'clinical.notes.read', 'clinical.notes.update',
  'clinical.interventions.create', 'clinical.interventions.read',
  'mtr.create', 'mtr.read', 'mtr.update', 'mtr.approve',
  'communication.send', 'communication.read',
  'reports.generate'
);

-- Pharmacy Team permissions
INSERT INTO rolepermissions (roleId, permission, granted, grantedBy, grantedAt)
SELECT r._id, p.action, true, 'system', NOW()
FROM roles r, permissions p
WHERE r.name = 'pharmacy_team' 
AND p.action IN (
  'patient.read', 'patient.update',
  'medication.read', 'medication.dispense',
  'clinical.notes.read',
  'clinical.interventions.read',
  'mtr.read',
  'communication.send', 'communication.read'
);

-- Intern Pharmacist permissions
INSERT INTO rolepermissions (roleId, permission, granted, grantedBy, grantedAt)
SELECT r._id, p.action, true, 'system', NOW()
FROM roles r, permissions p
WHERE r.name = 'intern_pharmacist' 
AND p.action IN (
  'patient.read',
  'medication.read',
  'clinical.notes.read',
  'clinical.interventions.read',
  'mtr.read',
  'communication.send', 'communication.read'
);

-- ============================================================================
-- MIGRATION VALIDATION QUERIES
-- ============================================================================

-- Validate role hierarchy
SELECT 
  r1.name as parent_role,
  r2.name as child_role,
  r2.hierarchyLevel
FROM roles r1
JOIN roles r2 ON r1._id = r2.parentRole
ORDER BY r2.hierarchyLevel;

-- Validate permission assignments
SELECT 
  r.name as role_name,
  COUNT(rp.permission) as permission_count
FROM roles r
LEFT JOIN rolepermissions rp ON r._id = rp.roleId AND rp.granted = true
GROUP BY r.name
ORDER BY permission_count DESC;

-- Validate system integrity
SELECT 
  'Total Roles' as metric,
  COUNT(*) as count
FROM roles
UNION ALL
SELECT 
  'Total Permissions' as metric,
  COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
  'Total Role-Permission Mappings' as metric,
  COUNT(*) as count
FROM rolepermissions
UNION ALL
SELECT 
  'Active System Roles' as metric,
  COUNT(*) as count
FROM roles
WHERE isSystemRole = true AND isActive = true;

-- ============================================================================
-- ROLLBACK PROCEDURES
-- ============================================================================

-- To rollback this migration, execute the following in reverse order:
-- 1. DROP rolepermissions collection
-- 2. DROP userroles collection  
-- 3. DROP permissions collection
-- 4. DROP roles collection
-- 5. Remove new fields from users collection:
--    db.users.updateMany({}, { $unset: { assignedRoles: "", directPermissions: "", deniedPermissions: "", cachedPermissions: "", roleLastModifiedBy: "", roleLastModifiedAt: "" } });

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================

-- 1. Run user migration to convert existing static roles to dynamic roles
-- 2. Update application configuration to enable dynamic RBAC
-- 3. Verify all existing users retain their permissions
-- 4. Enable monitoring and alerting for RBAC system
-- 5. Schedule regular permission audits and reviews

-- Migration completed successfully
-- Next steps: Execute Node.js migration scripts to implement these changes