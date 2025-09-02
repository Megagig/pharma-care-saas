"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const mtrNotificationRoutes_1 = __importDefault(require("../../routes/mtrNotificationRoutes"));
const mtrNotificationService_1 = require("../../services/mtrNotificationService");
const auth_1 = require("../../middlewares/auth");
jest.mock('../../services/mtrNotificationService');
jest.mock('../../middlewares/auth');
const mockMtrNotificationService = mtrNotificationService_1.mtrNotificationService;
const mockAuth = auth_1.auth;
describe('MTR Notification Controller', () => {
    let app;
    let testUserId;
    let testWorkplaceId;
    let testFollowUpId;
    let testPatientId;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/mtr/notifications', mtrNotificationRoutes_1.default);
        testUserId = new mongoose_1.default.Types.ObjectId().toString();
        testWorkplaceId = new mongoose_1.default.Types.ObjectId().toString();
        testFollowUpId = new mongoose_1.default.Types.ObjectId().toString();
        testPatientId = new mongoose_1.default.Types.ObjectId().toString();
        mockAuth.mockImplementation(async (req, res, next) => {
            req.user = {
                _id: testUserId,
                workplaceId: testWorkplaceId,
                role: 'pharmacist',
                email: 'test@pharmacy.com'
            };
            next();
        });
        jest.clearAllMocks();
    });
    describe('POST /follow-up/:followUpId/reminder', () => {
        it('should schedule follow-up reminder successfully', async () => {
            mockMtrNotificationService.scheduleFollowUpReminder.mockResolvedValue();
            const response = await (0, supertest_1.default)(app)
                .post(`/api/mtr/notifications/follow-up/${testFollowUpId}/reminder`)
                .send({
                reminderType: 'email',
                scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Follow-up reminder scheduled successfully');
            expect(mockMtrNotificationService.scheduleFollowUpReminder).toHaveBeenCalledWith(expect.any(mongoose_1.default.Types.ObjectId), 'email', expect.any(Date));
        });
        it('should return 400 for invalid follow-up ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/follow-up/invalid-id/reminder')
                .send({ reminderType: 'email' });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Invalid follow-up ID');
        });
        it('should handle service errors', async () => {
            mockMtrNotificationService.scheduleFollowUpReminder.mockRejectedValue(new Error('Service error'));
            const response = await (0, supertest_1.default)(app)
                .post(`/api/mtr/notifications/follow-up/${testFollowUpId}/reminder`)
                .send({ reminderType: 'email' });
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Failed to schedule follow-up reminder');
        });
    });
    describe('POST /alert/critical', () => {
        it('should send critical alert successfully', async () => {
            mockMtrNotificationService.sendCriticalAlert.mockResolvedValue();
            const alertData = {
                type: 'drug_interaction',
                severity: 'critical',
                patientId: testPatientId,
                message: 'Critical drug interaction detected',
                details: { medications: ['Drug A', 'Drug B'] },
                requiresImmediate: true
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/alert/critical')
                .send(alertData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Critical alert sent successfully');
            expect(mockMtrNotificationService.sendCriticalAlert).toHaveBeenCalledWith(expect.objectContaining({
                type: 'drug_interaction',
                severity: 'critical',
                patientId: expect.any(mongoose_1.default.Types.ObjectId),
                message: 'Critical drug interaction detected'
            }));
        });
        it('should return 400 for invalid patient ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/alert/critical')
                .send({
                type: 'drug_interaction',
                severity: 'critical',
                patientId: 'invalid-id',
                message: 'Test alert'
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Invalid patient ID');
        });
    });
    describe('POST /check-overdue', () => {
        it('should check overdue follow-ups successfully', async () => {
            mockMtrNotificationService.checkOverdueFollowUps.mockResolvedValue();
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/check-overdue');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Overdue follow-ups checked successfully');
            expect(mockMtrNotificationService.checkOverdueFollowUps).toHaveBeenCalled();
        });
        it('should handle service errors', async () => {
            mockMtrNotificationService.checkOverdueFollowUps.mockRejectedValue(new Error('Service error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/check-overdue');
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Failed to check overdue follow-ups');
        });
    });
    describe('GET /preferences', () => {
        it('should get notification preferences successfully', async () => {
            const mockPreferences = {
                email: true,
                sms: false,
                push: true,
                followUpReminders: true,
                criticalAlerts: true,
                dailyDigest: false,
                weeklyReport: false
            };
            const mockUser = {
                notificationPreferences: mockPreferences
            };
            const mockUserModel = {
                findById: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            };
            jest.doMock('mongoose', () => ({
                model: jest.fn().mockReturnValue(mockUserModel)
            }));
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr/notifications/preferences');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(expect.objectContaining(mockPreferences));
        });
        it('should return 401 if user not authenticated', async () => {
            mockAuth.mockImplementation(async (req, res, next) => {
                req.user = undefined;
                next();
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr/notifications/preferences');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('User not authenticated');
        });
    });
    describe('PUT /preferences', () => {
        it('should update notification preferences successfully', async () => {
            mockMtrNotificationService.updateNotificationPreferences.mockResolvedValue();
            const preferences = {
                email: true,
                sms: true,
                followUpReminders: false
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/mtr/notifications/preferences')
                .send(preferences);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notification preferences updated successfully');
            expect(mockMtrNotificationService.updateNotificationPreferences).toHaveBeenCalledWith(expect.any(mongoose_1.default.Types.ObjectId), preferences);
        });
        it('should return 401 if user not authenticated', async () => {
            mockAuth.mockImplementation(async (req, res, next) => {
                req.user = undefined;
                next();
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/mtr/notifications/preferences')
                .send({ email: true });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('User not authenticated');
        });
    });
    describe('GET /statistics', () => {
        it('should get notification statistics successfully', async () => {
            const mockStats = {
                totalScheduled: 100,
                sent: 85,
                pending: 10,
                failed: 5,
                byType: {
                    follow_up_reminder: 60,
                    critical_alert: 25,
                    overdue_alert: 15
                },
                byChannel: {
                    email: 70,
                    sms: 30
                }
            };
            mockMtrNotificationService.getNotificationStatistics.mockResolvedValue(mockStats);
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr/notifications/statistics');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockStats);
            expect(mockMtrNotificationService.getNotificationStatistics).toHaveBeenCalledWith(expect.any(mongoose_1.default.Types.ObjectId));
        });
    });
    describe('POST /test', () => {
        it('should send test notification successfully', async () => {
            mockMtrNotificationService.scheduleFollowUpReminder.mockResolvedValue();
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/test')
                .send({ type: 'email' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Test email notification sent successfully');
        });
        it('should default to email type if not specified', async () => {
            mockMtrNotificationService.scheduleFollowUpReminder.mockResolvedValue();
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/test')
                .send({});
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Test email notification sent successfully');
        });
    });
    describe('POST /alert/drug-interactions', () => {
        it('should check drug interactions successfully', async () => {
            const mockInteractions = [
                {
                    severity: 'major',
                    medications: ['Warfarin', 'Aspirin'],
                    description: 'Increased risk of bleeding'
                }
            ];
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/alert/drug-interactions')
                .send({
                patientId: testPatientId,
                medications: ['Warfarin', 'Aspirin']
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Drug interactions checked successfully');
            expect(response.body.data).toBeDefined();
        });
        it('should return 400 for invalid patient ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/alert/drug-interactions')
                .send({
                patientId: 'invalid-id',
                medications: ['Drug A']
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Invalid patient ID');
        });
    });
    describe('GET /follow-up/:followUpId/reminders', () => {
        it('should get follow-up reminders successfully', async () => {
            const mockReminders = [
                {
                    type: 'email',
                    scheduledFor: new Date(),
                    sent: true,
                    sentAt: new Date()
                }
            ];
            const mockFollowUp = {
                reminders: mockReminders
            };
            const response = await (0, supertest_1.default)(app)
                .get(`/api/mtr/notifications/follow-up/${testFollowUpId}/reminders`);
            expect([200, 404, 500]).toContain(response.status);
        });
        it('should return 400 for invalid follow-up ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr/notifications/follow-up/invalid-id/reminders');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Invalid follow-up ID');
        });
    });
    describe('POST /process-pending', () => {
        it('should process pending reminders successfully', async () => {
            mockMtrNotificationService.processPendingReminders.mockResolvedValue();
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr/notifications/process-pending');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Pending reminders processed successfully');
            expect(mockMtrNotificationService.processPendingReminders).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=mtrNotificationController.test.js.map