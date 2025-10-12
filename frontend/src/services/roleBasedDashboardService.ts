import { apiClient } from './apiClient';

export interface DashboardData {
    stats: any;
    workspace: any;
    charts: any;
    activities: any[];
}

export interface SuperAdminDashboardData {
    systemStats: {
        totalPatients: number;
        totalClinicalNotes: number;
        totalMedications: number;
        totalMTRs: number;
        totalWorkspaces: number;
        totalUsers: number;
        activeSubscriptions: number;
    };
    workspaces: Array<{
        _id: string;
        name: string;
        ownerId: any;
        subscriptionStatus: string;
        createdAt: string;
        metrics: {
            patients: number;
            users: number;
            mtrs: number;
        };
    }>;
    userActivity: {
        usersByRole: Array<{ _id: string; count: number }>;
        activeUsers: number;
        newUsers: number;
        usersByWorkplaceRole: Array<{ _id: string; count: number }>;
    };
    subscriptions: {
        subscriptionsByStatus: Array<{ _id: string; count: number }>;
        subscriptionsByTier: Array<{ _id: string; count: number }>;
        monthlyRevenue: number;
        totalRevenue: number;
    };
    trends: {
        patientsTrend: Array<{ _id: { year: number; month: number }; count: number }>;
        usersTrend: Array<{ _id: { year: number; month: number }; count: number }>;
        clinicalNotesByType: Array<{ _id: string; count: number }>;
        mtrsByStatus: Array<{ _id: string; count: number }>;
    };
}

export interface WorkspaceDetails {
    workspace: any;
    stats: any;
    users: any[];
    activities: any[];
}

export type UserRole =
    | 'pharmacist'
    | 'pharmacy_team'
    | 'pharmacy_outlet'
    | 'intern_pharmacist'
    | 'super_admin'
    | 'owner';

export type WorkplaceRole =
    | 'Owner'
    | 'Staff'
    | 'Pharmacist'
    | 'Cashier'
    | 'Technician'
    | 'Assistant';

class RoleBasedDashboardService {
    // Note: apiClient already has baseURL set to '/api', so we don't add it here
    // All paths should be relative to /api (e.g., '/super-admin/...' not '/api/super-admin/...')

    /**
     * Get dashboard data based on user role
     * Automatically routes to appropriate endpoints based on user permissions
     */
    async getDashboardData(userRole: UserRole, workplaceRole?: WorkplaceRole): Promise<DashboardData | SuperAdminDashboardData> {
        try {
            console.log(`🔍 Fetching dashboard data for role: ${userRole}, workplace role: ${workplaceRole}`);

            // Super admin gets system-wide dashboard
            if (userRole === 'super_admin') {
                return await this.getSuperAdminDashboard();
            }

            // All other roles get workspace-specific dashboard
            return await this.getWorkspaceDashboard();

        } catch (error) {
            console.error('❌ Error fetching role-based dashboard data:', error);
            throw error;
        }
    }

    /**
     * Get super admin system-wide dashboard
     */
    async getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
        try {
            console.log('🌐 Fetching super admin dashboard data from API...');
            const url = '/super-admin/dashboard/overview';
            console.log('API URL (relative to /api):', url);

            const response = await apiClient.get(url);

            console.log('📡 API Response received:', {
                success: response.data?.success,
                hasData: !!response.data?.data,
                dataKeys: response.data?.data ? Object.keys(response.data.data) : []
            });

            if (!response.data?.success) {
                console.error('❌ API returned unsuccessful response:', response.data);
                throw new Error(response.data?.message || 'Failed to fetch super admin dashboard');
            }

            if (!response.data?.data) {
                console.error('❌ API response missing data field');
                throw new Error('Invalid API response structure');
            }

            console.log('✅ Super admin dashboard data fetched successfully');
            console.log('Data structure:', {
                systemStats: response.data.data.systemStats,
                workspacesCount: response.data.data.workspaces?.length || 0,
                hasUserActivity: !!response.data.data.userActivity,
                hasSubscriptions: !!response.data.data.subscriptions,
                hasTrends: !!response.data.data.trends
            });

            return response.data.data;

        } catch (error: any) {
            console.error('❌ Error fetching super admin dashboard:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            // Return default data structure for super admin if API fails
            console.warn('⚠️ Returning default super admin data due to error');
            return this.getDefaultSuperAdminData();
        }
    }

