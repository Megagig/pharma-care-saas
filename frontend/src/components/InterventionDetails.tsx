import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  ClipboardList,
  Users,
  TrendingUp,
  CheckCircle,
  Circle,
} from 'lucide-react';

// Mock data and hooks, assuming they are defined elsewhere
const useClinicalInterventionStore = () => ({
  selectedIntervention: null,
  setShowDetailsModal: () => {},
});
const useClinicalIntervention = (id: string, opts: any) => ({
  data: null,
  isLoading: true,
  error: null,
});
const useUpdateIntervention = () => ({ mutateAsync: async (data: any) => {} });
const useDeleteIntervention = () => ({ mutateAsync: async (id: string) => {} });

interface ClinicalIntervention {
  _id: string;
  interventionNumber: string;
  category: keyof typeof INTERVENTION_CATEGORIES;
  priority: keyof typeof PRIORITY_LEVELS;
  status: keyof typeof STATUS_LABELS;
  createdAt: string;
  identifiedByUser: { firstName: string; lastName: string };
  patient: { _id: string; firstName: string; lastName: string; dateOfBirth: string; phoneNumber: string; email: string };
  issueDescription: string;
  identifiedDate: string;
  estimatedDuration?: number;
  strategies: any[];
  assignments: any[];
  outcomes: any;
  followUp: any;
}

interface InterventionDetailsProps {
  interventionId?: string;
  intervention?: ClinicalIntervention;
  open: boolean;
  onClose: () => void;
  onEdit?: (intervention: ClinicalIntervention) => void;
  onDelete?: (intervention: ClinicalIntervention) => void;
  mode?: 'modal' | 'page';
}

const INTERVENTION_CATEGORIES = {
  drug_therapy_problem: { label: 'Drug Therapy Problem', color: 'bg-red-500' },
  adverse_drug_reaction: { label: 'Adverse Drug Reaction', color: 'bg-orange-500' },
  medication_nonadherence: { label: 'Medication Non-adherence', color: 'bg-blue-500' },
  drug_interaction: { label: 'Drug Interaction', color: 'bg-purple-500' },
  dosing_issue: { label: 'Dosing Issue', color: 'bg-green-500' },
  contraindication: { label: 'Contraindication', color: 'bg-pink-500' },
  other: { label: 'Other', color: 'bg-gray-500' },
} as const;

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: 'bg-green-500' },
  medium: { label: 'Medium', color: 'bg-orange-500' },
  high: { label: 'High', color: 'bg-red-500' },
  critical: { label: 'Critical', color: 'bg-red-700' },
} as const;

const STATUS_LABELS = {
  identified: { label: 'Identified', step: 0 },
  planning: { label: 'Planning', step: 1 },
  in_progress: { label: 'In Progress', step: 2 },
  implemented: { label: 'Implemented', step: 3 },
  completed: { label: 'Completed', step: 4 },
  cancelled: { label: 'Cancelled', step: -1 },
} as const;

const WORKFLOW_STEPS = [
  { label: 'Issue Identified', description: 'Clinical issue documented' },
  { label: 'Strategy Planning', description: 'Intervention strategies defined' },
  { label: 'Implementation', description: 'Intervention being executed' },
  { label: 'Monitoring', description: 'Tracking patient response' },
  { label: 'Completed', description: 'Intervention successfully completed' },
];

const InterventionDetails: React.FC<InterventionDetailsProps> = ({ 
  interventionId,
  intervention: propIntervention,
  open,
  onClose,
  onEdit,
  onDelete,
  mode = 'modal'
}) => {
  const [editMode, setEditMode] = useState(false);
  const { selectedIntervention, setShowDetailsModal } = useClinicalInterventionStore();

  const targetInterventionId = interventionId || propIntervention?._id || selectedIntervention?._id;
  const targetIntervention = propIntervention || selectedIntervention;

  const { data: interventionResponse, isLoading, error } = useClinicalIntervention(targetInterventionId || '', { enabled: !!targetInterventionId && !targetIntervention });
  const updateMutation = useUpdateIntervention();
  const deleteMutation = useDeleteIntervention();

  const intervention = targetIntervention || interventionResponse?.data;

  const handleClose = () => {
    if (mode === 'modal') {
      setShowDetailsModal(false);
    }
    onClose();
  };

  const handleEdit = () => {
    if (intervention) {
      onEdit?.(intervention);
      setEditMode(true);
    }
  };

  const handleDelete = async () => {
    if (!intervention) return;
    if (window.confirm(`Are you sure you want to delete intervention ${intervention.interventionNumber}?`)) {
      try {
        await deleteMutation.mutateAsync(intervention._id);
        onDelete?.(intervention);
        handleClose();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const renderHeader = () => {
    if (!intervention) return null;
    return (
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{intervention.interventionNumber}</h2>
            <div className="flex gap-2 mt-2">
              <Badge className={INTERVENTION_CATEGORIES[intervention.category]?.color}>{INTERVENTION_CATEGORIES[intervention.category]?.label}</Badge>
              <Badge className={PRIORITY_LEVELS[intervention.priority]?.color}>{PRIORITY_LEVELS[intervention.priority]?.label}</Badge>
              <Badge>{STATUS_LABELS[intervention.status]?.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Created on {new Date(intervention.createdAt).toLocaleDateString()} by {intervention.identifiedByUser?.firstName} {intervention.identifiedByUser?.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}><Edit className="h-4 w-4 mr-2" />Edit</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
            {mode === 'modal' && <Button variant="ghost" size="icon" onClick={handleClose}><X className="h-4 w-4" /></Button>}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="p-4 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
    }
    if (error || !intervention) {
      return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load intervention details. Please try again.</AlertDescription></Alert>;
    }

    return (
      <div className="p-4 space-y-4">
        {renderHeader()}
        <Accordion type="single" collapsible defaultValue="overview">
          <AccordionItem value="overview">
            <AccordionTrigger>Overview</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Patient Info */}
              <Card>
                <CardHeader><CardTitle className="flex items-center"><User className="h-5 w-5 mr-2" />Patient Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar><AvatarFallback>{intervention.patient.firstName[0]}{intervention.patient.lastName[0]}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold">{intervention.patient.firstName} {intervention.patient.lastName}</p>
                      <p className="text-sm text-muted-foreground">DOB: {new Date(intervention.patient.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{intervention.patient.phoneNumber || 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{intervention.patient.email || 'N/A'}</span></div>
                  </div>
                </CardContent>
              </Card>
              {/* Issue Description */}
              <Card>
                <CardHeader><CardTitle className="flex items-center"><ClipboardList className="h-5 w-5 mr-2" />Clinical Issue</CardTitle></CardHeader>
                <CardContent>
                  <p>{intervention.issueDescription}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Identified: {new Date(intervention.identifiedDate).toLocaleDateString()}</span></div>
                    {intervention.estimatedDuration && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Est. Duration: {intervention.estimatedDuration} mins</span></div>}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          {/* ... other accordion items ... */}
        </Accordion>
      </div>
    );
  };

  if (mode === 'page') {
    return <div className="container mx-auto py-8">{renderContent()}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default InterventionDetails;