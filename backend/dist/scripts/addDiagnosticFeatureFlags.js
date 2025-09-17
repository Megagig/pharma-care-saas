"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const User_1 = __importDefault(require("../models/User"));
const db_1 = __importDefault(require("../config/db"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
const diagnosticFeatureFlags = [
    {
        name: 'AI Diagnostics',
        key: 'ai_diagnostics',
        description: 'Enable AI-powered diagnostic analysis and clinical decision support',
        isActive: true,
        allowedTiers: ['free_trial', 'pharmily', 'network', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin', 'owner'],
        customRules: {
            requiredLicense: true,
            maxUsers: null
        },
        metadata: {
            category: 'core',
            priority: 'high',
            tags: ['ai', 'diagnostics', 'clinical', 'decision-support']
        }
    },
    {
        name: 'Clinical Decision Support',
        key: 'clinical_decision_support',
        description: 'Enable clinical decision support system and diagnostic workflows',
        isActive: true,
        allowedTiers: ['free_trial', 'pharmily', 'network', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin', 'owner'],
        customRules: {
            requiredLicense: true,
            maxUsers: null
        },
        metadata: {
            category: 'core',
            priority: 'high',
            tags: ['clinical', 'decision-support', 'diagnostics', 'workflow']
        }
    },
    {
        name: 'Drug Information',
        key: 'drug_information',
        description: 'Enable drug interaction checking, contraindications, and drug information lookup',
        isActive: true,
        allowedTiers: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'intern_pharmacist', 'super_admin', 'owner'],
        customRules: {
            requiredLicense: false,
            maxUsers: null
        },
        metadata: {
            category: 'core',
            priority: 'high',
            tags: ['drug', 'interactions', 'contraindications', 'safety']
        }
    }
];
async function addDiagnosticFeatureFlags() {
    try {
        await (0, db_1.default)();
        logger_1.default.info('Connected to database');
        const superAdmin = await User_1.default.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            throw new Error('No super admin user found. Please create a super admin user first.');
        }
        logger_1.default.info(`Using super admin user: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin._id})`);
        for (const flagData of diagnosticFeatureFlags) {
            try {
                const existingFlag = await FeatureFlag_1.default.findOne({ key: flagData.key });
                if (existingFlag) {
                    logger_1.default.info(`Feature flag '${flagData.key}' already exists, updating...`);
                    await FeatureFlag_1.default.findOneAndUpdate({ key: flagData.key }, {
                        ...flagData,
                        updatedBy: superAdmin._id
                    }, { new: true });
                    logger_1.default.info(`✅ Updated feature flag: ${flagData.name}`);
                }
                else {
                    const newFlag = new FeatureFlag_1.default({
                        ...flagData,
                        createdBy: superAdmin._id,
                        updatedBy: superAdmin._id
                    });
                    await newFlag.save();
                    logger_1.default.info(`✅ Created feature flag: ${flagData.name}`);
                }
            }
            catch (error) {
                logger_1.default.error(`❌ Failed to create/update feature flag '${flagData.key}':`, error);
            }
        }
        const createdFlags = await FeatureFlag_1.default.find({
            key: { $in: diagnosticFeatureFlags.map(f => f.key) }
        });
        logger_1.default.info(`\n📊 Summary:`);
        logger_1.default.info(`- Expected feature flags: ${diagnosticFeatureFlags.length}`);
        logger_1.default.info(`- Created/Updated feature flags: ${createdFlags.length}`);
        createdFlags.forEach(flag => {
            logger_1.default.info(`  ✓ ${flag.name} (${flag.key}) - Active: ${flag.isActive}`);
        });
        if (createdFlags.length === diagnosticFeatureFlags.length) {
            logger_1.default.info('\n🎉 All diagnostic feature flags have been successfully added!');
            logger_1.default.info('\nNext steps:');
            logger_1.default.info('1. Update subscription plans to include ai_diagnostics feature');
            logger_1.default.info('2. Restart the backend server');
            logger_1.default.info('3. Test the diagnostic endpoints');
        }
        else {
            logger_1.default.warn('\n⚠️  Some feature flags may not have been created properly. Please check the logs above.');
        }
    }
    catch (error) {
        logger_1.default.error('❌ Failed to add diagnostic feature flags:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        logger_1.default.info('Database connection closed');
    }
}
if (require.main === module) {
    addDiagnosticFeatureFlags()
        .then(() => {
        logger_1.default.info('Script completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Script failed:', error);
        process.exit(1);
    });
}
exports.default = addDiagnosticFeatureFlags;
//# sourceMappingURL=addDiagnosticFeatureFlags.js.map