"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackThemePreferenceField = exports.addThemePreferenceField = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const MIGRATION_NAME = 'add_theme_preference_to_users';
const addThemePreferenceField = async () => {
    try {
        console.log(`Starting migration: ${MIGRATION_NAME}`);
        const usersWithoutThemePreference = await User_1.default.countDocuments({
            themePreference: { $exists: false },
        });
        console.log(`Found ${usersWithoutThemePreference} users without themePreference field`);
        if (usersWithoutThemePreference === 0) {
            console.log('No users need migration. All users already have themePreference field.');
            return;
        }
        const result = await User_1.default.updateMany({ themePreference: { $exists: false } }, {
            $set: {
                themePreference: 'system',
            },
        });
        console.log(`Migration completed successfully:`);
        console.log(`- Updated ${result.modifiedCount} users`);
        console.log(`- Matched ${result.matchedCount} users`);
        const remainingUsers = await User_1.default.countDocuments({
            themePreference: { $exists: false },
        });
        if (remainingUsers === 0) {
            console.log('✅ Migration verification passed: All users now have themePreference field');
        }
        else {
            console.warn(`⚠️  Migration verification failed: ${remainingUsers} users still missing themePreference field`);
        }
    }
    catch (error) {
        console.error(`Migration ${MIGRATION_NAME} failed:`, error);
        throw error;
    }
};
exports.addThemePreferenceField = addThemePreferenceField;
const rollbackThemePreferenceField = async () => {
    try {
        console.log(`Starting rollback for migration: ${MIGRATION_NAME}`);
        const result = await User_1.default.updateMany({}, {
            $unset: {
                themePreference: 1,
            },
        });
        console.log(`Rollback completed: Removed themePreference field from ${result.modifiedCount} users`);
    }
    catch (error) {
        console.error(`Rollback for ${MIGRATION_NAME} failed:`, error);
        throw error;
    }
};
exports.rollbackThemePreferenceField = rollbackThemePreferenceField;
if (require.main === module) {
    const action = process.argv[2];
    const connectDB = async () => {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
    };
    const disconnectDB = async () => {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    };
    switch (action) {
        case 'up':
            connectDB()
                .then(exports.addThemePreferenceField)
                .then(disconnectDB)
                .then(() => process.exit(0))
                .catch((error) => {
                console.error('Migration failed:', error);
                process.exit(1);
            });
            break;
        case 'down':
            connectDB()
                .then(exports.rollbackThemePreferenceField)
                .then(disconnectDB)
                .then(() => process.exit(0))
                .catch((error) => {
                console.error('Rollback failed:', error);
                process.exit(1);
            });
            break;
        case 'status':
            connectDB()
                .then(async () => {
                const totalUsers = await User_1.default.countDocuments();
                const usersWithTheme = await User_1.default.countDocuments({
                    themePreference: { $exists: true },
                });
                const usersWithoutTheme = totalUsers - usersWithTheme;
                console.log(`Migration Status: ${MIGRATION_NAME}`);
                console.log(`Total users: ${totalUsers}`);
                console.log(`Users with themePreference: ${usersWithTheme}`);
                console.log(`Users without themePreference: ${usersWithoutTheme}`);
                console.log(`Migration status: ${usersWithoutTheme === 0 ? '✅ Complete' : '❌ Incomplete'}`);
            })
                .then(disconnectDB)
                .then(() => process.exit(0))
                .catch((error) => {
                console.error('Status check failed:', error);
                process.exit(1);
            });
            break;
        default:
            console.log('Usage: ts-node themePreferenceMigration.ts [up|down|status]');
            console.log('  up     - Apply migration (add themePreference field)');
            console.log('  down   - Rollback migration (remove themePreference field)');
            console.log('  status - Check migration status');
            process.exit(1);
    }
}
//# sourceMappingURL=themePreferenceMigration.js.map