import { performanceMonitor } from '../utils/performanceMonitor';
import { communicationCache } from '../services/cacheService';
import { offlineStorage } from '../services/offlineStorageService';
import { Message, Conversation } from '../stores/types';

interface BenchmarkResult {
    name: string;
    duration: number;
    operations: number;
    opsPerSecond: number;
    memoryUsed?: number;
    success: boolean;
    error?: string;
}

interface BenchmarkSuite {
    name: string;
    results: BenchmarkResult[];
    totalDuration: number;
    averageOpsPerSecond: number;
}

/**
 * Performance benchmark suite for Communication Hub
 */
export class CommunicationBenchmark {
    private results: BenchmarkSuite[] = [];

    /**
     * Run all benchmarks
     */
    async runAll(): Promise<BenchmarkSuite[]> {
        console.log('🚀 Starting Communication Hub Performance Benchmarks...');

        this.results = [];

        await this.runCacheBenchmarks();
        await this.runOfflineStorageBenchmarks();
        await this.runVirtualizationBenchmarks();
        await this.runMessageProcessingBenchmarks();

        this.printSummary();
        return this.results;
    }

    /**
     * Cache performance benchmarks
     */
    private async runCacheBenchmarks(): Promise<void> {
        const suite: BenchmarkSuite = {
            name: 'Cache Performance',
            results: [],
            totalDuration: 0,
            averageOpsPerSecond: 0,
        };

        // Cache write performance
        suite.results.push(await this.benchmark(
            'Cache Write (1000 items)',
            1000,
            () => {
                const id = Math.random().toString(36);
                communicationCache.set(`test-${id}`, { id, data: 'test data' });
            }
        ));

        // Cache read performance
        const keys: string[] = [];
        for (let i = 0; i < 1000; i++) {
            const key = `read-test-${i}`;
            keys.push(key);
            communicationCache.set(key, { id: i, data: `test data ${i}` });
        }

        suite.results.push(await this.benchmark(
            'Cache Read (1000 items)',
            1000,
            () => {
                const key = keys[Math.floor(Math.random() * keys.length)];
                communicationCache.get(key);
            }
        ));

        // Cache conversation operations
        const conversations = this.generateTestConversations(100);
        suite.results.push(await this.benchmark(
            'Cache Conversations (100 items)',
            100,
            (index) => {
                communicationCache.cacheConversation(conversations[index]);
            }
        ));

        // Cache message operations
        const messages = this.generateTestMessages(500);
        suite.results.push(await this.benchmark(
            'Cache Messages (500 items)',
            500,
            (index) => {
                communicationCache.cacheMessage(messages[index]);
            }
        ));

        // Cache invalidation
        suite.results.push(await this.benchmark(
            'Cache Invalidation (100 conversations)',
            100,
            (index) => {
                communicationCache.invalidateConversation(`conv-${index}`);
            }
        ));

        this.calculateSuiteStats(suite);
        this.results.push(suite);
    }

    /**
     * Offline storage benchmarks
     */
    private async runOfflineStorageBenchmarks(): Promise<void> {
        const suite: BenchmarkSuite = {
            name: 'Offline Storage Performance',
            results: [],
            totalDuration: 0,
            averageOpsPerSecond: 0,
        };

        // Store conversations
        const conversations = this.generateTestConversations(50);
        suite.results.push(await this.benchmark(
            'Store Conversations (50 items)',
            50,
            async (index) => {
                await offlineStorage.storeConversation(conversations[index]);
            }
        ));

        // Store messages
        const messages = this.generateTestMessages(200);
        suite.results.push(await this.benchmark(
            'Store Messages (200 items)',
            200,
            async (index) => {
                await offlineStorage.storeMessage(messages[index]);
            }
        ));

        // Retrieve conversations
        suite.results.push(await this.benchmark(
            'Retrieve Conversations',
            10,
            async () => {
                await offlineStorage.getStoredConversations('test-workplace');
            }
        ));

        // Retrieve messages
        suite.results.push(await this.benchmark(
            'Retrieve Messages',
            10,
            async () => {
                await offlineStorage.getStoredMessages('test-conversation', 50);
            }
        ));

        this.calculateSuiteStats(suite);
        this.results.push(suite);
    }

