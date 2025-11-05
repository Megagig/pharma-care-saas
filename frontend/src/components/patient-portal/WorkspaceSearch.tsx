import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Clock, Users, Star } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useDebounce } from '../../hooks/useDebounce';

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  services: string[];
  rating?: number;
  totalPatients?: number;
  isVerified: boolean;
  logo?: string;
}

interface WorkspaceSearchProps {
  onWorkspaceSelect: (workspace: Workspace) => void;
  className?: string;
}

export const WorkspaceSearch: React.FC<WorkspaceSearchProps> = ({
  onWorkspaceSelect,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    state?: string;
    services?: string[];
    isOpen?: boolean;
  }>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mock data for development - replace with actual API call
  const mockWorkspaces: Workspace[] = [
    {
      _id: '1',
      name: 'HealthCare Plus Pharmacy',
      description: 'Your trusted neighborhood pharmacy with comprehensive healthcare services',
      address: {
        street: '123 Main Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
      },
      contact: {
        phone: '+234-801-234-5678',
        email: 'info@healthcareplus.ng',
      },
      businessHours: {
        monday: { open: '08:00', close: '20:00', isOpen: true },
        tuesday: { open: '08:00', close: '20:00', isOpen: true },
        wednesday: { open: '08:00', close: '20:00', isOpen: true },
        thursday: { open: '08:00', close: '20:00', isOpen: true },
        friday: { open: '08:00', close: '20:00', isOpen: true },
        saturday: { open: '09:00', close: '18:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: true },
      },
      services: ['Prescription Dispensing', 'Health Consultation', 'Medication Therapy Review'],
      rating: 4.8,
      totalPatients: 1250,
      isVerified: true,
      logo: '/api/placeholder/80/80',
    },
    {
      _id: '2',
      name: 'MediCare Central',
      description: 'Modern pharmacy with digital health solutions',
      address: {
        street: '456 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
      },
      contact: {
        phone: '+234-802-345-6789',
        email: 'contact@medicarecentral.ng',
      },
      businessHours: {
        monday: { open: '07:00', close: '21:00', isOpen: true },
        tuesday: { open: '07:00', close: '21:00', isOpen: true },
        wednesday: { open: '07:00', close: '21:00', isOpen: true },
        thursday: { open: '07:00', close: '21:00', isOpen: true },
        friday: { open: '07:00', close: '21:00', isOpen: true },
        saturday: { open: '08:00', close: '19:00', isOpen: true },
        sunday: { open: '09:00', close: '17:00', isOpen: true },
      },
      services: ['24/7 Emergency', 'Lab Tests', 'Vaccination', 'Health Screening'],
      rating: 4.6,
      totalPatients: 890,
      isVerified: true,
    },
  ];

  useEffect(() => {
    const searchWorkspaces = async () => {
      if (!debouncedSearchTerm.trim()) {
        setWorkspaces(mockWorkspaces);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await patientPortalService.searchWorkspaces({
        //   query: debouncedSearchTerm,
        //   filters: selectedFilters,
        // });

        // Mock search filtering
        const filtered = mockWorkspaces.filter(
          (workspace) =>
            workspace.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            workspace.address.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            workspace.address.state.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

        setWorkspaces(filtered);
      } catch (err) {
        setError('Failed to search workspaces. Please try again.');
        console.error('Workspace search error:', err);
      } finally {
        setLoading(false);
      }
    };

    searchWorkspaces();
  }, [debouncedSearchTerm, selectedFilters]);

  const getCurrentStatus = (businessHours: Workspace['businessHours']) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof businessHours;
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = businessHours[currentDay];
    if (!todayHours.isOpen) return { isOpen: false, status: 'Closed Today' };
    
    if (currentTime >= todayHours.open && currentTime <= todayHours.close) {
      return { isOpen: true, status: `Open until ${todayHours.close}` };
    }
    
    return { isOpen: false, status: `Opens at ${todayHours.open}` };
  };

  const formatAddress = (address: Workspace['address']) => {
    return `${address.street}, ${address.city}, ${address.state}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Find Your Pharmacy
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Search for your pharmacy to access your patient portal
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search by pharmacy name, city, or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Searching pharmacies...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <div className="space-y-4">
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No pharmacies found matching your search.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Try searching with different keywords or check the spelling.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {workspaces.length} pharmacy{workspaces.length !== 1 ? 'ies' : ''}
              </p>
              
              {workspaces.map((workspace) => {
                const status = getCurrentStatus(workspace.businessHours);
                
                return (
                  <Card
                    key={workspace._id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800"
                    onClick={() => onWorkspaceSelect(workspace)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {workspace.logo ? (
                          <img
                            src={workspace.logo}
                            alt={`${workspace.name} logo`}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                              {workspace.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {workspace.name}
                              </h3>
                              {workspace.isVerified && (
                                <Badge variant="success" size="sm">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            {workspace.description && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                {workspace.description}
                              </p>
                            )}
                          </div>

                          {/* Rating */}
                          {workspace.rating && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {workspace.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{formatAddress(workspace.address)}</span>
                        </div>

                        {/* Contact */}
                        <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{workspace.contact.phone}</span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-1 mt-1 text-sm">
                          <Clock className="h-4 w-4" />
                          <span className={status.isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {status.status}
                          </span>
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {workspace.services.slice(0, 3).map((service) => (
                            <Badge key={service} variant="secondary" size="sm">
                              {service}
                            </Badge>
                          ))}
                          {workspace.services.length > 3 && (
                            <Badge variant="secondary" size="sm">
                              +{workspace.services.length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        {workspace.totalPatients && (
                          <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{workspace.totalPatients.toLocaleString()} patients</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSearch;