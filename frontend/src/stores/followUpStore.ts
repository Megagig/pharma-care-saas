import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  FollowUpTask,
  FollowUpFilters,
  FollowUpSummary,
  FollowUpPriority,
  FollowUpStatus,
} from './followUpTypes';
import { LoadingState, ErrorState } from './types';

interface FollowUpStore {
  // State
  tasks: FollowUpTask[];
  selectedTask: FollowUpTask | null;
  filters: FollowUpFilters;
  summary: FollowUpSummary | null;
  loading: LoadingState;
  errors: ErrorState;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Selection actions
  selectTask: (task: FollowUpTask | null) => void;

  // Filter actions
  setFilters: (filters: Partial<FollowUpFilters>) => void;
  clearFilters: () => void;
  filterByStatus: (status: FollowUpStatus | FollowUpStatus[]) => void;
  filterByPriority: (priority: FollowUpPriority | FollowUpPriority[]) => void;
  filterByType: (type: string | string[]) => void;
  filterByPharmacist: (pharmacistId: string) => void;
  filterByPatient: (patientId: string) => void;
  filterByOverdue: (overdue: boolean) => void;
  filterByDueDateRange: (from: Date, to: Date) => void;

  // Pagination actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Utility actions
  clearErrors: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;

  // Local state management
  addTaskToState: (task: FollowUpTask) => void;
  updateTaskInState: (id: string, updates: Partial<FollowUpTask>) => void;
  removeTaskFromState: (id: string) => void;
  setTasks: (tasks: FollowUpTask[]) => void;
  setSummary: (summary: FollowUpSummary) => void;

  // Computed getters
  getOverdueTasks: () => FollowUpTask[];
  getDueTodayTasks: () => FollowUpTask[];
  getDueThisWeekTasks: () => FollowUpTask[];
  getTasksByPriority: (priority: FollowUpPriority) => FollowUpTask[];
  getTasksByStatus: (status: FollowUpStatus) => FollowUpTask[];
  getTasksByType: (type: string) => FollowUpTask[];
  getHighPriorityTasks: () => FollowUpTask[];
  getPendingTasks: () => FollowUpTask[];
}

const DEFAULT_FILTERS: FollowUpFilters = {
  search: '',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  page: 1,
  limit: 50,
};

