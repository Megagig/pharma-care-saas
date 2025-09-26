import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Mail as EmailIcon,
  Phone as PhoneIcon,
  MapPin as LocationOnIcon,
  Clock as ScheduleIcon,
  Send as SendIcon,
  ChevronDown as ExpandMoreIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock components for now
const MockFooter = () => (
  <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">PharmaCare</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive pharmacy management solution for healthcare providers in Nigeria.
          </p>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Home</Link></li>
            <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">About</Link></li>
            <li><Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Pricing</Link></li>
            <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Terms of Service</Link></li>
            <li><Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Cookie Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Contact Us</h4>
          <address className="not-italic text-gray-600 dark:text-gray-400">
            <p>123 Healthcare Avenue</p>
            <p>Victoria Island, Lagos</p>
            <p>Nigeria</p>
            <p className="mt-2">Email: support@pharmacare.ng</p>
            <p>Phone: +234 (0) 123 456 7890</p>
          </address>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} PharmaCare. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const MockThemeToggle = ({ size }: { size?: string }) => (
  <button className={`p-2 rounded-md ${size === 'sm' ? 'text-sm' : ''}`}>
    Theme
  </button>
);

const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockInput = ({ ...props }: any) => (
  <input {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`} />
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
  <div {...props} className={`border-b px-6 py-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-lg font-semibold ${props.className || ''}`}>
    {children}
  </h3>
);

const MockLabel = ({ children, ...props }: any) => (
  <label {...props} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${props.className || ''}`}>
    {children}
  </label>
);

const MockAccordion = ({ children, ...props }: any) => (
  <div {...props}>
    {children}
  </div>
);

const MockAccordionItem = ({ children, value, ...props }: any) => (
  <div {...props} className="border-b">
    {children}
  </div>
);

const MockAccordionTrigger = ({ children, ...props }: any) => (
  <button {...props} className="flex justify-between items-center w-full py-4 text-left font-medium">
    {children}
    <ExpandMoreIcon className="h-5 w-5" />
  </button>
);

const MockAccordionContent = ({ children, ...props }: any) => (
  <div {...props} className="pb-4 text-gray-600 dark:text-gray-400">
    {children}
  </div>
);

// Replace imports with mock components
const Footer = MockFooter;
const ThemeToggle = MockThemeToggle;
const Button = MockButton;
const Input = MockInput;
const Card = MockCard;
const CardContent = MockCardContent;
const CardHeader = MockCardHeader;
const CardTitle = MockCardTitle;
const Label = MockLabel;
const Accordion = MockAccordion;
const AccordionContent = MockAccordionContent;
const AccordionItem = MockAccordionItem;
const AccordionTrigger = MockAccordionTrigger;

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>();

  const onSubmit = async (data: ContactForm) => {
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Log form data for debugging (remove in production)
    console.log('Contact form submitted:', data);
    toast.success("Message sent successfully! We'll get back to you soon.");
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                P
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                PharmaCare
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button asChild>
                <Link to="/about">About</Link>
              </Button>
              <Button asChild>
                <Link to="/contact">Contact</Link>
              </Button>
              <Button asChild>
                <Link to="/pricing">Pricing</Link>
              </Button>
              <ThemeToggle size="sm" />
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-blue-100">
              Have questions about PharmaCare? We're here to help. Reach out to
              our team and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Contact Information
            </h2>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <EmailIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      support@pharmacare.ng
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      sales@pharmacare.ng
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <PhoneIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Phone
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      +234 (0) 123 456 7890
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      +234 (0) 987 654 3210
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <LocationOnIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Address
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      123 Healthcare Avenue<br />
                      Victoria Island, Lagos<br />
                      Nigeria
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <ScheduleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Business Hours
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Mon - Fri</span>
                      <span className="text-gray-600 dark:text-gray-400">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Saturday</span>
                      <span className="text-gray-600 dark:text-gray-400">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Sunday</span>
                      <span className="text-gray-600 dark:text-gray-400">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        {...register('name', { required: 'Name is required' })}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      {...register('subject', { required: 'Subject is required' })}
                      className={errors.subject ? 'border-red-500' : ''}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message
                    </Label>
                    <textarea
                      id="message"
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      {...register('message', {
                        required: 'Message is required',
                        minLength: {
                          value: 10,
                          message: 'Message must be at least 10 characters'
                        }
                      })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center"
                  >
                    <SendIcon className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Quick answers to common questions about PharmaCare
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How do I get started with PharmaCare?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400">
                Simply sign up for a free trial account, verify your email,
                and you'll have immediate access to all features for 30 days.
                No credit card required to start your trial.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Is my patient data secure?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400">
                Yes, we use industry-standard encryption and security measures
                to protect all patient data and comply with healthcare privacy
                regulations including HIPAA compliance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400">
                Absolutely. You can cancel your subscription at any time from
                your account settings. No long-term contracts or cancellation
                fees. Your access continues until the end of your billing
                period.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do you offer training and support?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400">
                Yes, we provide comprehensive onboarding, training materials,
                video tutorials, and ongoing customer support to help you get
                the most out of PharmaCare. Enterprise plans include dedicated
                support.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
