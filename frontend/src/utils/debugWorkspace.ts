import { apiClient } from '../services/apiClient';

/**
 * Debug utility to help diagnose workspace data issues
 * Only available in development mode
 */
export class WorkspaceDebugger {
    /**
     * Get comprehensive debug information about current user's workspace
     */
    static async debugCurrentWorkspace(): Promise<any> {
        try {
            console.log('🔍 Starting workspace debug...');
            
            const response = await apiClient.get('/dashboard/debug');
            
            if (response.data?.success) {
                const debug = response.data.debug;
                
                console.log('🏢 Workspace Debug Results:');
                console.log('==========================');
                console.log('User Info:', debug.user);
                console.log('Workplace:', debug.workplace);
                console.log('Data in Workspace:', debug.dataInWorkspace);
                console.log('Sample Data:', debug.sampleData);
                console.log('System Overview:', debug.systemOverview);
                
                // Analyze potential issues
                this.analyzeWorkspaceIssues(debug);
                
                return debug;
            } else {
                console.error('❌ Debug request failed:', response.data);
                return null;
            }
        } catch (error: any) {
            console.error('❌ Error debugging workspace:', error);
            console.error('Response:', error.response?.data);
            return null;
        }
    }

    /**
     * Analyze debug information and suggest potential fixes
     */
    private static analyzeWorkspaceIssues(debug: any): void {
        console.log('\n🔍 Issue Analysis:');
        console.log('==================');

        // Check if user has workplace
        if (!debug.user.workplaceId) {
            console.log('❌ ISSUE: User has no workplace assigned');
            console.log('   Solution: User needs to be assigned to a workplace');
            return;
        }

        // Check if workplace exists
        if (!debug.workplace) {
            console.log('❌ ISSUE: Workplace not found in database');
            console.log('   Solution: Workplace may have been deleted or user has invalid workplaceId');
            return;
        }

        // Check if workspace has any data
        const totalData = debug.dataInWorkspace.patients + 
                         debug.dataInWorkspace.notes + 
                         debug.dataInWorkspace.medications;

        if (totalData === 0) {
            console.log('⚠️  ISSUE: No data in user\'s workspace');
            console.log('   Possible causes:');
            console.log('   1. User is new and hasn\'t created any data yet');
            console.log('   2. Data exists but has different workplaceId');
            console.log('   3. Data was deleted or moved');
            
            if (debug.systemOverview.totalPatients > 0) {
                console.log('   Note: System has data in other workspaces');
                console.log('   Check if user should be in a different workspace');
            }
        } else {
            console.log('✅ Workspace has data:');
            console.log(`   - ${debug.dataInWorkspace.patients} patients`);
            console.log(`   - ${debug.dataInWorkspace.notes} clinical notes`);
            console.log(`   - ${debug.dataInWorkspace.medications} medications`);
            console.log('   Dashboard should show this data');
        }

        // Check user role
        if (debug.user.role === 'super_admin') {
            console.log('ℹ️  User is super admin - should see system-wide dashboard');
        } else {
            console.log('ℹ️  User is regular user - should see workspace-specific dashboard');
        }
    }

