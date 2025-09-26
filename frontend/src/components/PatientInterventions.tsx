import { Button, Input, Card, CardContent, Tooltip, Spinner, Alert } from '@/components/ui/button';
// Patient search interface for consistent typing
interface PatientSearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  mrn?: string;
}
const PatientInterventions: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  // State
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  // API queries
  const { data: patientSearchResults, isLoading: searchingPatients } =
    useSearchPatients(patientSearchQuery);
  const {
    data: interventionsResponse,
    isLoading,
    error,
    refetch,
  } = usePatientInterventions(selectedPatient?._id || '');
  const interventions = useMemo(() => {
    return interventionsResponse?.data || [];
  }, [interventionsResponse]);
  // Extract patients from search results with proper error handling
  const patients: PatientSearchResult[] = React.useMemo(() => {
    try {
      const results = patientSearchResults?.data?.results || [];
      return results.map((patient: any) => ({ 
        _id: patient._id,
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth || patient.dob || '',
        mrn: patient.mrn || ''}
      }));
    } catch (error) {
      console.error('Error processing patient search results:', error);
      return [];
    }
  }, [patientSearchResults]);
  // Statistics
  const stats = useMemo(() => {
    if (!interventions.length) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        highPriority: 0,
      };
    }
    return {
      total: interventions.length,
      active: interventions.filter((i: ClinicalIntervention) =>
        ['identified', 'planning', 'in_progress', 'implemented'].includes(
          i.status
        )
      ).length,
      completed: interventions.filter(
        (i: ClinicalIntervention) => i.status === 'completed'
      ).length,
      highPriority: interventions.filter((i: ClinicalIntervention) =>
        ['high', 'critical'].includes(i.priority)
      ).length,
    };
  }, [interventions]);
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'implemented':
        return 'primary';
      case 'planning':
        return 'warning';
      case 'identified':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'in_progress':
        return <ScheduleIcon />;
      case 'implemented':
        return <CheckCircleIcon />;
      case 'planning':
        return <ScheduleIcon />;
      case 'identified':
        return <WarningIcon />;
      case 'cancelled':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };
  return (
    <div>
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div  component="h2">
          Patient Interventions
        </div>
        {selectedPatient && (
          <Button
            
            startIcon={<AddIcon />}
            onClick={() =>
              navigate(}
                `/pharmacy/clinical-interventions/create?patientId=${selectedPatient._id}`
              )
            }
          >
            Create New Intervention
          </Button>
        )}
      </div>
      {/* Patient Selection */}
      <Card className="">
        <CardContent>
          <div  gutterBottom>
            Select Patient
          </div>
          <Autocomplete
            options={patients}
            loading={searchingPatients}
            getOptionLabel={(option) => {}
              const name = `${option.firstName} ${option.lastName}`.trim();
              const mrn = option.mrn ? ` (MRN: ${option.mrn})` : '';
              const dob = option.dateOfBirth
                ? ` - DOB: ${option.dateOfBirth}`
                : '';
              return `${name}${mrn}${dob}`;
            value={selectedPatient}
            onChange={(_, value) => {
              setSelectedPatient(value);
              if (value) {
                navigate(}
                  `/pharmacy/clinical-interventions/patients/${value._id}`
                );
              } else {
                navigate('/pharmacy/clinical-interventions/patients');
              }
            renderInput={(params) => (
              <Input}
                {...params}
                placeholder="Search patients by name or MRN..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon color="action" className="" />,
                  endAdornment: (
                    <>{searchingPatients ? (}
                        <Spinner color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
              />
            )}
            renderOption={(props, option) => (}
              <div component="li" {...props}>
                <PersonIcon className="" />
                <div>
                  <div >
                    {option.firstName} {option.lastName}
                  </div>
                  <div  color="text.secondary">
                    {option.mrn && `MRN: ${option.mrn}`}
                    {option.mrn && option.dateOfBirth && ' • '}
                    {option.dateOfBirth && `DOB: ${option.dateOfBirth}`}
                  </div>
                </div>
              </div>
            )}
            noOptionsText={
              patientSearchQuery.length < 2
                ? 'Type at least 2 characters to search patients'
                : searchingPatients
                ? 'Searching patients...'
                : 'No patients found'}
            }
            filterOptions={(x) => x} // Disable client-side filtering since we're using server-side search
          />
        </CardContent>
      </Card>
      {/* Patient Information & Statistics */}
      {selectedPatient && (
        <>
          <div container spacing={3} className="">
            {/* Patient Info */}
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Patient Information
                  </div>
                  <div display="flex" alignItems="center" gap={2}>
                    <PersonIcon color="primary" className="" />
                    <div>
                      <div >
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      {selectedPatient.mrn && (
                        <div  color="text.secondary">
                          MRN: {selectedPatient.mrn}
                        </div>
                      )}
                      {selectedPatient.dateOfBirth && (
                        <>
                          <div  color="text.secondary">
                            Date of Birth:{' '}
                            {format(
                              parseISO(selectedPatient.dateOfBirth),
                              'MMM dd, yyyy'
                            )}
                          </div>
                          <div  color="text.secondary">
                            Age:{' '}
                            {new Date().getFullYear() -
                              new Date(
                                selectedPatient.dateOfBirth
                              ).getFullYear()}{' '}
                            years
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Statistics */}
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Intervention Statistics
                  </div>
                  <div container spacing={2}>
                    <div item xs={6}>
                      <div textAlign="center">
                        <div  color="primary">
                          {stats.total}
                        </div>
                        <div  color="text.secondary">
                          Total Interventions
                        </div>
                      </div>
                    </div>
                    <div item xs={6}>
                      <div textAlign="center">
                        <div  color="info.main">
                          {stats.active}
                        </div>
                        <div  color="text.secondary">
                          Active
                        </div>
                      </div>
                    </div>
                    <div item xs={6}>
                      <div textAlign="center">
                        <div  color="success.main">
                          {stats.completed}
                        </div>
                        <div  color="text.secondary">
                          Completed
                        </div>
                      </div>
                    </div>
                    <div item xs={6}>
                      <div textAlign="center">
                        <div  color="warning.main">
                          {stats.highPriority}
                        </div>
                        <div  color="text.secondary">
                          High Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Interventions List */}
          <Card>
            <CardContent>
              <div  gutterBottom>
                Clinical Interventions
              </div>
              {isLoading ? (
                <div display="flex" justifyContent="center" py={4}>
                  <Spinner />
                </div>
              ) : error ? (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"}
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  }
                >
                  Error loading interventions: {error.message}
                </Alert>
              ) : interventions.length > 0 ? (
                <TableContainer  >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Intervention #</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Identified Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {interventions.map(
                        (intervention: ClinicalIntervention) => (
                          <TableRow key={intervention._id} hover>
                            <TableCell>
                              <div  fontWeight="medium">
                                {intervention.interventionNumber}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={intervention.category
                                  .replace(/_/g, ' ')}
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                size="small"
                                
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={intervention.priority.toUpperCase()}
                                size="small"
                                color={
                                  getPriorityColor(intervention.priority) as any}
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(intervention.status)}
                                label={intervention.status
                                  .replace(/_/g, ' ')}
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                size="small"
                                color={
                                  getStatusColor(intervention.status) as unknown}
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div >
                                {format(
                                  parseISO(intervention.identifiedDate),
                                  'MMM dd, yyyy'
                                )}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {format(
                                  parseISO(intervention.identifiedDate),
                                  'HH:mm'
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div display="flex" gap={0.5}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      navigate(}
                                        `/pharmacy/clinical-interventions/details/${intervention._id}`
                                      )
                                    }
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      navigate(}
                                        `/pharmacy/clinical-interventions/edit/${intervention._id}`
                                      )
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No clinical interventions found for this patient.
                  <Button
                    
                    startIcon={<AddIcon />}
                    onClick={() =>
                      navigate(}
                        `/pharmacy/clinical-interventions/create?patientId=${selectedPatient._id}`
                      )
                    }
                    className=""
                  >
                    Create First Intervention
                  </Button>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {/* No Patient Selected */}
      {!selectedPatient && (
        <Card>
          <CardContent className="">
            <PersonIcon className="" />
            <div  gutterBottom>
              Select a Patient
            </div>
            <div  color="text.secondary" paragraph>
              Choose a patient from the dropdown above to view their clinical
              interventions.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default PatientInterventions;
