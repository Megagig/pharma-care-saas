import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">PharmaCare</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Empowering pharmacists with comprehensive patient care management tools 
              to improve medication therapy outcomes and enhance pharmaceutical care.
            </p>
            <div className="flex items-center text-sm text-gray-500">
              Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> for pharmacists
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
              <li><Link to="/integrations" className="text-gray-600 hover:text-gray-900">Integrations</Link></li>
              <li><Link to="/security" className="text-gray-600 hover:text-gray-900">Security</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</Link></li>
              <li><Link to="/status" className="text-gray-600 hover:text-gray-900">System Status</Link></li>
              <li><Link to="/training" className="text-gray-600 hover:text-gray-900">Training</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</Link>
              <Link to="/hipaa" className="text-sm text-gray-600 hover:text-gray-900">HIPAA Compliance</Link>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 PharmaCare SaaS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;