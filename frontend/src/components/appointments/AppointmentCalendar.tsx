import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Refresh,
  ViewWeek,
  ViewDay,
  ViewModule,
  Event,
  Schedule,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

// Hooks and services
import { useAppointmentCalendar } from '../../hooks/useAppointments';
import { useAppointmentStore, useAppointmentCalendar as useCalendarStore } from '../../stores/appointmentStore';
import { useRescheduleAppointment } from '../../hooks/useAppointments';
import { Appointment, AppointmentType, AppointmentStatus, CalendarView } from '../../stores/appointmentTypes';

// Components (to be created in subsequent tasks)
import CreateAppointmentDialog from './CreateAppointmentDialog';
import AppointmentDetailsPanel from './AppointmentDetailsPanel';

interface AppointmentCalendarProps {
  /** Optional pharmacist filter */
  pharmacistId?: string;
  /** Optional location filter */
  locationId?: string;
  /** Height of the calendar */
  height?: number | string;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;
  /** Callback when appointment is selected */
  onAppointmentSelect?: (appointment: Appointment | null) => void;
  /** Callback when slot is clicked for new appointment */
  onSlotClick?: (date: Date, time?: string) => void;
}

// Color mapping for appointment types
const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  mtm_session: '#1976d2', // Blue
  chronic_disease_review: '#d32f2f', // Red
  new_medication_consultation: '#388e3c', // Green
  vaccination: '#f57c00', // Orange
  health_check: '#7b1fa2', // Purple
  smoking_cessation: '#5d4037', // Brown
  general_followup: '#616161', // Grey
};

