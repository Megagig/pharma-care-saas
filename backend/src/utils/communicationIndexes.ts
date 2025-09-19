import mongoose from 'mongoose';
import logger from './logger';

/**
 * Communication Hub Database Indexes
 * Optimized indexes for high-performance queries in the communication system
 */

export interface IndexCreationResult {
    model: string;
    indexes: Array<{
        name: string;
        success: boolean;
        error?: string;
    }>;
}

export class CommunicationIndexManager {
    /**
     * Create all optimized indexes for communication models
     */
    static async createAllIndexes(): Promise<IndexCreationResult[]> {
        const results: IndexCreationResult[] = [];

        try {
            // Create indexes for each model
            results.push(await this.createConversationIndexes());
            results.push(await this.createMessageIndexes());
            results.push(await this.createNotificationIndexes());
            results.push(await this.createAuditLogIndexes());

            logger.info('Communication indexes creation completed', {
                totalModels: results.length,
                successfulModels: results.filter(r => r.indexes.every(i => i.success)).length,
            });

            return results;
        } catch (error) {
            logger.error('Failed to create communication indexes', { error });
            throw error;
        }
    }

    /**
     * Create optimized indexes for Conversation model
     */
    static async createConversationIndexes(): Promise<IndexCreationResult> {
        const model = 'Conversation';
        const indexes: Array<{ name: string; success: boolean; error?: string }> = [];

        try {
            const Conversation = mongoose.model('Conversation');

            // Performance-critical indexes
            const indexDefinitions = [
                // Primary query patterns
                {
                    fields: { workplaceId: 1, status: 1, lastMessageAt: -1 },
                    name: 'workplace_status_lastMessage',
                    options: { background: true }
                },
                {
                    fields: { 'participants.userId': 1, status: 1, lastMessageAt: -1 },
                    name: 'participant_status_lastMessage',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, patientId: 1, status: 1 },
                    name: 'workplace_patient_status',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, type: 1, status: 1 },
                    name: 'workplace_type_status',
                    options: { background: true }
                },

                // Search and filtering
                {
                    fields: { workplaceId: 1, priority: 1, status: 1 },
                    name: 'workplace_priority_status',
                    options: { background: true }
                },
                {
                    fields: { caseId: 1, workplaceId: 1 },
                    name: 'case_workplace',
                    options: { sparse: true, background: true }
                },
                {
                    fields: { tags: 1, workplaceId: 1 },
                    name: 'tags_workplace',
                    options: { background: true }
                },

                // Clinical context queries
                {
                    fields: { 'metadata.clinicalContext.interventionIds': 1 },
                    name: 'clinical_interventions',
                    options: { sparse: true, background: true }
                },

                // Audit and compliance
                {
                    fields: { createdBy: 1, workplaceId: 1 },
                    name: 'creator_workplace',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, createdAt: -1 },
                    name: 'workplace_created',
                    options: { background: true }
                },

