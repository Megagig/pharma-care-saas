# MUI to Lucide Icon Mapping Guide

This document outlines the comprehensive mapping strategy for replacing Material-UI icons with Lucide React equivalents during the migration to shadcn/ui.

## Mapping Strategy

### 1. Direct Visual Equivalents
Icons that have direct visual matches between MUI and Lucide:
- `Add` → `Plus`
- `Edit` → `Edit`
- `Delete` → `Trash2`
- `Search` → `Search`
- `Download` → `Download`

### 2. Semantic Equivalents
Icons that convey the same meaning but may have slightly different visual styles:
- `MedicalServices` → `Stethoscope`
- `Science` → `Flask`
- `Psychology` → `Brain`
- `AdminPanelSettings` → `Shield`

### 3. Functional Equivalents
Icons that serve the same functional purpose:
- `NavigateNext` → `ChevronRight`
- `NavigateBefore` → `ChevronLeft`
- `ExpandMore` → `ChevronDown`
- `ExpandLess` → `ChevronUp`

## Icon Categories

### Navigation & Actions (25 icons)
| MUI Icon | Lucide Icon | Usage Context |
|----------|-------------|---------------|
| Add/AddIcon | Plus | Add buttons, create actions |
| Edit/EditIcon | Edit | Edit buttons, modify actions |
| Delete/DeleteIcon | Trash2 | Delete buttons, remove actions |
| Visibility/VisibilityIcon | Eye | View actions, show content |
| VisibilityOff | EyeOff | Hide actions, toggle visibility |
| Download/FileDownload | Download | Download actions |
| Upload | Upload | Upload actions |
| Search/SearchIcon | Search | Search inputs, find functionality |
| Filter/FilterList | Filter | Filter controls, data filtering |
| Sort/SortIcon | ArrowUpDown | Sort controls, data ordering |

### Status & Feedback (12 icons)
| MUI Icon | Lucide Icon | Usage Context |
|----------|-------------|---------------|
| Warning/WarningIcon | AlertTriangle | Warning states, caution messages |
| Error/ErrorIcon | AlertCircle | Error states, failure messages |
| Info/InfoIcon | Info | Information messages, help text |
| CheckCircle/Check | CheckCircle | Success states, completion |
| Close/Cancel | X | Close dialogs, cancel actions |
| Pending/Schedule | Clock | Pending states, time-related |

### Medical & Healthcare (10 icons)
| MUI Icon | Lucide Icon | Usage Context |
|----------|-------------|---------------|
| MedicalServices | Stethoscope | Medical features, healthcare |
| Science/ScienceIcon | Flask | Lab features, research |
| Medication/LocalPharmacy | Pill | Medication management |
| Assignment/AssignmentIcon | FileText | Reports, documents |
| Assessment/AssessmentIcon | BarChart3 | Analytics, assessments |
| Psychology/PsychologyIcon | Brain | Mental health, cognitive |

### Business & Admin (15 icons)
| MUI Icon | Lucide Icon | Usage Context |
|----------|-------------|---------------|
| Dashboard/DashboardIcon | LayoutDashboard | Main dashboard navigation |
| People/PeopleIcon | Users | User management |
| Person/PersonIcon | User | Individual user |
| AdminPanelSettings | Shield | Admin features, security |
| Analytics/AnalyticsIcon | BarChart3 | Analytics, reporting |
| TrendingUp/TrendingUpIcon | TrendingUp | Positive trends |
| TrendingDown/TrendingDownIcon | TrendingDown | Negative trends |

## Fallback Strategy

### 1. No Direct Equivalent
When no direct Lucide equivalent exists:
1. Use the closest semantic match
2. Use a generic icon (Info) with a warning
3. Create a custom SVG icon if necessary

### 2. Multiple MUI Icons → Single Lucide Icon
Some Lucide icons serve multiple MUI icon purposes:
- `FileText` serves both `Assignment` and `Notes`
- `BarChart3` serves both `Assessment` and `Analytics`
- `Users` serves both `People` and `SupervisorAccount`

### 3. Icon Size Consistency
- Default size: 24px (matches MUI default)
- Small size: 20px
- Large size: 32px
- Custom sizes preserved from original implementation

## Implementation Guidelines

### 1. Import Strategy
```typescript
// Before (MUI)
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// After (Lucide via IconMapper)
import { IconMapper } from '@/components/migration/IconMapper';

// Usage
<IconMapper muiIconName="Add" size={24} />
<IconMapper muiIconName="Edit" className="text-blue-500" />
```

### 2. Direct Import (Preferred for new code)
```typescript
import { Plus, Edit } from 'lucide-react';

// Usage
<Plus size={24} />
<Edit className="text-blue-500" />
```

### 3. Accessibility Preservation
All icon replacements must maintain:
- `aria-label` attributes
- `role` attributes where applicable
- Screen reader compatibility
- Keyboard navigation support

## Testing Requirements

### 1. Visual Regression Testing
- Screenshot comparison in light/dark themes
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsiveness

### 2. Accessibility Testing
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard navigation
- Color contrast compliance
- ARIA attribute preservation

### 3. Performance Testing
- Bundle size impact
- Icon loading performance
- Tree-shaking effectiveness

## Migration Phases

### Phase 1: Core Navigation (Priority: High)
- Sidebar navigation icons
- Main dashboard icons
- Primary action buttons

### Phase 2: Forms & Interactive Elements (Priority: High)
- Form action icons (add, edit, delete)
- Status indicators (warning, error, success)
- Search and filter icons

### Phase 3: Complex Components (Priority: Medium)
- Data table icons
- Chart and analytics icons
- File management icons

### Phase 4: Specialized Features (Priority: Low)
- Medical-specific icons
- Admin panel icons
- Subscription management icons

## Quality Assurance Checklist

### Pre-Migration
- [ ] Icon usage analysis completed
- [ ] Mapping table verified
- [ ] Fallback strategy documented
- [ ] Test cases prepared

### During Migration
- [ ] IconMapper component tested
- [ ] Visual consistency verified
- [ ] Accessibility attributes preserved
- [ ] Performance impact measured

### Post-Migration
- [ ] All MUI icon imports removed
- [ ] Bundle size reduction confirmed
- [ ] Cross-browser testing completed
- [ ] Accessibility audit passed
- [ ] User acceptance testing completed

## Troubleshooting

### Common Issues
1. **Missing Icon Mapping**: Add to `MUI_TO_LUCIDE_MAPPING` in IconMapper.tsx
2. **Size Inconsistencies**: Adjust size prop or use CSS classes
3. **Color Issues**: Use Tailwind color classes or CSS custom properties
4. **Accessibility Regressions**: Ensure ARIA attributes are preserved

### Performance Considerations
- Use tree-shaking to include only used icons
- Consider icon sprite sheets for frequently used icons
- Lazy load icons in non-critical components
- Monitor bundle size impact

## Future Maintenance

### Adding New Icons
1. Add mapping to `MUI_TO_LUCIDE_MAPPING`
2. Update this documentation
3. Add test cases
4. Verify accessibility compliance

### Icon Library Updates
1. Monitor Lucide React updates
2. Test for breaking changes
3. Update mappings as needed
4. Maintain backward compatibility

## Resources

- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)
- [Material-UI Icons Reference](https://mui.com/material-ui/material-icons/)
- [WCAG 2.1 Icon Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [shadcn/ui Icon Usage](https://ui.shadcn.com/docs/components/button#with-icon)