import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saasService, {
  SystemMetrics,
  SystemHealth,
  Activity,
  UserFilters,
  Pagination,
  PaginatedUsers,
  FeatureFlagTargeting,
  SecuritySettings,
  UserSession,
} from '../services/saasService';

// Query keys
export const saasKeys = {
  all: ['saas'] as const,
  overview: () => [...saasKeys.all, 'overview'] as const,
  metrics: () => [...saasKeys.overview(), 'metrics'] as const,
  health: () => [...saasKeys.overview(), 'health'] as const,
  activities: () => [...saasKeys.overview(), 'activities'] as const,
  users: () => [...saasKeys.all, 'users'] as const,
  usersList: (filters: UserFilters, pagination: Pagination) => 
    [...saasKeys.users(), 'list', { filters, pagination }] as const,
  featureFlags: () => [...saasKeys.all, 'feature-flags'] as const,
  security: () => [...saasKeys.all, 'security'] as const,
  securitySettings: () => [...saasKeys.security(), 'settings'] as const,
  sessions: () => [...saasKeys.security(), 'sessions'] as const,
};

// System Overview Queries
export const useSystemMetrics = () => {
  return useQuery({
    queryKey: saasKeys.metrics(),
    queryFn: () => saasService.getSystemMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: saasKeys.health(),
    queryFn: () => saasService.getSystemHealth(),
    refetchInterval: 15000, // Refetch every 15 seconds for health monitoring
  });
};

export const useRecentActivities = () => {
  return useQuery({
    queryKey: saasKeys.activities(),
    queryFn: () => saasService.getRecentActivities(),
    refetchInterval: 60000, // Refetch every minute
  });
};

// User Management Queries
export const useUsers = (filters: UserFilters = {}, pagination: Pagination = { page: 1, limit: 20 }) => {
  return useQuery({
    queryKey: saasKeys.usersList(filters, pagination),
    queryFn: () => saasService.getUsers(filters, pagination),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId, workspaceId }: { userId: string; roleId: string; workspaceId?: string }) =>
      saasService.updateUserRole(userId, roleId, workspaceId),
    onSuccess: () => {
      // Invalidate users queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: saasKeys.users() });
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      saasService.suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.users() });
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => saasService.reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.users() });
    },
  });
};

export const useBulkAssignRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, roleId }: { userIds: string[]; roleId: string }) =>
      saasService.bulkAssignRoles(userIds, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.users() });
    },
  });
};

export const useImpersonateUser = () => {
  return useMutation({
    mutationFn: (targetUserId: string) => saasService.impersonateUser(targetUserId),
  });
};

// Feature Flags Queries
export const useSaasFeatureFlags = () => {
  return useQuery({
    queryKey: saasKeys.featureFlags(),
    queryFn: () => saasService.getFeatureFlags(),
  });
};

export const useUpdateFeatureFlagTargeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flagId, targeting }: { flagId: string; targeting: FeatureFlagTargeting }) =>
      saasService.updateFeatureFlagTargeting(flagId, targeting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.featureFlags() });
    },
  });
};

// Security Queries
export const useSecuritySettings = () => {
  return useQuery({
    queryKey: saasKeys.securitySettings(),
    queryFn: () => saasService.getSecuritySettings(),
  });
};

export const useUpdatePasswordPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policy: SecuritySettings['passwordPolicy']) =>
      saasService.updatePasswordPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.securitySettings() });
    },
  });
};

export const useActiveSessions = () => {
  return useQuery({
    queryKey: saasKeys.sessions(),
    queryFn: () => saasService.getActiveSessions(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useTerminateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => saasService.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saasKeys.sessions() });
    },
  });
};