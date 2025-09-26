import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockChip = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${props.className || ''}`}>
    {children}
  </span>
);

// Replace imports with mock components
const Button = MockButton;
const Chip = MockChip;

// Mock icons
const CheckCircleIcon = ({ className }: any) => <span className={className}>✓</span>;
const PeopleIcon = ({ className }: any) => <span className={className}>👥</span>;
const FavoriteIcon = ({ className }: any) => <span className={className}>❤️</span>;
const TrendingUpIcon = ({ className }: any) => <span className={className}>📈</span>;
const StarIcon = ({ className }: any) => <span className={className}>⭐</span>;
const ShieldIcon = ({ className }: any) => <span className={className}>🛡️</span>;
const EmojiEventsIcon = ({ className }: any) => <span className={className}>🏆</span>;
const GroupIcon = ({ className }: any) => <span className={className}>👪</span>;
const VisibilityIcon = ({ className }: any) => <span className={className}>👁️</span>;

// Mock hook
const useTheme = () => {
  return {
    mode: 'light'
  };
};

const About: React.FC = () => {
  const theme = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-10 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:border-gray-800">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <div className="font-bold text-xl text-gray-900 dark:text-white">PharmaCare</div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button className="text-gray-700 dark:text-gray-300">
              <Link to="/">Home</Link>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <Link to="/about">About</Link>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <Link to="/contact">Contact</Link>
            </Button>
            <Button className="text-gray-700 dark:text-gray-300">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <ThemeToggle />
            <Button className="text-gray-700 dark:text-gray-300">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About PharmaCare
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Empowering Nigerian pharmacists with modern tools to deliver
              exceptional patient care, streamline operations, and improve
              health outcomes across communities.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Mission Content */}
          <div>
            <Chip className="mb-4">
              Our Mission
            </Chip>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Revolutionizing Pharmaceutical Care in Nigeria
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To revolutionize pharmaceutical care in Nigeria by providing
              pharmacists with cutting-edge technology that enhances patient
              safety, improves medication management, and supports
              evidence-based clinical decisions.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We believe that every patient deserves the highest quality
              pharmaceutical care, and every pharmacist deserves the tools to
              deliver it efficiently and effectively.
            </p>

            {/* Key Features */}
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircleIcon className="text-green-500 mr-2 mt-1" />
                <div className="text-gray-700 dark:text-gray-300">
                  Evidence-based clinical decision support
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="text-green-500 mr-2 mt-1" />
                <div className="text-gray-700 dark:text-gray-300">
                  Advanced medication management tools
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="text-green-500 mr-2 mt-1" />
                <div className="text-gray-700 dark:text-gray-300">
                  Patient safety and error prevention
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <PeopleIcon className="text-blue-600 text-2xl mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  1000+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Pharmacists Served
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <FavoriteIcon className="text-red-500 text-2xl mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  50K+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Patients Helped
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <TrendingUpIcon className="text-green-500 text-2xl mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  98%
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Satisfaction Rate
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <StarIcon className="text-yellow-500 text-2xl mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  4.9
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Average Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Chip className="mb-4">
              Our Core Values
            </Chip>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              The Principles That Guide Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Every decision we make is rooted in these fundamental values that
              drive our commitment to excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <ShieldIcon className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Patient Safety First
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Every feature we build prioritizes patient safety and medication
                accuracy, helping prevent errors and improve outcomes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-yellow-600 mb-4">
                <EmojiEventsIcon className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Excellence in Care
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We empower pharmacists to deliver the highest standard of
                pharmaceutical care through evidence-based tools and insights.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-green-600 mb-4">
                <GroupIcon className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Community Impact
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We're committed to improving healthcare access and quality
                across Nigerian communities, one pharmacy at a time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="py-16 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Chip className="mb-4">
            Our Vision
          </Chip>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Building the Future of Healthcare in Nigeria
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We envision a Nigeria where every pharmacy is equipped with
            world-class technology, every pharmacist has access to the best
            tools and insights, and every patient receives the highest quality
            pharmaceutical care possible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start">
              <VisibilityIcon className="text-blue-600 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Innovation
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Cutting-edge solutions</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start">
              <FavoriteIcon className="text-red-500 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Care
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Patient-centered approach</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start">
              <TrendingUpIcon className="text-green-500 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Growth
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Continuous improvement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Pharmacy?
            </h2>
            <p className="text-blue-100 mb-8">
              Join thousands of pharmacists already using PharmaCare to deliver
              better patient care.
            </p>
            <Button
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg"
            >
              <Link to="/register">Start Your Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
