const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  private refreshPromise: Promise<any> | null = null;

  async makeRequest(url: string, options: any = {}) {
    const token = localStorage.getItem('accessToken');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh token
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${url}`, config);

    // If token expired, try to refresh
    if (response.status === 401 && token && !url.includes('/auth/refresh-token')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
        response = await fetch(`${API_BASE_URL}${url}`, config);
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.clearTokens();
        window.location.href = '/login';
      }
      throw new Error(data.message || 'An error occurred');
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
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
  }

  async register(userData: any) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: any) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }

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
    } finally {
      this.clearTokens();
    }
  }

  async logoutAll() {
    try {
      await this.makeRequest('/auth/logout-all', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout all request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async updateProfile(profileData: any) {
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

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();