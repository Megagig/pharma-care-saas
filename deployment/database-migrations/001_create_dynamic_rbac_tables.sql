-- Dynamic RBAC Database Migration Script
-- Version: 001
-- Description: Create core dynamic RBAC tables and indexes
-- Author: System Administrator
-- Date: 2024-01-01

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_system_permission BOOLEAN DEFAULT false,
    requires_subscription BOOLEAN DEFAULT false,
    allow_trial_access BOOLEAN DEFAULT true,
    required_plan_tiers TEXT[] DEFAULT '{}',
    depends_on TEXT[] DEFAULT '{}',
    conflicts TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'custom',
    parent_role_id UUID REFERENCES roles(_id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false,
    workspace_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Ensure unique role names within workspace
    CONSTRAINT unique_role_name_workspace UNIQUE (name, workspace_id)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(_id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID,
    
    -- Ensure unique role-permission combinations
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
    workspace_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_temporary BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Ensure unique user-role combinations within workspace
    CONSTRAINT unique_user_role_workspace UNIQUE (user_id, role_id, workspace_id)
);

-- Create user_permissions table for direct permission assignments
CREATE TABLE IF NOT EXISTS user_permissions (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    permission_action VARCHAR(255) NOT NULL,
    permission_type VARCHAR(50) DEFAULT 'granted', -- 'granted' or 'denied'
    workspace_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Ensure unique user-permission combinations within workspace
    CONSTRAINT unique_user_permission_workspace UNIQUE (user_id, permission_action, workspace_id)
);

-- Create role_hierarchy_cache table for performance optimization
CREATE TABLE IF NOT EXISTS role_hierarchy_cache (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
    ancestor_role_id UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
    hierarchy_level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique role-ancestor combinations
    CONSTRAINT unique_role_ancestor UNIQUE (role_id, ancestor_role_id)
);

-- Create permission_cache table for user permission caching
CREATE TABLE IF NOT EXISTS permission_cache (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    workspace_id UUID,
    permissions_json JSONB NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique cache entries per user-workspace
    CONSTRAINT unique_permission_cache UNIQUE (user_id, workspace_id)
);

-- Create audit_logs table for RBAC operations
CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID,
    target_user_id UUID,
    role_id UUID,
    permission_action VARCHAR(255),
    workspace_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    event_data JSONB,
    result VARCHAR(50), -- 'success', 'failure', 'denied'
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for efficient querying
    INDEX idx_audit_logs_event_type (event_type),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_risk_level (risk_level)
);

-- Create indexes for optimal query performance

-- Permissions table indexes
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active) WHERE is_active = true;

-- Roles table indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_roles_workspace ON roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active) WHERE is_active = true;

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_workspace ON user_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_action ON user_permissions(permission_action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_workspace ON user_permissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active) WHERE is_active = true;

-- Role hierarchy cache indexes
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_cache_role ON role_hierarchy_cache(role_id);
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_cache_ancestor ON role_hierarchy_cache(ancestor_role_id);

