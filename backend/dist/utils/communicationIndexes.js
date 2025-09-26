"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationIndexes = void 0;
exports.createCommunicationIndexes = createCommunicationIndexes;
exports.dropCommunicationIndexes = dropCommunicationIndexes;
exports.analyzeCommunicationIndexes = analyzeCommunicationIndexes;
exports.optimizeCommunicationIndexes = optimizeCommunicationIndexes;
exports.validateIndexPerformance = validateIndexPerformance;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
exports.communicationIndexes = [
    {
        collection: 'conversations',
        index: { workplaceId: 1, status: 1, lastMessageAt: -1 },
        options: { background: true },
        description: 'Workplace conversations ordered by recent activity'
    },
    {
        collection: 'conversations',
        index: { 'participants.userId': 1, workplaceId: 1, status: 1 },
        options: { background: true },
        description: 'User conversations within workplace'
    },
    {
        collection: 'conversations',
        index: { workplaceId: 1, type: 1, status: 1, priority: 1 },
        options: { background: true },
        description: 'Conversations by type and priority'
    },
    {
        collection: 'conversations',
        index: { workplaceId: 1, patientId: 1, status: 1 },
        options: { background: true, sparse: true },
        description: 'Patient-specific conversations'
    },
    {
        collection: 'conversations',
        index: { caseId: 1, workplaceId: 1 },
        options: { background: true, sparse: true },
        description: 'Case-specific conversations'
    },
    {
        collection: 'conversations',
        index: { tags: 1, workplaceId: 1, status: 1 },
        options: { background: true },
        description: 'Tagged conversations'
    },
    {
        collection: 'conversations',
        index: { createdBy: 1, workplaceId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Conversations created by user'
    },
    {
        collection: 'conversations',
        index: { 'metadata.clinicalContext.interventionIds': 1, workplaceId: 1 },
        options: { background: true, sparse: true },
        description: 'Intervention-linked conversations'
    },
    {
        collection: 'conversations',
        index: {
            title: 'text',
            'metadata.clinicalContext.diagnosis': 'text',
            'metadata.clinicalContext.conditions': 'text'
        },
        options: { background: true },
        description: 'Full-text search on conversations'
    },
    {
        collection: 'messages',
        index: { conversationId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Messages in conversation chronological order'
    },
    {
        collection: 'messages',
        index: { conversationId: 1, threadId: 1, createdAt: -1 },
        options: { background: true, sparse: true },
        description: 'Threaded messages in conversation'
    },
    {
        collection: 'messages',
        index: { senderId: 1, workplaceId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Messages sent by user'
    },
    {
        collection: 'messages',
        index: { workplaceId: 1, createdAt: -1 },
        options: { background: true },
        description: 'All workplace messages by time'
    },
    {
        collection: 'messages',
        index: { mentions: 1, workplaceId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Messages mentioning users'
    },
    {
        collection: 'messages',
        index: { status: 1, conversationId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Message status tracking'
    },
    {
        collection: 'messages',
        index: { priority: 1, workplaceId: 1, createdAt: -1 },
        options: { background: true },
        description: 'High priority messages'
    },
    {
        collection: 'messages',
        index: { 'content.type': 1, conversationId: 1, createdAt: -1 },
        options: { background: true },
        description: 'Messages by content type'
    },
    {
        collection: 'messages',
        index: { parentMessageId: 1, createdAt: 1 },
        options: { background: true, sparse: true },
        description: 'Message replies and threads'
    },
    {
        collection: 'messages',
        index: { conversationId: 1, status: 1, createdAt: -1 },
        options: { background: true },
        description: 'Conversation messages by status'
    },
    {
        collection: 'messages',
        index: { workplaceId: 1, senderId: 1, createdAt: -1 },
        options: { background: true },
        description: 'User message history'
    },
    {
        collection: 'messages',
        index: { workplaceId: 1, 'content.type': 1, createdAt: -1 },
        options: { background: true },
        description: 'Workplace messages by type'
    },
    {
        collection: 'messages',
        index: {
            'content.text': 'text',
            'content.metadata.originalText': 'text'
        },
        options: { background: true },
        description: 'Full-text search on message content'
    },
    {
        collection: 'messages',
        index: { 'readBy.userId': 1, conversationId: 1 },
        options: { background: true },
        description: 'Message read receipts'
    },
    {
        collection: 'notifications',
        index: { userId: 1, status: 1, createdAt: -1 },
        options: { background: true },
        description: 'User notifications by status'
    },
    {
        collection: 'notifications',
        index: { userId: 1, type: 1, status: 1, createdAt: -1 },
        options: { background: true },
        description: 'User notifications by type and status'
    },
    {
        collection: 'notifications',
        index: { workplaceId: 1, type: 1, priority: 1, createdAt: -1 },
        options: { background: true },
        description: 'Workplace notifications by type and priority'
    },
    {
        collection: 'notifications',
        index: { workplaceId: 1, status: 1, createdAt: -1 },
        options: { background: true },
        description: 'Workplace notifications by status'
    },
    {
        collection: 'notifications',
        index: { scheduledFor: 1, status: 1 },
        options: { background: true },
        description: 'Scheduled notifications for delivery'
    },
    {
        collection: 'notifications',
        index: { expiresAt: 1 },
        options: { background: true, expireAfterSeconds: 0 },
        description: 'TTL index for expired notifications'
    },
    {
        collection: 'notifications',
        index: { groupKey: 1, userId: 1, status: 1 },
        options: { background: true },
        description: 'Grouped notifications'
    },
    {
        collection: 'notifications',
        index: { batchId: 1, status: 1 },
        options: { background: true, sparse: true },
        description: 'Batch notification processing'
    },
    {
        collection: 'notifications',
        index: { 'data.conversationId': 1, userId: 1, status: 1 },
        options: { background: true, sparse: true },
        description: 'Conversation-related notifications'
    },
    {
        collection: 'notifications',
        index: { 'data.patientId': 1, userId: 1, status: 1 },
        options: { background: true, sparse: true },
        description: 'Patient-related notifications'
    },
    {
        collection: 'notifications',
        index: { userId: 1, priority: 1, status: 1, createdAt: -1 },
        options: { background: true },
        description: 'User notifications by priority'
    },
    {
        collection: 'notifications',
        index: { workplaceId: 1, type: 1, scheduledFor: 1 },
        options: { background: true },
        description: 'Scheduled workplace notifications'
    },
    {
        collection: 'notifications',
        index: { 'deliveryStatus.channel': 1, 'deliveryStatus.status': 1, scheduledFor: 1 },
        options: { background: true },
        description: 'Notification delivery status tracking'
    },
    {
        collection: 'communication_audit_logs',
        index: { workplaceId: 1, timestamp: -1 },
        options: { background: true },
        description: 'Workplace audit logs by time'
    },
    {
        collection: 'communication_audit_logs',
        index: { userId: 1, action: 1, timestamp: -1 },
        options: { background: true },
        description: 'User actions audit trail'
    },
    {
        collection: 'communication_audit_logs',
        index: { targetId: 1, targetType: 1, timestamp: -1 },
        options: { background: true },
        description: 'Audit logs for specific targets'
    },
    {
        collection: 'communication_audit_logs',
        index: { action: 1, workplaceId: 1, timestamp: -1 },
        options: { background: true },
        description: 'Actions across workplace'
    },
    {
        collection: 'communication_audit_logs',
        index: { riskLevel: 1, workplaceId: 1, timestamp: -1 },
        options: { background: true },
        description: 'High-risk activities'
    },
    {
        collection: 'communication_audit_logs',
        index: { complianceCategory: 1, workplaceId: 1, timestamp: -1 },
        options: { background: true },
        description: 'Compliance category audit'
    },
    {
        collection: 'communication_audit_logs',
        index: { success: 1, workplaceId: 1, timestamp: -1 },
        options: { background: true },
        description: 'Failed operations tracking'
    },
    {
        collection: 'communication_audit_logs',
        index: { sessionId: 1, timestamp: -1 },
        options: { background: true, sparse: true },
        description: 'Session-based audit trail'
    },
    {
        collection: 'communication_audit_logs',
        index: { workplaceId: 1, action: 1, success: 1, timestamp: -1 },
        options: { background: true },
        description: 'Workplace action success tracking'
    },
    {
        collection: 'communication_audit_logs',
        index: { userId: 1, riskLevel: 1, timestamp: -1 },
        options: { background: true },
        description: 'User risk assessment'
    },
    {
        collection: 'communication_audit_logs',
        index: { workplaceId: 1, complianceCategory: 1, timestamp: -1 },
        options: { background: true },
        description: 'Workplace compliance tracking'
    },
    {
        collection: 'communication_audit_logs',
        index: { 'details.conversationId': 1, timestamp: -1 },
        options: { background: true, sparse: true },
        description: 'Conversation audit trail'
    },
    {
        collection: 'communication_audit_logs',
        index: { 'details.patientId': 1, timestamp: -1 },
        options: { background: true, sparse: true },
        description: 'Patient-related audit trail'
    },
    {
        collection: 'communication_audit_logs',
        index: { timestamp: 1 },
        options: { background: true, expireAfterSeconds: 7 * 365 * 24 * 60 * 60 },
        description: 'TTL index for audit log retention'
    }
];
async function createCommunicationIndexes() {
    try {
        logger_1.default.info('Creating communication database indexes...');
        for (const indexDef of exports.communicationIndexes) {
            try {
                const collection = mongoose_1.default.connection.db.collection(indexDef.collection);
                const existingIndexes = await collection.indexes();
                const indexName = generateIndexName(indexDef.index);
                const indexExists = existingIndexes.some(idx => idx.name === indexName ||
                    JSON.stringify(idx.key) === JSON.stringify(indexDef.index));
                if (!indexExists) {
                    await collection.createIndex(indexDef.index, {
                        ...indexDef.options,
                        name: indexName
                    });
                    logger_1.default.info(`Created index: ${indexName} on ${indexDef.collection}`);
                }
                else {
                    logger_1.default.debug(`Index already exists: ${indexName} on ${indexDef.collection}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to create index on ${indexDef.collection}:`, error);
            }
        }
        logger_1.default.info('Communication database indexes creation completed');
    }
    catch (error) {
        logger_1.default.error('Error creating communication indexes:', error);
        throw error;
    }
}
async function dropCommunicationIndexes() {
    try {
        logger_1.default.info('Dropping communication database indexes...');
        const collections = ['conversations', 'messages', 'notifications', 'communication_audit_logs'];
        for (const collectionName of collections) {
            try {
                const collection = mongoose_1.default.connection.db.collection(collectionName);
                const indexes = await collection.indexes();
                const customIndexes = indexes.filter(idx => idx.name !== '_id_');
                for (const index of customIndexes) {
                    try {
                        await collection.dropIndex(index.name);
                        logger_1.default.info(`Dropped index: ${index.name} from ${collectionName}`);
                    }
                    catch (error) {
                        logger_1.default.warn(`Failed to drop index ${index.name} from ${collectionName}:`, error);
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to process collection ${collectionName}:`, error);
            }
        }
        logger_1.default.info('Communication database indexes drop completed');
    }
    catch (error) {
        logger_1.default.error('Error dropping communication indexes:', error);
        throw error;
    }
}
async function analyzeCommunicationIndexes() {
    try {
        logger_1.default.info('Analyzing communication database indexes...');
        const collections = ['conversations', 'messages', 'notifications', 'communication_audit_logs'];
        const analysis = {};
        for (const collectionName of collections) {
            try {
                const collection = mongoose_1.default.connection.db.collection(collectionName);
                const indexStats = await collection.aggregate([
                    { $indexStats: {} }
                ]).toArray();
                const collStats = await collection.stats();
                analysis[collectionName] = {
                    documentCount: collStats.count,
                    totalSize: collStats.size,
                    avgDocSize: collStats.avgObjSize,
                    indexes: indexStats.map(stat => ({
                        name: stat.name,
                        accesses: stat.accesses,
                        usageCount: stat.accesses?.ops || 0,
                        size: stat.spec ? Object.keys(stat.spec.key).length : 0
                    }))
                };
                logger_1.default.info(`Analyzed ${collectionName}: ${collStats.count} documents, ${indexStats.length} indexes`);
            }
            catch (error) {
                logger_1.default.error(`Failed to analyze collection ${collectionName}:`, error);
                analysis[collectionName] = { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
        return analysis;
    }
    catch (error) {
        logger_1.default.error('Error analyzing communication indexes:', error);
        throw error;
    }
}
async function optimizeCommunicationIndexes() {
    try {
        logger_1.default.info('Optimizing communication database indexes...');
        const analysis = await analyzeCommunicationIndexes();
        const unusedIndexes = [];
        for (const [collectionName, stats] of Object.entries(analysis)) {
            if (stats.indexes) {
                for (const index of stats.indexes) {
                    if (index.usageCount === 0 && index.name !== '_id_') {
                        unusedIndexes.push(`${collectionName}.${index.name}`);
                    }
                }
            }
        }
        if (unusedIndexes.length > 0) {
            logger_1.default.warn('Found unused indexes:', unusedIndexes);
        }
        const suggestions = generateIndexOptimizationSuggestions(analysis);
        if (suggestions.length > 0) {
            logger_1.default.info('Index optimization suggestions:', suggestions);
        }
        logger_1.default.info('Communication database index optimization completed');
    }
    catch (error) {
        logger_1.default.error('Error optimizing communication indexes:', error);
        throw error;
    }
}
function generateIndexName(indexSpec) {
    const parts = Object.entries(indexSpec).map(([field, direction]) => {
        if (direction === 'text') {
            return `${field}_text`;
        }
        return `${field}_${direction}`;
    });
    return parts.join('_');
}
function generateIndexOptimizationSuggestions(analysis) {
    const suggestions = [];
    for (const [collectionName, stats] of Object.entries(analysis)) {
        if (!stats.indexes)
            continue;
        const indexes = stats.indexes;
        const documentCount = stats.documentCount;
        if (collectionName === 'messages' && documentCount > 10000) {
            const messageIndexUsage = indexes.filter((idx) => idx.name.includes('conversationId') || idx.name.includes('senderId'));
            if (messageIndexUsage.length > 2) {
                suggestions.push(`Consider compound index on messages: { conversationId: 1, senderId: 1, createdAt: -1 } for user message queries`);
            }
        }
        if (collectionName === 'conversations') {
            suggestions.push(`Consider partial index on conversations.patientId with filter { patientId: { $exists: true } }`);
        }
        if (collectionName === 'notifications' && documentCount > 50000) {
            suggestions.push(`Consider shorter TTL for notifications or implement archiving strategy`);
        }
    }
    return suggestions;
}
async function validateIndexPerformance() {
    try {
        logger_1.default.info('Validating communication index performance...');
        const testQueries = [
            {
                collection: 'conversations',
                query: { workplaceId: new mongoose_1.default.Types.ObjectId(), status: 'active' },
                expectedIndexUsed: 'workplaceId_1_status_1_lastMessageAt_-1'
            },
            {
                collection: 'messages',
                query: { conversationId: new mongoose_1.default.Types.ObjectId() },
                expectedIndexUsed: 'conversationId_1_createdAt_-1'
            },
            {
                collection: 'notifications',
                query: { userId: new mongoose_1.default.Types.ObjectId(), status: 'unread' },
                expectedIndexUsed: 'userId_1_status_1_createdAt_-1'
            }
        ];
        let allTestsPassed = true;
        for (const test of testQueries) {
            try {
                const collection = mongoose_1.default.connection.db.collection(test.collection);
                const explanation = await collection.find(test.query).explain('executionStats');
                const indexUsed = explanation.executionStats?.executionStages?.indexName ||
                    explanation.executionStats?.inputStage?.indexName;
                if (!indexUsed || !indexUsed.includes(test.expectedIndexUsed.split('_')[0])) {
                    logger_1.default.warn(`Query on ${test.collection} not using expected index. Used: ${indexUsed}`);
                    allTestsPassed = false;
                }
                else {
                    logger_1.default.debug(`Query on ${test.collection} using index: ${indexUsed}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to validate query on ${test.collection}:`, error);
                allTestsPassed = false;
            }
        }
        logger_1.default.info(`Index performance validation ${allTestsPassed ? 'passed' : 'failed'}`);
        return allTestsPassed;
    }
    catch (error) {
        logger_1.default.error('Error validating index performance:', error);
        return false;
    }
}
exports.default = {
    createCommunicationIndexes,
    dropCommunicationIndexes,
    analyzeCommunicationIndexes,
    optimizeCommunicationIndexes,
    validateIndexPerformance,
    communicationIndexes: exports.communicationIndexes
};
//# sourceMappingURL=communicationIndexes.js.map