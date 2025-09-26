
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { Accordion } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

interface AIAnalysisResultsProps {
  analysis: AIAnalysisResult;
  loading?: boolean;
}
const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ 
  analysis,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="">
            <div  className="">
              AI Analysis in Progress
            </div>
          </div>
          <Progress className="" />
          <div  color="text.secondary">
            Our AI is analyzing the case data. This typically takes 30-60
            seconds...
          </div>
        </CardContent>
      </Card>
    );
  }
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  return (
    <div className="">
      {/* Header */}
      <Card className="">
        <CardContent>
          <div
            className=""
          >
            <div  className="">
              AI Diagnostic Analysis
            </div>
            <Chip
              label={`${Math.round(analysis.confidence * 100)}% Confidence`}
              color={getConfidenceColor(analysis.confidence)}
              
            />
          </div>
          <div  color="text.secondary">
            Analysis completed in {analysis.processingTime}ms • Generated on{' '}
            {new Date(analysis.createdAt).toLocaleString()}
          </div>
        </CardContent>
      </Card>
      {/* Primary Diagnosis */}
      <Card className="">
        <CardContent>
          <div
            
            className=""
          >
            Primary Diagnosis
            <Chip
              label={`${Math.round(
                analysis.analysis.primaryDiagnosis.confidence * 100
              )}%`}
              color={getConfidenceColor(
                analysis.analysis.primaryDiagnosis.confidence
              )}
              size="small"
              className=""
            />
          </div>
          <div
            
            color="primary"
            className=""
          >
            {analysis.analysis.primaryDiagnosis.condition}
          </div>
          <div  color="text.secondary">
            {analysis.analysis.primaryDiagnosis.reasoning}
          </div>
        </CardContent>
      </Card>
      {/* Differential Diagnoses */}
      {analysis.analysis.differentialDiagnoses.length > 0 && (
        <Accordion className="">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div >
              Differential Diagnoses (
              {analysis.analysis.differentialDiagnoses.length})
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.differentialDiagnoses.map(
                (diagnosis, index) => (
                  <React.Fragment key={index}>
                    <div className="">
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div
                              
                              className=""
                            >}
                              {diagnosis.condition}
                            </div>
                            <Chip
                              label={`${Math.round(
                                diagnosis.confidence * 100
                              )}%`}
                              color={getConfidenceColor(diagnosis.confidence)}
                              size="small"
                            />
                          </div>
                        }
                        secondary={diagnosis.reasoning}
                      />
                    </div>
                    {index < analysis.analysis.differentialDiagnoses.length - 1 && (
                      <Separator />
                    )}
                  </React.Fragment>
                )
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Recommended Tests */}
      {analysis.analysis.recommendedTests.length > 0 && (
        <Accordion className="">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div >
              Recommended Tests ({analysis.analysis.recommendedTests.length})
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.recommendedTests.map((test, index) => (
                <React.Fragment key={index}>
                  <div className="">
                    <div
                      primary={
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >}
                            {test.test}
                          </div>
                          <Chip
                            label={test.priority}
                            color={getPriorityColor(test.priority)}
                            size="small"
                          />
                        </div>
                      }
                      secondary={test.reasoning}
                    />
                  </div>
                  {index < analysis.analysis.recommendedTests.length - 1 && (
                    <Separator />
                  )}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Treatment Suggestions */}
      {analysis.analysis.treatmentSuggestions.length > 0 && (
        <Accordion className="">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div >
              Treatment Suggestions (
              {analysis.analysis.treatmentSuggestions.length})
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.treatmentSuggestions.map(
                (treatment, index) => (
                  <React.Fragment key={index}>
                    <div className="">
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div
                              
                              className=""
                            >}
                              {treatment.treatment}
                            </div>
                            <div className="">
                              <Chip
                                label={treatment.type}
                                
                                size="small"
                              />
                              <Chip
                                label={treatment.priority}
                                color={getPriorityColor(treatment.priority)}
                                size="small"
                              />
                            </div>
                          </div>
                        }
                        secondary={treatment.reasoning}
                      />
                    </div>
                    {index <
                      analysis.analysis.treatmentSuggestions.length - 1 && (
                      <Separator />
                    )}
                  </React.Fragment>
                )
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Risk Factors */}
      {analysis.analysis.riskFactors.length > 0 && (
        <Accordion className="">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div >
              Risk Factors ({analysis.analysis.riskFactors.length})
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div container spacing={2}>
              {analysis.analysis.riskFactors.map((risk, index) => (
                <div item xs={12} md={6} key={index}>
                  <Card >
                    <CardContent className="">
                      <div
                        className=""
                      >
                        <div
                          
                          className=""
                        >
                          {risk.factor}
                        </div>
                        <Chip
                          label={risk.severity}
                          color={getPriorityColor(risk.severity)}
                          size="small"
                        />
                      </div>
                      <div  color="text.secondary">
                        {risk.description}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Follow-up Recommendations */}
      {analysis.analysis.followUpRecommendations.length > 0 && (
        <Accordion className="">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div >
              Follow-up Recommendations (
              {analysis.analysis.followUpRecommendations.length})
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.followUpRecommendations.map(
                (followUp, index) => (
                  <React.Fragment key={index}>
                    <div className="">
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div
                              
                              className=""
                            >}
                              {followUp.action}
                            </div>
                            <Chip
                              label={followUp.timeframe}
                              
                              size="small"
                            />
                          </div>
                        }
                        secondary={followUp.reasoning}
                      />
                    </div>
                    {index <
                      analysis.analysis.followUpRecommendations.length - 1 && (
                      <Separator />
                    )}
                  </React.Fragment>
                )
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Disclaimer */}
      <Alert severity="warning" className="">
        <div >
          <strong>Important:</strong> This AI analysis is for informational
          purposes only and should not replace professional medical judgment.
          Always consult with qualified healthcare professionals for diagnosis
          and treatment decisions.
        </div>
      </Alert>
    </div>
  );
};
export default AIAnalysisResults;
