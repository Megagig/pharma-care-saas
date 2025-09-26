#!/usr/bin/env node

/**
 * Fix critical build errors systematically
 * Issues to fix:
 * 1. Duplicate Route imports in App.tsx
 * 2. Broken JSX syntax with className="", and trailing commas
 * 3. Missing React imports for interface files
 * 4. Broken barrel imports from @/components/ui
 * 5. Incomplete export statements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that need critical fixes
const criticalFiles = [
  'src/App.tsx',
  'src/components/AllergyManagement.tsx',
  'src/components/ConditionManagement.tsx', 
  'src/components/ClinicalAssessment.tsx',
  'src/components/DTPManagement.tsx',
  'src/components/CarePlanManagement.tsx',
  'src/components/VisitManagement.tsx',
  'src/components/PatientMTRWidget.tsx',
  'src/components/PatientClinicalNotes.tsx',
  'src/components/PatientLabOrderWidget.tsx',
  'src/components/PatientTimelineWidget.tsx',
  'src/components/PatientManagement.tsx',
  'src/components/PatientForm.tsx',
  'src/components/SidebarTest.tsx',
  'src/stores/clinicalNoteStore.ts',
  'src/pages/SubscriptionManagement.tsx',
  'src/pages/SubscriptionSuccess.tsx',
  'src/components/admin/AdminDashboard.tsx',
  'src/components/admin/MigrationDashboard.tsx',
  'src/components/admin/InvitationManagement.tsx',
  'src/components/admin/LocationManagement.tsx',
  'src/components/admin/WebhookManagement.tsx',
  'src/components/subscription/AdvancedSubscriptionAnalytics.tsx',
  'src/modules/reports-analytics/components/ReportsAnalyticsDashboard.tsx',
  'src/modules/diagnostics/pages/ResultsReviewPage.tsx',
  'src/modules/diagnostics/pages/ComponentDemo.tsx',
  'src/modules/diagnostics/middlewares/diagnosticFeatureGuard.tsx',
  'src/components/PatientDashboard.tsx',
  'src/components/LoadingSpinner.tsx',
  'src/components/TrialExpiryHandler.tsx',
  'src/components/rbac/BulkOperationProgress.tsx',
  'src/components/admin/SecurityDashboard.tsx',
  'src/components/admin/UsageMonitoring.tsx',
  'src/components/license/LicenseUpload.tsx'
];

function fixCriticalIssues(content, filePath) {
  const fileName = path.basename(filePath);
  
  // 1. Fix App.tsx duplicate Route imports
  if (fileName === 'App.tsx') {
    // Remove all duplicate Route imports from lucide-react
    content = content.replace(/import { Router } from 'lucide-react';\n/g, '');
    content = content.replace(/import { Route } from 'lucide-react';\n/g, '');
    
    // Ensure proper react-router-dom imports exist
    if (!content.includes('import { BrowserRouter as Router, Routes, Route }')) {
      const importIndex = content.indexOf('import React');
      if (importIndex !== -1) {
        const afterReactImport = content.indexOf('\n', importIndex) + 1;
        content = content.slice(0, afterReactImport) + 
          'import { BrowserRouter as Router, Routes, Route } from \'react-router-dom\';\n' +
          content.slice(afterReactImport);
      }
    }
  }
  
  // 2. Fix broken JSX syntax with className="", and trailing objects
  content = content.replace(/className="",\s*[^}]*}}/g, 'className=""');
  content = content.replace(/className="",/g, 'className=""');
  
  // Fix broken JSX with sx remnants and object syntax
  content = content.replace(/className=""\s*[^>]*}}\s*>/g, 'className="">');
  content = content.replace(/>\s*className="",\s*[^}]*}}\s*>/g, ' className="">');
  
  // Fix specific broken patterns
  content = content.replace(/className="",\s*gap:\s*\d+,\s*[^}]*}}/g, 'className=""');
  content = content.replace(/className="",\s*alignItems:\s*'[^']*',\s*[^}]*}}/g, 'className=""');
  
  // 3. Fix broken ListItem usage (replace with div)
  content = content.replace(/<ListItem([^>]*)>/g, '<div$1>');
  content = content.replace(/<\/ListItem>/g, '</div>');
  
  // 4. Fix broken Fade usage (remove it)
  content = content.replace(/<Fade[^>]*>/g, '<div>');
  content = content.replace(/<\/Fade>/g, '</div>');
  
  // 5. Fix broken Progress with variant
  content = content.replace(/variant="determinate"\s*value={[^}]*}/g, '');
  
  // 6. Fix TimelineContent usage
  content = content.replace(/<TimelineContent([^>]*)className=""[^>]*>/g, '<TimelineContent$1>');
  
  return content;
}

// Fix barrel imports to individual imports
function fixBarrelImports(content) {
  // Replace @/components/ui barrel imports with individual imports
  const uiImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/ui['"];?/g;
  
  content = content.replace(uiImportRegex, (match, components) => {
    const componentList = components.split(',').map(c => c.trim());
    const imports = componentList.map(component => {
      // Map component names to their file names
      const componentMap = {
        'Button': 'button',
        'Input': 'input', 
        'Label': 'label',
        'Card': 'card',
        'CardContent': 'card',
        'CardHeader': 'card',
        'CardTitle': 'card',
        'CardDescription': 'card',
        'CardFooter': 'card',
        'Badge': 'badge',
        'Dialog': 'dialog',
        'DialogContent': 'dialog',
        'DialogHeader': 'dialog',
        'DialogTitle': 'dialog',
        'DialogFooter': 'dialog',
        'DialogTrigger': 'dialog',
        'Select': 'select',
        'SelectContent': 'select',
        'SelectItem': 'select',
        'SelectTrigger': 'select',
        'SelectValue': 'select',
        'Alert': 'alert',
        'AlertDescription': 'alert',
        'AlertTitle': 'alert',
        'Spinner': 'spinner',
        'Skeleton': 'skeleton',
        'Tabs': 'tabs',
        'TabsContent': 'tabs',
        'TabsList': 'tabs',
        'TabsTrigger': 'tabs',
        'Progress': 'progress',
        'Separator': 'separator',
        'Switch': 'switch',
        'Checkbox': 'checkbox',
        'Tooltip': 'tooltip',
        'TooltipContent': 'tooltip',
        'TooltipProvider': 'tooltip',
        'TooltipTrigger': 'tooltip',
        'Accordion': 'accordion',
        'AccordionContent': 'accordion',
        'AccordionItem': 'accordion',
        'AccordionTrigger': 'accordion',
        'DatePicker': 'date-picker',
        'TimePicker': 'time-picker',
        'DateTimePicker': 'date-time-picker',
        'Calendar': 'calendar',
        'Table': 'table',
        'TableBody': 'table',
        'TableCell': 'table',
        'TableHead': 'table',
        'TableHeader': 'table',
        'TableRow': 'table',
        'DropdownMenu': 'dropdown-menu',
        'DropdownMenuContent': 'dropdown-menu',
        'DropdownMenuItem': 'dropdown-menu',
        'DropdownMenuTrigger': 'dropdown-menu',
        'Popover': 'popover',
        'PopoverContent': 'popover',
        'PopoverTrigger': 'popover',
        'Avatar': 'avatar',
        'AvatarImage': 'avatar',
        'AvatarFallback': 'avatar',
        'Timeline': 'timeline',
        'TimelineItem': 'timeline',
        'TimelineContent': 'timeline',
        'TimelineDot': 'timeline',
        'TimelineSeparator': 'timeline',
        'TimelineConnector': 'timeline'
      };
      
      const fileName = componentMap[component] || component.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      return `import { ${component} } from '@/components/ui/${fileName}';`;
    });
    
    return imports.join('\n');
  });
  
  return content;
}

// Add missing React imports for interface files
function addMissingImports(content, filePath) {
  const fileName = path.basename(filePath);
  
  // If file starts with interface and doesn't have React import
  if (content.trim().startsWith('interface ') && !content.includes('import React')) {
    content = 'import React from \'react\';\n\n' + content;
  }
  
  // Add common imports for component files
  if (fileName.endsWith('.tsx') && content.includes('interface ') && !content.includes('import React')) {
    const commonImports = [
      'import React, { useState, useEffect } from \'react\';'
    ];
    content = commonImports.join('\n') + '\n\n' + content;
  }
  
  return content;
}

// Fix incomplete exports
function fixIncompleteExports(content) {
  // Remove broken export comments
  content = content.replace(/\/\/ Removed incomplete export:.*$/gm, '');
  
  // Fix incomplete export statements
  content = content.replace(/export\s*{\s*default\s*$/gm, '');
  
  return content;
}

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Apply all fixes
    content = fixCriticalIssues(content, filePath);
    content = fixBarrelImports(content);
    content = addMissingImports(content, filePath);
    content = fixIncompleteExports(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing critical build errors...\n');
  
  let fixedCount = 0;
  let errorCount = 0;
  
  criticalFiles.forEach(file => {
    try {
      if (fixFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n✨ Critical fixes completed!`);
  console.log(`📊 Files processed: ${criticalFiles.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All critical build errors should be resolved!');
    console.log('\n📝 Next steps:');
    console.log('1. Try npm run build again');
    console.log('2. Test the application');
  }
}

main();