export const useFollowUpStore = create<FollowUpStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tasks: [],
        selectedTask: null,
        filters: DEFAULT_FILTERS,
        summary: null,
        loading: {},
        errors: {},
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },

        // Selection actions
        selectTask: (task: FollowUpTask | null) => {
          set({ selectedTask: task }, false, 'selectTask');
        },

        // Filter actions
        setFilters: (newFilters: Partial<FollowUpFilters>) => {
          set(
            (state) => ({
              filters: { ...state.filters, ...newFilters },
            }),
            false,
            'setFilters'
          );
        },

        clearFilters: () => {
          set({ filters: DEFAULT_FILTERS }, false, 'clearFilters');
        },

        filterByStatus: (status: FollowUpStatus | FollowUpStatus[]) => {
          get().setFilters({ status, page: 1 });
        },

        filterByPriority: (priority: FollowUpPriority | FollowUpPriority[]) => {
          get().setFilters({ priority, page: 1 });
        },

        filterByType: (type: string | string[]) => {
          get().setFilters({ type: type as any, page: 1 });
        },

        filterByPharmacist: (pharmacistId: string) => {
          get().setFilters({ assignedTo: pharmacistId, page: 1 });
        },

        filterByPatient: (patientId: string) => {
          get().setFilters({ patientId, page: 1 });
        },

        filterByOverdue: (overdue: boolean) => {
          get().setFilters({ overdue, page: 1 });
        },

        filterByDueDateRange: (from: Date, to: Date) => {
          get().setFilters({ dueDateFrom: from, dueDateTo: to, page: 1 });
        },

        // Pagination actions
        setPage: (page: number) => {
          get().setFilters({ page });
        },

        setLimit: (limit: number) => {
          get().setFilters({ limit, page: 1 });
        },

        // Utility actions
        clearErrors: () => {
          set({ errors: {} }, false, 'clearErrors');
        },

        setLoading: (key: string, loading: boolean) => {
          set(
            (state) => ({
              loading: { ...state.loading, [key]: loading },
            }),
            false,
            'setLoading'
          );
        },

        setError: (key: string, error: string | null) => {
          set(
            (state) => ({
              errors: { ...state.errors, [key]: error },
            }),
            false,
            'setError'
          );
        },

        // Local state management
        addTaskToState: (task: FollowUpTask) => {
          set(
            (state) => ({
              tasks: [task, ...state.tasks],
              pagination: {
                ...state.pagination,
                total: state.pagination.total + 1,
              },
            }),
            false,
            'addTaskToState'
          );
        },

        updateTaskInState: (id: string, updates: Partial<FollowUpTask>) => {
          set(
            (state) => ({
              tasks: state.tasks.map((t) => (t._id === id ? { ...t, ...updates } : t)),
              selectedTask:
                state.selectedTask && state.selectedTask._id === id
                  ? { ...state.selectedTask, ...updates }
                  : state.selectedTask,
            }),
            false,
            'updateTaskInState'
          );
        },

        removeTaskFromState: (id: string) => {
          set(
            (state) => ({
              tasks: state.tasks.filter((t) => t._id !== id),
              selectedTask:
                state.selectedTask && state.selectedTask._id === id
                  ? null
                  : state.selectedTask,
              pagination: {
                ...state.pagination,
                total: Math.max(0, state.pagination.total - 1),
              },
            }),
            false,
            'removeTaskFromState'
          );
        },

        setTasks: (tasks: FollowUpTask[]) => {
          set({ tasks }, false, 'setTasks');
        },

        setSummary: (summary: FollowUpSummary) => {
          set({ summary }, false, 'setSummary');
        },

        // Computed getters
        getOverdueTasks: () => {
          const { tasks } = get();
          const now = new Date();

          return tasks
            .filter((task) => {
              const dueDate = new Date(task.dueDate);
              return (
                dueDate < now &&
                task.status !== 'completed' &&
                task.status !== 'cancelled' &&
                !task.isDeleted
              );
            })
            .sort((a, b) => {
              // Sort by priority first, then by due date
              const priorityOrder = { critical: 0, urgent: 1, high: 2, medium: 3, low: 4 };
              const priorityDiff =
                priorityOrder[a.priority] - priorityOrder[b.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
        },

        getDueTodayTasks: () => {
          const { tasks } = get();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          return tasks.filter((task) => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return (
              dueDate.getTime() === today.getTime() &&
              task.status !== 'completed' &&
              task.status !== 'cancelled' &&
              !task.isDeleted
            );
          });
        },

        getDueThisWeekTasks: () => {
          const { tasks } = get();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);

          return tasks.filter((task) => {
            const dueDate = new Date(task.dueDate);
            return (
              dueDate >= today &&
              dueDate < nextWeek &&
              task.status !== 'completed' &&
              task.status !== 'cancelled' &&
              !task.isDeleted
            );
          });
        },

        getTasksByPriority: (priority: FollowUpPriority) => {
          const { tasks } = get();
          return tasks.filter((t) => t.priority === priority && !t.isDeleted);
        },

        getTasksByStatus: (status: FollowUpStatus) => {
          const { tasks } = get();
          return tasks.filter((t) => t.status === status && !t.isDeleted);
        },

        getTasksByType: (type: string) => {
          const { tasks } = get();
          return tasks.filter((t) => t.type === type && !t.isDeleted);
        },

        getHighPriorityTasks: () => {
          const { tasks } = get();
          return tasks.filter(
            (t) =>
              (t.priority === 'high' ||
                t.priority === 'urgent' ||
                t.priority === 'critical') &&
              t.status !== 'completed' &&
              t.status !== 'cancelled' &&
              !t.isDeleted
          );
        },

        getPendingTasks: () => {
          const { tasks } = get();
          return tasks.filter(
            (t) =>
              (t.status === 'pending' || t.status === 'in_progress') && !t.isDeleted
          );
        },
      }),
      {
        name: 'followup-store',
        partialize: (state) => ({
          filters: state.filters,
          selectedTask: state.selectedTask,
        }),
      }
    ),
    { name: 'FollowUpStore' }
  )
);

// Selector hooks for better performance
export const useFollowUpSelection = () =>
  useFollowUpStore((state) => ({
    selectedTask: state.selectedTask,
    selectTask: state.selectTask,
  }));

export const useFollowUpFilters = () =>
  useFollowUpStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    filterByStatus: state.filterByStatus,
    filterByPriority: state.filterByPriority,
    filterByType: state.filterByType,
    filterByPharmacist: state.filterByPharmacist,
    filterByPatient: state.filterByPatient,
    filterByOverdue: state.filterByOverdue,
    filterByDueDateRange: state.filterByDueDateRange,
  }));

export const useFollowUpList = () =>
  useFollowUpStore((state) => ({
    tasks: state.tasks,
    summary: state.summary,
    pagination: state.pagination,
    loading: state.loading,
    errors: state.errors,
    setPage: state.setPage,
    setLimit: state.setLimit,
  }));

export const useFollowUpActions = () =>
  useFollowUpStore((state) => ({
    addTaskToState: state.addTaskToState,
    updateTaskInState: state.updateTaskInState,
    removeTaskFromState: state.removeTaskFromState,
    setTasks: state.setTasks,
    setSummary: state.setSummary,
    setLoading: state.setLoading,
    setError: state.setError,
    clearErrors: state.clearErrors,
  }));

export const useFollowUpQueries = () =>
  useFollowUpStore((state) => ({
    getOverdueTasks: state.getOverdueTasks,
    getDueTodayTasks: state.getDueTodayTasks,
    getDueThisWeekTasks: state.getDueThisWeekTasks,
    getTasksByPriority: state.getTasksByPriority,
    getTasksByStatus: state.getTasksByStatus,
    getTasksByType: state.getTasksByType,
    getHighPriorityTasks: state.getHighPriorityTasks,
    getPendingTasks: state.getPendingTasks,
  }));