-- Permission cache indexes
CREATE INDEX IF NOT EXISTS idx_permission_cache_user ON permission_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_cache_expires ON permission_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_cache_key ON permission_cache(cache_key);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON user_roles(user_id, workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_composite ON role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_composite ON user_permissions(user_id, workspace_id, is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
    p_user_id UUID,
    p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE(permission_action TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE role_hierarchy AS (
        -- Base case: direct user roles
        SELECT r._id, r.name, r.parent_role_id, 0 as level
        FROM roles r
        JOIN user_roles ur ON r._id = ur.role_id
        WHERE ur.user_id = p_user_id 
          AND ur.is_active = true 
          AND r.is_active = true
          AND (p_workspace_id IS NULL OR ur.workspace_id = p_workspace_id)
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        
        UNION ALL
        
        -- Recursive case: parent roles
        SELECT r._id, r.name, r.parent_role_id, rh.level + 1
        FROM roles r
        JOIN role_hierarchy rh ON r._id = rh.parent_role_id
        WHERE rh.level < 10 -- Prevent infinite recursion
          AND r.is_active = true
    ),
    role_permissions_expanded AS (
        -- Get permissions from role hierarchy
        SELECT DISTINCT p.action
        FROM role_hierarchy rh
        JOIN role_permissions rp ON rh._id = rp.role_id
        JOIN permissions p ON rp.permission_id = p._id
        WHERE p.is_active = true
    ),
    direct_permissions AS (
        -- Get direct user permissions (granted)
        SELECT up.permission_action as action
        FROM user_permissions up
        WHERE up.user_id = p_user_id
          AND up.is_active = true
          AND up.permission_type = 'granted'
          AND (p_workspace_id IS NULL OR up.workspace_id = p_workspace_id)
          AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
    ),
    denied_permissions AS (
        -- Get direct user permissions (denied)
        SELECT up.permission_action as action
        FROM user_permissions up
        WHERE up.user_id = p_user_id
          AND up.is_active = true
          AND up.permission_type = 'denied'
          AND (p_workspace_id IS NULL OR up.workspace_id = p_workspace_id)
          AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
    )
    -- Combine role permissions and direct permissions, excluding denied permissions
    SELECT rpe.action
    FROM role_permissions_expanded rpe
    WHERE rpe.action NOT IN (SELECT action FROM denied_permissions)
    
    UNION
    
    SELECT dp.action
    FROM direct_permissions dp
    WHERE dp.action NOT IN (SELECT action FROM denied_permissions);
END;
$$ LANGUAGE plpgsql;

-- Create function to rebuild role hierarchy cache
CREATE OR REPLACE FUNCTION rebuild_role_hierarchy_cache()
RETURNS VOID AS $$
BEGIN
    -- Clear existing cache
    DELETE FROM role_hierarchy_cache;
    
    -- Rebuild cache with recursive CTE
    WITH RECURSIVE role_hierarchy AS (
        -- Base case: all roles
        SELECT _id as role_id, _id as ancestor_role_id, 0 as level
        FROM roles
        WHERE is_active = true
        
        UNION ALL
        
        -- Recursive case: parent relationships
        SELECT rh.role_id, r.parent_role_id as ancestor_role_id, rh.level + 1
        FROM role_hierarchy rh
        JOIN roles r ON rh.ancestor_role_id = r._id
        WHERE r.parent_role_id IS NOT NULL
          AND rh.level < 10 -- Prevent infinite recursion
    )
    INSERT INTO role_hierarchy_cache (role_id, ancestor_role_id, hierarchy_level)
    SELECT role_id, ancestor_role_id, level
    FROM role_hierarchy
    WHERE role_id != ancestor_role_id; -- Exclude self-references
END;
$$ LANGUAGE plpgsql;

-- Create function to validate role hierarchy (prevent cycles)
CREATE OR REPLACE FUNCTION validate_role_hierarchy(
    p_role_id UUID,
    p_parent_role_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    cycle_detected BOOLEAN := false;
BEGIN
    -- Check if setting this parent would create a cycle
    WITH RECURSIVE hierarchy_check AS (
        SELECT p_parent_role_id as role_id, 0 as level
        
        UNION ALL
        
        SELECT r.parent_role_id, hc.level + 1
        FROM hierarchy_check hc
        JOIN roles r ON hc.role_id = r._id
        WHERE r.parent_role_id IS NOT NULL
          AND hc.level < 10
          AND hc.role_id != p_role_id -- Stop if we encounter the original role
    )
    SELECT EXISTS(
        SELECT 1 FROM hierarchy_check WHERE role_id = p_role_id
    ) INTO cycle_detected;
    
    RETURN NOT cycle_detected;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate role hierarchy before updates
CREATE OR REPLACE FUNCTION validate_role_hierarchy_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_role_id IS NOT NULL THEN
        IF NOT validate_role_hierarchy(NEW._id, NEW.parent_role_id) THEN
            RAISE EXCEPTION 'Role hierarchy would create a circular dependency';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_role_hierarchy_before_update
    BEFORE UPDATE ON roles
    FOR EACH ROW
    WHEN (OLD.parent_role_id IS DISTINCT FROM NEW.parent_role_id)
    EXECUTE FUNCTION validate_role_hierarchy_trigger();

-- Create function to clean up expired permissions and roles
CREATE OR REPLACE FUNCTION cleanup_expired_rbac_data()
RETURNS VOID AS $$
BEGIN
    -- Deactivate expired user roles
    UPDATE user_roles 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
      AND expires_at < CURRENT_TIMESTAMP 
      AND is_active = true;
    
    -- Deactivate expired user permissions
    UPDATE user_permissions 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
      AND expires_at < CURRENT_TIMESTAMP 
      AND is_active = true;
    
    -- Clean up expired permission cache entries
    DELETE FROM permission_cache 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Log cleanup activity
    INSERT INTO rbac_audit_logs (event_type, event_data, result)
    VALUES ('RBAC_CLEANUP', 
            jsonb_build_object(
                'expired_roles_deactivated', (SELECT count(*) FROM user_roles WHERE expires_at < CURRENT_TIMESTAMP AND is_active = false),
                'expired_permissions_deactivated', (SELECT count(*) FROM user_permissions WHERE expires_at < CURRENT_TIMESTAMP AND is_active = false),
                'cache_entries_cleaned', 0
            ), 
            'success');
END;
$$ LANGUAGE plpgsql;

-- Insert default system permissions
INSERT INTO permissions (action, display_name, description, category, is_system_permission) VALUES
-- System administration
('system.admin', 'System Administration', 'Full system administrative access', 'system', true),
('system.configure', 'System Configuration', 'Configure system settings', 'system', true),
('system.monitor', 'System Monitoring', 'Monitor system health and performance', 'system', true),

-- User management
('user.create', 'Create Users', 'Create new user accounts', 'user_management', true),
('user.read', 'View Users', 'View user information', 'user_management', true),
('user.update', 'Update Users', 'Modify user information', 'user_management', true),
('user.delete', 'Delete Users', 'Remove user accounts', 'user_management', true),
('user.manage', 'Manage Users', 'Full user management capabilities', 'user_management', true),

-- Role management
('role.create', 'Create Roles', 'Create new roles', 'role_management', true),
('role.read', 'View Roles', 'View role information', 'role_management', true),
('role.update', 'Update Roles', 'Modify role information', 'role_management', true),
('role.delete', 'Delete Roles', 'Remove roles', 'role_management', true),
('role.assign', 'Assign Roles', 'Assign roles to users', 'role_management', true),

-- Permission management
('permission.create', 'Create Permissions', 'Create new permissions', 'permission_management', true),
('permission.read', 'View Permissions', 'View permission information', 'permission_management', true),
('permission.update', 'Update Permissions', 'Modify permission information', 'permission_management', true),
('permission.delete', 'Delete Permissions', 'Remove permissions', 'permission_management', true),

-- Patient management
('patient.create', 'Create Patients', 'Add new patients to the system', 'patient_management', false),
('patient.read', 'View Patients', 'View patient information', 'patient_management', false),
('patient.update', 'Update Patients', 'Modify patient information', 'patient_management', false),
('patient.delete', 'Delete Patients', 'Remove patient records', 'patient_management', false),
('patient.merge', 'Merge Patients', 'Merge duplicate patient records', 'patient_management', false),

-- Prescription management
('prescription.create', 'Create Prescriptions', 'Create new prescriptions', 'prescription_management', false),
('prescription.read', 'View Prescriptions', 'View prescription information', 'prescription_management', false),
('prescription.update', 'Update Prescriptions', 'Modify prescription information', 'prescription_management', false),
('prescription.approve', 'Approve Prescriptions', 'Approve prescriptions for dispensing', 'prescription_management', false),
('prescription.dispense', 'Dispense Medications', 'Process medication dispensing', 'prescription_management', false),

-- Inventory management
('inventory.read', 'View Inventory', 'View inventory information', 'inventory_management', false),
('inventory.update', 'Update Inventory', 'Modify inventory levels', 'inventory_management', false),
('inventory.manage', 'Manage Inventory', 'Full inventory management', 'inventory_management', false),
('inventory.audit', 'Audit Inventory', 'Perform inventory audits', 'inventory_management', false),

-- Reporting
('reports.view', 'View Reports', 'Access standard reports', 'reporting', false),
('reports.generate', 'Generate Reports', 'Create custom reports', 'reporting', false),
('reports.export', 'Export Reports', 'Export report data', 'reporting', false),

-- Financial
('billing.create', 'Create Bills', 'Create billing records', 'financial', false),
('billing.read', 'View Billing', 'View billing information', 'financial', false),
('billing.update', 'Update Billing', 'Modify billing records', 'financial', false),
('payment.process', 'Process Payments', 'Handle payment processing', 'financial', false),

-- Audit and compliance
('audit.read', 'View Audit Logs', 'Access audit trail information', 'audit', true),
('audit.export', 'Export Audit Data', 'Export audit logs', 'audit', true),
('compliance.monitor', 'Monitor Compliance', 'Monitor regulatory compliance', 'compliance', true);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, category, is_system_role, hierarchy_level) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 'system', true, 0),
('system_admin', 'System Administrator', 'System administration and configuration', 'system', true, 1),
('compliance_officer', 'Compliance Officer', 'Regulatory compliance and audit oversight', 'system', true, 1),
('pharmacy_owner', 'Pharmacy Owner', 'Pharmacy owner with business management access', 'business', true, 2),
('pharmacy_manager', 'Pharmacy Manager', 'Pharmacy operations management', 'operational', true, 3),
('lead_pharmacist', 'Lead Pharmacist', 'Senior pharmacist with supervisory duties', 'clinical', true, 4),
('staff_pharmacist', 'Staff Pharmacist', 'Licensed pharmacist', 'clinical', true, 5),
('pharmacy_technician', 'Pharmacy Technician', 'Certified pharmacy technician', 'operational', true, 5),
('pharmacy_intern', 'Pharmacy Intern', 'Pharmacy student or intern', 'clinical', true, 6);

-- Set up role hierarchy relationships
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'super_admin') WHERE name = 'system_admin';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'super_admin') WHERE name = 'compliance_officer';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'system_admin') WHERE name = 'pharmacy_owner';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'pharmacy_owner') WHERE name = 'pharmacy_manager';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'pharmacy_manager') WHERE name = 'lead_pharmacist';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'lead_pharmacist') WHERE name = 'staff_pharmacist';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'pharmacy_manager') WHERE name = 'pharmacy_technician';
UPDATE roles SET parent_role_id = (SELECT _id FROM roles WHERE name = 'staff_pharmacist') WHERE name = 'pharmacy_intern';

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'super_admin'),
    _id
