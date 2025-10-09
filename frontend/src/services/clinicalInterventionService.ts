import type {
    ClinicalIntervention,
    CreateInterventionData,
    UpdateInterventionData,
    InterventionFilters,
    InterventionStrategy,
    TeamAssignment,
    InterventionOutcome,
    StrategyRecommendation,
    DashboardMetrics,
} from '../stores/clinicalInterventionStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

interface PaginatedResponse<T> {
    success: boolean;
    data: {
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ClinicalInterventionService {
    /**
     * Base request method with error handling and authentication
     */
    private async makeRequest<T>(
        url: string,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        console.log('🔍 Making request:', {
            url: `${API_BASE_URL}${url}`,
            method: options.method || 'GET',
            body: options.body,
            headers: options.headers
        });

        try {
            // Add super_admin test header for development testing
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            // Check if we're in super_admin test mode (development only)
            if (import.meta.env.DEV) {
                headers['X-Super-Admin-Test'] = 'true';
                console.log('🔍 Added super_admin test header for development');
            }

            const config = {
                ...options,
                credentials: 'include' as RequestCredentials, // Include httpOnly cookies
                headers,
            };

            console.log('🔍 Final request config:', config);
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            console.log('🔍 Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle authentication errors
                if (response.status === 401) {
                    console.warn('Authentication failed - redirecting to login');
                    // Don't redirect in super_admin mode for testing
                    if (!window.location.pathname.includes('super_admin')) {
                        window.location.href = '/login';
                    }
                }

                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('🔍 Response data:', data);
            return data;
        } catch (error) {
            console.error(`API request failed for ${url}:`, error);

            if (error instanceof Error) {
                return {
                    success: false,
                    message: error.message,
                    error: error.message,
                };
            }

            return {
                success: false,
                message: 'An unexpected error occurred',
                error: 'Unknown error',
            };
        }
    }

    /**
     * Authentication is handled automatically via httpOnly cookies
     * No manual token management needed
     */

    // ===============================
    // CRUD OPERATIONS
    // ===============================

    /**
     * Get interventions with filtering and pagination
     */
    async getInterventions(filters: InterventionFilters = {}): Promise<PaginatedResponse<ClinicalIntervention>> {
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const url = `/api/clinical-interventions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await this.makeRequest<any>(url);

        // Handle different response structures from backend
        if (response.success && response.data) {
            // If backend returns nested data structure
            if (response.data.data && response.data.pagination) {
                return {
                    success: true,
                    data: {
                        data: response.data.data,
                        pagination: response.data.pagination
                    }
                };
            }
            // If backend returns direct array (fallback)
            else if (Array.isArray(response.data)) {
                return {
                    success: true,
                    data: {
                        data: response.data,
                        pagination: {
                            page: filters.page || 1,
                            limit: filters.limit || 20,
                            total: response.data.length,
                            pages: Math.ceil(response.data.length / (filters.limit || 20)),
                            hasNext: false,
                            hasPrev: false
                        }
                    }
                };
            }
        }

        return response as PaginatedResponse<ClinicalIntervention>;
    }

    /**
     * Get a single intervention by ID
     */
    async getInterventionById(id: string): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${id}`);
    }

    /**
     * Create a new intervention
     */
    async createIntervention(data: CreateInterventionData): Promise<ApiResponse<ClinicalIntervention>> {
        console.log('🔍 SERVICE: createIntervention called with:', data);

        const result = await this.makeRequest<ClinicalIntervention>('/api/clinical-interventions', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        console.log('🔍 SERVICE: createIntervention result:', result);
        return result;
    }

    /**
     * Update an existing intervention
     */
    async updateIntervention(id: string, updates: UpdateInterventionData): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Delete an intervention (soft delete)
     */
    async deleteIntervention(id: string): Promise<ApiResponse<boolean>> {
        return this.makeRequest<boolean>(`/api/clinical-interventions/${id}`, {
            method: 'DELETE',
        });
    }

    // ===============================
    // WORKFLOW OPERATIONS
    // ===============================

    /**
     * Add a strategy to an intervention
     */
    async addStrategy(interventionId: string, strategy: Omit<InterventionStrategy, '_id'>): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/strategies`, {
            method: 'POST',
            body: JSON.stringify(strategy),
        });
    }

    /**
     * Update a strategy
     */
    async updateStrategy(interventionId: string, strategyId: string, updates: Partial<InterventionStrategy>): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/strategies/${strategyId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Assign a team member to an intervention
     */
    async assignTeamMember(interventionId: string, assignment: Omit<TeamAssignment, '_id' | 'assignedAt'>): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/assignments`, {
            method: 'POST',
            body: JSON.stringify(assignment),
        });
    }

    /**
     * Update an assignment
     */
    async updateAssignment(interventionId: string, assignmentId: string, updates: Partial<TeamAssignment>): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/assignments/${assignmentId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Record intervention outcome
     */
    async recordOutcome(interventionId: string, outcome: InterventionOutcome): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/outcomes`, {
            method: 'POST',
            body: JSON.stringify(outcome),
        });
    }

    /**
     * Schedule follow-up for an intervention
     */
    async scheduleFollowUp(interventionId: string, followUpData: { scheduledDate: string; notes?: string; nextReviewDate?: string }): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/follow-up`, {
            method: 'POST',
            body: JSON.stringify(followUpData),
        });
    }

