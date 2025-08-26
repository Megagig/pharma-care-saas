// Utility to check authentication status using httpOnly cookies
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        return response.ok;
    } catch {
        return false;
    }
};

// Utility to check if user has a specific role
export const hasRole = async (requiredRole: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.user?.role === requiredRole;
    } catch {
        return false;
    }
};