    /**
     * Virtualization performance benchmarks
     */
    private async runVirtualizationBenchmarks(): Promise<void> {
        const suite: BenchmarkSuite = {
            name: 'Virtualization Performance',
            results: [],
            totalDuration: 0,
            averageOpsPerSecond: 0,
        };

        // Message list rendering simulation
        const largeMessageList = this.generateTestMessages(10000);
        suite.results.push(await this.benchmark(
            'Process Large Message List (10k items)',
            1,
            () => {
                // Simulate virtualization calculations
                const visibleStart = 0;
                const visibleEnd = 20;
                const visibleItems = largeMessageList.slice(visibleStart, visibleEnd);

                // Simulate item height calculations
                visibleItems.forEach(message => {
                    let height = 60;
                    if (message.content.text) {
                        height += Math.ceil(message.content.text.length / 50) * 20;
                    }
                    if (message.content.attachments?.length) {
                        height += message.content.attachments.length * 60;
                    }
                    return height;
                });
            }
        ));

        // Conversation list rendering simulation
        const largeConversationList = this.generateTestConversations(5000);
        suite.results.push(await this.benchmark(
            'Process Large Conversation List (5k items)',
            1,
            () => {
                const visibleStart = 0;
                const visibleEnd = 15;
                const visibleItems = largeConversationList.slice(visibleStart, visibleEnd);

                // Simulate conversation item processing
                visibleItems.forEach(conversation => {
                    const hasUnread = (conversation.unreadCount || 0) > 0;
                    const isUrgent = conversation.priority === 'urgent';
                    return { hasUnread, isUrgent };
                });
            }
        ));

        // Scroll performance simulation
        suite.results.push(await this.benchmark(
            'Scroll Performance Simulation',
            100,
            () => {
                // Simulate scroll calculations
                const scrollTop = Math.random() * 10000;
                const itemHeight = 80;
                const containerHeight = 600;

                const startIndex = Math.floor(scrollTop / itemHeight);
                const endIndex = Math.min(
                    startIndex + Math.ceil(containerHeight / itemHeight) + 5,
                    largeMessageList.length
                );

                return { startIndex, endIndex };
            }
        ));

        this.calculateSuiteStats(suite);
        this.results.push(suite);
    }

