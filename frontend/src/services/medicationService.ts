const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class MedicationService {
  async makeRequest(url: string, options: any = {}): Promise<any> {
    const token = localStorage.getItem('token');
    
    const config: any = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  async getMedications(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/medications?${queryString}`);
  }

  async getMedication(medicationId: string): Promise<any> {
    return this.makeRequest(`/medications/${medicationId}`);
  }

  async getMedicationsByPatient(patientId: string): Promise<any> {
    return this.makeRequest(`/medications/patient/${patientId}`);
  }

  async createMedication(medicationData: any): Promise<any> {
    return this.makeRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(medicationData),
    });
  }

  async updateMedication(medicationId: string, medicationData: any): Promise<any> {
    return this.makeRequest(`/medications/${medicationId}`, {
      method: 'PUT',
      body: JSON.stringify(medicationData),
    });
  }

  async updateMedicationStatus(medicationId: string, status: string): Promise<any> {
    return this.makeRequest(`/medications/${medicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteMedication(medicationId: string): Promise<any> {
    return this.makeRequest(`/medications/${medicationId}`, {
      method: 'DELETE',
    });
  }

  async searchMedications(query: string): Promise<any> {
    return this.makeRequest(`/medications/search?q=${encodeURIComponent(query)}`);
  }
}

export const medicationService = new MedicationService();