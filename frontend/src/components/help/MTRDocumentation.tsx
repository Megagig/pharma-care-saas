import { Card, CardContent, Alert, Accordion } from '@/components/ui/button';

interface MTRDocumentationProps {
  section?:
    | 'overview'
    | 'workflow'
    | 'best-practices'
    | 'troubleshooting'
    | 'reference';
}

export const MTRDocumentation: React.FC<MTRDocumentationProps> = ({ 
  section = 'overview'
}) => {
  const [expandedSection, setExpandedSection] = useState<string>(section);

  const handleSectionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? panel : '');
    };

  const workflowSteps = [
    {
      number: 1,
      title: 'Patient Selection',
      description: 'Identify and select appropriate patients for MTR',
      icon: <PlayArrowIcon color="primary" />,
      keyPoints: [
        'Search patients by name, ID, or demographics',
        'Filter by medication count, conditions, or risk factors',
        'Check for existing active MTR sessions',
        'Verify patient information and contact details',
      ],
      timeEstimate: '5-10 minutes',
    },
    {
      number: 2,
      title: 'Medication History Collection',
      description: 'Gather comprehensive medication information',
      icon: <AssignmentIcon color="primary" />,
      keyPoints: [
        'Include ALL medications: Rx, OTC, herbal, supplements',
        'Verify dosages, frequencies, and directions',
        'Document start dates and indications',
        'Check for recently discontinued medications',
      ],
      timeEstimate: '10-15 minutes',
    },
    {
      number: 3,
      title: 'Therapy Assessment',
      description: 'Identify drug-related problems and assess therapy',
      icon: <AssessmentIcon color="primary" />,
      keyPoints: [
        'Review automated interaction and contraindication alerts',
        'Assess clinical significance of identified problems',
        'Evaluate therapy appropriateness and effectiveness',
        'Consider patient-specific risk factors',
      ],
      timeEstimate: '15-20 minutes',
    },
    {
      number: 4,
      title: 'Plan Development',
      description: 'Create evidence-based therapy recommendations',
      icon: <CheckCircleIcon color="primary" />,
      keyPoints: [
        'Prioritize problems by clinical significance',
        'Develop specific, actionable recommendations',
        'Include monitoring parameters and goals',
        'Base recommendations on current evidence',
      ],
      timeEstimate: '10-15 minutes',
    },
    {
      number: 5,
      title: 'Interventions & Documentation',
      description: 'Record actions and track outcomes',
      icon: <InfoIcon color="primary" />,
      keyPoints: [
        'Document all pharmacist communications',
        'Track recommendation acceptance and implementation',
        'Record patient counseling and education',
        'Note any barriers or challenges encountered',
      ],
      timeEstimate: '10-15 minutes',
    },
    {
      number: 6,
      title: 'Follow-Up & Monitoring',
      description: 'Schedule ongoing care and monitoring',
      icon: <ScheduleIcon color="primary" />,
      keyPoints: [
        'Set appropriate follow-up intervals',
        'Schedule monitoring activities and reminders',
        'Plan next MTR session if needed',
        'Ensure continuity of care',
      ],
      timeEstimate: '5-10 minutes',
    },
  ];

  const problemSeverityLevels = [
    {
      level: 'Critical',
      color: 'error' as const,
      description: 'Immediate intervention required',
      examples: [
        'Life-threatening interactions',
        'Contraindicated combinations',
        'Severe allergic reactions',
      ],
      action: 'Contact prescriber immediately, document urgently',
    },
    {
      level: 'Major',
      color: 'warning' as const,
      description: 'Significant clinical risk',
      examples: [
        'Major drug interactions',
        'Inappropriate dosing',
        'Therapeutic duplications',
      ],
      action: 'Recommend intervention within 24-48 hours',
    },
    {
      level: 'Moderate',
      color: 'info' as const,
      description: 'Monitor closely and consider intervention',
      examples: [
        'Moderate interactions',
        'Suboptimal therapy',
        'Adherence concerns',
      ],
      action: 'Monitor and intervene as appropriate',
    },
    {
      level: 'Minor',
      color: 'default' as const,
      description: 'Document and monitor',
      examples: [
        'Minor interactions',
        'Counseling opportunities',
        'Optimization potential',
      ],
      action: 'Document findings and monitor trends',
    },
  ];

  const bestPractices = [
    {
      category: 'Preparation',
      practices: [
        'Review patient records before starting MTR session',
        'Gather all necessary resources and references',
        'Set aside adequate uninterrupted time',
        'Ensure access to drug information databases',
      ],
    },
    {
      category: 'Documentation',
      practices: [
        'Use clear, professional language',
        'Include specific details and rationale',
        'Document all communications and outcomes',
        'Maintain complete audit trail',
      ],
    },
    {
      category: 'Clinical Assessment',
      practices: [
        'Consider patient-specific factors (age, kidney/liver function)',
        'Evaluate therapy duration and appropriateness',
        'Assess both effectiveness and safety',
        'Use evidence-based clinical guidelines',
      ],
    },
    {
      category: 'Communication',
      practices: [
        'Use patient-friendly language for counseling',
        'Provide written summaries when appropriate',
        'Follow up on all recommendations',
        'Maintain professional relationships with prescribers',
      ],
    },
  ];

  const troubleshootingGuide = [
    {
      issue: 'Patient not found in system',
      solutions: [
        'Verify spelling and try alternate search terms',
        'Check if patient is registered in the system',
        'Use partial name or phone number search',
        'Contact system administrator if patient should exist',
      ],
    },
    {
      issue: 'Medication not found in database',
      solutions: [
        'Try generic name instead of brand name',
        'Check spelling and dosage form',
        'Use partial drug name search',
        'Add as custom entry if necessary',
      ],
    },
    {
      issue: 'Too many interaction alerts',
      solutions: [
        'Focus on clinically significant interactions',
        'Adjust alert sensitivity settings',
        'Review patient-specific risk factors',
        'Consult clinical references for guidance',
      ],
    },
    {
      issue: 'System running slowly',
      solutions: [
        'Check internet connection stability',
        'Clear browser cache and cookies',
        'Close unnecessary browser tabs',
        'Contact IT support if issues persist',
      ],
    },
    {
      issue: 'Data not saving properly',
      solutions: [
        'Check network connection',
        'Try manual save (Ctrl+S)',
        'Refresh page and re-enter data',
        'Contact technical support',
      ],
    },
  ];

  return (
    <div className="">
      <div  gutterBottom color="primary">
        MTR Documentation & Help
      </div>

      <div  paragraph>
        Comprehensive guide to using the Medication Therapy Review (MTR) module
        effectively. This documentation covers the complete workflow, best
        practices, and troubleshooting guidance.
      </div>

      {/* Overview Section */}
      <Accordion
        expanded={expandedSection === 'overview'}
        onChange={handleSectionChange('overview')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div >MTR Overview & Benefits</div>
        </AccordionSummary>
        <AccordionDetails>
          <div container spacing={3}>
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom color="primary">
                    What is MTR?
                  </div>
                  <div  paragraph>
                    Medication Therapy Review is a systematic process where
                    pharmacists evaluate a patient's complete medication regimen
                    to identify drug-related problems and optimize therapy
                    outcomes.
                  </div>
                  <div >
                    The MTR process follows a structured 6-step workflow to
                    ensure comprehensive assessment and documentation for
                    regulatory compliance.
                  </div>
                </CardContent>
              </Card>
            </div>
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom color="primary">
                    Key Benefits
                  </div>
                  <List dense>
                    <div>
                      <div>
                        <CheckCircleIcon color="success" />
                      </div>
                      <div primary="Improved patient safety and outcomes" />
                    </div>
                    <div>
                      <div>
                        <CheckCircleIcon color="success" />
                      </div>
                      <div primary="Systematic problem identification" />
                    </div>
                    <div>
                      <div>
                        <CheckCircleIcon color="success" />
                      </div>
                      <div primary="Evidence-based recommendations" />
                    </div>
                    <div>
                      <div>
                        <CheckCircleIcon color="success" />
                      </div>
                      <div primary="Complete audit trail and compliance" />
                    </div>
                  </List>
                </CardContent>
              </Card>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Workflow Section */}
      <Accordion
        expanded={expandedSection === 'workflow'}
        onChange={handleSectionChange('workflow')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div >6-Step MTR Workflow</div>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" className="">
            <div >
              <strong>Total Time Estimate:</strong> 60-90 minutes for a complete
              MTR session
            </div>
          </Alert>

          {workflowSteps.map((step) => (
            <Card key={step.number} className="">
              <CardContent>
                <div className="">
                  <div
                    className=""
                  >
                    {step.number}
                  </div>
                  <div className="">
                    <div >{step.title}</div>
                    <div  color="text.secondary">
                      {step.description}
                    </div>
                  </div>
                  <Chip label={step.timeEstimate} size="small" />
                </div>

                <List dense>
                  {step.keyPoints.map((point, pointIndex) => (
                    <div key={pointIndex}>
                      <div>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </div>
                      <div primary={point} />
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Problem Severity Reference */}
      <Accordion
        expanded={expandedSection === 'reference'}
        onChange={handleSectionChange('reference')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div >Problem Severity Reference</div>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Severity Level</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Examples</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Recommended Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problemSeverityLevels.map((level) => (
                  <TableRow key={level.level}>
                    <TableCell>
                      <Chip label={level.level} color={level.color} />
                    </TableCell>
                    <TableCell>{level.description}</TableCell>
                    <TableCell>
                      <List dense>
                        {level.examples.map((example, index) => (
                          <div key={index} className="">
                            <div >• {example}</div>
                          </div>
                        ))}
                      </List>
                    </TableCell>
                    <TableCell>{level.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Best Practices Section */}
      <Accordion
        expanded={expandedSection === 'best-practices'}
        onChange={handleSectionChange('best-practices')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div >Best Practices & Guidelines</div>
        </AccordionSummary>
        <AccordionDetails>
          <div container spacing={3}>
            {bestPractices.map((category, index) => (
              <div item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <div  gutterBottom color="primary">
                      {category.category}
                    </div>
                    <List dense>
                      {category.practices.map((practice, practiceIndex) => (
                        <div key={practiceIndex}>
                          <div>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </div>
                          <div
                            primary={practice}
                            
                          />
                        </div>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Troubleshooting Section */}
      <Accordion
        expanded={expandedSection === 'troubleshooting'}
        onChange={handleSectionChange('troubleshooting')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div >Troubleshooting Guide</div>
        </AccordionSummary>
        <AccordionDetails>
          {troubleshootingGuide.map((item, index) => (
            <Card key={index} className="">
              <CardContent>
                <div className="">
                  <WarningIcon color="warning" className="" />
                  <div >{item.issue}</div>
                </div>
                <div  gutterBottom>
                  Solutions:
                </div>
                <List dense>
                  {item.solutions.map((solution, solutionIndex) => (
                    <div key={solutionIndex}>
                      <div>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </div>
                      <div
                        primary={solution}
                        
                      />
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}

          <Alert severity="info" className="">
            <div >
              <strong>Need Additional Help?</strong>
              <br />
              • Contact your system administrator for technical issues
              <br />
              • Consult with senior pharmacists for clinical questions
              <br />• Access additional training materials or request refresher
              sessions
            </div>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Quick Reference Card */}
      <Card className="">
        <CardContent>
          <div  gutterBottom color="primary.contrastText">
            Quick Reference - Keyboard Shortcuts
          </div>
          <div container spacing={2}>
            <div item xs={6} md={3}>
              <div  color="primary.contrastText">
                <strong>Ctrl + S:</strong> Save progress
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="primary.contrastText">
                <strong>Ctrl + N:</strong> New MTR session
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="primary.contrastText">
                <strong>Ctrl + F:</strong> Search function
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="primary.contrastText">
                <strong>Ctrl + ?:</strong> Show help
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MTRDocumentation;
