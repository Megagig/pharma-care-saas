/**
 * CalendarService Unit Tests
 * Tests for calendar views, slot calculations, and capacity metrics
 */

/// <reference types="jest" />

import mongoose from 'mongoose';
import { CalendarService } from '../../services/CalendarService';
import Appointment from '../../models/Appointment';
import PharmacistSchedule from '../../models/PharmacistSchedule';
import User from '../../models/User';

// Mock dependencies
jest.mock('../../models/Appointment');
jest.mock('../../models/PharmacistSchedule');
jest.mock('../../models/User');
jest.mock('../../utils/logger');

// Type the mocked modules
const MockedAppointment = Appointment as jest.Mocked<typeof Appointment>;
const MockedPharmacistSchedule = PharmacistSchedule as jest.Mocked<typeof PharmacistSchedule>;
const MockedUser = User as jest.Mocked<typeof User>;

describe('CalendarService', () => {
  const mockWorkplaceId = new mongoose.Types.ObjectId();
  const mockPharmacistId = new mongoose.Types.ObjectId();
  const mockPatientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCalendarView', () => {
    const mockDate = new Date('2025-10-25');

    it('should get day view with appointments', async () => {
      const mockAppointments = [
        {
          _id: new mongoose.Types.ObjectId(),
          workplaceId: mockWorkplaceId,
          patientId: mockPatientId,
          assignedTo: mockPharmacistId,
          type: 'mtm_session',
          title: 'MTM Session - John Doe',
          scheduledDate: mockDate,
          scheduledTime: '10:00',
          duration: 30,
          status: 'scheduled',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          workplaceId: mockWorkplaceId,
          patientId: mockPatientId,
          assignedTo: mockPharmacistId,
          type: 'health_check',
          title: 'Health Check - Jane Smith',
          scheduledDate: mockDate,
          scheduledTime: '14:00',
          duration: 30,
          status: 'confirmed',
        },
      ];

      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAppointments),
      });

      const result = await CalendarService.getCalendarView(
        'day',
        mockDate,
        {},
        mockWorkplaceId
      );

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('summary');
      expect((result as any).appointments).toHaveLength(2);
      expect((result as any).summary.total).toBe(2);
      expect((result as any).summary.byStatus).toEqual({
        scheduled: 1,
        confirmed: 1,
      });
    });

    it('should get week view with daily groupings', async () => {
      const mockAppointments = [
        {
          _id: new mongoose.Types.ObjectId(),
          scheduledDate: new Date('2025-10-20'),
          scheduledTime: '10:00',
          status: 'scheduled',
          type: 'mtm_session',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          scheduledDate: new Date('2025-10-22'),
          scheduledTime: '14:00',
          status: 'confirmed',
          type: 'health_check',
        },
      ];

      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAppointments),
      });

      const result = await CalendarService.getCalendarView(
        'week',
        mockDate,
        {},
        mockWorkplaceId
      );

      expect(result).toHaveProperty('weekStart');
      expect(result).toHaveProperty('weekEnd');
      expect(result).toHaveProperty('days');
      expect(result).toHaveProperty('summary');
      expect((result as any).days).toHaveLength(7);
    });

    it('should get month view with weekly groupings', async () => {
      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      const result = await CalendarService.getCalendarView(
        'month',
        mockDate,
        {},
        mockWorkplaceId
      );

      expect(result).toHaveProperty('monthStart');
      expect(result).toHaveProperty('monthEnd');
      expect(result).toHaveProperty('weeks');
      expect(result).toHaveProperty('summary');
      expect((result as any).weeks.length).toBeGreaterThan(0);
    });

    it('should filter appointments by pharmacist', async () => {
      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await CalendarService.getCalendarView(
        'day',
        mockDate,
        { pharmacistId: mockPharmacistId },
        mockWorkplaceId
      );

      expect(Appointment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedTo: mockPharmacistId,
        })
      );
    });
  });

  describe('calculateAvailableSlots', () => {
    const mockDate = new Date('2025-10-25');

    const mockSchedule = {
      _id: new mongoose.Types.ObjectId(),
      pharmacistId: mockPharmacistId,
      workplaceId: mockWorkplaceId,
      isWorkingOn: jest.fn().mockReturnValue(true),
      getShiftsForDate: jest.fn().mockReturnValue([
        {
          startTime: '09:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
        },
      ]),
      canHandleAppointmentType: jest.fn().mockReturnValue(true),
      appointmentPreferences: {
        bufferBetweenAppointments: 5,
        defaultDuration: 30,
        appointmentTypes: ['mtm_session', 'health_check'],
      },
    };

    beforeEach(() => {
      (PharmacistSchedule.findCurrentSchedule as jest.Mock).mockResolvedValue(mockSchedule);
    });

    it('should calculate available slots for a working day', async () => {
      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId
      );

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('time');
      expect(slots[0]).toHaveProperty('available');
      expect(slots[0]).toHaveProperty('pharmacistId');
    });

    it('should mark break times as unavailable', async () => {
      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId
      );

      const breakSlots = slots.filter(slot => slot.isBreak);
      expect(breakSlots.length).toBeGreaterThan(0);
      expect(breakSlots.every(slot => !slot.available)).toBe(true);
    });

    it('should mark conflicting slots as unavailable', async () => {
      const existingAppointment = {
        _id: new mongoose.Types.ObjectId(),
        scheduledDate: mockDate,
        scheduledTime: '10:00',
        duration: 30,
        get: jest.fn((field: string) => {
          if (field === 'appointmentDateTime') {
            const dt = new Date(mockDate);
            dt.setHours(10, 0, 0, 0);
            return dt;
          }
          if (field === 'endDateTime') {
            const dt = new Date(mockDate);
            dt.setHours(10, 30, 0, 0);
            return dt;
          }
          return null;
        }),
      };

      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([existingAppointment]),
      });

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId
      );

      const conflictingSlot = slots.find(slot => slot.time === '10:00');
      expect(conflictingSlot?.available).toBe(false);
      expect(conflictingSlot?.conflictingAppointment).toBeDefined();
    });

    it('should return empty array for non-working days', async () => {
      mockSchedule.isWorkingOn.mockReturnValue(false);

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId
      );

      expect(slots).toEqual([]);
    });

    it('should return empty array if pharmacist cannot handle appointment type', async () => {
      mockSchedule.canHandleAppointmentType.mockReturnValue(false);

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId,
        'vaccination'
      );

      expect(slots).toEqual([]);
    });

    it('should respect buffer time between appointments', async () => {
      const existingAppointment = {
        _id: new mongoose.Types.ObjectId(),
        scheduledDate: mockDate,
        scheduledTime: '10:00',
        duration: 30,
        get: jest.fn((field: string) => {
          if (field === 'appointmentDateTime') {
            const dt = new Date(mockDate);
            dt.setHours(10, 0, 0, 0);
            return dt;
          }
          if (field === 'endDateTime') {
            const dt = new Date(mockDate);
            dt.setHours(10, 30, 0, 0);
            return dt;
          }
          return null;
        }),
      };

      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([existingAppointment]),
      });

      const slots = await CalendarService.calculateAvailableSlots(
        mockPharmacistId,
        mockDate,
        30,
        mockWorkplaceId
      );

      // Slot at 10:30 should also be unavailable due to 5-minute buffer
      const bufferSlot = slots.find(slot => slot.time === '10:30');
      expect(bufferSlot?.available).toBe(false);
    });
  });

  describe('getPharmacistAvailability', () => {
    const mockDate = new Date('2025-10-25');

    const mockPharmacist = {
      _id: mockPharmacistId,
      name: 'Dr. John Smith',
      role: 'pharmacist',
    };

    const mockSchedule = {
      _id: new mongoose.Types.ObjectId(),
      pharmacistId: mockPharmacistId,
      workplaceId: mockWorkplaceId,
      isWorkingOn: jest.fn().mockReturnValue(true),
      getShiftsForDate: jest.fn().mockReturnValue([
        {
          startTime: '09:00',
          endTime: '17:00',
        },
      ]),
      appointmentPreferences: {
        defaultDuration: 30,
        appointmentTypes: ['mtm_session'],
        bufferBetweenAppointments: 0,
      },
    };

    beforeEach(() => {
      (User.findById as jest.Mock).mockResolvedValue(mockPharmacist);
      (PharmacistSchedule.findCurrentSchedule as jest.Mock).mockResolvedValue(mockSchedule);
      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });
    });

    it('should get pharmacist availability for a working day', async () => {
      const result = await CalendarService.getPharmacistAvailability(
        mockPharmacistId,
        mockDate,
        mockWorkplaceId
      );

      expect(result).toHaveProperty('pharmacistId', mockPharmacistId);
      expect(result).toHaveProperty('pharmacistName', 'Dr. John Smith');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('isWorking', true);
      expect(result).toHaveProperty('shifts');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('availableSlots');
      expect(result).toHaveProperty('utilizationRate');
    });

    it('should return not working for non-working days', async () => {
      mockSchedule.isWorkingOn.mockReturnValue(false);

      const result = await CalendarService.getPharmacistAvailability(
        mockPharmacistId,
        mockDate,
        mockWorkplaceId
      );

      expect(result.isWorking).toBe(false);
      expect(result.shifts).toEqual([]);
      expect(result.availableSlots).toEqual([]);
      expect(result.utilizationRate).toBe(0);
    });

    it('should calculate utilization rate correctly', async () => {
      // Mock 10 total slots, 7 booked
      const mockSlots = Array(10)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: i >= 7, // First 7 are booked
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.getPharmacistAvailability(
        mockPharmacistId,
        mockDate,
        mockWorkplaceId
      );

      expect(result.utilizationRate).toBe(70); // 7/10 = 70%
    });

    it('should throw error if pharmacist not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        CalendarService.getPharmacistAvailability(
          mockPharmacistId,
          mockDate,
          mockWorkplaceId
        )
      ).rejects.toThrow('Pharmacist not found');
    });
  });

  describe('getCapacityMetrics', () => {
    const startDate = new Date('2025-10-20');
    const endDate = new Date('2025-10-26');

    const mockPharmacists = [
      {
        _id: mockPharmacistId,
        name: 'Dr. John Smith',
        role: 'pharmacist',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Dr. Jane Doe',
        role: 'pharmacist',
      },
    ];

    const mockSchedule = {
      _id: new mongoose.Types.ObjectId(),
      pharmacistId: mockPharmacistId,
      workplaceId: mockWorkplaceId,
      isWorkingOn: jest.fn().mockReturnValue(true),
      appointmentPreferences: {
        defaultDuration: 30,
      },
    };

    beforeEach(() => {
      (User.find as jest.Mock).mockResolvedValue(mockPharmacists);
      (PharmacistSchedule.findCurrentSchedule as jest.Mock).mockResolvedValue(mockSchedule);
    });

    it('should calculate capacity metrics for date range', async () => {
      const mockSlots = Array(20)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: i % 2 === 0, // 50% utilization
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.getCapacityMetrics(
        startDate,
        endDate,
        mockWorkplaceId
      );

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('byPharmacist');
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('recommendations');
      expect(result.overall.totalSlots).toBeGreaterThan(0);
      expect(result.byPharmacist.length).toBeGreaterThan(0);
      expect(result.byDay.length).toBe(7); // 7 days in range
    });

    it('should generate recommendations for underutilized pharmacists', async () => {
      const mockSlots = Array(20)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: i < 18, // Only 10% utilization
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.getCapacityMetrics(
        startDate,
        endDate,
        mockWorkplaceId
      );

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('underutilized'))).toBe(true);
    });

    it('should generate recommendations for overutilized pharmacists', async () => {
      const mockSlots = Array(20)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: i >= 19, // 95% utilization
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.getCapacityMetrics(
        startDate,
        endDate,
        mockWorkplaceId
      );

      expect(result.recommendations.some(r => r.includes('near capacity'))).toBe(true);
    });

    it('should filter by specific pharmacists', async () => {
      const mockSlots = Array(20)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: true,
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.getCapacityMetrics(
        startDate,
        endDate,
        mockWorkplaceId,
        [mockPharmacistId]
      );

      expect(User.find).toHaveBeenCalledWith({
        _id: { $in: [mockPharmacistId] },
        role: { $in: ['pharmacist', 'pharmacy_manager'] },
      });
    });
  });

  describe('suggestOptimalTimes', () => {
    const mockPatientHistory = [
      {
        _id: new mongoose.Types.ObjectId(),
        patientId: mockPatientId,
        scheduledDate: new Date('2025-10-15'),
        scheduledTime: '10:00',
        status: 'completed',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        patientId: mockPatientId,
        scheduledDate: new Date('2025-10-08'),
        scheduledTime: '10:30',
        status: 'completed',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        patientId: mockPatientId,
        scheduledDate: new Date('2025-10-01'),
        scheduledTime: '14:00',
        status: 'completed',
      },
    ];

    const mockSchedule = {
      _id: new mongoose.Types.ObjectId(),
      pharmacistId: mockPharmacistId,
      workplaceId: mockWorkplaceId,
      isWorkingOn: jest.fn().mockReturnValue(true),
      appointmentPreferences: {
        appointmentTypes: ['mtm_session'],
      },
    };

    beforeEach(() => {
      (Appointment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPatientHistory),
      });

      (PharmacistSchedule.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          {
            ...mockSchedule,
            pharmacistId: { _id: mockPharmacistId, name: 'Dr. Smith' },
          },
        ]),
      });
    });

    it('should suggest optimal times based on patient history', async () => {
      const mockSlots = [
        { time: '10:00', available: true, pharmacistId: mockPharmacistId },
        { time: '10:15', available: true, pharmacistId: mockPharmacistId },
        { time: '14:00', available: true, pharmacistId: mockPharmacistId },
      ];

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.suggestOptimalTimes(
        mockPatientId,
        'mtm_session',
        30,
        mockWorkplaceId,
        7
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('time');
      expect(result[0]).toHaveProperty('pharmacistId');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('reasons');
    });

    it('should prioritize patient preferred times', async () => {
      const mockSlots = [
        { time: '10:00', available: true, pharmacistId: mockPharmacistId },
        { time: '16:00', available: true, pharmacistId: mockPharmacistId },
      ];

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.suggestOptimalTimes(
        mockPatientId,
        'mtm_session',
        30,
        mockWorkplaceId,
        7
      );

      // 10:00 should have higher score due to patient history
      const morningSlot = result.find(s => s.time === '10:00');
      const eveningSlot = result.find(s => s.time === '16:00');

      if (morningSlot && eveningSlot) {
        expect(morningSlot.score).toBeGreaterThan(eveningSlot.score);
      }
    });

    it('should return top 10 suggestions', async () => {
      const mockSlots = Array(50)
        .fill(null)
        .map((_, i) => ({
          time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`,
          available: true,
          pharmacistId: mockPharmacistId,
        }));

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.suggestOptimalTimes(
        mockPatientId,
        'mtm_session',
        30,
        mockWorkplaceId,
        14
      );

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should include reasons for suggestions', async () => {
      const mockSlots = [
        { time: '10:00', available: true, pharmacistId: mockPharmacistId },
      ];

      jest.spyOn(CalendarService, 'calculateAvailableSlots').mockResolvedValue(mockSlots);

      const result = await CalendarService.suggestOptimalTimes(
        mockPatientId,
        'mtm_session',
        30,
        mockWorkplaceId,
        7
      );

      expect(result[0].reasons.length).toBeGreaterThan(0);
      expect(result[0].reasons.some(r => r.includes('morning'))).toBe(true);
    });
  });
});
