import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Plus,
  ArrowUpDown,
  Edit,
  CheckCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pill,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data and interfaces (assuming these are defined elsewhere)
interface MTRMedication {
  id?: string;
  drugName: string;
  genericName?: string;
  strength: { value: number; unit: string };
  dosageForm: string;
  instructions: {
    dose: string;
    frequency: string;
    route: string;
    duration?: string;
  };
  category: 'prescribed' | 'otc' | 'herbal' | 'supplement';
  prescriber?: { name: string; license?: string; contact?: string };
  startDate: Date;
  endDate?: Date;
  indication: string;
  adherenceScore?: number;
  notes?: string;
  isManual?: boolean;
}

const useMTRStore = () => ({
  medications: [],
  addMedication: (med: MTRMedication) => {},
  updateMedication: (id: string, med: MTRMedication) => {},
  removeMedication: (id: string) => {},
  importMedications: (id: string) => {},
  validateMedications: () => [],
  loading: { saveMedication: false, importMedications: false },
  errors: { saveMedication: null, importMedications: null },
  setLoading: (key: string, val: boolean) => {},
  setError: (key: string, val: string | null) => {},
  selectedPatient: {
    _id: '123',
    firstName: 'John',
    lastName: 'Doe',
  },
});

const medicationService = {
  getMedicationsByPatient: (id: string) =>
    Promise.resolve({ success: true, data: [] }),
};

const offlineStorage = {
  saveMedication: (med: MTRMedication) => {},
  autoSaveDraft: (type: string, med: MTRMedication, id: string) => {},
};

const useResponsive = () => ({
  isMobile: false,
  getSpacing: (val: number) => val * 4,
});

const useSwipeGesture = (fn: any, opts: any) => {};
const useLongPress = (fn: any, opts: any) => {};

