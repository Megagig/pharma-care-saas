import ReportTemplateBuilder from './ReportTemplateBuilder';

import TemplatePreview from './TemplatePreview';

import TemplateMarketplace from './TemplateMarketplace';

import TemplateSharing from './TemplateSharing';

import { Button, Input, Label, Card, CardContent, Select, Avatar, Tabs } from '@/components/ui/button';

interface TemplateManagementProps {
    onTemplateSelect?: (template: ReportTemplate) => void;
}
type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'created' | 'updated' | 'category' | 'usage';
type FilterBy = 'all' | 'my-templates' | 'shared' | 'public' | 'favorites';
export const TemplateManagement: React.FC<TemplateManagementProps> = ({ 
    onTemplateSelect
}) => {
    const {
        templates,
        categories,
        selectedTemplate,
        setSelectedTemplate,
        addTemplate,
        updateTemplate,
        removeTemplate,
        getUserTemplates,
        getPublicTemplates,
        getFeaturedTemplates,
        getTemplatesByCategory,
    } = useTemplatesStore();
    // UI State
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortBy>('updated');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    // Dialog states
    const [builderOpen, setBuilderOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [marketplaceOpen, setMarketplaceOpen] = useState(false);
    const [sharingOpen, setSharingOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    // Menu states
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuTemplate, setMenuTemplate] = useState<ReportTemplate | null>(null);
    // Other states
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
    }>({ 
        open: false,
        message: '',
        severity: 'info'}
    });
    // Load favorites from localStorage
    useEffect(() => {
        const savedFavorites = localStorage.getItem('template-favorites');
        if (savedFavorites) {
            setFavorites(new Set(JSON.parse(savedFavorites)));
        }
    }, []);
    // Save favorites to localStorage
    const saveFavorites = useCallback((newFavorites: Set<string>) => {
        setFavorites(newFavorites);
        localStorage.setItem('template-favorites', JSON.stringify(Array.from(newFavorites)));
    }, []);
    // Filter and sort templates
    const filteredTemplates = React.useMemo(() => {
        let result = Object.values(templates);
        // Apply filter
        switch (filterBy) {
            case 'my-templates':
                result = getUserTemplates('current-user'); // TODO: Get from auth context
                break;
            case 'shared':
                result = result.filter(t => !t.isPublic && t.createdBy !== 'current-user');
                break;
            case 'public':
                result = getPublicTemplates();
                break;
            case 'favorites':
                result = result.filter(t => favorites.has(t.id));
                break;
        }
        // Apply category filter
        if (selectedCategory !== 'all') {
            result = result.filter(t => t.metadata.category === selectedCategory);
        }
        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.metadata.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }
        // Apply sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'updated':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'category':
                    return a.metadata.category.localeCompare(b.metadata.category);
                case 'usage':
                    // TODO: Implement usage tracking
                    return 0;
                default:
                    return 0;
            }
        });
        return result;
    }, [templates, filterBy, selectedCategory, searchQuery, sortBy, getUserTemplates, getPublicTemplates, favorites]);
    // Handle template actions
    const handleTemplateEdit = useCallback((template: ReportTemplate) => {
        setSelectedTemplate(template.id);
        setBuilderOpen(true);
    }, [setSelectedTemplate]);
    const handleTemplatePreview = useCallback((template: ReportTemplate) => {
        setSelectedTemplate(template.id);
        setPreviewOpen(true);
    }, [setSelectedTemplate]);
    const handleTemplateDelete = useCallback((template: ReportTemplate) => {
        setMenuTemplate(template);
        setDeleteDialogOpen(true);
        setAnchorEl(null);
    }, []);
    const handleTemplateShare = useCallback((template: ReportTemplate) => {
        setSelectedTemplate(template.id);
        setSharingOpen(true);
        setAnchorEl(null);
    }, [setSelectedTemplate]);
    const handleTemplateDuplicate = useCallback((template: ReportTemplate) => {
        const duplicatedTemplate: ReportTemplate = {
            ...template,
            id: `${template.id}-copy-${Date.now()}`,
            name: `${template.name} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user', // TODO: Get from auth context
            isPublic: false,
        };
        addTemplate(duplicatedTemplate);
        setAnchorEl(null);
        setSnackbar({ 
            open: true,
            message: 'Template duplicated successfully',
            severity: 'success'}
        });
    }, [addTemplate]);
    const handleFavoriteToggle = useCallback((templateId: string) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(templateId)) {
            newFavorites.delete(templateId);
        } else {
            newFavorites.add(templateId);
        }
        saveFavorites(newFavorites);
    }, [favorites, saveFavorites]);
    const confirmDelete = useCallback(() => {
        if (menuTemplate) {
            removeTemplate(menuTemplate.id);
            setDeleteDialogOpen(false);
            setMenuTemplate(null);
            setSnackbar({ 
                open: true,
                message: 'Template deleted successfully',
                severity: 'success'}
            });
        }
    }, [menuTemplate, removeTemplate]);
    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, template: ReportTemplate) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuTemplate(template);
    }, []);
    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
        setMenuTemplate(null);
    }, []);
    const renderTemplateCard = useCallback((template: ReportTemplate) => (
        <Card
            key={template.id}
            className=""
                transition: 'all 0.2s ease',
            onClick={() => onTemplateSelect?.(template)}
        >
            <CardMedia
                className=""
            >
                <Assessment className="" />
                <IconButton
                    className="" size="small"
                    >
                    {favorites.has(template.id) ? (
                        <Star className="" />
                    ) : (
                        <StarBorder />
                    )}
                </IconButton>
            </CardMedia>
            <CardContent className="">
                <div className="">
                    <div  className="">
                        {template.name}
                    </div>
                    <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template)}
                    >
                        <MoreVert />
                    </IconButton>
                </div>
                <div
                    
                    color="text.secondary"
                    className=""
                >
                    {template.description || 'No description available'}
                </div>
                <div className="">
                    <Chip
                        label={template.metadata.category}
                        size="small"
                        color="primary"
                        
                    />
                    {template.isPublic && (
                        <Chip
                            label="Public"
                            size="small"
                            color="success"
                            
                            icon={<Public />}
                        />
                    )}
                    {template.metadata.tags.slice(0, 2).map(tag => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            
                        />
                    ))}
                </div>
                <div className="">
                    <div className="">
                        <Avatar className="">
                            <Person className="" />
                        </Avatar>
                        <div  color="text.secondary">
                            {template.createdBy}
                        </div>
                    </div>
                    <div  color="text.secondary">
                        {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                    </div>
                </div>
            </CardContent>
            <CardActions>
                <Button
                    size="small"
                    startIcon={<Visibility />}
                    >
                    Preview
                </Button>
                <Button
                    size="small"
                    startIcon={<Edit />}
                    >
                    Edit
                </Button>
            </CardActions>
        </Card>
    ), [onTemplateSelect, favorites, handleFavoriteToggle, handleMenuOpen, handleTemplatePreview, handleTemplateEdit]);
    const renderTemplateList = useCallback((template: ReportTemplate) => (
        <div
            key={template.id}
            button
            onClick={() => onTemplateSelect?.(template)}
            className="">
            <div>
                <Assessment />
            </div>
            <div
                primary={
                    <div className="">}
                        <div >{template.name}</div>
                        <Chip
                            label={template.metadata.category}
                            size="small"
                            color="primary"
                            
                        />
                        {template.isPublic && (
                            <Chip
                                label="Public"
                                size="small"
                                color="success"
                                
                                icon={<Public />}
                            />
                        )}
                    </div>
                }
                secondary={
                    <div>
                        <div  color="text.secondary" className="">}
                            {template.description || 'No description available'}
                        </div>
                        <div  color="text.secondary">
                            Created by {template.createdBy} • {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                        </div>
                    </div>
                }
            />
            <divSecondaryAction>
                <IconButton
                    >
                    {favorites.has(template.id) ? (
                        <Star className="" />
                    ) : (
                        <StarBorder />
                    )}
                </IconButton>
                <IconButton onClick={(e) => handleMenuOpen(e, template)}>
                    <MoreVert />
                </IconButton>
            </ListItemSecondaryAction>
        </div>
    ), [onTemplateSelect, favorites, handleFavoriteToggle, handleMenuOpen]);
    return (
        <div className="">
            {/* Header */}
            <div className="">
                <div className="">
                    <div >Template Management</div>
                    <Button
                        
                        startIcon={<Add />}
                        onClick={() => setBuilderOpen(true)}
                    >
                        Create Template
                    </Button>
                </div>
                <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
                    <Tab label="My Templates" />
                    <Tab label="Shared Templates" />
                    <Tab label="Marketplace" />
                </Tabs>
            </div>
            {/* Filters and Search */}
            <div className="">
                <div container spacing={2} alignItems="center">
                    <div item xs={12} md={4}>
                        <Input
                            fullWidth
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            
                        />
                    </div>
                    <div item xs={6} md={2}>
                        <div fullWidth>
                            <Label>Filter</Label>
                            <Select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                            >
                                <MenuItem value="all">All Templates</MenuItem>
                                <MenuItem value="my-templates">My Templates</MenuItem>
                                <MenuItem value="shared">Shared with Me</MenuItem>
                                <MenuItem value="public">Public</MenuItem>
                                <MenuItem value="favorites">Favorites</MenuItem>
                            </Select>
                        </div>
                    </div>
                    <div item xs={6} md={2}>
                        <div fullWidth>
                            <Label>Category</Label>
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                <MenuItem value="patient-outcomes">Patient Outcomes</MenuItem>
                                <MenuItem value="pharmacist-interventions">Pharmacist Interventions</MenuItem>
                                <MenuItem value="therapy-effectiveness">Therapy Effectiveness</MenuItem>
                                <MenuItem value="quality-improvement">Quality Improvement</MenuItem>
                                <MenuItem value="regulatory-compliance">Regulatory Compliance</MenuItem>
                                <MenuItem value="cost-effectiveness">Cost Effectiveness</MenuItem>
                                <MenuItem value="operational-efficiency">Operational Efficiency</MenuItem>
                                <MenuItem value="custom">Custom</MenuItem>
                            </Select>
                        </div>
                    </div>
                    <div item xs={6} md={2}>
                        <div fullWidth>
                            <Label>Sort by</Label>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                            >
                                <MenuItem value="updated">Last Updated</MenuItem>
                                <MenuItem value="created">Date Created</MenuItem>
                                <MenuItem value="name">Name</MenuItem>
                                <MenuItem value="category">Category</MenuItem>
                                <MenuItem value="usage">Usage</MenuItem>
                            </Select>
                        </div>
                    </div>
                    <div item xs={6} md={2}>
                        <div className="">
                            <IconButton
                                onClick={() => setViewMode('grid')}
                                color={viewMode === 'grid' ? 'primary' : 'default'}
                            >
                                <ViewModule />
                            </IconButton>
                            <IconButton
                                onClick={() => setViewMode('list')}
                                color={viewMode === 'list' ? 'primary' : 'default'}
                            >
                                <ViewList />
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
            {/* Content */}
            <div className="">
                {activeTab === 0 && (
                    <div>
                        {filteredTemplates.length === 0 ? (
                            <div className="">
                                <Assessment className="" />
                                <div  gutterBottom>
                                    No templates found
                                </div>
                                <div  color="text.secondary" className="">
                                    {searchQuery || filterBy !== 'all' || selectedCategory !== 'all'
                                        ? 'Try adjusting your search or filters'
                                        : 'Create your first template to get started'
                                    }
                                </div>
                                <Button
                                    
                                    startIcon={<Add />}
                                    onClick={() => setBuilderOpen(true)}
                                >
                                    Create Template
                                </Button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div container spacing={2}>
                                {filteredTemplates.map(template => (
                                    <div item xs={12} sm={6} md={4} lg={3} key={template.id}>
                                        {renderTemplateCard(template)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <List>
                                {filteredTemplates.map(renderTemplateList)}
                            </List>
  