    // ===============================
    // SEARCH AND ANALYTICS
    // ===============================

    /**
     * Search interventions
     */
    async searchInterventions(query: string): Promise<ApiResponse<ClinicalIntervention[]>> {
        return this.makeRequest<ClinicalIntervention[]>(`/api/clinical-interventions/search?q=${encodeURIComponent(query)}`);
    }

    /**
     * Get interventions for a specific patient
     */
    async getPatientInterventions(patientId: string): Promise<ApiResponse<ClinicalIntervention[]>> {
        return this.makeRequest<ClinicalIntervention[]>(`/api/clinical-interventions/patient/${patientId}`);
    }

    /**
     * Get interventions assigned to current user
     */
    async getMyAssignedInterventions(): Promise<ApiResponse<ClinicalIntervention[]>> {
        return this.makeRequest<ClinicalIntervention[]>('/api/clinical-interventions/assigned-to-me');
    }

    /**
     * Get dashboard metrics and analytics
     */
    async getDashboardMetrics(dateRange?: { from: Date; to: Date }): Promise<ApiResponse<DashboardMetrics>> {
        const queryParams = new URLSearchParams();
        if (dateRange) {
            queryParams.append('dateFrom', dateRange.from.toISOString());
            queryParams.append('dateTo', dateRange.to.toISOString());
        }

        const url = `/api/clinical-interventions/analytics/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log('🔍 DASHBOARD: Fetching metrics from:', `${API_BASE_URL}${url}`);

        const result = await this.makeRequest<DashboardMetrics>(url);
        console.log('🔍 DASHBOARD: Received metrics:', result);

        return result;
    }

    /**
     * Get strategy recommendations for a category
     */
    async getStrategyRecommendations(category: string): Promise<ApiResponse<StrategyRecommendation[]>> {
        return this.makeRequest<StrategyRecommendation[]>(`/api/clinical-interventions/recommendations/${category}`);
    }

    /**
     * Get outcome trends
     */
    async getOutcomeTrends(dateRange?: { start: string; end: string }): Promise<ApiResponse<any>> {
        const queryParams = new URLSearchParams();
        if (dateRange) {
            queryParams.append('start', dateRange.start);
            queryParams.append('end', dateRange.end);
        }

        const url = `/api/clinical-interventions/analytics/trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.makeRequest<any>(url);
    }

