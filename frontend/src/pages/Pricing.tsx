import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Star } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: 29,
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
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: 59,
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
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 99,
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
      notIncluded: [],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">PharmaCare</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your pharmacy practice. All plans include a 14-day free trial.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`${plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : 'ring-1 ring-gray-200'} bg-white rounded-xl shadow-lg overflow-hidden relative`}>
              {plan.popular && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  <Star className="inline w-4 h-4 mr-1" />
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <Link to="/register" className={`${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'} text-white w-full py-3 px-4 rounded-lg font-medium transition-colors block text-center mb-8`}>
                  Start Free Trial
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center opacity-50">
                      <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-500">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All plans come with a 14-day free trial. No credit card required to get started.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure and HIPAA compliant?
              </h3>
              <p className="text-gray-600">
                Yes, all plans are HIPAA compliant with enterprise-grade security. Your patient data is encrypted and stored securely.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards and bank transfers for enterprise plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;