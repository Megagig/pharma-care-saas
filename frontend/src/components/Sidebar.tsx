import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Pill,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronLeft,
  Shield,
  Star,
  Stethoscope,
  Beaker,
  MessageSquare,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react';

// Mock components for now
const MockTooltip = ({ children, ...props }: any) => (
  <div {...props} className={`relative ${props.className || ''}`}>
    {children}
  </div>
);

const MockTooltipContent = ({ children, ...props }: any) => (
  <div {...props} className={`absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg ${props.className || ''}`}>
    {children}
  </div>
);

const MockTooltipProvider = ({ children, ...props }: any) => (
  <div {...props} className={props.className || ''}>
    {children}
  </div>
);

const MockTooltipTrigger = ({ children, ...props }: any) => (
  <div {...props} className={props.className || ''}>
    {children}
  </div>
);

const MockSeparator = ({ ...props }: any) => (
  <div {...props} className={`border-t border-gray-200 dark:border-gray-700 my-2 ${props.className || ''}`}></div>
);

const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`p-2 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

// Replace imports with mock components
const Tooltip = MockTooltip;
const TooltipContent = MockTooltipContent;
const TooltipProvider = MockTooltipProvider;
const TooltipTrigger = MockTooltipTrigger;
const Separator = MockSeparator;
const Button = MockButton;

// Mock hooks
const useRBAC = () => {
  return {
    hasFeature: (feature: string) => true,
    hasRole: (role: string) => true,
    requiresLicense: () => false,
    getLicenseStatus: () => 'approved'
  };
};

const useAuth = () => {
  return {
    user: {
      role: 'user'
    }
  };
};

const useSubscriptionStatus = () => {
  return {
    status: 'active',
    isActive: true,
    tier: 'premium',
    daysRemaining: 30
  };
};

const useSidebarControls = () => {
  return {
    sidebarOpen: true,
    toggleSidebar: () => { },
    setSidebarOpen: () => { }
  };
};

const useTheme = () => {
  return {
    breakpoints: {
      down: (size: string) => () => false
    }
  };
};

const useMediaQuery = (query: any) => {
  return false;
};

const ConditionalRender = ({ children, ...props }: any) => (
  <div>{children}</div>
);

// Icon aliases for consistency
const DashboardIcon = LayoutDashboard;
const PeopleIcon = Users;
const DescriptionIcon = FileText;
const MedicationIcon = Pill;
const CreditCardIcon = CreditCard;
const SettingsIcon = Settings;
const HelpIcon = HelpCircle;
const ChevronLeftIcon = ChevronLeft;
const AdminIcon = Shield;
const LicenseIcon = FileText;
const SubscriptionIcon = Star;
const ReviewsIcon = Star;
const MedicalServicesIcon = Stethoscope;
const ScienceIcon = Beaker;
const ForumIcon = MessageSquare;
const MenuBookIcon = BookOpen;
const PsychologyIcon = Brain;
const AnalyticsIcon = BarChart3;
const SupervisorAccountIcon = Users;

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarControls();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasFeature, hasRole, requiresLicense, getLicenseStatus } = useRBAC();
  const subscriptionStatus = useSubscriptionStatus();

  // Auto-close sidebar on mobile when route changes - using useCallback for stable reference
  const handleMobileClose = React.useCallback(() => {
    if (isMobile) {
      // Mock implementation - no parameters needed
      (setSidebarOpen as any)(false);
    }
  }, [isMobile, setSidebarOpen]);

  React.useEffect(() => {
    handleMobileClose();
  }, [location.pathname, handleMobileClose]);

  const drawerWidth = sidebarOpen ? 280 : 56;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: DashboardIcon,
      show: true, // Always show dashboard
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: PeopleIcon,
      show: hasFeature('patient_management'),
      badge: !subscriptionStatus?.isActive ? 'Premium' : null,
    },
    {
      name: 'Clinical Notes',
      path: '/notes',
      icon: DescriptionIcon,
      show: hasFeature('clinical_notes'),
      badge:
        !subscriptionStatus?.isActive ||
          (requiresLicense() && getLicenseStatus() !== 'approved')
          ? 'License Required'
          : null,
    },
    {
      name: 'Medications',
      path: '/medications',
      icon: MedicationIcon,
      show: hasFeature('medication_management'),
      badge: !subscriptionStatus?.isActive ? 'Premium' : null,
    },
    {
      name: 'Reports & Analytics',
      path: '/reports-analytics',
      icon: AnalyticsIcon,
      show: hasFeature('basic_reports'),
    },
    {
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: CreditCardIcon,
      show: true, // Always show for subscription management
    },
  ];

  const pharmacyModules = [
    {
      name: 'Medication Therapy Review',
      path: '/pharmacy/medication-therapy',
      icon: ReviewsIcon,
      show: true,
    },
    {
      name: 'Clinical Interventions',
      path: '/pharmacy/clinical-interventions/dashboard',
      icon: MedicalServicesIcon,
      show: true,
    },
    {
      name: 'AI Diagnostics & Therapeutics',
      path: '/pharmacy/diagnostics',
      icon: ScienceIcon,
      show: true,
    },
    {
      name: 'Communication Hub',
      path: '/pharmacy/communication',
      icon: ForumIcon,
      show: true,
    },
    {
      name: 'Drug Information Center',
      path: '/pharmacy/drug-information',
      icon: MenuBookIcon,
      show: true,
    },
    {
      name: 'Clinical Decision Support',
      path: '/pharmacy/decision-support',
      icon: PsychologyIcon,
      show: true,
      badge: null, // Ensure no badge blocking
    },
  ];

  const adminItems = [
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: AdminIcon,
      show: hasRole('super_admin'),
    },
    {
      name: 'Feature Flags',
      path: '/feature-flags',
      icon: SettingsIcon,
      show: hasRole('super_admin') && hasFeature('feature_flag_management'),
    },
  ];

  const settingsItems = [
    {
      name: 'Saas Settings',
      path: '/saas-settings',
      icon: SettingsIcon,
      show: true,
    },
    {
      name: 'License Verification',
      path: '/license',
      icon: LicenseIcon,
      show: requiresLicense(),
      badge:
        getLicenseStatus() === 'pending'
          ? 'Pending'
          : getLicenseStatus() === 'rejected'
            ? 'Rejected'
            : null,
    },
    {
      name: 'Subscription Management',
      path: '/subscription-management',
      icon: SubscriptionIcon,
      show: true,
    },
    {
      name: 'User Management',
      path: '/user-management',
      icon: SupervisorAccountIcon,
      show: true,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      show: true,
    },
    {
      name: 'Help',
      path: '/help',
      icon: HelpIcon,
      show: true,
    },
  ];

  const renderNavItems = (items: typeof navItems) => (
    <div className="space-y-1">
      {items
        .filter((item) => item.show)
        .map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;

          const listItemButton = (
            <Link
              to={item.path}
              className={`flex items-center p-2 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <div className="flex items-center justify-center w-6 h-6 mr-3">
                <IconComponent size={20} />
              </div>
              {sidebarOpen && (
                <div className="flex items-center w-full">
                  <span className={`text-sm transition-all duration-200 ${isActive ? 'font-semibold' : 'font-normal'
                    }`}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );

          return (
            <div key={item.name} className="w-full">
              {!sidebarOpen ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {listItemButton}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                listItemButton
              )}
            </div>
          );
        })}
    </div>
  );

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-14'
        } ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header with Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <MedicationIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                PharmaCare
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={toggleSidebar}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <ChevronLeftIcon
                    size={sidebarOpen ? 20 : 18}
                    className={`transition-transform duration-200 ${sidebarOpen ? 'rotate-0' : 'rotate-180'
                      }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3">
          {sidebarOpen && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                MAIN MENU
              </div>
            </div>
          )}

          {renderNavItems(navItems)}
        </div>

        <Separator />

        {/* Pharmacy Tools Section */}
        <div className="px-3">
          {sidebarOpen && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                PHARMACY TOOLS
              </div>
            </div>
          )}
          {renderNavItems(pharmacyModules)}
        </div>

        <Separator />

        {/* Admin Section */}
        <ConditionalRender requiredRole="super_admin">
          <div className="px-3">
            {sidebarOpen && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ADMINISTRATION
                </div>
              </div>
            )}
            {renderNavItems(adminItems)}
          </div>
          <Separator />
        </ConditionalRender>

        {/* Settings & Help */}
        <div className="px-3">
          {sidebarOpen && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ACCOUNT
              </div>
            </div>
          )}
          {renderNavItems(settingsItems)}
        </div>

        {/* Bottom Spacer */}
        <div className="flex-1" />

        {/* Version Info and Subscription Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Subscription Status */}
            <div className="space-y-1">
              <div className={`text-sm font-bold ${subscriptionStatus?.isActive ? 'text-green-600' : 'text-orange-600'
                }`}>
                {subscriptionStatus?.tier?.toUpperCase() || 'FREE'} PLAN
              </div>
              {!subscriptionStatus?.isActive && (
                <div className="text-xs text-orange-600">
                  Subscription Expired
                </div>
              )}
              {subscriptionStatus?.isActive &&
                subscriptionStatus?.daysRemaining &&
                subscriptionStatus.daysRemaining <= 7 && (
                  <div className="text-xs text-orange-600">
                    {subscriptionStatus?.daysRemaining} days left
                  </div>
                )}
            </div>

            {/* Version Info */}
            <div>
              <div className="text-xs text-blue-600 font-medium">
                PharmaCare v2.1.0
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
