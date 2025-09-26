import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Select } from '@/components/ui/select';

import { Spinner } from '@/components/ui/spinner';

import { Switch } from '@/components/ui/switch';

import { Separator } from '@/components/ui/separator';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: string;
  capacity?: number;
}
const LocationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Main Pharmacy',
      address: '123 Main Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+234 123 456 7890',
      email: 'main@pharmacare.com',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      manager: 'John Pharmacist',
      capacity: 50,
    },
    {
      id: '2',
      name: 'Branch Pharmacy',
      address: '456 Branch Road',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      phone: '+234 987 654 3210',
      email: 'branch@pharmacare.com',
      isActive: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      manager: 'Jane Pharmacist',
      capacity: 30,
    },
    {
      id: '3',
      name: 'Mobile Unit',
      address: 'Various Locations',
      city: 'Multiple',
      state: 'Multiple',
      country: 'Nigeria',
      phone: '+234 555 555 5555',
      email: 'mobile@pharmacare.com',
      isActive: false,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLocation, setNewLocation] = useState<
    Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
  >({ 
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    phone: '',
    email: '',
    isActive: true}
  });
  const addNotification = useUIStore((state) => state.addNotification);
  const handleSaveLocation = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      const action = editingLocation ? 'updated' : 'created';
      addNotification({ 
        type: 'info'}
        title: `Location ${action}`,
        message: `Location ${newLocation.name} has been ${action}`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (editingLocation) {
        // Update existing location
        setLocations(
          locations.map((loc) =>
            loc.id === editingLocation.id
              ? {
                  ...loc,
                  ...newLocation,
                  updatedAt: new Date().toISOString(),
                }
              : loc
          )
        );
      } else {
        // Add new location
        const location: Location = {
          id: (locations.length + 1).toString(),
          ...newLocation,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLocations([location, ...locations]);
      }
      setShowLocationDialog(false);
      setEditingLocation(null);
      setNewLocation({ 
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        phone: '',
        email: '',
        isActive: true}
      });
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Operation Failed'}
        message: `Failed to save location: ${newLocation.name}`}
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteLocation = async (locationId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      const location = locations.find((loc) => loc.id === locationId);
      addNotification({ 
        type: 'info',
        title: 'Location Deleted'}
        message: `Location ${location?.name} has been deleted`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Remove the location
      setLocations(locations.filter((loc) => loc.id !== locationId));
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete location'}
      });
    } finally {
      setLoading(false);
    }
  };
  const handleToggleLocationStatus = async (locationId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      const location = locations.find((loc) => loc.id === locationId);
      addNotification({ 
        type: 'info',
        title: 'Status Updated'}
        message: `Location ${location?.name} status updated`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Toggle the location status
      setLocations(
        locations.map((loc) =>
          loc.id === locationId
            ? {
                ...loc,
                isActive: !loc.isActive,
                updatedAt: new Date().toISOString(),
              }
            : loc
        )
      );
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update location status'}
      });
    } finally {
      setLoading(false);
    }
  };
  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({ 
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      phone: location.phone,
      email: location.email,
      isActive: location.isActive}
    });
    setShowLocationDialog(true);
  };
  const openCreateDialog = () => {
    setEditingLocation(null);
    setNewLocation({ 
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      phone: '',
      email: '',
      isActive: true}
    });
    setShowLocationDialog(true);
  };
  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && location.isActive) ||
      (filterStatus === 'inactive' && !location.isActive);
    return matchesSearch && matchesStatus;
  });
  return (
    <div>
      <div
        className=""
      >
        <div className="">
          <LocationIcon className="" />
          <div  component="h1">
            Location Management
          </div>
        </div>
        <div>
          <Button
            
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            className=""
          >
            Add Location
          </Button>
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Location Stats */}
      <div container spacing={3} className="">
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="primary.main" gutterBottom>
                {locations.length}
              </div>
              <div  color="textSecondary">
                Total Locations
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="success.main" gutterBottom>
                {locations.filter((l) => l.isActive).length}
              </div>
              <div  color="textSecondary">
                Active
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="warning.main" gutterBottom>
                {locations.filter((l) => !l.isActive).length}
              </div>
              <div  color="textSecondary">
                Inactive
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="info.main" gutterBottom>
                {locations.filter((l) => l.manager).length}
              </div>
              <div  color="textSecondary">
                Managed Locations
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Search and Filter */}
      <Card className="">
        <CardContent>
          <div container spacing={2}>
            <div item xs={12} md={6}>
              <Input
                fullWidth
                placeholder="Search by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
              />
            </div>
            <div item xs={12} md={6}>
              <div fullWidth>
                <Label>Status Filter</Label>
                <Select
                  value={filterStatus}
                  label="Status Filter"
                  onChange={(e) => setFilterStatus(e.target.value as string)}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Location List */}
      <div container spacing={3}>
        <div item xs={12}>
          <Card>
            <CardHeader
              title="Location List"
              subheader="Manage all pharmacy locations"
            />
            <Separator />
            <CardContent>
              {filteredLocations.length === 0 ? (
                <div className="">
                  <div  color="textSecondary">
                    No locations found
                  </div>
                </div>
              ) : (
                <List>
                  {filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className=""
                    >
                      <div className="">
                        <LocationIcon />
                      </div>
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div  className="">}
                              {location.name}
                            </div>
                            <Chip
                              label={location.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={location.isActive ? 'success' : 'default'}
                            />
                            {location.manager && (
                              <Chip
                                label={`Manager: ${location.manager}`}
                                size="small"
                                
                                className=""
                              />
                            )}
                          </div>
                        }
                        secondary={
                          <div>
                            <div
                              
                              color="textSecondary"
                              className=""
                            >}
                              {location.address}, {location.city},{' '}
                              {location.state}, {location.country}
                            </div>
                            <div className="">
                              <div
                                
                                color="textSecondary"
                                className=""
                              >
                                <PhoneIcon
                                  className=""
                                />
                                {location.phone}
                              </div>
                              <div
                                
                                color="textSecondary"
                                className=""
                              >
                                <EmailIcon
                                  className=""
                                />
                                {location.email}
                              </div>
                              <div
                                
                                color="textSecondary"
                              >
                                Updated:{' '}
                                {new Date(
                                  location.updatedAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        }
                      />
                      <div className="">
                        <FormControlLabel
                          control={
                            <Switch}
                              checked={location.isActive}
                              onChange={() =>
                                handleToggleLocationStatus(location.id)}
                              }
                              disabled={loading}
                            />
                          }
                          label={location.isActive ? 'Active' : 'Inactive'}
                          className=""
                        />
                        <IconButton
                          onClick={() => openEditDialog(location)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteLocation(location.id)}
                          disabled={loading}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Location Dialog */}
      <Dialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="">
            <LocationIcon className="" />
            {editingLocation ? 'Edit Location' : 'Add New Location'}
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="">
            <Input
              fullWidth
              label="Location Name"
              value={newLocation.name}
              onChange={(e) =>}
                setNewLocation({ ...newLocation, name: e.target.value })
              }
              margin="normal"
              required
            />
            <Input
              fullWidth
              label="Address"
              value={newLocation.address}
              onChange={(e) =>}
                setNewLocation({ ...newLocation, address: e.target.value })
              }
              margin="normal"
              required
            />
            <div container spacing={2}>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="City"
                  value={newLocation.city}
                  onChange={(e) =>}
                    setNewLocation({ ...newLocation, city: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </div>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="State"
                  value={newLocation.state}
                  onChange={(e) =>}
                    setNewLocation({ ...newLocation, state: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </div>
            </div>
            <Input
              fullWidth
              label="Country"
              value={newLocation.country}
              onChange={(e) =>}
                setNewLocation({ ...newLocation, country: e.target.value })
              }
              margin="normal"
              required
            />
            <div container spacing={2}>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Phone"
                  value={newLocation.phone}
                  onChange={(e) =>}
                    setNewLocation({ ...newLocation, phone: e.target.value })
                  }
                  margin="normal"
                />
              </div>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Email"
                  type="email"
                  value={newLocation.email}
                  onChange={(e) =>}
                    setNewLocation({ ...newLocation, email: e.target.value })
                  }
                  margin="normal"
                />
              </div>
            </div>
            <FormControlLabel
              control={
                <Switch}
                  checked={newLocation.isActive}
                  onChange={(e) =>
                    setNewLocation({ 
                      ...newLocation}
                      isActive: e.target.checked,}
                    })
                  }
                />
              }
              label="Active Location"
              className=""
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationDialog(false)}>Cancel</Button>
          <Button
            
            onClick={handleSaveLocation}
            disabled={
              loading ||
              !newLocation.name ||
              !newLocation.address ||
              !newLocation.city ||
              !newLocation.state}
            }
            startIcon={
              loading ? (}
                <Spinner size={20} />
              ) : editingLocation ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }
          >
            {editingLocation ? 'Update Location' : 'Add Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default LocationManagement;
