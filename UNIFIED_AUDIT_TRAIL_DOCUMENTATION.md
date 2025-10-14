# Unified Audit Trail Implementation

## Overview

This document provides comprehensive information about the Unified Audit Trail module implemented for the PharmaCare SaaS application.

## Purpose

The Unified Audit Trail module provides super administrators with complete visibility into ALL activities occurring across the application, ensuring:
- **HIPAA Compliance**: Track all access to Protected Health Information (PHI)
- **Security Monitoring**: Detect and investigate suspicious activities
- **User Accountability**: Know who did what, when, and where
- **Operational Insights**: Understand system usage patterns
- **Regulatory Auditing**: Generate compliance reports for regulators

## Architecture

### Backend Components

#### 1. UnifiedAuditLog Model (`backend/src/models/UnifiedAuditLog.ts`)
Centralized audit log storage with comprehensive indexing:

**Key Fields:**
- `userDetails`: Populated user information (name, email, role) - no MongoDB IDs
- `workplaceDetails`: Populated workplace information
- `activityType`: Categorization of activity (authentication, patient_management, etc.)
- `action`: Specific action performed (USER_LOGIN, PATIENT_CREATED, etc.)
- `description`: Human-readable activity description
- `targetEntity`: What was affected (entity type, ID, name)
- `changes`: Before/after values for audited changes
- `riskLevel`: low, medium, high, critical
- `complianceCategory`: HIPAA, SOX, GDPR, PCI_DSS, GENERAL
- `metadata`: Additional contextual information
- `ipAddress`, `userAgent`, `location`: Request context
- `flagged`, `reviewedBy`, `reviewNotes`: Review workflow

**Performance Optimizations:**
- Compound indexes on frequently queried fields
- Text search index for full-text search
- Pre-save hook to auto-populate user/workplace details

#### 2. UnifiedAuditService (`backend/src/services/unifiedAuditService.ts`)
Central service for all audit operations:

**Methods:**
- `logActivity()`: Log any activity with automatic user/workplace population
- `getAuditTrail()`: Retrieve logs with advanced filtering
- `getActivityStats()`: Generate statistics and analytics
- `getUserActivityTimeline()`: Get all activities for a specific user
- `getEntityActivityHistory()`: Get all activities for a specific entity
- `exportAuditData()`: Export logs in JSON or CSV format
- `flagAuditEntry()`: Flag entries for review
- `reviewAuditEntry()`: Add review notes to entries
- `searchAuditLogs()`: Full-text search across logs

**Auto-calculated Fields:**
- Risk level based on action type
- Compliance category based on activity
- IP address extraction from request

#### 3. SuperAdminAuditController (`backend/src/controllers/superAdminAuditController.ts`)
REST API endpoints for super admins:

**Endpoints:**
- `GET /api/super-admin/audit-trail` - Get audit trail with filters
- `GET /api/super-admin/audit-trail/stats` - Get statistics
- `GET /api/super-admin/audit-trail/export` - Export data (JSON/CSV)
- `GET /api/super-admin/audit-trail/users/:userId` - User timeline
- `GET /api/super-admin/audit-trail/entities/:entityType/:entityId` - Entity history
- `GET /api/super-admin/audit-trail/search` - Search logs
- `PUT /api/super-admin/audit-trail/:auditId/flag` - Flag for review
- `PUT /api/super-admin/audit-trail/:auditId/review` - Add review notes
- `GET /api/super-admin/audit-trail/activity-types` - Get activity types
- `GET /api/super-admin/audit-trail/risk-levels` - Get risk levels

#### 4. UnifiedAuditMiddleware (`backend/src/middlewares/unifiedAuditMiddleware.ts`)
Automatic activity logging middleware:

