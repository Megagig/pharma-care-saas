import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import {
  Building as LocalHospitalIcon,
  Filter as FilterListIcon,
  UserPlus as PersonAddIcon,
  Eye as VisibilityIcon,
  Edit as EditIcon,
  MoreVertical as MoreVertIcon,
  Trash as DeleteIcon,
  AlertTriangle as WarningIcon
} from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';

// Nigerian States for filtering
const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  displayName?: string;
  mrn: string;
  dob?: string;
  age?: number;
  calculatedAge?: number;
  gender: string;
  phone: string;
  email?: string;
  state?: string;
  lga?: string;
  bloodGroup?: string;
  genotype?: string;
  hasActiveDTP?: boolean;
  latestVitals?: {
    bpSys: number;
    bpDia: number;
    weightKg?: number;
  };
}

interface PatientSearchParams {
  page: number;
  limit: number;
  q?: string;
  state?: string;
  bloodGroup?: string;
  genotype?: string;
  mrn?: string;
  phone?: string;
}

// Mock hooks for now
const usePatients = (params: PatientSearchParams) => {
  return {
    data: {
      data: {
        results: [] as Patient[],
      },
      meta: {
        total: 0,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
  };
};

const useDeletePatient = () => {
  return {
    mutateAsync: async (_id: string) => {
      // Mock implementation
      return Promise.resolve();
    },
    isPending: false,
  };
};

const TablePagination = ({ component, count, page, onPageChange, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions, labelDisplayedRows }: any) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-700">
        Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, count)} of {count} results
      </div>
      <div className="flex items-center space-x-2">
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange({ target: { value: e.target.value } })}
          className="border rounded px-2 py-1 text-sm"
        >
          {rowsPerPageOptions.map((option: number) => (
            <option key={option} value={option}>
              {option} per page
            </option>
          ))}
        </select>
        <div className="flex space-x-1">
          <button
            onClick={() => onPageChange(null, page - 1)}
            disabled={page === 0}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(null, page + 1)}
            disabled={(page + 1) * rowsPerPage >= count}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const Patients = () => {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const isForMedications = urlParams.get('for') === 'medications';
  const isForDiagnostics = urlParams.get('for') === 'diagnostics';

  // RBAC permissions
  const { permissions } = useRBAC();

  // Search and filter state
  const [searchParams, setSearchParams] = useState<PatientSearchParams>({
    page: 1,
    limit: 10,
  });

  const [quickSearch, setQuickSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // React Query hooks
  const {
    data: patientsResponse,
    isLoading,
    isError,
    error,
  } = usePatients(searchParams);

  const deletePatientMutation = useDeletePatient();

  // Computed values
  const patients = patientsResponse?.data?.results || [];
  const totalPatients = patientsResponse?.meta?.total || 0;
  const currentPage = (searchParams.page || 1) - 1; // MUI pagination is 0-based

  // Debug logging
  console.log('Patients page data:', {
    patientsResponse,
    patients: patients.length,
    totalPatients,
    searchParams,
    isLoading,
    isError,
    error,
  });

  // Event handlers
  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    setSearchParams((prev) => ({
      ...prev,
      q: value || undefined,
      page: 1, // Reset to first page on search
    }));
  };

  const handleAdvancedFilter = (filters: Partial<PatientSearchParams>) => {
    setSearchParams((prev) => ({
      ...prev,
      ...filters,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page: newPage + 1, // Convert to 1-based pagination
    }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    setSearchParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page
    }));
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    patientId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const handleDeletePatient = async () => {
    if (selectedPatient) {
      try {
        await deletePatientMutation.mutateAsync(selectedPatient);
        handleMenuClose();
      } catch (error) {
        console.error('Failed to delete patient:', error);
      }
    }
  };

  const handleViewPatient = (patientId: string) => {
    // If we're selecting a patient for medications, navigate to the medications page
    if (isForMedications) {
      navigate(`/patients/${patientId}/medications`);
    } else if (isForDiagnostics) {
      // Navigate back to diagnostic case creation with selected patient
      navigate(`/pharmacy/diagnostics/case/new?selectedPatient=${patientId}`);
    } else {
      navigate(`/patients/${patientId}`);
    }
    handleMenuClose();
  };

  const handleEditPatient = (patientId: string) => {
    navigate(`/patients/${patientId}/edit`);
    handleMenuClose();
  };

  // Utility functions
  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const formatNigerianPhone = (phone?: string): string => {
    if (!phone) return 'N/A';
    // Format Nigerian E.164 numbers (+234XXXXXXXXXX) to readable format
    if (phone.startsWith('+234')) {
      const number = phone.slice(4);
      return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  const getDisplayName = (patient: Patient): string => {
    return patient.displayName || `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientAge = (patient: Patient): string => {
    if (patient.age !== undefined) return `${patient.age} years`;
    if (patient.calculatedAge !== undefined)
      return `${patient.calculatedAge} years`;
    const calculatedAge = calculateAge(patient.dob);
    return calculatedAge ? `${calculatedAge} years` : 'Unknown';
  };

  // Loading and error states
  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          <div>Failed to load patients</div>
          <div>
            {error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : 'An unexpected error occurred while loading patient data.'}
          </div>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Helper message for selection modes */}
      {(isForMedications || isForDiagnostics) && (
        <Alert className="mb-6">
          <LocalHospitalIcon className="h-4 w-4" />
          <div className="font-medium">Patient Selection Mode</div>
          <div>
            {isForMedications
              ? 'Select a patient from the list below to manage their medications. Click the "Select" button in the Actions column to proceed.'
              : 'Select a patient from the list below to create a diagnostic case. Click the "Select" button in the Actions column to proceed.'}
          </div>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <LocalHospitalIcon className="mr-2 h-6 w-6 text-blue-600" />
            {isForMedications
              ? 'Select a Patient for Medications'
              : isForDiagnostics
                ? 'Select a Patient for Diagnostic Case'
                : 'Patient Management'}
          </h1>
          <div className="text-gray-600 mt-1">
            {isForMedications
              ? 'Click on any patient to manage their medications'
              : isForDiagnostics
                ? 'Click on any patient to create a diagnostic case'
                : 'Comprehensive patient care and medical records management'}
            {totalPatients > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalPatients} total patients
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FilterListIcon className="mr-2 h-4 w-4" />
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </Button>
          <Button
            onClick={() => navigate('/patients/new')}
          >
            <PersonAddIcon className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Quick Search */}
          <div className="mb-4">
            <Input
              placeholder="Search patients by name, MRN, phone, or email..."
              value={quickSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuickSearch(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={searchParams.state || ''}
                  onValueChange={(value: string) => handleAdvancedFilter({ state: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={searchParams.bloodGroup || ''}
                  onValueChange={(value: string) =>
                    handleAdvancedFilter({ bloodGroup: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Blood Groups</SelectItem>
                    {BLOOD_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="genotype">Genotype</Label>
                <Select
                  value={searchParams.genotype || ''}
                  onValueChange={(value: string) =>
                    handleAdvancedFilter({ genotype: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select genotype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genotypes</SelectItem>
                    {GENOTYPES.map((genotype) => (
                      <SelectItem key={genotype} value={genotype}>
                        {genotype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mrn">MRN</Label>
                <Input
                  id="mrn"
                  value={searchParams.mrn || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAdvancedFilter({ mrn: e.target.value || undefined })}
                  placeholder="PHM-LAG-001"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={searchParams.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAdvancedFilter({ phone: e.target.value || undefined })}
                  placeholder="+234812345678"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>MRN</TableCell>
                <TableCell>Age/Gender</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Medical Info</TableCell>
                <TableCell>MTR Status</TableCell>
                <TableCell>Vitals</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: searchParams.limit || 10 }).map(
                  (_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )
              ) : patients.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <LocalHospitalIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-500 mb-2">No patients found</div>
                      <div className="text-gray-400 mb-4">
                        {quickSearch || Object.keys(searchParams).length > 2
                          ? 'Try adjusting your search or filter criteria'
                          : 'Add your first patient to get started with patient management'}
                      </div>
                      <Button
                        onClick={() => navigate('/patients/new')}
                      >
                        <PersonAddIcon className="mr-2 h-4 w-4" />
                        Add First Patient
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Patient data rows
                patients.map((patient: Patient) => (
                  <TableRow
                    key={patient._id}
                    className={isForMedications || isForDiagnostics ? "cursor-pointer bg-blue-50" : ""}
                    onClick={
                      isForMedications || isForDiagnostics
                        ? () => handleViewPatient(patient._id)
                        : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          {getInitials(patient.firstName, patient.lastName)}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getDisplayName(patient)}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {patient.otherNames && `(${patient.otherNames})`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        {patient.mrn}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getPatientAge(patient)}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {patient.gender
                          ? patient.gender.charAt(0).toUpperCase() +
                          patient.gender.slice(1)
                          : 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {formatNigerianPhone(patient.phone)}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {patient.email || 'No email'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {patient.state || 'Unknown'}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {patient.lga || 'Unknown LGA'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {patient.bloodGroup && (
                          <Badge variant="secondary">
                            {patient.bloodGroup}
                          </Badge>
                        )}
                        {patient.genotype && (
                          <Badge variant={
                            patient.genotype.includes('S')
                              ? "destructive"
                              : "default"
                          }>
                            {patient.genotype}
                          </Badge>
                        )}
                        {patient.hasActiveDTP && (
                          <Badge variant="destructive" className="flex items-center">
                            <WarningIcon className="h-3 w-3 mr-1" />
                            DTP
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Temporarily disabled to prevent excessive API calls */}
                      <Badge variant="outline">
                        MTR Available
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {patient.latestVitals ? (
                        <div>
                          <div className="text-gray-500 text-sm">
                            BP: {patient.latestVitals.bpSys}/
                            {patient.latestVitals.bpDia} mmHg
                          </div>
                          {patient.latestVitals.weightKg && (
                            <div className="text-gray-500 text-sm">
                              Weight: {patient.latestVitals.weightKg}kg
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          No vitals recorded
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {/* Check if we're in selection mode */}
                        {isForMedications || isForDiagnostics ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewPatient(patient._id)}
                          >
                            <LocalHospitalIcon className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewPatient(patient._id)}
                                >
                                  <VisibilityIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPatient(patient._id)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Patient</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleMenuClick(e, patient._id)}
                              >
                                <MoreVertIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>More Actions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t">
          <TablePagination
            component="div"
            count={totalPatients}
            page={currentPage}
            onPageChange={handlePageChange}
            rowsPerPage={searchParams.limit || 10}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        </div>
      </Card>

      {/* Action Menu */}
      {anchorEl && (
        <div className="absolute bg-white shadow-lg rounded-md z-10 min-w-[180px]">
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={() => selectedPatient && handleViewPatient(selectedPatient)}
          >
            <VisibilityIcon className="mr-2 h-4 w-4" />
            View Patient Profile
          </div>
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={() => selectedPatient && handleEditPatient(selectedPatient)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Patient Info
          </div>
          {permissions.canDelete && (
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-red-600"
              onClick={handleDeletePatient}
            >
              {deletePatientMutation.isPending ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <DeleteIcon className="mr-2 h-4 w-4" />
              )}
              Delete Patient
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Patients;
