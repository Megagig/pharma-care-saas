const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
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
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      },
      credentials: 'include' as RequestCredentials, // Always include cookies
      ...options,
    };

    let response = await fetch(`${API_BASE_URL}${url}`, config);

    // If token expired, try to refresh (but avoid infinite loops)
    if (
      response.status === 401 &&
      !url.includes('/auth/refresh-token') &&
      !url.includes('/auth/me') &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register')
    ) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the original request
        response = await fetch(`${API_BASE_URL}${url}`, config);
      }
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle different types of authentication/authorization errors
      if (response.status === 401) {
        // Only redirect to login if this is not an auth check
        if (!url.includes('/auth/me') && !url.includes('/auth/refresh-token')) {
          window.location.href = '/login';
        }
        const error: AuthError = new Error(
          data.message || 'Authentication failed'
        );
        error.status = response.status;
        throw error;
      } else if (response.status === 402) {
        // Payment/subscription required - don't logout, just throw error
        const error: AuthError = new Error(
          data.message || 'Subscription required'
        );
        error.status = response.status;
        throw error;
      }
      const error: AuthError = new Error(data.message || 'An error occurred');
      error.status = response.status;
      throw error;
    }

    return data;
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });

      if (response.ok) {
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

export const authService = new AuthService();
