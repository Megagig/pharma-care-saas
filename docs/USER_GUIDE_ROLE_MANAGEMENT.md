# Role and Permission Management User Guide

## Overview

This guide provides step-by-step instructions for pharmacy administrators to manage roles and permissions using the Dynamic RBAC system. It covers common administrative tasks, best practices, and troubleshooting tips.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Roles and Permissions](#understanding-roles-and-permissions)
3. [Managing Roles](#managing-roles)
4. [Managing Permissions](#managing-permissions)
5. [User Role Assignment](#user-role-assignment)
6. [Role Hierarchy Management](#role-hierarchy-management)
7. [Monitoring and Auditing](#monitoring-and-auditing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Frequently Asked Questions](#frequently-asked-questions)

## Getting Started

### Accessing the Role Management Interface

1. **Login to your pharmacy management system**

   - Use your administrator credentials
   - Ensure you have "Super Admin" or "Role Management" permissions

2. **Navigate to Role Management**
   - Click on "Administration" in the main menu
   - Select "Role & Permission Management"
   - You'll see the main dashboard with role overview

### Dashboard Overview

The Role Management dashboard provides:

- **Role Summary**: Total roles, active users, recent changes
- **Quick Actions**: Create role, assign permissions, manage users
- **Recent Activity**: Latest role and permission changes
- **System Health**: Permission cache status, performance metrics

![Role Management Dashboard](images/role-dashboard.png)

## Understanding Roles and Permissions

### What are Roles?

Roles are collections of permissions that define what users can do in the system. Think of roles as job titles:

- **Pharmacy Owner**: Full control over the pharmacy
- **Pharmacy Manager**: Manages daily operations and staff
- **Pharmacy Staff**: Handles patient interactions and dispensing
- **Pharmacy Technician**: Assists with inventory and basic tasks

### What are Permissions?

Permissions are specific actions users can perform:

- **patient.read**: View patient information
- **patient.create**: Add new patients
- **medication.dispense**: Process medication dispensing
- **inventory.manage**: Manage pharmacy inventory
- **reports.view**: Access pharmacy reports

### Permission Categories

Permissions are organized into categories for easier management:

| Category                  | Description                 | Example Permissions                                        |
| ------------------------- | --------------------------- | ---------------------------------------------------------- |
| **Patient Management**    | Patient-related actions     | patient.read, patient.create, patient.update               |
| **Medication Management** | Medication and dispensing   | medication.dispense, medication.view, prescription.process |
| **Inventory Management**  | Stock and supply management | inventory.manage, inventory.audit, supplier.manage         |
| **Reporting**             | Analytics and reports       | reports.view, reports.generate, analytics.access           |
| **Administration**        | System administration       | user.manage, role.create, system.configure                 |

## Managing Roles

### Creating a New Role

1. **Access Role Creation**

   - Click "Create New Role" button on the dashboard
   - Or navigate to "Roles" → "Create Role"

2. **Fill in Role Details**

   ```
   Role Name: senior_pharmacist
   Display Name: Senior Pharmacist
   Description: Experienced pharmacist with additional responsibilities
   Category: workplace
   ```

3. **Select Parent Role (Optional)**

   - Choose a parent role to inherit permissions
   - Example: Select "Pharmacy Staff" as parent for "Senior Pharmacist"

4. **Assign Permissions**

   - Browse available permissions by category
   - Select relevant permissions for the role
   - Use the search function to find specific permissions

5. **Review and Save**
   - Review the role summary
   - Check inherited permissions from parent role
   - Click "Create Role" to save

![Create Role Interface](images/create-role.png)

### Editing Existing Roles

1. **Find the Role**

   - Use the search bar to find roles by name
   - Or browse the role list
   - Click on the role name to open details

2. **Modify Role Properties**

   - Update display name or description
   - Change role category if needed
   - Modify parent role relationship

3. **Update Permissions**

   - Add new permissions by checking boxes
   - Remove permissions by unchecking boxes
   - Review inherited permissions (shown in gray)

4. **Save Changes**
   - Click "Save Changes"
   - Review the impact summary showing affected users
   - Confirm the changes

### Deleting Roles

⚠️ **Important**: Deleting a role affects all users assigned to it.

1. **Select Role for Deletion**

   - Navigate to the role details page
   - Click "Delete Role" button

2. **Handle User Reassignments**

   - Choose how to handle users with this role:
     - **Reassign to another role**: Select replacement role
     - **Remove role only**: Users keep other roles
     - **Notify users**: Send email notifications

3. **Confirm Deletion**
   - Review the deletion impact
   - Type the role name to confirm
   - Click "Delete Role"

## Managing Permissions

### Viewing Permission Matrix

The permission matrix shows all permissions organized by category:

1. **Access Permission Matrix**

   - Navigate to "Permissions" → "Permission Matrix"
   - View permissions grouped by category

2. **Understanding the Matrix**
   - **Green checkmarks**: Permission exists and is active
   - **Gray dashes**: Permission not applicable
   - **Red X**: Permission disabled or restricted

### Creating Custom Permissions

For advanced use cases, you can create custom permissions:

1. **Access Permission Creation**

   - Navigate to "Permissions" → "Create Permission"

2. **Define Permission Details**

   ```
   Action: inventory.audit.advanced
   Display Name: Advanced Inventory Audit
   Description: Perform comprehensive inventory audits with analytics
   Category: inventory_management
   ```

3. **Set Permission Properties**

   - **Requires Subscription**: Premium feature flag
   - **Trial Access**: Allow during trial period
   - **Plan Tiers**: Which subscription plans include this permission

4. **Define Dependencies**
   - **Depends On**: Prerequisites (e.g., inventory.read)
   - **Conflicts With**: Incompatible permissions

### Permission Usage Analysis

Monitor how permissions are used across your organization:

1. **Access Usage Analytics**

   - Navigate to "Permissions" → "Usage Analytics"

2. **Review Usage Metrics**
   - **Most Used Permissions**: Frequently accessed features
   - **Unused Permissions**: Permissions that might be removed
   - **Permission Trends**: Usage patterns over time

## User Role Assignment

### Assigning Roles to Users

1. **Find the User**

   - Navigate to "Users" → "User Management"
   - Search for the user by name or email
   - Click on the user to open their profile

2. **Manage User Roles**

   - Click "Manage Roles" in the user profile
   - View current roles and their permissions

3. **Add New Roles**

   - Click "Add Role"
   - Select from available roles
   - Set expiration date if temporary
   - Add notes for the assignment

4. **Remove Roles**
   - Click the "X" next to roles to remove
   - Confirm the removal
   - Users are notified of role changes

![User Role Assignment](images/user-roles.png)

### Bulk User Management

For managing multiple users at once:

1. **Access Bulk Operations**

   - Navigate to "Users" → "Bulk Operations"

2. **Select Users**

   - Use filters to find users (department, role, etc.)
   - Select individual users or use "Select All"

3. **Choose Bulk Action**

   - **Assign Role**: Add role to selected users
   - **Remove Role**: Remove role from selected users
   - **Replace Role**: Replace one role with another

4. **Execute and Monitor**
   - Review the operation summary
   - Execute the bulk operation
   - Monitor progress in the activity log

### Temporary Role Assignments

For temporary access needs:

1. **Set Expiration Date**

   - When assigning roles, set an expiration date
   - System automatically removes expired roles

2. **Monitor Temporary Assignments**
   - View expiring roles in the dashboard
   - Receive notifications before expiration
   - Extend or make permanent as needed

## Role Hierarchy Management

### Understanding Role Hierarchy

Role hierarchy allows roles to inherit permissions from parent roles:

```
Pharmacy Owner (Level 1)
├── Pharmacy Manager (Level 2)
│   ├── Senior Pharmacist (Level 3)
│   └── Pharmacy Supervisor (Level 3)
└── Administrative Manager (Level 2)
    └── Administrative Assistant (Level 3)
```

### Creating Role Hierarchies

1. **Plan Your Hierarchy**

   - Map out your organizational structure
   - Identify permission inheritance patterns
   - Keep hierarchy levels reasonable (max 5 levels)

2. **Set Parent-Child Relationships**

   - Edit a role to set its parent role
   - Child roles automatically inherit parent permissions
   - Additional permissions can be added to child roles

3. **Validate Hierarchy**
   - Use the hierarchy visualization tool
   - Check for circular dependencies
   - Verify permission inheritance is correct

### Hierarchy Best Practices

- **Keep it Simple**: Avoid overly complex hierarchies
- **Logical Structure**: Mirror your organizational structure
- **Regular Review**: Periodically review and optimize
- **Document Changes**: Keep records of hierarchy modifications

## Monitoring and Auditing

### Activity Monitoring

Track all role and permission changes:

1. **Access Activity Log**

   - Navigate to "Monitoring" → "Activity Log"
   - Filter by date range, user, or action type

2. **Review Key Activities**
   - Role creations, modifications, deletions
   - Permission assignments and removals
   - User role changes
   - System configuration updates

### Audit Reports

Generate comprehensive audit reports:

1. **Standard Reports**

   - **User Access Report**: Who has access to what
   - **Role Usage Report**: How roles are distributed
   - **Permission Changes**: Recent permission modifications
   - **Compliance Report**: Regulatory compliance status

2. **Custom Reports**
   - Create custom reports for specific needs
   - Schedule automatic report generation
   - Export reports in various formats (PDF, Excel, CSV)

### Security Monitoring

Monitor for security-related events:

1. **Access Anomalies**

   - Unusual permission usage patterns
   - Failed permission checks
   - Suspicious role assignments

2. **Compliance Alerts**
   - Users with excessive permissions
   - Roles with conflicting permissions
   - Expired temporary assignments

## Best Practices

### Role Design Principles

1. **Principle of Least Privilege**

   - Give users only the permissions they need
   - Regularly review and remove unnecessary permissions
   - Use temporary assignments for short-term needs

2. **Role Clarity**

   - Use clear, descriptive role names
   - Document role purposes and responsibilities
   - Avoid overlapping or redundant roles

3. **Hierarchy Efficiency**
   - Design hierarchies that reflect real organizational structure
   - Use inheritance to reduce permission management overhead
   - Keep hierarchy depth reasonable (3-5 levels max)

### Permission Management

1. **Regular Audits**

   - Monthly review of user permissions
   - Quarterly role effectiveness assessment
   - Annual comprehensive security audit

2. **Documentation**

   - Maintain role and permission documentation
   - Document approval processes for role changes
   - Keep records of compliance requirements

3. **Training and Communication**
   - Train staff on their roles and permissions
   - Communicate changes clearly and promptly
   - Provide self-service tools where appropriate

### Security Considerations

1. **Sensitive Permissions**

   - Carefully control administrative permissions
   - Monitor usage of high-privilege roles
   - Implement approval workflows for sensitive changes

2. **Separation of Duties**
   - Avoid giving single users conflicting permissions
   - Implement checks and balances
   - Use role combinations instead of super-roles

## Troubleshooting

### Common Issues and Solutions

#### Users Can't Access Expected Features

**Symptoms**: User reports they can't access a feature they should be able to use.

**Troubleshooting Steps**:

1. Check user's current roles and permissions
2. Verify the required permission for the feature
3. Check if permissions are cached (may need refresh)
4. Review role hierarchy for inheritance issues

**Solution**:

```
1. Navigate to user profile
2. Click "Refresh Permissions"
3. If still not working, check role assignments
4. Verify feature requires the expected permission
```

#### Role Changes Not Taking Effect

**Symptoms**: Role modifications don't seem to apply to users.

**Troubleshooting Steps**:

1. Check if changes were saved successfully
2. Verify permission cache is updating
3. Check for system-wide cache issues

**Solution**:

```
1. Go to System Settings → Cache Management
2. Click "Clear Permission Cache"
3. Wait 2-3 minutes for cache rebuild
4. Test user access again
```

#### Permission Conflicts

**Symptoms**: Users have conflicting permissions or unexpected access.

**Troubleshooting Steps**:

1. Review user's complete permission set
2. Check for conflicting role assignments
3. Verify role hierarchy is correct

**Solution**:

```
1. Use Permission Analyzer tool
2. Identify conflicting permissions
3. Adjust role assignments or hierarchy
4. Document resolution for future reference
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check System Status**

   - Visit the system status page
   - Check for known issues or maintenance

2. **Contact Support**

   - Use the in-app help system
   - Email: support@pharma-care.com
   - Phone: 1-800-PHARMA-CARE

3. **Emergency Contacts**
   - For critical access issues: emergency@pharma-care.com
   - For security concerns: security@pharma-care.com

## Frequently Asked Questions

### General Questions

**Q: How often should I review user roles and permissions?**
A: We recommend monthly reviews for active users and quarterly comprehensive audits. High-privilege roles should be reviewed more frequently.

**Q: Can I create custom roles for specific workflows?**
A: Yes, you can create custom roles tailored to your pharmacy's specific needs. Use the role creation wizard and select appropriate permissions.

**Q: What happens when a user has multiple roles?**
A: Users receive the combined permissions from all their roles. The system automatically handles permission conflicts by granting access when any role provides it.

### Technical Questions

**Q: How long does it take for permission changes to take effect?**
A: Most changes take effect within 2-3 minutes due to caching. You can force immediate updates using the "Refresh Permissions" button.

**Q: Can I temporarily disable a role without deleting it?**
A: Yes, you can deactivate roles. Deactivated roles remain in the system but don't grant permissions to users.

**Q: Is there a limit to how many roles a user can have?**
A: There's no hard limit, but we recommend keeping role assignments focused and relevant. Too many roles can complicate permission management.

### Security Questions

**Q: How do I ensure compliance with healthcare regulations?**
A: Use the compliance reporting features and follow the principle of least privilege. Regular audits and documentation are essential for regulatory compliance.

**Q: What should I do if I suspect unauthorized access?**
A: Immediately review the user's permissions, check the activity log for suspicious actions, and contact security support if needed.

**Q: Can I set up approval workflows for role changes?**
A: Yes, approval workflows can be configured for sensitive role changes. Contact your system administrator to set up approval processes.

---

This user guide provides comprehensive instructions for managing roles and permissions in your pharmacy management system. For additional support or advanced configuration needs, please contact our support team.
