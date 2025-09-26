
interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
    bio: string;
    location: string;
    organization: string;
    role: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    security: boolean;
    updates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordChangeRequired: boolean;
    loginNotifications: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'organization';
    dataSharing: boolean;
    analytics: boolean;
  };
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [showDataExportDialog, setShowDataExportDialog] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);

  const [settings, setSettings] = React.useState<UserSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: '',
      bio: '',
      location: 'Lagos, Nigeria',
      organization: 'PharmaCare SaaS',
      role: 'pharmacist',
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
      currency: 'NGN',
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      security: true,
      updates: true,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordChangeRequired: false,
      loginNotifications: true,
    },
    privacy: {
      profileVisibility: 'organization',
      dataSharing: false,
      analytics: true,
    },
  });

  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  });

  const settingsTabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'data', label: 'Data & Storage' },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEditMode(false);
      // Show success message
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      // Show error message
      return;
    }
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
      });
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Settings
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account preferences and system configuration
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {settingsTabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === index
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your profile information and personal details.
            </p>
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your experience with theme, language, and regional settings.
            </p>
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Control how and when you receive notifications from the system.
            </p>
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security & Privacy</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your security settings and privacy preferences.
            </p>
          </div>
        )}

        {activeTab === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data & Storage</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View your storage usage and manage your data export options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
