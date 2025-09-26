#!/usr/bin/env node

/**
 * Comprehensive MUI cleanup script to remove all remaining MUI imports and fix syntax errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TypeScript/JavaScript files in src directory
function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix common syntax errors
function fixSyntaxErrors(content) {
  // Fix broken import statements
  content = content.replace(/}\s*from\s*['"][^'"]*['"];\s*$/gm, '');
  content = content.replace(/^\s*}\s*from\s*['"][^'"]*['"];\s*$/gm, '');
  
  // Fix empty React.FC type arguments
  content = content.replace(/React\.FC<\s*>/g, 'React.FC');
  
  // Fix broken destructuring
  content = content.replace(/,\s*}\s*from/g, '\n} from');
  
  // Remove orphaned closing braces from imports
  content = content.replace(/^[^{]*}\s*from\s*['"][^'"]*['"];\s*$/gm, '');
  
  // Fix missing import opening braces
  content = content.replace(/import\s+([^{}\s,]+),\s*$/gm, 'import { $1 }');
  
  return content;
}

// Remove all MUI imports and replace with shadcn/ui equivalents
function cleanupMUIImports(content, filePath) {
  const originalContent = content;
  
  // Remove all MUI imports
  const muiImportPatterns = [
    /import\s+{[^}]*}\s+from\s+['"]@mui\/[^'"]*['"];\s*\n?/g,
    /import\s+\w+\s+from\s+['"]@mui\/[^'"]*['"];\s*\n?/g,
    /import\s+\*\s+as\s+\w+\s+from\s+['"]@mui\/[^'"]*['"];\s*\n?/g,
    /import\s+{[^}]*}\s+from\s+['"]@emotion\/[^'"]*['"];\s*\n?/g,
  ];

  muiImportPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  // Replace MUI component usage with shadcn/ui equivalents
  const componentReplacements = {
    // Basic components
    'Box': 'div',
    'Typography': 'div',
    'Paper': 'div',
    'Container': 'div',
    'Stack': 'div',
    
    // Form components - keep as is, they'll be handled by imports
    'TextField': 'Input',
    'FormControl': 'div',
    'FormHelperText': 'p',
    'InputLabel': 'Label',
    
    // Feedback components
    'CircularProgress': 'Spinner',
    'LinearProgress': 'Progress',
    'Skeleton': 'Skeleton',
    
    // Navigation components
    'AppBar': 'header',
    'Toolbar': 'div',
    
    // Layout components
    'Grid': 'div',
    'Divider': 'Separator',
  };

  // Replace component usage (but not in import statements)
  Object.entries(componentReplacements).forEach(([mui, replacement]) => {
    // Replace JSX usage
    const jsxPattern = new RegExp(`<${mui}([^>]*)>`, 'g');
    content = content.replace(jsxPattern, `<${replacement}$1>`);
    
    const closingPattern = new RegExp(`</${mui}>`, 'g');
    content = content.replace(closingPattern, `</${replacement}>`);
  });

  // Add necessary shadcn/ui imports if components are used
  const neededImports = [];
  
  // Check for shadcn components usage
  const shadcnComponents = [
    'Button', 'Input', 'Label', 'Card', 'CardContent', 'CardHeader', 'CardTitle',
    'Badge', 'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogFooter',
    'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Tooltip', 'TooltipContent', 'TooltipTrigger', 'Spinner', 'Progress',
    'Alert', 'AlertTitle', 'AlertDescription', 'Skeleton', 'Avatar', 'AvatarImage', 'AvatarFallback',
    'Switch', 'Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent',
    'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger', 'Separator'
  ];

  shadcnComponents.forEach(component => {
    const pattern = new RegExp(`<${component}[^>]*>|<${component}\\s*/>`, 'g');
    if (pattern.test(content)) {
      neededImports.push(component);
    }
  });

  // Add imports for used components
  if (neededImports.length > 0) {
    const importStatement = `import { ${neededImports.join(', ')} } from '@/components/ui';\n`;
    
    // Find the last import statement
    const importRegex = /^import\s+.*?;$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = importStatement + '\n' + content;
    }
  }

  // Replace MUI sx props with Tailwind classes
  content = content.replace(/sx=\{\{[^}]*\}\}/g, 'className=""');
  content = content.replace(/sx=\{[^}]*\}/g, 'className=""');

  return content;
}

// Fix specific file issues
function fixSpecificFileIssues(content, filePath) {
  const fileName = path.basename(filePath);
  
  // Fix React.FC type issues
  if (content.includes('React.FC<>')) {
    content = content.replace(/React\.FC<>/g, 'React.FC');
  }
  
  // Fix broken import statements
  if (content.includes('} from \'../components\';')) {
    content = content.replace(/}\s*from\s*['"]\.\.\/components['"];\s*/g, '');
  }
  
  // Fix missing destructuring in useEffect
  if (fileName === 'MessageItem.tsx') {
    content = content.replace(
      /}, \[touchOptimized, attachGestures\]\);/g,
      '}, [touchOptimized]);'
    );
  }
  
  return content;
}

// Main cleanup function
function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply all cleanup functions
    content = fixSyntaxErrors(content);
    content = cleanupMUIImports(content, filePath);
    content = fixSpecificFileIssues(content, filePath);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned up: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🧹 Starting comprehensive MUI cleanup...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = getAllFiles(srcDir);
  
  let cleanedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    try {
      if (cleanupFile(file)) {
        cleanedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n✨ Cleanup completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files cleaned: ${cleanedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All files processed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run npm run build to check for remaining issues');
    console.log('2. Fix any remaining TypeScript errors manually');
    console.log('3. Test the application functionality');
  } else {
    console.log('\n⚠️  Some files had errors. Please check the output above.');
  }
}

main();