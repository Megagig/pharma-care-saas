# PharmaCare SaaS - Feature Flags Inventory

**Generated:** November 10, 2025  
**Repository:** pharma-care-saas  
**Branch:** feature/Patient_Portal

---

## Overview

This document provides a comprehensive inventory of all feature flags used throughout the PharmaCare SaaS application. The application uses multiple feature flag systems for different purposes.

---

## Feature Flag Systems

### 1. Database-Driven Feature Flags (Subscription-Based)
**Location:** MongoDB `FeatureFlag` collection  
**Model:** `backend/src/models/FeatureFlag.ts`  
**Management UI:** `/admin/feature-management`  
**Setup Scripts:** 
- `backend/scripts/setupFeatureFlags.ts`
- `backend/scripts/seedFeatureFlags.ts`

These flags are tied to subscription tiers and user roles, controlling access to features based on the user's plan.

---

## Database Feature Flags List

### Core Features

#### 1. **patient_management**
- **Name:** Patient Management
- **Description:** Create, view, and manage patient records
- **Allowed Tiers:** free_trial, basic, pro, pharmily, network, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, owner
- **Status:** Active
- **Category:** core
- **Priority:** critical/high

#### 2. **medication_management**
- **Name:** Medication Management
- **Description:** Core functionality for managing medication records and inventory
- **Allowed Tiers:** free_trial, basic, pro, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet
- **Status:** Active
- **Category:** core
- **Priority:** critical

#### 3. **basic_clinical_notes**
- **Name:** Basic Clinical Notes
- **Description:** Basic clinical note creation and management
- **Allowed Tiers:** free_trial, basic, pro, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, intern_pharmacist
- **Status:** Active
- **Category:** core
- **Priority:** high

#### 4. **clinical_decision_support**
- **Name:** Clinical Decision Support
- **Description:** AI-powered diagnostic analysis and clinical recommendations
- **Allowed Tiers:** free_trial, basic, pro, pharmily, network, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, owner
- **Status:** Active
- **Category:** ai/core
- **Priority:** high
- **Custom Rules:** `requiredLicense: true`

#### 5. **drug_information**
- **Name:** Drug Information
- **Description:** Comprehensive drug database and interaction checking
- **Allowed Tiers:** free_trial, basic, pro, pharmily, network, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, owner, intern_pharmacist
- **Status:** Active
- **Category:** clinical
- **Priority:** high

#### 6. **ai_diagnostics**
- **Name:** AI Diagnostics
- **Description:** Advanced AI-powered diagnostic capabilities
- **Allowed Tiers:** free_trial, basic, pro, pharmily, network, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, owner
- **Status:** Active
- **Category:** ai
- **Priority:** critical
- **Custom Rules:** `requiredLicense: true`

---

### Analytics Features

#### 7. **basic_reports**
- **Name:** Basic Reports
- **Description:** Access to basic system reports and analytics
- **Allowed Tiers:** basic, pro, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet
- **Status:** Active
- **Category:** analytics
- **Priority:** medium

#### 8. **advanced_analytics**
- **Name:** Advanced Analytics
- **Description:** Detailed analytics and reporting capabilities / Advanced business intelligence dashboards
- **Allowed Tiers:** pro, pharmily, network, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet, owner
- **Status:** Active
- **Category:** analytics
- **Priority:** medium/high

#### 9. **predictive_analytics**
- **Name:** Predictive Analytics
- **Description:** AI-powered predictive analytics for business forecasting
- **Allowed Tiers:** enterprise
- **Allowed Roles:** pharmacy_outlet
- **Status:** Active
- **Category:** analytics
- **Priority:** medium

---

### Collaboration Features

#### 10. **user_management**
- **Name:** User Management
- **Description:** Manage team members and user permissions
- **Allowed Tiers:** basic, pro, pharmily, network, enterprise
- **Allowed Roles:** owner, pharmacy_outlet
- **Status:** Active
- **Category:** management
- **Priority:** medium

