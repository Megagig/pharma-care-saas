import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, differenceInDays } from 'date-fns';
import { useRequestTimeOff } from '../../hooks/usePharmacistSchedule';
import { useNotification } from '../../hooks/useNotification';
import { TimeOffRequest } from '../../services/pharmacistScheduleService';

interface TimeOffRequestFormProps {
  open: boolean;
  onClose: () => void;
  pharmacistId: string;
  onSuccess?: () => void;
}

const TimeOffRequestForm: React.FC<TimeOffRequestFormProps> = ({
  open,
  onClose,
  pharmacistId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<TimeOffRequest & { startDateObj: Date; endDateObj: Date }>({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startDateObj: new Date(),
    endDateObj: addDays(new Date(), 1),
    reason: '',
    type: 'vacation',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showNotification } = useNotification();
  const requestTimeOffMutation = useRequestTimeOff();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    if (formData.endDateObj <= formData.startDateObj) {
      newErrors.endDate = 'End date must be after start date';
    }

    const daysDifference = differenceInDays(formData.endDateObj, formData.startDateObj);
    if (daysDifference > 30) {
      newErrors.endDate = 'Time-off period cannot exceed 30 days';
    }

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.startDateObj < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await requestTimeOffMutation.mutateAsync({
        pharmacistId,
        timeOffData: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason.trim(),
          type: formData.type,
        },
      });

      const affectedCount = response.data?.affectedAppointments?.length || 0;
      let message = 'Time-off request submitted successfully';
      
      if (affectedCount > 0) {
        message += `. ${affectedCount} appointment(s) may need rescheduling.`;
      }

      showNotification(message, 'success');
      handleClose();
      onSuccess?.();
    } catch (error) {
      showNotification('Failed to submit time-off request', 'error');
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      startDateObj: new Date(),
      endDateObj: addDays(new Date(), 1),
      reason: '',
      type: 'vacation',
    });
    setErrors({});
    onClose();
  };

  // Handle date changes
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDateObj = date >= formData.endDateObj ? addDays(date, 1) : formData.endDateObj;
      const endDate = format(endDateObj, 'yyyy-MM-dd');
      
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate,
        startDateObj: date,
        endDateObj,
      }));
      
      // Clear date-related errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const endDate = format(date, 'yyyy-MM-dd');
      
      setFormData(prev => ({
        ...prev,
        endDate,
        endDateObj: date,
      }));
      
      // Clear date-related errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  // Calculate duration
  const duration = differenceInDays(formData.endDateObj, formData.startDateObj) + 1;

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'primary';
      case 'sick_leave':
        return 'error';
      case 'personal':
        return 'secondary';
      case 'training':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { minHeight: 500 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Request Time Off</Typography>
            <Chip
              label={`${duration} day${duration !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Date Selection */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDateObj}
                onChange={handleStartDateChange}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.endDateObj}
                onChange={handleEndDateChange}
                minDate={formData.startDateObj}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate,
                  },
                }}
              />
            </Grid>

            {/* Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="vacation">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="Vacation" color="primary" size="small" />
                      <Typography>Vacation</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="sick_leave">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="Sick Leave" color="error" size="small" />
                      <Typography>Sick Leave</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="personal">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="Personal" color="secondary" size="small" />
                      <Typography>Personal</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="training">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="Training" color="info" size="small" />
                      <Typography>Training</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="other">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="Other" color="default" size="small" />
                      <Typography>Other</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={4}
                value={formData.reason}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, reason: e.target.value }));
                  if (errors.reason) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.reason;
                      return newErrors;
                    });
                  }
                }}
                error={!!errors.reason}
                helperText={errors.reason || 'Please provide a detailed reason for your time-off request'}
                placeholder="Please provide a detailed reason for your time-off request..."
              />
            </Grid>

            {/* Duration Summary */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Summary:</strong> {formData.type.replace('_', ' ')} from{' '}
                  {format(formData.startDateObj, 'MMM dd, yyyy')} to{' '}
                  {format(formData.endDateObj, 'MMM dd, yyyy')} ({duration} day{duration !== 1 ? 's' : ''})
                </Typography>
              </Alert>
            </Grid>

            {/* Warning for long periods */}
            {duration > 7 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    This is a long time-off period ({duration} days). Please ensure adequate coverage is arranged.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={requestTimeOffMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={requestTimeOffMutation.isPending || !formData.reason.trim()}
            startIcon={requestTimeOffMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {requestTimeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TimeOffRequestForm;