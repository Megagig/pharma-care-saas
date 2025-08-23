import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Award, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                PharmaCare
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About PharmaCare
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering Nigerian pharmacists with modern tools to deliver
            exceptional patient care, streamline operations, and improve health
            outcomes across communities.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To revolutionize pharmaceutical care in Nigeria by providing
                pharmacists with cutting-edge technology that enhances patient
                safety, improves medication management, and supports
                evidence-based clinical decisions.
              </p>
              <p className="text-lg text-gray-600">
                We believe that every patient deserves the highest quality
                pharmaceutical care, and every pharmacist deserves the tools to
                deliver it efficiently and effectively.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">1000+</h3>
                <p className="text-gray-600">Pharmacists Served</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">50K+</h3>
                <p className="text-gray-600">Patients Helped</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Patient Safety First
              </h3>
              <p className="text-gray-600">
                Every feature we build prioritizes patient safety and medication
                accuracy, helping prevent errors and improve outcomes.
              </p>
            </div>
            <div className="text-center">
              <Award className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Excellence in Care
              </h3>
              <p className="text-gray-600">
                We empower pharmacists to deliver the highest standard of
                pharmaceutical care through evidence-based tools and insights.
              </p>
            </div>
            <div className="text-center">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Community Impact
              </h3>
              <p className="text-gray-600">
                We're committed to improving healthcare access and quality
                across Nigerian communities, one pharmacy at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Pharmacy?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of pharmacists already using PharmaCare to deliver
            better patient care.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-xl font-semibold">PharmaCare</span>
              </div>
              <p className="text-gray-400">
                Empowering Nigerian pharmacists with modern pharmaceutical care
                tools.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-white">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PharmaCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
