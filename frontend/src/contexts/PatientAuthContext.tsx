import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface PatientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  workspaceId: string;
  workspaceName: string;
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  profileComplete: boolean;
  lastLoginAt?: Date;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
    language: string;
    timezone: string;
  };
}

interface PatientAuthResponse {
  success: boolean;
  message?: string;
  user?: PatientUser;
  token?: string;
  requiresApproval?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  workspaceId: string;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  password: string;
  workspaceId: string;
}

interface PatientAuthContextType {
  user: PatientUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<PatientAuthResponse>;
  register: (userData: RegistrationData) => Promise<PatientAuthResponse>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<PatientAuthResponse>;
  forgotPassword: (email: string, workspaceId: string) => Promise<PatientAuthResponse>;
  resetPassword: (token: string, password: string) => Promise<PatientAuthResponse>;
  updateProfile: (profileData: Partial<PatientUser>) => Promise<PatientAuthResponse>;
  refreshToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

interface PatientAuthProviderProps {
  children: ReactNode;
}

export const PatientAuthContext = createContext<PatientAuthContextType | undefined>(
  undefined
);

// Token management utilities
const TOKEN_KEY = 'patient_auth_token';
const USER_KEY = 'patient_user_data';

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
};

const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

const getStoredUser = (): PatientUser | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user: PatientUser): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

// Mock API service - replace with actual API calls
class PatientAuthService {
  private static baseUrl = '/api/patient-portal/auth';

  static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getStoredToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async login(credentials: LoginCredentials): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate different scenarios
    if (credentials.email === 'suspended@example.com') {
      return {
        success: false,
        message: 'Your account has been suspended. Please contact the pharmacy.',
      };
    }

    if (credentials.email === 'pending@example.com') {
      return {
        success: false,
        message: 'Your account is pending approval. Please wait for confirmation.',
      };
    }

    if (credentials.password === 'wrongpassword') {
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    const mockUser: PatientUser = {
      id: 'patient_123',
      email: credentials.email,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+234-801-234-5678',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      workspaceId: credentials.workspaceId,
      workspaceName: 'Test Pharmacy',
      status: 'active',
      emailVerified: true,
      profileComplete: true,
      lastLoginAt: new Date(),
      preferences: {
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
        },
        language: 'en',
        timezone: 'Africa/Lagos',
      },
    };

    return {
      success: true,
      user: mockUser,
      token: 'mock_jwt_token_' + Date.now(),
      message: 'Login successful',
    };
  }

  static async register(userData: RegistrationData): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate email already exists
    if (userData.email === 'existing@example.com') {
      return {
        success: false,
        message: 'An account with this email already exists.',
      };
    }

    // Simulate different approval scenarios
    const requiresApproval = Math.random() > 0.5;

    return {
      success: true,
      message: requiresApproval 
        ? 'Registration successful! Your account is pending approval.'
        : 'Registration successful! Please check your email to verify your account.',
      requiresApproval,
    };
  }

  static async getCurrentUser(): Promise<{ user: PatientUser }> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUser = getStoredUser();
    if (!storedUser) {
      throw new Error('No authenticated user');
    }

    return { user: storedUser };
  }

  static async refreshToken(): Promise<{ token: string }> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      token: 'refreshed_mock_jwt_token_' + Date.now(),
    };
  }

  static async logout(): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  static async verifyEmail(token: string): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (token === 'invalid_token') {
      return {
        success: false,
        message: 'Invalid or expired verification token.',
      };
    }

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
    };
  }

  static async forgotPassword(email: string, workspaceId: string): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Password reset instructions have been sent to your email.',
    };
  }

  static async resetPassword(token: string, password: string): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (token === 'invalid_token') {
      return {
        success: false,
        message: 'Invalid or expired reset token.',
      };
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }

  static async updateProfile(profileData: Partial<PatientUser>): Promise<PatientAuthResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const storedUser = getStoredUser();
    if (!storedUser) {
      throw new Error('No authenticated user');
    }

    const updatedUser = { ...storedUser, ...profileData };

    return {
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully!',
    };
  }
}

export const PatientAuthProvider: React.FC<PatientAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && user.status === 'active';

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const token = getStoredToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await PatientAuthService.getCurrentUser();
        setUser(userData.user);
        setStoredUser(userData.user);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid stored data
        removeStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await PatientAuthService.refreshToken();
        setStoredToken(response.token);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        await logout();
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<PatientAuthResponse> => {
    try {
      const response = await PatientAuthService.login(credentials);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setStoredToken(response.token);
        setStoredUser(response.user);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  };

  const register = async (userData: RegistrationData): Promise<PatientAuthResponse> => {
    try {
      return await PatientAuthService.register(userData);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await PatientAuthService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      removeStoredToken();
    }
  };

  const verifyEmail = async (token: string): Promise<PatientAuthResponse> => {
    try {
      return await PatientAuthService.verifyEmail(token);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Email verification failed.',
      };
    }
  };

  const forgotPassword = async (email: string, workspaceId: string): Promise<PatientAuthResponse> => {
    try {
      return await PatientAuthService.forgotPassword(email, workspaceId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send password reset email.',
      };
    }
  };

  const resetPassword = async (token: string, password: string): Promise<PatientAuthResponse> => {
    try {
      return await PatientAuthService.resetPassword(token, password);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Password reset failed.',
      };
    }
  };

  const updateProfile = async (profileData: Partial<PatientUser>): Promise<PatientAuthResponse> => {
    try {
      const response = await PatientAuthService.updateProfile(profileData);
      
      if (response.success && response.user) {
        setUser(response.user);
        setStoredUser(response.user);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Profile update failed.',
      };
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await PatientAuthService.refreshToken();
      setStoredToken(response.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const userData = await PatientAuthService.getCurrentUser();
      setUser(userData.user);
      setStoredUser(userData.user);
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
      removeStoredToken();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshToken,
    checkAuthStatus,
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};

export default PatientAuthProvider;