#### 11. **team_management**
- **Name:** Team Management
- **Description:** Create and manage pharmacy team members
- **Allowed Tiers:** pro, enterprise
- **Allowed Roles:** pharmacy_team, pharmacy_outlet
- **Status:** Active
- **Category:** collaboration
- **Priority:** high
- **Custom Rules:** `maxUsers: 10`

#### 12. **role_management**
- **Name:** Role Management
- **Description:** Advanced role and permission management
- **Allowed Tiers:** enterprise
- **Allowed Roles:** pharmacy_outlet
- **Status:** Active
- **Category:** collaboration
- **Priority:** medium

#### 13. **pharmacy_network**
- **Name:** Pharmacy Network
- **Description:** Connect and collaborate with other pharmacies
- **Allowed Tiers:** enterprise
- **Allowed Roles:** pharmacy_outlet
- **Status:** Inactive (Feature not yet active)
- **Category:** collaboration
- **Priority:** low

---

### Location Management

#### 14. **multi_location**
- **Name:** Multi-Location Management
- **Description:** Manage multiple pharmacy locations
- **Allowed Tiers:** pharmily, network, enterprise
- **Allowed Roles:** owner, pharmacy_outlet
- **Status:** Active
- **Category:** management
- **Priority:** medium

---

### Integration Features

#### 15. **api_access**
- **Name:** API Access
- **Description:** Access to REST API for integrations / API endpoints for external integrations
- **Allowed Tiers:** pro, pharmily, network, enterprise
- **Allowed Roles:** owner, pharmacy_outlet
- **Status:** Active
- **Category:** integration
- **Priority:** low/medium

#### 16. **health_system_integration**
- **Name:** Health System Integration
- **Description:** Integration with external healthcare systems
- **Allowed Tiers:** enterprise
- **Allowed Roles:** pharmacy_outlet
- **Status:** Active
- **Category:** integration
- **Priority:** high

---

### Compliance Features

#### 17. **compliance_tracking**
- **Name:** Compliance Tracking
- **Description:** Track regulatory compliance requirements
- **Allowed Tiers:** pro, enterprise
- **Allowed Roles:** pharmacist, pharmacy_team, pharmacy_outlet
- **Status:** Active
- **Category:** compliance
- **Priority:** high
- **Custom Rules:** `requiredLicense: true`

#### 18. **audit_logs**
- **Name:** Audit Logs
- **Description:** Detailed audit logs for compliance and security
- **Allowed Tiers:** pro, enterprise
- **Allowed Roles:** pharmacy_team, pharmacy_outlet
- **Status:** Active
- **Category:** compliance
- **Priority:** high

---

### Administration Features

#### 19. **feature_flag_management**
- **Name:** Feature Flag Management
- **Description:** Manage and control system feature flags
- **Allowed Tiers:** enterprise
- **Allowed Roles:** super_admin
- **Status:** Active
- **Category:** administration
- **Priority:** medium

#### 20. **system_settings**
- **Name:** System Settings
- **Description:** Control system-wide configuration and settings
- **Allowed Tiers:** enterprise
- **Allowed Roles:** super_admin
- **Status:** Active
- **Category:** administration
- **Priority:** high

---

## Clinical Interventions Module Flags

**Location:** `backend/src/utils/featureFlags.ts`  
**Managed By:** FeatureFlagManager class

These flags control specific features within the Clinical Interventions module:

### 21. **clinical_interventions_enabled**
- **Description:** Enable Clinical Interventions module
- **Default:** Based on config.featureFlags.enableClinicalInterventions
- **Rollout Percentage:** 100%
- **Category:** core
- **Module:** clinical_interventions

### 22. **advanced_reporting_enabled**
- **Description:** Enable advanced reporting features
- **Default:** Based on config.featureFlags.enableAdvancedReporting
- **Rollout Percentage:** 100%
- **Category:** reporting
- **Module:** clinical_interventions

