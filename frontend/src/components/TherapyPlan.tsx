import { Button, Input, Dialog, DialogContent, DialogTitle, Alert } from '@/components/ui/button';
const TherapyPlanManager: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>('');
  const [guidelines, setGuidelines] = useState<string>('');
  const { selectedDrug } = useDrugStore();
  const { data: savedPlans = [] } = useTherapyPlans();
  const { mutate: createPlan } = useCreateTherapyPlan();
  const { mutate: deletePlan } = useDeleteTherapyPlan();
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setPlanName('');
    setGuidelines('');
  };
  const handleCreatePlan = () => {
    if (!planName.trim()) return;
    const newPlan: Omit<TherapyPlan, '_id' | 'createdAt' | 'updatedAt'> = {
      planName,
      drugs: selectedDrug ? [selectedDrug] : [],
      guidelines
    };
    createPlan(newPlan, {
      onSuccess: () => {
        handleClose();
      }
    });
  };
  const handleDeletePlan = (id: string) => {
    deletePlan(id);
  };
  return (
    <div className="p-4">
      <div display="flex" justifyContent="space-between" alignItems="center" className="mb-4">
        <div >
          Therapy Plans
        </div>
        <Button

          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          New Plan
        </Button>
      </div>
      {savedPlans.length === 0 ? (
        <Alert severity="info">
          No therapy plans created yet. Create your first plan to save drug information.
        </Alert>
      ) : (
        <List>
          {savedPlans.map((plan) => (
            <div key={plan._id} className="border-b last:border-b-0">
              <div
                primary={plan.planName}
                secondary={
                  <div>
                    <div>
                      {plan.drugs.length} drug(s) included
                    </div>
                    {plan.guidelines && (
                      <div className="mt-1">
                        Guidelines: {plan.guidelines}
                      </div>
                    )}
                  </div>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => plan._id && handleDeletePlan(plan._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </div>
          ))}
        </List>
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Therapy Plan</DialogTitle>
        <DialogContent>
          <Input
            autoFocus
            margin="dense"
            label="Plan Name"
            fullWidth
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="mb-4"
          />
          <Input
            margin="dense"
            label="Clinical Guidelines (Optional)"
            fullWidth
            multiline
            rows={3}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
          />
          {selectedDrug && (
            <div className="mt-4">
              <div className="mb-2">
                Selected Drug:
              </div>
              <Chip label={selectedDrug.name} />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreatePlan}

            disabled={!planName.trim()}
          >
            Create Plan
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default TherapyPlanManager;