// Status-based styling
const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, { opacity: number; borderStyle: string }> = {
  scheduled: { opacity: 1, borderStyle: 'solid' },
  confirmed: { opacity: 1, borderStyle: 'solid' },
  in_progress: { opacity: 1, borderStyle: 'double' },
  completed: { opacity: 0.7, borderStyle: 'solid' },
  cancelled: { opacity: 0.4, borderStyle: 'dashed' },
  no_show: { opacity: 0.4, borderStyle: 'dotted' },
  rescheduled: { opacity: 0.6, borderStyle: 'dashed' },
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  pharmacistId,
  locationId,
  height = 'calc(100vh - 200px)',
  showToolbar = true,
  enableDragDrop = true,
  onAppointmentSelect,
  onSlotClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const calendarRef = useRef<FullCalendar>(null);

  // Store state
  const {
    selectedDate,
    selectedView,
    setSelectedDate,
    setSelectedView,
    navigateDate,
    goToToday,
    getAppointmentsByDateRange,
  } = useCalendarStore();

  const { selectedAppointment, selectAppointment } = useAppointmentStore();

  // Local state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API hooks
  const {
    data: calendarData,
    isLoading,
    error,
    refetch,
  } = useAppointmentCalendar({
    view: selectedView,
    date: format(selectedDate, 'yyyy-MM-dd'),
    pharmacistId,
    locationId,
  });

  const rescheduleAppointment = useRescheduleAppointment();

  // Get appointments from store
  const appointments = useMemo(() => {
    if (!calendarData?.data?.appointments) return [];
    return calendarData.data.appointments;
  }, [calendarData]);

  // Convert appointments to FullCalendar events
  const calendarEvents: EventInput[] = useMemo(() => {
    return appointments.map((appointment) => {
      const appointmentDate = new Date(appointment.scheduledDate);
      const [hours, minutes] = appointment.scheduledTime.split(':').map(Number);
      const startTime = new Date(appointmentDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + appointment.duration);

      const typeColor = APPOINTMENT_TYPE_COLORS[appointment.type];
      const statusStyle = APPOINTMENT_STATUS_STYLES[appointment.status];

      return {
        id: appointment._id,
        title: appointment.title || `${appointment.type.replace('_', ' ')} - ${appointment.patientId}`,
        start: startTime,
        end: endTime,
        backgroundColor: typeColor,
        borderColor: typeColor,
        textColor: '#ffffff',
        extendedProps: {
          appointment,
          type: appointment.type,
          status: appointment.status,
          patientId: appointment.patientId,
          assignedTo: appointment.assignedTo,
        },
        classNames: [`appointment-${appointment.status}`],
        display: 'block',
        // Apply status-based styling
        ...statusStyle,
      };
    });
  }, [appointments]);

  // Handle view change
  const handleViewChange = useCallback((view: CalendarView) => {
    setSelectedView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(
        view === 'day' ? 'timeGridDay' : 
        view === 'week' ? 'timeGridWeek' : 
        'dayGridMonth'
      );
    }
  }, [setSelectedView]);

  // Handle date navigation
  const handleDateNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      goToToday();
      if (calendarRef.current) {
        calendarRef.current.getApi().today();
      }
    } else {
      navigateDate(direction);
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        if (direction === 'next') {
          api.next();
        } else {
          api.prev();
        }
      }
    }
  }, [navigateDate, goToToday]);

  // Handle event click (appointment selection)
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const appointment = clickInfo.event.extendedProps.appointment as Appointment;
    selectAppointment(appointment);
    setDetailsPanelOpen(true);
    onAppointmentSelect?.(appointment);
  }, [selectAppointment, onAppointmentSelect]);

  // Handle date/slot selection
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const selectedDate = selectInfo.start;
    const time = format(selectedDate, 'HH:mm');
    
    setSelectedSlot({ date: selectedDate, time });
    setCreateDialogOpen(true);
    onSlotClick?.(selectedDate, time);
    
    // Clear the selection
    selectInfo.view.calendar.unselect();
  }, [onSlotClick]);

  // Handle drag and drop rescheduling
  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    if (!enableDragDrop) return;

    const appointment = dropInfo.event.extendedProps.appointment as Appointment;
    const newDate = dropInfo.event.start;
    
    if (!newDate) return;

    try {
      await rescheduleAppointment.mutateAsync({
        appointmentId: appointment._id,
        rescheduleData: {
          newDate: format(newDate, 'yyyy-MM-dd'),
          newTime: format(newDate, 'HH:mm'),
          reason: 'Rescheduled via drag and drop',
          notifyPatient: true,
        },
      });
    } catch (error) {
      // Revert the event position
      dropInfo.revert();
      console.error('Failed to reschedule appointment:', error);
    }
  }, [enableDragDrop, rescheduleAppointment]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Handle calendar date change (when user navigates)
  const handleDatesSet = useCallback((dateInfo: any) => {
    setSelectedDate(dateInfo.start);
  }, [setSelectedDate]);

  // Mobile-specific configurations
  const mobileConfig = useMemo(() => {
    if (!isMobile) return {};
    
    return {
      height: 'auto',
      aspectRatio: 1.2,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      views: {
        timeGridWeek: {
          dayHeaderFormat: { weekday: 'short' },
        },
        timeGridDay: {
          dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
        },
      },
    };
  }, [isMobile]);

  // Calendar configuration
  const calendarConfig = useMemo(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: selectedView === 'day' ? 'timeGridDay' : 
                selectedView === 'week' ? 'timeGridWeek' : 
                'dayGridMonth',
    initialDate: selectedDate,
    headerToolbar: showToolbar ? {
      left: isMobile ? 'prev,next' : 'prev,next today',
      center: 'title',
      right: isMobile ? 'dayGridMonth,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay',
    } : false,
    height,
    events: calendarEvents,
    selectable: true,
    selectMirror: true,
    editable: enableDragDrop,
    droppable: enableDragDrop,
    eventClick: handleEventClick,
    select: handleDateSelect,
    eventDrop: handleEventDrop,
    datesSet: handleDatesSet,
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    allDaySlot: false,
    nowIndicator: true,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
      startTime: '08:00',
      endTime: '17:00',
    },
    weekends: true,
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    eventDisplay: 'block',
    displayEventTime: true,
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    ...mobileConfig,
  }), [
    selectedView,
    selectedDate,
    showToolbar,
    height,
    calendarEvents,
    enableDragDrop,
    handleEventClick,
    handleDateSelect,
    handleEventDrop,
    handleDatesSet,
    isMobile,
    mobileConfig,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading calendar...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            Failed to load calendar: {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Custom Toolbar */}
      {showToolbar && !isMobile && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {/* Navigation Controls */}
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => handleDateNavigation('prev')} size="small">
                  <ChevronLeft />
                </IconButton>
                <IconButton onClick={() => handleDateNavigation('next')} size="small">
                  <ChevronRight />
                </IconButton>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Today />}
                  onClick={() => handleDateNavigation('today')}
                  sx={{ ml: 1 }}
                >
                  Today
                </Button>
                <Typography variant="h6" sx={{ ml: 2 }}>
                  {format(selectedDate, 'MMMM yyyy')}
                </Typography>
              </Box>

              {/* View Controls */}
              <Box display="flex" alignItems="center" gap={1}>
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    variant={selectedView === 'month' ? 'contained' : 'outlined'}
                    startIcon={<ViewModule />}
                    onClick={() => handleViewChange('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={selectedView === 'week' ? 'contained' : 'outlined'}
                    startIcon={<ViewWeek />}
                    onClick={() => handleViewChange('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={selectedView === 'day' ? 'contained' : 'outlined'}
                    startIcon={<ViewDay />}
                    onClick={() => handleViewChange('day')}
                  >
                    Day
                  </Button>
                </ButtonGroup>

                <Tooltip title="Refresh calendar">
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    size="small"
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardContent sx={{ p: 1 }}>
          <FullCalendar
            ref={calendarRef}
            {...calendarConfig}
          />
        </CardContent>
      </Card>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add appointment"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => {
            setSelectedSlot({ date: new Date() });
            setCreateDialogOpen(true);
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Create Appointment Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Event />
            Schedule New Appointment
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Placeholder for CreateAppointmentDialog component */}
          <Typography variant="body2" color="text.secondary">
            CreateAppointmentDialog component will be implemented in the next task.
            {selectedSlot && (
              <>
                <br />
                Selected date: {format(selectedSlot.date, 'PPP')}
                {selectedSlot.time && <><br />Selected time: {selectedSlot.time}</>}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled>Create Appointment</Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Details Panel */}
      <Dialog
        open={detailsPanelOpen}
        onClose={() => setDetailsPanelOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Schedule />
            Appointment Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Placeholder for AppointmentDetailsPanel component */}
          <Typography variant="body2" color="text.secondary">
            AppointmentDetailsPanel component will be implemented in a subsequent task.
            {selectedAppointment && (
              <>
                <br />
                Appointment: {selectedAppointment.title}
                <br />
                Date: {format(new Date(selectedAppointment.scheduledDate), 'PPP')}
                <br />
                Time: {selectedAppointment.scheduledTime}
                <br />
                Status: {selectedAppointment.status}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsPanelOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Custom Styles */}
      <style jsx global>{`
        .fc-event {
          border-radius: 4px !important;
          font-size: 12px !important;
          padding: 2px 4px !important;
        }
        
        .fc-event-title {
          font-weight: 500 !important;
        }
        
        .appointment-completed {
          opacity: 0.7 !important;
        }
        
        .appointment-cancelled {
          opacity: 0.4 !important;
          text-decoration: line-through !important;
        }
        
        .appointment-no_show {
          opacity: 0.4 !important;
          border-style: dotted !important;
        }
        
        .appointment-in_progress {
          border-width: 3px !important;
          box-shadow: 0 0 8px rgba(25, 118, 210, 0.3) !important;
        }
        
        .fc-timegrid-slot {
          height: 40px !important;
        }
        
        .fc-timegrid-slot-minor {
          border-top-style: dotted !important;
        }
        
        .fc-now-indicator {
          border-color: #f44336 !important;
        }
        
        .fc-now-indicator-arrow {
          border-top-color: #f44336 !important;
          border-bottom-color: #f44336 !important;
        }
        
        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .fc-toolbar-chunk {
            display: flex !important;
            justify-content: center !important;
          }
          
          .fc-event {
            font-size: 10px !important;
            padding: 1px 2px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default AppointmentCalendar;