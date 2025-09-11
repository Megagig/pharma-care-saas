import React, {
   createContext,
   useContext,
   useState,
   useEffect,
   ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

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

         console.log(
            '🔍 SubscriptionContext: Making request to /api/subscriptions/status'
         );

         const response = await axios.get('/api/subscriptions/status', {
            withCredentials: true, // Use httpOnly cookies for authentication
         });

         console.log('🔍 SubscriptionContext: Response received:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            headers: response.headers,
         });

         if (response.data.success) {
            setSubscriptionStatus(response.data.data);
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
      } catch (error: any) {
         console.error('Error fetching subscription status:', error);

         // If unauthorized, set basic access
         if (error.response?.status === 401) {
            setSubscriptionStatus({
               hasWorkspace: false,
               hasSubscription: false,
               status: 'unauthorized',
               accessLevel: 'basic',
               message: 'Please log in to access subscription features',
            });
            return;
         }

         // Set fallback status on error - allow basic access for super admin
         setSubscriptionStatus({
            hasWorkspace: !!user?.pharmacyId,
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