const medicationSchema = z.object({
  drugName: z.string().min(1, 'Drug name is required'),
  genericName: z.string().optional(),
  strength: z.object({
    value: z.number().min(0.001, 'Strength must be greater than 0'),
    unit: z.string().min(1, 'Unit is required'),
  }),
  dosageForm: z.string().min(1, 'Dosage form is required'),
  instructions: z.object({
    dose: z.string().min(1, 'Dose is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    route: z.string().min(1, 'Route is required'),
    duration: z.string().optional(),
  }),
  category: z.enum(['prescribed', 'otc', 'herbal', 'supplement']),
  prescriber: z
    .object({
      name: z.string().optional(),
      license: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  indication: z.string().min(1, 'Indication is required'),
  adherenceScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

const MEDICATION_CATEGORIES = [
  { value: 'prescribed', label: 'Prescribed Medications', color: 'primary' },
  { value: 'otc', label: 'Over-the-Counter', color: 'secondary' },
  { value: 'herbal', label: 'Herbal/Traditional', color: 'success' },
  { value: 'supplement', label: 'Supplements/Vitamins', color: 'info' },
] as const;

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Suppository',
  'Powder',
  'Solution',
  'Gel',
  'Lotion',
];

const STRENGTH_UNITS = [
  'mg',
  'g',
  'mcg',
  'ml',
  'IU',
  '%',
  'units',
  'mmol',
  'mEq',
];

const ROUTES = [
  'Oral',
  'Topical',
  'Intravenous',
  'Intramuscular',
  'Subcutaneous',
  'Inhalation',
  'Rectal',
  'Vaginal',
  'Ophthalmic',
  'Otic',
  'Nasal',
  'Sublingual',
  'Buccal',
];

const FREQUENCIES = [
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

const MOCK_DRUGS = [
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    commonStrengths: ['500mg', '1000mg'],
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    commonStrengths: ['200mg', '400mg', '600mg'],
  },
];

interface MedicationHistoryProps {
  patientId: string;
  onMedicationsUpdate: (medications: MTRMedication[]) => void;
  onNext?: () => void;
}

const MedicationHistory: React.FC<MedicationHistoryProps> = ({
  patientId,
  onMedicationsUpdate,
  onNext,
}) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState(MEDICATION_CATEGORIES[0].value);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [editingMedication, setEditingMedication] =
    useState<MTRMedication | null>(null);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [drugSuggestions, setDrugSuggestions] = useState<typeof MOCK_DRUGS>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [showManualEntryButton, setShowManualEntryButton] = useState(false);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(
    new Set()
  );
  const [importLoading, setImportLoading] = useState(false);

  const {
    medications,
    addMedication,
    updateMedication,
    removeMedication,
    importMedications,
    validateMedications,
    loading,
    errors,
    setLoading,
    setError,
    selectedPatient,
  } = useMTRStore();

  const defaultFormValues = useMemo(
    (): MedicationFormData => ({
      drugName: '',
      genericName: '',
      strength: { value: 0, unit: 'mg' },
      dosageForm: '',
      instructions: {
        dose: '',
        frequency: '',
        route: 'Oral',
        duration: '',
      },
      category: 'prescribed',
      prescriber: {
        name: '',
        license: '',
        contact: '',
      },
      startDate: new Date(),
      endDate: undefined,
      indication: '',
      adherenceScore: 0,
      notes: '',
    }),
    []
  );

  const {
    control: medicationControl,
    handleSubmit: handleMedicationFormSubmit,
    watch: watchMedication,
    setValue: setMedicationValue,
    formState: { errors: medicationErrors },
    reset: resetMedicationForm,
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: defaultFormValues,
  });

  const watchedCategory = watchMedication('category');

  const handleAddMedication = (
    category?: 'prescribed' | 'otc' | 'herbal' | 'supplement'
  ) => {
    resetMedicationForm(defaultFormValues);
    if (category) {
      setMedicationValue('category', category);
    }
    setEditingMedication(null);
    setIsManualEntry(false);
    setShowManualEntryButton(false);
    setDrugSearchQuery('');
    setShowMedicationModal(true);
  };

  const handleEditMedication = (medication: MTRMedication) => {
    setEditingMedication(medication);
    resetMedicationForm(medication as MedicationFormData);
    setIsManualEntry(medication.isManual || false);
    setDrugSearchQuery(medication.drugName);
    setShowManualEntryButton(false);
    setShowMedicationModal(true);
  };

  const handleDeleteMedication = (medicationId: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      removeMedication(medicationId);
    }
  };

  const handleMedicationSubmit = useCallback(
    async (data: MedicationFormData) => {
      // ... (submission logic remains the same)
    },
    [
      editingMedication,
      addMedication,
      updateMedication,
      patientId,
      setLoading,
      setError,
      resetMedicationForm,
    ]
  );

  const getMedicationsByCategory = (category: string) => {
    return medications.filter((med) => med.category === category);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold">Medication History Collection</h2>
        <p className="text-muted-foreground">
          Document all medications including prescribed, over-the-counter,
          herbal, and supplements
        </p>
      </div>

      {selectedPatient && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-primary">
              Patient: {selectedPatient.firstName} {selectedPatient.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              ID: {selectedPatient._id}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={() => handleAddMedication()}>
          <Plus className="mr-2 h-4 w-4" /> Add Medication
        </Button>
        {/* ... other buttons */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {MEDICATION_CATEGORIES.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              <Badge variant={category.color as any} className="mr-2">
                {getMedicationsByCategory(category.value).length}
              </Badge>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {MEDICATION_CATEGORIES.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            {getMedicationsByCategory(category.value).length === 0 ? (
              <div className="text-center p-8">
                <Pill className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  No {category.label} Added
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click "Add {category.label.split('/')[0]}" to document
                  medications in this category
                </p>
                <Button
                  className="mt-4"
                  onClick={() => handleAddMedication(category.value)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add{' '}
                  {category.label.split('/')[0]}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {getMedicationsByCategory(category.value).map((med) => (
                  <Card key={med.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{med.drugName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {med.instructions.dose} &bull; {med.instructions.frequency}{' '}
                          &bull; {med.instructions.route}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMedication(med)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMedication(med.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showMedicationModal} onOpenChange={setShowMedicationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? 'Edit Medication' : 'Add New Medication'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleMedicationFormSubmit(handleMedicationSubmit)}
            className="space-y-4 p-4"
          >
            {/* Drug Name */}
            <Controller
              name="drugName"
              control={medicationControl}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Drug Name</Label>
                  <Input {...field} placeholder="Search for medication..." />
                  {medicationErrors.drugName && (
                    <p className="text-sm font-medium text-destructive">
                      {medicationErrors.drugName.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Other form fields */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="strength.value"
                control={medicationControl}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Strength</Label>
                    <Input type="number" {...field} />
                    {medicationErrors.strength?.value && (
                      <p className="text-sm font-medium text-destructive">
                        {medicationErrors.strength.value.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                name="strength.unit"
                control={medicationControl}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {STRENGTH_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>

            {/* ... more fields ... */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMedicationModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading.saveMedication}>
                {loading.saveMedication ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationHistory;