# Patient Engagement RBAC Implementation Summary

## Overview
Implemented comprehensive Role-Based Access Control (RBAC) for the Patient Engagement & Follow-up Management module, including appointment scheduling, follow-up task management, and pharmacist schedule management.

## Files Created

### Middleware Files
1. **backend/src/middlewares/appointmentRBAC.ts**
   - Appointment-specific RBAC middleware
   - Role mapping and permission checking
   - Ownership verification for appointments
   - Feature access control based on subscription

2. **backend/src/middlewares/followUpRBAC.ts**
   - Follow-up task-specific RBAC middleware
   - Role mapping and permission checking
   - Ownership verification for follow-up tasks
   - Data filtering for pharmacists

### Test Files
3. **backend/src/__tests__/middlewares/appointmentRBAC.test.ts**
   - Comprehensive unit tests for appointment RBAC
   - Tests for all permission scenarios
   - Tests for ownership and feature access

4. **backend/src/__tests__/middlewares/followUpRBAC.test.ts**
   - Comprehensive unit tests for follow-up RBAC
   - Tests for all permission scenarios
   - Tests for data filtering

## Permission Matrix Updates

### Appointment Permissions
Added to `backend/src/config/permissionMatrix.ts`:
- `appointment.create` - Create new appointments
- `appointment.read` - View appointments
- `appointment.update` - Modify appointments
- `appointment.delete` - Delete appointments
- `appointment.reschedule` - Reschedule appointments
- `appointment.cancel` - Cancel appointments
- `appointment.confirm` - Confirm appointments
- `appointment.complete` - Mark appointments as complete
- `appointment.manage` - Full appointment management
- `appointment.calendar_view` - View calendar
- `appointment.available_slots` - View available time slots
- `appointment.analytics` - View appointment analytics

### Follow-up Permissions
- `followup.create` - Create follow-up tasks
- `followup.read` - View follow-up tasks
- `followup.update` - Modify follow-up tasks
- `followup.delete` - Delete follow-up tasks
- `followup.complete` - Complete follow-up tasks
- `followup.escalate` - Escalate task priority
- `followup.convert_to_appointment` - Convert task to appointment
- `followup.assign` - Assign tasks to team members
- `followup.manage` - Full follow-up management
- `followup.analytics` - View follow-up analytics

### Schedule Permissions
- `schedule.create` - Create schedules
- `schedule.read` - View schedules
- `schedule.update` - Modify schedules
- `schedule.delete` - Delete schedules
- `schedule.time_off_request` - Request time off
- `schedule.time_off_approve` - Approve time off requests
- `schedule.capacity_view` - View capacity reports

### Reminder Permissions
- `reminder.create` - Create reminders
- `reminder.read` - View reminders
- `reminder.send` - Send manual reminders
- `reminder.template_manage` - Manage reminder templates
- `reminder.analytics` - View reminder analytics

## Role Definitions

### Appointment Management Roles
```typescript
owner: ['create', 'read', 'update', 'delete', 'manage', 'reschedule', 'cancel', 'confirm', 'complete']
pharmacist: ['create', 'read', 'update', 'reschedule', 'cancel', 'confirm', 'complete']
technician: ['read']
assistant: ['read']
admin: ['create', 'read', 'update', 'delete', 'manage', 'reschedule', 'cancel', 'confirm', 'complete']
```

### Follow-up Management Roles
```typescript
owner: ['create', 'read', 'update', 'delete', 'manage', 'assign', 'complete', 'escalate', 'convert_to_appointment']
pharmacist: ['create', 'read', 'update', 'complete', 'escalate', 'convert_to_appointment']
technician: ['read']
assistant: ['read']
admin: ['create', 'read', 'update', 'delete', 'manage', 'assign', 'complete', 'escalate', 'convert_to_appointment']
```

## Key Features

### 1. Role-Based Access Control
- Granular permissions for each action
- Role hierarchy (Owner > Pharmacist > Technician > Assistant)
- Super admin bypass for all checks

### 2. Ownership Verification
- Pharmacists can only access appointments/tasks assigned to them or created by them
- Owners and super admins can access all records
- Workspace isolation enforced

### 3. Feature-Based Access Control
- Checks subscription plan for feature availability
- Validates subscription status (active, trial, past_due)
- Returns upgrade information when features not available

### 4. Data Filtering
- Automatic filtering of follow-up tasks for pharmacists
- Only shows tasks assigned to or created by the user
- Owners and admins see all tasks

### 5. Security Features
- Workspace isolation (users only see data from their workspace)
- Comprehensive audit logging for permission denials
- Detailed error messages with context
- Protection against cross-workspace access

## Route Integration

