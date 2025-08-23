const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PatientService {
  async makeRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
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

  async getPatients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/patients?${queryString}`);
  }

  async getPatient(patientId) {
    return this.makeRequest(`/patients/${patientId}`);
  }

  async createPatient(patientData) {
    return this.makeRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(patientId, patientData) {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(patientId) {
    return this.makeRequest(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  async searchPatients(query) {
    return this.makeRequest(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  async getPatientMedications(patientId) {
    return this.makeRequest(`/medications/patient/${patientId}`);
  }

  async getPatientNotes(patientId) {
    return this.makeRequest(`/notes/patient/${patientId}`);
  }
}

export const patientService = new PatientService();