FROM permissions;

-- System Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'system_admin'),
    _id
FROM permissions 
WHERE action IN (
    'system.configure', 'system.monitor',
    'user.create', 'user.read', 'user.update', 'user.delete',
    'role.create', 'role.read', 'role.update', 'role.assign',
    'audit.read', 'audit.export'
);

-- Compliance Officer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'compliance_officer'),
    _id
FROM permissions 
WHERE action IN (
    'audit.read', 'audit.export', 'compliance.monitor',
    'user.read', 'role.read', 'reports.view', 'reports.export'
);

-- Pharmacy Owner permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'pharmacy_owner'),
    _id
FROM permissions 
WHERE action IN (
    'user.read', 'user.update', 'role.read', 'role.assign',
    'patient.read', 'patient.update',
    'prescription.read', 'prescription.approve',
    'inventory.read', 'inventory.manage',
    'reports.view', 'reports.generate', 'reports.export',
    'billing.read', 'billing.update', 'payment.process'
);

-- Pharmacy Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'pharmacy_manager'),
    _id
FROM permissions 
WHERE action IN (
    'patient.create', 'patient.read', 'patient.update',
    'prescription.read', 'prescription.update', 'prescription.approve',
    'inventory.read', 'inventory.update', 'inventory.audit',
    'reports.view', 'reports.generate'
);

