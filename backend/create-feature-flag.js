const mongoose = require('mongoose');
require('dotenv').config();

async function createFeatureFlag() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const FeatureFlag = mongoose.model('FeatureFlag', {
            name: String,
            key: String,
            description: String,
            isActive: Boolean,
            allowedTiers: [String],
            allowedRoles: [String],
            customRules: Object,
            metadata: Object
        });

        // Check if feature flag exists
        let flag = await FeatureFlag.findOne({ key: 'clinical_decision_support' });

        if (!flag) {
            console.log('Creating clinical_decision_support feature flag...');
            flag = await FeatureFlag.create({
                name: 'Clinical Decision Support',
                key: 'clinical_decision_support',
                description: 'Access to AI diagnostic analysis and clinical decision support tools',
                isActive: true,
                allowedTiers: ['pro', 'enterprise', 'free_trial'],
                allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'],
                customRules: {
                    requiredLicense: false
                },
                metadata: {
                    category: 'clinical',
                    priority: 'high',
                    tags: ['ai', 'diagnostics', 'clinical']
                }
            });
            console.log('✅ Created feature flag:', flag._id);
        } else {
            console.log('Feature flag already exists, updating...');
            await FeatureFlag.updateOne(
                { key: 'clinical_decision_support' },
                {
                    $set: {
                        isActive: true,
                        allowedTiers: ['pro', 'enterprise', 'free_trial'],
                        allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin']
                    }
                }
            );
            console.log('✅ Updated feature flag');
        }

        // Verify the flag
        flag = await FeatureFlag.findOne({ key: 'clinical_decision_support' });
        console.log('Current flag config:');
        console.log('- Key:', flag.key);
        console.log('- IsActive:', flag.isActive);
        console.log('- AllowedTiers:', flag.allowedTiers);
        console.log('- AllowedRoles:', flag.allowedRoles);

        await mongoose.disconnect();
        console.log('✅ Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createFeatureFlag();