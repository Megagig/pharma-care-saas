import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye as VisibilityIcon, EyeOff as VisibilityOffIcon, Lock } from 'lucide-react';

// Mock components for now
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
  <div {...props} className={`p-8 ${props.className || ''}`}>
    {children}
  </div>
);

const MockSpinner = ({ ...props }: any) => (
  <div {...props} className={`inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white ${props.className || ''}`}></div>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md bg-red-50 border-l-4 border-red-400 ${props.className || ''}`}>
    {children}
  </div>
);

const MockSeparator = ({ ...props }: any) => (
  <hr {...props} className={`my-4 border-t border-gray-200 ${props.className || ''}`} />
);

const MockCheckbox = ({ checked, onCheckedChange, ...props }: any) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    {...props}
    className={`rounded border-gray-300 ${props.className || ''}`}
  />
);

const MockLabel = ({ children, ...props }: any) => (
  <label {...props} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${props.className || ''}`}>
    {children}
  </label>
);

const MockThemeToggle = ({ size }: any) => (
  <button className={`p-1 rounded-full ${size === 'sm' ? 'text-sm' : ''}`}>
    Theme
  </button>
);

// Mock hook
const useAuth = () => ({
  login: async (credentials: any) => {
    return { success: true, message: 'Login successful' };
  }
});

// Replace imports with mock components
const Button = MockButton;
const Input = MockInput;
const Card = MockCard;
const CardContent = MockCardContent;
const Spinner = MockSpinner;
const Alert = MockAlert;
const Separator = MockSeparator;
const Checkbox = MockCheckbox;
const Label = MockLabel;
const ThemeToggle = MockThemeToggle;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('Attempting login with:', { email: formData.email });
      const response = await login({
        email: formData.email,
        password: formData.password
      });
      console.log('Login response:', response);
      if (response.success) {
        console.log('Login successful, checking authentication...');
        const hasToken = await checkAuthToken();
        console.log('Auth check result:', hasToken);
        if (hasToken) {
          console.log('Authentication confirmed, testing API...');
          await testAPIConnection();
        }
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid email or password';
      if (error instanceof Error) {
        if (
          error.message.includes('429') ||
          error.message.includes('Too Many Requests')
        ) {
          errorMessage =
            'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (
          error.message.includes('Request failed with status code 429')
        ) {
          errorMessage =
            'Rate limit exceeded. Please wait a few minutes and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mock functions for auth check and API connection test
  const checkAuthToken = async (): Promise<boolean> => {
    // In a real app, this would check if the auth token is valid
    return true;
  };

  const testAPIConnection = async (): Promise<void> => {
    // In a real app, this would test the API connection
    console.log('API connection test successful');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>

      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Back to Homepage Link */}
            <div className="mb-6">
              <Button
                variant="ghost"
                asChild
                className="p-0 h-auto font-normal text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Link to="/">
                  ← Back to Homepage
                </Link>
              </Button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">P</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your PharmaCare account
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-0 h-auto"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon className="h-4 w-4" />
                      ) : (
                        <VisibilityIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked: boolean) =>
                      setFormData(prev => ({ ...prev, rememberMe: checked }))
                    }
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Remember me
                  </Label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Spinner size="default" color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign up
                </Link>
              </div>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                By signing in, you agree to our{' '}
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Privacy Policy
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
