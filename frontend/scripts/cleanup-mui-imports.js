#!/usr/bin/env node

/**
 * Cleanup script to remove remaining MUI imports and replace with shadcn/ui equivalents
 * This script handles the final cleanup phase of the MUI to shadcn migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that still contain MUI imports based on grep search
const filesToCleanup = [
  'src/components/ClinicalNotesLazy.tsx',
  'src/components/InterventionDetails.tsx',
  'src/components/help/MTRHelpSystem.tsx',
  'src/components/help/MTRContextualHelp.tsx',
  'src/components/help/MTRDocumentation.tsx',
  'src/components/PatientLabOrderWidget.tsx',
  'src/components/medications/MedicationSettingsPanel_fixed.tsx',
  'src/components/medications/MedicationsManagementDashboard.tsx',
  'src/components/medications/MedicationSettingsPanel.tsx',
  'src/components/medications/MedicationAnalyticsPanel.tsx',
  'src/components/medications/MedicationChart.tsx',
  'src/components/DrugSearch.tsx',
  'src/components/medications/PatientMedicationsPage.tsx',
  'src/components/PlanDevelopment.tsx'
];

// MUI to shadcn/ui component mappings
const componentMappings = {
  // MUI Material components
  'Box': 'div',
  'Typography': 'div',
  'Paper': 'Card',
  'Chip': 'Badge',
  'Alert': 'Alert',
  'Button': 'Button',
  'TextField': 'Input',
  'Select': 'Select',
  'MenuItem': 'SelectItem',
  'FormControl': 'div',
  'FormHelperText': 'div',
  'InputLabel': 'Label',
  'CircularProgress': 'Spinner',
  'LinearProgress': 'Progress',
  'Tooltip': 'Tooltip',
  'Dialog': 'Dialog',
  'DialogTitle': 'DialogHeader',
  'DialogContent': 'DialogContent',
  'DialogActions': 'DialogFooter',
  'List': 'div',
  'ListItem': 'div',
  'ListItemIcon': 'div',
  'ListItemText': 'div',
  'Collapse': 'Collapsible',
  'Divider': 'Separator',
  'Badge': 'Badge',
  'Skeleton': 'Skeleton',
  'useTheme': 'useTheme',
  'useMediaQuery': 'useMediaQuery',
  'ToggleButton': 'Toggle',
  'ToggleButtonGroup': 'ToggleGroup',
  
  // MUI Lab components
  'Timeline': 'Timeline',
  'TimelineItem': 'TimelineItem',
  'TimelineSeparator': 'TimelineSeparator',
  'TimelineConnector': 'TimelineConnector',
  'TimelineContent': 'TimelineContent',
  'TimelineDot': 'TimelineDot',
  'TimelineOppositeContent': 'TimelineOppositeContent',
  
  // MUI Date Pickers
  'DatePicker': 'DatePicker',
  'LocalizationProvider': 'div',
  'AdapterDateFns': 'div',
  
  // MUI Stepper
  'Stepper': 'div',
  'Step': 'div',
  'StepLabel': 'div',
  'StepContent': 'div'
};

// Icon mappings from MUI icons to Lucide
const iconMappings = {
  'CheckCircleIcon': 'CheckCircle',
  'ScheduleIcon': 'Clock',
  'EditIcon': 'Edit',
  'PersonIcon': 'User',
  'AssignmentIcon': 'FileText',
  'TrendingUpIcon': 'TrendingUp',
  'TrendingDownIcon': 'TrendingDown',
  'AddIcon': 'Plus',
  'InfoIcon': 'Info',
  'PhoneIcon': 'Phone',
  'EmailIcon': 'Mail',
  'SearchIcon': 'Search',
  'FilterIcon': 'Filter',
  'SortIcon': 'ArrowUpDown',
  'DownloadIcon': 'Download',
  'RefreshIcon': 'RefreshCw',
  'CloseIcon': 'X',
  'SaveIcon': 'Save',
  'RemoveIcon': 'Minus',
  'PsychologyIcon': 'Brain',
  'AssessmentIcon': 'BarChart3',
  'StarIcon': 'Star',
  'InsertDriveFileIcon': 'File',
  'FileIcon': 'File'
};

function cleanupFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Remove MUI imports
  const muiImportPatterns = [
    /import\s+{[^}]*}\s+from\s+['"]@mui\/material['"];?\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@mui\/icons-material['"];?\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@mui\/lab['"];?\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@mui\/x-date-pickers[^'"]*['"];?\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@mui\/system['"];?\n?/g,
    /import\s+\w+\s+from\s+['"]@mui\/icons-material\/\w+['"];?\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@emotion\/[^'"]*['"];?\n?/g
  ];

  muiImportPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });

  // Add shadcn/ui imports at the top if needed
  if (modified) {
    const imports = [];
    
    // Check which shadcn components are needed
    Object.keys(componentMappings).forEach(muiComponent => {
      const shadcnComponent = componentMappings[muiComponent];
      if (content.includes(muiComponent) && shadcnComponent !== 'div') {
        switch (shadcnComponent) {
          case 'Button':
          case 'Input':
          case 'Label':
          case 'Badge':
          case 'Card':
          case 'Dialog':
          case 'DialogHeader':
          case 'DialogContent':
          case 'DialogFooter':
          case 'Select':
          case 'SelectItem':
          case 'Tooltip':
          case 'Spinner':
          case 'Progress':
          case 'Separator':
          case 'Toggle':
          case 'ToggleGroup':
          case 'Collapsible':
          case 'Alert':
          case 'Skeleton':
            if (!imports.includes(shadcnComponent)) {
              imports.push(shadcnComponent);
            }
            break;
        }
      }
    });

    // Check which Lucide icons are needed
    const lucideIcons = [];
    Object.keys(iconMappings).forEach(muiIcon => {
      const lucideIcon = iconMappings[muiIcon];
      if (content.includes(muiIcon)) {
        lucideIcons.push(lucideIcon);
      }
    });

    // Add imports
    let importStatements = '';
    if (imports.length > 0) {
      const uiImports = imports.map(comp => {
        const kebabCase = comp.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
        return `import { ${comp} } from '@/components/ui/${kebabCase}';`;
      }).join('\n');
      importStatements += uiImports + '\n';
    }

    if (lucideIcons.length > 0) {
      importStatements += `import { ${lucideIcons.join(', ')} } from 'lucide-react';\n`;
    }

    // Insert imports after existing imports
    const importRegex = /(import[^;]+;[\s\n]*)+/;
    const match = content.match(importRegex);
    if (match) {
      content = content.replace(match[0], match[0] + importStatements);
    } else {
      content = importStatements + '\n' + content;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Cleaned up: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

function main() {
  console.log('🧹 Starting MUI cleanup process...\n');
  
  filesToCleanup.forEach(file => {
    cleanupFile(file);
  });
  
  console.log('\n✨ MUI cleanup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run npm install to remove unused dependencies');
  console.log('2. Run npm run build to verify everything compiles');
  console.log('3. Run tests to ensure functionality is preserved');
  console.log('4. Manually review and fix any remaining issues');
}

main();