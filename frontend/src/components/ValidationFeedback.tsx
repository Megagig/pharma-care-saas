import { Card, CardContent, Tooltip, Progress, Alert } from '@/components/ui/button';
useDebouncedValidation,

// Props interfaces
interface ValidationFeedbackProps {
  fieldName: string;
  value: any;
  formData?: any;
  showWarnings?: boolean;
  showSuggestions?: boolean;
  realTime?: boolean;
  debounceDelay?: number;
  compact?: boolean;
  severity?: 'error' | 'warning' | 'info' | 'success';
}
interface ValidationSummaryProps {
  validationResults: ValidationResult[];
  fieldNames: string[];
  showProgress?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}
interface ValidationProgressProps {
  totalFields: number;
  validFields: number;
  showPercentage?: boolean;
  showLabels?: boolean;
}
// Individual field validation feedback
export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ 
  fieldName,
  value,
  formData,
  showWarnings = true,
  showSuggestions = true,
  realTime = true,
  debounceDelay = 300,
  compact = false,
  severity
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  // Use debounced validation for real-time feedback
  const validationResult = realTime
    ? useDebouncedValidation(fieldName, value, formData, debounceDelay)
    : { isValid: true, errors: [], warnings: [] };
  // Don't render if no validation issues and field is valid
  if (validationResult.isValid && validationResult.warnings.length === 0) {
    return null;
  }
  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  // Determine alert severity
  const alertSeverity =
    severity || (hasErrors ? 'error' : hasWarnings ? 'warning' : 'info');
  // Get appropriate icon
  const getIcon = () => {
    switch (alertSeverity) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };
  if (compact) {
    return (
      <div className="">
        {hasErrors && (
          <div
            
            color="error"
            className=""
          >
            <ErrorIcon fontSize="small" />
            {validationResult.errors[0].message}
          </div>
        )}
        {!hasErrors && hasWarnings && showWarnings && (
          <div
            
            color="warning.main"
            className=""
          >
            <WarningIcon fontSize="small" />
            {validationResult.warnings[0].message}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="">
      <Alert
        severity={alertSeverity}
        className="">
        <div
          className=""
        >
          <div className="">
            {/* Primary error/warning message */}
            {hasErrors && (
              <div
                
                className=""
              >
                {validationResult.errors[0].message}
              </div>
            )}
            {!hasErrors && hasWarnings && showWarnings && (
              <div
                
                className=""
              >
                {validationResult.warnings[0].message}
              </div>
            )}
            {/* Additional errors/warnings */}
            {(validationResult.errors.length > 1 ||
              validationResult.warnings.length > 1) && (
              <div>
                <IconButton
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                  className=""
                >
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  <div  className="">
                    {showDetails ? 'Hide' : 'Show'} details
                  </div>
                </IconButton>
                <Collapse in={showDetails}>
                  <List dense className="">
                    {/* Additional errors */}
                    {validationResult.errors.slice(1).map((error, index) => (
                      <div key={`error-${index}`} className="">
                        <div className="">
                          <ErrorIcon fontSize="small" color="error" />
                        </div>
                        <div
                          primary={error.message}
                          
                        />
                      </div>
                    ))}
                    {/* Warnings */}
                    {showWarnings &&
                      validationResult.warnings.map((warning, index) => (
                        <div
                          key={`warning-${index}`}
                          className=""
                        >
                          <div className="">
                            <WarningIcon fontSize="small" color="warning" />
                          </div>
                          <div
                            primary={warning.message}
                            secondary={
                              showSuggestions && warning.suggestion
                                ? warning.suggestion
                                : undefined}
                            }
                            
                            
                          />
                        </div>
                      ))}
                  </List>
                </Collapse>
              </div>
            )}
            {/* Suggestions for single items */}
            {showSuggestions &&
              validationResult.warnings.length === 1 &&
              validationResult.warnings[0].suggestion && (
                <div
                  className=""
                >
                  <LightbulbIcon fontSize="small" color="action" />
                  <div  color="text.secondary">
                    {validationResult.warnings[0].suggestion}
                  </div>
                </div>
              )}
          </div>
          {/* Error codes as chips */}
          <div direction="row" spacing={0.5} className="">
            {validationResult.errors.map((error, index) => (
              <Tooltip
                key={`error-code-${index}`}
                title={`Error Code: ${error.code}`}
              >
                <Chip
                  label={error.code}
                  size="small"
                  color="error"
                  
                  className=""
                />
              </Tooltip>
            ))}
            {validationResult.warnings.map((warning, index) => (
              <Tooltip
                key={`warning-code-${index}`}
                title={`Warning Code: ${warning.code}`}
              >
                <Chip
                  label={warning.code}
                  size="small"
                  color="warning"
                  
                  className=""
                />
              </Tooltip>
            ))}
          </div>
        </div>
      </Alert>
    </div>
  );
};
// Validation progress indicator
export const ValidationProgress: React.FC<ValidationProgressProps> = ({ 
  totalFields,
  validFields,
  showPercentage = true,
  showLabels = true
}) => {
  const percentage = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
  const theme = useTheme();
  const getProgressColor = () => {
    if (percentage === 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };
  return (
    <div className="">
      {showLabels && (
        <div className="">
          <div  color="text.secondary">
            Form Validation Progress
          </div>
          {showPercentage && (
            <div  color="text.secondary">
              {Math.round(percentage)}%
            </div>
          )}
        </div>
      )}
      <Progress
        
        color={getProgressColor()}
        className=""
      />
      {showLabels && (
        <div
          
          color="text.secondary"
          className=""
        >
          {validFields} of {totalFields} fields valid
        </div>
      )}
    </div>
  );
};
// Comprehensive validation summary
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  validationResults,
  fieldNames,
  showProgress = true,
  showDetails = false,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(showDetails);
  // Calculate summary statistics
  const totalFields = validationResults.length;
  const validFields = validationResults.filter(
    (result) => result.isValid
  ).length;
  const totalErrors = validationResults.reduce(
    (sum, result) => sum + result.errors.length,
    0
  );
  const totalWarnings = validationResults.reduce(
    (sum, result) => sum + result.warnings.length,
    0
  );
  const hasErrors = totalErrors > 0;
  const hasWarnings = totalWarnings > 0;
  const isFormValid = validFields === totalFields && !hasErrors;
  if (compact && isFormValid) {
    return (
      <div
        className=""
      >
        <CheckCircleIcon color="success" fontSize="small" />
        <div  color="success.main">
          All fields are valid
        </div>
      </div>
    );
  }
  return (
    <Card className="">
      <CardContent className="">
        {/* Progress indicator */}
        {showProgress && !compact && (
          <ValidationProgress
            totalFields={totalFields}
            validFields={validFields}
            showPercentage={true}
            showLabels={true}
          />
        )}
        {/* Summary statistics */}
        <div
          className=""
        >
          <div className="">
            <CheckCircleIcon
              color={isFormValid ? 'success' : 'disabled'}
              fontSize="small"
            />
            <div >
              {validFields}/{totalFields} Valid
            </div>
          </div>
          {hasErrors && (
            <div className="">
              <ErrorIcon color="error" fontSize="small" />
              <div  color="error">
                {totalErrors} Error{totalErrors !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          {hasWarnings && (
            <div className="">
              <WarningIcon color="warning" fontSize="small" />
              <div  color="warning.main">
                {totalWarnings} Warning{totalWarnings !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          {!compact && (hasErrors || hasWarnings) && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              className=""
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </div>
        {/* Detailed validation results */}
        {!compact && (
          <Collapse in={expanded}>
            <div className="">
              {validationResults.map((result, index) => {
                const fieldName = fieldNames[index] || `Field ${index + 1}`;
                if (result.isValid && result.warnings.length === 0) {
                  return null;
                }
                return (
                  <div key={index} className="">
                    <div
                      
                      className=""
                    >
                      {fieldName}
                    </div>
                    {/* Field errors */}
                    {result.errors.map((error, errorIndex) => (
                      <Alert
                        key={`error-${errorIndex}`}
                        severity="error"
                        className=""
                      >
                        <div
                          className=""
                        >
                          <div >
                            {error.message}
                          </div>
                          <Chip
                            label={error.code}
                            size="small"
                            color="error"
                            
                          />
                        </div>
                      </Alert>
                    ))}
                    {/* Field warnings */}
                    {result.warnings.map((warning, warningIndex) => (
                      <Alert
                        key={`warning-${warningIndex}`}
                        severity="warning"
                        className=""
                      >
                        <div
                          className=""
                        >
                          <div>
                            <div >
                              {warning.message}
                            </div>
                            {warning.suggestion && (
                              <div
                                
                                color="text.secondary"
                                className=""
                              >
                                💡 {warning.suggestion}
                              </div>
                            )}
                          </div>
                          <Chip
                            label={warning.code}
                            size="small"
                            color="warning"
                            
                          />
                        </div>
                      </Alert>
                    ))}
                  </div>
                );
              })}
            </div>
          </Collapse>
        )}
        {/* Security notice for sanitization */}
        {!compact && (hasErrors || hasWarnings) && (
          <div
            className=""
          >
            <SecurityIcon color="info" fontSize="small" />
            <div  color="info.main">
              All input is automatically sanitized for security
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default {
};
