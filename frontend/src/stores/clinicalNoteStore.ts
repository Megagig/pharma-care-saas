import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClinicalNote, ClinicalNoteFormData, ClinicalNoteFilters, LoadingState, ErrorState } from './types';

interface ClinicalNoteStore {
  // State
  notes: ClinicalNote[];
  selectedNote: ClinicalNote | null;
  filters: ClinicalNoteFilters;
  loading: LoadingState;
  errors: ErrorState;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  
  // Actions
  // CRUD operations
  fetchNotes: (filters?: ClinicalNoteFilters) => Promise<void>;
  fetchNotesByPatient: (patientId: string) => Promise<void>;
  createNote: (noteData: ClinicalNoteFormData) => Promise<ClinicalNote | null>;
  updateNote: (id: string, noteData: Partial<ClinicalNoteFormData>) => Promise<ClinicalNote | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNoteById: (id: string) => Promise<ClinicalNote | null>;
  
  // Note-specific actions
  toggleNotePrivacy: (id: string) => Promise<boolean>;
  addTagToNote: (id: string, tag: string) => Promise<boolean>;
  removeTagFromNote: (id: string, tag: string) => Promise<boolean>;
  duplicateNote: (id: string) => Promise<ClinicalNote | null>;
  
  // Selection actions
  selectNote: (note: ClinicalNote | null) => void;
  
  // Filter and search actions
  setFilters: (filters: Partial<ClinicalNoteFilters>) => void;
  clearFilters: () => void;
  searchNotes: (searchTerm: string) => void;
  filterByType: (type: 'consultation' | 'follow-up' | 'emergency' | 'general' | 'all') => void;
  filterByPatient: (patientId: string) => void;
  filterByTags: (tags: string[]) => void;
  sortNotes: (sortBy: 'title' | 'createdAt' | 'updatedAt', sortOrder: 'asc' | 'desc') => void;
  
  // Pagination actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  
  // Utility actions
  clearErrors: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  
  // Bulk operations
  deleteMultipleNotes: (ids: string[]) => Promise<boolean>;
  updateMultipleNotesPrivacy: (ids: string[], isPrivate: boolean) => Promise<boolean>;
  addTagToMultipleNotes: (ids: string[], tag: string) => Promise<boolean>;
  
  // Local state management
  addNoteToState: (note: ClinicalNote) => void;
  updateNoteInState: (id: string, updates: Partial<ClinicalNote>) => void;
  removeNoteFromState: (id: string) => void;
  
  // Analytics and insights
  getNotesByType: (type: string) => ClinicalNote[];
  getPatientNoteSummary: (patientId: string) => {
    consultation: number;
    followUp: number;
    emergency: number;
    general: number;
    total: number;
    private: number;
  };
  getAllTags: () => string[];
  getNotesCountByTag: (tag: string) => number;
}

