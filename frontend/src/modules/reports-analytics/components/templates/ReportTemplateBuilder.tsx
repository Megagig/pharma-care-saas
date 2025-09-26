import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Progress, Alert, Switch, Accordion, Tabs, Separator } from '@/components/ui/button';
// Removed MUI system import - using Tailwind CSS
interface ReportTemplateBuilderProps {
  templateId?: string;
onSave?: (template: ReportTemplate) => void;
  onCancel?: () => void;
  onPreview?: (template: ReportTemplate) => void;
}
interface DraggableItemProps {
  type: 'section' | 'chart' | 'table' | 'metric';
  data: any;
  children: React.ReactNode;
}
interface DropZoneProps {
  onDrop: (item: DraggedItem, position: number) => void;
  children: React.ReactNode;
  position: number;
}
const ITEM_TYPES = {
};
const DraggableItem: React.FC<DraggableItemProps> = ({ 
  type,
  data,
  children
}) => {
  const [{ isDragging }, drag] = useDrag({ 
    type: ITEM_TYPES.SECTION}
    item: { type, data, source: 'palette' },
    collect: (monitor) => ({ 
      isDragging: monitor.isDragging()}
    })}
  return (
    <div
      ref={drag}
      className="">
      {children}
    </div>
  );
};
const DropZone: React.FC<DropZoneProps> = ({ onDrop, children, position }) => {
  const [{ isOver, canDrop }, drop] = useDrop({ 
    accept: ITEM_TYPES.SECTION,
    drop: (item: DraggedItem) => {
      onDrop(item, position); })
    },
    collect: (monitor) => ({ 
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()}
    })}
  return (
    <div
      ref={drop}
      className=""
    >
      {children}
      {isOver && canDrop && (
        <div
          className=""
        >
          Drop here
        </div>
      )}
    </div>
  );
};
export const ReportTemplateBuilder: React.FC<ReportTemplateBuilderProps> = ({ 
  templateId,
  onSave,
  onCancel,
  onPreview
}) => {
  const {
    builder,
    setBuilder,
    updateBuilder,
    addTemplate,
    updateTemplate,
    getTemplate,
  } = useTemplatesStore();
  const { charts } = useChartsStore();
  const { filterDefinitions } = useFiltersStore();
  // UI State
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ 
    open: false,
    message: '',
    severity: 'info'}
  });
  // Template state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  // Initialize builder
  useEffect(() => {
    if (templateId) {
      const existingTemplate = getTemplate(templateId);
      if (existingTemplate) {
        const newBuilder: TemplateBuilder = {
          template: existingTemplate,
          currentSection: null,
          draggedItem: null,
          clipboard: null,
          history: [],
          historyIndex: -1,
          isDirty: false,
          isValid: true,
          errors: [],
        };
        setBuilder(newBuilder);
        setTemplateName(existingTemplate.name);
        setTemplateDescription(existingTemplate.description);
        setTemplateCategory(existingTemplate.metadata.category);
      }
    } else {
      // Create new template
      const newTemplate: ReportTemplate = {
        id: generateId(),
        name: 'New Template',
        description: '',
        reportType: 'custom',
        layout: {
          type: 'custom',
          grid: {
            columns: 12,
            rows: 10,
            gap: 16,
            autoFlow: 'row',
          },
          responsive: true,
          theme: 'default',
          spacing: {
            top: 16,
            right: 16,
            bottom: 16,
            left: 16,
          },
          breakpoints: {
            xs: { columns: 1 },
            sm: { columns: 2 },
            md: { columns: 4 },
            lg: { columns: 6 },
            xl: { columns: 12 },
          },
        },
        filters: [],
        charts: [],
        tables: [],
        sections: [],
        metadata: {
          category: 'custom',
          tags: [],
          difficulty: 'beginner',
          estimatedTime: 30,
          dataRequirements: [],
          dependencies: [],
          changelog: [],
        },
        permissions: {
          view: ['*'],
          edit: ['owner'],
          delete: ['owner'],
          share: ['owner'],
          export: ['*'],
        },
        createdBy: 'current-user', // TODO: Get from auth context
        workspaceId: 'current-workspace', // TODO: Get from workspace context
        isPublic: false,
        isDefault: false,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newBuilder: TemplateBuilder = {
        template: newTemplate,
        currentSection: null,
        draggedItem: null,
        clipboard: null,
        history: [],
        historyIndex: -1,
        isDirty: false,
        isValid: true,
        errors: [],
      };
      setBuilder(newBuilder);
    }
  }, [templateId, getTemplate, setBuilder]);
  // Handle drag and drop
  const handleDrop = useCallback(
    (item: DraggedItem, position: number) => {
      if (!builder) return;
      const newSection: TemplateSection = {
        id: generateId(),
        type: item.type as any,
        title: item.data.title || `New ${item.type}`,
        content: item.data,
        layout: {
          span: { columns: 6, rows: 4 },
          alignment: { horizontal: 'stretch', vertical: 'stretch' },
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
          margin: { top: 0, right: 0, bottom: 16, left: 0 },
        },
        visibility: {
          conditions: [],
          roles: [],
          permissions: [],
        },
        order: position,
      };
      const updatedSections = [...builder.template.sections];
      updatedSections.splice(position, 0, newSection);
      // Update order for subsequent sections
      updatedSections.forEach((section, index) => {
        section.order = index;
      });
      const historyEntry: HistoryEntry = {
        action: 'add',
        target: newSection.id,
        before: null,
        after: newSection,
        timestamp: new Date(),
      };
      updateBuilder({ 
        template: {
          ...builder.template,
          sections: updatedSections}
        },
        history: [
          ...builder.history.slice(0, builder.historyIndex + 1),
          historyEntry,
        ],
        historyIndex: builder.historyIndex + 1,
        isDirty: true}
      setSnackbar({ 
        open: true}
        message: `${item.type} section added successfully`,
        severity: 'success'}
    },
    [builder, updateBuilder]
  );
  // Handle section selection
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSection(sectionId);
    setPropertiesOpen(true);
  }, []);
  // Handle section deletion
  const handleSectionDelete = useCallback(
    (sectionId: string) => {
      if (!builder) return;
      const sectionIndex = builder.template.sections.findIndex(
        (s) => s.id === sectionId
      );
      if (sectionIndex === -1) return;
      const section = builder.template.sections[sectionIndex];
      const updatedSections = builder.template.sections.filter(
        (s) => s.id !== sectionId
      );
      // Update order for subsequent sections
      updatedSections.forEach((section, index) => {
        section.order = index;
      });
      const historyEntry: HistoryEntry = {
        action: 'remove',
        target: sectionId,
        before: section,
        after: null,
        timestamp: new Date(),
      };
      updateBuilder({ 
        template: {
          ...builder.template,
          sections: updatedSections}
        },
        history: [
          ...builder.history.slice(0, builder.historyIndex + 1),
          historyEntry,
        ],
        historyIndex: builder.historyIndex + 1,
        isDirty: true}
      if (selectedSection === sectionId) {
        setSelectedSection(null);
        setPropertiesOpen(false);
      }
      setSnackbar({ 
        open: true,
        message: 'Section deleted successfully',
        severity: 'success'}
      });
    },
    [builder, updateBuilder, selectedSection]
  );
  // Handle undo/redo
  const handleUndo = useCallback(() => {
    if (!builder || builder.historyIndex < 0) return;
    const historyEntry = builder.history[builder.historyIndex];
    let updatedTemplate = { ...builder.template };
    switch (historyEntry.action) {
      case 'add':
        updatedTemplate.sections = updatedTemplate.sections.filter(
          (s) => s.id !== historyEntry.target
        );
        break;
      case 'remove':
        if (historyEntry.before) {
          updatedTemplate.sections.push(historyEntry.before as TemplateSection);
          updatedTemplate.sections.sort((a, b) => a.order - b.order);
        }
        break;
      case 'modify':
        const sectionIndex = updatedTemplate.sections.findIndex(
          (s) => s.id === historyEntry.target
        );
        if (sectionIndex !== -1 && historyEntry.before) {
          updatedTemplate.sections[sectionIndex] =
            historyEntry.before as TemplateSection;
        }
        break;
    }
    updateBuilder({ 
      template: updatedTemplate,
      historyIndex: builder.historyIndex - 1,
      isDirty: true}
    });
  }, [builder, updateBuilder]);
  const handleRedo = useCallback(() => {
    if (!builder || builder.historyIndex >= builder.history.length - 1) return;
    const historyEntry = builder.history[builder.historyIndex + 1];
    let updatedTemplate = { ...builder.template };
    switch (historyEntry.action) {
      case 'add':
        if (historyEntry.after) {
          updatedTemplate.sections.push(historyEntry.after as TemplateSection);
          updatedTemplate.sections.sort((a, b) => a.order - b.order);
        }
        break;
      case 'remove':
        updatedTemplate.sections = updatedTemplate.sections.filter(
          (s) => s.id !== historyEntry.target
        );
        break;
      case 'modify':
        const sectionIndex = updatedTemplate.sections.findIndex(
          (s) => s.id === historyEntry.target
        );
        if (sectionIndex !== -1 && historyEntry.after) {
          updatedTemplate.sections[sectionIndex] =
            historyEntry.after as TemplateSection;
        }
        break;
    }
    updateBuilder({ 
      template: updatedTemplate,
      historyIndex: builder.historyIndex + 1,
      isDirty: true}
    });
  }, [builder, updateBuilder]);
  // Handle save
  const handleSave = useCallback(() => {
    if (!builder) return;
    const updatedTemplate: ReportTemplate = {
      ...builder.template,
      name: templateName,
      description: templateDescription,
      metadata: {
        ...builder.template.metadata,
        category: templateCategory,
      },
      updatedAt: new Date(),
    };
    if (templateId) {
      updateTemplate(templateId, updatedTemplate);
    } else {
      addTemplate(updatedTemplate);
    }
    updateBuilder({ 
      template: updatedTemplate,
      isDirty: false}
    });
    setSaveDialogOpen(false);
    onSave?.(updatedTemplate);
    setSnackbar({ 
      open: true,
      message: 'Template saved successfully',
      severity: 'success'}
    });
  }, [
    builder,
    templateName,
    templateDescription,
    templateCategory,
    templateId,
    updateTemplate,
    addTemplate,
    updateBuilder,
    onSave,
  ]);
  // Handle preview
  const handlePreview = useCallback(() => {
    if (!builder) return;
    const previewTemplate: ReportTemplate = {
      ...builder.template,
      name: templateName,
      description: templateDescription,
      metadata: {
        ...builder.template.metadata,
        category: templateCategory,
      },
    };
    onPreview?.(previewTemplate);
    setPreviewMode(true);
  }, [builder, templateName, templateDescription, templateCategory, onPreview]);
  if (!builder) {
    return (
      <div
        className=""
      >
        <Progress className="" />
      </div>
    );
  }
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="">
        {/* Sidebar */}
        <Drawer
          
          anchor="left"
          open={drawerOpen}
          className="">
          <div className="">
            <div  gutterBottom>
              Template Builder
            </div>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
            >
              <Tab label="Components" />
              <Tab label="Settings" />
            </Tabs>
          </div>
          <Separator />
          {activeTab === 0 && (
            <div className="">
              <div  gutterBottom>
                Sections
              </div>
              <List dense>
                <DraggableItem
                  type="section"
                  >
                  <Button>
                    <div>
                      <Inputs />
                    </div>
                    <div primary="Header" />
                  </ListItemButton>
                </DraggableItem>
                <DraggableItem
                  type="section"
                  >
                  <Button>
                    <div>
                      <Assessment />
                    </div>
                    <div primary="Summary" />
                  </ListItemButton>
                </DraggableItem>
                <DraggableItem
                  type="section"
                  >
                  <Button>
                    <div>
                      <BarChart />
                    </div>
                    <div primary="Charts" />
                  </ListItemButton>
                </DraggableItem>
                <DraggableItem
                  type="section"
                  >
                  <Button>
                    <div>
                      <TableChart />
                    </div>
                    <div primary="Tables" />
                  </ListItemButton>
                </DraggableItem>
                <DraggableItem
                  type="section"
                  >
                  <Button>
                    <div>
                      <Inputs />
                    </div>
                    <div primary="Text" />
                  </ListItemButton>
                </DraggableItem>
              </List>
              <Separator className="" />
              <div  gutterBottom>
                Charts
              </div>
              <List dense>
                {Object.entries(charts)
                  .slice(0, 5)
                  .map(([id, chart]) => (
                    <DraggableItem
                      key={id}
                      type="chart"
                      >
                      <Button>
                        <div>
                          <BarChart />
                        </div>
                        <div
                          primary={chart.title}
                          secondary={chart.type}
                        />
                      </ListItemButton>
                    </DraggableItem>
                  ))}
              </List>
            </div>
          )}
          {activeTab === 1 && (
            <div className="">
              <Input
                fullWidth
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                margin="normal"
              />
              <Input
                fullWidth
                label="Description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                multiline
                rows={3}
                margin="normal"
              />
              <div fullWidth margin="normal">
                <Label>Category</Label>
                <Select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                >
                  <MenuItem value="patient-outcomes">Patient Outcomes</MenuItem>
                  <MenuItem value="pharmacist-interventions">
                    Pharmacist Interventions
                  </MenuItem>
                  <MenuItem value="therapy-effectiveness">
                    Therapy Effectiveness
                  </MenuItem>
                  <MenuItem value="quality-improvement">
                    Quality Improvement
                  </MenuItem>
                  <MenuItem value="regulatory-compliance">
                    Regulatory Compliance
                  </MenuItem>
                  <MenuItem value="cost-effectiveness">
                    Cost Effectiveness
                  </MenuItem>
                  <MenuItem value="operational-efficiency">
                    Operational Efficiency
                  </MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </div>
              <Separator className="" />
              <div  gutterBottom>
                Layout Settings
              </div>
              <FormControlLabel
                control={
                  <Switch}
                    checked={builder.template.layout.responsive}
                    onChange={(e) =>
                      updateBuilder({ 
                        template: {
                          ...builder.template,
                          layout: {
                            ...builder.template.layout}
                            responsive: e.target.checked,}
                          },
                        }}
                    }
                  />
                }
                label="Responsive Layout"
              />
              <div  gutterBottom className="">
                Grid Columns: {builder.template.layout.grid.columns}
              </div>
              <Slider
                value={builder.template.layout.grid.columns}
                onChange={(_, value) =>
                  updateBuilder({ 
                    template: {
                      ...builder.template,
                      layout: {
                        ...builder.template.layout,
                        grid: {
                          ...builder.template.layout.grid}
                          columns: value as number,}
                        },
                      },
                    }}
                }
                min={1}
                max={24}
                step={1}
                marks
              />
            </div>
          )}
        </Drawer>
        {/* Main Content */}
        <div className="">
          {/* Toolbar */}
          <header position="static" color="default" >
            <div>
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(!drawerOpen)}
              >
                <ViewModule />
              </IconButton>
              <div  className="">
                {templateName || 'New Template'}
              </div>
              <div direction="row" spacing={1}>
                <Tooltip title="Undo">
                  <span>
                    <IconButton
                      onClick={handleUndo}
                      disabled={builder.historyIndex < 0}
                    >
                      <Undo />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Redo">
                  <span>
                    <IconButton
                      onClick={handleRedo}
                      disabled={
                        builder.historyIndex >= builder.history.length - 1}
                      }
                    >
                      <Redo />
                    </IconButton>
                  </span>
                </Tooltip>
                <Separator orientation="vertical" flexItem />
                <Button
                  startIcon={<Preview />}
                  onClick={handlePreview}
                  
                >
                  Preview
                </Button>
                <Button
                  startIcon={<Save />}
                  onClick={() => setSaveDialogOpen(true)}
                  
                  disabled={!builder.isDirty}
                >
                  Save
                </Button>
                <IconButton onClick={onCancel}>
                  <Close />
                </IconButton>
              </div>
            </div>
          </header>
          {/* Canvas */}
          <div
            className=""
          >
            <div className="">
              <div container spacing={2}>
                {builder.template.sections.length === 0 ? (
                  <div item xs={12}>
                    <DropZone onDrop={handleDrop} position={0}>
                      <div
                        className=""
                      >
                        <ViewModule className="" />
                        <div  gutterBottom>
                          Start Building Your Template
                        </div>
                        <div  textAlign="center">
                          Drag components from the sidebar to create your custom
                          report template
                        </div>
                      </div>
                    </DropZone>
                  </div>
                ) : (
                  builder.template.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                      <div
                        key={section.id}
                        item
                        xs={12}
                        md={section.layout.span.columns}
                      >
                        <DropZone onDrop={handleDrop} position={index}>
                          <Card
                            className="" onClick={() => handleSectionSelect(section.id)}
                          >
                            <CardContent>
                              <div
                                className=""
                              >
                                <DragIndicator
                                  className=""
                                />
                                <div  className="">
                                  {section.title}
                                </div>
                                <Chip
                                  label={section.type}
                                  size="small"
                                  color="primary"
                                  
                                />
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {section.type === 'header' &&
                                  'Header section with title and metadata'}
                                {section.type === 'summary' &&
                                  'Summary metrics and KPIs'}
                                {section.type === 'charts' &&
                                  'Data visualizations and charts'}
                                {section.type === 'tables' &&
                                  'Tabular data display'}
                                {section.type === 'text' &&
                                  'Custom text content'}
                              </div>
                            </CardContent>
                            <CardActions>
                              <IconButton
                                size="small"
                                >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                >
                                <Delete />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </DropZone>
                        {index < builder.template.sections.length - 1 && (
                          <DropZone onDrop={handleDrop} position={index + 1}>
                            <div className="" />
                          </DropZone>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Properties Panel */}
        <Drawer
          
          anchor="right"
          open={propertiesOpen}
          onClose={() => setPropertiesOpen(false)}
          className="">
          <div className="">
            <div
              className=""
            >
              <div >Section Properties</div>
              <IconButton onClick={() => setPropertiesOpen(false)}>
                <Close />
              </IconButton>
            </div>
            {selectedSection && (
              <SectionPropertiesPanel
                section={
                  builder.template.sections.find(
                    (s) => s.id === selectedSection
                  )!}
                }
                onUpdate={(updatedSection) => {
                  const updatedSections = builder.template.sections.map((s) =>
                    s.id === selectedSection ? updatedSection : s
                  );
                  const historyEntry: HistoryEntry = {
                    action: 'modify',
                    target: selectedSection,
                    before: builder.template.sections.find(
                      (s) => s.id === selectedSection
                    )!,
                    after: updatedSection,
                    timestamp: new Date(),}
                  };
                  updateBuilder({ 
                    template: {
                      ...builder.template,
                      sections: updatedSections}
                    },
                    history: [
                      ...builder.history.slice(0, builder.historyIndex + 1),
                      historyEntry,
                    ],
                    historyIndex: builder.historyIndex + 1,
                    isDirty: true}
              />
            )}
          </div>
        </Drawer>
        {/* Save Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Save Template</DialogTitle>
          <DialogContent>
            <Input
              fullWidth
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              margin="normal"
              required
            />
            <Input
              fullWidth
              label="Description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
            <div fullWidth margin="normal">
              <Label>Category</Label>
              <Select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              >
                <MenuItem value="patient-outcomes">Patient Outcomes</MenuItem>
                <MenuItem value="pharmacist-interventions">
                  Pharmacist Interventions
                </MenuItem>
                <MenuItem value="therapy-effectiveness">
                  Therapy Effectiveness
                </MenuItem>
                <MenuItem value="quality-improvement">
                  Quality Improvement
                </MenuItem>
                <MenuItem value="regulatory-compliance">
                  Regulatory Compliance
                </MenuItem>
                <MenuItem value="cost-effectiveness">
                  Cost Effectiveness
                </MenuItem>
                <MenuItem value="operational-efficiency">
                  Operational Efficiency
                </MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </div>
            <div className="">
              <div  gutterBottom>
                Template Summary
              </div>
              <div  color="text.secondary">
                Sections: {builder.template.sections.length}
              </div>
              <div  color="text.secondary">
                Charts: {builder.template.charts.length}
              </div>
              <div  color="text.secondary">
                Tables: {builder.template.tables.length}
              </div>
            </div>
            {builder.errors.length > 0 && (
              <Alert severity="error" className="">
                <div  gutterBottom>
                  Validation Errors:
                </div>
                {builder.errors.map((error, index) => (
                  <div key={index} >
                    • {error.message}
                  </div>
                ))}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              
              disabled={!templateName.trim() || builder.errors.length > 0}
            >
              Save Template
            </Button>
          </DialogActions>
        </Dialog>
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            className=""
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </DndProvider>
  );
};
// Section Properties Panel Component
interface SectionPropertiesPanelProps {
  section: TemplateSection;
  onUpdate: (section: TemplateSection) => void;
}
const SectionPropertiesPanel: React.FC<SectionPropertiesPanelProps> = ({ 
  section,
  onUpdate
}) => {
  const [localSection, setLocalSection] = useState(section);
  useEffect(() => {
    setLocalSection(section);
  }, [section]);
  const handleUpdate = (updates: Partial<TemplateSection>) => {
    const updatedSection = { ...localSection, ...updates };
    setLocalSection(updatedSection);
    onUpdate(updatedSection);
  };
  return (
    <div>
      <Input
        fullWidth
        label="Section Title"
        value={localSection.title}
        onChange={(e) => handleUpdate({ title: e.target.value })}
        margin="normal"
      />
      <div fullWidth margin="normal">
        <Label>Section Type</Label>
        <Select
          value={localSection.type}
          onChange={(e) =>}
            handleUpdate({ type: e.target.value as TemplateSection['type'] })
          }
        >
          <MenuItem value="header">Header</MenuItem>
          <MenuItem value="summary">Summary</MenuItem>
          <MenuItem value="charts">Charts</MenuItem>
          <MenuItem value="tables">Tables</MenuItem>
          <MenuItem value="text">Text</MenuItem>
        </Select>
      </div>
      <Accordion className="">
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Layout Settings</div>
        </AccordionSummary>
        <AccordionDetails>
          <div  gutterBottom>
            Column Span: {localSection.layout.span.columns}
          </div>
          <Slider
            value={localSection.layout.span.columns}
            onChange={(_, value) =>
              handleUpdate({ 
                layout: {
                  ...localSection.layout,
                  span: {
                    ...localSection.layout.span}
                    columns: value as number,}
                  },
                }}
            }
            min={1}
            max={12}
            step={1}
            marks
          />
          <div  gutterBottom className="">
            Row Span: {localSection.layout.span.rows}
          </div>
          <Slider
            value={localSection.layout.span.rows}
            onChange={(_, value) =>
              handleUpdate({ 
                layout: {
                  ...localSection.layout,
                  span: {
                    ...localSection.layout.span}
                    rows: value as number,}
                  },
                }}
            }
            min={1}
            max={10}
            step={1}
            marks
          />
          <div fullWidth margin="normal">
            <Label>Horizontal Alignment</Label>
            <Select
              value={localSection.layout.alignment.horizontal}
              onChange={(e) =>
                handleUpdate({ 
                  layout: {
                    ...localSection.layout,
                    alignment: {
                      ...localSection.layout.alignment}
                      horizontal: e.target.value as any,}
                    },
                  }}
              }
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
              <MenuItem value="stretch">Stretch</MenuItem>
            </Select>
          </div>
          <div fullWidth margin="normal">
            <Label>Vertical Alignment</Label>
            <Select
              value={localSection.layout.alignment.vertical}
              onChange={(e) =>
                handleUpdate({ 
                  layout: {
                    ...localSection.layout,
                    alignment: {
                      ...localSection.layout.alignment}
                      vertical: e.target.value as any,}
                    },
                  }}
              }
            >
              <MenuItem value="top">Top</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="bottom">Bottom</MenuItem>
              <MenuItem value="stretch">Stretch</MenuItem>
            </Select>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Visibility Settings</div>
        </AccordionSummary>
        <AccordionDetails>
          <div  color="text.secondary" gutterBottom>
            Configure when this section should be visible based on user roles,
            permissions, or data conditions.
          </div>
          <FormControlLabel
            control={
              <Switch}
                checked={localSection.visibility.conditions.length === 0}
                onChange={(e) =>
                  handleUpdate({ 
                    visibility: {
                      ...localSection.visibility}
                      conditions: e.target.checked ? [] : ['always-visible'],}
                    }}
                }
              />
            }
            label="Always Visible"
          />
          {localSection.visibility.conditions.length > 0 && (
            <Input
              fullWidth
              label="Visibility Conditions"
              value={localSection.visibility.conditions.join(', ')}
              onChange={(e) =>
                handleUpdate({ 
                  visibility: {
                    ...localSection.visibility,
                    conditions: e.target.value
                      .split(',')
                      .map((c) => c.trim()) })
                      .filter(Boolean),}
                  }}
              }
              margin="normal"
              helperText="Enter conditions separated by commas"
            />
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Content Settings</div>
        </AccordionSummary>
        <AccordionDetails>
          {localSection.type === 'text' && (
            <Input
              fullWidth
              label="Text Content"
              value={(localSection.content as any)?.text || ''}
              onChange={(e) =>
                handleUpdate({ 
                  content: {
                    ...localSection.content}
                    text: e.target.value,}
                  }}
              }
              multiline
              rows={4}
              margin="normal"
            />
          )}
          {localSection.type === 'charts' && (
            <div>
              <div  gutterBottom>
                Chart Configuration
              </div>
              <div fullWidth margin="normal">
                <Label>Chart Type</Label>
                <Select
                  value={(localSection.content as any)?.chartType || 'bar'}
                  onChange={(e) =>
                    handleUpdate({ 
                      content: {
                        ...localSection.content}
                        chartType: e.target.value,}
                      }}
                  }
                >
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="area">Area Chart</MenuItem>
                  <MenuItem value="scatter">Scatter Plot</MenuItem>
                </Select>
              </div>
            </div>
          )}
          {localSection.type === 'summary' && (
            <div>
              <div  gutterBottom>
                Summary Metrics
              </div>
              <Input
                fullWidth
                label="Metric Keys"
                value={(localSection.content as any)?.metrics?.join(', ') || ''}
                onChange={(e) =>
                  handleUpdate({ 
                    content: {
                      ...localSection.content,
                      metrics: e.target.value
                        .split(',')
                        .map((m) => m.trim()) })
                        .filter(Boolean),}
                    }}
                }
                margin="normal"
                helperText="Enter metric keys separated by commas"
              />
            </div>
          )}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};
// Properties Panel Component
const PropertiesPanel: React.FC<{ selectedSection: string | null }> = ({ selectedSection }) => (
  <Drawer
    anchor="right"
    open={!!selectedSection}
    
    className="">
    <div className="">
      <div  gutterBottom>
        Section Properties
      </div>
            {selectedSection && (
              <div>
                {/* Section properties form would go here */}
                <div >
                  Properties for section: {selectedSection}
                </div>
              </div>
            )}
          </div>
        </Drawer>
        {/* Save Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Save Template</DialogTitle>
          <DialogContent>
            <Input
              fullWidth
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              margin="normal"
            />
            <Input
              fullWidth
              label="Description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
            <div fullWidth margin="normal">
              <Label>Category</Label>
              <Select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              >
                <MenuItem value="patient-outcomes">Patient Outcomes</MenuItem>
                <MenuItem value="pharmacist-interventions">
                  Pharmacist Interventions
                </MenuItem>
                <MenuItem value="therapy-effectiveness">
                  Therapy Effectiveness
                </MenuItem>
                <MenuItem value="quality-improvement">
                  Quality Improvement
                </MenuItem>
                <MenuItem value="regulatory-compliance">
                  Regulatory Compliance
                </MenuItem>
                <MenuItem value="cost-effectiveness">
                  Cost Effectiveness
                </MenuItem>
                <MenuItem value="operational-efficiency">
                  Operational Efficiency
                </MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            className=""
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </DndProvider>
  );
};
export default ReportTemplateBuilder;
