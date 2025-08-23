import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(
        'Invalid verification link. Please check your email for the correct link.'
      );
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.message || 'Email verification failed. Please try again.'
        );
      }
    };

    verify();
  }, [searchParams, verifyEmail]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Verifying your email...
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Email Verified!
                </h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Continue to Login
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-6 space-y-3">
                  <Link
                    to="/register"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Register Again
                  </Link>
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
