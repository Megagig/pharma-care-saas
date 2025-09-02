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
      const response = await fetch('/api/subscriptions/status', {
        credentials: 'include',
      });
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
      // Set fallback status on error
      setSubscriptionStatus({
        hasWorkspace: false,
        hasSubscription: false,
        status: 'error',
        accessLevel: 'basic',
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
    user?.role === 'super_admin';

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
