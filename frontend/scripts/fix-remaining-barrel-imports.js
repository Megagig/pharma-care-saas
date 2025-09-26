#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all files with barrel imports
function getFilesWithBarrelImports() {
  try {
    const result = execSync('find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "@/components/ui[\'\\"]" || true', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return result.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.log('No files found with barrel imports');
    return [];
  }
}

// Component to file mapping
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

function fixBarrelImports(content) {
  // Replace @/components/ui barrel imports with individual imports
  const uiImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/ui['"];?/g;
  
  content = content.replace(uiImportRegex, (match, components) => {
    const componentList = components.split(',').map(c => c.trim());
    const imports = componentList.map(component => {
      const fileName = componentMap[component] || component.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      return `import { ${component} } from '@/components/ui/${fileName}';`;
    });
    
    return imports.join('\n');
  });
  
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
    
    content = fixBarrelImports(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed barrel imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing remaining barrel imports...\n');
  
  const files = getFilesWithBarrelImports();
  console.log(`Found ${files.length} files with barrel imports`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Barrel import fixes completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
}

main();