**Features:**
- Intercepts responses to log activities after completion
- Maps routes to activity types and actions
- Extracts entity information from request paths
- Generates human-readable descriptions
- Sanitizes sensitive data (passwords, tokens, etc.)
- Non-blocking async logging (doesn't slow down requests)

**Automatically Logs:**
- Authentication (login, logout, registration)
- User management (approve, reject, suspend, delete)
- Patient operations (create, update, view, delete)
- Medication changes (prescribe, update, delete)
- MTR sessions
- Clinical interventions
- Communication activities
- Workspace management
- System configuration changes
- Data exports

### Frontend Components

#### 1. SuperAdminAuditTrail Page (`frontend/src/pages/SuperAdminAuditTrail.tsx`)
Main audit trail dashboard:

**Features:**
- Real-time activity feed
- Advanced filtering (date range, activity type, risk level, etc.)
- Search functionality
- Statistics dashboard
- Export to CSV/JSON
- Activity flagging and review
- Pagination

#### 2. ActivityCard Component (`frontend/src/components/audit/ActivityCard.tsx`)
Individual activity display:

**Shows:**
- User avatar, name, email, role
- Activity description in plain English
- Target entity information
- Activity type, risk level, compliance category chips
- Timestamp (relative and absolute)
- IP address and location
- Expandable details (request info, changes, metadata, errors)
- Flag/unflag button
- Review notes (if reviewed)

#### 3. AuditFilters Component (`frontend/src/components/audit/AuditFilters.tsx`)
Advanced filtering interface:

**Filters:**
- Date range (start/end)
- Activity type dropdown
- Risk level dropdown
- Success status
- Flagged status
- Compliance category
- Search query (full-text)
- User ID (advanced)
- Workplace ID (advanced)
- Items per page

#### 4. AuditStats Component (`frontend/src/components/audit/AuditStats.tsx`)
Statistics dashboard:

**Displays:**
- Total activities count
- Failed activities count with failure rate
- Flagged activities count
- Critical events count
- Activity distribution by type
- Most active users
- Risk level distribution

#### 5. SuperAdminAuditService (`frontend/src/services/superAdminAuditService.ts`)
API client for audit operations:

**Methods:**
- All CRUD operations for audit logs
- Export with automatic file download
- TypeScript interfaces for type safety

## Data Migration

The migration script (`backend/src/scripts/migrateExistingAuditLogs.ts`) migrates existing audit logs from:

1. **WorkspaceAuditLog** - Workspace team management activities
2. **SecurityAuditLog** - Security and authentication events  
3. **MTRAuditLog** - Medication Therapy Review activities
4. **CommunicationAuditLog** - Communication hub activities

**Usage:**
```bash
cd backend
npx ts-node src/scripts/migrateExistingAuditLogs.ts
```

**Features:**
- Checks for duplicates before inserting
- Populates user/workplace details
- Maps activity types appropriately
- Provides migration statistics

## Access Control

**Visibility:** Only `super_admin` role
**Sidebar:** Audit Trail link appears only for super admins
**Routes:** All routes protected with `requireSuperAdmin` middleware
**Controller:** Every endpoint validates super_admin role

## Compliance Features

### HIPAA Compliance
- Logs all PHI access (patient views, updates)
- Tracks who accessed what patient data
- Records IP addresses and timestamps
- Immutable audit trail (no deletion)
- Export capability for audits

### SOX Compliance
- Financial transaction logging
- Subscription changes tracked
- Change history with before/after values

### GDPR Compliance
- Data export activities logged
- User deletion tracked
- Consent tracking capability

### PCI DSS Compliance
- Payment transaction logging
- Cardholder data access tracking

## Performance Considerations

### Database Indexes
Multiple compound indexes for fast queries:
```javascript
- { timestamp: -1 } // Recent activities
- { userId: 1, timestamp: -1 } // User activities
- { workplaceId: 1, timestamp: -1 } // Workplace activities
- { activityType: 1, timestamp: -1 } // Type filtering
- { riskLevel: 1, timestamp: -1 } // Risk monitoring
- Text index on description, userDetails fields
```

### Caching Strategy
- Frontend caches activity types and risk levels
- Statistics can be cached with short TTL (5 minutes)
- Recent logs cached for dashboard view

### Async Logging
- Middleware uses `setImmediate()` for non-blocking logging
- Does not slow down API responses
- Failed audit logging does not crash requests

## Security Features

### Data Protection
- Sensitive fields automatically sanitized (passwords, tokens)
- PHI access logged but content not stored in audit log
- IP addresses and user agents captured
- Geographic location tracking

### Anomaly Detection
- Risk levels auto-calculated
- Critical events highlighted
- Failed activity tracking
- Flagging system for suspicious activities

### Review Workflow
- Super admins can flag entries
- Review notes capability
- Timestamp of reviews tracked
- Reviewer identity recorded

## UI/UX Features

### User-Friendly Display
- Real names instead of MongoDB IDs
- Relative timestamps ("2 hours ago")
- Color-coded risk levels
- Activity type badges
- Success/failure indicators

### Advanced Search
- Full-text search across descriptions, names, emails
- Date range filtering
- Multiple filter combinations
- Saved filter states

### Export Functionality
- CSV format for spreadsheet analysis
- JSON format for programmatic processing
- Filtered exports (only what you see)
- Automatic filename with timestamp

## Activity Types

The system tracks 21 activity categories:
- `authentication` - Login, logout, registration
- `authorization` - Permission changes
- `user_management` - User CRUD operations
- `patient_management` - Patient data access/changes
- `medication_management` - Prescriptions, changes
- `mtr_session` - MTR reviews
- `clinical_intervention` - Interventions
- `communication` - Messages, conversations
- `workspace_management` - Team operations
- `security_event` - Security incidents
- `system_configuration` - Settings changes
- `file_operation` - Uploads, downloads
- `report_generation` - Report creation
- `audit_export` - Data exports
- `diagnostic_ai` - AI diagnostic usage
- `subscription_management` - Plan changes
- `payment_transaction` - Payments
- `compliance_event` - Compliance activities
- `data_export` - PHI exports
- `data_import` - Data imports
- `other` - Miscellaneous

## Risk Levels

- **Low**: Normal operations (view, list)
- **Medium**: Create, update operations
- **High**: Suspend, role changes, exports
- **Critical**: Delete, security breaches, unauthorized access

## Testing

### Backend Tests
```bash
cd backend
npm test -- --testPathPattern=unifiedAudit
```

### Frontend Tests
```bash
cd frontend
npm test -- --testPathPattern=SuperAdminAuditTrail
```

### Integration Tests
1. Login as super admin
2. Navigate to Audit Trail
3. Verify all filters work
4. Test export functionality
5. Flag and review entries
6. Search for activities

## Maintenance

### Data Retention
- Consider archiving logs older than 7 years
- Implement log rotation for performance
- Regular index maintenance

### Performance Monitoring
- Monitor query performance
- Check index usage
- Optimize slow queries
- Scale database as needed

### Regular Reviews
- Review critical events weekly
- Investigate flagged entries
- Analyze failed activities
- Generate compliance reports monthly

## Future Enhancements

1. **Real-time Notifications**
   - WebSocket for live updates
   - Push notifications for critical events
   
2. **Advanced Analytics**
   - Anomaly detection ML models
   - Predictive security alerts
   - Usage pattern analysis
   
3. **Enhanced Visualizations**
   - Activity heatmaps
   - Geographic distribution maps
   - Timeline visualizations
   
4. **Automated Compliance Reports**
   - Scheduled report generation
   - PDF compliance certificates
   - Email delivery

5. **Retention Policies**
   - Automatic archival
   - Compliance-based retention
   - Storage optimization

## Troubleshooting

### Common Issues

**Issue: Logs not appearing**
- Check if unifiedAuditMiddleware is registered in app.ts
- Verify user role is super_admin
- Check backend logs for errors

**Issue: Export fails**
- Verify json2csv package is installed
- Check browser console for errors
- Verify export endpoint permissions

**Issue: Slow performance**
- Check database indexes
- Monitor query execution time
- Consider pagination limits
- Review filter complexity

**Issue: Missing user details**
- Check pre-save hook in model
- Verify user still exists
- Check population logic

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console
4. Contact development team

## Version History

- **v1.0.0** (October 14, 2025)
  - Initial implementation
  - Full audit trail system
  - Frontend dashboard
  - Migration scripts
  - Complete documentation
