import api, { ApiResponse } from './api';

export interface ClinicalNote {
  _id: string;
  patientId: string;
  userId: string;
  title: string;
  content: string;
  category: 'assessment' | 'medication_review' | 'counseling' | 'follow_up' | 'other';
  tags: string[];
  isPrivate: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteCreateData {
  patientId: string;
  title: string;
  content: string;
  category: 'assessment' | 'medication_review' | 'counseling' | 'follow_up' | 'other';
  tags?: string[];
  isPrivate?: boolean;
  attachments?: string[];
}

export interface ClinicalNotesResponse {
  notes: ClinicalNote[];
  total: number;
  page: number;
  limit: number;
}

class ClinicalNoteService {
  async getNotes(params?: {
    patientId?: string;
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append('patientId', params.patientId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const response = await api.get<ApiResponse<ClinicalNotesResponse>>(
      `/clinical-notes?${searchParams.toString()}`
    );
    return response.data;
  }

  async getNote(id: string) {
    const response = await api.get<ApiResponse<ClinicalNote>>(`/clinical-notes/${id}`);
    return response.data;
  }

  async createNote(data: ClinicalNoteCreateData) {
    const response = await api.post<ApiResponse<ClinicalNote>>('/clinical-notes', data);
    return response.data;
  }

  async updateNote(id: string, data: Partial<ClinicalNoteCreateData>) {
    const response = await api.put<ApiResponse<ClinicalNote>>(`/clinical-notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: string) {
    const response = await api.delete<ApiResponse<void>>(`/clinical-notes/${id}`);
    return response.data;
  }

  async getNotesByPatient(patientId: string) {
    const response = await api.get<ApiResponse<ClinicalNote[]>>(
      `/clinical-notes/patient/${patientId}`
    );
    return response.data;
  }
}

export const clinicalNoteService = new ClinicalNoteService();
export default clinicalNoteService;