    /**
     * Test dashboard API endpoints
     */
    static async testDashboardEndpoints(): Promise<void> {
        console.log('🧪 Testing Dashboard Endpoints:');
        console.log('===============================');

        const endpoints = [
            '/dashboard/overview',
            '/dashboard/stats',
            '/dashboard/workspace-info'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint}...`);
                const response = await apiClient.get(endpoint);
                
                if (response.data?.success) {
                    console.log(`✅ ${endpoint}: Success`);
                    if (response.data.data) {
                        const data = response.data.data;
                        if (data.stats) {
                            console.log(`   Stats: ${JSON.stringify(data.stats)}`);
                        }
                    }
                } else {
                    console.log(`❌ ${endpoint}: Failed - ${response.data?.message}`);
                }
            } catch (error: any) {
                console.log(`❌ ${endpoint}: Error - ${error.message}`);
                if (error.response?.data) {
                    console.log(`   Response: ${JSON.stringify(error.response.data)}`);
                }
            }
        }
    }

    /**
     * Get user info for debugging (works with both localStorage and cookies)
     */
    static getCurrentUserInfo(): any {
        try {
            // First try localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log('👤 Current User from localStorage:', {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    workplaceId: user.workplaceId,
                    firstName: user.firstName,
                    lastName: user.lastName
                });
                return user;
            } else {
                console.log('ℹ️ No user found in localStorage (using cookies)');
                console.log('👤 User info should be available through AuthContext');
                
                // Try to get user info from the debug endpoint
                this.getUserInfoFromAPI();
                return null;
            }
        } catch (error) {
            console.error('❌ Error reading user info:', error);
            return null;
        }
    }

    /**
     * Get user info from API when using cookies
     */
    private static async getUserInfoFromAPI(): Promise<void> {
        try {
            const response = await apiClient.get('/dashboard/debug');
            if (response.data?.success && response.data.debug?.user) {
                const user = response.data.debug.user;
                console.log('👤 Current User from API:', {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    workplaceId: user.workplaceId,
                    firstName: user.firstName || 'N/A',
                    lastName: user.lastName || 'N/A'
                });
            }
        } catch (error) {
            console.log('ℹ️ Could not get user info from API (this is normal if using cookies)');
        }
    }

    /**
     * Get available workplaces for assignment
     */
    static async getAvailableWorkplaces(): Promise<any[]> {
        try {
            console.log('🏢 Getting available workplaces...');
            
            const response = await apiClient.post('/dashboard/assign-workplace', {});
            
            if (response.data?.availableWorkplaces) {
                console.log('🏢 Available Workplaces:');
                response.data.availableWorkplaces.forEach((wp: any, index: number) => {
                    console.log(`${index + 1}. ${wp.name} (ID: ${wp.id})`);
                });
                return response.data.availableWorkplaces;
            } else {
                console.log('❌ No workplaces found');
                return [];
            }
        } catch (error: any) {
            console.error('❌ Error getting workplaces:', error);
            return [];
        }
    }

    /**
     * Assign current user to a workplace
     */
    static async assignToWorkspace(workplaceId: string): Promise<boolean> {
        try {
            console.log(`🔧 Assigning user to workplace: ${workplaceId}`);
            
            const response = await apiClient.post('/dashboard/assign-workplace', {
                workplaceId: workplaceId
            });
            
            if (response.data?.success) {
                console.log('✅ User assigned successfully!');
                console.log(`User: ${response.data.user.name}`);
                console.log(`Workplace: ${response.data.workplace.name}`);
                
                // Suggest refreshing the page
                console.log('💡 Please refresh the page to see updated dashboard data');
                return true;
            } else {
                console.log('❌ Assignment failed:', response.data?.message);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error assigning to workplace:', error);
            console.error('Response:', error.response?.data);
            return false;
        }
    }

    /**
     * Debug the dashboard API response to see what frontend is receiving
     */
    static async debugDashboardAPI(): Promise<void> {
        try {
            console.log('🔍 Testing dashboard API directly...');
            
            const response = await apiClient.get('/dashboard/overview');
            
            console.log('📡 Raw API Response:', response.data);
            
            if (response.data?.success) {
                const data = response.data.data;
                console.log('📊 Dashboard Data Structure:');
                console.log('- Stats:', data.stats);
                console.log('- Workspace:', data.workspace ? 'Present' : 'Missing');
                console.log('- Charts:', data.charts);
                console.log('- Activities:', data.activities?.length || 0, 'activities');
                
                // Check if charts have data
                if (data.charts) {
                    console.log('📈 Chart Data Details:');
                    Object.keys(data.charts).forEach(chartType => {
                        const chartData = data.charts[chartType];
                        console.log(`- ${chartType}:`, Array.isArray(chartData) ? `${chartData.length} items` : chartData);
                    });
                }
                
                // Check if this matches what the dashboard service expects
                console.log('🔍 Data Processing Check:');
                console.log('- Backend says stats:', data.stats);
                console.log('- Backend says charts exist:', !!data.charts);
                console.log('- Backend says activities exist:', !!data.activities);
                
            } else {
                console.log('❌ API returned unsuccessful response:', response.data);
            }
            
        } catch (error: any) {
            console.error('❌ Error testing dashboard API:', error);
            console.error('Response:', error.response?.data);
        }
    }
}

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
    (window as any).debugWorkspace = WorkspaceDebugger.debugCurrentWorkspace;
    (window as any).testDashboardEndpoints = WorkspaceDebugger.testDashboardEndpoints;
    (window as any).getCurrentUserInfo = WorkspaceDebugger.getCurrentUserInfo;
    (window as any).getAvailableWorkplaces = WorkspaceDebugger.getAvailableWorkplaces;
    (window as any).assignToWorkplace = WorkspaceDebugger.assignToWorkplace;
    (window as any).debugDashboardAPI = WorkspaceDebugger.debugDashboardAPI;
}

export default WorkspaceDebugger;