// Mock clinical note service (you'll need to implement the actual service)
const noteService = {
  async getNotes(_filters: ClinicalNoteFilters) {
    // This should be implemented to call your actual API
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },
  async getNotesByPatient(_patientId: string) {
    return { success: true, data: [] };
  },
  async createNote(data: ClinicalNoteFormData) {
    return { 
      success: true, 
      data: { 
        ...data, 
        _id: Date.now().toString(), 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      } 
    };
  },
  async updateNote(id: string, data: Partial<ClinicalNoteFormData>) {
    const fullNote: ClinicalNote = {
      _id: id,
      patientId: data.patientId || 'unknown',
      title: data.title || 'Untitled',
      content: data.content || '',
      type: data.type || 'general',
      tags: data.tags || [],
      attachments: data.attachments || [],
      isPrivate: data.isPrivate || false,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    return { 
      success: true, 
      data: fullNote
    };
  },
  async deleteNote(_id: string) {
    return { success: true };
  },
  async getNoteById(_id: string) {
    return { success: true, data: null };
  },
  async toggleNotePrivacy(_id: string, _isPrivate: boolean) {
    return { success: true, data: { isPrivate: _isPrivate } };
  },
  async updateNoteTags(_id: string, tags: string[]) {
    return { success: true, data: { tags } };
  },
};

export const useClinicalNoteStore = create<ClinicalNoteStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      selectedNote: null,
      filters: {
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
      },
      loading: {},
      errors: {},
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },

      // CRUD operations
      fetchNotes: async (_filters) => {
        // Prevent automatic API calls in development/testing
        const isProduction = import.meta.env.PROD;
        const token = localStorage.getItem('token');
        
        if (!isProduction && !token) {
          console.warn('Skipping clinical notes API call - no token found in development mode');
          return;
        }
        
        const { setLoading, setError } = get();
        setLoading('fetchNotes', true);
        setError('fetchNotes', null);

        try {
          const currentFilters = _filters || get().filters;
          const response = await noteService.getNotes(currentFilters);
          
          if (response.success && response.data) {
            set({
              notes: response.data,
              pagination: response.pagination || {
                page: currentFilters.page || 1,
                limit: currentFilters.limit || 10,
                total: response.data.length,
                pages: Math.ceil(response.data.length / (currentFilters.limit || 10)),
              },
            });
          } else {
            setError('fetchNotes', 'Failed to fetch clinical notes');
          }
        } catch (error) {
          setError('fetchNotes', error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
          setLoading('fetchNotes', false);
        }
      },

      fetchNotesByPatient: async (_patientId) => {
        const { setLoading, setError } = get();
        setLoading('fetchByPatient', true);
        setError('fetchByPatient', null);

        try {
          const response = await noteService.getNotesByPatient(_patientId);
          
          if (response.success && response.data) {
            set({ notes: response.data });
          } else {
            setError('fetchByPatient', 'Failed to fetch patient notes');
          }
        } catch (error) {
          setError('fetchByPatient', error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
          setLoading('fetchByPatient', false);
        }
      },

      createNote: async (noteData) => {
        const { setLoading, setError, addNoteToState } = get();
        setLoading('createNote', true);
        setError('createNote', null);

        try {
          const response = await noteService.createNote(noteData);
          
          if (response.success && response.data) {
            addNoteToState(response.data);
            return response.data;
          } else {
            setError('createNote', 'Failed to create clinical note');
            return null;
          }
        } catch (error) {
          setError('createNote', error instanceof Error ? error.message : 'An unexpected error occurred');
          return null;
        } finally {
          setLoading('createNote', false);
        }
      },

      updateNote: async (id, noteData) => {
        const { setLoading, setError, updateNoteInState } = get();
        setLoading('updateNote', true);
        setError('updateNote', null);

        try {
          const response = await noteService.updateNote(id, noteData);
          
          if (response.success && response.data) {
            updateNoteInState(id, response.data);
            
            // Update selected note if it's the one being updated
            const { selectedNote } = get();
            if (selectedNote && selectedNote._id === id) {
              set({ selectedNote: { ...selectedNote, ...response.data } });
            }
            
            return response.data;
          } else {
            setError('updateNote', 'Failed to update clinical note');
            return null;
          }
        } catch (error) {
          setError('updateNote', error instanceof Error ? error.message : 'An unexpected error occurred');
          return null;
        } finally {
          setLoading('updateNote', false);
        }
      },

      deleteNote: async (id) => {
        const { setLoading, setError, removeNoteFromState } = get();
        setLoading('deleteNote', true);
        setError('deleteNote', null);

        try {
          const response = await noteService.deleteNote(id);
          
          if (response.success) {
            removeNoteFromState(id);
            
            // Clear selected note if it's the one being deleted
            const { selectedNote } = get();
            if (selectedNote && selectedNote._id === id) {
              set({ selectedNote: null });
            }
            
            return true;
          } else {
            setError('deleteNote', 'Failed to delete clinical note');
            return false;
          }
        } catch (error) {
          setError('deleteNote', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('deleteNote', false);
        }
      },

      getNoteById: async (id) => {
        const { setLoading, setError } = get();
        setLoading('getNoteById', true);
        setError('getNoteById', null);

        try {
          const response = await noteService.getNoteById(id);
          
          if (response.success && response.data) {
            return response.data;
          } else {
            setError('getNoteById', 'Failed to fetch clinical note');
            return null;
          }
        } catch (error) {
          setError('getNoteById', error instanceof Error ? error.message : 'An unexpected error occurred');
          return null;
        } finally {
          setLoading('getNoteById', false);
        }
      },

      // Note-specific actions
      toggleNotePrivacy: async (id) => {
        const { setLoading, setError, updateNoteInState, notes } = get();
        setLoading('togglePrivacy', true);
        setError('togglePrivacy', null);

        try {
          const note = notes.find(n => n._id === id);
          if (!note) {
            setError('togglePrivacy', 'Note not found');
            return false;
          }

          const response = await noteService.toggleNotePrivacy(id, !note.isPrivate);
          
          if (response.success) {
            updateNoteInState(id, { isPrivate: !note.isPrivate });
            return true;
          } else {
            setError('togglePrivacy', 'Failed to toggle note privacy');
            return false;
          }
        } catch (error) {
          setError('togglePrivacy', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('togglePrivacy', false);
        }
      },

      addTagToNote: async (id, tag) => {
        const { setLoading, setError, updateNoteInState, notes } = get();
        setLoading('addTag', true);
        setError('addTag', null);

        try {
          const note = notes.find(n => n._id === id);
          if (!note) {
            setError('addTag', 'Note not found');
            return false;
          }

          const updatedTags = [...(note.tags || []), tag];
          const response = await noteService.updateNoteTags(id, updatedTags);
          
          if (response.success) {
            updateNoteInState(id, { tags: updatedTags });
            return true;
          } else {
            setError('addTag', 'Failed to add tag to note');
            return false;
          }
        } catch (error) {
          setError('addTag', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('addTag', false);
        }
      },

      removeTagFromNote: async (id, tag) => {
        const { setLoading, setError, updateNoteInState, notes } = get();
        setLoading('removeTag', true);
        setError('removeTag', null);

        try {
          const note = notes.find(n => n._id === id);
          if (!note) {
            setError('removeTag', 'Note not found');
            return false;
          }

          const updatedTags = (note.tags || []).filter(t => t !== tag);
          const response = await noteService.updateNoteTags(id, updatedTags);
          
          if (response.success) {
            updateNoteInState(id, { tags: updatedTags });
            return true;
          } else {
            setError('removeTag', 'Failed to remove tag from note');
            return false;
          }
        } catch (error) {
          setError('removeTag', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('removeTag', false);
        }
      },

      duplicateNote: async (id) => {
        const { notes, createNote } = get();
        const originalNote = notes.find(n => n._id === id);
        
        if (!originalNote) {
          return null;
        }

        const duplicateData: ClinicalNoteFormData = {
          patientId: originalNote.patientId,
          title: `Copy of ${originalNote.title}`,
          content: originalNote.content,
          type: originalNote.type,
          tags: originalNote.tags,
          attachments: originalNote.attachments,
          isPrivate: originalNote.isPrivate,
        };

        return await createNote(duplicateData);
      },

      // Selection actions
      selectNote: (note) => set({ selectedNote: note }),

      // Filter and search actions
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      clearFilters: () =>
        set({
          filters: {
            search: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: 10,
          },
        }),

      searchNotes: (searchTerm) => {
        const { setFilters, fetchNotes } = get();
        setFilters({ search: searchTerm, page: 1 });
        fetchNotes();
      },

      filterByType: (type) => {
        const { setFilters, fetchNotes } = get();
        const typeFilter = type === 'all' ? undefined : type;
        setFilters({ type: typeFilter, page: 1 });
        fetchNotes();
      },

      filterByPatient: (patientId) => {
        const { setFilters, fetchNotesByPatient } = get();
        setFilters({ patientId, page: 1 });
        fetchNotesByPatient(patientId);
      },

      filterByTags: (tags) => {
        const { setFilters, fetchNotes } = get();
        setFilters({ tags, page: 1 });
        fetchNotes();
      },

      sortNotes: (sortBy, sortOrder) => {
        const { setFilters, fetchNotes } = get();
        setFilters({ sortBy, sortOrder, page: 1 });
        fetchNotes();
      },

      // Pagination actions
      setPage: (page) => {
        const { setFilters, fetchNotes } = get();
        setFilters({ page });
        fetchNotes();
      },

      setLimit: (limit) => {
        const { setFilters, fetchNotes } = get();
        setFilters({ limit, page: 1 });
        fetchNotes();
      },

      // Utility actions
      clearErrors: () => set({ errors: {} }),

      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading },
        })),

      setError: (key, error) =>
        set((state) => ({
          errors: { ...state.errors, [key]: error },
        })),

      // Bulk operations
      deleteMultipleNotes: async (ids) => {
        const { setLoading, setError } = get();
        setLoading('deleteMultiple', true);
        setError('deleteMultiple', null);

        try {
          const promises = ids.map(id => noteService.deleteNote(id));
          const results = await Promise.all(promises);
          
          const successful = results.filter(r => r.success);
          
          if (successful.length === ids.length) {
            // Remove all successfully deleted notes from state
            set((state) => ({
              notes: state.notes.filter(n => !ids.includes(n._id)),
              selectedNote: state.selectedNote && ids.includes(state.selectedNote._id) 
                ? null 
                : state.selectedNote,
            }));
            return true;
          } else {
            setError('deleteMultiple', `Only ${successful.length} of ${ids.length} notes were deleted`);
            return false;
          }
        } catch (error) {
          setError('deleteMultiple', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('deleteMultiple', false);
        }
      },

      updateMultipleNotesPrivacy: async (ids, isPrivate) => {
        const { setLoading, setError } = get();
        setLoading('updateMultiplePrivacy', true);
        setError('updateMultiplePrivacy', null);

        try {
          const promises = ids.map(id => noteService.toggleNotePrivacy(id, isPrivate));
          const results = await Promise.all(promises);
          
          const successful = results.filter(r => r.success);
          
          if (successful.length === ids.length) {
            // Update all successfully updated notes in state
            set((state) => ({
              notes: state.notes.map(n =>
                ids.includes(n._id) ? { ...n, isPrivate } : n
              ),
            }));
            return true;
          } else {
            setError('updateMultiplePrivacy', `Only ${successful.length} of ${ids.length} notes were updated`);
            return false;
          }
        } catch (error) {
          setError('updateMultiplePrivacy', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('updateMultiplePrivacy', false);
        }
      },

      addTagToMultipleNotes: async (ids, tag) => {
        const { setLoading, setError, notes } = get();
        setLoading('addTagMultiple', true);
        setError('addTagMultiple', null);

        try {
          const promises = ids.map(id => {
            const note = notes.find(n => n._id === id);
            if (note) {
              const updatedTags = [...(note.tags || []), tag];
              return noteService.updateNoteTags(id, updatedTags);
            }
            return Promise.resolve({ success: false });
          });
          
          const results = await Promise.all(promises);
          const successful = results.filter(r => r.success);
          
          if (successful.length === ids.length) {
            // Update all successfully updated notes in state
            set((state) => ({
              notes: state.notes.map(n => {
                if (ids.includes(n._id)) {
                  const existingTags = n.tags || [];
                  if (!existingTags.includes(tag)) {
                    return { ...n, tags: [...existingTags, tag] };
                  }
                }
                return n;
              }),
            }));
            return true;
          } else {
            setError('addTagMultiple', `Only ${successful.length} of ${ids.length} notes were updated`);
            return false;
          }
        } catch (error) {
          setError('addTagMultiple', error instanceof Error ? error.message : 'An unexpected error occurred');
          return false;
        } finally {
          setLoading('addTagMultiple', false);
        }
      },

      // Local state management
      addNoteToState: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1,
          },
        })),

      updateNoteInState: (id, updates) =>
        set((state) => ({
          notes: state.notes.map(n =>
            n._id === id ? { ...n, ...updates } : n
          ),
        })),

      removeNoteFromState: (id) =>
        set((state) => ({
          notes: state.notes.filter(n => n._id !== id),
          pagination: {
            ...state.pagination,
            total: Math.max(0, state.pagination.total - 1),
          },
        })),

      // Analytics and insights
      getNotesByType: (type) => {
        const { notes } = get();
        return notes.filter(n => n.type === type);
      },

      getPatientNoteSummary: (patientId) => {
        const { notes } = get();
        const patientNotes = notes.filter(n => n.patientId === patientId);
        
        return {
          consultation: patientNotes.filter(n => n.type === 'consultation').length,
          followUp: patientNotes.filter(n => n.type === 'follow-up').length,
          emergency: patientNotes.filter(n => n.type === 'emergency').length,
          general: patientNotes.filter(n => n.type === 'general').length,
          total: patientNotes.length,
          private: patientNotes.filter(n => n.isPrivate).length,
        };
      },

      getAllTags: () => {
        const { notes } = get();
        const allTags = notes.flatMap(n => n.tags || []);
        return [...new Set(allTags)];
      },

      getNotesCountByTag: (tag) => {
        const { notes } = get();
        return notes.filter(n => n.tags?.includes(tag)).length;
      },
    }),
    {
      name: 'clinical-note-store',
      partialize: (state) => ({
        filters: state.filters,
        selectedNote: state.selectedNote,
      }),
    }
  )
);