### 23. **bulk_operations_enabled**
- **Description:** Enable bulk operations for interventions
- **Default:** Based on config.featureFlags.enableBulkOperations
- **Rollout Percentage:** 0% (Start disabled)
- **Category:** operations
- **Module:** clinical_interventions

### 24. **mtr_integration_enabled**
- **Description:** Enable MTR integration features
- **Default:** Based on config.featureFlags.enableMTRIntegration
- **Rollout Percentage:** 100%
- **Category:** integration
- **Module:** clinical_interventions

### 25. **performance_monitoring_enabled**
- **Description:** Enable performance monitoring and metrics
- **Default:** Based on config.featureFlags.enablePerformanceMonitoring
- **Rollout Percentage:** 100%
- **Category:** monitoring
- **Module:** clinical_interventions

### 26. **export_features_enabled**
- **Description:** Enable data export features
- **Default:** Based on config.featureFlags.enableExportFeatures
- **Rollout Percentage:** 100%
- **Category:** export
- **Module:** clinical_interventions

### 27. **notifications_enabled**
- **Description:** Enable notification features
- **Default:** Based on config.featureFlags.enableNotifications
- **Rollout Percentage:** 100%
- **Category:** notifications
- **Module:** clinical_interventions

### 28. **audit_logging_enabled**
- **Description:** Enable comprehensive audit logging
- **Default:** Based on config.featureFlags.enableAuditLogging
- **Rollout Percentage:** 100%
- **Category:** security
- **Module:** clinical_interventions

### 29. **intervention_templates_enabled**
- **Description:** Enable intervention templates feature
- **Default:** false
- **Rollout Percentage:** 0%
- **Category:** templates
- **Module:** clinical_interventions
- **Status:** Experimental

### 30. **ai_recommendations_enabled**
- **Description:** Enable AI-powered intervention recommendations
- **Default:** false
- **Rollout Percentage:** 0%
- **Category:** ai
- **Module:** clinical_interventions
- **Conditions:** environment: ['staging', 'development']
- **Status:** Experimental

---

## Performance Feature Flags (Environment-Based)

**Location:** `backend/src/config/featureFlags.ts`  
**Configuration:** Environment variables in `.env` files

These flags control performance optimizations and are managed via environment variables:

### Core Performance Optimizations

#### 31. **themeOptimization**
- **Environment Variable:** FEATURE_THEME_OPTIMIZATION
- **Description:** Enables zero-flicker theme switching with inline scripts and CSS variables
- **Category:** core/frontend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

#### 32. **bundleOptimization**
- **Environment Variable:** FEATURE_BUNDLE_OPTIMIZATION
- **Description:** Enables code splitting, lazy loading, and bundle size optimizations
- **Category:** core/frontend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

#### 33. **apiCaching**
- **Environment Variable:** FEATURE_API_CACHING
- **Description:** Enables Redis-based API response caching for improved performance
- **Category:** backend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

#### 34. **databaseOptimization**
- **Environment Variable:** FEATURE_DATABASE_OPTIMIZATION
- **Description:** Enables optimized database indexes and query improvements
- **Category:** backend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

#### 35. **performanceMonitoring**
- **Environment Variable:** FEATURE_PERFORMANCE_MONITORING
- **Description:** Enables Web Vitals collection and performance monitoring
- **Category:** core
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### Advanced Performance Features

#### 36. **cursorPagination**
- **Environment Variable:** FEATURE_CURSOR_PAGINATION
- **Description:** Enables cursor-based pagination for better performance with large datasets
- **Category:** backend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false
- **Dependencies:** Requires databaseOptimization

#### 37. **backgroundJobs**
- **Environment Variable:** FEATURE_BACKGROUND_JOBS
- **Description:** Enables BullMQ background job processing for heavy operations
- **Category:** backend
- **Default (Dev):** false
- **Default (Staging):** true
- **Default (Production):** false
- **Dependencies:** Requires apiCaching

#### 38. **serviceWorker**
- **Environment Variable:** FEATURE_SERVICE_WORKER
- **Description:** Enables service worker for offline functionality and caching
- **Category:** frontend
- **Default (Dev):** false
- **Default (Staging):** true
- **Default (Production):** false