    /**
     * Generate outcome report
     */
    async generateOutcomeReport(filters: {
        dateFrom?: Date;
        dateTo?: Date;
        category?: string;
        priority?: string;
        outcome?: string;
        pharmacist?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value) !== '') {
                if (value instanceof Date) {
                    queryParams.append(key, value.toISOString());
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        const url = `/api/clinical-interventions/reports/outcomes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log('🔍 SERVICE: generateOutcomeReport calling:', `${API_BASE_URL}${url}`);

        const result = await this.makeRequest<unknown>(url);
        console.log('🔍 SERVICE: generateOutcomeReport result:', result);

        return result;
    }

    /**
     * Calculate cost savings report
     */
    async getCostSavingsReport(filters: {
        dateFrom?: Date;
        dateTo?: Date;
        adverseEventCost?: number;
        hospitalAdmissionCost?: number;
        medicationWasteCost?: number;
        pharmacistHourlyCost?: number;
    }): Promise<ApiResponse<unknown>> {
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value) !== '') {
                if (value instanceof Date) {
                    queryParams.append(key, value.toISOString());
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        const url = `/api/clinical-interventions/reports/cost-savings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.makeRequest<unknown>(url);
    }

    /**
     * Export interventions data
     */
    async exportInterventions(filters: InterventionFilters = {}, format: 'csv' | 'xlsx' = 'xlsx'): Promise<ApiResponse<Blob>> {
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        queryParams.append('format', format);

        const url = `/api/clinical-interventions/reports/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                credentials: 'include' as RequestCredentials, // Include httpOnly cookies
                headers: {
                    // No manual Authorization header needed - cookies are sent automatically
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            return {
                success: true,
                message: 'Export successful',
                data: blob,
            };
        } catch (error) {
            console.error('Export failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Export failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // ===============================
    // INTEGRATION METHODS
    // ===============================

    /**
     * Link intervention to MTR
     */
    async linkToMTR(interventionId: string, mtrId: string): Promise<ApiResponse<ClinicalIntervention>> {
        return this.makeRequest<ClinicalIntervention>(`/api/clinical-interventions/${interventionId}/link-mtr`, {
            method: 'POST',
            body: JSON.stringify({ mtrId }),
        });
    }

    /**
     * Send notifications for intervention
     */
    async sendNotifications(interventionId: string, event: string): Promise<ApiResponse<boolean>> {
        return this.makeRequest<boolean>(`/api/clinical-interventions/${interventionId}/notifications`, {
            method: 'POST',
            body: JSON.stringify({ event }),
        });
    }

    // ===============================
    // UTILITY METHODS
    // ===============================

    /**
     * Check for duplicate interventions
     */
    async checkDuplicates(patientId: string, category: string): Promise<ApiResponse<{ duplicates: ClinicalIntervention[]; count: number }>> {
        return this.makeRequest<{ duplicates: ClinicalIntervention[]; count: number }>(`/api/clinical-interventions/check-duplicates?patientId=${patientId}&category=${category}`);
    }

    /**
     * Get intervention categories with counts
     */
    async getCategoryCounts(): Promise<ApiResponse<Record<string, number>>> {
        return this.makeRequest<Record<string, number>>('/api/clinical-interventions/analytics/categories');
    }

    /**
     * Get priority distribution
     */
    async getPriorityDistribution(): Promise<ApiResponse<Record<string, number>>> {
        return this.makeRequest<Record<string, number>>('/api/clinical-interventions/analytics/priorities');
    }
    // ===============================
    // MTR INTEGRATION METHODS
    // ===============================

    /**
     * Create interventions from MTR problems
     */
    async createInterventionsFromMTR(data: {
        mtrId: string;
        problemIds: string[];
        priority?: string;
        estimatedDuration?: number;
    }): Promise<ApiResponse<{
        interventions: ClinicalIntervention[];
        count: number;
        mtrId: string;
    }>> {
        return this.makeRequest('/api/clinical-interventions/from-mtr', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }



    /**
     * Get MTR reference data for intervention
     */
    async getMTRReference(interventionId: string): Promise<ApiResponse<{
        mtrReference: {
            _id: string;
            reviewNumber: string;
            status: string;
            priority: string;
            startedAt: string;
            completedAt?: string;
            patientName: string;
            pharmacistName: string;
            problemCount: number;
            interventionCount: number;
        } | null;
    }>> {
        return this.makeRequest(`/api/clinical-interventions/${interventionId}/mtr-reference`);
    }

    /**
     * Get interventions for MTR
     */
    async getInterventionsForMTR(mtrId: string): Promise<ApiResponse<{
        interventions: ClinicalIntervention[];
        count: number;
        mtrId: string;
    }>> {
        return this.makeRequest(`/api/clinical-interventions/mtr/${mtrId}`);
    }

    /**
     * Sync intervention with MTR data
     */
    async syncWithMTR(interventionId: string): Promise<ApiResponse<null>> {
        return this.makeRequest(`/api/clinical-interventions/${interventionId}/sync-mtr`, {
            method: 'POST',
        });
    }

    // ===============================
    // AUDIT AND COMPLIANCE METHODS
    // ===============================

    /**
     * Get intervention audit trail
     */
    async getInterventionAuditTrail(
        interventionId: string,
        options: {
            page?: number;
            limit?: number;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<ApiResponse<{
        logs: Array<{
            _id: string;
            action: string;
            timestamp: string;
            userId: {
                firstName: string;
                lastName: string;
                email: string;
            };
            details: unknown;
            riskLevel: string;
            complianceCategory: string;
            changedFields?: string[];
        }>;
        total: number;
        summary: {
            totalActions: number;
            uniqueUsers: number;
            lastActivity: string | null;
            riskActivities: number;
        };
    }>> {
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        const url = `/api/clinical-interventions/${interventionId}/audit-trail${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest(url);
    }

    /**
     * Get all audit trail (for general audit view)
     */
    async getAllAuditTrail(options: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        riskLevel?: string;
        userId?: string;
        action?: string;
    } = {}): Promise<ApiResponse> {
        const params = new URLSearchParams();

        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.startDate) params.append('startDate', options.startDate);
        if (options.endDate) params.append('endDate', options.endDate);
        if (options.riskLevel) params.append('riskLevel', options.riskLevel);
        if (options.userId) params.append('userId', options.userId);
        if (options.action) params.append('action', options.action);

        const queryString = params.toString();
        const url = `/api/clinical-interventions/audit-trail${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest(url);
    }

    /**
     * Generate compliance report
     */
    async getComplianceReport(options: {
        startDate: string;
        endDate: string;
        includeDetails?: boolean;
        interventionIds?: string[];
    }): Promise<ApiResponse<{
        summary: {
            totalInterventions: number;
            auditedActions: number;
            complianceScore: number;
            riskActivities: number;
        };
        interventionCompliance: Array<{
            interventionId: string;
            interventionNumber: string;
            auditCount: number;
            lastAudit: string;
            complianceStatus: 'compliant' | 'warning' | 'non-compliant';
            riskLevel: 'low' | 'medium' | 'high' | 'critical';
        }>;
        recommendations: string[];
    }>> {
        const params = new URLSearchParams();
        params.append('startDate', options.startDate);
        params.append('endDate', options.endDate);

        if (options.includeDetails !== undefined) {
            params.append('includeDetails', String(options.includeDetails));
        }

        if (options.interventionIds?.length) {
            params.append('interventionIds', options.interventionIds.join(','));
        }

        return this.makeRequest(`/api/clinical-interventions/compliance/report?${params.toString()}`);
    }

    /**
     * Export audit data
     */
    async exportAuditData(options: {
        format: 'json' | 'csv' | 'pdf';
        startDate: string;
        endDate: string;
        interventionIds?: string[];
        includeDetails?: boolean;
    }): Promise<Blob> {
        const params = new URLSearchParams();
        params.append('format', options.format);
        params.append('startDate', options.startDate);
        params.append('endDate', options.endDate);

        if (options.includeDetails !== undefined) {
            params.append('includeDetails', String(options.includeDetails));
        }

        if (options.interventionIds?.length) {
            params.append('interventionIds', options.interventionIds.join(','));
        }

        const response = await fetch(
            `${API_BASE_URL}/clinical-interventions/audit/export?${params.toString()}`,
            {
                credentials: 'include' as RequestCredentials, // Include httpOnly cookies
                headers: {
                    // No manual Authorization header needed - cookies are sent automatically
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    }
}

// Export singleton instance
export const clinicalInterventionService = new ClinicalInterventionService();
export default clinicalInterventionService;