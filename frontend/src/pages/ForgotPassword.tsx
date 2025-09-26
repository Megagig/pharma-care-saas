import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';

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
  <div {...props} className={`bg-white rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockLabel = ({ children, ...props }: any) => (
  <label {...props} className={`block text-sm font-medium text-gray-700 ${props.className || ''}`}>
    {children}
  </label>
);

// Replace imports with mock components
const Button = MockButton;
const Input = MockInput;
const Card = MockCard;
const CardContent = MockCardContent;
const Label = MockLabel;

// Mock hook
const useAuth = () => {
  return {
    forgotPassword: async (email: string) => {
      // Mock implementation
      console.log(`Sending password reset email to ${email}`);
      return Promise.resolve();
    }
  };
};

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Check Your Email
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  If an account with that email exists, we've sent you password
                  reset instructions.
                </p>
                <p className="mt-4 text-xs text-gray-500">
                  Didn't receive the email? Check your spam folder or try again in
                  a few minutes.
                </p>
                <div className="mt-6">
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Link to="/login" className="text-white">
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </div>

              <div className="flex items-center justify-center">
                <Link
                  to="/login"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