    /**
     * Get workspace-specific dashboard (for owners, staff, etc.)
     */
    async getWorkspaceDashboard(): Promise<DashboardData> {
        try {
            console.log('🏢 Fetching workspace dashboard data');

            const response = await apiClient.get('/dashboard/overview');

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch workspace dashboard');
            }

            console.log('✅ Workspace dashboard data fetched successfully');
            return response.data.data;

        } catch (error: any) {
            console.error('❌ Error fetching workspace dashboard:', error);

            // Return default data structure for workspace if API fails
            return this.getDefaultWorkspaceData();
        }
    }

    /**
     * Get detailed information for a specific workspace (super admin only)
     */
    async getWorkspaceDetails(workspaceId: string): Promise<WorkspaceDetails> {
        try {
            console.log(`🔍 Fetching details for workspace: ${workspaceId}`);

            const response = await apiClient.get(`/super-admin/dashboard/workspace/${workspaceId}`);

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch workspace details');
            }

            console.log('✅ Workspace details fetched successfully');
            return response.data.data;

        } catch (error: any) {
            console.error('❌ Error fetching workspace details:', error);
            throw error;
        }
    }

    /**
     * Check if user has super admin privileges
     * NOTE: Pass user role from AuthContext since user data is stored in React state, not localStorage
     */
    isSuperAdmin(userRole?: UserRole): boolean {
        // If userRole provided, use it; otherwise try to get from stored user data (fallback)
        const role = userRole || this.getCurrentUserRole();
        console.log('🔍 Super Admin Check:');
        console.log('- Provided userRole:', userRole);
        console.log('- Current stored role:', this.getCurrentUserRole());
        console.log('- Final role being checked:', role);
        console.log('- Is super admin?:', role === 'super_admin');
        return role === 'super_admin';
    }

    /**
     * Get current user role from localStorage (fallback method)
     * NOTE: This is a fallback - prefer passing userRole from AuthContext
     */
    private getCurrentUserRole(): UserRole | null {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.role || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    /**
     * Check if user is workspace owner
     */
    isWorkspaceOwner(userRole: UserRole, workplaceRole?: WorkplaceRole): boolean {
        return userRole === 'owner' || workplaceRole === 'Owner';
    }

    /**
     * Check if user can view system-wide metrics
     */
    canViewSystemMetrics(userRole: UserRole): boolean {
        return this.isSuperAdmin(userRole);
    }

    /**
     * Check if user can drill down into other workspaces
     */
    canViewOtherWorkspaces(userRole: UserRole): boolean {
        return this.isSuperAdmin(userRole);
    }

    /**
     * Get user's dashboard access level
     */
    getUserDashboardLevel(userRole: UserRole, workplaceRole?: WorkplaceRole): 'system' | 'workspace' | 'limited' {
        if (this.isSuperAdmin(userRole)) {
            return 'system';
        }

        if (this.isWorkspaceOwner(userRole, workplaceRole)) {
            return 'workspace';
        }

        return 'limited';
    }

    /**
     * Get available dashboard views for user
     */
    getAvailableDashboardViews(userRole: UserRole): string[] {
        const views = ['workspace']; // Everyone gets workspace view

        if (this.isSuperAdmin(userRole)) {
            views.unshift('system'); // Super admin gets system view as primary
            views.push('workspace-selector'); // Can switch between workspaces
        }

        return views;
    }

    /**
     * Get dashboard title based on role and view
     */
    getDashboardTitle(userRole: UserRole, workplaceRole?: WorkplaceRole, currentView?: string): string {
        if (currentView === 'system' && this.isSuperAdmin(userRole)) {
            return 'System Overview';
        }

        if (this.isWorkspaceOwner(userRole, workplaceRole)) {
            return 'Workspace Dashboard';
        }

        return 'Dashboard';
    }

    /**
     * Default super admin data when API fails
     */
    private getDefaultSuperAdminData(): SuperAdminDashboardData {
        return {
            systemStats: {
                totalPatients: 0,
                totalClinicalNotes: 0,
                totalMedications: 0,
                totalMTRs: 0,
                totalWorkspaces: 0,
                totalUsers: 0,
                activeSubscriptions: 0
            },
            workspaces: [],
            userActivity: {
                usersByRole: [],
                activeUsers: 0,
                newUsers: 0,
                usersByWorkplaceRole: []
            },
            subscriptions: {
                subscriptionsByStatus: [],
                subscriptionsByTier: [],
                monthlyRevenue: 0,
                totalRevenue: 0
            },
            trends: {
                patientsTrend: [],
                usersTrend: [],
                clinicalNotesByType: [],
                mtrsByStatus: []
            }
        };
    }

    /**
     * Default workspace data when API fails
     */
    private getDefaultWorkspaceData(): DashboardData {
        return {
            stats: {
                totalPatients: 0,
                totalClinicalNotes: 0,
                totalMedications: 0,
                totalMTRs: 0,
                totalDiagnostics: 0
            },
            workspace: null,
            charts: {
                patientsOverTime: [],
                notesOverTime: []
            },
            activities: []
        };
    }

    /**
     * Format large numbers with appropriate suffixes
     */
    formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }    /**
     * Calculate percentage change
     */
    calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    /**
     * Get status color based on metric type and value
     */
    getMetricStatus(metricType: string, value: number): 'success' | 'warning' | 'error' | 'info' {
        switch (metricType) {
            case 'growth':
                return value > 0 ? 'success' : value < -10 ? 'error' : 'warning';
            case 'utilization':
                return value > 80 ? 'warning' : value > 95 ? 'error' : 'success';
            case 'completion':
                return value > 90 ? 'success' : value > 70 ? 'warning' : 'error';
            default:
                return 'info';
        }
    }

    /**
     * Get available workspaces for super admin to switch to
     */
    async getAvailableWorkspaces(): Promise<any[]> {
        try {
            const response = await apiClient.get('/super-admin/dashboard/workspaces');
            return response.data.workspaces || [];
        } catch (error) {
            console.error('Error fetching available workspaces:', error);
            return [];
        }
    }
}

export const roleBasedDashboardService = new RoleBasedDashboardService();
export default roleBasedDashboardService;