import mongoose from 'mongoose';
import { config } from 'dotenv';
import SubscriptionPlan from '../src/models/SubscriptionPlan';

// Load environment variables
config();

const subscriptionPlans = [
    {
        name: 'Free Trial',
        priceNGN: 0,
        billingInterval: 'monthly',
        features: {
            patientLimit: 10,
            reminderSmsMonthlyLimit: 50,
            reportsExport: false,
            careNoteExport: false,
            adrModule: false,
            multiUserSupport: false
        }
    },
    {
        name: 'Basic',
        priceNGN: 15000,
        billingInterval: 'monthly',
        features: {
            patientLimit: 100,
            reminderSmsMonthlyLimit: 200,
            reportsExport: true,
            careNoteExport: true,
            adrModule: false,
            multiUserSupport: false
        }
    },
    {
        name: 'Pro',
        priceNGN: 35000,
        billingInterval: 'monthly',
        features: {
            patientLimit: 500,
            reminderSmsMonthlyLimit: 1000,
            reportsExport: true,
            careNoteExport: true,
            adrModule: true,
            multiUserSupport: true
        }
    },
    {
        name: 'Enterprise',
        priceNGN: 75000,
        billingInterval: 'monthly',
        features: {
            patientLimit: null, // unlimited
            reminderSmsMonthlyLimit: null, // unlimited
            reportsExport: true,
            careNoteExport: true,
            adrModule: true,
            multiUserSupport: true
        }
    }
];

const seedSubscriptionPlans = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Clear existing plans
        await SubscriptionPlan.deleteMany({});
        console.log('Cleared existing subscription plans');

        // Insert new plans
        const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
        console.log(`Created ${createdPlans.length} subscription plans:`);

        createdPlans.forEach(plan => {
            console.log(`- ${plan.name}: ₦${plan.priceNGN.toLocaleString()}/${plan.billingInterval}`);
        });

        console.log('Subscription plans seeded successfully!');
    } catch (error) {
        console.error('Error seeding subscription plans:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
    seedSubscriptionPlans();
}

export default seedSubscriptionPlans;