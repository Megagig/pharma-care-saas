const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ClinicalNoteService {
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

  async getClinicalNotes(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/clinical-notes?${queryString}`);
  }

  async getClinicalNote(noteId: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/${noteId}`);
  }

  async getClinicalNotesByPatient(patientId: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/patient/${patientId}`);
  }

  async createClinicalNote(noteData: any): Promise<any> {
    return this.makeRequest('/clinical-notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateClinicalNote(noteId: string, noteData: any): Promise<any> {
    return this.makeRequest(`/clinical-notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  }

  async toggleNotePrivacy(noteId: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/${noteId}/privacy`, {
      method: 'PATCH',
    });
  }

  async deleteClinicalNote(noteId: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async searchClinicalNotes(query: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/search?q=${encodeURIComponent(query)}`);
  }

  async getNotesByTag(tag: string): Promise<any> {
    return this.makeRequest(`/clinical-notes/tag/${encodeURIComponent(tag)}`);
  }
}

export const clinicalNoteService = new ClinicalNoteService();