                // Text search index
                {
                    fields: {
                        title: 'text',
                        'metadata.clinicalContext.diagnosis': 'text',
                        'metadata.clinicalContext.conditions': 'text'
                    },
                    name: 'conversation_text_search',
                    options: { background: true }
                }
            ];

            // Create each index
            for (const indexDef of indexDefinitions) {
                try {
                    await Conversation.collection.createIndex(indexDef.fields, {
                        name: indexDef.name,
                        ...indexDef.options
                    });
                    indexes.push({ name: indexDef.name, success: true });
                } catch (error: any) {
                    indexes.push({
                        name: indexDef.name,
                        success: false,
                        error: error.message
                    });
                }
            }

        } catch (error: any) {
            logger.error('Failed to create conversation indexes', { error: error.message });
        }

        return { model, indexes };
    }

    /**
     * Create optimized indexes for Message model
     */
    static async createMessageIndexes(): Promise<IndexCreationResult> {
        const model = 'Message';
        const indexes: Array<{ name: string; success: boolean; error?: string }> = [];

        try {
            const Message = mongoose.model('Message');

            const indexDefinitions = [
                // Primary query patterns
                {
                    fields: { conversationId: 1, createdAt: -1 },
                    name: 'conversation_created_desc',
                    options: { background: true }
                },
                {
                    fields: { conversationId: 1, threadId: 1, createdAt: -1 },
                    name: 'conversation_thread_created',
                    options: { background: true }
                },
                {
                    fields: { senderId: 1, createdAt: -1 },
                    name: 'sender_created',
                    options: { background: true }
                },

                // Workplace and tenancy
                {
                    fields: { workplaceId: 1, createdAt: -1 },
                    name: 'workplace_created',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, senderId: 1, createdAt: -1 },
                    name: 'workplace_sender_created',
                    options: { background: true }
                },

                // Message features
                {
                    fields: { mentions: 1, createdAt: -1 },
                    name: 'mentions_created',
                    options: { background: true }
                },
                {
                    fields: { status: 1, createdAt: -1 },
                    name: 'status_created',
                    options: { background: true }
                },
                {
                    fields: { priority: 1, createdAt: -1 },
                    name: 'priority_created',
                    options: { background: true }
                },

                // Content type queries
                {
                    fields: { 'content.type': 1, conversationId: 1 },
                    name: 'content_type_conversation',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, 'content.type': 1, createdAt: -1 },
                    name: 'workplace_content_type_created',
                    options: { background: true }
                },

                // Threading and replies
                {
                    fields: { parentMessageId: 1, createdAt: 1 },
                    name: 'parent_message_created',
                    options: { background: true }
                },

                // Compound indexes for complex queries
                {
                    fields: { conversationId: 1, status: 1, createdAt: -1 },
                    name: 'conversation_status_created',
                    options: { background: true }
                },

                // Text search index
                {
                    fields: {
                        'content.text': 'text',
                        'content.metadata.originalText': 'text'
                    },
                    name: 'message_text_search',
                    options: { background: true }
                }
            ];

            // Create each index
            for (const indexDef of indexDefinitions) {
                try {
                    await Message.collection.createIndex(indexDef.fields, {
                        name: indexDef.name,
                        ...indexDef.options
                    });
                    indexes.push({ name: indexDef.name, success: true });
                } catch (error: any) {
                    indexes.push({
                        name: indexDef.name,
                        success: false,
                        error: error.message
                    });
                }
            }

        } catch (error: any) {
            logger.error('Failed to create message indexes', { error: error.message });
        }

        return { model, indexes };
    }

    /**
     * Create optimized indexes for Notification model
     */
    static async createNotificationIndexes(): Promise<IndexCreationResult> {
        const model = 'Notification';
        const indexes: Array<{ name: string; success: boolean; error?: string }> = [];

        try {
            const Notification = mongoose.model('Notification');

            const indexDefinitions = [
                // Primary user queries
                {
                    fields: { userId: 1, status: 1, createdAt: -1 },
                    name: 'user_status_created',
                    options: { background: true }
                },
                {
                    fields: { userId: 1, type: 1, status: 1 },
                    name: 'user_type_status',
                    options: { background: true }
                },
                {
                    fields: { userId: 1, priority: 1, status: 1, createdAt: -1 },
                    name: 'user_priority_status_created',
                    options: { background: true }
                },

                // Workplace queries
                {
                    fields: { workplaceId: 1, type: 1, priority: 1 },
                    name: 'workplace_type_priority',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, status: 1, createdAt: -1 },
                    name: 'workplace_status_created',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, type: 1, scheduledFor: 1 },
                    name: 'workplace_type_scheduled',
                    options: { background: true }
                },

                // Scheduling and delivery
                {
                    fields: { scheduledFor: 1, status: 1 },
                    name: 'scheduled_status',
                    options: { background: true }
                },
                {
                    fields: { 'deliveryStatus.channel': 1, 'deliveryStatus.status': 1 },
                    name: 'delivery_channel_status',
                    options: { background: true }
                },

                // Grouping and batching
                {
                    fields: { groupKey: 1, userId: 1 },
                    name: 'group_user',
                    options: { background: true }
                },
                {
                    fields: { batchId: 1 },
                    name: 'batch_id',
                    options: { background: true }
                },

                // Data relationships
                {
                    fields: { 'data.conversationId': 1, userId: 1 },
                    name: 'conversation_user',
                    options: { background: true }
                },
                {
                    fields: { 'data.patientId': 1, userId: 1 },
                    name: 'patient_user',
                    options: { background: true }
                },

                // TTL index for expiration
                {
                    fields: { expiresAt: 1 },
                    name: 'expires_ttl',
                    options: { expireAfterSeconds: 0, background: true }
                }
            ];

            // Create each index
            for (const indexDef of indexDefinitions) {
                try {
                    await Notification.collection.createIndex(indexDef.fields, {
                        name: indexDef.name,
                        ...indexDef.options
                    });
                    indexes.push({ name: indexDef.name, success: true });
                } catch (error: any) {
                    indexes.push({
                        name: indexDef.name,
                        success: false,
                        error: error.message
                    });
                }
            }

        } catch (error: any) {
            logger.error('Failed to create notification indexes', { error: error.message });
        }

        return { model, indexes };
    }

    /**
     * Create optimized indexes for CommunicationAuditLog model
     */
    static async createAuditLogIndexes(): Promise<IndexCreationResult> {
        const model = 'CommunicationAuditLog';
        const indexes: Array<{ name: string; success: boolean; error?: string }> = [];

        try {
            const CommunicationAuditLog = mongoose.model('CommunicationAuditLog');

            const indexDefinitions = [
                // Primary audit queries
                {
                    fields: { workplaceId: 1, timestamp: -1 },
                    name: 'workplace_timestamp',
                    options: { background: true }
                },
                {
                    fields: { userId: 1, action: 1, timestamp: -1 },
                    name: 'user_action_timestamp',
                    options: { background: true }
                },
                {
                    fields: { targetId: 1, targetType: 1, timestamp: -1 },
                    name: 'target_timestamp',
                    options: { background: true }
                },

                // Risk and compliance
                {
                    fields: { riskLevel: 1, timestamp: -1 },
                    name: 'risk_timestamp',
                    options: { background: true }
                },
                {
                    fields: { complianceCategory: 1, timestamp: -1 },
                    name: 'compliance_timestamp',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, complianceCategory: 1, timestamp: -1 },
                    name: 'workplace_compliance_timestamp',
                    options: { background: true }
                },

                // Success and error tracking
                {
                    fields: { success: 1, timestamp: -1 },
                    name: 'success_timestamp',
                    options: { background: true }
                },
                {
                    fields: { workplaceId: 1, action: 1, success: 1, timestamp: -1 },
                    name: 'workplace_action_success_timestamp',
                    options: { background: true }
                },

                // Session and security
                {
                    fields: { sessionId: 1, timestamp: -1 },
                    name: 'session_timestamp',
                    options: { background: true }
                },
                {
                    fields: { userId: 1, riskLevel: 1, timestamp: -1 },
                    name: 'user_risk_timestamp',
                    options: { background: true }
                },

                // Conversation and message specific
                {
                    fields: { 'details.conversationId': 1, timestamp: -1 },
                    name: 'conversation_details_timestamp',
                    options: { background: true }
                },
                {
                    fields: { 'details.patientId': 1, timestamp: -1 },
                    name: 'patient_details_timestamp',
                    options: { background: true }
                },

                // TTL index for automatic cleanup (7 years retention)
                {
                    fields: { timestamp: 1 },
                    name: 'audit_retention_ttl',
                    options: {
                        expireAfterSeconds: 7 * 365 * 24 * 60 * 60, // 7 years
                        background: true
                    }
                }
            ];

            // Create each index
            for (const indexDef of indexDefinitions) {
                try {
                    await CommunicationAuditLog.collection.createIndex(indexDef.fields, {
                        name: indexDef.name,
                        ...indexDef.options
                    });
                    indexes.push({ name: indexDef.name, success: true });
                } catch (error: any) {
                    indexes.push({
                        name: indexDef.name,
                        success: false,
                        error: error.message
                    });
                }
            }

        } catch (error: any) {
            logger.error('Failed to create audit log indexes', { error: error.message });
        }

        return { model, indexes };
    }

    /**
     * Drop all communication indexes (for cleanup or recreation)
     */
    static async dropAllIndexes(): Promise<void> {
        try {
            const models = ['Conversation', 'Message', 'Notification', 'CommunicationAuditLog'];

            for (const modelName of models) {
                try {
                    const model = mongoose.model(modelName);
                    await model.collection.dropIndexes();
                    logger.info(`Dropped indexes for ${modelName}`);
                } catch (error: any) {
                    logger.warn(`Failed to drop indexes for ${modelName}`, { error: error.message });
                }
            }
        } catch (error) {
            logger.error('Failed to drop communication indexes', { error });
            throw error;
        }
    }

    /**
     * Get index statistics for performance monitoring
     */
    static async getIndexStats(): Promise<Record<string, any>> {
        try {
            const models = ['Conversation', 'Message', 'Notification', 'CommunicationAuditLog'];
            const stats: Record<string, any> = {};

            for (const modelName of models) {
                try {
                    const model = mongoose.model(modelName);
                    const indexStats = await model.collection.indexStats();
                    stats[modelName] = indexStats;
                } catch (error: any) {
                    stats[modelName] = { error: error.message };
                }
            }

            return stats;
        } catch (error) {
            logger.error('Failed to get index statistics', { error });
            throw error;
        }
    }

    /**
     * Validate index performance and suggest optimizations
     */
    static async validateIndexPerformance(): Promise<{
        model: string;
        recommendations: string[];
    }[]> {
        const recommendations: { model: string; recommendations: string[] }[] = [];

        try {
            const stats = await this.getIndexStats();

            for (const [modelName, modelStats] of Object.entries(stats)) {
                const modelRecommendations: string[] = [];

                if (modelStats.error) {
                    modelRecommendations.push(`Error getting stats: ${modelStats.error}`);
                } else if (Array.isArray(modelStats)) {
                    // Analyze index usage
                    const unusedIndexes = modelStats.filter((index: any) =>
                        index.accesses?.ops === 0 && index.name !== '_id_'
                    );

                    if (unusedIndexes.length > 0) {
                        modelRecommendations.push(
                            `Consider dropping unused indexes: ${unusedIndexes.map((i: any) => i.name).join(', ')}`
                        );
                    }

                    // Check for indexes with low selectivity
                    const lowSelectivityIndexes = modelStats.filter((index: any) =>
                        index.accesses?.ops > 0 &&
                        index.accesses?.since &&
                        (index.accesses.ops / (Date.now() - new Date(index.accesses.since).getTime())) < 0.001
                    );

                    if (lowSelectivityIndexes.length > 0) {
                        modelRecommendations.push(
                            `Low usage indexes detected: ${lowSelectivityIndexes.map((i: any) => i.name).join(', ')}`
                        );
                    }
                }

                recommendations.push({
                    model: modelName,
                    recommendations: modelRecommendations,
                });
            }

            return recommendations;
        } catch (error) {
            logger.error('Failed to validate index performance', { error });
            throw error;
        }
    }
}

export default CommunicationIndexManager;