import { Button, Input, Label, Select, Alert, Separator } from '@/components/ui/button';
// Dynamic Filter Panel Component

interface FilterPanelProps {
  reportType: ReportType;
  filterGroups: FilterGroup[];
  onFiltersChange: (filters: ReportFilters) => void;
  onApplyFilters: () => void;
  className?: string;
}
const FilterPanel: React.FC<FilterPanelProps> = ({ 
  reportType,
  filterGroups,
  onFiltersChange,
  onApplyFilters,
  className
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const {
    getFilters,
    updateFilter,
    resetFilters,
    getValidationErrors,
    validateCurrentFilters,
    getPresetsForReport,
    applyPreset,
    savePreset,
  } = useFiltersStore();
  const currentFilters = getFilters(reportType);
  const validationErrors = getValidationErrors(reportType);
  const presets = getPresetsForReport(reportType);
  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({ 
      ...prev,
      [groupId]: !prev[groupId]}
    }));
  }, []);
  // Handle filter value changes
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      updateFilter(reportType, key, value);
      onFiltersChange(getFilters(reportType));
    },
    [reportType, updateFilter, onFiltersChange, getFilters]
  );
  // Handle date preset changes
  const handleDatePresetChange = useCallback(
    (preset: DatePreset) => {
      const dateRange = createDateRangeFromPreset(preset);
      handleFilterChange('dateRange', dateRange);
    },
    [handleFilterChange]
  );
  // Reset all filters
  const handleResetFilters = useCallback(() => {
    resetFilters(reportType);
    onFiltersChange(getFilters(reportType));
  }, [reportType, resetFilters, onFiltersChange, getFilters]);
  // Apply filters
  const handleApplyFilters = useCallback(() => {
    if (validateCurrentFilters(reportType)) {
      onApplyFilters();
    }
  }, [reportType, validateCurrentFilters, onApplyFilters]);
  // Render individual filter based on type
  const renderFilter = (filter: FilterDefinition) => {
    const value = (currentFilters as any)[filter.key];
    const error = validationErrors[filter.key];
    const commonProps = {
      fullWidth: true,
      size: 'small' as const,
      error: !!error,
      helperText: error || filter.helpText,
    };
    switch (filter.type) {
      case 'text':
        return (
          <Input
            {...commonProps}
            label={filter.label}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
          />
        );
      case 'number':
        return (
          <Input
            {...commonProps}
            label={filter.label}
            type="number"
            value={value || ''}
            onChange={(e) =>
              handleFilterChange(filter.key, Number(e.target.value))}
            }
            placeholder={filter.placeholder}
          />
        );
      case 'select':
        return (
          <div {...commonProps}>
            <Label>{filter.label}</Label>
            <Select
              value={value || ''}
              label={filter.label}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              {filter.options?.map((option) => (
                <MenuItem key={String(option.value)} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </div>
        );
      case 'multiselect':
        return (
          <div {...commonProps}>
            <Label>{filter.label}</Label>
            <Select
              multiple
              value={value || []}
              label={filter.label}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              renderValue={(selected) => (
                <div className="">
                  {(selected as string[]).map((val) => {
                    const option = filter.options?.find(
                      (opt) => opt.value === val
                    );
                    return (
                      <Chip}
                        key={val}
                        label={option?.label || val}
                        size="small"
                      />
                    );
                  })}
                </div>
              )}
            >
              {filter.options?.map((option) => (
                <MenuItem key={String(option.value)} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </div>
        );
      case 'autocomplete':
        return (
          <Autocomplete
            {...commonProps}
            options={filter.options || []}
            getOptionLabel={(option) => option.label}
            value={filter.options?.find((opt) => opt.value === value) || null}
            onChange={(_, newValue) =>
              handleFilterChange(filter.key, newValue?.value)}
            }
            renderInput={(params) => (
              <Input}
                {...params}
                label={filter.label}
                placeholder={filter.placeholder}
                error={!!error}
                helperText={error || filter.helpText}
              />
            )}
          />
        );
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={filter.label}
              value={value || null}
              onChange={(newValue) => handleFilterChange(filter.key, newValue)}
              slotProps={{
                textField: {
                  ...commonProps,
                  placeholder: filter.placeholder,}
                },
            />
          </LocalizationProvider>
        );
      case 'daterange':
        return (
          <div>
            <div  gutterBottom>
              {filter.label}
            </div>
            {/* Date Presets */}
            <div className="">
              <div  color="text.secondary" gutterBottom>
                Quick Select:
              </div>
              <div className="">
                {(['7d', '30d', '90d', '6months', '1year'] as DatePreset[]).map(
                  (preset) => (
                    <Chip
                      key={preset}
                      label={getDateRangeLabel(preset)}
                      size="small"
                      variant={value?.preset === preset ? 'filled' : 'outlined'}
                      onClick={() => handleDatePresetChange(preset)}
                      color={value?.preset === preset ? 'primary' : 'default'}
                    />
                  )
                )}
              </div>
            </div>
            {/* Custom Date Range */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <div className="">
                <DatePicker
                  label="Start Date"
                  value={value?.startDate || null}
                  onChange={(newValue) =>
                    handleFilterChange(filter.key, {
                      ...value,
                      startDate: newValue,
                      preset: 'custom',}
                    })
                  }
                  slotProps={{}
                    textField: { size: 'small', fullWidth: true },
                />
                <DatePicker
                  label="End Date"
                  value={value?.endDate || null}
                  onChange={(newValue) =>
                    handleFilterChange(filter.key, {
                      ...value,
                      endDate: newValue,
                      preset: 'custom',}
                    })
                  }
                  slotProps={{}
                    textField: { size: 'small', fullWidth: true },
                />
              </div>
            </LocalizationProvider>
          </div>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox}
                checked={value || false}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.checked)}
                }
              />
            }
            label={filter.label}
          />
        );
      case 'radio':
        return (
          <div component="fieldset" {...commonProps}>
            <div  gutterBottom>
              {filter.label}
            </div>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              {filter.options?.map((option) => (
                <FormControlLabel
                  key={String(option.value)}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </div>
        );
      case 'slider':
        const min =
          filter.validation?.find((v) => v.type === 'min')?.value || 0;
        const max =
          filter.validation?.find((v) => v.type === 'max')?.value || 100;
        return (
          <div>
            <div  gutterBottom>
              {filter.label}: {value || min}
            </div>
            <Slider
              value={value || min}
              min={min}
              max={max}
              onChange={(_, newValue) =>
                handleFilterChange(filter.key, newValue)}
              }
              valueLabelDisplay="auto"
              size="small"
            />
          </div>
        );
      default:
        return (
          <Alert severity="warning" size="small">
            Filter type "{filter.type}" not implemented
          </Alert>
        );
    }
  };
  return (
    <div className="" className={className}>
      {/* Header */}
      <div
        className=""
      >
        <div className="">
          <FilterIcon className="" />
          <div >Filters</div>
        </div>
        <div className="">
          <IconButton
            size="small"
            onClick={handleResetFilters}
            title="Reset Filters"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton size="small" title="Clear All">
            <ClearIcon />
          </IconButton>
        </div>
      </div>
      {/* Presets */}
      {presets.length > 0 && (
        <div className="">
          <div  gutterBottom>
            Saved Presets
          </div>
          <div className="">
            {presets.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.name}
                size="small"
                
                onClick={() => applyPreset(reportType, preset.id)}
              />
            ))}
          </div>
        </div>
      )}
      {/* Filter Groups */}
      {filterGroups.map((group, groupIndex) => (
        <div key={group.id} className="">
          {/* Group Header */}
          <div
            className=""
            onClick={
              group.collapsible ? () => toggleGroup(group.id) : undefined}
            }
          >
            <div  color="primary">
              {group.label}
            </div>
            {group.collapsible && (
              <IconButton size="small">
                {expandedGroups[group.id] ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            )}
          </div>
          {group.description && (
            <div  color="text.secondary" className="">
              {group.description}
            </div>
          )}
          {/* Group Filters */}
          <Collapse
            in={!group.collapsible || expandedGroups[group.id] !== false}
            timeout="auto"
            unmountOnExit
          >
            <div
              className=""
            >
              {group.filters.map((filter) => (
                <div key={filter.key}>{renderFilter(filter)}</div>
              ))}
            </div>
          </Collapse>
          {groupIndex < filterGroups.length - 1 && <Separator className="" />}
        </div>
      ))}
      {/* Actions */}
      <div
        className=""
      >
        <Button
          
          size="small"
          startIcon={<SaveIcon />}
          onClick={() => setShowPresetDialog(true)}
        >
          Save Preset
        </Button>
        <Button
          
          size="small"
          onClick={handleApplyFilters}
          disabled={Object.keys(validationErrors).length > 0}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
export default FilterPanel;
