import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

const dropOldIndexes = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get current indexes
        const indexes = await usersCollection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));

        // Drop the licenseNumber index if it exists
        try {
            await usersCollection.dropIndex('licenseNumber_1');
            console.log('✅ Dropped licenseNumber_1 index');
        } catch (error: any) {
            if (error.code === 27) {
                console.log('ℹ️ licenseNumber_1 index does not exist');
            } else {
                console.error('❌ Error dropping licenseNumber_1 index:', error.message);
            }
        }

        // Also try to drop any other old indexes that might cause issues
        const indexesToDrop = [
            'licenseNumber_1',
            'pharmacyName_1',
            'phoneNumber_1'
        ];

        for (const indexName of indexesToDrop) {
            try {
                await usersCollection.dropIndex(indexName);
                console.log(`✅ Dropped ${indexName} index`);
            } catch (error: any) {
                if (error.code === 27) {
                    console.log(`ℹ️ ${indexName} index does not exist`);
                } else {
                    console.error(`❌ Error dropping ${indexName} index:`, error.message);
                }
            }
        }

        // Get updated indexes
        const updatedIndexes = await usersCollection.indexes();
        console.log('Updated indexes:', updatedIndexes.map(idx => idx.name));

        console.log('✅ Index cleanup completed successfully!');
    } catch (error) {
        console.error('❌ Error during index cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the cleanup function if this file is executed directly
if (require.main === module) {
    dropOldIndexes();
}

export default dropOldIndexes;