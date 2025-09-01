"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mtrNotificationService_1 = require("../../services/mtrNotificationService");
const MTRFollowUp_1 = __importDefault(require("../../models/MTRFollowUp"));
const User_1 = __importDefault(require("../../models/User"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const email_1 = require("../../utils/email");
const sms_1 = require("../../utils/sms");
jest.mock('../../utils/email');
jest.mock('../../utils/sms');
jest.mock('../../utils/logger');
const mockSendEmail = email_1.sendEmail;
const mockSendSMS = sms_1.sendSMS;
describe('MTRNotificationService', () => {
    let testWorkplaceId;
    let testUserId;
    let testPatientId;
    let testReviewId;
    let testFollowUpId;
    beforeEach(async () => {
        jest.clearAllMocks();
        testWorkplaceId = new mongoose_1.default.Types.ObjectId();
        testUserId = new mongoose_1.default.Types.ObjectId();
        testPatientId = new mongoose_1.default.Types.ObjectId();
        testReviewId = new mongoose_1.default.Types.ObjectId();
        testFollowUpId = new mongoose_1.default.Types.ObjectId();
        mockSendEmail.mockResolvedValue({ messageId: 'test-email-id' });
        mockSendSMS.mockResolvedValue({ sid: 'test-sms-id' });
    });
    describe('scheduleFollowUpReminder', () => {
        it('should schedule email reminder for follow-up', async () => {
            const mockFollowUp = {
                _id: testFollowUpId,
                assignedTo: {
                    _id: testUserId,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@test.com',
                    phone: '+2348012345678',
                    notificationPreferences: {
                        followUpReminders: true,
                        email: true,
                        sms: false
                    }
                },
                patientId: {
                    _id: testPatientId,
                    firstName: 'Jane',
                    lastName: 'Patient'
                },
                reviewId: {
                    _id: testReviewId,
                    reviewNumber: 'MTR-2024-001',
                    priority: 'routine'
                },
                type: 'phone_call',
                priority: 'medium',
                description: 'Follow-up call to check medication adherence',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                estimatedDuration: 30,
                reminders: [],
                save: jest.fn().mockResolvedValue(true)
            };
            jest.spyOn(MTRFollowUp_1.default, 'findById').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockFollowUp)
                    })
                })
            });
            await mtrNotificationService_1.mtrNotificationService.scheduleFollowUpReminder(testFollowUpId, 'email');
            expect(MTRFollowUp_1.default.findById).toHaveBeenCalledWith(testFollowUpId);
            expect(mockFollowUp.save).toHaveBeenCalled();
            expect(mockFollowUp.reminders).toHaveLength(1);
            expect(mockFollowUp.reminders[0].type).toBe('email');
        });
        it('should not schedule reminder if user has disabled follow-up reminders', async () => {
            const mockFollowUp = {
                _id: testFollowUpId,
                assignedTo: {
                    _id: testUserId,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@test.com',
                    notificationPreferences: {
                        followUpReminders: false
                    }
                },
                patientId: {
                    _id: testPatientId,
                    firstName: 'Jane',
                    lastName: 'Patient'
                },
                reviewId: {
                    _id: testReviewId,
                    reviewNumber: 'MTR-2024-001'
                },
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                reminders: [],
                save: jest.fn()
            };
            jest.spyOn(MTRFollowUp_1.default, 'findById').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockFollowUp)
                    })
                })
            });
            await mtrNotificationService_1.mtrNotificationService.scheduleFollowUpReminder(testFollowUpId);
            expect(mockFollowUp.save).not.toHaveBeenCalled();
            expect(mockFollowUp.reminders).toHaveLength(0);
        });
        it('should throw error if follow-up not found', async () => {
            jest.spyOn(MTRFollowUp_1.default, 'findById').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(null)
                    })
                })
            });
            await expect(mtrNotificationService_1.mtrNotificationService.scheduleFollowUpReminder(testFollowUpId)).rejects.toThrow('Follow-up not found');
        });
    });
    describe('sendCriticalAlert', () => {
        it('should send critical alert to all pharmacists in workplace', async () => {
            const mockPatient = {
                _id: testPatientId,
                firstName: 'Jane',
                lastName: 'Patient',
                mrn: 'MRN-12345',
                workplaceId: testWorkplaceId
            };
            const mockPharmacists = [
                {
                    _id: testUserId,
                    firstName: 'John',
                    lastName: 'Pharmacist',
                    email: 'john@pharmacy.com',
                    phone: '+2348012345679',
                    notificationPreferences: {
                        criticalAlerts: true,
                        email: true,
                        sms: true
                    }
                }
            ];
            jest.spyOn(Patient_1.default, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPatient)
            });
            jest.spyOn(User_1.default, 'find').mockResolvedValue(mockPharmacists);
            const alert = {
                type: 'drug_interaction',
                severity: 'critical',
                patientId: testPatientId,
                message: 'Critical drug interaction detected',
                details: { medications: ['Drug A', 'Drug B'] },
                requiresImmediate: true
            };
            await mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert);
            expect(Patient_1.default.findById).toHaveBeenCalledWith(testPatientId);
            expect(User_1.default.find).toHaveBeenCalledWith({
                workplaceId: testWorkplaceId,
                role: 'pharmacist',
                status: 'active',
                'notificationPreferences.criticalAlerts': { $ne: false }
            });
        });
        it('should throw error if patient not found', async () => {
            jest.spyOn(Patient_1.default, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });
            const alert = {
                type: 'drug_interaction',
                severity: 'critical',
                patientId: testPatientId,
                message: 'Test alert',
                details: {},
                requiresImmediate: false
            };
            await expect(mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert)).rejects.toThrow('Patient not found');
        });
    });
    describe('checkOverdueFollowUps', () => {
        it('should find and alert for overdue follow-ups', async () => {
            const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const mockOverdueFollowUps = [
                {
                    _id: testFollowUpId,
                    scheduledDate: overdueDate,
                    assignedTo: {
                        _id: testUserId,
                        firstName: 'John',
                        lastName: 'Pharmacist',
                        email: 'john@pharmacy.com',
                        notificationPreferences: { email: true }
                    },
                    patientId: {
                        _id: testPatientId,
                        firstName: 'Jane',
                        lastName: 'Patient',
                        mrn: 'MRN-12345'
                    },
                    reviewId: {
                        _id: testReviewId,
                        reviewNumber: 'MTR-2024-001',
                        priority: 'routine'
                    },
                    type: 'phone_call',
                    priority: 'medium',
                    reminders: [],
                    save: jest.fn().mockResolvedValue(true)
                }
            ];
            jest.spyOn(MTRFollowUp_1.default, 'find').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockOverdueFollowUps)
                    })
                })
            });
            await mtrNotificationService_1.mtrNotificationService.checkOverdueFollowUps();
            expect(MTRFollowUp_1.default.find).toHaveBeenCalledWith({
                status: { $in: ['scheduled', 'in_progress'] },
                scheduledDate: { $lt: expect.any(Date) }
            });
            expect(mockOverdueFollowUps[0].save).toHaveBeenCalled();
            expect(mockOverdueFollowUps[0].reminders).toHaveLength(1);
            expect(mockOverdueFollowUps[0].reminders[0].type).toBe('system');
        });
        it('should skip follow-ups that already have recent overdue alerts', async () => {
            const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentAlertDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
            const mockOverdueFollowUps = [
                {
                    _id: testFollowUpId,
                    scheduledDate: overdueDate,
                    assignedTo: {
                        _id: testUserId,
                        email: 'john@pharmacy.com'
                    },
                    patientId: {
                        _id: testPatientId,
                        firstName: 'Jane',
                        lastName: 'Patient'
                    },
                    reviewId: {
                        _id: testReviewId,
                        reviewNumber: 'MTR-2024-001'
                    },
                    reminders: [
                        {
                            type: 'system',
                            message: 'Follow-up overdue by 1 days',
                            scheduledFor: recentAlertDate
                        }
                    ],
                    save: jest.fn()
                }
            ];
            jest.spyOn(MTRFollowUp_1.default, 'find').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockOverdueFollowUps)
                    })
                })
            });
            await mtrNotificationService_1.mtrNotificationService.checkOverdueFollowUps();
            expect(mockOverdueFollowUps[0].save).not.toHaveBeenCalled();
        });
    });
    describe('updateNotificationPreferences', () => {
        it('should update user notification preferences', async () => {
            const preferences = {
                email: true,
                sms: false,
                followUpReminders: true,
                criticalAlerts: true
            };
            jest.spyOn(User_1.default, 'findByIdAndUpdate').mockResolvedValue({});
            await mtrNotificationService_1.mtrNotificationService.updateNotificationPreferences(testUserId, preferences);
            expect(User_1.default.findByIdAndUpdate).toHaveBeenCalledWith(testUserId, { $set: { notificationPreferences: preferences } }, { new: true });
        });
    });
    describe('processPendingReminders', () => {
        it('should process pending reminders that are due', async () => {
            const dueDate = new Date(Date.now() - 60 * 1000);
            const mockPendingFollowUps = [
                {
                    _id: testFollowUpId,
                    assignedTo: {
                        _id: testUserId,
                        email: 'john@pharmacy.com',
                        notificationPreferences: { followUpReminders: true }
                    },
                    reminders: [
                        {
                            type: 'email',
                            scheduledFor: dueDate,
                            sent: false,
                            sentAt: undefined
                        }
                    ],
                    save: jest.fn().mockResolvedValue(true)
                }
            ];
            jest.spyOn(MTRFollowUp_1.default, 'find').mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPendingFollowUps)
            });
            await mtrNotificationService_1.mtrNotificationService.processPendingReminders();
            expect(MTRFollowUp_1.default.find).toHaveBeenCalledWith({
                'reminders.sent': false,
                'reminders.scheduledFor': { $lte: expect.any(Date) },
                status: { $in: ['scheduled', 'in_progress'] }
            });
            expect(mockPendingFollowUps[0].reminders[0].sent).toBe(true);
            expect(mockPendingFollowUps[0].reminders[0].sentAt).toBeDefined();
            expect(mockPendingFollowUps[0].save).toHaveBeenCalled();
        });
    });
    describe('getNotificationStatistics', () => {
        it('should return notification statistics', async () => {
            const stats = await mtrNotificationService_1.mtrNotificationService.getNotificationStatistics();
            expect(stats).toHaveProperty('totalScheduled');
            expect(stats).toHaveProperty('sent');
            expect(stats).toHaveProperty('pending');
            expect(stats).toHaveProperty('failed');
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('byChannel');
        });
    });
});
//# sourceMappingURL=mtrNotificationService.test.js.map