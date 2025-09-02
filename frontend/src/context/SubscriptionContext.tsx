import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionStatus {
  hasWorkspace: boolean;
  hasSubscription: boolean;
  status: string;
  tier?: string;
  accessLevel: 'basic' | 'limited' | 'full';
  isTrialActive?: boolean;
  daysRemaining?: number;
  endDate?: string;
  message?: string;
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  isActive: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const useSubscriptionContext = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscriptionContext must be used within a SubscriptionProvider'
    );
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get auth token from localStorage or cookies
      const authToken =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/subscriptions/status', {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        // If unauthorized, set basic access
        if (response.status === 401) {
          setSubscriptionStatus({
            hasWorkspace: false,
            hasSubscription: false,
            status: 'unauthorized',
            accessLevel: 'basic',
            message: 'Please log in to access subscription features',
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, got:', contentType);
        throw new Error('Invalid response type from server');
      }

      const data = await response.json();

      if (data.success) {
        setSubscriptionStatus(data.data);
      } else {
        // Fallback status for users without subscription data
        setSubscriptionStatus({
          hasWorkspace: false,
          hasSubscription: false,
          status: 'no_subscription',
          accessLevel: 'basic',
          message: 'No subscription data available',
        });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Set fallback status on error - allow basic access for super admin
      setSubscriptionStatus({
        hasWorkspace: !!user?.workplaceId,
        hasSubscription: false,
        status: 'error',
        accessLevel:
          (user?.role as string) === 'super_admin' ? 'full' : 'basic',
        message: 'Failed to load subscription data',
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  // Refetch subscription status when user changes (e.g., after login)
  useEffect(() => {
    if (user) {
      // Small delay to ensure backend has processed the login
      const timer = setTimeout(() => {
        fetchSubscriptionStatus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]); // Only trigger when user ID changes

  const isActive =
    subscriptionStatus?.accessLevel === 'full' ||
    subscriptionStatus?.isTrialActive ||
    (user?.role as string) === 'super_admin' ||
    (subscriptionStatus?.status === 'error' &&
      (user?.role as string) === 'super_admin');

  const value = {
    subscriptionStatus,
    loading,
    isActive,
    refetch: fetchSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
