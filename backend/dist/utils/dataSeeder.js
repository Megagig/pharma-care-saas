"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSeeder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const defaultFeatureFlags = [
    {
        name: 'Patient Management',
        key: 'patient_management',
        description: 'Create, view, and manage patient records',
        allowedTiers: ['free_trial', 'basic', 'pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'core',
            priority: 'critical',
            tags: ['patients', 'basic']
        }
    },
    {
        name: 'Medication Management',
        key: 'medication_management',
        description: 'Manage medication inventory and prescriptions',
        allowedTiers: ['free_trial', 'basic', 'pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'core',
            priority: 'critical',
            tags: ['medications', 'inventory']
        }
    },
    {
        name: 'Clinical Notes',
        key: 'clinical_notes',
        description: 'Create and manage clinical notes for patients',
        allowedTiers: ['basic', 'pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        customRules: {
            requiredLicense: true
        },
        metadata: {
            category: 'core',
            priority: 'high',
            tags: ['notes', 'clinical']
        }
    },
    {
        name: 'Basic Reports',
        key: 'basic_reports',
        description: 'Generate basic reports and analytics',
        allowedTiers: ['basic', 'pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'analytics',
            priority: 'medium',
            tags: ['reports', 'analytics']
        }
    },
    {
        name: 'Advanced Analytics',
        key: 'advanced_analytics',
        description: 'Access to advanced analytics and insights',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'analytics',
            priority: 'medium',
            tags: ['analytics', 'insights', 'premium']
        }
    },
    {
        name: 'Data Export',
        key: 'data_export',
        description: 'Export data in various formats (CSV, PDF, Excel)',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'analytics',
            priority: 'medium',
            tags: ['export', 'data']
        }
    },
    {
        name: 'Team Management',
        key: 'team_management',
        description: 'Invite and manage team members',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        customRules: {
            maxUsers: 10
        },
        metadata: {
            category: 'collaboration',
            priority: 'high',
            tags: ['team', 'collaboration']
        }
    },
    {
        name: 'Multi-User Access',
        key: 'multi_user_access',
        description: 'Support for multiple users under one account',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'collaboration',
            priority: 'high',
            tags: ['multi-user', 'team']
        }
    },
    {
        name: 'Role Management',
        key: 'role_management',
        description: 'Assign and manage user roles and permissions',
        allowedTiers: ['enterprise'],
        allowedRoles: ['pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'collaboration',
            priority: 'medium',
            tags: ['roles', 'permissions']
        }
    },
    {
        name: 'API Access',
        key: 'api_access',
        description: 'Access to REST API for integrations',
        allowedTiers: ['enterprise'],
        allowedRoles: ['pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'integration',
            priority: 'low',
            tags: ['api', 'integration']
        }
    },
    {
        name: 'Third-party Integrations',
        key: 'third_party_integrations',
        description: 'Connect with external systems and services',
        allowedTiers: ['enterprise'],
        allowedRoles: ['pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'integration',
            priority: 'low',
            tags: ['integrations', 'external']
        }
    },
    {
        name: 'Audit Logs',
        key: 'audit_logs',
        description: 'Track all system activities and changes',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'compliance',
            priority: 'high',
            tags: ['audit', 'compliance']
        }
    },
    {
        name: 'Data Backup',
        key: 'data_backup',
        description: 'Automated data backup and recovery',
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin'],
        metadata: {
            category: 'compliance',
            priority: 'high',
            tags: ['backup', 'recovery']
        }
    },
    {
        name: 'User Management',
        key: 'user_management',
        description: 'Manage all system users and their permissions',
        allowedTiers: ['enterprise'],
        allowedRoles: ['super_admin'],
        metadata: {
            category: 'administration',
            priority: 'critical',
            tags: ['admin', 'users']
        }
    },
    {
        name: 'System Configuration',
        key: 'system_configuration',
        description: 'Configure system settings and parameters',
        allowedTiers: ['enterprise'],
        allowedRoles: ['super_admin'],
        metadata: {
            category: 'administration',
            priority: 'critical',
            tags: ['admin', 'configuration']
        }
    }
];
const subscriptionPlans = [
    {
        name: 'Free Trial',
        priceNGN: 0,
        billingInterval: 'monthly',
        isActive: true,
        features: {
            patientLimit: 10,
            reminderSmsMonthlyLimit: 5,
            reportsExport: false,
            careNoteExport: false,
            adrModule: false,
            multiUserSupport: false,
            teamSize: 1,
            apiAccess: false,
            auditLogs: false,
            dataBackup: false
        },
        description: '14-day free trial with basic features'
    },
    {
        name: 'Basic',
        priceNGN: 5000,
        billingInterval: 'monthly',
        isActive: true,
        features: {
            patientLimit: 100,
            reminderSmsMonthlyLimit: 50,
            reportsExport: true,
            careNoteExport: false,
            adrModule: false,
            multiUserSupport: false,
            teamSize: 1,
            apiAccess: false,
            auditLogs: false,
            dataBackup: false
        },
        description: 'Perfect for individual pharmacists'
    },
    {
        name: 'Pro',
        priceNGN: 15000,
        billingInterval: 'monthly',
        isActive: true,
        features: {
            patientLimit: 500,
            reminderSmsMonthlyLimit: 200,
            reportsExport: true,
            careNoteExport: true,
            adrModule: true,
            multiUserSupport: true,
            teamSize: 5,
            apiAccess: false,
            auditLogs: true,
            dataBackup: true
        },
        description: 'Great for pharmacy teams and growing businesses'
    },
    {
        name: 'Enterprise',
        priceNGN: 35000,
        billingInterval: 'monthly',
        isActive: true,
        features: {
            patientLimit: null,
            reminderSmsMonthlyLimit: null,
            reportsExport: true,
            careNoteExport: true,
            adrModule: true,
            multiUserSupport: true,
            teamSize: null,
            apiAccess: true,
            auditLogs: true,
            dataBackup: true,
            customIntegrations: true,
            prioritySupport: true
        },
        description: 'Complete solution for large pharmacy chains'
    }
];
class DataSeeder {
    async seedFeatureFlags() {
        try {
            console.log('Seeding feature flags...');
            await FeatureFlag_1.default.deleteMany({});
            let adminUser = await User_1.default.findOne({ role: 'super_admin' });
            if (!adminUser) {
                const hashedPassword = await bcryptjs_1.default.hash('admin123!', 12);
                adminUser = await User_1.default.create({
                    email: 'admin@pharmacare.com',
                    passwordHash: hashedPassword,
                    firstName: 'System',
                    lastName: 'Administrator',
                    role: 'super_admin',
                    status: 'active',
                    emailVerified: true,
                    licenseStatus: 'not_required',
                    subscriptionTier: 'enterprise',
                    permissions: ['*'],
                    features: ['*']
                });
            }
            const featureFlags = defaultFeatureFlags.map(flag => ({
                ...flag,
                createdBy: adminUser._id,
                updatedBy: adminUser._id
            }));
            await FeatureFlag_1.default.insertMany(featureFlags);
            console.log(`✅ Created ${featureFlags.length} feature flags`);
        }
        catch (error) {
            console.error('❌ Error seeding feature flags:', error);
            throw error;
        }
    }
    async seedSubscriptionPlans() {
        try {
            console.log('Seeding subscription plans...');
            await SubscriptionPlan_1.default.deleteMany({});
            await SubscriptionPlan_1.default.insertMany(subscriptionPlans);
            console.log(`✅ Created ${subscriptionPlans.length} subscription plans`);
        }
        catch (error) {
            console.error('❌ Error seeding subscription plans:', error);
            throw error;
        }
    }
    async seed() {
        try {
            console.log('🌱 Starting data seeding...');
            await this.seedFeatureFlags();
            await this.seedSubscriptionPlans();
            console.log('✅ Data seeding completed successfully!');
        }
        catch (error) {
            console.error('❌ Data seeding failed:', error);
            process.exit(1);
        }
    }
}
exports.dataSeeder = new DataSeeder();
if (require.main === module) {
    const connectDB = require('../config/database').default;
    (async () => {
        try {
            await connectDB();
            await exports.dataSeeder.seed();
            await mongoose_1.default.disconnect();
            console.log('Database connection closed.');
        }
        catch (error) {
            console.error('Seeding failed:', error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=dataSeeder.js.map