    /**
     * Message processing benchmarks
     */
    private async runMessageProcessingBenchmarks(): Promise<void> {
        const suite: BenchmarkSuite = {
            name: 'Message Processing Performance',
            results: [],
            totalDuration: 0,
            averageOpsPerSecond: 0,
        };

        // Message parsing and formatting
        const testMessages = this.generateTestMessages(1000);
        suite.results.push(await this.benchmark(
            'Message Text Processing (1000 messages)',
            1000,
            (index) => {
                const message = testMessages[index];

                // Simulate mention detection
                const mentionRegex = /@(\w+)/g;
                const mentions = [];
                let match;
                while ((match = mentionRegex.exec(message.content.text || '')) !== null) {
                    mentions.push(match[1]);
                }

                // Simulate text formatting
                const formattedText = (message.content.text || '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');

                return { mentions, formattedText };
            }
        ));

        // Message sorting and filtering
        suite.results.push(await this.benchmark(
            'Message Sorting (1000 messages)',
            10,
            () => {
                const sorted = [...testMessages].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return sorted.length;
            }
        ));

        // Message search simulation
        suite.results.push(await this.benchmark(
            'Message Search (1000 messages)',
            100,
            () => {
                const searchTerm = 'test';
                const results = testMessages.filter(message =>
                    message.content.text?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                return results.length;
            }
        ));

        // Reaction processing
        suite.results.push(await this.benchmark(
            'Reaction Processing (1000 operations)',
            1000,
            (index) => {
                const message = testMessages[index % testMessages.length];

                // Simulate reaction grouping
                const groupedReactions = message.reactions.reduce((acc, reaction) => {
                    if (!acc[reaction.emoji]) {
                        acc[reaction.emoji] = [];
                    }
                    acc[reaction.emoji].push(reaction);
                    return acc;
                }, {} as Record<string, typeof message.reactions>);

                return Object.keys(groupedReactions).length;
            }
        ));

        this.calculateSuiteStats(suite);
        this.results.push(suite);
    }

    /**
     * Run a single benchmark
     */
    private async benchmark(
        name: string,
        operations: number,
        operation: (index: number) => void | Promise<void>
    ): Promise<BenchmarkResult> {
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        try {
            const startTime = performance.now();

            for (let i = 0; i < operations; i++) {
                await operation(i);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;
            const opsPerSecond = (operations / duration) * 1000;

            const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
            const memoryUsed = endMemory - startMemory;

            return {
                name,
                duration,
                operations,
                opsPerSecond,
                memoryUsed,
                success: true,
            };
        } catch (error) {
            return {
                name,
                duration: 0,
                operations,
                opsPerSecond: 0,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Calculate suite statistics
     */
    private calculateSuiteStats(suite: BenchmarkSuite): void {
        suite.totalDuration = suite.results.reduce((sum, result) => sum + result.duration, 0);
        const successfulResults = suite.results.filter(r => r.success);
        suite.averageOpsPerSecond = successfulResults.length > 0
            ? successfulResults.reduce((sum, result) => sum + result.opsPerSecond, 0) / successfulResults.length
            : 0;
    }

    /**
     * Generate test conversations
     */
    private generateTestConversations(count: number): Conversation[] {
        return Array.from({ length: count }, (_, index) => ({
            _id: `conv-${index}`,
            title: `Test Conversation ${index}`,
            type: 'group' as const,
            participants: [
                {
                    userId: `user-${index % 3}`,
                    role: 'pharmacist' as const,
                    joinedAt: new Date().toISOString(),
                    permissions: [],
                },
            ],
            status: 'active' as const,
            priority: index % 10 === 0 ? 'urgent' as const : 'normal' as const,
            tags: [`tag-${index % 5}`],
            lastMessageAt: new Date(Date.now() - index * 60000).toISOString(),
            createdBy: 'user-1',
            workplaceId: 'test-workplace',
            metadata: {
                isEncrypted: false,
            },
            unreadCount: Math.floor(Math.random() * 10),
            createdAt: new Date(Date.now() - index * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - index * 60000).toISOString(),
        }));
    }

    /**
     * Generate test messages
     */
    private generateTestMessages(count: number): Message[] {
        const sampleTexts = [
            'Hello, how are you?',
            'Can you please review this patient case?',
            'The medication dosage needs to be adjusted.',
            'I have a question about the treatment plan.',
            'Thank you for your help with this case.',
            'Please check the lab results when you have a moment.',
            'The patient is responding well to the new medication.',
            'We need to schedule a follow-up appointment.',
            'I\'ve updated the patient\'s medical record.',
            'Can we discuss this case in our next meeting?',
        ];

        return Array.from({ length: count }, (_, index) => ({
            _id: `msg-${index}`,
            conversationId: `conv-${index % 10}`,
            senderId: `user-${index % 3}`,
            content: {
                text: sampleTexts[index % sampleTexts.length] + ` @user${(index + 1) % 3}`,
                type: 'text' as const,
                attachments: index % 5 === 0 ? [{
                    fileId: `file-${index}`,
                    fileName: `document-${index}.pdf`,
                    fileSize: 1024 * (index % 100 + 1),
                    mimeType: 'application/pdf',
                    secureUrl: `https://example.com/files/file-${index}`,
                }] : undefined,
            },
            status: 'sent' as const,
            priority: index % 20 === 0 ? 'urgent' as const : 'normal' as const,
            mentions: [`user-${(index + 1) % 3}`],
            reactions: index % 3 === 0 ? [{
                userId: `user-${index % 3}`,
                emoji: '👍',
                createdAt: new Date().toISOString(),
            }] : [],
            readBy: [],
            editHistory: [],
            isDeleted: false,
            createdAt: new Date(Date.now() - (count - index) * 60000).toISOString(),
            updatedAt: new Date(Date.now() - (count - index) * 60000).toISOString(),
        }));
    }

    /**
     * Print benchmark summary
     */
    private printSummary(): void {
        console.log('\n📊 Performance Benchmark Results');
        console.log('================================');

        this.results.forEach(suite => {
            console.log(`\n${suite.name}:`);
            console.log(`  Total Duration: ${suite.totalDuration.toFixed(2)}ms`);
            console.log(`  Average Ops/sec: ${suite.averageOpsPerSecond.toFixed(0)}`);

            suite.results.forEach(result => {
                const status = result.success ? '✅' : '❌';
                const opsPerSec = result.opsPerSecond.toFixed(0);
                const duration = result.duration.toFixed(2);

                console.log(`    ${status} ${result.name}: ${duration}ms (${opsPerSec} ops/sec)`);

                if (result.memoryUsed && result.memoryUsed > 0) {
                    const memoryMB = (result.memoryUsed / 1024 / 1024).toFixed(2);
                    console.log(`      Memory: +${memoryMB}MB`);
                }

                if (!result.success && result.error) {
                    console.log(`      Error: ${result.error}`);
                }
            });
        });

        // Overall summary
        const totalDuration = this.results.reduce((sum, suite) => sum + suite.totalDuration, 0);
        const totalTests = this.results.reduce((sum, suite) => sum + suite.results.length, 0);
        const successfulTests = this.results.reduce(
            (sum, suite) => sum + suite.results.filter(r => r.success).length,
            0
        );

        console.log('\n📈 Overall Summary:');
        console.log(`  Total Tests: ${totalTests}`);
        console.log(`  Successful: ${successfulTests}`);
        console.log(`  Failed: ${totalTests - successfulTests}`);
        console.log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
        console.log(`  Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    }

    /**
     * Export results to JSON
     */
    exportResults(): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            results: this.results,
        }, null, 2);
    }
}

// Export benchmark runner
export const runCommunicationBenchmarks = async (): Promise<BenchmarkSuite[]> => {
    const benchmark = new CommunicationBenchmark();
    return await benchmark.runAll();
};

// Auto-run benchmarks in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Add to window for manual execution
    (window as any).runCommunicationBenchmarks = runCommunicationBenchmarks;
}