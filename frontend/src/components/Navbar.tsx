import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, Power } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import ThemeToggle from './common/ThemeToggle';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.className || ''}`}>
    {children}
  </span>
);

const MockDropdownMenu = ({ children, ...props }: any) => (
  <div {...props} className="relative inline-block text-left">
    {children}
  </div>
);

const MockDropdownMenuTrigger = ({ children, ...props }: any) => (
  <div {...props} className="cursor-pointer">
    {children}
  </div>
);

const MockDropdownMenuContent = ({ children, ...props }: any) => (
  <div {...props} className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
    <div className="py-1">
      {children}
    </div>
  </div>
);

const MockDropdownMenuItem = ({ children, onClick, ...props }: any) => (
  <div
    {...props}
    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
    onClick={onClick}
  >
    {children}
  </div>
);

const MockCommunicationNotificationBadge = () => (
  <div className="relative">
    <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      <span className="sr-only">View notifications</span>
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>
    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
  </div>
);

// Replace imports with mock components
const Button = MockButton;
const Badge = MockBadge;
const DropdownMenu = MockDropdownMenu;
const DropdownMenuTrigger = MockDropdownMenuTrigger;
const DropdownMenuContent = MockDropdownMenuContent;
const DropdownMenuItem = MockDropdownMenuItem;
const CommunicationNotificationBadge = MockCommunicationNotificationBadge;

/**
 * Main navigation bar component displayed at the top of the application
 * when users are logged in.
 */
const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { tier } = useSubscriptionStatus();
  const navigate = useNavigate();

  const handleMenuClose = () => {
    // Menu close is now handled by shadcn/ui DropdownMenu
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const getSubscriptionChipColor = () => {
    switch (tier) {
      case 'enterprise':
        return 'error';
      case 'pro':
        return 'secondary';
      case 'basic':
        return 'primary';
      case 'free_trial':
      default:
        return 'default';
    }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="hidden sm:block text-lg font-semibold flex-1">
          PharmaCare
        </h1>

        <div className="flex items-center gap-2">
          {tier && (
            <Badge className="text-xs">
              {tier.replace('_', ' ').toUpperCase()}
            </Badge>
          )}

          {/* Theme Toggle */}
          <div className="mr-1">
            <ThemeToggle size="sm" />
          </div>

          {/* Communication Hub Notification Badge */}
          <CommunicationNotificationBadge />

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="relative">
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
                <Bell size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={handleMenuClose}>
                <span className="text-sm">New patient registered</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMenuClose}>
                <span className="text-sm">Prescription renewal needed</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMenuClose}>
                <span className="text-sm">Subscription expires soon</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="justify-center text-primary"
              >
                <span className="text-sm">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" onClick={handleMenuClose}>
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/subscription-management" onClick={handleMenuClose}>
                  Subscription
                </Link>
              </DropdownMenuItem>
              {user.role === 'super_admin' && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" onClick={handleMenuClose}>
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/settings" onClick={handleMenuClose}>
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <Power size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
