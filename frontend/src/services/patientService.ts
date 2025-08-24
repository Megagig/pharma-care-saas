const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class PatientService {
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

  async getPatients(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/patients?${queryString}`);
  }

  async getPatient(patientId: string): Promise<any> {
    return this.makeRequest(`/patients/${patientId}`);
  }

  async getPatientById(patientId: string): Promise<any> {
    return this.makeRequest(`/patients/${patientId}`);
  }

  async createPatient(patientData: any): Promise<any> {
    return this.makeRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(patientId: string, patientData: any): Promise<any> {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(patientId: string): Promise<any> {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  async searchPatients(query: string): Promise<any> {
    return this.makeRequest(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  async getPatientMedications(patientId: string): Promise<any> {
    return this.makeRequest(`/medications/patient/${patientId}`);
  }

  async getPatientNotes(patientId: string): Promise<any> {
    return this.makeRequest(`/notes/patient/${patientId}`);
  }
}

export const patientService = new PatientService();