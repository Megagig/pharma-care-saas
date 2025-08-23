import React from 'react';
import { Check, X, CreditCard, Calendar, AlertCircle } from 'lucide-react';

const Subscriptions = () => {
  // Mock current subscription data
  const currentSubscription = {
    plan: 'professional',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-02-01',
    priceAtPurchase: 59.99,
    autoRenew: true,
    usage: {
      patients: { current: 89, limit: 200 },
      notes: { current: 1247, limit: 2000 },
      storage: { current: 3.2, limit: 10 }
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      description: 'Perfect for individual pharmacists',
      features: [
        'Up to 50 patients',
        '500 clinical notes',
        '2GB storage',
        'Basic reporting',
        'Email support',
        'HIPAA compliant'
      ],
      notIncluded: [
        'Advanced analytics',
        'Priority support',
        'Custom integrations'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59.99,
      description: 'Ideal for growing practices',
      features: [
        'Up to 200 patients',
        '2,000 clinical notes',
        '10GB storage',
        'Advanced reporting',
        'Priority email support',
        'HIPAA compliant',
        'Drug interaction alerts',
        'Medication adherence tracking'
      ],
      notIncluded: [
        'Custom integrations'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      description: 'For large pharmacy operations',
      features: [
        'Unlimited patients',
        'Unlimited clinical notes',
        '50GB storage',
        'Advanced analytics dashboard',
        '24/7 phone & email support',
        'HIPAA compliant',
        'Drug interaction alerts',
        'Medication adherence tracking',
        'Custom integrations',
        'API access',
        'Dedicated account manager'
      ],
      notIncluded: []
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600">Manage your PharmaCare subscription and billing</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            currentSubscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {currentSubscription.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Plan</h3>
            <p className="text-lg font-semibold text-gray-900 capitalize">{currentSubscription.plan}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Cost</h3>
            <p className="text-lg font-semibold text-gray-900">${currentSubscription.priceAtPurchase}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Next Billing</h3>
            <p className="text-lg font-semibold text-gray-900">{formatDate(currentSubscription.endDate)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Auto Renewal</h3>
            <p className="text-lg font-semibold text-gray-900">
              {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Usage This Month</h3>
          <div className="space-y-4">
            {Object.entries(currentSubscription.usage).map(([key, usage]) => {
              const percentage = getUsagePercentage(usage.current, usage.limit);
              const isUnlimited = usage.limit === -1;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key === 'storage' ? `${key} (GB)` : key}
                    </span>
                    <span className="text-sm text-gray-600">
                      {key === 'storage' ? `${usage.current} GB` : usage.current}
                      {!isUnlimited && ` / ${key === 'storage' ? `${usage.limit} GB` : usage.limit}`}
                      {isUnlimited && ' / Unlimited'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage >= 90 ? 'bg-red-500' :
                        percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: isUnlimited ? '25%' : `${percentage}%` }}
                    ></div>
                  </div>
                  {percentage >= 90 && !isUnlimited && (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Approaching limit - consider upgrading
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentSubscription.plan;
            
            return (
              <div key={plan.id} className={`rounded-xl shadow-sm border overflow-hidden relative ${
                isCurrent ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
              }`}>
                {isCurrent && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                    Current Plan
                  </div>
                )}
                
                <div className="bg-white p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <button 
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors mb-6 ${
                      isCurrent 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current Plan' : 'Upgrade to This Plan'}
                  </button>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, index) => (
                      <div key={index} className="flex items-center opacity-50">
                        <X className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/2025</p>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Update Card
          </button>
        </div>
      </div>

      {/* Subscription Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Auto-renewal</h3>
              <p className="text-sm text-gray-600">Automatically renew your subscription each month</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={currentSubscription.autoRenew}
                readOnly
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>View Billing History</span>
            </button>
            <button className="text-red-600 hover:text-red-700 px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;