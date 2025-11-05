import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePatientMedications } from '../usePatientMedications';

// Mock the usePatientAuth hook
vi.mock('../usePatientAuth', () => ({
  usePatientAuth: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('usePatientMedications', () => {
  const mockUser = {
    _id: 'user123',
    patientId: 'patient123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockCurrentMedications = [
    {
      _id: 'med1',
      pharmacyId: 'pharmacy456',
      patientId: 'patient123',
      phase: 'current',
      medicationName: 'Metformin 500mg',
      purposeIndication: 'Type 2 Diabetes Management',
      dose: '500mg',
      frequency: 'Twice daily',
      route: 'Oral',
      duration: '3 months',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      adherence: 'good',
      status: 'active',
      notes: 'Take with meals',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      createdBy: 'pharmacist123'
    }
  ];

  const mockMedicationHistory = [
    {
      _id: 'med2',
      pharmacyId: 'pharmacy456',
      patientId: 'patient123',
      phase: 'past',
      medicationName: 'Amoxicillin 500mg',
      purposeIndication: 'Bacterial Infection',
      dose: '500mg',
      frequency: 'Three times daily',
      route: 'Oral',
      duration: '7 days',
      startDate: '2023-12-01',
      endDate: '2023-12-07',
      adherence: 'good',
      status: 'completed',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-07T00:00:00.000Z',
      createdBy: 'pharmacist123'
    }
  ];

  const mockAdherenceData = {
    overallScore: 87,
    trend: 'up' as const,
    medicationScores: [
      {
        medicationId: 'med1',
        medicationName: 'Metformin 500mg',
        score: 92,
        trend: 'up' as const,
        daysTracked: 30,
        missedDoses: 2,
        totalDoses: 60
      }
    ],
    weeklyScores: [
      { week: 'Week 1', score: 85 },
      { week: 'Week 2', score: 88 }
    ],
    insights: [
      {
        type: 'success' as const,
        message: 'Great job! Your adherence has improved.'
      }
    ]
  };

  const mockRefillRequests = [
    {
      _id: 'refill1',
      medicationId: 'med1',
      medicationName: 'Metformin 500mg',
      status: 'pending' as const,
      requestedDate: '2024-03-10',
      notes: 'Running low',
      createdAt: '2024-03-10T10:30:00.000Z',
      updatedAt: '2024-03-10T10:30:00.000Z'
    }
  ];

  const mockSuccessResponse = {
    success: true,
    data: {
      currentMedications: mockCurrentMedications,
      medicationHistory: mockMedicationHistory,
      adherenceData: mockAdherenceData,
      refillRequests: mockRefillRequests
    },
    message: 'Medication data retrieved successfully'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    const { usePatientAuth } = require('../usePatientAuth');
    usePatientAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with null values', () => {
    const { result } = renderHook(() => usePatientMedications('patient123'));

    expect(result.current.currentMedications).toBeNull();
    expect(result.current.medicationHistory).toBeNull();
    expect(result.current.adherenceData).toBeNull();
    expect(result.current.refillRequests).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.refillLoading).toBe(false);
    expect(result.current.cancelLoading).toBe(false);
  });

  it('loads medication data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentMedications).toEqual(mockCurrentMedications);
    expect(result.current.medicationHistory).toEqual(mockMedicationHistory);
    expect(result.current.adherenceData).toEqual(mockAdherenceData);
    expect(result.current.refillRequests).toEqual(mockRefillRequests);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.currentMedications).toBeNull();
    expect(result.current.medicationHistory).toBeNull();
    expect(result.current.adherenceData).toBeNull();
    expect(result.current.refillRequests).toBeNull();
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('does not load data when user is not authenticated', () => {
    const { usePatientAuth } = require('../usePatientAuth');
    usePatientAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    expect(result.current.currentMedications).toBeNull();
    expect(result.current.medicationHistory).toBeNull();
    expect(result.current.adherenceData).toBeNull();
    expect(result.current.refillRequests).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not load data when patientId is not provided', () => {
    const { result } = renderHook(() => usePatientMedications());

    expect(result.current.currentMedications).toBeNull();
    expect(result.current.medicationHistory).toBeNull();
    expect(result.current.adherenceData).toBeNull();
    expect(result.current.refillRequests).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refreshes medication data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock to track new calls
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    await act(async () => {
      await result.current.refreshMedications();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('requests refill successfully', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    // Refill request
    const newRefillRequest = {
      _id: 'refill2',
      medicationId: 'med1',
      medicationName: 'Metformin 500mg',
      status: 'pending' as const,
      requestedDate: new Date().toISOString(),
      notes: 'Need refill',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { request: newRefillRequest },
        message: 'Refill request submitted successfully'
      })
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.requestRefill('med1', 'Need refill');
    });

    expect(result.current.refillRequests).toHaveLength(2);
    expect(result.current.refillRequests?.[0]).toEqual(newRefillRequest);
  });

  it('handles refill request error', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    // Refill request error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Refill not eligible' })
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.requestRefill('med1', 'Need refill');
      })
    ).rejects.toThrow('Refill not eligible');
  });

  it('cancels refill request successfully', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    // Cancel request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Refill request cancelled successfully'
      })
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.cancelRefillRequest('refill1', 'No longer needed');
    });

    // Check that the request status was updated
    const cancelledRequest = result.current.refillRequests?.find(r => r._id === 'refill1');
    expect(cancelledRequest?.status).toBe('cancelled');
  });

  it('handles cancel refill request error', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    // Cancel request error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Cannot cancel request' })
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.cancelRefillRequest('refill1', 'No longer needed');
      })
    ).rejects.toThrow('Cannot cancel request');
  });

  it('throws error when requesting refill without authentication', async () => {
    const { usePatientAuth } = require('../usePatientAuth');
    usePatientAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await expect(
      act(async () => {
        await result.current.requestRefill('med1', 'Need refill');
      })
    ).rejects.toThrow('User not authenticated');
  });

  it('throws error when cancelling refill without authentication', async () => {
    const { usePatientAuth } = require('../usePatientAuth');
    usePatientAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await expect(
      act(async () => {
        await result.current.cancelRefillRequest('refill1', 'No longer needed');
      })
    ).rejects.toThrow('User not authenticated');
  });

  it('sets loading states correctly', async () => {
    // Mock a slow response for initial load
    let resolveInitialLoad: (value: any) => void;
    const initialLoadPromise = new Promise(resolve => {
      resolveInitialLoad = resolve;
    });

    mockFetch.mockReturnValueOnce(initialLoadPromise);

    const { result } = renderHook(() => usePatientMedications('patient123'));

    // Should be loading initially
    expect(result.current.loading).toBe(true);

    // Resolve the initial load
    act(() => {
      resolveInitialLoad({
        ok: true,
        json: async () => mockSuccessResponse
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets refill loading state correctly', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock a slow refill request
    let resolveRefillRequest: (value: any) => void;
    const refillRequestPromise = new Promise(resolve => {
      resolveRefillRequest = resolve;
    });

    mockFetch.mockReturnValueOnce(refillRequestPromise);

    // Start refill request
    act(() => {
      result.current.requestRefill('med1', 'Need refill');
    });

    // Should be loading
    expect(result.current.refillLoading).toBe(true);

    // Resolve the refill request
    act(() => {
      resolveRefillRequest({
        ok: true,
        json: async () => ({
          success: true,
          data: { request: mockRefillRequests[0] },
          message: 'Success'
        })
      });
    });

    await waitFor(() => {
      expect(result.current.refillLoading).toBe(false);
    });
  });

  it('includes authorization header in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('handles missing token gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    renderHook(() => usePatientMedications('patient123'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });
});