-- Lead Pharmacist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'lead_pharmacist'),
    _id
FROM permissions 
WHERE action IN (
    'patient.read', 'patient.update',
    'prescription.read', 'prescription.update', 'prescription.approve', 'prescription.dispense',
    'inventory.read', 'inventory.update'
);

-- Staff Pharmacist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'staff_pharmacist'),
    _id
FROM permissions 
WHERE action IN (
    'patient.read', 'patient.update',
    'prescription.read', 'prescription.dispense',
    'inventory.read'
);

-- Pharmacy Technician permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'pharmacy_technician'),
    _id
FROM permissions 
WHERE action IN (
    'patient.read', 'patient.create', 'patient.update',
    'prescription.read', 'prescription.create',
    'inventory.read', 'inventory.update'
);

-- Pharmacy Intern permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT _id FROM roles WHERE name = 'pharmacy_intern'),
    _id
FROM permissions 
WHERE action IN (
    'patient.read',
    'prescription.read',
    'inventory.read'
);

-- Build initial role hierarchy cache
SELECT rebuild_role_hierarchy_cache();

-- Create a scheduled job to clean up expired data (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('rbac-cleanup', '0 2 * * *', 'SELECT cleanup_expired_rbac_data();');

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Stores all available permissions in the system';
COMMENT ON TABLE roles IS 'Stores role definitions with hierarchy support';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to their permissions';
COMMENT ON TABLE user_roles IS 'Junction table linking users to their assigned roles';
COMMENT ON TABLE user_permissions IS 'Direct permission assignments to users (granted or denied)';
COMMENT ON TABLE role_hierarchy_cache IS 'Cached role hierarchy for performance optimization';
COMMENT ON TABLE permission_cache IS 'Cached user permissions for performance optimization';
COMMENT ON TABLE rbac_audit_logs IS 'Audit trail for all RBAC-related operations';

COMMENT ON FUNCTION get_user_permissions(UUID, UUID) IS 'Calculates effective permissions for a user including role inheritance';
COMMENT ON FUNCTION rebuild_role_hierarchy_cache() IS 'Rebuilds the role hierarchy cache table';
COMMENT ON FUNCTION validate_role_hierarchy(UUID, UUID) IS 'Validates that a role hierarchy change would not create cycles';
COMMENT ON FUNCTION cleanup_expired_rbac_data() IS 'Cleans up expired roles, permissions, and cache entries';

-- Migration completed successfully
INSERT INTO rbac_audit_logs (event_type, event_data, result)
VALUES ('DATABASE_MIGRATION', 
        jsonb_build_object(
            'migration_version', '001',
            'migration_name', 'create_dynamic_rbac_tables',
            'tables_created', ARRAY['permissions', 'roles', 'role_permissions', 'user_roles', 'user_permissions', 'role_hierarchy_cache', 'permission_cache', 'rbac_audit_logs'],
            'functions_created', ARRAY['get_user_permissions', 'rebuild_role_hierarchy_cache', 'validate_role_hierarchy', 'cleanup_expired_rbac_data'],
            'default_permissions_count', (SELECT count(*) FROM permissions),
            'default_roles_count', (SELECT count(*) FROM roles)
        ), 
        'success');

COMMIT;