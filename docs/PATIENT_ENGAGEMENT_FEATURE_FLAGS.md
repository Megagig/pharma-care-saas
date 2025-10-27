# Patient Engagement Feature Flags Implementation

## Overview

This document describes the implementation of feature flags for the Patient Engagement & Follow-up Management module, enabling gradual rollout and controlled deployment of new features.

## Feature Flag Architecture

### Backend Implementation

#### 1. Feature Flag Middleware (`patientEngagementFeatureFlags.ts`)

The middleware provides:
- **Feature Flag Checks**: Validates if specific features are enabled for users/workspaces
- **Gradual Rollout**: Supports percentage-based rollouts (0% to 100%)
- **User Consistency**: Same user always gets the same result based on ID hash
- **Multiple Check Types**: Single feature, any feature (OR), all features (AND)
- **Service Layer Integration**: Utility functions for checking flags in services

#### 2. Route Protection

All patient engagement routes are protected with feature flags:

```typescript
// Core module check (required for all features)
router.use(requirePatientEngagementModule);

// Specific feature checks
router.get('/appointments', requireAppointmentScheduling, ...);
router.get('/follow-ups', requireFollowUpManagement, ...);
router.get('/reminders', requireReminderSystem, ...);
```

#### 3. Feature Flag Keys

```typescript
const PATIENT_ENGAGEMENT_FLAGS = {
  MODULE: 'patient_engagement_module',           // Core module
  APPOINTMENTS: 'appointment_scheduling',        // Appointment scheduling
  FOLLOW_UPS: 'followup_task_management',       // Follow-up management
  REMINDERS: 'smart_reminder_system',           // Reminder system
  PATIENT_PORTAL: 'patient_portal',             // Patient self-service
  RECURRING_APPOINTMENTS: 'recurring_appointments', // Recurring appointments
  CLINICAL_ALERTS: 'clinical_alerts',           // Clinical alerts
  ANALYTICS: 'engagement_analytics',            // Analytics & reporting
  SCHEDULE_MANAGEMENT: 'schedule_management',   // Schedule management
  MODULE_INTEGRATION: 'engagement_module_integration' // Module integration
};
```

### Frontend Implementation

#### 1. React Hook (`usePatientEngagementFeatures.ts`)

Provides easy access to feature flags in React components:

```typescript
const {
  isModuleEnabled,
  canScheduleAppointments,
  canManageFollowUps,
  canUseReminders,
  // ... other features
  isFeatureEnabled,
  getFeatureEvaluation
} = usePatientEngagementFeatures();
```

#### 2. Feature Guard Component

Conditional rendering based on feature availability:

```typescript
<PatientEngagementFeatureGuard 
  requiredFeatures={['appointment_scheduling']}
  fallback={<FeatureNotAvailable />}
>
  <AppointmentCalendar />
</PatientEngagementFeatureGuard>
```

#### 3. Management UI (`PatientEngagementFeatureFlags.tsx`)

Admin interface for managing feature rollouts:
- **Toggle Features**: Enable/disable features
- **Configure Rollout**: Set rollout percentages (0%, 10%, 25%, 50%, 100%)
- **Monitor Usage**: View usage metrics and user counts
- **Rollout Stages**: Visual indicators for rollout progress

## Feature Flag Configuration

### 1. Initial Setup

Run the setup script to create all feature flags:

```bash
cd backend
npx ts-node scripts/createPatientEngagementFeatureFlags.ts
```

This creates 10 feature flags, all initially disabled (0% rollout).

### 2. Feature Flag Properties

Each feature flag includes:

```typescript
{
  name: "Patient Engagement Module",
  key: "patient_engagement_module",
  description: "Enable the complete Patient Engagement & Follow-up Management module",
  isActive: false,                    // Master enable/disable
  allowedTiers: ["premium", "enterprise"],
  allowedRoles: ["pharmacist", "pharmacy_manager", "admin"],
  targetingRules: {
    percentage: 0,                    // Rollout percentage (0-100)
    conditions: {
      dateRange: {
        startDate: "2025-01-01",
        endDate: "2025-12-31"
      }
    }
  },
  metadata: {
    category: "patient_engagement",
    priority: "high",
    tags: ["appointments", "follow-ups", "patient-care"],
    marketingDescription: "Complete appointment scheduling and follow-up management system",
    isMarketingFeature: true
  }
}
```

## Gradual Rollout Strategy

### Recommended Rollout Stages

1. **Beta Testing (10%)**
   - Internal testing with selected users
   - Monitor for critical issues
   - Gather initial feedback

2. **Limited Rollout (25%)**
   - Expand to trusted customers
   - Monitor performance metrics
   - Validate core functionality

3. **Gradual Rollout (50%)**
   - Wider deployment
   - Monitor system load
   - Collect usage analytics

4. **Full Rollout (100%)**
   - Enable for all eligible users
   - Monitor adoption rates
   - Provide user support

### Rollout Controls

#### Via Admin UI:
1. Navigate to Admin Dashboard
2. Open "Patient Engagement Feature Flags"
3. Select feature to configure
4. Adjust rollout percentage
5. Monitor usage metrics

#### Via API:
```typescript
// Update rollout percentage
await featureFlagService.updateFeatureFlag(flagId, {
  targetingRules: {
    percentage: 25  // 25% rollout
  }
});
```

## Testing Rollout

