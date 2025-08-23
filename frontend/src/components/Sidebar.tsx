import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Pill, 
  CreditCard, 
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Clinical Notes', path: '/notes', icon: FileText },
    { name: 'Medications', path: '/medications', icon: Pill },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 pt-6 pb-4 overflow-y-auto">
          <nav className="mt-5 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`${
                        isActive
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-150`}
                    >
                      <Icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5 transition-colors duration-150`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="p-3 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Need Help?</p>
            <p className="text-xs text-gray-600 mb-2">Contact our support team</p>
            <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;