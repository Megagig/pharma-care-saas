const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class PatientService {
  async makeRequest(url: string, options: RequestOptions = {}): Promise<unknown> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include', // Include httpOnly cookies
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  async getPatients(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/patients?${queryString}`);
  }

  async getPatient(patientId: string): Promise<unknown> {
    return this.makeRequest(`/patients/${patientId}`);
  }

  async getPatientById(patientId: string): Promise<unknown> {
    return this.makeRequest(`/patients/${patientId}`);
  }

  async createPatient(patientData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(patientId: string, patientData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(patientId: string): Promise<unknown> {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  async searchPatients(query: string): Promise<unknown> {
    return this.makeRequest(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  async getPatientMedications(patientId: string): Promise<unknown> {
    return this.makeRequest(`/medications/patient/${patientId}`);
  }

  async getPatientNotes(patientId: string): Promise<unknown> {
    return this.makeRequest(`/notes/patient/${patientId}`);
  }
}

export const patientService = new PatientService();