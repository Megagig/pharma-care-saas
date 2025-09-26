import { Button, Tooltip, Alert, AlertTitle } from '@/components/ui/button';

interface RedFlagAlertsProps {
  redFlags: DiagnosticResult['redFlags'];
  showActions?: boolean;
  onActionClick?: (
    flag: DiagnosticResult['redFlags'][0],
    action: string
  ) => void;
}
const SEVERITY_CONFIG = {
  critical: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'Critical',
    bgColor: 'error.light',
    textColor: 'error.contrastText',
    description: 'Immediate medical attention required',
  },
  high: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'High Risk',
    bgColor: 'error.light',
    textColor: 'error.contrastText',
    description: 'Urgent medical evaluation needed',
  },
  medium: {
    color: 'warning' as const,
    icon: WarningIcon,
    label: 'Medium Risk',
    bgColor: 'warning.light',
    textColor: 'warning.contrastText',
    description: 'Medical attention recommended',
  },
  low: {
    color: 'info' as const,
    icon: InfoIcon,
    label: 'Low Risk',
    bgColor: 'info.light',
    textColor: 'info.contrastText',
    description: 'Monitor and follow up as needed',
  },
};
const ACTION_ICONS = {
  'immediate referral': LocalHospitalIcon,
  'call physician': PhoneIcon,
  'schedule follow-up': ScheduleIcon,
  'document findings': AssignmentIcon,
  'monitor closely': VisibilityIcon,
};
const RedFlagAlerts: React.FC<RedFlagAlertsProps> = ({ 
  redFlags,
  showActions = true,
  onActionClick
}) => {
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());
  const [hiddenFlags, setHiddenFlags] = useState<Set<number>>(new Set());
  const handleToggleExpand = (index: number) => {
    const newExpanded = new Set(expandedFlags);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFlags(newExpanded);
  };
  const handleToggleHide = (index: number) => {
    const newHidden = new Set(hiddenFlags);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenFlags(newHidden);
  };
  const getSeverityConfig = (severity: string) => {
    return (
      SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ||
      SEVERITY_CONFIG.medium
    );
  };
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    const iconKey = Object.keys(ACTION_ICONS).find((key) =>
      actionLower.includes(key)
    );
    return iconKey
      ? ACTION_ICONS[iconKey as keyof typeof ACTION_ICONS]
      : AssignmentIcon;
  };
  const sortedFlags = [...redFlags].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (
      (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
      (severityOrder[a.severity as keyof typeof severityOrder] || 0)
    );
  });
  const visibleFlags = sortedFlags.filter(
    (_, index) => !hiddenFlags.has(index)
  );
  const criticalCount = redFlags.filter(
    (flag) => flag.severity === 'critical'
  ).length;
  const highCount = redFlags.filter((flag) => flag.severity === 'high').length;
  if (redFlags.length === 0) {
    return null;
  }
  return (
    <div>
      {/* Header with Summary */}
      <div className="">
        <div
          
          className=""
        >
          <ErrorIcon className="" />
          Clinical Red Flags ({redFlags.length})
        </div>
        <div className="">
          {criticalCount > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${criticalCount} Critical`}
              color="error"
              
              size="small"
            />
          )}
          {highCount > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${highCount} High Risk`}
              color="error"
              
              size="small"
            />
          )}
          <Chip
            label={`${redFlags.length} Total Flags`}
            
            size="small"
          />
        </div>
        {(criticalCount > 0 || highCount > 0) && (
          <Alert severity="error" className="">
            <AlertTitle>Immediate Attention Required</AlertTitle>
            <div >
              {criticalCount > 0 &&
                `${criticalCount} critical finding(s) detected. `}
              {highCount > 0 &&
                `${highCount} high-risk condition(s) identified. `}
              Review all red flags and take appropriate action immediately.
            </div>
          </Alert>
        )}
      </div>
      {/* Red Flag List */}
      <div spacing={2}>
        {visibleFlags.map((flag, index) => {
          const config = getSeverityConfig(flag.severity);
          const Icon = config.icon;
          const ActionIcon = getActionIcon(flag.action);
          const isExpanded = expandedFlags.has(index);
          return (
            <div
              key={index}
              elevation={flag.severity === 'critical' ? 3 : 1}
              className="">
              {/* Flag Header */}
              <div
                className=""
              >
                <div
                  className=""
                >
                  <div className="">
                    <Icon className="" />
                    <div>
                      <div  className="">
                        {flag.flag}
                      </div>
                      <div  className="">
                        {config.description}
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <Chip
                      label={config.label}
                      size="small"
                      className=""
                    />
                    <Tooltip
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(index)}
                        className=""
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={hiddenFlags.has(index) ? 'Show flag' : 'Hide flag'}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleToggleHide(index)}
                        className=""
                      >
                        {hiddenFlags.has(index) ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
              {/* Flag Details */}
              <Collapse in={isExpanded}>
                <div className="">
                  {/* Recommended Action */}
                  <div className="">
                    <div
                      
                      className=""
                    >
                      <ActionIcon className="" />
                      Recommended Action
                    </div>
                    <Alert severity={config.color} >
                      <div >{flag.action}</div>
                    </Alert>
                  </div>
                  {/* Action Buttons */}
                  {showActions && (
                    <div className="">
                      {flag.severity === 'critical' && (
                        <Button
                          
                          color="error"
                          size="small"
                          startIcon={<LocalHospitalIcon />}
                          onClick={() =>
                            onActionClick?.(flag, 'emergency_referral')}
                          }
                        >
                          Emergency Referral
                        </Button>
                      )}
                      {(flag.severity === 'critical' ||
                        flag.severity === 'high') && (
                        <Button
                          
                          color="error"
                          size="small"
                          startIcon={<PhoneIcon />}
                          onClick={() =>
                            onActionClick?.(flag, 'call_physician')}
                          }
                        >
                          Call Physician
                        </Button>
                      )}
                      <Button
                        
                        color="primary"
                        size="small"
                        startIcon={<AssignmentIcon />}
                        onClick={() => onActionClick?.(flag, 'document')}
                      >
                        Document
                      </Button>
                      <Button
                        
                        color="primary"
                        size="small"
                        startIcon={<ScheduleIcon />}
                        onClick={() =>
                          onActionClick?.(flag, 'schedule_followup')}
                        }
                      >
                        Schedule Follow-up
                      </Button>
                    </div>
                  )}
                </div>
              </Collapse>
            </div>
          );
        })}
      </div>
      {/* Hidden Flags Summary */}
      {hiddenFlags.size > 0 && (
        <div className="">
          <Alert severity="info" >
            <div >
              {hiddenFlags.size} flag(s) hidden. Click the visibility icon to
              show them again.
            </div>
            <Button
              size="small"
              onClick={() => setHiddenFlags(new Set())}
              className=""
            >
              Show All Flags
            </Button>
          </Alert>
        </div>
      )}
      {/* Emergency Contact Information */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="">
          <Alert severity="error">
            <AlertTitle>Emergency Protocols</AlertTitle>
            <div  className="">
              For critical findings, ensure immediate medical evaluation:
            </div>
            <List dense>
              <div>
                <div>
                  <PhoneIcon color="error" />
                </div>
                <div
                  primary="Emergency Services: 911"
                  secondary="For life-threatening conditions"
                />
              </div>
              <div>
                <div>
                  <LocalHospitalIcon color="error" />
                </div>
                <div
                  primary="Nearest Emergency Department"
                  secondary="For urgent medical evaluation"
                />
              </div>
              <div>
                <div>
                  <PhoneIcon color="warning" />
                </div>
                <div
                  primary="On-call Physician"
                  secondary="For immediate consultation"
                />
              </div>
            </List>
          </Alert>
        </div>
      )}
    </div>
  );
};
export default RedFlagAlerts;
