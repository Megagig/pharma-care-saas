import React, { useState } from 'react';
import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';
import { Star, Bolt, Check, Loader2 } from 'lucide-react';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardHeader = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-xl font-bold ${props.className || ''}`}>
    {children}
  </h3>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md ${props.className || ''}`}>
    {children}
  </div>
);

const MockAlertDescription = ({ children, ...props }: any) => (
  <div {...props} className={`text-sm ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordion = ({ children, ...props }: any) => (
  <div {...props} className={`w-full ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordionItem = ({ children, ...props }: any) => (
  <div {...props} className={`border-b ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordionTrigger = ({ children, ...props }: any) => (
  <button {...props} className={`flex justify-between items-center w-full py-4 text-left font-medium ${props.className || ''}`}>
    {children}
    <span>▼</span>
  </button>
);

const MockAccordionContent = ({ children, ...props }: any) => (
  <div {...props} className={`pb-4 pt-2 text-sm ${props.className || ''}`}>
    {children}
  </div>
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.variant === 'secondary'
      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
    } ${props.className || ''}`}>
    {children}
  </span>
);

// Replace imports with mock components
const Button = MockButton;
const Card = MockCard;
const CardContent = MockCardContent;
const CardHeader = MockCardHeader;
const CardTitle = MockCardTitle;
const Alert = MockAlert;
const AlertDescription = MockAlertDescription;
const Accordion = MockAccordion;
const AccordionItem = MockAccordionItem;
const AccordionTrigger = MockAccordionTrigger;
const AccordionContent = MockAccordionContent;
const Badge = MockBadge;

const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Mock data for plans
  const plans = [
    {
      _id: '1',
      name: 'Basic',
      priceNGN: 5000,
      displayedFeatures: ['Up to 5 users', 'Basic patient management', 'Email support'],
      metadata: { mostPopular: false }
    },
    {
      _id: '2',
      name: 'Professional',
      priceNGN: 15000,
      displayedFeatures: ['Up to 20 users', 'Advanced patient management', 'Priority support', 'Analytics dashboard'],
      metadata: { mostPopular: true }
    },
    {
      _id: '3',
      name: 'Enterprise',
      priceNGN: 30000,
      displayedFeatures: ['Unlimited users', 'Full feature access', '24/7 phone support', 'Custom integrations'],
      metadata: { mostPopular: false },
      isContactSales: true,
      whatsappNumber: '1234567890'
    }
  ];

  const handleSubscribe = (planId: string) => {
    // Mock implementation
    console.log(`Subscribing to plan ${planId}`);
  };

  const handleContactSales = (whatsappNumber?: string) => {
    if (whatsappNumber) {
      const message = encodeURIComponent(
        "Hello, I'm interested in the Enterprise plan. Please provide more information."
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    }
  };

  const handleBillingIntervalChange = (interval: 'monthly' | 'yearly') => {
    setBillingInterval(interval);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
            <div className="font-bold text-xl">PharmaCare</div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button className="text-gray-700 dark:text-gray-300">
              <a href="/">Home</a>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <a href="/about">About</a>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <a href="/contact">Contact</a>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <a href="/pricing">Pricing</a>
            </Button>
            <ThemeToggle />
            <Button className="text-gray-700 dark:text-gray-300">
              <a href="/login">Sign In</a>
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <a href="/register">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your pharmacy practice. Upgrade or
            downgrade at any time.
          </p>
          <Badge className="px-4 py-2">
            🎉 30-day free trial on all plans
          </Badge>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${billingInterval === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => handleBillingIntervalChange('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${billingInterval === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => handleBillingIntervalChange('yearly')}
            >
              Yearly (Save 25%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {plans.map((plan, index) => (
            <div key={plan._id || index} className="relative">
              <Card className={`h-full ${plan.metadata?.mostPopular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.metadata?.mostPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {plan.name === 'Enterprise' ? (
                      <Star className="h-8 w-8 text-blue-600" />
                    ) : (
                      <Bolt className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.isContactSales ? (
                    <div className="mt-4">
                      <div className="text-2xl font-bold">Contact Sales</div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        ₦{plan.priceNGN.toLocaleString()}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Billed {billingInterval}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  {plan.isContactSales ? (
                    <Button
                      className="mt-auto bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => handleContactSales(plan.whatsappNumber)}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      className={`mt-auto ${plan.metadata?.mostPopular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => handleSubscribe(plan._id)}
                    >
                      {plan.metadata?.mostPopular ? 'Start Free Trial' : 'Get Started'}
                    </Button>
                  )}
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">What's included:</h3>
                    <ul className="space-y-2">
                      {plan.displayedFeatures.map((feature: string, featureIndex: number) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion className="w-full">
              <AccordionItem>
                <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
                <AccordionContent>
                  Yes! You can upgrade or downgrade your plan at any time from your account settings.
                  Changes take effect immediately, and you'll be charged or refunded the prorated amount
                  based on your billing cycle. There are no penalties for changing plans.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>What happens during the free trial?</AccordionTrigger>
                <AccordionContent>
                  You get full access to all features for 30 days with no restrictions. No credit card is
                  required to start your trial. After the trial period ends, you can choose to continue
                  with a paid plan or your account will be paused until you subscribe.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>Is my data secure and HIPAA compliant?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! All plans include enterprise-grade security with end-to-end encryption,
                  secure data centers, and full HIPAA compliance. We undergo regular security audits and
                  maintain SOC 2 Type II certification to ensure your patient data is always protected.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gray-100 dark:bg-gray-800 rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Join thousands of pharmacists already using PharmaCare to improve patient outcomes
            and streamline their workflow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <a href="/register">Start Free Trial</a>
            </Button>
            <Button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50">
              <a href="/contact">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
