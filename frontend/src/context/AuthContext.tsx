import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authService } from '../services/authService';

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
  role: 'pharmacist' | 'technician' | 'owner' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  currentPlan: SubscriptionPlan;
  pharmacyId?: string;
  lastLoginAt?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (userData: RegisterData) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      // Note: Registration doesn't automatically log in due to email verification
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (error) {
      throw error;
    }
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

  const updateProfile = async (profileData: unknown) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await authService.resetPassword(token, password);
      return response;
    } catch (error) {
      throw error;
    }
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
