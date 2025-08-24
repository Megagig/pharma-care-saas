import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// API helper functions
export const apiHelpers = {
  get: <T>(url: string) => api.get<ApiResponse<T>>(url),
  post: <T>(url: string, data?: any) => api.post<ApiResponse<T>>(url, data),
  put: <T>(url: string, data?: any) => api.put<ApiResponse<T>>(url, data),
  patch: <T>(url: string, data?: any) => api.patch<ApiResponse<T>>(url, data),
  delete: <T>(url: string) => api.delete<ApiResponse<T>>(url),
};

export default api;