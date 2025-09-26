import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock authService for now
const authService = {
  getCurrentUser: async () => {
    return { user: { id: '1', firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'pharmacist', status: 'active', emailVerified: true } };
  },
  refreshToken: async () => true,
  login: async (credentials: any) => {
    return { success: true, user: { id: '1', firstName: 'Test', lastName: 'User', email: credentials.email, role: 'pharmacist', status: 'active', emailVerified: true } };
  },
  register: async (userData: any) => {
    return { success: true, message: 'Registration successful' };
  },
  verifyEmail: async (token?: string, code?: string) => {
    return { success: true, message: 'Email verified successfully' };
  },
  logout: async () => { },
  logoutAll: async () => { },
  updateProfile: async (profileData: any) => {
    return { success: true, user: { id: '1', firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'pharmacist', status: 'active', emailVerified: true, ...profileData } };
  },
  forgotPassword: async (email: string) => {
    return { success: true, message: 'Password reset email sent' };
  },
  resetPassword: async (token: string, password: string) => {
    return { success: true, message: 'Password reset successful' };
  }
};

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  currentPlan?: any;
  workplaceId?: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserData;
  token?: string;
}

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

// Utility function to convert UserData to our User type
const convertUserData = (userData: UserData | undefined): User | null => {
  if (!userData) return null;

  // Map the role string to our more specific type
  let typedRole:
    | 'pharmacist'
    | 'technician'
    | 'owner'
    | 'admin'
    | 'super_admin' = 'pharmacist';

  if (
    userData.role === 'pharmacist' ||
    userData.role === 'technician' ||
    userData.role === 'owner' ||
    userData.role === 'admin' ||
    userData.role === 'super_admin'
  ) {
    typedRole = userData.role as
      | 'pharmacist'
      | 'technician'
      | 'owner'
      | 'admin'
      | 'super_admin';
  }

  // Convert the status to the expected type
  let typedStatus: 'pending' | 'active' | 'suspended' = 'pending';
  if (
    userData.status === 'pending' ||
    userData.status === 'active' ||
    userData.status === 'suspended'
  ) {
    typedStatus = userData.status as 'pending' | 'active' | 'suspended';
  }

  // Create a default subscription plan if none exists
  const defaultPlan: SubscriptionPlan = {
    _id: 'default',
    name: 'Basic',
    priceNGN: 0,
    billingInterval: 'monthly',
    features: {
      patientLimit: null,
      reminderSmsMonthlyLimit: null,
      reportsExport: false,
      careNoteExport: false,
      adrModule: false,
      multiUserSupport: false,
    },
  };

  return {
    ...userData,
    role: typedRole,
    status: typedStatus,
    // Ensure currentPlan is properly typed
    currentPlan: userData.currentPlan as SubscriptionPlan || defaultPlan,
    pharmacyId: userData.workplaceId, // Map workplaceId to pharmacyId
  };
};

// Utility function to convert AuthResponse to our AuthResponse type
const convertAuthResponse = (response: AuthResponse): AuthResponse => {
  return {
    ...response,
    // Ensure message exists (even if undefined in the original)
    message: response.message || '',
    // Convert user data if it exists
    user: response.user ? convertUserData(response.user) : undefined,
  } as AuthResponse; // Force type assertion
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth on mount only - no dependencies to avoid re-rendering
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        console.log('AuthContext: Starting authentication check...');

        // Try to get current user - if successful, we're authenticated
        const userData = await authService.getCurrentUser();
        console.log('AuthContext: Authentication successful');
        setUser(convertUserData(userData.user));
      } catch (error: unknown) {
        console.error('AuthContext: Auth initialization failed:', error);
        const authError = error as { status?: number; message?: string };

        // Only clear user on explicit 401 Unauthorized
        if (authError?.status === 401) {
          console.log('AuthContext: 401 received - clearing user');
          setUser(null);
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

    // Clean up function
    return () => { };
  }, []); // Empty dependency array to run only on mount

  // Separate effect for token refresh that doesn't depend on user state
  useEffect(() => {
    // Set up token refresh interval - refresh every 30 minutes to ensure tokens never expire
    // Access token expires in 1 hour, so this gives us a 30-minute safety margin
    const tokenRefreshInterval = setInterval(async () => {
      try {
        // Check if user is logged in from a ref or some other means that doesn't cause re-renders
        console.log('AuthContext: Running scheduled token refresh');
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          console.warn('AuthContext: Scheduled token refresh failed');
        }
      } catch (error) {
        console.error(
          'AuthContext: Error during scheduled token refresh:',
          error
        );
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Clean up interval on component unmount
    return () => clearInterval(tokenRefreshInterval);
  }, []); // Empty dependency array to run only on mount
  const login = async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    const serviceResponse = await authService.login(credentials);
    const response = convertAuthResponse(serviceResponse);
    if (response.success && response.user) {
      const convertedUser = convertUserData(response.user);
      if (convertedUser) {
        setUser(convertedUser);
      }
    }
    return response;
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    const serviceResponse = await authService.register(userData);
    // Note: Registration doesn't automatically log in due to email verification
    return convertAuthResponse(serviceResponse);
  };

  const verifyEmail = async (
    token?: string,
    code?: string
  ): Promise<AuthResponse> => {
    const serviceResponse = await authService.verifyEmail(token, code);
    return convertAuthResponse(serviceResponse);
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Logout all failed:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (
    profileData: Partial<User>
  ): Promise<AuthResponse> => {
    const serviceResponse = await authService.updateProfile(profileData);
    const response = convertAuthResponse(serviceResponse);
    if (response.success && response.user) {
      const convertedUser = convertUserData(response.user);
      if (convertedUser) {
        setUser(convertedUser);
      }
    }
    return response;
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    const serviceResponse = await authService.forgotPassword(email);
    return convertAuthResponse(serviceResponse);
  };

  const resetPassword = async (
    token: string,
    password: string
  ): Promise<AuthResponse> => {
    const serviceResponse = await authService.resetPassword(token, password);
    return convertAuthResponse(serviceResponse);
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
