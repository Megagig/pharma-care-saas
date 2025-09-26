import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';

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

const MockAvatar = ({ children, ...props }: any) => (
  <div {...props} className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 ${props.className || ''}`}>
    {children}
  </div>
);

// Mock icons
const PeopleIcon = ({ className }: any) => <span className={className}>👥</span>;
const SecurityIcon = ({ className }: any) => <span className={className}>🔒</span>;
const BarChartIcon = ({ className }: any) => <span className={className}>📊</span>;
const ScheduleIcon = ({ className }: any) => <span className={className}>⏰</span>;
const CheckCircleIcon = ({ className }: any) => <span className={className}>✅</span>;
const ArrowForwardIcon = ({ className }: any) => <span className={className}>→</span>;

// Mock Rating component
const Rating = ({ value, ...props }: any) => (
  <div {...props} className="flex">
    {[...Array(5)].map((_, i) => (
      <span key={i} className={i < value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))}
  </div>
);

// Mock hook
const useTheme = () => ({
  mode: 'light'
});

// Replace imports with mock components
const Button = MockButton;
const Card = MockCard;
const CardContent = MockCardContent;
const Avatar = MockAvatar;

const Landing = () => {
  const theme = useTheme();
  const features = [
    {
      icon: PeopleIcon,
      title: 'Patient Management',
      description:
        'Comprehensive patient profiles with medical history, medications, and contact information.',
    },
    {
      icon: SecurityIcon,
      title: 'HIPAA Compliant',
      description:
        'Enterprise-grade security ensuring all patient data is protected and compliant.',
    },
    {
      icon: BarChartIcon,
      title: 'Clinical Analytics',
      description:
        'Advanced reporting and analytics to track patient outcomes and medication adherence.',
    },
    {
      icon: ScheduleIcon,
      title: 'Time Saving',
      description:
        'Streamline your workflow with automated documentation and smart reminders.',
    },
  ];
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Clinical Pharmacist',
      content:
        'PharmaCare has transformed how I manage my patients. The clinical notes feature is incredibly detailed and saves me hours each week.',
      rating: 5,
      avatar: 'S',
    },
    {
      name: 'Michael Chen',
      role: 'Pharmacy Manager',
      content:
        'The medication interaction checks and adherence tracking have significantly improved our patient care quality.',
      rating: 5,
      avatar: 'M',
    },
  ];
  const benefits = [
    'Comprehensive patient medication profiles',
    'SOAP note clinical documentation',
    'Drug interaction and allergy checking',
    'Medication adherence monitoring',
    'Automated follow-up reminders',
    'Advanced reporting and analytics',
  ];
  return (
    <div className="">
      {/* Navigation */}
      <header className="bg-transparent static">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
              P
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              PharmaCare
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="text-gray-700 dark:text-gray-300">
              About
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              Contact
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              Pricing
            </Button>
            <ThemeToggle size="sm" />
            <Button className="text-gray-700 dark:text-gray-300">
              Sign In
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive{' '}
              <span className="text-blue-600 dark:text-blue-400">
                Pharmaceutical Care
              </span>
              <br />
              Management Platform
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Empower your pharmacy practice with advanced patient management,
              clinical documentation, and medication therapy optimization tools
              designed specifically for pharmacists.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center">
                Start Free Trial
                <ArrowForwardIcon className="ml-2" />
              </Button>
              <Button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Modern Pharmaceutical Care
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools pharmacists need
              to deliver exceptional patient care and optimize medication therapy
              outcomes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <IconComponent className="text-blue-600 dark:text-blue-400 text-3xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Streamline Your Clinical Workflow
              </h2>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircleIcon className="text-green-500 mr-2" />
                    <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button className="mt-6 bg-blue-600 text-white hover:bg-blue-700 flex items-center">
                Get Started Today
                <ArrowForwardIcon className="ml-2" />
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Active Patients
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    147
                  </div>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Clinical Notes
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    523
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Adherence Rate
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    94.2%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what pharmacists are saying about PharmaCare
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <Rating value={testimonial.rating} className="mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <Avatar className="mr-3">
                      {testimonial.avatar}
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Join thousands of pharmacists already using PharmaCare to improve
              patient outcomes
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 flex items-center">
                Start Free Trial
                <ArrowForwardIcon className="ml-2" />
              </Button>
              <Button className="bg-transparent text-white border border-white hover:bg-blue-700">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
