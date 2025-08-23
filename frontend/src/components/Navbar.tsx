import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Settings, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free trial':
        return 'bg-gray-100 text-gray-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro':
      case 'enterprise':
        return <Crown className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                PharmaCare
              </span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {/* Plan Badge */}
              {user.currentPlan && (
                <Link
                  to="/subscriptions"
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getPlanBadgeColor(
                    user.currentPlan.name
                  )}`}
                >
                  {getPlanIcon(user.currentPlan.name)}
                  <span>{user.currentPlan.name}</span>
                </Link>
              )}

              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                </button>

                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.currentPlan && (
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(
                            user.currentPlan.name
                          )}`}
                        >
                          {getPlanIcon(user.currentPlan.name)}
                          <span>{user.currentPlan.name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/subscriptions"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Subscription
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
