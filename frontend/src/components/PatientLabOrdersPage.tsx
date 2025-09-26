
import OrderHistory from './OrderHistory';
const PatientLabOrdersPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  // Fetch patient data for breadcrumbs and header
  const { data: patientResponse, isLoading: patientLoading } = usePatient(
    patientId!
  );
  const patientData = extractData(patientResponse)?.patient;
  const handleCreateOrder = () => {
    navigate(`/patients/${patientId}/lab-orders/create`);
  };
  const handleViewOrder = (orderId: string) => {
    navigate(`/lab-orders/${orderId}`);
  };
  const handleViewResults = (orderId: string) => {
    navigate(`/lab-orders/${orderId}/results`);
  };
  return (
    <div className="">
      {/* Header with Breadcrumbs */}
      <div className="">
        <div className="">
          <IconButton onClick={() => navigate(`/patients/${patientId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <div  className="">
            Lab Orders
          </div>
        </div>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            className=""
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <HomeIcon className="" fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            className=""
            color="inherit"
            onClick={() => navigate('/patients')}
          >
            <PersonIcon className="" fontSize="inherit" />
            Patients
          </Link>
          <Link
            underline="hover"
            className=""
            color="inherit"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            {patientLoading
              ? 'Loading...'
              : patientData
              ? `${patientData.firstName} ${patientData.lastName}`
              : 'Patient'}
          </Link>
          <div
            className=""
            color="text.primary"
          >
            <ScienceIcon className="" fontSize="inherit" />
            Lab Orders
          </div>
        </Breadcrumbs>
        {/* Patient Info */}
        {patientData && (
          <div className="">
            <div  gutterBottom>
              {patientData.firstName} {patientData.lastName}
            </div>
            <div  color="text.secondary">
              MRN: {patientData.mrn} •
              {patientData.age && ` Age: ${patientData.age} •`}
              {patientData.gender && ` Gender: ${patientData.gender}`}
            </div>
          </div>
        )}
      </div>
      {/* Lab Orders History */}
      <OrderHistory
        patientId={patientId!}
        showCreateButton={true}
        onCreateOrder={handleCreateOrder}
        onViewOrder={handleViewOrder}
        onViewResults={handleViewResults}
        compact={false}
      />
    </div>
  );
};
export default PatientLabOrdersPage;
