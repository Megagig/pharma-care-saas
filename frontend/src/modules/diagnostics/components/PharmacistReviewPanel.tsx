import { Button, Input, Card, CardContent, Dialog, DialogContent, DialogTitle, Tooltip, Alert, Accordion, Separator } from '@/components/ui/button';

interface PharmacistReviewPanelProps {
  result: DiagnosticResult;
  onApprove?: () => void;
  onModify?: (modifications: string) => void;
  onReject?: (reason: string) => void;
  loading?: boolean;
  error?: string;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}
interface ReviewDialogState {
  open: boolean;
  type: 'approve' | 'modify' | 'reject' | null;
  text: string;
  confirmationRequired: boolean;
}
const PharmacistReviewPanel: React.FC<PharmacistReviewPanelProps> = ({ 
  result,
  onApprove,
  onModify,
  onReject,
  loading = false,
  error,
  currentUser
}) => {
  const [dialogState, setDialogState] = useState<ReviewDialogState>({ 
    open: false,
    type: null,
    text: '',
    confirmationRequired: false}
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const handleToggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  const handleOpenDialog = (type: 'approve' | 'modify' | 'reject') => {
    const requiresConfirmation =
      type === 'approve' &&
      (result.redFlags.some(
        (flag) => flag.severity === 'critical' || flag.severity === 'high'
      ) ||
        result.referralRecommendation?.recommended);
    setDialogState({ 
      open: true,
      type,
      text: '',
      confirmationRequired: requiresConfirmation}
    });
  };
  const handleCloseDialog = () => {
    setDialogState({ 
      open: false,
      type: null,
      text: '',
      confirmationRequired: false}
    });
  };
  const handleSubmitReview = () => {
    const { type, text } = dialogState;
    switch (type) {
      case 'approve':
        onApprove?.();
        break;
      case 'modify':
        if (text.trim()) {
          onModify?.(text.trim());
        }
        break;
      case 'reject':
        if (text.trim()) {
          onReject?.(text.trim());
        }
        break;
    }
    handleCloseDialog();
  };
  const getReviewStatusChip = () => {
    if (!result.pharmacistReview) {
      return (
        <Chip
          label="Pending Review"
          color="warning"
          
          icon={<ScheduleIcon />}
        />
      );
    }
    const { status } = result.pharmacistReview;
    const config = {
      approved: {
        color: 'success' as const,
        icon: CheckCircleIcon,
        label: 'Approved',
      },
      modified: {
        color: 'warning' as const,
        icon: EditIcon,
        label: 'Modified',
      },
      rejected: {
        color: 'error' as const,
        icon: CancelIcon,
        label: 'Rejected',
      },
    };
    const statusConfig = config[status];
    const Icon = statusConfig.icon;
    return (
      <Chip
        label={statusConfig.label}
        color={statusConfig.color}
        
        icon={<Icon />}
      />
    );
  };
  const isReviewed = !!result.pharmacistReview;
  const hasHighRiskFlags = result.redFlags.some(
    (flag) => flag.severity === 'critical' || flag.severity === 'high'
  );
  const hasReferralRecommendation = result.referralRecommendation?.recommended;
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="">
          <div
            className=""
          >
            <div
              
              className=""
            >
              <PersonIcon className="" />
              Pharmacist Review
            </div>
            {getReviewStatusChip()}
          </div>
          {error && (
            <Alert severity="error" className="">
              {error}
            </Alert>
          )}
          {/* Review Warnings */}
          {!isReviewed && (hasHighRiskFlags || hasReferralRecommendation) && (
            <Alert severity="warning" className="">
              <div  className="">
                Special Attention Required
              </div>
              <div spacing={0.5}>
                {hasHighRiskFlags && (
                  <div >
                    • Critical or high-risk red flags detected
                  </div>
                )}
                {hasReferralRecommendation && (
                  <div >
                    • AI recommends referral to{' '}
                    {result.referralRecommendation?.specialty}
                  </div>
                )}
              </div>
            </Alert>
          )}
        </div>
        {/* Review History */}
        {isReviewed && (
          <div className="">
            <Accordion
              expanded={expandedSections.has('history')}
              onChange={() => handleToggleSection('history')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div  className="">
                  Review History
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div className="">
                  <div spacing={2}>
                    <div>
                      <div  color="text.secondary">
                        Reviewed By
                      </div>
                      <div  className="">
                        {result.pharmacistReview.reviewedBy}
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Review Date
                      </div>
                      <div  className="">
                        {new Date(
                          result.pharmacistReview.reviewedAt
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Decision
                      </div>
                      <div className="">{getReviewStatusChip()}</div>
                    </div>
                    {result.pharmacistReview.modifications && (
                      <div>
                        <div  color="text.secondary">
                          Modifications Made
                        </div>
                        <Alert severity="info" className="">
                          <div >
                            {result.pharmacistReview.modifications}
                          </div>
                        </Alert>
                      </div>
                    )}
                    {result.pharmacistReview.rejectionReason && (
                      <div>
                        <div  color="text.secondary">
                          Rejection Reason
                        </div>
                        <Alert severity="error" className="">
                          <div >
                            {result.pharmacistReview.rejectionReason}
                          </div>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        )}
        {/* Review Checklist */}
        {!isReviewed && (
          <div className="">
            <div  className="">
              Review Checklist
            </div>
            <List>
              <div>
                <div>
                  <Tooltip title="Verify diagnostic accuracy">
                    <InfoIcon color="primary" />
                  </Tooltip>
                </div>
                <div
                  primary="Diagnostic Assessment"
                  secondary="Review differential diagnoses for clinical accuracy and relevance"
                />
              </div>
              <div>
                <div>
                  <Tooltip title="Check medication safety">
                    <InfoIcon color="primary" />
                  </Tooltip>
                </div>
                <div
                  primary="Medication Safety"
                  secondary="Verify drug selections, dosages, and interaction checks"
                />
              </div>
              <div>
                <div>
                  <Tooltip title="Assess red flags">
                    <WarningIcon color="warning" />
                  </Tooltip>
                </div>
                <div
                  primary="Red Flag Assessment"
                  secondary="Evaluate critical findings and recommended actions"
                />
              </div>
              <div>
                <div>
                  <Tooltip title="Review referral needs">
                    <InfoIcon color="primary" />
                  </Tooltip>
                </div>
                <div
                  primary="Referral Appropriateness"
                  secondary="Assess need for physician referral and urgency level"
                />
              </div>
            </List>
          </div>
        )}
        {/* Action Buttons */}
        {!isReviewed && (onApprove || onModify || onReject) && (
          <>
            <Separator className="" />
            <div className="">
              {onReject && (
                <Button
                  
                  color="error"
                  onClick={() => handleOpenDialog('reject')}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                >
                  Reject
                </Button>
              )}
              {onModify && (
                <Button
                  
                  color="warning"
                  onClick={() => handleOpenDialog('modify')}
                  disabled={loading}
                  startIcon={<EditIcon />}
                >
                  Modify
                </Button>
              )}
              {onApprove && (
                <Button
                  
                  color="success"
                  onClick={() => handleOpenDialog('approve')}
                  disabled={loading}
                  startIcon={<CheckCircleIcon />}
                >
                  {loading ? 'Processing...' : 'Approve'}
                </Button>
              )}
            </div>
          </>
        )}
        {/* Current User Info */}
        {currentUser && !isReviewed && (
          <div className="">
            <div  color="text.secondary">
              Reviewing as: {currentUser.name} ({currentUser.role})
            </div>
          </div>
        )}
      </CardContent>
      {/* Review Dialog */}
      <Dialog
        open={dialogState.open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogState.type === 'approve' && 'Approve Diagnostic Result'}
          {dialogState.type === 'modify' && 'Modify Diagnostic Result'}
          {dialogState.type === 'reject' && 'Reject Diagnostic Result'}
        </DialogTitle>
        <DialogContent>
          {dialogState.confirmationRequired && (
            <Alert severity="warning" className="">
              <div  className="">
                High-Risk Case Detected
              </div>
              <div >
                This case contains critical findings or referral
                recommendations. Please confirm you have thoroughly reviewed all
                aspects before approving.
              </div>
            </Alert>
          )}
          {dialogState.type === 'approve' && (
            <div>
              <div  className="">
                By approving this diagnostic result, you confirm that:
              </div>
              <List>
                <div>
                  <div primary="• The diagnostic assessment is clinically appropriate" />
                </div>
                <div>
                  <div primary="• Medication recommendations are safe and appropriate" />
                </div>
                <div>
                  <div primary="• Red flags have been properly addressed" />
                </div>
                <div>
                  <div primary="• Referral recommendations are appropriate" />
                </div>
              </List>
            </div>
          )}
          {dialogState.type === 'modify' && (
            <div>
              <div  className="">
                Please describe the modifications you are making to the AI
                recommendations:
              </div>
              <Input
                fullWidth
                multiline
                rows={4}
                label="Modifications"
                placeholder="Describe your modifications to the diagnostic recommendations..."
                value={dialogState.text}
                onChange={(e) =>}
                  setDialogState((prev) => ({ ...prev, text: e.target.value }))
                }
                required
                helperText="Be specific about what changes you are making and why"
              />
            </div>
          )}
          {dialogState.type === 'reject' && (
            <div>
              <div  className="">
                Please provide a reason for rejecting this diagnostic result:
              </div>
              <Input
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                placeholder="Explain why you are rejecting these recommendations..."
                value={dialogState.text}
                onChange={(e) =>}
                  setDialogState((prev) => ({ ...prev, text: e.target.value }))
                }
                required
                helperText="This will help improve future AI recommendations"
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            
            disabled={
              loading ||
              ((dialogState.type === 'modify' ||
                dialogState.type === 'reject') &&
                !dialogState.text.trim())}
            }
            color={
              dialogState.type === 'approve'
                ? 'success'
                : dialogState.type === 'modify'
                  ? 'warning'
                  : 'error'}
            }
          >
            {loading
              ? 'Processing...'
              : dialogState.type === 'approve'
                ? 'Approve'
                : dialogState.type === 'modify'
                  ? 'Submit Modifications'
                  : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
export default PharmacistReviewPanel;
