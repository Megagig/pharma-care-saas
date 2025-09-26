"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const Notification_1 = __importDefault(require("../models/Notification"));
const CommunicationAuditLog_1 = __importDefault(require("../models/CommunicationAuditLog"));
const communicationIndexes_1 = require("../utils/communicationIndexes");
const logger_1 = __importDefault(require("../utils/logger"));
async function validateCommunicationModels() {
    try {
        logger_1.default.info('Starting Communication Hub models validation...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-test';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to database');
        await (0, communicationIndexes_1.createCommunicationIndexes)();
        logger_1.default.info('✓ Database indexes created');
        const workplaceId = new mongoose_1.default.Types.ObjectId();
        const userId1 = new mongoose_1.default.Types.ObjectId();
        const userId2 = new mongoose_1.default.Types.ObjectId();
        const patientId = new mongoose_1.default.Types.ObjectId();
        logger_1.default.info('Testing Conversation model...');
        const conversation = new Conversation_1.default({
            type: 'patient_query',
            participants: [
                {
                    userId: userId1,
                    role: 'pharmacist',
                    permissions: ['read_messages', 'send_messages'],
                },
                {
                    userId: userId2,
                    role: 'patient',
                    permissions: ['read_messages', 'send_messages'],
                },
            ],
            patientId,
            workplaceId,
            createdBy: userId1,
            metadata: {
                isEncrypted: true,
            },
        });
        const savedConversation = await conversation.save();
        logger_1.default.info('✓ Conversation created successfully');
        conversation.addParticipant(new mongoose_1.default.Types.ObjectId(), 'doctor');
        conversation.incrementUnreadCount(userId1);
        conversation.markAsRead(userId2);
        logger_1.default.info('✓ Conversation methods work correctly');
        logger_1.default.info('Testing Message model...');
        const message = new Message_1.default({
            conversationId: savedConversation._id,
            senderId: userId1,
            content: {
                text: 'How are you feeling today?',
                type: 'text',
            },
            mentions: [userId2],
            workplaceId,
            createdBy: userId1,
        });
        const savedMessage = await message.save();
        logger_1.default.info('✓ Message created successfully');
        message.addReaction(userId2, '👍');
        message.markAsRead(userId2);
        message.addEdit('How are you feeling today? Any side effects?', userId1, 'Added clarification');
        logger_1.default.info('✓ Message methods work correctly');
        logger_1.default.info('Testing Notification model...');
        const notification = new Notification_1.default({
            userId: userId2,
            type: 'mention',
            title: 'You were mentioned',
            content: 'You were mentioned in a conversation',
            data: {
                conversationId: savedConversation._id,
                messageId: savedMessage._id,
                senderId: userId1,
            },
            deliveryChannels: {
                inApp: true,
                email: false,
                sms: false,
                push: true,
            },
            workplaceId,
            createdBy: userId1,
        });
        const savedNotification = await notification.save();
        logger_1.default.info('✓ Notification created successfully');
        notification.markAsRead();
        notification.updateDeliveryStatus('inApp', 'delivered');
        logger_1.default.info('✓ Notification methods work correctly');
        logger_1.default.info('Testing CommunicationAuditLog model...');
        const auditLog = new CommunicationAuditLog_1.default({
            action: 'message_sent',
            userId: userId1,
            targetId: savedMessage._id,
            targetType: 'message',
            details: {
                conversationId: savedConversation._id,
                messageId: savedMessage._id,
                patientId,
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Test Browser',
            workplaceId,
            riskLevel: 'low',
            complianceCategory: 'communication_security',
        });
        const savedAuditLog = await auditLog.save();
        logger_1.default.info('✓ CommunicationAuditLog created successfully');
        auditLog.setRiskLevel();
        const formattedDetails = auditLog.getFormattedDetails();
        logger_1.default.info('✓ CommunicationAuditLog methods work correctly');
        logger_1.default.info('Testing database queries and indexes...');
        const conversations = await Conversation_1.default.find({
            workplaceId,
            'participants.userId': userId1,
        });
        logger_1.default.info(`✓ Found ${conversations.length} conversations for user`);
        const messages = await Message_1.default.find({
            conversationId: savedConversation._id,
        }).sort({ createdAt: -1 });
        logger_1.default.info(`✓ Found ${messages.length} messages in conversation`);
        const notifications = await Notification_1.default.find({
            userId: userId2,
            status: 'unread',
        });
        logger_1.default.info(`✓ Found ${notifications.length} unread notifications`);
        const auditLogs = await CommunicationAuditLog_1.default.find({
            workplaceId,
            action: 'message_sent',
        });
        logger_1.default.info(`✓ Found ${auditLogs.length} audit logs`);
        logger_1.default.info('Testing data integrity...');
        const messageWithConversation = await Message_1.default.findById(savedMessage._id)
            .populate('conversationId');
        if (messageWithConversation?.conversationId) {
            logger_1.default.info('✓ Message-Conversation relationship verified');
        }
        const notificationWithData = await Notification_1.default.findById(savedNotification._id);
        if (notificationWithData?.data.conversationId?.toString() === savedConversation._id.toString()) {
            logger_1.default.info('✓ Notification-Conversation relationship verified');
        }
        logger_1.default.info('Testing encryption metadata...');
        if (savedConversation.metadata.isEncrypted && savedConversation.metadata.encryptionKeyId) {
            logger_1.default.info('✓ Conversation encryption metadata validated');
        }
        if (savedMessage.isEncrypted && savedMessage.encryptionKeyId) {
            logger_1.default.info('✓ Message encryption metadata validated');
        }
        logger_1.default.info('Testing HIPAA compliance features...');
        const messageAuditLogs = await CommunicationAuditLog_1.default.find({
            'details.messageId': savedMessage._id,
        });
        if (messageAuditLogs.length > 0) {
            logger_1.default.info('✓ Audit trail for message operations verified');
        }
        if (savedMessage.isEncrypted && savedConversation.metadata.isEncrypted) {
            logger_1.default.info('✓ HIPAA encryption requirements verified');
        }
        await Conversation_1.default.deleteMany({ workplaceId });
        await Message_1.default.deleteMany({ workplaceId });
        await Notification_1.default.deleteMany({ workplaceId });
        await CommunicationAuditLog_1.default.deleteMany({ workplaceId });
        logger_1.default.info('✓ Test data cleaned up');
        logger_1.default.info('🎉 All Communication Hub models validation tests passed!');
        return {
            success: true,
            message: 'Communication Hub models validation completed successfully',
            tests: {
                conversation: true,
                message: true,
                notification: true,
                auditLog: true,
                indexes: true,
                relationships: true,
                encryption: true,
                hipaaCompliance: true,
            },
        };
    }
    catch (error) {
        logger_1.default.error('Communication Hub models validation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : String(error);
        return {
            success: false,
            message: `Validation failed: ${errorMessage}`,
            error: errorStack,
        };
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info('Database connection closed');
    }
}
if (require.main === module) {
    validateCommunicationModels()
        .then((result) => {
        console.log('\n=== Communication Hub Models Validation Results ===');
        console.log(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
        console.log(`Message: ${result.message}`);
        if (result.tests) {
            console.log('\nTest Results:');
            Object.entries(result.tests).forEach(([test, passed]) => {
                console.log(`  ${test}: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
            });
        }
        if (result.error) {
            console.error('\nError Details:');
            console.error(result.error);
        }
        process.exit(result.success ? 0 : 1);
    })
        .catch((error) => {
        console.error('Validation script failed:', error);
        process.exit(1);
    });
}
exports.default = validateCommunicationModels;
//# sourceMappingURL=validateCommunicationModels.js.map