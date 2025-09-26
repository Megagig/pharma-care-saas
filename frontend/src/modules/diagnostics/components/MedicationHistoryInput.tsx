import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Alert, Separator } from '@/components/ui/button';
// Common medications for quick selection
const COMMON_MEDICATIONS = [
  'Acetaminophen',
  'Ibuprofen',
  'Aspirin',
  'Lisinopril',
  'Amlodipine',
  'Metformin',
  'Atorvastatin',
  'Omeprazole',
  'Levothyroxine',
  'Metoprolol',
  'Hydrochlorothiazide',
  'Losartan',
  'Simvastatin',
  'Gabapentin',
  'Sertraline',
  'Prednisone',
  'Amoxicillin',
  'Ciprofloxacin',
  'Warfarin',
  'Insulin',
];
const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
  'Monthly',
  'Other',
];
const DOSAGE_UNITS = [
  'mg',
  'g',
  'mcg',
  'mL',
  'tablets',
  'capsules',
  'drops',
  'puffs',
  'units',
  'patches',
];
interface MedicationFormData {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
}
interface MedicationDialogData {
  name: string;
  dosage: string;
  dosageAmount: string;
  dosageUnit: string;
  frequency: string;
  customFrequency: string;
}
const MedicationHistoryInput: React.FC<MedicationHistoryInputProps> = ({ 
  value = [],
  onChange,
  error,
  disabled = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { control, watch } = useForm<MedicationFormData>({ 
    defaultValues: {
      medications: value}
    }
  const { fields, append, remove, update } = useFieldArray({ 
    control,
    name: 'medications'}
  });
  const watchedMedications = watch('medications');
  // Update parent component when medications change
    onChange(watchedMedications);
  }, [watchedMedications, onChange]);
  // Dialog form for adding/editing medications
  const {
    control: dialogControl,
    handleSubmit: handleDialogSubmit,
    reset: resetDialog,
    watch: watchDialog,
    formState: { errors: dialogErrors },
  } = useForm<MedicationDialogData>({ 
    defaultValues: {
      name: '',
      dosage: '',
      dosageAmount: '',
      dosageUnit: 'mg',
      frequency: 'Once daily',
      customFrequency: ''}
    }
  const watchedDialogValues = watchDialog();
  const handleOpenDialog = useCallback(
    (medication?: (typeof value)[0], index?: number) => {
      if (medication) {
        // Parse existing dosage
        const dosageMatch = medication.dosage.match(
          /^(\d+(?:\.\d+)?)\s*(\w+)$/
        );
        const dosageAmount = dosageMatch ? dosageMatch[1] : '';
        const dosageUnit = dosageMatch ? dosageMatch[2] : 'mg';
        resetDialog({ 
          name: medication.name,
          dosage: medication.dosage,
          dosageAmount,
          dosageUnit,
          frequency: FREQUENCY_OPTIONS.includes(medication.frequency)
            ? medication.frequency
            : 'Other',
          customFrequency: FREQUENCY_OPTIONS.includes(medication.frequency)
            ? ''
            : medication.frequency}
        });
        setEditingIndex(index ?? null);
      } else {
        resetDialog({ 
          name: '',
          dosage: '',
          dosageAmount: '',
          dosageUnit: 'mg',
          frequency: 'Once daily',
          customFrequency: ''}
        });
        setEditingIndex(null);
      }
      setIsDialogOpen(true);
    },
    [resetDialog]
  );
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    resetDialog();
  }, [resetDialog]);
  const handleSaveMedication = useCallback(
    (data: MedicationDialogData) => {
      const dosage =
        data.dosageAmount && data.dosageUnit
          ? `${data.dosageAmount} ${data.dosageUnit}`
          : data.dosage;
      const frequency =
        data.frequency === 'Other' ? data.customFrequency : data.frequency;
      const medication = {
        name: data.name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
      };
      if (editingIndex !== null) {
        // Update existing medication
        update(editingIndex, medication);
      } else {
        // Add new medication
        append(medication);
      }
      handleCloseDialog();
    },
    [editingIndex, update, append, handleCloseDialog]
  );
  const handleRemoveMedication = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );
  const handleQuickAddMedication = useCallback(
    (medicationName: string) => {
      append({ 
        name: medicationName,
        dosage: '',
        frequency: 'Once daily'}
      });
    },
    [append]
  );
  // Filter medications based on search
  const filteredCommonMedications = COMMON_MEDICATIONS.filter(
    (med) =>
      med.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !watchedMedications.some(
        (existing) => existing.name.toLowerCase() === med.toLowerCase()
      )
  );
  // Validation
  const validateMedicationName = (name: string): string | true => {
    if (!name.trim()) {
      return 'Medication name is required';
    }
    if (name.trim().length < 2) {
      return 'Medication name must be at least 2 characters';
    }
    return true;
  };
  const validateDosage = (
    dosageAmount: string,
    dosageUnit: string
  ): string | true => {
    if (!dosageAmount && !dosageUnit) {
      return true; // Optional
    }
    if (dosageAmount && !dosageUnit) {
      return 'Please select a dosage unit';
    }
    if (!dosageAmount && dosageUnit) {
      return 'Please enter dosage amount';
    }
    const amount = parseFloat(dosageAmount);
    if (isNaN(amount) || amount <= 0) {
      return 'Dosage amount must be a positive number';
    }
    return true;
  };
  const validateFrequency = (
    frequency: string,
    customFrequency: string
  ): string | true => {
    if (frequency === 'Other' && !customFrequency.trim()) {
      return 'Please specify custom frequency';
    }
    return true;
  };
  return (
    <Card>
      <CardContent>
        <div className="">
          <div  className="">
            Current Medications
          </div>
          <div  color="text.secondary">
            Document all current medications, supplements, and over-the-counter
            drugs
          </div>
        </div>
        {error && (
          <Alert severity="error" className="">
            {error}
          </Alert>
        )}
        {/* Current Medications List */}
        {fields.length > 0 ? (
          <div className="">
            <div spacing={2}>
              {fields.map((field, index) => (
                <Card key={field.id}  className="">
                  <div
                    className=""
                  >
                    <div className="">
                      <div
                        className=""
                      >
                        <MedicationIcon
                          className=""
                        />
                        <div
                          
                          className=""
                        >
                          {field.name}
                        </div>
                      </div>
                      <div
                        className="">
                        <div  color="text.secondary">
                          <strong>Dosage:</strong>{' '}
                          {field.dosage || 'Not specified'}
                        </div>
                        <div  color="text.secondary">
                          <strong>Frequency:</strong> {field.frequency}
                        </div>
                      </div>
                    </div>
                    <div className="">
                      <Tooltip title="Edit medication">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(field, index)}
                          disabled={disabled}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove medication">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMedication(index)}
                          disabled={disabled}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Alert severity="info" className="">
            <div >
              No medications recorded. Add current medications to help with drug
              interaction checking and clinical assessment.
            </div>
          </Alert>
        )}
        {/* Add Medication Button */}
        <div className="">
          <Button
            
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={disabled}
          >
            Add Medication
          </Button>
        </div>
        <Separator className="" />
        {/* Quick Add Common Medications */}
        <div>
          <div  className="">
            Quick Add Common Medications
          </div>
          <Input
            size="small"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            
            className=""
            disabled={disabled}
          />
          <div className="">
            {filteredCommonMedications.slice(0, 15).map((medication) => (
              <Chip
                key={medication}
                label={medication}
                onClick={() => handleQuickAddMedication(medication)}
                disabled={disabled}
                className=""
                
                size="small"
              />
            ))}
          </div>
          {filteredCommonMedications.length === 0 && searchTerm && (
            <div  color="text.secondary" className="">
              No medications found matching "{searchTerm}"
            </div>
          )}
        </div>
        {/* Medication Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 2 } } >
          <DialogTitle>
            <div className="">
              <MedicationIcon className="" />
              {editingIndex !== null ? 'Edit Medication' : 'Add Medication'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <form onSubmit={handleDialogSubmit(handleSaveMedication)}>
              <div spacing={3}>
                {/* Medication Name */}
                <Controller
                  name="name"
                  control={dialogControl}
                  
                  render={({  field  }) => (
                    <Autocomplete
                      {...field}
                      options={COMMON_MEDICATIONS}
                      freeSolo
                      value={field.value}
                      onChange={(_, value) => field.onChange(value || '')}
                      onInputChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => (
                        <Input}
                          {...params}
                          label="Medication Name"
                          placeholder="Enter or search medication name"
                          error={!!dialogErrors.name}
                          helperText={dialogErrors.name?.message}
                          required
                        />
                      )}
                    />
                  )}
                />
                {/* Dosage */}
                <div>
                  <div
                    
                    className=""
                  >
                    Dosage (Optional)
                  </div>
                  <div
                    className=""
                  >
                    <Controller
                      name="dosageAmount"
                      control={dialogControl}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="Amount"
                          placeholder="10"
                          type="number"
                          slotProps={{}
                            htmlInput: { min: 0, step: 0.1 },
                          error={!!dialogErrors.dosageAmount}
                          helperText={dialogErrors.dosageAmount?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="dosageUnit"
                      control={dialogControl}
                      render={({  field  }) => (
                        <div fullWidth>
                          <Label>Unit</Label>
                          <Select {...field} label="Unit">
                            {DOSAGE_UNITS.map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    />
                  </div>
                </div>
                {/* Frequency */}
                <div>
                  <Controller
                    name="frequency"
                    control={dialogControl}
                    
                    render={({  field  }) => (
                      <div fullWidth error={!!dialogErrors.frequency}>
                        <Label>Frequency</Label>
                        <Select {...field} label="Frequency">
                          {FREQUENCY_OPTIONS.map((freq) => (
                            <MenuItem key={freq} value={freq}>
                              {freq}
                            </MenuItem>
                          ))}
                        </Select>
                        {dialogErrors.frequency && (
                          <p>
                            {dialogErrors.frequency.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  {watchedDialogValues.frequency === 'Other' && (
                    <Controller
                      name="customFrequency"
                      control={dialogControl}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="Custom Frequency"
                          placeholder="e.g., Every other day, Before meals"
                          fullWidth
                          className=""
                          error={!!dialogErrors.customFrequency}
                          helperText={dialogErrors.customFrequency?.message}
                        />
                      )}
                    />
                  )}
                </div>
                {/* Information */}
                <Alert severity="info">
                  <div >
                    <strong>Tip:</strong> Include all medications, supplements,
                    vitamins, and over-the-counter drugs. This information is
                    crucial for checking drug interactions and ensuring patient
                    safety.
                  </div>
                </Alert>
              </div>
            </form>
          </DialogContent>
          <DialogActions className="">
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleDialogSubmit(handleSaveMedication)}
              
            >
              {editingIndex !== null ? 'Update' : 'Add'} Medication
            </Button>
          </DialogActions>
        </Dialog>
        {/* Summary */}
        {fields.length > 0 && (
          <Alert severity="success" className="">
            <div >
              <strong>Medication Summary:</strong> {fields.length} medication
              {fields.length > 1 ? 's' : ''} recorded. This information will be
              used for drug interaction checking during the diagnostic process.
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
export default MedicationHistoryInput;
