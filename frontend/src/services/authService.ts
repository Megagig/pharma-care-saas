import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a type for the auth service to help with imports
export type AuthServiceType = {
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  // Add other methods as needed
  // This will ensure TypeScript knows what methods are available
};

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

interface RegisterWithWorkplaceData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  licenseNumber?: string;
  role?: string;
  workplaceFlow: 'create' | 'join' | 'skip';
  workplace?: {
    name: string;
    type: string;
    licenseNumber: string;
    email: string;
    address?: string;
    state?: string;
    lga?: string;
  };
  inviteCode?: string;
  workplaceRole?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface AuthError extends Error {
  status?: number;
  data?: unknown;
}

class AuthService {
  private refreshPromise: Promise<boolean> | null = null;

  async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await axios({
        url: `${API_BASE_URL}${url}`,
        method: (options.method as any) || 'GET',
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers: {
          'Content-Type': 'application/json',
          ...((options.headers as Record<string, string>) || {}),
        },
        withCredentials: true, // Always include cookies
      });

      return response.data;
    } catch (error: any) {
      // If token expired, try to refresh (but avoid infinite loops)
      if (
        error.response?.status === 401 &&
        !url.includes('/auth/refresh-token') &&
        !url.includes('/auth/me') &&
        !url.includes('/auth/login') &&
        !url.includes('/auth/register')
      ) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          const retryResponse = await axios({
            url: `${API_BASE_URL}${url}`,
            method: (options.method as any) || 'GET',
            data: options.body ? JSON.parse(options.body as string) : undefined,
            headers: {
              'Content-Type': 'application/json',
              ...((options.headers as Record<string, string>) || {}),
            },
            withCredentials: true,
          });
          return retryResponse.data;
        }
      }

      // Handle different types of authentication/authorization errors
      if (error.response?.status === 401) {
        // Only redirect to login if this is not an auth check
        if (!url.includes('/auth/me') && !url.includes('/auth/refresh-token')) {
          window.location.href = '/login';
        }
        const authError: AuthError = new Error(
          error.response.data?.message || 'Authentication failed'
        );
        authError.status = error.response.status;
        throw authError;
      } else if (error.response?.status === 402) {
        // Payment/subscription required - don't logout, just throw error
        const authError: AuthError = new Error(
          error.response.data?.message || 'Subscription required'
        );
        authError.status = error.response.status;
        throw authError;
      }

      const authError: AuthError = new Error(
        error.response?.data?.message || error.message || 'An error occurred'
      );
      authError.status = error.response?.status;
      throw authError;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        {
          withCredentials: true, // Include httpOnly cookies
        }
      );

      if (response.status === 200) {
        // New access token is automatically set as httpOnly cookie by server
        return true;
      } else {
        // Refresh failed, redirect to login
        return false;
      }
    } catch (err) {
      console.error('Refresh error:', err);
      return false;
    }
  }

  async register(userData: RegisterData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async registerWithWorkplace(userData: RegisterWithWorkplaceData) {
    return this.makeRequest('/auth/register-with-workplace', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async findWorkplaceByInviteCode(inviteCode: string) {
    return this.makeRequest(`/auth/workplace/invite/${inviteCode}`, {
      method: 'GET',
    });
  }

  async login(credentials: LoginCredentials) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // No need to store tokens - they're automatically set as httpOnly cookies by server
    return response;
  }

  async verifyEmail(token?: string, code?: string) {
    const body: { token?: string; code?: string } = {};
    if (token) body.token = token;
    if (code) body.code = code;

    return this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async logout() {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if server request fails
      console.error('Logout request failed:', error);
    }
    // Cookies are cleared by server
  }

  async logoutAll() {
    try {
      await this.makeRequest('/auth/logout-all', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout all request failed:', error);
    }
    // Cookies are cleared by server
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async updateProfile(profileData: ProfileData) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async forgotPassword(email: string) {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async clearCookies() {
    try {
      await this.makeRequest('/auth/clear-cookies', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Clear cookies request failed:', error);
    }
    // Redirect to login page
    window.location.href = '/login';
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Try to get current user - if successful, we're authenticated
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

// Create the service instance
const authServiceInstance = new AuthService();

// Export as a named export
export const authService = authServiceInstance;
