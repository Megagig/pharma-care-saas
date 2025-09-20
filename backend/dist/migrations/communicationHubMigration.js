"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommunicationHubMigration = runCommunicationHubMigration;
exports.rollbackCommunicationHubMigration = rollbackCommunicationHubMigration;
exports.checkCommunicationHubMigrationStatus = checkCommunicationHubMigrationStatus;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const communicationIndexes_1 = require("../utils/communicationIndexes");
async function runCommunicationHubMigration() {
    try {
        logger_1.default.info('Starting Communication Hub migration...');
        const results = {
            indexesCreated: false,
            dataValidated: false,
            errors: [],
        };
        try {
            await (0, communicationIndexes_1.createCommunicationIndexes)();
            results.indexesCreated = true;
            logger_1.default.info('✓ Communication indexes created successfully');
        }
        catch (error) {
            const errorMsg = `Failed to create indexes: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        try {
            const validationResults = await validateExistingData();
            results.dataValidated = validationResults.success;
            if (!validationResults.success) {
                results.errors.push(...validationResults.errors);
            }
            logger_1.default.info('✓ Data validation completed');
        }
        catch (error) {
            const errorMsg = `Failed to validate data: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        try {
            const updateResults = await updateExistingDocuments();
            results.documentsUpdated = updateResults.totalUpdated;
            logger_1.default.info(`✓ Updated ${updateResults.totalUpdated} existing documents`);
        }
        catch (error) {
            const errorMsg = `Failed to update documents: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        try {
            await setupDefaultPermissions();
            logger_1.default.info('✓ Default permissions configured');
        }
        catch (error) {
            const errorMsg = `Failed to setup permissions: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        const success = results.errors.length === 0;
        const message = success
            ? 'Communication Hub migration completed successfully'
            : `Migration completed with ${results.errors.length} errors`;
        logger_1.default.info(message);
        return {
            success,
            message,
            details: results,
            errors: results.errors.length > 0 ? results.errors : undefined,
        };
    }
    catch (error) {
        const errorMsg = `Communication Hub migration failed: ${error.message}`;
        logger_1.default.error(errorMsg, error);
        return {
            success: false,
            message: errorMsg,
            errors: [error.message],
        };
    }
}
async function validateExistingData() {
    const errors = [];
    try {
        const Conversation = mongoose_1.default.model('Conversation');
        const invalidConversations = await Conversation.find({
            $or: [
                { workplaceId: { $exists: false } },
                { participants: { $size: 0 } },
                { 'metadata.isEncrypted': { $exists: false } },
            ],
        }).countDocuments();
        if (invalidConversations > 0) {
            errors.push(`Found ${invalidConversations} conversations with missing required fields`);
        }
        const Message = mongoose_1.default.model('Message');
        const unencryptedMessages = await Message.find({
            isEncrypted: { $ne: true },
        }).countDocuments();
        if (unencryptedMessages > 0) {
            errors.push(`Found ${unencryptedMessages} messages without encryption metadata`);
        }
        const Notification = mongoose_1.default.model('Notification');
        const invalidNotifications = await Notification.find({
            deliveryChannels: { $exists: false },
        }).countDocuments();
        if (invalidNotifications > 0) {
            errors.push(`Found ${invalidNotifications} notifications without delivery channels`);
        }
        const orphanedMessages = await Message.aggregate([
            {
                $lookup: {
                    from: 'conversations',
                    localField: 'conversationId',
                    foreignField: '_id',
                    as: 'conversation',
                },
            },
            {
                $match: {
                    conversation: { $size: 0 },
                },
            },
            {
                $count: 'orphanedCount',
            },
        ]);
        const orphanedCount = orphanedMessages[0]?.orphanedCount || 0;
        if (orphanedCount > 0) {
            errors.push(`Found ${orphanedCount} orphaned messages without valid conversations`);
        }
        return {
            success: errors.length === 0,
            errors,
        };
    }
    catch (error) {
        logger_1.default.error('Error during data validation:', error);
        return {
            success: false,
            errors: [`Data validation failed: ${error.message}`],
        };
    }
}
async function updateExistingDocuments() {
    let totalUpdated = 0;
    try {
        const Conversation = mongoose_1.default.model('Conversation');
        const Message = mongoose_1.default.model('Message');
        const Notification = mongoose_1.default.model('Notification');
        const conversationUpdates = await Conversation.updateMany({
            $or: [
                { 'metadata.isEncrypted': { $exists: false } },
                { unreadCount: { $exists: false } },
                { status: { $exists: false } },
                { priority: { $exists: false } },
            ],
        }, {
            $set: {
                'metadata.isEncrypted': true,
                unreadCount: {},
                status: 'active',
                priority: 'normal',
            },
        });
        totalUpdated += conversationUpdates.modifiedCount;
        const messageUpdates = await Message.updateMany({
            $or: [
                { isEncrypted: { $exists: false } },
                { status: { $exists: false } },
                { priority: { $exists: false } },
            ],
        }, {
            $set: {
                isEncrypted: true,
                status: 'sent',
                priority: 'normal',
                reactions: [],
                readBy: [],
                editHistory: [],
            },
        });
        totalUpdated += messageUpdates.modifiedCount;
        const notificationUpdates = await Notification.updateMany({
            $or: [
                { deliveryChannels: { $exists: false } },
                { deliveryStatus: { $exists: false } },
                { status: { $exists: false } },
            ],
        }, {
            $set: {
                'deliveryChannels.inApp': true,
                'deliveryChannels.email': false,
                'deliveryChannels.sms': false,
                'deliveryChannels.push': true,
                deliveryStatus: [
                    {
                        channel: 'inApp',
                        status: 'pending',
                        attempts: 0,
                    },
                ],
                status: 'unread',
            },
        });
        totalUpdated += notificationUpdates.modifiedCount;
        const conversationsNeedingKeys = await Conversation.find({
            'metadata.isEncrypted': true,
            'metadata.encryptionKeyId': { $exists: false },
        });
        for (const conversation of conversationsNeedingKeys) {
            conversation.metadata.encryptionKeyId = `conv_${conversation._id}_${Date.now()}`;
            await conversation.save();
            totalUpdated++;
        }
        const messagesNeedingKeys = await Message.find({
            isEncrypted: true,
            encryptionKeyId: { $exists: false },
        });
        for (const message of messagesNeedingKeys) {
            message.encryptionKeyId = `msg_${message._id}_${Date.now()}`;
            await message.save();
            totalUpdated++;
        }
        return { totalUpdated };
    }
    catch (error) {
        logger_1.default.error('Error updating existing documents:', error);
        throw error;
    }
}
async function setupDefaultPermissions() {
    try {
        const Conversation = mongoose_1.default.model('Conversation');
        const conversationsNeedingPermissions = await Conversation.find({
            'participants.permissions': { $exists: false },
        });
        for (const conversation of conversationsNeedingPermissions) {
            let updated = false;
            for (const participant of conversation.participants) {
                if (!participant.permissions || participant.permissions.length === 0) {
                    switch (participant.role) {
                        case 'patient':
                            participant.permissions = ['read_messages', 'send_messages', 'upload_files'];
                            break;
                        case 'pharmacist':
                        case 'doctor':
                            participant.permissions = [
                                'read_messages',
                                'send_messages',
                                'upload_files',
                                'view_patient_data',
                                'manage_clinical_context',
                            ];
                            break;
                        case 'pharmacy_team':
                        case 'intern_pharmacist':
                            participant.permissions = [
                                'read_messages',
                                'send_messages',
                                'upload_files',
                            ];
                            break;
                        default:
                            participant.permissions = ['read_messages', 'send_messages'];
                    }
                    updated = true;
                }
            }
            if (updated) {
                await conversation.save();
            }
        }
    }
    catch (error) {
        logger_1.default.error('Error setting up default permissions:', error);
        throw error;
    }
}
async function rollbackCommunicationHubMigration() {
    try {
        logger_1.default.info('Starting Communication Hub migration rollback...');
        const results = {
            indexesDropped: false,
            fieldsRemoved: false,
            errors: [],
        };
        try {
            const { dropCommunicationIndexes } = await Promise.resolve().then(() => __importStar(require('../utils/communicationIndexes')));
            await dropCommunicationIndexes();
            results.indexesDropped = true;
            logger_1.default.info('✓ Communication indexes dropped');
        }
        catch (error) {
            const errorMsg = `Failed to drop indexes: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        try {
            const Conversation = mongoose_1.default.model('Conversation');
            const Message = mongoose_1.default.model('Message');
            const Notification = mongoose_1.default.model('Notification');
            await Conversation.updateMany({}, {
                $unset: {
                    'metadata.encryptionKeyId': '',
                    unreadCount: '',
                },
            });
            await Message.updateMany({}, {
                $unset: {
                    encryptionKeyId: '',
                    reactions: '',
                    editHistory: '',
                },
            });
            await Notification.updateMany({}, {
                $unset: {
                    deliveryStatus: '',
                    groupKey: '',
                    batchId: '',
                },
            });
            results.fieldsRemoved = true;
            logger_1.default.info('✓ Migration fields removed');
        }
        catch (error) {
            const errorMsg = `Failed to remove fields: ${error.message}`;
            results.errors.push(errorMsg);
            logger_1.default.error(errorMsg, error);
        }
        const success = results.errors.length === 0;
        const message = success
            ? 'Communication Hub migration rollback completed successfully'
            : `Rollback completed with ${results.errors.length} errors`;
        logger_1.default.info(message);
        return {
            success,
            message,
            details: results,
            errors: results.errors.length > 0 ? results.errors : undefined,
        };
    }
    catch (error) {
        const errorMsg = `Communication Hub migration rollback failed: ${error.message}`;
        logger_1.default.error(errorMsg, error);
        return {
            success: false,
            message: errorMsg,
            errors: [error.message],
        };
    }
}
async function checkCommunicationHubMigrationStatus() {
    try {
        const status = {
            indexesExist: false,
            dataIntegrity: false,
            permissionsConfigured: false,
            encryptionKeysGenerated: false,
        };
        try {
            const db = mongoose_1.default.connection.db;
            const conversationIndexes = await db.collection('conversations').indexes();
            status.indexesExist = conversationIndexes.length > 1;
        }
        catch (error) {
            logger_1.default.warn('Could not check index status:', error);
        }
        try {
            const validationResult = await validateExistingData();
            status.dataIntegrity = validationResult.success;
        }
        catch (error) {
            logger_1.default.warn('Could not check data integrity:', error);
        }
        try {
            const Conversation = mongoose_1.default.model('Conversation');
            const conversationsWithoutPermissions = await Conversation.find({
                'participants.permissions': { $exists: false },
            }).countDocuments();
            status.permissionsConfigured = conversationsWithoutPermissions === 0;
        }
        catch (error) {
            logger_1.default.warn('Could not check permissions status:', error);
        }
        try {
            const Conversation = mongoose_1.default.model('Conversation');
            const Message = mongoose_1.default.model('Message');
            const conversationsWithoutKeys = await Conversation.find({
                'metadata.isEncrypted': true,
                'metadata.encryptionKeyId': { $exists: false },
            }).countDocuments();
            const messagesWithoutKeys = await Message.find({
                isEncrypted: true,
                encryptionKeyId: { $exists: false },
            }).countDocuments();
            status.encryptionKeysGenerated = conversationsWithoutKeys === 0 && messagesWithoutKeys === 0;
        }
        catch (error) {
            logger_1.default.warn('Could not check encryption keys status:', error);
        }
        const isComplete = Object.values(status).every(Boolean);
        return {
            isComplete,
            details: status,
        };
    }
    catch (error) {
        logger_1.default.error('Error checking migration status:', error);
        return {
            isComplete: false,
            details: { error: error.message },
        };
    }
}
exports.default = {
    runCommunicationHubMigration,
    rollbackCommunicationHubMigration,
    checkCommunicationHubMigrationStatus,
};
//# sourceMappingURL=communicationHubMigration.js.map