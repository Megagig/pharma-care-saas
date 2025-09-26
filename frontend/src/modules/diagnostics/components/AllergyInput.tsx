import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Alert, Separator } from '@/components/ui/button';
// Common allergens categorized
const COMMON_ALLERGENS = {
  medications: [
    'Penicillin',
    'Amoxicillin',
    'Ampicillin',
    'Aspirin',
    'Ibuprofen',
    'Naproxen',
    'Sulfonamides',
    'Codeine',
    'Morphine',
    'Latex',
    'Iodine',
    'Contrast dye',
  ],
  foods: [
    'Peanuts',
    'Tree nuts',
    'Shellfish',
    'Fish',
    'Eggs',
    'Milk',
    'Wheat',
    'Soy',
    'Sesame',
  ],
  environmental: [
    'Dust mites',
    'Pollen',
    'Pet dander',
    'Mold',
    'Insect stings',
    'Bee stings',
    'Wasp stings',
  ],
};
const ALL_ALLERGENS = [
  ...COMMON_ALLERGENS.medications,
  ...COMMON_ALLERGENS.foods,
  ...COMMON_ALLERGENS.environmental,
];
const SEVERITY_LEVELS = [
  {
    value: 'mild',
    label: 'Mild',
    color: 'success' as const,
    description: 'Minor symptoms, not life-threatening',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    color: 'warning' as const,
    description: 'Significant symptoms requiring treatment',
  },
  {
    value: 'severe',
    label: 'Severe',
    color: 'error' as const,
    description: 'Life-threatening, requires immediate attention',
  },
];
const REACTION_TYPES = [
  'Skin rash',
  'Hives',
  'Itching',
  'Swelling',
  'Difficulty breathing',
  'Wheezing',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Anaphylaxis',
  'Dizziness',
  'Fainting',
  'Other',
];
interface AllergyData {
  substance: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  notes?: string;
}
interface AllergyFormData {
  allergies: AllergyData[];
}
interface AllergyDialogData {
  substance: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  customReaction: string;
  notes: string;
}
const AllergyInput: React.FC<AllergyInputProps> = ({ 
  value = [],
  onChange,
  error,
  disabled = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'medications' | 'foods' | 'environmental'
  >('all');
  // Convert string array to allergy objects for internal use
  const allergyObjects: AllergyData[] = React.useMemo(() => {
    return value.map((allergen) => {
      if (typeof allergen === 'string') {
        return { substance: allergen, severity: 'mild' as const };
      }
      return allergen as AllergyData;
    });
  }, [value]);
  const { control, watch } = useForm<AllergyFormData>({ 
    defaultValues: {
      allergies: allergyObjects}
    }
  const watchedAllergies = watch('allergies');
  // Update parent component when allergies change
    // Convert back to string array for backward compatibility
    const allergyStrings = watchedAllergies.map((allergy) => allergy.substance);
    onChange(allergyStrings);
  }, [watchedAllergies, onChange]);
  // Dialog form
  const {
    control: dialogControl,
    handleSubmit: handleDialogSubmit,
    reset: resetDialog,
    watch: watchDialog,
    formState: { errors: dialogErrors },
  } = useForm<AllergyDialogData>({ 
    defaultValues: {
      substance: '',
      severity: 'mild',
      reaction: '',
      customReaction: '',
      notes: ''}
    }
  const watchedDialogValues = watchDialog();
  const handleOpenDialog = useCallback(
    (allergy?: AllergyData, index?: number) => {
      if (allergy) {
        resetDialog({ 
          substance: allergy.substance,
          severity: allergy.severity,
          reaction:
            allergy.reaction && REACTION_TYPES.includes(allergy.reaction)
              ? allergy.reaction
              : 'Other',
          customReaction:
            allergy.reaction && !REACTION_TYPES.includes(allergy.reaction)
              ? allergy.reaction
              : '',
          notes: allergy.notes || ''}
        });
        setEditingIndex(index ?? null);
      } else {
        resetDialog({ 
          substance: '',
          severity: 'mild',
          reaction: '',
          customReaction: '',
          notes: ''}
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
  const handleSaveAllergy = useCallback(
    (data: AllergyDialogData) => {
      const reaction =
        data.reaction === 'Other' ? data.customReaction : data.reaction;
      const allergy: AllergyData = {
        substance: data.substance.trim(),
        severity: data.severity,
        reaction: reaction.trim() || undefined,
        notes: data.notes.trim() || undefined,
      };
      const updatedAllergies = [...watchedAllergies];
      if (editingIndex !== null) {
        updatedAllergies[editingIndex] = allergy;
      } else {
        updatedAllergies.push(allergy);
      }
      // Update form state (this will trigger the useEffect to update parent)
      const event = { target: { value: updatedAllergies } };
      const field = {
        onChange: (allergies: AllergyData[]) => {
          // Manually update the form state
          const allergyStrings = allergies.map((a) => a.substance);
          onChange(allergyStrings);
        },
      };
      field.onChange(updatedAllergies);
      handleCloseDialog();
    },
    [watchedAllergies, editingIndex, onChange, handleCloseDialog]
  );
  const handleRemoveAllergy = useCallback(
    (index: number) => {
      const updatedAllergies = watchedAllergies.filter((_, i) => i !== index);
      const allergyStrings = updatedAllergies.map((a) => a.substance);
      onChange(allergyStrings);
    },
    [watchedAllergies, onChange]
  );
  const handleQuickAddAllergy = useCallback(
    (substance: string) => {
      if (!value.includes(substance)) {
        onChange([...value, substance]);
      }
    },
    [value, onChange]
  );
  // Filter allergens based on search and category
  const getFilteredAllergens = () => {
    let allergens: string[] = [];
    switch (selectedCategory) {
      case 'medications':
        allergens = COMMON_ALLERGENS.medications;
        break;
      case 'foods':
        allergens = COMMON_ALLERGENS.foods;
        break;
      case 'environmental':
        allergens = COMMON_ALLERGENS.environmental;
        break;
      default:
        allergens = ALL_ALLERGENS;
    }
    return allergens.filter(
      (allergen) =>
        allergen.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !value.includes(allergen)
    );
  };
  const getSeverityColor = (severity: string) => {
    const level = SEVERITY_LEVELS.find((l) => l.value === severity);
    return level?.color || 'default';
  };
  const getSeverityIcon = (severity: string) => {
    if (severity === 'severe') {
      return <WarningIcon className="" />;
    }
    return null;
  };
  // Validation
  const validateSubstance = (substance: string): string | true => {
    if (!substance.trim()) {
      return 'Allergy substance is required';
    }
    if (substance.trim().length < 2) {
      return 'Substance name must be at least 2 characters';
    }
    return true;
  };
  const validateReaction = (
    reaction: string,
    customReaction: string
  ): string | true => {
    if (reaction === 'Other' && !customReaction.trim()) {
      return 'Please specify the reaction';
    }
    return true;
  };
  return (
    <Card>
      <CardContent>
        <div className="">
          <div  className="">
            Allergies & Adverse Reactions
          </div>
          <div  color="text.secondary">
            Document known allergies and adverse drug reactions for safety
            screening
          </div>
        </div>
        {error && (
          <Alert severity="error" className="">
            {error}
          </Alert>
        )}
        {/* Current Allergies */}
        {allergyObjects.length > 0 ? (
          <div className="">
            <div  className="">
              Recorded Allergies ({allergyObjects.length})
            </div>
            <div spacing={2}>
              {allergyObjects.map((allergy, index) => (
                <Card key={index}  className="">
                  <div
                    className=""
                  >
                    <div className="">
                      <div
                        className=""
                      >
                        <LocalHospitalIcon
                          className=""
                        />
                        <div
                          
                          className=""
                        >
                          {allergy.substance}
                        </div>
                        {getSeverityIcon(allergy.severity)}
                        <Chip
                          label={
                            SEVERITY_LEVELS.find(
                              (l) => l.value === allergy.severity
                            )?.label}
                          }
                          size="small"
                          color={getSeverityColor(allergy.severity)}
                          
                          className=""
                        />
                      </div>
                      {allergy.reaction && (
                        <div
                          
                          color="text.secondary"
                          className=""
                        >
                          <strong>Reaction:</strong> {allergy.reaction}
                        </div>
                      )}
                      {allergy.notes && (
                        <div  color="text.secondary">
                          <strong>Notes:</strong> {allergy.notes}
                        </div>
                      )}
                    </div>
                    <div className="">
                      <Tooltip title="Edit allergy">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(allergy, index)}
                          disabled={disabled}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove allergy">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAllergy(index)}
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
              No allergies recorded. If the patient has no known allergies, this
              is noted. Add any known allergies to prevent adverse reactions.
            </div>
          </Alert>
        )}
        {/* Add Allergy Button */}
        <div className="">
          <Button
            
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={disabled}
          >
            Add Allergy
          </Button>
        </div>
        <Separator className="" />
        {/* Quick Add Common Allergens */}
        <div>
          <div  className="">
            Quick Add Common Allergens
          </div>
          {/* Category Filter */}
          <div
            className="">
            <Input
              size="small"
              placeholder="Search allergens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon className="" />),}
                },
              disabled={disabled}
              fullWidth
            />
            <div size="small" fullWidth>
              <Label>Category</Label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                label="Category"
                disabled={disabled}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="medications">Medications</MenuItem>
                <MenuItem value="foods">Foods</MenuItem>
                <MenuItem value="environmental">Environmental</MenuItem>
              </Select>
            </div>
          </div>
          {/* Allergen Chips */}
          <div className="">
            {getFilteredAllergens()
              .slice(0, 20)
              .map((allergen) => (
                <Chip
                  key={allergen}
                  label={allergen}
                  onClick={() => handleQuickAddAllergy(allergen)}
                  disabled={disabled}
                  className=""
                  
                  size="small"
                />
              ))}
          </div>
          {getFilteredAllergens().length === 0 && (
            <div  color="text.secondary" className="">
              {searchTerm
                ? `No allergens found matching "${searchTerm}"`
                : 'All common allergens have been added'}
            </div>
          )}
        </div>
        {/* Allergy Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 2 } } >
          <DialogTitle>
            <div className="">
              <LocalHospitalIcon className="" />
              {editingIndex !== null ? 'Edit Allergy' : 'Add Allergy'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <form onSubmit={handleDialogSubmit(handleSaveAllergy)}>
              <div spacing={3}>
                {/* Substance */}
                <Controller
                  name="substance"
                  control={dialogControl}
                  
                  render={({  field  }) => (
                    <Autocomplete
                      {...field}
                      options={ALL_ALLERGENS}
                      freeSolo
                      value={field.value}
                      onChange={(_, value) => field.onChange(value || '')}
                      onInputChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => (
                        <Input}
                          {...params}
                          label="Allergy Substance"
                          placeholder="Enter or search allergen"
                          error={!!dialogErrors.substance}
                          helperText={dialogErrors.substance?.message}
                          required
                        />
                      )}
                    />
                  )}
                />
                {/* Severity */}
                <Controller
                  name="severity"
                  control={dialogControl}
                  render={({  field  }) => (
                    <div fullWidth>
                      <Label>Severity</Label>
                      <Select {...field} label="Severity">
                        {SEVERITY_LEVELS.map((level) => (
                          <MenuItem key={level.value} value={level.value}>
                            <div className="">
                              <Chip
                                label={level.label}
                                size="small"
                                color={level.color}
                                
                                className=""
                              />
                              <div
                                
                                color="text.secondary"
                              >
                                {level.description}
                              </div>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                />
                {/* Reaction */}
                <div>
                  <Controller
                    name="reaction"
                    control={dialogControl}
                    
                    render={({  field  }) => (
                      <div fullWidth error={!!dialogErrors.reaction}>
                        <Label>Reaction Type (Optional)</Label>
                        <Select {...field} label="Reaction Type (Optional)">
                          <MenuItem value="">
                            <em>Not specified</em>
                          </MenuItem>
                          {REACTION_TYPES.map((reaction) => (
                            <MenuItem key={reaction} value={reaction}>
                              {reaction}
                            </MenuItem>
                          ))}
                        </Select>
                        {dialogErrors.reaction && (
                          <p>
                            {dialogErrors.reaction.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  {watchedDialogValues.reaction === 'Other' && (
                    <Controller
                      name="customReaction"
                      control={dialogControl}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="Specify Reaction"
                          placeholder="Describe the allergic reaction"
                          fullWidth
                          className=""
                          error={!!dialogErrors.customReaction}
                          helperText={dialogErrors.customReaction?.message}
                        />
                      )}
                    />
                  )}
                </div>
                {/* Notes */}
                <Controller
                  name="notes"
                  control={dialogControl}
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="Additional Notes (Optional)"
                      placeholder="Any additional information about this allergy"
                      multiline
                      rows={2}
                      fullWidth
                    />
                  )}
                />
                {/* Severity Warning */}
                {watchedDialogValues.severity === 'severe' && (
                  <Alert severity="error">
                    <div >
                      <strong>Severe Allergy Warning:</strong> This allergy will
                      be prominently flagged during medication prescribing and
                      clinical assessments to prevent life-threatening
                      reactions.
                    </div>
                  </Alert>
                )}
              </div>
            </form>
          </DialogContent>
          <DialogActions className="">
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleDialogSubmit(handleSaveAllergy)}
              
            >
              {editingIndex !== null ? 'Update' : 'Add'} Allergy
            </Button>
          </DialogActions>
        </Dialog>
        {/* Summary and Warnings */}
        {allergyObjects.length > 0 && (
          <div className="">
            {allergyObjects.some((a) => a.severity === 'severe') && (
              <Alert severity="error" className="">
                <div >
                  <strong>Critical Allergies Detected:</strong> This patient has
                  severe allergies that require immediate attention during
                  medication prescribing and treatment planning.
                </div>
              </Alert>
            )}
            <Alert severity="success">
              <div >
                <strong>Allergy Summary:</strong> {allergyObjects.length} allerg
                {allergyObjects.length > 1 ? 'ies' : 'y'} recorded. This
                information will be used for drug interaction and
                contraindication checking.
              </div>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default AllergyInput;
