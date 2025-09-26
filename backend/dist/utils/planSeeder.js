"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanSeeder = void 0;
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const PlanConfigService_1 = __importDefault(require("../services/PlanConfigService"));
const logger_1 = __importDefault(require("./logger"));
class PlanSeeder {
    constructor() {
        this.planConfigService = PlanConfigService_1.default.getInstance();
    }
    async seedPlans() {
        try {
            logger_1.default.info('Starting plan seeding process...');
            const config = await this.planConfigService.loadConfiguration();
            const planConfigs = Object.values(config.plans);
            logger_1.default.info(`Found ${planConfigs.length} plans in configuration`);
            for (const planConfig of planConfigs) {
                await this.upsertPlan(planConfig);
            }
            await this.deactivateObsoletePlans(planConfigs);
            logger_1.default.info('Plan seeding completed successfully');
        }
        catch (error) {
            logger_1.default.error('Failed to seed plans:', error);
            throw error;
        }
    }
    async upsertPlan(planConfig) {
        try {
            const planData = this.mapConfigToPlanModel(planConfig);
            const result = await SubscriptionPlan_1.default.findOneAndUpdate({ tier: planConfig.tier }, {
                $set: {
                    ...planData,
                    updatedAt: new Date()
                }
            }, {
                upsert: true,
                new: true,
                runValidators: true
            });
            if (result) {
                logger_1.default.info(`Upserted plan: ${planConfig.name} (${planConfig.tier})`);
            }
        }
        catch (error) {
            logger_1.default.error(`Failed to upsert plan ${planConfig.name}:`, error);
            throw error;
        }
    }
    async createNewPlan(planConfig) {
        const planData = this.mapConfigToPlanModel(planConfig);
        const newPlan = new SubscriptionPlan_1.default(planData);
        await newPlan.validate();
        return await newPlan.save();
    }
    async updateExistingPlan(existingPlan, planConfig) {
        const updatedData = this.mapConfigToPlanModel(planConfig);
        Object.assign(existingPlan, {
            ...updatedData,
            _id: existingPlan._id,
            createdAt: existingPlan.createdAt,
            updatedAt: new Date()
        });
        await existingPlan.validate();
        await existingPlan.save();
    }
    mapConfigToPlanModel(planConfig) {
        return {
            name: planConfig.name,
            priceNGN: planConfig.priceNGN,
            billingInterval: planConfig.billingInterval,
            tier: planConfig.tier,
            trialDuration: planConfig.trialDuration || undefined,
            popularPlan: planConfig.popularPlan,
            isContactSales: planConfig.isContactSales,
            whatsappNumber: planConfig.whatsappNumber || undefined,
            description: planConfig.description,
            isActive: planConfig.isActive,
            features: this.mapFeaturesToModel(planConfig.features, planConfig.limits)
        };
    }
    mapFeaturesToModel(features, limits) {
        return {
            patientLimit: limits.patients,
            reminderSmsMonthlyLimit: limits.reminderSms,
            clinicalNotesLimit: limits.clinicalNotes,
            patientRecordsLimit: limits.patients,
            teamSize: limits.users,
            reportsExport: features.includes('reports_export'),
            careNoteExport: features.includes('care_note_export'),
            adrModule: features.includes('adr_module'),
            multiUserSupport: features.includes('team_management'),
            apiAccess: features.includes('api_access'),
            auditLogs: features.includes('audit_logs'),
            dataBackup: features.includes('data_backup'),
            prioritySupport: features.includes('priority_support'),
            emailReminders: features.includes('email_reminders'),
            smsReminders: features.includes('sms_reminders'),
            advancedReports: features.includes('advanced_reports'),
            drugTherapyManagement: features.includes('drug_therapy_management'),
            teamManagement: features.includes('team_management'),
            dedicatedSupport: features.includes('dedicated_support'),
            integrations: features.includes('integrations'),
            customIntegrations: features.includes('custom_integrations'),
            adrReporting: features.includes('adr_reporting'),
            drugInteractionChecker: features.includes('drug_interaction_checker'),
            doseCalculator: features.includes('dose_calculator'),
            multiLocationDashboard: features.includes('multi_location_dashboard'),
            sharedPatientRecords: features.includes('shared_patient_records'),
            groupAnalytics: features.includes('group_analytics'),
            cdss: features.includes('cdss')
        };
    }
    async deactivateObsoletePlans(currentPlans) {
        try {
            const currentTiers = currentPlans.map(plan => plan.tier);
            const obsoletePlans = await SubscriptionPlan_1.default.find({
                tier: { $nin: currentTiers },
                isActive: true
            });
            if (obsoletePlans.length > 0) {
                logger_1.default.info(`Found ${obsoletePlans.length} obsolete plans to deactivate`);
                await SubscriptionPlan_1.default.updateMany({ tier: { $nin: currentTiers }, isActive: true }, { isActive: false, updatedAt: new Date() });
                logger_1.default.info(`Deactivated ${obsoletePlans.length} obsolete plans`);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to deactivate obsolete plans:', error);
            throw error;
        }
    }
    async validateConfiguration() {
        try {
            const config = await this.planConfigService.loadConfiguration();
            const planConfigs = Object.values(config.plans);
            const tierRanks = planConfigs.map(plan => plan.tierRank);
            const uniqueTierRanks = new Set(tierRanks);
            if (tierRanks.length !== uniqueTierRanks.size) {
                throw new Error('Duplicate tier ranks found in configuration');
            }
            const tiers = planConfigs.map(plan => plan.tier);
            const uniqueTiers = new Set(tiers);
            if (tiers.length !== uniqueTiers.size) {
                throw new Error('Duplicate tiers found in configuration');
            }
            for (const planConfig of planConfigs) {
                const modelData = this.mapConfigToPlanModel(planConfig);
                const tempPlan = new SubscriptionPlan_1.default(modelData);
                await tempPlan.validate();
            }
            logger_1.default.info('Configuration validation passed');
            return true;
        }
        catch (error) {
            logger_1.default.error('Configuration validation failed:', error);
            return false;
        }
    }
    async getSeedingStats() {
        try {
            const config = await this.planConfigService.loadConfiguration();
            const totalPlansInConfig = Object.keys(config.plans).length;
            const totalPlansInDatabase = await SubscriptionPlan_1.default.countDocuments();
            const activePlansInDatabase = await SubscriptionPlan_1.default.countDocuments({ isActive: true });
            const mostRecentPlan = await SubscriptionPlan_1.default.findOne()
                .sort({ updatedAt: -1 })
                .select('updatedAt');
            return {
                totalPlansInConfig,
                totalPlansInDatabase,
                activePlansInDatabase,
                lastSeededAt: mostRecentPlan?.updatedAt
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get seeding stats:', error);
            throw error;
        }
    }
}
exports.PlanSeeder = PlanSeeder;
exports.default = PlanSeeder;
//# sourceMappingURL=planSeeder.js.map