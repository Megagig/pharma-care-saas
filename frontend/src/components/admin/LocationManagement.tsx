import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';

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
      email: 'main@PharmaPilot.com',
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
      email: 'branch@PharmaPilot.com',
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
      email: 'mobile@PharmaPilot.com',
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
    isActive: true,
  });

  const addNotification = useUIStore((state) => state.addNotification);

  const handleSaveLocation = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      const action = editingLocation ? 'updated' : 'created';

      addNotification({
        type: 'info',
        title: `Location ${action}`,
        message: `Location ${newLocation.name} has been ${action}`,
      });

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
        isActive: true,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: `Failed to save location: ${newLocation.name}`,
      });
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
        title: 'Location Deleted',
        message: `Location ${location?.name} has been deleted`,
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remove the location
      setLocations(locations.filter((loc) => loc.id !== locationId));
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete location',
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
        title: 'Status Updated',
        message: `Location ${location?.name} status updated`,
      });

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
        message: 'Failed to update location status',
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
      isActive: location.isActive,
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
      isActive: true,
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Location Management
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{ mr: 1 }}
          >
            Add Location
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Location Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {locations.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Locations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {locations.filter((l) => l.isActive).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {locations.filter((l) => !l.isActive).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Inactive
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {locations.filter((l) => l.manager).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Managed Locations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status Filter"
                  onChange={(e) => setFilterStatus(e.target.value as string)}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Location List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Location List"
              subheader="Manage all pharmacy locations"
            />
            <Divider />
            <CardContent>
              {filteredLocations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No locations found
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredLocations.map((location) => (
                    <ListItem
                      key={location.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box sx={{ mr: 2, mt: 0.5 }}>
                        <LocationIcon />
                      </Box>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ mr: 1 }}>
                              {location.name}
                            </Typography>
                            <Chip
                              label={location.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={location.isActive ? 'success' : 'default'}
                            />
                            {location.manager && (
                              <Chip
                                label={`Manager: ${location.manager}`}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {location.address}, {location.city},{' '}
                              {location.state}, {location.country}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  mr: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <PhoneIcon
                                  sx={{ fontSize: '0.8rem', mr: 0.5 }}
                                />
                                {location.phone}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  mr: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <EmailIcon
                                  sx={{ fontSize: '0.8rem', mr: 0.5 }}
                                />
                                {location.email}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                Updated:{' '}
                                {new Date(
                                  location.updatedAt
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={location.isActive}
                              onChange={() =>
                                handleToggleLocationStatus(location.id)
                              }
                              disabled={loading}
                            />
                          }
                          label={location.isActive ? 'Active' : 'Inactive'}
                          sx={{ mr: 1 }}
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
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Location Dialog */}
      <Dialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationIcon sx={{ mr: 1 }} />
            {editingLocation ? 'Edit Location' : 'Add New Location'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Location Name"
              value={newLocation.name}
              onChange={(e) =>
                setNewLocation({ ...newLocation, name: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Address"
              value={newLocation.address}
              onChange={(e) =>
                setNewLocation({ ...newLocation, address: e.target.value })
              }
              margin="normal"
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={newLocation.city}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, city: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={newLocation.state}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, state: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Country"
              value={newLocation.country}
              onChange={(e) =>
                setNewLocation({ ...newLocation, country: e.target.value })
              }
              margin="normal"
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newLocation.phone}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, phone: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newLocation.email}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, email: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={newLocation.isActive}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active Location"
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveLocation}
            disabled={
              loading ||
              !newLocation.name ||
              !newLocation.address ||
              !newLocation.city ||
              !newLocation.state
            }
            startIcon={
              loading ? (
                <CircularProgress size={20} />
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
    </Box>
  );
};

export default LocationManagement;
