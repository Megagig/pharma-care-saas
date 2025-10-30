import axios from 'axios';
import {
  AppointmentAnalyticsParams,
  FollowUpAnalyticsParams,
  ReminderAnalyticsParams,
  CapacityAnalyticsParams,
  AppointmentAnalytics,
  FollowUpAnalytics,
  ReminderAnalytics,
  CapacityAnalytics,
} from '../hooks/useAppointmentAnalytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds for analytics queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't automatically logout for analytics endpoints - they might not be implemented yet
      // Just log the error and let the component handle it gracefully
      console.warn('Analytics API returned 401 - endpoint may not be implemented:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const appointmentAnalyticsService = {
  /**
   * Get comprehensive appointment analytics
   */
  async getAppointmentAnalytics(params: AppointmentAnalyticsParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.pharmacistId) queryParams.append('pharmacistId', params.pharmacistId);
    if (params.locationId) queryParams.append('locationId', params.locationId);
    if (params.appointmentType) queryParams.append('appointmentType', params.appointmentType);

    const response = await apiClient.get<{
      success: boolean;
      data: AppointmentAnalytics;
      message: string;
    }>(`/appointments/analytics?${queryParams.toString()}`);

    return response.data;
  },

  /**
   * Get follow-up task analytics
   */
  async getFollowUpAnalytics(params: FollowUpAnalyticsParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.pharmacistId) queryParams.append('pharmacistId', params.pharmacistId);
    if (params.taskType) queryParams.append('taskType', params.taskType);
    if (params.priority) queryParams.append('priority', params.priority);

    const response = await apiClient.get<{
      success: boolean;
      data: FollowUpAnalytics;
      message: string;
    }>(`/follow-ups/analytics?${queryParams.toString()}`);

    return response.data;
  },

  /**
   * Get reminder effectiveness analytics
   */
  async getReminderAnalytics(params: ReminderAnalyticsParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.channel) queryParams.append('channel', params.channel);
    if (params.templateId) queryParams.append('templateId', params.templateId);

    const response = await apiClient.get<{
      success: boolean;
      data: ReminderAnalytics;
      message: string;
    }>(`/reminders/analytics?${queryParams.toString()}`);

    return response.data;
  },

  /**
   * Get capacity utilization analytics
   */
  async getCapacityAnalytics(params: CapacityAnalyticsParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.pharmacistId) queryParams.append('pharmacistId', params.pharmacistId);
    if (params.locationId) queryParams.append('locationId', params.locationId);

    const response = await apiClient.get<{
      success: boolean;
      data: CapacityAnalytics;
      message: string;
    }>(`/schedules/capacity?${queryParams.toString()}`);

    return response.data;
  },

  /**
   * Export appointment analytics
   */
  async exportAnalytics(params: AppointmentAnalyticsParams & { format: 'pdf' | 'excel' }) {
    const response = await apiClient.post('/appointments/analytics/export', params, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment-analytics.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },
};