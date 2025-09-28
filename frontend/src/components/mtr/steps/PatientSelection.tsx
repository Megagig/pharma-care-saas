import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Alert,
} from '@mui/material';
import { Patient } from '../../../stores/types';

interface PatientSelectionProps {
  onPatientSelect: (patient: Patient) => void;
  onNext?: () => void;
  onBack?: () => void;
  selectedPatient?: Patient | null;
}

const PatientSelection: React.FC<PatientSelectionProps> = ({
  onPatientSelect,
  onNext,
  onBack,
  selectedPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients] = useState<Patient[]>([
    // Mock patients - replace with actual data
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      email: 'john.doe@email.com',
      phone: '555-0123',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1975-05-15',
      email: 'jane.smith@email.com',
      phone: '555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'Somewhere',
        state: 'NY',
        zipCode: '67890',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select Patient for MTR
      </Typography>

      <TextField
        fullWidth
        label="Search patients"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      {selectedPatient && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Selected: {selectedPatient.firstName} {selectedPatient.lastName}
        </Alert>
      )}

      <Card>
        <CardContent>
          <List>
            {filteredPatients.map((patient) => (
              <ListItem key={patient._id} disablePadding>
                <ListItemButton
                  onClick={() => handlePatientSelect(patient)}
                  selected={selectedPatient?._id === patient._id}
                >
                  <ListItemText
                    primary={`${patient.firstName} ${patient.lastName}`}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={patient.email} size="small" />
                        <Chip label={patient.phone} size="small" />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {onBack && (
          <Button onClick={onBack} variant="outlined">
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          variant="contained"
          disabled={!selectedPatient}
          sx={{ ml: 'auto' }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default PatientSelection;