// Utility hooks for easier access to specific clinical note states
export const useClinicalNotes = () => useClinicalNoteStore((state) => ({
  notes: state.notes,
  loading: state.loading.fetchNotes || false,
  error: state.errors.fetchNotes || null,
  pagination: state.pagination,
  fetchNotes: state.fetchNotes,
  fetchNotesByPatient: state.fetchNotesByPatient,
}));

export const useSelectedNote = () => useClinicalNoteStore((state) => ({
  selectedNote: state.selectedNote,
  selectNote: state.selectNote,
  loading: state.loading.getNoteById || false,
  error: state.errors.getNoteById || null,
  getNoteById: state.getNoteById,
}));

export const useClinicalNoteFilters = () => useClinicalNoteStore((state) => ({
  filters: state.filters,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchNotes: state.searchNotes,
  filterByType: state.filterByType,
  filterByPatient: state.filterByPatient,
  filterByTags: state.filterByTags,
  sortNotes: state.sortNotes,
}));

export const useClinicalNoteActions = () => useClinicalNoteStore((state) => ({
  createNote: state.createNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
  toggleNotePrivacy: state.toggleNotePrivacy,
  addTagToNote: state.addTagToNote,
  removeTagFromNote: state.removeTagFromNote,
  duplicateNote: state.duplicateNote,
  deleteMultipleNotes: state.deleteMultipleNotes,
  updateMultipleNotesPrivacy: state.updateMultipleNotesPrivacy,
  addTagToMultipleNotes: state.addTagToMultipleNotes,
  loading: {
    create: state.loading.createNote || false,
    update: state.loading.updateNote || false,
    delete: state.loading.deleteNote || false,
    togglePrivacy: state.loading.togglePrivacy || false,
    addTag: state.loading.addTag || false,
    removeTag: state.loading.removeTag || false,
    deleteMultiple: state.loading.deleteMultiple || false,
    updateMultiplePrivacy: state.loading.updateMultiplePrivacy || false,
    addTagMultiple: state.loading.addTagMultiple || false,
  },
  errors: {
    create: state.errors.createNote || null,
    update: state.errors.updateNote || null,
    delete: state.errors.deleteNote || null,
    togglePrivacy: state.errors.togglePrivacy || null,
    addTag: state.errors.addTag || null,
    removeTag: state.errors.removeTag || null,
    deleteMultiple: state.errors.deleteMultiple || null,
    updateMultiplePrivacy: state.errors.updateMultiplePrivacy || null,
    addTagMultiple: state.errors.addTagMultiple || null,
  },
  clearErrors: state.clearErrors,
}));

export const useClinicalNoteAnalytics = () => useClinicalNoteStore((state) => ({
  getNotesByType: state.getNotesByType,
  getPatientNoteSummary: state.getPatientNoteSummary,
  getAllTags: state.getAllTags,
  getNotesCountByTag: state.getNotesCountByTag,
}));