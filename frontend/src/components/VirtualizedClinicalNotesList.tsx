import { Card, CardContent, Skeleton } from '@/components/ui/button';
useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,

interface VirtualizedClinicalNotesListProps {
  notes: ClinicalNote[];
  height: number;
  itemHeight?: number;
  onNoteView?: (note: ClinicalNote) => void;
  onNoteEdit?: (note: ClinicalNote) => void;
  onNoteDelete?: (note: ClinicalNote) => void;
  onNoteSelect?: (noteId: string) => void;
  selectedNotes?: string[];
  loading?: boolean;
  overscan?: number;
}
interface NoteItemProps {
  index: number;
  style: React.CSSProperties;
  note: ClinicalNote;
  onNoteView?: (note: ClinicalNote) => void;
  onNoteEdit?: (note: ClinicalNote) => void;
  onNoteDelete?: (note: ClinicalNote) => void;
  onNoteSelect?: (noteId: string) => void;
  selectedNotes?: string[];
}
// Memoized note item component for performance
const NoteItem: React.FC<NoteItemProps> = React.memo(
  ({ index, style, data }) => {
    const theme = useTheme();
    const {
      notes,
      onNoteView,
      onNoteEdit,
      onNoteDelete,
      onNoteSelect,
      selectedNotes = [],
    } = data;
    const note = notes[index];
    const isSelected = selectedNotes.includes(note._id);
    const formatDate = useCallback((dateString: string) => {
      try {
        return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }, []);
    const formatPatientName = useCallback(
      (patient: ClinicalNote['patient']) => {
        return `${patient.firstName} ${patient.lastName}`;
      },
      []
    );
    const formatPharmacistName = useCallback(
      (pharmacist: ClinicalNote['pharmacist']) => {
        return `${pharmacist.firstName} ${pharmacist.lastName}`;
      },
      []
    );
    const PriorityChip = React.memo(
      ({ priority }: { priority: ClinicalNote['priority'] }) => {
        const priorityInfo = NOTE_PRIORITIES.find((p) => p.value === priority);
        return (
          <Chip
            label={priorityInfo?.label || priority}
            size="small"
            className=""
          />
        );
      }
    );
    const TypeChip = React.memo(({ type }: { type: ClinicalNote['type'] }) => {
      const typeInfo = NOTE_TYPES.find((t) => t.value === type);
      return (
        <Chip
          label={typeInfo?.label || type}
          size="small"
          
          color="primary"
          className=""
        />
      );
    });
    if (!note) {
      return (
        <div style={style}>
          <Card className="">
            <CardContent>
              <Skeleton  width="60%" height={24} />
              <Skeleton  width="40%" height={20} />
              <Skeleton  width="80%" height={20} />
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div style={style}>
        <Card
          className=""`
              : '1px solid #e0e0e0',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-1px)',
            },
          onClick={() => onNoteSelect?.(note._id)}
        >
          <CardContent className="">
            {/* Header */}
            <div className="">
              <div className="">
                <div
                  
                  component="h3"
                  className=""
                >
                  {note.title}
                </div>
                <div
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  className=""
                >
                  <TypeChip type={note.type} />
                  <PriorityChip priority={note.priority} />
                  {note.isConfidential && (
                    <Chip
                      icon={<SecurityIcon className="" />}
                      label="Confidential"
                      size="small"
                      color="warning"
                      className=""
                    />
                  )}
                </div>
              </div>
              <div direction="row" spacing={0.5}>
                {onNoteView && (
                  <IconButton
                    size="small"
                    
                    className=""
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                )}
                {onNoteEdit && (
                  <IconButton
                    size="small"
                    
                    className=""
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onNoteDelete && (
                  <IconButton
                    size="small"
                    
                    color="error"
                    className=""
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            </div>
            {/* Patient and Pharmacist Info */}
            <div className="">
              <div  color="text.secondary" noWrap>
                Patient: <strong>{formatPatientName(note.patient)}</strong>{' '}
                (MRN: {note.patient.mrn})
              </div>
              <div  color="text.secondary" noWrap>
                Pharmacist: {formatPharmacistName(note.pharmacist)}
              </div>
            </div>
            {/* Footer */}
            <div
              className=""
            >
              <div  color="text.secondary">
                {formatDate(note.createdAt)}
              </div>
              <div direction="row" spacing={1} alignItems="center">
                {note.followUpRequired && (
                  <div className="">
                    <ScheduleIcon
                      color="warning"
                      className=""
                    />
                    <div  color="warning.main">
                      Follow-up
                    </div>
                  </div>
                )}
                {note.attachments?.length > 0 && (
                  <div className="">
                    <AttachFileIcon
                      color="action"
                      className=""
                    />
                    <div  color="text.secondary">
                      {note.attachments.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
NoteItem.displayName = 'NoteItem';
const VirtualizedClinicalNotesList: React.FC = ({ 
  notes,
  height,
  itemHeight = 160,
  onNoteView,
  onNoteEdit,
  onNoteDelete,
  onNoteSelect,
  selectedNotes = [],
  loading = false,
  overscan = 5
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({ 
      notes,
      onNoteView,
      onNoteEdit,
      onNoteDelete,
      onNoteSelect,
      selectedNotes}
    }),
    [notes, onNoteView, onNoteEdit, onNoteDelete, onNoteSelect, selectedNotes]
  );
  // Handle scroll events for performance optimization
  const handleItemsRendered = useCallback(() => {
    // This can be used for analytics or lazy loading more data
  }, []);
  const onScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
    }
  }, [isScrolling]);
  // Reset scrolling state after scroll ends
  useEffect(() => {
    if (isScrolling) {
      const timer = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isScrolling]);
  if (loading) {
    return (
      <div className="">
        {Array.from({ length: Math.ceil(height / itemHeight) }).map(
          (_, index) => (
            <Card key={index} className="">
              <CardContent>
                <Skeleton  width="60%" height={24} />
                <Skeleton  width="40%" height={20} />
                <Skeleton  width="80%" height={20} />
                <div className="">
                  <Skeleton
                    
                    width={60}
                    height={20}
                    className=""
                  />
                  <Skeleton
                    
                    width={80}
                    height={20}
                    className=""
                  />
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    );
  }
  if (notes.length === 0) {
    return (
      <div
        className=""
      >
        <div  color="text.secondary">
          No clinical notes found
        </div>
        <div  color="text.secondary">
          Try adjusting your search or filters
        </div>
      </div>
    );
  }
  return (
    <div className="">
      <List
        height={height}
        itemCount={notes.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscan}
        onItemsRendered={handleItemsRendered}
        onScroll={onScroll}
        >
        {NoteItem}
      </List>
    </div>
  );
};
export default React.memo(VirtualizedClinicalNotesList);