#### 39. **virtualization**
- **Environment Variable:** FEATURE_VIRTUALIZATION
- **Description:** Enables virtualized lists and tables for better performance with large datasets
- **Category:** frontend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

#### 40. **reactQueryOptimization**
- **Environment Variable:** FEATURE_REACT_QUERY_OPTIMIZATION
- **Description:** Enables optimized React Query configuration and caching strategies
- **Category:** frontend
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false

### Rollout Configuration

#### 41. **rolloutPercentage**
- **Environment Variable:** FEATURE_ROLLOUT_PERCENTAGE
- **Description:** Percentage of users to receive new features (0-100)
- **Default:** 0
- **Validation:** Must be between 0 and 100

#### 42. **internalTesting**
- **Environment Variable:** FEATURE_INTERNAL_TESTING
- **Description:** Enable features for internal testing
- **Default (Dev):** true
- **Default (Staging):** false
- **Default (Production):** false

#### 43. **betaUsers**
- **Environment Variable:** FEATURE_BETA_USERS
- **Description:** Enable features for beta users
- **Default (Dev):** false
- **Default (Staging):** true
- **Default (Production):** false

---

## Environment Configuration Feature Flags

**Location:** `backend/src/config/environments.ts`  
**Type:** Module-level feature toggles

These flags control major module features at the environment configuration level:

### 44. **enableClinicalInterventions**
- **Description:** Enable/disable entire Clinical Interventions module
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 45. **enableAdvancedReporting**
- **Description:** Enable/disable advanced reporting features
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 46. **enablePerformanceMonitoring**
- **Description:** Enable/disable performance monitoring
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 47. **enableAuditLogging**
- **Description:** Enable/disable comprehensive audit logging
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 48. **enableNotifications**
- **Description:** Enable/disable notification features
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 49. **enableMTRIntegration**
- **Description:** Enable/disable MTR integration
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

### 50. **enableBulkOperations**
- **Description:** Enable/disable bulk operations
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** false (Disabled initially)

### 51. **enableExportFeatures**
- **Description:** Enable/disable data export features
- **Type:** boolean
- **Default (Dev):** true
- **Default (Staging):** true
- **Default (Production):** true

---

## Patient Engagement Feature Flags

**Location:** Deployment documentation  
**Status:** Planned/In Development

### 52. **APPOINTMENT_SCHEDULING_ENABLED**
- **Description:** Enable appointment scheduling functionality
- **Module:** Patient Engagement

### 53. **FOLLOW_UP_MANAGEMENT_ENABLED**
- **Description:** Enable follow-up management features
- **Module:** Patient Engagement

### 54. **REMINDER_SYSTEM_ENABLED**
- **Description:** Enable reminder system
- **Module:** Patient Engagement

### 55. **PATIENT_PORTAL_ENABLED**
- **Description:** Enable patient portal access
- **Module:** Patient Engagement

### 56. **PATIENT_ENGAGEMENT_ENABLED**
- **Description:** Master toggle for patient engagement module
- **Module:** Patient Engagement

---

## Environment Variable Configuration

### Feature Flag Cache Settings
```bash
FEATURE_FLAGS_CACHE_TTL=300                    # Cache TTL in seconds
FEATURE_FLAGS_EVALUATION_TIMEOUT=100           # Evaluation timeout in ms
FEATURE_FLAGS_DEFAULT_ENABLED=false            # Default state for new flags
CACHE_TTL_FEATURE_FLAGS=300                    # Cache TTL for feature flags
```

### AI Diagnostics Settings
```bash
ENABLE_AI_DIAGNOSTICS=true                     # Enable AI diagnostics module
ENABLE_CLINICAL_DECISION_SUPPORT=true          # Enable clinical decision support
```

### Performance Monitoring
```bash
VITE_ENABLE_WEB_VITALS=true                    # Enable Web Vitals tracking
```

---

## Feature Flag Management

