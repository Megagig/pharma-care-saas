import axios from 'axios';
import {
  DrugSearchResult,
  DrugMonograph,
  DrugInteraction,
  AdverseEffect,
  FormularyInfo,
  TherapyPlan,
} from '../types/drugTypes';

// Use direct connection to backend during development
const API_BASE_URL = 'http://localhost:5000/api/drugs';
const PUBLIC_API_BASE_URL = 'http://localhost:5000/api/public';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Create public axios instance that doesn't need auth
const publicApiClient = axios.create({
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
        } catch (e) {
          console.error('Failed to parse response as JSON');
          throw new Error('Invalid response format received from server');
        }
      }

      return response.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: any;
          headers?: any;
        };
        request?: any;
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
          data?: any;
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
          data?: any;
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

  // Get adverse effects for a drug
  getAdverseEffects: async (
    id: string,
    limit?: number
  ): Promise<AdverseEffect> => {
    try {
      const params = limit ? { limit } : {};
      console.log(`Getting adverse effects for id: ${id}, limit: ${limit}`);
      console.log(
        `Using direct API endpoint: ${PUBLIC_API_BASE_URL}/drug-adverse-effects/${id}`
      );

      const response = await axios.get(
        `${PUBLIC_API_BASE_URL}/drug-adverse-effects/${id}`,
        {
          params,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 15000, // Increased timeout for potentially large responses
        }
      );

      console.log('Adverse effects API response status:', response.status);
      console.log(
        'Adverse effects API response data type:',
        typeof response.data
      );

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: any;
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

  // Get formulary and therapeutic equivalents
  getFormulary: async (id: string): Promise<FormularyInfo> => {
    try {
      console.log(`Getting formulary info for id: ${id}`);
      console.log(
        `Using direct API endpoint: ${PUBLIC_API_BASE_URL}/drug-formulary/${id}`
      );

      const response = await axios.get(
        `${PUBLIC_API_BASE_URL}/drug-formulary/${id}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('Formulary API response status:', response.status);
      console.log('Formulary API response data type:', typeof response.data);

      return response.data.data;
    } catch (e) {
      const error = e as Error & {
        response?: {
          status?: number;
          data?: any;
        };
      };

      console.error('API error in getFormulary:', error);
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

  // Therapy Plan APIs
  createTherapyPlan: async (
    plan: Omit<TherapyPlan, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<TherapyPlan> => {
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

  updateTherapyPlan: async (
    id: string,
    plan: Partial<TherapyPlan>
  ): Promise<TherapyPlan> => {
    const response = await apiClient.put(`/therapy-plans/${id}`, plan);
    return response.data;
  },

  deleteTherapyPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/therapy-plans/${id}`);
  },
};
