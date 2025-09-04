import axios from 'axios';
import { 
  DrugSearchResult, 
  DrugMonograph, 
  DrugInteraction, 
  AdverseEffect, 
  FormularyInfo,
  TherapyPlan
} from '../types/drugTypes';

const API_BASE_URL = '/api/drugs';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Drug Information API Service
export const drugInfoApi = {
  // Search for drugs by name
  searchDrugs: async (name: string): Promise<DrugSearchResult> => {
    const response = await apiClient.get('/search', { params: { name } });
    return response.data;
  },

  // Get drug monograph by ID
  getMonograph: async (id: string): Promise<DrugMonograph> => {
    const response = await apiClient.get(`/monograph/${id}`);
    return response.data;
  },

  // Check drug interactions
  checkInteractions: async (rxcui?: string, rxcuis?: string[]): Promise<DrugInteraction> => {
    const response = await apiClient.post('/interactions', { rxcui, rxcuis });
    return response.data;
  },

  // Get adverse effects for a drug
  getAdverseEffects: async (id: string, limit?: number): Promise<AdverseEffect> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get(`/adverse-effects/${id}`, { params });
    return response.data;
  },

  // Get formulary and therapeutic equivalents
  getFormulary: async (id: string): Promise<FormularyInfo> => {
    const response = await apiClient.get(`/formulary/${id}`);
    return response.data;
  },

  // Therapy Plan APIs
  createTherapyPlan: async (plan: Omit<TherapyPlan, '_id' | 'createdAt' | 'updatedAt'>): Promise<TherapyPlan> => {
    const response = await apiClient.post('/therapy-plans', plan);
    return response.data;
  },

  getTherapyPlans: async (): Promise<TherapyPlan[]> => {
    const response = await apiClient.get('/therapy-plans');
    return response.data;
  },

  getTherapyPlanById: async (id: string): Promise<TherapyPlan> => {
    const response = await apiClient.get(`/therapy-plans/${id}`);
    return response.data;
  },

  updateTherapyPlan: async (id: string, plan: Partial<TherapyPlan>): Promise<TherapyPlan> => {
    const response = await apiClient.put(`/therapy-plans/${id}`, plan);
    return response.data;
  },

  deleteTherapyPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/therapy-plans/${id}`);
  }
};