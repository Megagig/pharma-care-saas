import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { markAuthAttempted, clearSessionState } from '../utils/cookieUtils';

interface SubscriptionPlan {
  _id: string;
  name: string;
  priceNGN: number;
  billingInterval: 'monthly' | 'yearly';
  features: {
    patientLimit: number | null;
    reminderSmsMonthlyLimit: number | null;
    reportsExport: boolean;
    careNoteExport: boolean;
    adrModule: boolean;
    multiUserSupport: boolean;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'pharmacist' | 'technician' | 'owner' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  currentPlan: SubscriptionPlan;
  pharmacyId?: string;
  lastLoginAt?: Date;
  licenseStatus?: 'pending' | 'approved' | 'rejected';
  subscription?: {
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'trial';
    expiresAt: string;
    canceledAt?: string;
    tier?: string;
  };
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  verifyEmail: (token?: string, code?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (token: string, password: string) => Promise<AuthResponse>;
  hasFeature: (featureName: string) => boolean;
  checkLimit: (limitName: string, currentCount: number) => boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'pharmacist' | 'technician' | 'owner';
}

interface AuthProviderProps {
  children: ReactNode;
}

// Export the context and types for use in hooks
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Note: useAuth hook is now in ../hooks/useAuth.ts
export type { AuthContextType };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        console.log('AuthContext: Starting authentication check...');

        // Try to get current user - if successful, we're authenticated
        const userData = await authService.getCurrentUser();
        console.log('AuthContext: Authentication successful');
        setUser(userData.user);
        markAuthAttempted();
      } catch (error: unknown) {
        console.error('AuthContext: Auth initialization failed:', error);
        const authError = error as { status?: number; message?: string };

        // Only clear user on explicit 401 Unauthorized
        if (authError?.status === 401) {
          console.log('AuthContext: 401 received - clearing user');
          setUser(null);
          clearSessionState();
        } else {
          console.log('AuthContext: Non-401 error - keeping current state');
          // For all other errors (network, server errors, etc.), maintain current state
          // This prevents losing authentication due to temporary issues
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);
  const login = async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    const response = await authService.login(credentials);
    if (response.success && response.user) {
      setUser(response.user);
      markAuthAttempted(); // Mark successful auth attempt
    }
    return response;
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await authService.register(userData);
    // Note: Registration doesn't automatically log in due to email verification
    return response;
  };

  const verifyEmail = async (
    token?: string,
    code?: string
  ): Promise<AuthResponse> => {
    const response = await authService.verifyEmail(token, code);
    return response;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      clearSessionState(); // Clear session markers
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Logout all failed:', error);
    } finally {
      setUser(null);
      clearSessionState(); // Clear session markers
    }
  };

  const updateProfile = async (
    profileData: Partial<User>
  ): Promise<AuthResponse> => {
    const response = await authService.updateProfile(profileData);
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    const response = await authService.forgotPassword(email);
    return response;
  };

  const resetPassword = async (
    token: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await authService.resetPassword(token, password);
    return response;
  };

  const hasFeature = (featureName: string): boolean => {
    if (!user || !user.currentPlan) return false;
    return (
      user.currentPlan.features[
        featureName as keyof typeof user.currentPlan.features
      ] === true
    );
  };

  const checkLimit = (limitName: string, currentCount: number): boolean => {
    if (!user || !user.currentPlan) return false;
    const limit =
      user.currentPlan.features[
        limitName as keyof typeof user.currentPlan.features
      ];
    return limit === null || currentCount < (limit as number);
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyEmail,
    logout,
    logoutAll,
    updateProfile,
    forgotPassword,
    resetPassword,
    hasFeature,
    checkLimit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
