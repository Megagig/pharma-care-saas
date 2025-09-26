import React, { useState } from 'react';
import SubscriptionManagement from '../components/subscription/SubscriptionManagement';
import BillingHistory from '../components/subscription/BillingHistory';
import PaymentMethodsManagement from '../components/subscription/PaymentMethodsManagement';
import SubscriptionAnalytics from '../components/subscription/SubscriptionAnalytics';
import FeatureGuard from '../components/FeatureGuard';
import ErrorBoundary from '../components/ErrorBoundary';
import { Button } from '@/components/ui/button';

const Subscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Plans', component: <SubscriptionManagement /> },
    { id: 1, label: 'Billing History', component: <BillingHistory /> },
    { id: 2, label: 'Payment Methods', component: <PaymentMethodsManagement /> },
    {
      id: 3,
      label: 'Analytics',
      component: (
        <FeatureGuard feature="advanced_analytics">
          <SubscriptionAnalytics />
        </FeatureGuard>
      )
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription plans, billing, and payment methods
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <ErrorBoundary>
        <div className="mt-6">
          {tabs[activeTab].component}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default Subscriptions;
