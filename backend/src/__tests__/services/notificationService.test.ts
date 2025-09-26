import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { notificationService, CreateNotificationData } from '../../services/notificationService';
import Notification from '../../models/Notification';
import User from '../../models/User';
import Patient from '../../models/Patient';
import Conversation from '../../models/Conversation';
import Message from '../../models/Message';
import { sendEmail } from '../../utils/email';
import { sendSMS } from '../../utils/sms';

// Mock external dependencies
jest.mock('../../utils/email');
jest.mock('../../utils/sms');
jest.mock('../../utils/logger');

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const mockSendSMS = sendSMS as jest.MockedFunction<typeof sendSMS>;

describe('NotificationService', () => {
    let mongoServer: MongoMemoryServer;
    let io: SocketIOServer;
    let testWorkplaceId: mongoose.Types.ObjectId;
    let testUserId: mongoose.Types.ObjectId;
    let testPatientId: mongoose.Types.ObjectId;
    let testConversationId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Setup Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
        notificationService.setSocketServer(io);

        // Create test data
        testWorkplaceId = new mongoose.Types.ObjectId();
        testUserId = new mongoose.Types.ObjectId();
        testPatientId = new mongoose.Types.ObjectId();
        testConversationId = new mongoose.Types.ObjectId();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        io.close();
    });

    beforeEach(async () => {
        // Clear all collections
        await Notification.deleteMany({});
        await User.deleteMany({});
        await Patient.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});

        // Reset mocks
        jest.clearAllMocks();
        mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-email-id' });
        mockSendSMS.mockResolvedValue({ sid: 'test-sms-id', status: 'delivered' });
    });

    describe('createNotification', () => {
        it('should create a notification with default settings', async () => {
            const notificationData: CreateNotificationData = {
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'This is a test notification',
                data: {
                    conversationId: testConversationId,
                },
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            };

            const notification = await notificationService.createNotification(notificationData);

            expect(notification).toBeDefined();
            expect(notification.userId).toEqual(testUserId);
            expect(notification.type).toBe('new_message');
            expect(notification.title).toBe('Test Notification');
            expect(notification.content).toBe('This is a test notification');
            expect(notification.priority).toBe('normal');
            expect(notification.status).toBe('unread');
        });

        it('should apply user preferences to delivery channels', async () => {
            // Create user with specific preferences
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
                notificationPreferences: {
                    email: false,
                    sms: true,
                    newMessage: true,
                },
            });

            const notificationData: CreateNotificationData = {
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'This is a test notification',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            };

            const notification = await notificationService.createNotification(notificationData);

            expect(notification.deliveryChannels.email).toBe(false);
            expect(notification.deliveryChannels.sms).toBe(true);
            expect(notification.deliveryChannels.inApp).toBe(true); // Default
        });

        it('should schedule notification for quiet hours', async () => {
            // Create user with quiet hours enabled
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
                notificationPreferences: {
                    quietHours: {
                        enabled: true,
                        startTime: '22:00',
                        endTime: '08:00',
                        timezone: 'UTC',
                    },
                },
            });

            // Mock current time to be in quiet hours
            const originalDate = Date;
            const mockDate = new Date('2023-01-01T23:00:00Z'); // 11 PM UTC
            global.Date = jest.fn(() => mockDate) as any;
            global.Date.now = jest.fn(() => mockDate.getTime());

            const notificationData: CreateNotificationData = {
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'This is a test notification',
                data: {},
                priority: 'normal', // Not urgent
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            };

            const notification = await notificationService.createNotification(notificationData);

            expect(notification.scheduledFor).toBeDefined();
            expect(notification.scheduledFor!.getTime()).toBeGreaterThan(mockDate.getTime());

            // Restore original Date
            global.Date = originalDate;
        });

        it('should not schedule urgent notifications during quiet hours', async () => {
            // Create user with quiet hours enabled
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
                notificationPreferences: {
                    quietHours: {
                        enabled: true,
                        startTime: '22:00',
                        endTime: '08:00',
                        timezone: 'UTC',
                    },
                },
            });

            const notificationData: CreateNotificationData = {
                userId: testUserId,
                type: 'urgent_message',
                title: 'Urgent Notification',
                content: 'This is an urgent notification',
                data: {},
                priority: 'urgent',
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            };

            const notification = await notificationService.createNotification(notificationData);

            expect(notification.scheduledFor).toBeUndefined();
        });
    });

    describe('sendRealTimeNotification', () => {
        it('should emit notification to user sockets', async () => {
            const mockSocket = {
                id: 'socket-123',
                data: { userId: testUserId.toString() },
            };

            // Mock Socket.IO methods
            io.fetchSockets = jest.fn().mockResolvedValue([mockSocket]);
            io.to = jest.fn().mockReturnValue({
                emit: jest.fn(),
            });

            const notification = new Notification({
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'Test content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await notificationService.sendRealTimeNotification(testUserId.toString(), notification);

            expect(io.to).toHaveBeenCalledWith('socket-123');
        });
    });

    describe('sendEmailNotification', () => {
        it('should send email notification successfully', async () => {
            // Create user with email
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            const notification = new Notification({
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'Test content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await notificationService.sendEmailNotification(testUserId.toString(), notification);

            expect(mockSendEmail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: expect.stringContaining('Test Notification'),
                html: expect.any(String),
                text: expect.any(String),
            });
        });

        it('should handle email sending failure', async () => {
            // Create user with email
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            // Mock email failure
            mockSendEmail.mockRejectedValue(new Error('Email service unavailable'));

            const notification = new Notification({
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'Test content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await expect(
                notificationService.sendEmailNotification(testUserId.toString(), notification)
            ).rejects.toThrow('Email service unavailable');
        });
    });

    describe('sendSMSNotification', () => {
        it('should send SMS notification successfully', async () => {
            // Create user with phone
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                phone: '+1234567890',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            const notification = new Notification({
                userId: testUserId,
                type: 'urgent_message',
                title: 'Urgent Notification',
                content: 'Urgent content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await notificationService.sendSMSNotification(testUserId.toString(), notification);

            expect(mockSendSMS).toHaveBeenCalledWith(
                '+1234567890',
                expect.stringContaining('Urgent content')
            );
        });

        it('should throw error when user has no phone number', async () => {
            // Create user without phone
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            const notification = new Notification({
                userId: testUserId,
                type: 'urgent_message',
                title: 'Urgent Notification',
                content: 'Urgent content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await expect(
                notificationService.sendSMSNotification(testUserId.toString(), notification)
            ).rejects.toThrow('User phone number not found');
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const notification = await Notification.create({
                userId: testUserId,
                type: 'new_message',
                title: 'Test Notification',
                content: 'Test content',
                data: {},
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await notificationService.markAsRead(notification._id.toString(), testUserId.toString());

            const updatedNotification = await Notification.findById(notification._id);
            expect(updatedNotification!.status).toBe('read');
            expect(updatedNotification!.readAt).toBeDefined();
        });

        it('should throw error for non-existent notification', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            await expect(
                notificationService.markAsRead(nonExistentId, testUserId.toString())
            ).rejects.toThrow('Notification not found');
        });
    });

    describe('getUserNotifications', () => {
        beforeEach(async () => {
            // Create test notifications
            await Notification.create([
                {
                    userId: testUserId,
                    type: 'new_message',
                    title: 'Message 1',
                    content: 'Content 1',
                    data: {},
                    priority: 'high',
                    status: 'unread',
                    workplaceId: testWorkplaceId,
                    createdBy: testUserId,
                },
                {
                    userId: testUserId,
                    type: 'mention',
                    title: 'Message 2',
                    content: 'Content 2',
                    data: {},
                    priority: 'normal',
                    status: 'read',
                    workplaceId: testWorkplaceId,
                    createdBy: testUserId,
                },
                {
                    userId: testUserId,
                    type: 'clinical_alert',
                    title: 'Alert 1',
                    content: 'Alert content',
                    data: {},
                    priority: 'urgent',
                    status: 'unread',
                    workplaceId: testWorkplaceId,
                    createdBy: testUserId,
                },
            ]);
        });

        it('should get all user notifications', async () => {
            const result = await notificationService.getUserNotifications(
                testUserId.toString(),
                testWorkplaceId.toString()
            );

            expect(result.notifications).toHaveLength(3);
            expect(result.total).toBe(3);
            expect(result.unreadCount).toBe(2);
        });

        it('should filter notifications by type', async () => {
            const result = await notificationService.getUserNotifications(
                testUserId.toString(),
                testWorkplaceId.toString(),
                { type: 'new_message' }
            );

            expect(result.notifications).toHaveLength(1);
            expect(result.notifications[0].type).toBe('new_message');
        });

        it('should filter notifications by status', async () => {
            const result = await notificationService.getUserNotifications(
                testUserId.toString(),
                testWorkplaceId.toString(),
                { status: 'unread' }
            );

            expect(result.notifications).toHaveLength(2);
            expect(result.notifications.every(n => n.status === 'unread')).toBe(true);
        });

        it('should limit and paginate results', async () => {
            const result = await notificationService.getUserNotifications(
                testUserId.toString(),
                testWorkplaceId.toString(),
                { limit: 2, offset: 1 }
            );

            expect(result.notifications).toHaveLength(2);
            expect(result.total).toBe(3);
        });
    });

    describe('createConversationNotification', () => {
        beforeEach(async () => {
            // Create test data
            await User.create({
                _id: testUserId,
                email: 'sender@example.com',
                firstName: 'Sender',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            await Patient.create({
                _id: testPatientId,
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'MRN123',
                workplaceId: testWorkplaceId,
            });

            await Conversation.create({
                _id: testConversationId,
                type: 'patient_query',
                participants: [
                    { userId: testUserId, role: 'pharmacist' },
                ],
                patientId: testPatientId,
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });
        });

        it('should create new message notification', async () => {
            const recipientId = new mongoose.Types.ObjectId();

            const notifications = await notificationService.createConversationNotification(
                'new_message',
                testConversationId.toString(),
                testUserId.toString(),
                [recipientId.toString()],
                undefined,
                'Hello, this is a test message'
            );

            expect(notifications).toHaveLength(1);
            expect(notifications[0].type).toBe('new_message');
            expect(notifications[0].title).toContain('Sender User');
            expect(notifications[0].data.conversationId).toEqual(testConversationId);
        });

        it('should create mention notification with high priority', async () => {
            const recipientId = new mongoose.Types.ObjectId();

            const notifications = await notificationService.createConversationNotification(
                'mention',
                testConversationId.toString(),
                testUserId.toString(),
                [recipientId.toString()],
                undefined,
                '@recipient please review this'
            );

            expect(notifications).toHaveLength(1);
            expect(notifications[0].type).toBe('mention');
            expect(notifications[0].priority).toBe('high');
            expect(notifications[0].title).toContain('mentioned');
        });

        it('should skip notification to sender', async () => {
            const notifications = await notificationService.createConversationNotification(
                'new_message',
                testConversationId.toString(),
                testUserId.toString(),
                [testUserId.toString()], // Same as sender
                undefined,
                'Self message'
            );

            expect(notifications).toHaveLength(0);
        });
    });

    describe('createPatientQueryNotification', () => {
        beforeEach(async () => {
            await Patient.create({
                _id: testPatientId,
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'MRN123',
                workplaceId: testWorkplaceId,
            });

            await Conversation.create({
                _id: testConversationId,
                type: 'patient_query',
                participants: [],
                patientId: testPatientId,
                workplaceId: testWorkplaceId,
                createdBy: testPatientId,
            });
        });

        it('should create patient query notification', async () => {
            const recipientId = new mongoose.Types.ObjectId();
            const messageContent = 'I have a question about my medication dosage. Can you help me understand when I should take it?';

            const notifications = await notificationService.createPatientQueryNotification(
                testPatientId.toString(),
                testConversationId.toString(),
                messageContent,
                [recipientId.toString()]
            );

            expect(notifications).toHaveLength(1);
            expect(notifications[0].type).toBe('patient_query');
            expect(notifications[0].priority).toBe('high');
            expect(notifications[0].title).toContain('Test Patient');
            expect(notifications[0].content).toContain('MRN123');
            expect(notifications[0].data.patientId).toEqual(testPatientId);
            expect(notifications[0].data.metadata.patientMRN).toBe('MRN123');
        });

        it('should truncate long message content in notification', async () => {
            const recipientId = new mongoose.Types.ObjectId();
            const longMessage = 'A'.repeat(150); // Long message

            const notifications = await notificationService.createPatientQueryNotification(
                testPatientId.toString(),
                testConversationId.toString(),
                longMessage,
                [recipientId.toString()]
            );

            expect(notifications[0].content).toContain('...');
            expect(notifications[0].content.length).toBeLessThan(longMessage.length + 100);
        });
    });

    describe('processScheduledNotifications', () => {
        it('should process scheduled notifications that are due', async () => {
            const pastDate = new Date(Date.now() - 60000); // 1 minute ago

            await Notification.create({
                userId: testUserId,
                type: 'system_notification',
                title: 'Scheduled Notification',
                content: 'This was scheduled',
                data: {},
                scheduledFor: pastDate,
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            await notificationService.processScheduledNotifications();

            const notification = await Notification.findOne({ title: 'Scheduled Notification' });
            expect(notification!.sentAt).toBeDefined();
        });
    });

    describe('retryFailedNotifications', () => {
        it('should retry failed notifications within retry limit', async () => {
            const notification = await Notification.create({
                userId: testUserId,
                type: 'new_message',
                title: 'Failed Notification',
                content: 'This failed to send',
                data: {},
                deliveryStatus: [{
                    channel: 'email',
                    status: 'failed',
                    attempts: 2,
                    failureReason: 'SMTP error',
                }],
                workplaceId: testWorkplaceId,
                createdBy: testUserId,
            });

            // Create user for retry
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            await notificationService.retryFailedNotifications();

            expect(mockSendEmail).toHaveBeenCalled();
        });
    });

    describe('notification preferences', () => {
        it('should get default preferences for user without preferences', async () => {
            const preferences = await notificationService.getNotificationPreferences(testUserId.toString());

            expect(preferences.inApp).toBe(true);
            expect(preferences.email).toBe(true);
            expect(preferences.newMessage).toBe(true);
            expect(preferences.quietHours.enabled).toBe(false);
        });

        it('should update user notification preferences', async () => {
            await User.create({
                _id: testUserId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'pharmacist',
                workplaceId: testWorkplaceId,
            });

            const newPreferences = {
                email: false,
                sms: true,
                newMessage: false,
                quietHours: {
                    enabled: true,
                    startTime: '23:00',
                    endTime: '07:00',
                    timezone: 'America/New_York',
                },
            };

            await notificationService.updateNotificationPreferences(testUserId.toString(), newPreferences);

            const user = await User.findById(testUserId);
            expect(user!.notificationPreferences.email).toBe(false);
            expect(user!.notificationPreferences.sms).toBe(true);
            expect(user!.notificationPreferences.quietHours.enabled).toBe(true);
        });
    });
});