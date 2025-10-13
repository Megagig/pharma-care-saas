import axios from 'axios';
import {
  DrugSearchResult,
  DrugMonograph,
  DrugInteraction,
  AdverseEffect,
  FormularyInfo,
  TherapyPlan,
  DrugIndication,
} from '../types/drugTypes';

// Development: Direct backend URL (Vite proxy is broken)
// Production: /api (same port, served by backend)
const BASE = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';
const API_BASE_URL = `${BASE}/drugs`;
const PUBLIC_API_BASE_URL = `${BASE}/public`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Create public axios instance that doesn't need auth
export const publicApiClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Drug Information API Service
export const drugInfoApi = {
  // Search for drugs by name
  searchDrugs: async (name: string): Promise<DrugSearchResult> => {
    console.log(
      `API client making request to public drug-search with name: ${name}`
    );
    try {
      // Use direct connection to backend
      console.log(
        `Using direct API endpoint for drug search: ${PUBLIC_API_BASE_URL}/drug-search`
      );

      // Enhanced debugging
      console.log('Request config:', {
        url: `${PUBLIC_API_BASE_URL}/drug-search`,
        method: 'GET',
        params: { name },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const response = await axios.get(`${PUBLIC_API_BASE_URL}/drug-search`, {
        params: { name },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout and validateStatus for better error handling
        timeout: 10000,
        validateStatus: (status) => {
          return status >= 200 && status < 300;
        },
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      console.log('API response data type:', typeof response.data);
      console.log('API response data:', response.data);

      if (typeof response.data === 'string') {
        console.error('Received string response instead of JSON');
        try {
          // Try to parse as JSON
          const parsedData = JSON.parse(response.data);
          console.log(
            'Successfully parsed string response as JSON:',
            parsedData
          );
          return parsedData;
        } catch {
          // Catch parse error without using the error variable
          console.error('Failed to parse response as JSON');
          throw new Error('Invalid response format received from server');
        }
      }

      return response.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
          headers?: Record<string, string>;
        };
        request?: unknown;
      };

      console.error('API error in searchDrugs:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
          ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
          : 'No response',
        request: error.request
          ? 'Request was made but no response received'
          : 'Request not made',
      });
      throw error;
    }
  },

  // Get drug monograph by ID
  getMonograph: async (id: string): Promise<DrugMonograph> => {
    try {
      console.log(`Getting drug monograph for id: ${id}`);
      console.log(
        `Using direct API endpoint: ${PUBLIC_API_BASE_URL}/drug-monograph/${id}`
      );

      const response = await axios.get(
        `${PUBLIC_API_BASE_URL}/drug-monograph/${id}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('Monograph API response status:', response.status);
      console.log('Monograph API response data type:', typeof response.data);

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: Record<string, Record<string, unknown>>;
        };
      };

      console.error('API error in getMonograph:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
          ? {
            status: error.response.status,
            data: error.response.data,
          }
          : 'No response',
      });
      throw error;
    }
  },

  // Check drug interactions
  checkInteractions: async (
    rxcui?: string,
    rxcuis?: string[]
  ): Promise<DrugInteraction> => {
    try {
      console.log(
        `Checking drug interactions for rxcui: ${rxcui} or rxcuis: ${rxcuis?.join(
          ', '
        )}`
      );
      console.log(
        `Using direct API endpoint: ${PUBLIC_API_BASE_URL}/drug-interactions`
      );

      const response = await axios.post(
        `${PUBLIC_API_BASE_URL}/drug-interactions`,
        { rxcui, rxcuis },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('Interactions API response status:', response.status);
      console.log('Interactions API response data type:', typeof response.data);

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: Record<string, Record<string, unknown>>;
        };
      };

      console.error('API error in checkInteractions:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
          ? {
            status: error.response.status,
            data: error.response.data,
          }
          : 'No response',
      });
      throw error;
    }
  },

  // Get drug indications
  getIndications: async (drugId: string): Promise<DrugIndication> => {
    try {
      console.log(`Getting drug indications for id: ${drugId}`);
      console.log(
        `Using direct API endpoint: ${PUBLIC_API_BASE_URL}/drug-indications/${drugId}`
      );

      const response = await axios.get(
        `${PUBLIC_API_BASE_URL}/drug-indications/${drugId}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('Indications API response status:', response.status);
      console.log('Indications API response data type:', typeof response.data);

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };

      console.error('API error in getIndications:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
          ? {
            status: error.response.status,
            data: error.response.data,
          }
          : 'No response',
      });
      throw error;
    }
  },

  // Get adverse effects for drug
  getAdverseEffects: async (
    drugId: string,
    limit = 10
  ): Promise<AdverseEffect> => {
    try {
      console.log(`Getting adverse effects for drug id: ${drugId}`);
      const response = await axios.get(
        `${PUBLIC_API_BASE_URL}/drug-adverse-effects/${drugId}`,
        {
          params: { limit },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 15000, // Extended timeout for this endpoint
        }
      );

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };

      console.error('API error in getAdverseEffects:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
          ? {
            status: error.response.status,
            data: error.response.data,
          }
          : 'No response',
      });
      throw error;
    }
  },

  // Get formulary information for drug
  getFormularyInfo: async (rxCui: string): Promise<FormularyInfo> => {
    try {
      const response = await apiClient.get(`/formulary/${rxCui}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching formulary info:', error);
      throw error;
    }
  },

  // Save a therapy plan
  saveTherapyPlan: async (plan: TherapyPlan): Promise<TherapyPlan> => {
    try {
      const response = await apiClient.post('/therapy-plans', plan);
      return response.data;
    } catch (error) {
      console.error('Error saving therapy plan:', error);
      throw error;
    }
  },

  // Get user's therapy plans
  getTherapyPlans: async (): Promise<TherapyPlan[]> => {
    try {
      const response = await apiClient.get('/therapy-plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching therapy plans:', error);
      throw error;
    }
  },

  // Get a therapy plan by ID
  getTherapyPlan: async (id: string): Promise<TherapyPlan> => {
    try {
      const response = await apiClient.get(`/therapy-plans/${id}`);
      return response.data;
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('Error fetching therapy plan:', typedError);
      throw typedError;
    }
  },

  // Update a therapy plan
  // Create a therapy plan
  createTherapyPlan: async (
    plan: Omit<TherapyPlan, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<TherapyPlan> => {
    try {
      const response = await apiClient.post('/therapy-plans', plan);
      return response.data;
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('Error creating therapy plan:', typedError);
      throw typedError;
    }
  },

  updateTherapyPlan: async (
    id: string,
    plan: Partial<TherapyPlan>
  ): Promise<TherapyPlan> => {
    try {
      const response = await apiClient.put(`/therapy-plans/${id}`, plan);
      return response.data;
    } catch (error) {
      console.error('Error updating therapy plan:', error);
      throw error;
    }
  },

  // Delete a therapy plan
  deleteTherapyPlan: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/therapy-plans/${id}`);
      return;
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('Error deleting therapy plan:', typedError);
      throw typedError;
    }
  },
};