### Updated Routes
1. **backend/src/routes/appointmentRoutes.ts**
   - Added `authWithWorkspace` middleware
   - Added `checkAppointmentFeatureAccess` middleware
   - Added `checkAppointmentOwnership` for specific appointment routes
   - Updated all routes with appropriate RBAC checks

2. **backend/src/routes/followUpRoutes.ts**
   - Added `authWithWorkspace` middleware
   - Added `checkFollowUpFeatureAccess` middleware
   - Added `checkFollowUpOwnership` for specific follow-up routes
   - Added `applyFollowUpDataFiltering` for list routes
   - Updated all routes with appropriate RBAC checks

3. **backend/src/routes/scheduleRoutes.ts**
   - Added `authWithWorkspace` middleware
   - Updated permission checks for schedule operations

## Middleware Functions

### Appointment RBAC
```typescript
// Permission checking
requireAppointmentPermission(action: AppointmentManagementAction)
requireAppointmentRead
requireAppointmentCreate
requireAppointmentUpdate
requireAppointmentDelete
requireAppointmentReschedule
requireAppointmentCancel
requireAppointmentConfirm
requireAppointmentComplete
requireAppointmentManage

// Ownership and access control
checkAppointmentOwnership
checkAppointmentFeatureAccess

// Utility functions
hasAppointmentPermission(userRole, workplaceRole, action)
```

### Follow-up RBAC
```typescript
// Permission checking
requireFollowUpPermission(action: FollowUpManagementAction)
requireFollowUpRead
requireFollowUpCreate
requireFollowUpUpdate
requireFollowUpDelete
requireFollowUpComplete
requireFollowUpEscalate
requireFollowUpConvert
requireFollowUpAssign
requireFollowUpManage

// Ownership and access control
checkFollowUpOwnership
checkFollowUpFeatureAccess
applyFollowUpDataFiltering

// Utility functions
hasFollowUpPermission(userRole, workplaceRole, action)
```

## Testing

### Test Coverage
- Permission checking for all roles
- Role mapping from system roles to module roles
- Ownership verification scenarios
- Feature access control
- Data filtering for pharmacists
- Error scenarios (missing auth, workspace mismatch, etc.)
- Super admin bypass
- Subscription status validation

### Running Tests
```bash
cd backend
npm test -- appointmentRBAC.test.ts
npm test -- followUpRBAC.test.ts
```

## Usage Examples

### In Controllers
```typescript
// Access role information
const appointmentRole = req.appointmentRole; // 'owner' | 'pharmacist' | 'technician' | 'assistant'
const canManage = req.canManageAppointments; // boolean

// Access pre-loaded appointment (from checkAppointmentOwnership)
const appointment = req.appointment;

// Access follow-up filter (from applyFollowUpDataFiltering)
const filter = req.followUpFilter; // { $or: [{ assignedTo: userId }, { createdBy: userId }] }
```

### In Routes
```typescript
// Appointment route with full RBAC
router.get(
  '/:id',
  requireAppointmentRead,
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentParamsSchema, 'params'),
  checkAppointmentOwnership,
  getAppointment
);

// Follow-up route with data filtering
router.get(
  '/',
  requireFollowUpRead,
  requireDynamicPermission('followup.read'),
  validateRequest(followUpQuerySchema, 'query'),
  applyFollowUpDataFiltering,
  getFollowUps
);
```

## Error Responses

### Permission Denied
```json
{
  "success": false,
  "message": "Insufficient permissions for this action",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": "delete",
  "userRole": "pharmacist"
}
```

### Feature Not Available
```json
{
  "success": false,
  "message": "Appointment scheduling feature not available in your plan",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "appointmentScheduling",
  "upgradeRequired": true,
  "currentPlan": "Basic Plan"
}
```

### Not Assigned
```json
{
  "success": false,
  "message": "You can only access appointments assigned to you",
  "code": "NOT_ASSIGNED"
}
```

### Workspace Mismatch
```json
{
  "success": false,
  "message": "Access denied to this appointment",
  "code": "WORKSPACE_MISMATCH"
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:
- **Requirement 1.5**: Role-based access control for appointments
- **Requirement 1.7**: Permission checks for appointment operations
- **Requirement 3.2**: Role-based access control for follow-up tasks
- **Requirement 8.1**: Schedule management permissions
- **Requirement 8.2**: Capacity management access control

## Next Steps

1. Run integration tests with actual API endpoints
2. Test with different user roles in development environment
3. Verify subscription plan feature checks
4. Test workspace isolation with multiple workspaces
5. Validate audit logging for permission denials
6. Performance test with large datasets

## Notes

- All middleware follows existing RBAC patterns in the codebase
- Super admin always bypasses all permission checks
- Workspace context is required for all routes (enforced by authWithWorkspace)
- Feature access is tied to subscription plans
- Pharmacists have restricted access to only their assigned records
- Comprehensive error messages help with debugging and user feedback
