
import PatientMedicationsPage from './medications/PatientMedicationsPage';

interface MedicationManagementProps {
  patientId: string;
}
const MedicationManagement: React.FC<MedicationManagementProps> = ({ 
  patientId
}) => {
  return (
    <div>
      <PatientMedicationsPage patientId={patientId} />
    </div>
  );
};
export default MedicationManagement;
