import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Alert, Switch, Separator } from '@/components/ui/button';

interface ReportSchedulerProps {
  open: boolean;
  onClose: () => void;
  reportType: string;
  filters: Record<string, any>;
  initialSchedule?: ReportSchedule;
}
const steps = [
  'Basic Settings',
  'Schedule Configuration',
  'Recipients & Delivery',
];
const frequencyOptions: {
  value: ScheduleFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: 'daily',
    label: 'Daily',
    description: 'Every day at specified time',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Every week on selected days',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Every month on specified date',
  },
  { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
  { value: 'yearly', label: 'Yearly', description: 'Once per year' },
  { value: 'custom', label: 'Custom', description: 'Custom interval' },
];
const daysOfWeek = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];
export const ReportScheduler: React.FC<ReportSchedulerProps> = ({ 
  open,
  onClose,
  reportType,
  filters,
  initialSchedule
}) => {
  const { addSchedule, updateSchedule } = useExportsStore();
  const [activeStep, setActiveStep] = useState(0);
  const [scheduleName, setScheduleName] = useState(initialSchedule?.name || '');
  const [scheduleDescription, setScheduleDescription] = useState(
    initialSchedule?.description || ''
  );
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    initialSchedule?.schedule.frequency || 'weekly'
  );
  const [selectedTime, setSelectedTime] = useState<Date>(
    initialSchedule?.schedule.time
      ? new Date(`2000-01-01T${initialSchedule.schedule.time}`)
      : new Date()
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialSchedule?.schedule.daysOfWeek || [1]
  ); // Default to Monday
  const [dayOfMonth, setDayOfMonth] = useState(
    initialSchedule?.schedule.dayOfMonth || 1
  );
  const [customInterval, setCustomInterval] = useState(
    initialSchedule?.schedule.interval || 1
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialSchedule?.schedule.endDate || null
  );
  const [maxRuns, setMaxRuns] = useState<number | null>(
    initialSchedule?.schedule.maxRuns || null
  );
  const [timezone, setTimezone] = useState(
    initialSchedule?.schedule.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    initialSchedule?.exportConfig.format || 'pdf'
  );
  const [recipients, setRecipients] = useState<ScheduleRecipient[]>(
    initialSchedule?.recipients || []
  );
  const [isActive, setIsActive] = useState(initialSchedule?.isActive ?? true);
  const [errors, setErrors] = useState<string[]>([]);
  // Email suggestions (in real app, this would come from API)
  const emailSuggestions = [
    'admin@pharmacy.com',
    'reports@pharmacy.com',
    'manager@pharmacy.com',
  ];
  const validateSchedule = (): string[] => {
    const validationErrors: string[] = [];
    if (!scheduleName.trim()) {
      validationErrors.push('Schedule name is required');
    }
    if (frequency === 'weekly' && selectedDays.length === 0) {
      validationErrors.push(
        'At least one day must be selected for weekly schedule'
      );
    }
    if (frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) {
      validationErrors.push('Day of month must be between 1 and 31');
    }
    if (frequency === 'custom' && customInterval < 1) {
      validationErrors.push('Custom interval must be at least 1');
    }
    if (recipients.length === 0) {
      validationErrors.push('At least one recipient is required');
    }
    recipients.forEach((recipient, index) => {
      if (!recipient.address.trim()) {
        validationErrors.push(`Recipient ${index + 1} address is required`);
      }
      if (recipient.type === 'email' && !isValidEmail(recipient.address)) {
        validationErrors.push(
          `Recipient ${index + 1} has invalid email format`
        );
      }
    });
    return validationErrors;
  };
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  useEffect(() => {
    setErrors(validateSchedule());
  }, [
    scheduleName,
    frequency,
    selectedDays,
    dayOfMonth,
    customInterval,
    recipients,
  ]);
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };
  const handleAddRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      {
        type: 'email',
        address: '',
        name: '',
        options: {
          subject: `${reportType
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())} Report`,
          body: 'Please find the attached report.',
        },
      },
    ]);
  };
  const handleRemoveRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };
  const handleRecipientChange = (
    index: number,
    field: keyof ScheduleRecipient,
    value: any
  ) => {
    setRecipients((prev) =>
      prev.map((recipient, i) =>
        i === index ? { ...recipient, [field]: value } : recipient
      )
    );
  };
  const handleRecipientOptionChange = (
    index: number,
    option: string,
    value: any
  ) => {
    setRecipients((prev) =>
      prev.map((recipient, i) =>
        i === index
          ? {
              ...recipient,
              options: { ...recipient.options, [option]: value },
            }
          : recipient
      )
    );
  };
  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };
  const calculateNextRun = (): Date => {
    const now = new Date();
    const time = selectedTime;
    const nextRun = new Date();
    nextRun.setHours(time.getHours(), time.getMinutes(), 0, 0);
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const currentDay = now.getDay();
        const nextDay =
          selectedDays.find((day) => day > currentDay) || selectedDays[0];
        const daysUntilNext =
          nextDay > currentDay
            ? nextDay - currentDay
            : 7 - currentDay + nextDay;
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
        if (nextDay === currentDay && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      case 'quarterly':
        const currentMonth = now.getMonth();
        const nextQuarter = Math.ceil((currentMonth + 1) / 3) * 3;
        nextRun.setMonth(nextQuarter, dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextQuarter + 3, dayOfMonth);
        }
        break;
      case 'yearly':
        nextRun.setMonth(0, dayOfMonth); // January
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
      case 'custom':
        nextRun.setDate(nextRun.getDate() + customInterval);
        break;
    }
    return nextRun;
  };
  const handleSave = () => {
    const validationErrors = validateSchedule();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    const exportConfig: ExportConfig = {
      format: exportFormat,
      options: getDefaultExportOptions(exportFormat),
      metadata: {
        title: `${reportType} Report`,
        author: 'System', // TODO: Get from auth context
        organization: 'Pharmacy Care Platform',
        generatedAt: new Date(),
        reportType,
        filters,
        dataRange: {
          startDate: filters.dateRange?.startDate || new Date(),
          endDate: filters.dateRange?.endDate || new Date(),
        },
        version: '1.0',
      },
    };
    const schedule: ReportSchedule = {
      id:
        initialSchedule?.id ||
        `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: scheduleName,
      description: scheduleDescription,
      reportType,
      filters,
      exportConfig,
      schedule: {
        frequency,
        interval: frequency === 'custom' ? customInterval : undefined,
        daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
        dayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(frequency)
          ? dayOfMonth
          : undefined,
        time: `${selectedTime
          .getHours()
          .toString()
          .padStart(2, '0')}:${selectedTime
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        timezone,
        endDate,
        maxRuns,
      },
      recipients,
      isActive,
      nextRun: calculateNextRun(),
      lastRun: initialSchedule?.lastRun,
      runCount: initialSchedule?.runCount || 0,
      successCount: initialSchedule?.successCount || 0,
      failureCount: initialSchedule?.failureCount || 0,
      createdBy: 'current-user', // TODO: Get from auth context
      workspaceId: 'current-workspace', // TODO: Get from context
      createdAt: initialSchedule?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    if (initialSchedule) {
      updateSchedule(initialSchedule.id, schedule);
    } else {
      addSchedule(schedule);
    }
    onClose();
  };
  const renderBasicSettings = () => (
    <div>
      <div container spacing={3}>
        <div item xs={12}>
          <Input
            fullWidth
            label="Schedule Name"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            placeholder="e.g., Weekly Patient Outcomes Report"
            required
          />
        </div>
        <div item xs={12}>
          <Input
            fullWidth
            label="Description"
            value={scheduleDescription}
            onChange={(e) => setScheduleDescription(e.target.value)}
            placeholder="Optional description of this scheduled report"
            multiline
            rows={2}
          />
        </div>
        <div item xs={12} sm={6}>
          <div fullWidth>
            <Label>Export Format</Label>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            >
              <MenuItem value="pdf">PDF Document</MenuItem>
              <MenuItem value="excel">Excel Workbook</MenuItem>
              <MenuItem value="csv">CSV File</MenuItem>
              <MenuItem value="json">JSON Data</MenuItem>
            </Select>
          </div>
        </div>
        <div item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Active Schedule"
          />
        </div>
      </div>
    </div>
  );
  const renderScheduleConfiguration = () => (
    <div>
      <div container spacing={3}>
        <div item xs={12}>
          <div  gutterBottom>
            Frequency
          </div>
          <div container spacing={2}>
            {frequencyOptions.map((option) => (
              <div item xs={12} sm={6} md={4} key={option.value}>
                <Card
                  variant={
                    frequency === option.value ? 'outlined' : 'elevation'}
                  }
                  className=""
                  onClick={() => setFrequency(option.value)}
                >
                  <CardContent className="">
                    <div  gutterBottom>
                      {option.label}
                    </div>
                    <div  color="text.secondary">
                      {option.description}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <div item xs={12}>
          <Separator className="" />
        </div>
        {/* Time Selection */}
        <div item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Time"
              value={selectedTime}
              onChange={(newValue) => newValue && setSelectedTime(newValue)}
              slotProps={{ textField: { fullWidth: true }
            />
          </LocalizationProvider>
        </div>
        <div item xs={12} sm={6}>
          <div fullWidth>
            <Label>Timezone</Label>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="America/New_York">Eastern Time</MenuItem>
              <MenuItem value="America/Chicago">Central Time</MenuItem>
              <MenuItem value="America/Denver">Mountain Time</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              <MenuItem value="Africa/Lagos">West Africa Time</MenuItem>
            </Select>
          </div>
        </div>
        {/* Weekly Days Selection */}
        {frequency === 'weekly' && (
          <div item xs={12}>
            <div  gutterBottom>
              Days of Week
            </div>
            <div display="flex" flexWrap="wrap" gap={1}>
              {daysOfWeek.map((day) => (
                <Chip
                  key={day.value}
                  label={day.short}
                  clickable
                  color={
                    selectedDays.includes(day.value) ? 'primary' : 'default'}
                  }
                  onClick={() => handleDayToggle(day.value)}
                />
              ))}
            </div>
          </div>
        )}
        {/* Monthly/Quarterly/Yearly Day Selection */}
        {['monthly', 'quarterly', 'yearly'].includes(frequency) && (
          <div item xs={12} sm={6}>
            <Input
              fullWidth
              label="Day of Month"
              type="number"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
              
            />
          </div>
        )}
        {/* Custom Interval */}
        {frequency === 'custom' && (
          <div item xs={12} sm={6}>
            <Input
              fullWidth
              label="Interval (days)"
              type="number"
              value={customInterval}
              onChange={(e) => setCustomInterval(parseInt(e.target.value))}
              
            />
          </div>
        )}
        {/* End Conditions */}
        <div item xs={12}>
          <div  gutterBottom>
            End Conditions (Optional)
          </div>
          <div container spacing={2}>
            <div item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true }
                />
              </LocalizationProvider>
            </div>
            <div item xs={12} sm={6}>
              <Input
                fullWidth
                label="Maximum Runs"
                type="number"
                value={maxRuns || ''}
                onChange={(e) =>
                  setMaxRuns(e.target.value ? parseInt(e.target.value) : null)}
                }
                
              />
            </div>
          </div>
        </div>
        {/* Next Run Preview */}
        <div item xs={12}>
          <Alert severity="info">
            <div >
              <strong>Next run:</strong> {calculateNextRun().toLocaleString()}
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
  const renderRecipientsDelivery = () => (
    <div>
      <div display="flex" alignItems="center" justifyContent="between" mb={2}>
        <div >Recipients</div>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRecipient}
          
          size="small"
        >
          Add Recipient
        </Button>
      </div>
      {recipients.map((recipient, index) => (
        <Card key={index}  className="">
          <CardContent>
            <div
              display="flex"
              alignItems="center"
              justifyContent="between"
              mb={2}
            >
              <div >Recipient {index + 1}</div>
              <IconButton
                onClick={() => handleRemoveRecipient(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </div>
            <div container spacing={2}>
              <div item xs={12} sm={6}>
                <div fullWidth>
                  <Label>Type</Label>
                  <Select
                    value={recipient.type}
                    onChange={(e) =>
                      handleRecipientChange(index, 'type', e.target.value)}
                    }
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="webhook">Webhook</MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Name"
                  value={recipient.name || ''}
                  onChange={(e) =>
                    handleRecipientChange(index, 'name', e.target.value)}
                  }
                  placeholder="Optional display name"
                />
              </div>
              <div item xs={12}>
                {recipient.type === 'email' ? (
                  <Autocomplete
                    freeSolo
                    options={emailSuggestions}
                    value={recipient.address}
                    onChange={(_, newValue) =>
                      handleRecipientChange(index, 'address', newValue || '')}
                    }
                    renderInput={(params) => (
                      <Input}
                        {...params}
                        label="Email Address"
                        placeholder="user@example.com"
                        required
                      />
                    )}
                  />
                ) : (
                  <Input
                    fullWidth
                    label="Webhook URL"
                    value={recipient.address}
                    onChange={(e) =>
                      handleRecipientChange(index, 'address', e.target.value)}
                    }
                    placeholder="https://example.com/webhook"
                    required
                  />
                )}
              </div>
              {recipient.type === 'email' && (
                <>
                  <div item xs={12}>
                    <Input
                      fullWidth
                      label="Subject"
                      value={recipient.options?.subject || ''}
                      onChange={(e) =>
                        handleRecipientOptionChange(
                          index,
                          'subject',
                          e.target.value
                        )}
                      }
                      placeholder="Email subject line"
                    />
                  </div>
                  <div item xs={12}>
                    <Input
                      fullWidth
                      label="Message"
                      value={recipient.options?.body || ''}
                      onChange={(e) =>
                        handleRecipientOptionChange(
                          index,
                          'body',
                          e.target.value
                        )}
                      }
                      placeholder="Email message body"
                      multiline
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {recipients.length === 0 && (
        <Alert severity="warning">
          No recipients configured. Add at least one recipient to receive
          scheduled reports.
        </Alert>
      )}
    </div>
  );
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicSettings();
      case 1:
        return renderScheduleConfiguration();
      case 2:
        return renderRecipientsDelivery();
      default:
        return null;
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '600px' } >
      <DialogTitle>
        <div display="flex" alignItems="center" justifyContent="between">
          <div display="flex" alignItems="center">
            <ScheduleIcon className="" />
            {initialSchedule ? 'Edit Schedule' : 'Schedule Report'}
          </div>
          <Button
            onClick={onClose}
            size="small"
            className=""
          >
            <CloseIcon />
          </Button>
        </div>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} className="">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {errors.length > 0 && (
          <Alert severity="error" className="">
            <div  gutterBottom>
              Please fix the following errors:
            </div>
            <ul >
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            
            disabled={errors.length > 0}
            startIcon={<ScheduleIcon />}
          >
            {initialSchedule ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
