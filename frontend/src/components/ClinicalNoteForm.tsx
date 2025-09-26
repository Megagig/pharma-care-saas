import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

// Shadcn/UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

// Icons from lucide-react
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  Search,
  AlertTriangle as WarningIcon
} from 'lucide-react';

// Services and utilities
import clinicalNoteService from '../services/clinicalNoteService';
import NoteFileUpload from './NoteFileUpload';

// Custom components for missing functionality
const Autocomplete = ({ options, value, onChange, onInputChange, loading, disabled, getOptionLabel, renderInput }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedOption = options.find((opt: any) => opt._id === value);

  const handleSelect = (option: any) => {
    onChange(null, option);
    setIsOpen(false);
    setInputValue('');
  };

  return (
    <div className="relative">
      <div className="flex items-center border rounded-md">
        <Search className="ml-2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onInputChange(e, e.target.value, 'input');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={renderInput?.props?.placeholder || 'Search...'}
          disabled={disabled}
          className="flex-1 px-3 py-2 outline-none"
        />
        {loading && <Spinner className="mr-2 h-4 w-4" />}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No options found</div>
          ) : (
            options.map((option: any) => (
              <div
                key={option._id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {getOptionLabel(option)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DateTimePicker = ({ label, value, onChange, disabled, slotProps }: any) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
          disabled={disabled}
          className="w-full pl-10 pr-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {slotProps?.textField?.error && (
        <p className="text-sm text-red-500">{slotProps.textField.helperText}</p>
      )}
    </div>
  );
};

const Collapse = ({ in: isOpen, children }: any) => {
  return isOpen ? <div className="space-y-4">{children}</div> : null;
};

const IconButton = ({ children, onClick, disabled, className = '' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);


// Mock types and constants (replace with actual imports)
interface ClinicalNoteFormData {
  patient?: string;
  title: string;
  type: string;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  medications?: any[];
  vitalSigns?: any;
  laborResults?: any[];
  recommendations?: any[];
  followUpRequired: boolean;
  followUpDate?: string;
  priority?: string;
  isConfidential: boolean;
  tags?: any[];
}

const NOTE_TYPES = [
  { value: 'progress', label: 'Progress Note' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'discharge', label: 'Discharge Summary' },
  { value: 'procedure', label: 'Procedure Note' },
];

const NOTE_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' },
];

// Mock hooks and utilities (replace with actual implementations)
const useClinicalNotesErrorHandling = () => ({
  handleError: () => { },
  getErrors: () => ({}),
  clearError: () => { },
  hasErrors: () => false,
});

const useDuplicateSubmissionPrevention = () => ({
  preventDuplicateSubmission: () => { },
  isSubmitting: false,
});

const useFormValidationFeedback = () => ({
  validateField: () => { },
  hasFieldError: () => false,
  getFieldError: () => '',
  clearFieldValidation: () => { },
});

const useClinicalNote = (id: string, options: any) => ({
  data: id ? {
    note: {
      patient: { _id: '1' },
      title: '',
      type: 'progress',
      content: { subjective: '', objective: '', assessment: '', plan: '' },
      medications: [],
      vitalSigns: {},
      laborResults: [],
      recommendations: [],
      followUpRequired: false,
      followUpDate: undefined,
      priority: 'medium',
      isConfidential: false,
      tags: [],
      attachments: []
    }
  } : null,
  isLoading: false,
});

const usePatients = (filters: any) => ({
  data: { data: { results: [] } },
  isLoading: false,
});

const useSearchPatients = (query: string) => ({
  data: query ? { data: { results: [] } } : null,
  isLoading: false,
});

const useCreateClinicalNote = () => ({
  mutateAsync: async (data: any) => ({ note: { _id: 'new' } }),
  isPending: false,
});

const useUpdateClinicalNote = () => ({
  mutateAsync: async ({ id, data }: any) => ({ note: { _id: id } }),
  isPending: false,
});

const clinicalNoteUtils = {
  createEmptyNoteData: (patientId?: string) => ({
    patient: patientId || '',
    title: '',
    type: 'progress',
    content: { subjective: '', objective: '', assessment: '', plan: '' },
    medications: [],
    vitalSigns: {},
    laborResults: [],
    recommendations: [],
    followUpRequired: false,
    priority: 'medium',
    isConfidential: false,
    tags: [],
  }),
};

const ClinicalNotesErrorBoundary = ({ children, context }: any) => <>{children}</>;

// Validation functions
const validateForm = (data: ClinicalNoteFormData) => {
  const errors: any = {};
  if (!data.patient) {
    errors.patient = { message: 'Patient is required' };
  }
  if (!data.title || data.title.trim().length < 3) {
    errors.title = {
      message: 'Title is required and must be at least 3 characters',
    };
  }
  if (!data.type) {
    errors.type = { message: 'Note type is required' };
  }
  // Check if at least one content section is filled
  const hasContent =
    data.content &&
    (data.content.subjective?.trim() ||
      data.content.objective?.trim() ||
      data.content.assessment?.trim() ||
      data.content.plan?.trim());
  if (!hasContent) {
    errors.content = { message: 'At least one content section is required' };
  }
  if (data.followUpRequired && !data.followUpDate) {
    errors.followUpDate = {
      message:
        'Follow-up date is required when follow-up is marked as required',
    };
  }
  return errors;
};

interface ClinicalNoteFormProps {
  noteId?: string;
  patientId?: string;
  onSave?: (note: any) => void;
  onCancel?: () => void;
  readonly?: boolean;
}

interface FormSection {
  id: string;
  title: string;
  expanded: boolean;
}

const ClinicalNoteForm: React.FC<ClinicalNoteFormProps> = ({
  noteId: propNoteId,
  patientId: propPatientId,
  onSave,
  onCancel,
  readonly = false,
}) => {
  // Get URL parameters
  const { id: routeNoteId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Determine actual noteId and patientId from props or URL
  const noteId = propNoteId || routeNoteId;
  const patientId = propPatientId || searchParams.get('patientId') || undefined;
  const isEditMode = !!noteId;

  // State management
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Enhanced error handling and validation
  useClinicalNotesErrorHandling();
  useDuplicateSubmissionPrevention();
  useFormValidationFeedback();

  const [sections, setSections] = useState<FormSection[]>([
    { id: 'basic', title: 'Basic Information', expanded: true },
    { id: 'soap', title: 'SOAP Note Content', expanded: true },
    { id: 'vitals', title: 'Vital Signs', expanded: false },
    { id: 'labs', title: 'Lab Results', expanded: false },
    { id: 'attachments', title: 'Attachments', expanded: false },
    { id: 'additional', title: 'Additional Information', expanded: false },
  ]);

  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Queries and mutations
  const { data: existingNote, isLoading: noteLoading } = useClinicalNote(
    noteId || '',
    { enabled: !!noteId }
  );

  // Form setup - must be declared before using watch
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
    reset,
    setError,
    clearErrors,
  } = useForm<ClinicalNoteFormData>({
    defaultValues: clinicalNoteUtils.createEmptyNoteData(patientId),
    mode: 'onChange',
  });

  // Custom validation
  const [isValid, setIsValid] = useState(false);

  // Watch form values for auto-save
  const watchedValues = watch();
  const followUpRequired = watch('followUpRequired');

  // Load all patients initially, then filter by search query
  // Use a stable empty object to prevent unnecessary re-renders
  const emptyFilters = useMemo(() => ({}), []);
  const { data: allPatientsData, isLoading: allPatientsLoading } =
    usePatients(emptyFilters);
  const { data: patientSearchResults, isLoading: searchLoading } =
    useSearchPatients(debouncedSearchQuery);
  const patientsLoading = debouncedSearchQuery
    ? searchLoading
    : allPatientsLoading;

  const createNoteMutation = useCreateClinicalNote();
  const updateNoteMutation = useUpdateClinicalNote();

  // Store previous validation errors to prevent unnecessary updates
  const previousValidationErrors = useRef<unknown>({});

  // Validate form on change - use a more stable approach to prevent infinite loops
  const validateFormData = useCallback(() => {
    const formData = getValues();
    const validationErrors = validateForm(formData);
    const hasErrors = Object.keys(validationErrors).length > 0;
    setIsValid(!hasErrors);
    // Check if errors have actually changed by comparing with previous errors
    const currentErrorKeys = Object.keys(previousValidationErrors.current as any);
    const newErrorKeys = Object.keys(validationErrors);
    const errorsChanged =
      currentErrorKeys.length !== newErrorKeys.length ||
      currentErrorKeys.some((key) => !validationErrors[key]) ||
      newErrorKeys.some((key) => {
        const prevError = (previousValidationErrors.current as any)[key];
        const newError = validationErrors[key];
        return !prevError || prevError.message !== newError?.message;
      });
    if (errorsChanged) {
      // Store current errors for next comparison
      previousValidationErrors.current = { ...validationErrors };
      // Clear existing errors
      clearErrors();
      // Set new errors
      Object.entries(validationErrors).forEach(
        ([field, error]: [string, any]) => {
          setError(field as any, error);
        }
      );
    }
  }, [getValues, setError, clearErrors]);

  // Debounced validation to prevent excessive calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateFormData();
    }, 100); // Small delay to debounce validation
    return () => clearTimeout(timeoutId);
  }, [watchedValues, validateFormData]);

  // Debounce patient search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(patientSearchQuery);
    }, 300); // 300ms delay for search
    return () => clearTimeout(timeoutId);
  }, [patientSearchQuery]);

  // Field arrays for dynamic content
  useFieldArray({
    control,
    name: 'laborResults',
  });

  useFieldArray({
    control,
    name: 'recommendations',
  });

  useFieldArray({
    control,
    name: 'tags',
  });

  // Load existing note data
  useEffect(() => {
    if (existingNote?.note) {
      const note = existingNote.note;
      reset({
        patient: note.patient._id,
        title: note.title,
        type: note.type,
        content: note.content,
        medications: note.medications || [],
        vitalSigns: note.vitalSigns,
        laborResults: note.laborResults || [],
        recommendations: note.recommendations || [],
        followUpRequired: note.followUpRequired,
        followUpDate: note.followUpDate
          ? new Date(note.followUpDate).toISOString()
          : undefined,
        priority: note.priority,
        isConfidential: note.isConfidential,
        tags: note.tags || [],
      });
    }
  }, [existingNote, reset]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !isDirty || !isValid || readonly) return;
    try {
      const formData = getValues();
      if (noteId) {
        await updateNoteMutation.mutateAsync({ id: noteId, data: formData });
      } else {
        // For new notes, we might want to save as draft
        // This would require backend support for draft notes
      }
      setLastSaved(new Date());
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [
    autoSaveEnabled,
    isDirty,
    isValid,
    readonly,
    noteId,
    getValues,
    updateNoteMutation,
  ]);

  // Auto-save timer - use isDirty instead of watchedValues to prevent excessive re-renders
  useEffect(() => {
    if (!autoSaveEnabled || readonly || !isDirty) return;
    const timer = setTimeout(() => {
      autoSave();
    }, 30000); // Auto-save every 30 seconds
    return () => clearTimeout(timer);
  }, [isDirty, autoSave, autoSaveEnabled, readonly]);

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(isDirty);
  }, [isDirty]);

  // Handle form submission
  const onSubmit = async (data: ClinicalNoteFormData) => {
    try {
      console.log('Form submission data:', data);
      console.log('Patient ID:', data.patient);
      console.log('Available patients:', patients);
      let result;
      if (noteId) {
        result = await updateNoteMutation.mutateAsync({ id: noteId, data });
      } else {
        result = await createNoteMutation.mutateAsync(data);
        // Upload attachments for new notes
        if (result.note && attachments.length > 0) {
          const filesToUpload = attachments
            .filter((att) => att.file && att.uploadStatus === 'pending')
            .map((att) => att.file!);
          if (filesToUpload.length > 0) {
            try {
              await clinicalNoteService.uploadAttachment(
                result.note._id,
                filesToUpload
              );
            } catch (uploadError) {
              console.error('Failed to upload attachments:', uploadError);
              setAttachmentError(
                'Some attachments failed to upload. You can try uploading them again.'
              );
            }
          }
        }
      }
      setLastSaved(new Date());
      setUnsavedChanges(false);
      if (onSave) {
        onSave(result.note);
      } else {
        // Default navigation behavior
        if (patientId) {
          // Navigate back to patient profile if created from patient context
          navigate(`/patients/${patientId}`);
        } else {
          // Navigate to notes dashboard
          navigate('/notes');
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (unsavedChanges && !readonly) {
      setShowUnsavedDialog(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        // Default navigation behavior
        if (patientId) {
          navigate(`/patients/${patientId}`);
        } else {
          navigate('/notes');
        }
      }
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  // Get patients for autocomplete - optimize to prevent unnecessary re-renders
  const patients = useMemo(() => {
    // If we have search results and a search query, use search results
    if (debouncedSearchQuery && patientSearchResults?.data?.results) {
      return patientSearchResults.data.results;
    }
    // Otherwise use all patients data
    const allPatients = allPatientsData?.data?.results || [];
    return allPatients;
  }, [
    debouncedSearchQuery,
    patientSearchResults?.data?.results,
    allPatientsData?.data?.results,
  ]);

  // Loading state
  if (noteLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Edit Clinical Note' : 'Create Clinical Note'}
            </h1>
            {patientId && (
              <p className="text-gray-600 text-sm">
                Creating note for patient context
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Back button */}
            <IconButton onClick={handleCancel} className="">
              <ArrowLeft />
            </IconButton>
            {/* Auto-save indicator */}
            {!readonly && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <Switch
                    checked={autoSaveEnabled}
                    onCheckedChange={(checked) => setAutoSaveEnabled(checked)}
                  />
                  <span className="ml-2 text-sm">Auto-save</span>
                </div>
                {lastSaved && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Clock className="h-4 w-4 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{`Last saved: ${lastSaved.toLocaleTimeString()}`}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
            {/* Action buttons */}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            {!readonly && (
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  createNoteMutation.isPending ||
                  updateNoteMutation.isPending
                }
              >
                {createNoteMutation.isPending || updateNoteMutation.isPending
                  ? 'Saving...'
                  : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Unsaved changes warning */}
        {unsavedChanges && !readonly && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2">
              <WarningIcon className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. They will be lost if you navigate away.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Form sections */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {sections.find((s) => s.id === 'basic')?.title}
                </h3>
                <IconButton
                  onClick={() => toggleSection('basic')}
                  className="p-1"
                >
                  {sections.find((s) => s.id === 'basic')?.expanded ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </IconButton>
              </div>
              <Collapse in={sections.find((s) => s.id === 'basic')?.expanded}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Selection */}
                  <div className="md:col-span-2">
                    <Controller
                      name="patient"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Patient *</Label>
                          <Autocomplete
                            {...field}
                            options={patients}
                            getOptionLabel={(option: any) =>
                              typeof option === 'string'
                                ? option
                                : `${option.firstName} ${option.lastName} (${option.mrn})`
                            }
                            value={
                              patients.find(
                                (p: any) => p._id === field.value
                              ) || null
                            }
                            onChange={(_event: any, value: any) => {
                              field.onChange(value?._id || '');
                              // Clear search query when a patient is selected to prevent continuous searching
                              if (value) {
                                setPatientSearchQuery('');
                              }
                            }}
                            onInputChange={(_event: any, value: string, reason: string) => {
                              // Only set search query when user is typing, not when selecting
                              if (reason === 'input') {
                                setPatientSearchQuery(value);
                              }
                            }}
                            loading={patientsLoading}
                            disabled={readonly}
                            renderInput={(params: any) => (
                              <div>
                                <Input
                                  {...params}
                                  placeholder="Search patients..."
                                  className={errors.patient ? 'border-red-500' : ''}
                                />
                                {errors.patient && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors.patient.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      )}
                    />
                  </div>

                  {/* Note Title */}
                  <div>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Note Title *</Label>
                          <Input
                            {...field}
                            className={errors.title ? 'border-red-500' : ''}
                            disabled={readonly}
                          />
                          {errors.title && (
                            <p className="text-sm text-red-500">
                              {errors.title.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  {/* Note Type */}
                  <div>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Note Type *</Label>
                          <Select
                            {...field}
                            disabled={readonly}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select note type" />
                            </SelectTrigger>
                            <SelectContent>
                              {NOTE_TYPES.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.type && (
                            <p className="text-sm text-red-500">
                              {errors.type.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            {...field}
                            disabled={readonly}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {NOTE_PRIORITIES.map((priority) => (
                                <SelectItem
                                  key={priority.value}
                                  value={priority.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: priority.color }}
                                    />
                                    {priority.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                  </div>

                  {/* Confidential */}
                  <div>
                    <Controller
                      name="isConfidential"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            disabled={readonly}
                            onCheckedChange={field.onChange}
                          />
                          <Label>Confidential Note</Label>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </Collapse>
            </CardContent>
          </Card>

          {/* SOAP Content Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">SOAP Note Content</h3>
                <IconButton
                  onClick={() => toggleSection('soap')}
                  className="p-1"
                >
                  {sections.find((s) => s.id === 'soap')?.expanded ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </IconButton>
              </div>
              <Collapse in={sections.find((s) => s.id === 'soap')?.expanded}>
                {errors.content && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">
                      {errors.content.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subjective */}
                  <div>
                    <Label className="mb-2 block">Subjective</Label>
                    <Controller
                      name="content.subjective"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="Patient's subjective complaints, symptoms, and history..."
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={readonly}
                        />
                      )}
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <Label className="mb-2 block">Objective</Label>
                    <Controller
                      name="content.objective"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="Observable findings, vital signs, physical examination..."
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={readonly}
                        />
                      )}
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <Label className="mb-2 block">Assessment</Label>
                    <Controller
                      name="content.assessment"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="Clinical assessment, diagnosis, and professional judgment..."
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={readonly}
                        />
                      )}
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <Label className="mb-2 block">Plan</Label>
                    <Controller
                      name="content.plan"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="Treatment plan, interventions, and follow-up instructions..."
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={readonly}
                        />
                      )}
                    />
                  </div>
                </div>
              </Collapse>
            </CardContent>
          </Card>

          {/* Follow-up Section */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <Controller
                    name="followUpRequired"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          disabled={readonly}
                          onCheckedChange={field.onChange}
                        />
                        <Label>Follow-up Required</Label>
                      </div>
                    )}
                  />
                </div>
                {followUpRequired && (
                  <div>
                    <Controller
                      name="followUpDate"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          label="Follow-up Date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date: any) =>
                            field.onChange(date?.toISOString())
                          }
                          disabled={readonly}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.followUpDate,
                              helperText: errors.followUpDate?.message,
                            },
                          }}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {sections.find((s) => s.id === 'attachments')?.title}
                </h3>
                <IconButton
                  onClick={() => toggleSection('attachments')}
                  className="p-1"
                >
                  {sections.find((s) => s.id === 'attachments')?.expanded ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </IconButton>
              </div>
              <Collapse
                in={sections.find((s) => s.id === 'attachments')?.expanded}
              >
                {attachmentError && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">
                      {attachmentError}
                    </AlertDescription>
                  </Alert>
                )}
                <NoteFileUpload
                  onAttachmentDeleted={(attachmentId: string) => {
                    // Handle attachment deletion
                    if (existingNote?.note?.attachments) {
                      const updatedAttachments =
                        existingNote.note.attachments.filter(
                          (att: any) => att._id !== attachmentId
                        );
                      // Trigger a refetch or update the note
                    }
                  }}
                  onFilesUploaded={() => {
                    // Handle file upload completion
                    console.log('Files uploaded successfully');
                  }}
                  existingAttachments={existingNote?.note?.attachments || []}
                  noteId={noteId}
                  maxFiles={5}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                  disabled={readonly}
                  showPreview={true}
                />
              </Collapse>
            </CardContent>
          </Card>
        </div>

        {/* Unsaved Changes Dialog */}
        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                You have unsaved changes. Are you sure you want to leave without
                saving?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
                Continue Editing
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  handleCancel();
                }}
              >
                Discard Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </TooltipProvider>
  );
};

// Wrap with error boundary and enhanced validation
const ClinicalNoteFormWithErrorBoundary: React.FC<ClinicalNoteFormProps> = (
  props
) => {
  return (
    <ClinicalNotesErrorBoundary context="clinical-note-form">
      <ClinicalNoteForm {...props} />
    </ClinicalNotesErrorBoundary>
  );
};

export default ClinicalNoteFormWithErrorBoundary;
