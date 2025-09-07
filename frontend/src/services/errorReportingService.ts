import React from 'react';
import { AppError } from './errorHandlingService';

// Error report interface
export interface ErrorReport {
    id: string;
    timestamp: Date;
    error: AppError;
    userDescription?: string;
    context: ErrorContext;
    userAgent: string;
    url: string;
    userId?: string;
    sessionId?: string;
    stackTrace?: string;
    breadcrumbs: Breadcrumb[];
    systemInfo: SystemInfo;
    status: 'pending' | 'sent' | 'failed';
}

export interface ErrorContext {
    component?: string;
    action?: string;
    formData?: any;
    apiEndpoint?: string;
    userRole?: string;
    workplaceId?: string;
}

export interface Breadcrumb {
    timestamp: Date;
    category: 'navigation' | 'user_action' | 'api_call' | 'error' | 'info';
    message: string;
    level: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
}

export interface SystemInfo {
    browser: string;
    browserVersion: string;
    os: string;
    screenResolution: string;
    viewport: string;
    timezone: string;
    language: string;
    cookiesEnabled: boolean;
    localStorageEnabled: boolean;
    connectionType?: string;
}

// Error reporting service
export class ErrorReportingService {
    private static instance: ErrorReportingService;
    private breadcrumbs: Breadcrumb[] = [];
    private maxBreadcrumbs = 50;
    private pendingReports: ErrorReport[] = [];
    private isOnline = navigator.onLine;

    static getInstance(): ErrorReportingService {
        if (!ErrorReportingService.instance) {
            ErrorReportingService.instance = new ErrorReportingService();
        }
        return ErrorReportingService.instance;
    }

    constructor() {
        this.setupEventListeners();
        this.loadPendingReports();
    }

    // Setup event listeners for automatic breadcrumb collection
    private setupEventListeners(): void {
        // Network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.addBreadcrumb('info', 'Network connection restored');
            this.processPendingReports();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.addBreadcrumb('warning', 'Network connection lost');
        });

        // Navigation
        window.addEventListener('popstate', () => {
            this.addBreadcrumb('navigation', `Navigated to ${window.location.pathname}`);
        });

        // Unhandled errors
        window.addEventListener('error', (event) => {
            this.addBreadcrumb('error', `Unhandled error: ${event.error?.message || event.message}`, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.addBreadcrumb('error', `Unhandled promise rejection: ${event.reason}`, {
                reason: event.reason
            });
        });
    }

    // Add breadcrumb
    addBreadcrumb(
        category: Breadcrumb['category'],
        message: string,
        data?: Record<string, any>,
        level: Breadcrumb['level'] = 'info'
    ): void {
        const breadcrumb: Breadcrumb = {
            timestamp: new Date(),
            category,
            message,
            level,
            data
        };

        this.breadcrumbs.push(breadcrumb);

        // Keep only the most recent breadcrumbs
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
        }

        // Store in localStorage for persistence
        try {
            localStorage.setItem('error_breadcrumbs', JSON.stringify(this.breadcrumbs));
        } catch (error) {
            console.warn('Failed to store breadcrumbs:', error);
        }
    }

    // Create error report
    createErrorReport(
        error: AppError,
        context: ErrorContext = {},
        userDescription?: string
    ): ErrorReport {
        const report: ErrorReport = {
            id: this.generateReportId(),
            timestamp: new Date(),
            error,
            userDescription,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            stackTrace: error.stack,
            breadcrumbs: [...this.breadcrumbs],
            systemInfo: this.getSystemInfo(),
            status: 'pending'
        };

        return report;
    }

    // Submit error report
    async submitErrorReport(
        error: AppError,
        context: ErrorContext = {},
        userDescription?: string
    ): Promise<boolean> {
        const report = this.createErrorReport(error, context, userDescription);

        // Add to pending reports
        this.pendingReports.push(report);
        this.savePendingReports();

        // Try to send immediately if online
        if (this.isOnline) {
            return this.sendReport(report);
        }

        return false;
    }

    // Send individual report
    private async sendReport(report: ErrorReport): Promise<boolean> {
        try {
            // In a real implementation, you would send to your error reporting service
            const response = await fetch('/api/error-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(report)
            });

            if (response.ok) {
                report.status = 'sent';
                this.removePendingReport(report.id);
                console.log('Error report sent successfully:', report.id);
                return true;
            } else {
                report.status = 'failed';
                console.error('Failed to send error report:', response.statusText);
                return false;
            }
        } catch (error) {
            report.status = 'failed';
            console.error('Error sending report:', error);
            return false;
        }
    }

    // Process all pending reports
    private async processPendingReports(): Promise<void> {
        if (!this.isOnline || this.pendingReports.length === 0) {
            return;
        }

        const pendingReports = [...this.pendingReports];

        for (const report of pendingReports) {
            if (report.status === 'pending') {
                await this.sendReport(report);

                // Add delay between reports to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Get system information
    private getSystemInfo(): SystemInfo {
        const nav = navigator as any;

        return {
            browser: this.getBrowserName(),
            browserVersion: this.getBrowserVersion(),
            os: this.getOperatingSystem(),
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            localStorageEnabled: this.isLocalStorageEnabled(),
            connectionType: nav.connection?.effectiveType || 'unknown'
        };
    }

    // Utility methods
    private getBrowserName(): string {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';

        return 'Unknown';
    }

    private getBrowserVersion(): string {
        const userAgent = navigator.userAgent;
        const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
        return match ? match[2] : 'Unknown';
    }

    private getOperatingSystem(): string {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';

        return 'Unknown';
    }

    private isLocalStorageEnabled(): boolean {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    private getUserId(): string | undefined {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id;
        } catch {
            return undefined;
        }
    }

    private getSessionId(): string | undefined {
        try {
            return sessionStorage.getItem('sessionId') || undefined;
        } catch {
            return undefined;
        }
    }

    private generateReportId(): string {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private loadPendingReports(): void {
        try {
            const stored = localStorage.getItem('pending_error_reports');
            if (stored) {
                this.pendingReports = JSON.parse(stored);
            }

            const storedBreadcrumbs = localStorage.getItem('error_breadcrumbs');
            if (storedBreadcrumbs) {
                this.breadcrumbs = JSON.parse(storedBreadcrumbs);
            }
        } catch (error) {
            console.warn('Failed to load pending reports:', error);
        }
    }

    private savePendingReports(): void {
        try {
            localStorage.setItem('pending_error_reports', JSON.stringify(this.pendingReports));
        } catch (error) {
            console.warn('Failed to save pending reports:', error);
        }
    }

    private removePendingReport(reportId: string): void {
        this.pendingReports = this.pendingReports.filter(report => report.id !== reportId);
        this.savePendingReports();
    }

    // Public methods for breadcrumb management
    addNavigationBreadcrumb(path: string, data?: Record<string, any>): void {
        this.addBreadcrumb('navigation', `Navigated to ${path}`, data);
    }

    addUserActionBreadcrumb(action: string, data?: Record<string, any>): void {
        this.addBreadcrumb('user_action', action, data);
    }

    addApiCallBreadcrumb(endpoint: string, method: string, status?: number): void {
        this.addBreadcrumb('api_call', `${method} ${endpoint}`, { status });
    }

    // Get pending reports count
    getPendingReportsCount(): number {
        return this.pendingReports.filter(report => report.status === 'pending').length;
    }

    // Clear all data
    clearAllData(): void {
        this.breadcrumbs = [];
        this.pendingReports = [];

        try {
            localStorage.removeItem('error_breadcrumbs');
            localStorage.removeItem('pending_error_reports');
        } catch (error) {
            console.warn('Failed to clear error reporting data:', error);
        }
    }
}

// Singleton instance
export const errorReportingService = ErrorReportingService.getInstance();

// React hook for error reporting
export const useErrorReporting = () => {
    const [pendingReportsCount, setPendingReportsCount] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPendingReportsCount(errorReportingService.getPendingReportsCount());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const submitErrorReport = React.useCallback(
        (error: AppError, context?: ErrorContext, userDescription?: string) => {
            return errorReportingService.submitErrorReport(error, context, userDescription);
        },
        []
    );

    const addBreadcrumb = React.useCallback(
        (category: Breadcrumb['category'], message: string, data?: Record<string, unknown>) => {
            errorReportingService.addBreadcrumb(category, message, data);
        },
        []
    );

    return {
        submitErrorReport,
        addBreadcrumb,
        pendingReportsCount,
        hasPendingReports: pendingReportsCount > 0
    };
};

export default {
    ErrorReportingService,
    errorReportingService,
    useErrorReporting
};