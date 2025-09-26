
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/button';

interface ClinicalNotesTableProps {
  data: ClinicalNote[];
  loading?: boolean;
  onRowClick?: (note: ClinicalNote) => void;
  onViewNote?: (note: ClinicalNote) => void;
  onEditNote?: (note: ClinicalNote) => void;
  onDeleteNote?: (note: ClinicalNote) => void;
  selectedNotes?: string[];
  onSelectionChange?: (selectedNotes: ClinicalNote[]) => void;
  enableRowSelection?: boolean;
}

// Helper functions
const formatPatientName = (patient: any) => {
  if (!patient) return 'Unknown Patient';
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
};

const formatPharmacistName = (pharmacist: any) => {
  if (!pharmacist) return 'Unassigned';
  return `${pharmacist.firstName || ''} ${pharmacist.lastName || ''}`.trim() || 'Unassigned';
};

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

// Type chip component
const TypeChip: React.FC<{ type: string }> = ({ type }) => {
  const typeConfig = NOTE_TYPES.find(t => t.value === type);
  const color = typeConfig?.color || 'default';
  
  return (
    <Badge variant={color === 'primary' ? 'default' : 'secondary'}>
      {typeConfig?.label || type}
    </Badge>
  );
};

// Priority chip component
const PriorityChip: React.FC<{ priority: string }> = ({ priority }) => {
  const priorityConfig = NOTE_PRIORITIES.find(p => p.value === priority);
  const variant = priority === 'high' ? 'destructive' : 
                 priority === 'medium' ? 'default' : 'secondary';
  
  return (
    <Badge variant={variant}>
      {priorityConfig?.label || priority}
    </Badge>
  );
};

export const ClinicalNotesTable: React.FC<ClinicalNotesTableProps> = ({ 
  data,
  loading = false,
  onRowClick,
  onViewNote,
  onEditNote,
  onDeleteNote,
  selectedNotes = [],
  onSelectionChange,
  enableRowSelection = false
}) => {
  const columns: ColumnDef<ClinicalNote>[] = [
    {
      accessorKey: 'title',
      header: createSortableHeader('Title'),
      cell: ({ row }) => {
        const note = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm line-clamp-2">
              {note.title}
            </div>
            {note.isConfidential && (
              <Badge  className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Confidential
              </Badge>
            )}
          </div>
        );
      },
      minSize: 200,
    },
    {
      accessorKey: 'patient',
      header: createSortableHeader('Patient'),
      cell: ({ row }) => {
        const patient = row.original.patient;
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm">
              {formatPatientName(patient)}
            </div>
            <div className="text-xs text-muted-foreground">
              MRN: {patient?.mrn || 'N/A'}
            </div>
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: 'type',
      header: createSortableHeader('Type'),
      cell: ({ row }) => <TypeChip type={row.original.type} />,
      size: 150,
    },
    {
      accessorKey: 'priority',
      header: createSortableHeader('Priority'),
      cell: ({ row }) => <PriorityChip priority={row.original.priority} />,
      size: 100,
    },
    {
      accessorKey: 'pharmacist',
      header: createSortableHeader('Pharmacist'),
      cell: ({ row }) => (
        <div className="text-sm">
          {formatPharmacistName(row.original.pharmacist)}
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: 'createdAt',
      header: createSortableHeader('Created'),
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: 'attachments',
      header: 'Attachments',
      cell: ({ row }) => {
        const attachments = row.original.attachments;
        return attachments?.length > 0 ? (
          <div className="flex items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge  className="text-xs">
                    <divclip className="w-3 h-3 mr-1" />
                    {attachments.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{attachments.length} attachment(s)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null;
      },
      size: 120,
      enableSorting: false,
    },
    {
      accessorKey: 'followUpRequired',
      header: 'Follow-up',
      cell: ({ row }) => {
        const note = row.original;
        return note.followUpRequired ? (
          <div className="flex items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Clock className="w-4 h-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Follow-up: {note.followUpDate 
                      ? formatDate(note.followUpDate) 
                      : 'Not scheduled'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null;
      },
      size: 100,
      enableSorting: false,
    },
  ];

  // Add actions column if handlers are provided
  if (onViewNote || onEditNote || onDeleteNote) {
    const actions = [];
    
    if (onViewNote) {
      actions.push({ 
        label: 'View',
        icon: Eye,
        onClick: onViewNote}
      });
    }
    
    if (onEditNote) {
      actions.push({ 
        label: 'Edit',
        icon: Edit,
        onClick: onEditNote}
      });
    }
    
    if (onDeleteNote) {
      actions.push({ 
        label: 'Delete',
        icon: Trash2,
        onClick: onDeleteNote}
      });
    }

    columns.push(createActionColumn(actions));
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onRowClick={onRowClick}
      enableRowSelection={enableRowSelection}
      enableColumnVisibility={true}
      enableSorting={true}
      enableFiltering={true}
      enablePagination={true}
      pageSize={10}
      pageSizeOptions={[10, 25, 50]}
      searchPlaceholder="Search notes..."
      onRowSelectionChange={onSelectionChange}
      className="w-full"
    />
  );
};