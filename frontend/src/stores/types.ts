// Common types and interfaces for Zustand stores

// Patient Types
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Medication Types
export interface Medication {
  _id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  prescribedDate: string;
  duration?: string;
  status: 'active' | 'completed' | 'discontinued';
  sideEffects?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicationFormData {
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  prescribedDate: string;
  duration?: string;
  status: 'active' | 'completed' | 'discontinued';
  sideEffects?: string[];
}

// Clinical Notes Types
export interface ClinicalNote {
  _id: string;
  patientId: string;
  title: string;
  content: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'general';
  tags?: string[];
  attachments?: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteFormData {
  patientId: string;
  title: string;
  content: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'general';
  tags?: string[];
  attachments?: string[];
  isPrivate: boolean;
}

// UI State Types
export interface UIState {
  loading: boolean;
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  duration?: number; // Auto-dismiss time in ms
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Filter and Search Types
export interface PatientFilters {
  search?: string;
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MedicationFilters {
  patientId?: string;
  status?: 'active' | 'completed' | 'discontinued';
  search?: string;
  sortBy?: 'name' | 'prescribedDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ClinicalNoteFilters {
  patientId?: string;
  type?: 'consultation' | 'follow-up' | 'emergency' | 'general';
  search?: string;
  tags?: string[];
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Store State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}