### 1. Rollout Distribution Test

```bash
cd backend
npx ts-node scripts/testPatientEngagementRollout.ts
```

This script:
- Tests rollout percentages (0%, 10%, 25%, 50%, 100%)
- Verifies user distribution consistency
- Validates percentile calculations
- Tests workspace isolation
- Measures performance

### 2. Expected Results

- **Distribution Accuracy**: ±5% variance from target percentage
- **User Consistency**: Same user always gets same result
- **Performance**: <10ms average evaluation time
- **Workspace Isolation**: Similar distribution across workspaces

## Feature Dependencies

### Core Dependencies

```
patient_engagement_module (REQUIRED)
├── appointment_scheduling
├── followup_task_management
├── smart_reminder_system
├── patient_portal
├── recurring_appointments (depends on appointment_scheduling)
├── clinical_alerts
├── engagement_analytics
├── schedule_management
└── engagement_module_integration
```

### Recommended Enablement Order

1. **Core Module** (`patient_engagement_module`) - Must be enabled first
2. **Appointments** (`appointment_scheduling`) - Core functionality
3. **Follow-ups** (`followup_task_management`) - Core functionality
4. **Reminders** (`smart_reminder_system`) - Enhances appointments
5. **Integration** (`engagement_module_integration`) - Links to existing modules
6. **Additional Features** - Portal, analytics, etc.

## Monitoring and Metrics

### Key Metrics to Monitor

1. **Rollout Metrics**
   - Users in rollout vs. total eligible users
   - Feature adoption rate
   - Error rates during rollout

2. **Usage Metrics**
   - Active users per feature
   - Feature utilization rates
   - User engagement levels

3. **Performance Metrics**
   - Feature flag evaluation time
   - API response times
   - System resource usage

### Monitoring Dashboard

The admin UI provides:
- Real-time rollout status
- Usage statistics
- Error rate monitoring
- Rollout progress visualization

## Error Handling

### Feature Flag Failures

When feature flag evaluation fails:
- **Fail Safe**: Features are disabled by default
- **Logging**: All failures are logged with context
- **User Experience**: Graceful degradation with appropriate messages

### Rollback Procedures

If issues are detected:
1. **Immediate**: Set rollout percentage to 0%
2. **Partial**: Reduce rollout percentage (e.g., 50% → 25%)
3. **Complete**: Disable feature entirely (`isActive: false`)

## API Integration

### Checking Features in Controllers

```typescript
// Single feature check
router.get('/appointments', requireAppointmentScheduling, controller.getAppointments);

// Multiple features (OR logic)
router.get('/dashboard', requireAnyFeature(['appointments', 'follow_ups']), controller.getDashboard);

// Multiple features (AND logic)
router.get('/analytics', requireAllFeatures(['appointments', 'analytics']), controller.getAnalytics);
```

### Checking Features in Services

```typescript
import { isPatientEngagementFeatureEnabled } from '../middlewares/patientEngagementFeatureFlags';

const canCreateAppointment = await isPatientEngagementFeatureEnabled(
  'appointment_scheduling',
  userId,
  workspaceId
);

if (canCreateAppointment) {
  // Create appointment logic
}
```

## Security Considerations

### Access Control

- Feature flags respect existing RBAC permissions
- Tier-based access control (premium/enterprise features)
- Workspace isolation maintained
- Audit logging for all feature flag changes

### Data Protection

- No sensitive data in feature flag configurations
- User percentiles calculated from hashed IDs
- Consistent user experience across sessions

## Troubleshooting

### Common Issues

1. **Feature Not Available**
   - Check if core module is enabled
   - Verify user tier and role permissions
   - Check rollout percentage

2. **Inconsistent Behavior**
   - Clear feature flag cache
   - Verify user ID consistency
   - Check workspace context

3. **Performance Issues**
   - Monitor evaluation times
   - Check cache hit rates
   - Verify database indexes

### Debug Commands

```bash
# Test specific feature for user
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/feature-flags/check?feature=appointment_scheduling&userId=123&workspaceId=456"

# Get rollout metrics
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/feature-flags/patient-engagement/metrics"
```

## Best Practices

### Development

1. **Always Check Core Module First**: All features depend on the main module
2. **Use Feature Guards**: Wrap UI components with feature checks
3. **Graceful Degradation**: Provide fallbacks when features are disabled
4. **Test All Rollout Stages**: Verify functionality at each percentage

### Deployment

1. **Start Small**: Begin with 10% rollout for new features
2. **Monitor Closely**: Watch error rates and performance metrics
3. **Gradual Increase**: Increase rollout in stages (10% → 25% → 50% → 100%)
4. **Have Rollback Plan**: Be ready to reduce rollout if issues arise

### Operations

1. **Regular Monitoring**: Check feature usage and error rates
2. **User Feedback**: Collect feedback during rollout phases
3. **Documentation**: Keep rollout decisions documented
4. **Team Communication**: Coordinate rollout changes across teams

## Conclusion

The Patient Engagement feature flag system provides:
- **Safe Deployment**: Gradual rollout minimizes risk
- **User Consistency**: Reliable experience for each user
- **Easy Management**: Admin UI for non-technical rollout control
- **Performance**: Fast evaluation with caching
- **Flexibility**: Multiple rollout strategies and conditions

This implementation enables confident deployment of the Patient Engagement module with full control over feature availability and user experience.