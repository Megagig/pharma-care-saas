import {
   PermissionMatrix,
   UserRole,
   WorkplaceRole,
   SubscriptionTier,
} from '../types/auth';

/**
 * Comprehensive permission matrix configuration
 * Defines which roles and features are required for each action
 */
export const PERMISSION_MATRIX: PermissionMatrix = {
   // ========================================
   // INVITATION MANAGEMENT
   // ========================================
   'invitation.create': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'invitation.delete': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'invitation.list': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'invitation.resend': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'invitation.view': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },

   // ========================================
   // PATIENT MANAGEMENT
   // ========================================
   'patient.create': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      features: ['patientLimit'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'patient.read': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician', 'Assistant'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'patient.update': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'patient.delete': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'patient.export': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['dataExport'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'patient.import': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['dataImport'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // CLINICAL NOTES
   // ========================================
   'clinical_notes.create': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalNotesLimit'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_notes.read': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_notes.update': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_notes.delete': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_notes.export': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['careNoteExport'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_notes.confidential_access': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_notes.bulk_operations': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['bulkOperations'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_notes.audit_access': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      features: ['auditLogs'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_notes.attachment_upload': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['fileAttachments'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_notes.search_advanced': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      features: ['advancedSearch'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },

   // ========================================
   // MEDICATION MANAGEMENT
   // ========================================
   'medication.create': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'medication.read': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician', 'Assistant'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'medication.update': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'medication.delete': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // CLINICAL INTERVENTIONS
   // ========================================
   'clinical_intervention.create': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_intervention.read': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      features: ['clinicalInterventions'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_intervention.update': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_intervention.delete': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_intervention.assign': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions', 'teamManagement'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'clinical_intervention.reports': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions', 'advancedReports'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'clinical_intervention.export': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['clinicalInterventions', 'dataExport'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // SUBSCRIPTION MANAGEMENT
   // ========================================
   'subscription.manage': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'subscription.view': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'subscription.upgrade': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'subscription.downgrade': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'subscription.cancel': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // WORKSPACE SETTINGS
   // ========================================
   'workspace.settings': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'workspace.delete': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: false,
   },
   'workspace.transfer': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'workspace.manage': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'workspace.analytics': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },

   // ========================================
   // REPORTS AND ANALYTICS
   // ========================================
   'reports.basic': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'reports.advanced': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['advancedReports'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'reports.export': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['reportsExport'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'reports.schedule': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['scheduledReports'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // ADR (ADVERSE DRUG REACTION) FEATURES
   // ========================================
   'adr.create': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['adrModule', 'adrReporting'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'adr.read': {
      workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
      features: ['adrModule'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'adr.update': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['adrModule'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'adr.delete': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['adrModule'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'adr.report': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['adrReporting'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // MULTI-LOCATION FEATURES
   // ========================================
   'location.create': {
      workplaceRoles: ['Owner'],
      features: ['multiLocationDashboard'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'location.read': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['multiLocationDashboard'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'location.update': {
      workplaceRoles: ['Owner'],
      features: ['multiLocationDashboard'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'location.delete': {
      workplaceRoles: ['Owner'],
      features: ['multiLocationDashboard'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'location.manage': {
      workplaceRoles: ['Owner'],
      features: ['multiLocationDashboard'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // TEAM MANAGEMENT
   // ========================================
   'team.invite': {
      workplaceRoles: ['Owner'],
      features: ['multiUserSupport', 'teamManagement'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'team.manage': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'team.remove': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },
   'team.role_change': {
      workplaceRoles: ['Owner'],
      features: ['teamManagement'],
      requiresActiveSubscription: true,
      allowTrialAccess: true,
   },

   // ========================================
   // API ACCESS
   // ========================================
   'api.access': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['apiAccess'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'api.key_generate': {
      workplaceRoles: ['Owner'],
      features: ['apiAccess'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'api.key_revoke': {
      workplaceRoles: ['Owner'],
      features: ['apiAccess'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // BILLING AND PAYMENTS
   // ========================================
   'billing.view': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'billing.manage': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'billing.history': {
      workplaceRoles: ['Owner'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },

   // ========================================
   // ADMIN FEATURES
   // ========================================
   'admin.users': {
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'admin.workspaces': {
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'admin.subscriptions': {
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'admin.feature_flags': {
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },
   'admin.system_settings': {
      systemRoles: ['super_admin'],
      requiresActiveSubscription: false,
      allowTrialAccess: true,
   },

   // ========================================
   // AUDIT AND COMPLIANCE
   // ========================================
   'audit.view': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      features: ['auditLogs'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'audit.export': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      features: ['auditLogs', 'dataExport'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'audit.security': {
      workplaceRoles: ['Owner'],
      systemRoles: ['super_admin'],
      features: ['auditLogs', 'securityMonitoring'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // INTEGRATIONS
   // ========================================
   'integration.configure': {
      workplaceRoles: ['Owner'],
      features: ['integrations'],
      planTiers: ['pro', 'pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'integration.manage': {
      workplaceRoles: ['Owner', 'Pharmacist'],
      features: ['integrations'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },

   // ========================================
   // BACKUP AND RESTORE
   // ========================================
   'backup.create': {
      workplaceRoles: ['Owner'],
      features: ['dataBackup'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'backup.restore': {
      workplaceRoles: ['Owner'],
      features: ['dataBackup'],
      planTiers: ['pharmily', 'network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
   'backup.schedule': {
      workplaceRoles: ['Owner'],
      features: ['dataBackup', 'scheduledBackups'],
      planTiers: ['network', 'enterprise'],
      requiresActiveSubscription: true,
      allowTrialAccess: false,
   },
};

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
   super_admin: [
      'super_admin',
      'pharmacy_outlet',
      'pharmacy_team',
      'pharmacist',
      'intern_pharmacist',
   ],
   pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
   pharmacy_team: ['pharmacy_team', 'pharmacist'],
   pharmacist: ['pharmacist'],
   intern_pharmacist: ['intern_pharmacist'],
};

/**
 * Workplace role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export const WORKPLACE_ROLE_HIERARCHY: Record<WorkplaceRole, WorkplaceRole[]> =
   {
      Owner: [
         'Owner',
         'Pharmacist',
         'Staff',
         'Technician',
         'Cashier',
         'Assistant',
      ],
      Pharmacist: ['Pharmacist', 'Technician', 'Assistant'],
      Staff: ['Staff', 'Technician', 'Assistant'],
      Technician: ['Technician', 'Assistant'],
      Cashier: ['Cashier', 'Assistant'],
      Assistant: ['Assistant'],
   };

/**
 * Plan tier hierarchy for upgrade/downgrade logic
 */
export const PLAN_TIER_HIERARCHY: Record<SubscriptionTier, number> = {
   free_trial: 0,
   basic: 1,
   pro: 2,
   pharmily: 3,
   network: 4,
   enterprise: 5,
};

/**
 * Default features available to all plans
 */
export const DEFAULT_FEATURES = ['dashboard', 'basicReports', 'userManagement'];

/**
 * Features that require specific plan tiers
 */
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
   free_trial: ['*'], // All features during trial
   basic: [
      'dashboard',
      'patientLimit',
      'basicReports',
      'emailReminders',
      'clinicalInterventions',
   ],
   pro: [
      'dashboard',
      'patientLimit',
      'basicReports',
      'advancedReports',
      'emailReminders',
      'dataExport',
      'apiAccess',
      'auditLogs',
      'integrations',
      'clinicalInterventions',
   ],
   pharmily: [
      'dashboard',
      'patientLimit',
      'basicReports',
      'advancedReports',
      'emailReminders',
      'dataExport',
      'dataImport',
      'apiAccess',
      'auditLogs',
      'integrations',
      'adrModule',
      'adrReporting',
      'scheduledReports',
      'dataBackup',
      'clinicalInterventions',
   ],
   network: [
      'dashboard',
      'patientLimit',
      'basicReports',
      'advancedReports',
      'emailReminders',
      'dataExport',
      'dataImport',
      'apiAccess',
      'auditLogs',
      'integrations',
      'adrModule',
      'adrReporting',
      'scheduledReports',
      'dataBackup',
      'scheduledBackups',
      'multiLocationDashboard',
      'teamManagement',
      'multiUserSupport',
      'clinicalInterventions',
   ],
   enterprise: [
      'dashboard',
      'patientLimit',
      'basicReports',
      'advancedReports',
      'emailReminders',
      'dataExport',
      'dataImport',
      'apiAccess',
      'auditLogs',
      'integrations',
      'adrModule',
      'adrReporting',
      'scheduledReports',
      'dataBackup',
      'scheduledBackups',
      'multiLocationDashboard',
      'teamManagement',
      'multiUserSupport',
      'customIntegrations',
      'prioritySupport',
      'dedicatedManager',
      'clinicalInterventions',
   ],
};