### API Endpoints

```
GET    /api/admin/feature-flags                # Get all feature flags
POST   /api/admin/feature-flags                # Create new feature flag
PUT    /api/admin/feature-flags/:id            # Update feature flag
DELETE /api/admin/feature-flags/:id            # Delete feature flag
PATCH  /api/admin/feature-flags/:id/toggle     # Toggle feature flag status
GET    /api/admin/feature-flags/category/:cat  # Get flags by category
GET    /api/admin/feature-flags/tier/:tier     # Get flags by tier
POST   /api/admin/feature-flags/tier/:tier/features  # Bulk update tier features
POST   /api/admin/feature-flags/sync           # Manual sync subscriptions
```

### Management UI

- **URL:** http://localhost:5173/admin/feature-management
- **Component:** `frontend/src/pages/FeatureManagement.tsx`
- **Service:** `frontend/src/services/featureFlagService.ts`

### Setup Scripts

```bash
# Setup initial feature flags
cd backend && npx ts-node scripts/setupFeatureFlags.ts

# Seed feature flags with test data
cd backend && npx ts-node scripts/seedFeatureFlags.ts
```

---

## Feature Flag Categories

### By Category
- **Core:** 11 flags (patient_management, medication_management, clinical features, etc.)
- **Analytics:** 3 flags (basic_reports, advanced_analytics, predictive_analytics)
- **Collaboration:** 4 flags (team_management, role_management, pharmacy_network, user_management)
- **Integration:** 3 flags (api_access, health_system_integration, mtr_integration_enabled)
- **Compliance:** 2 flags (compliance_tracking, audit_logs)
- **Administration:** 2 flags (feature_flag_management, system_settings)
- **AI:** 4 flags (ai_diagnostics, clinical_decision_support, ai_recommendations_enabled)
- **Performance:** 10 flags (theme, bundle, cache, database optimizations, etc.)
- **Patient Engagement:** 5 flags (appointments, reminders, portal, etc.)

### By Tier Access
- **Free Trial:** 6 flags
- **Basic:** 9 flags
- **Pro:** 14 flags
- **Pharmily:** 15 flags
- **Network:** 15 flags
- **Enterprise:** 20 flags
- **Super Admin Only:** 2 flags

---

## Dependencies Between Flags

### Flag Dependencies
- **backgroundJobs** requires **apiCaching**
- **cursorPagination** requires **databaseOptimization**
- **apiCaching** requires **performanceMonitoring**

---

## Documentation References

- **API Documentation:** `docs/FEATURE_FLAGS_API.md`
- **User Guide:** `docs/SAAS_SETTINGS_USER_GUIDE.md`
- **Implementation Guide:** `Implementation/FEATURE_MANAGEMENT_GUIDE.md`
- **Admin Feature Management Index:** `Implementation/ADMIN_FEATURE_MANAGEMENT_INDEX.md`
- **SaaS Settings API:** `docs/SAAS_SETTINGS_API.md`

---

## Summary Statistics

- **Total Feature Flags:** 56+
- **Database-Driven Flags:** 20
- **Clinical Interventions Flags:** 10
- **Performance Flags:** 13
- **Environment Config Flags:** 8
- **Patient Engagement Flags:** 5
- **Active Flags:** ~50
- **Experimental Flags:** 2
- **Inactive Flags:** 1 (pharmacy_network)

---

## Notes

1. **Multiple Systems:** The application uses multiple feature flag systems for different purposes:
   - Database flags for subscription-based access control
   - Environment flags for deployment and performance control
   - Module flags for feature rollout and experimentation

2. **Synchronization:** Database feature flags automatically sync with user subscriptions when updated

3. **Caching:** Feature flags are cached with configurable TTL (300 seconds default)

4. **Validation:** Feature flag dependencies are validated at runtime

5. **Monitoring:** Prometheus metrics track feature flag evaluation errors

---

**Last Updated:** November 10, 2025  
**Document Version:** 1.0  
**Maintainer:** Development Team
