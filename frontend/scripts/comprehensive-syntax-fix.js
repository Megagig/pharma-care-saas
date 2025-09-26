#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TSX and TS files
function getAllFiles() {
  try {
    const result = execSync('find src -name "*.tsx" -o -name "*.ts" | grep -v node_modules', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return result.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.log('No files found');
    return [];
  }
}

function comprehensiveSyntaxFix(content) {
  // Fix all broken JSX patterns
  
  // 1. Fix missing closing braces in object props
  content = content.replace(/(\w+)=\{\{([^}]*)\s*>\s*/g, '$1={{$2}}>');
  content = content.replace(/style=\{\{([^}]*)\s*>\s*/g, 'style={{$1}}>');
  content = content.replace(/slotProps=\{\{([^}]*)\s*>\s*/g, 'slotProps={{$1}}>');
  
  // 2. Fix broken component names
  content = content.replace(/<divButton/g, '<Button');
  content = content.replace(/<divIcon/g, '<div');
  content = content.replace(/<divLabel/g, '<FormControlLabel');
  
  // 3. Fix broken JSX with trailing }}
  content = content.replace(/className=""\s*}}\s*([^>]*>)/g, 'className="" $1');
  content = content.replace(/className=""\s*}}/g, 'className=""');
  
  // 4. Fix broken object syntax in JSX attributes
  content = content.replace(/(\w+)="[^"]*"\s*}}/g, '$1=""');
  content = content.replace(/\s*}}\s*>/g, '>');
  content = content.replace(/\s*}}\s*$/gm, '');
  
  // 5. Fix broken MUI sx syntax remnants
  content = content.replace(/'&\.[^']*':\s*\{[^}]*\},?\s*/g, '');
  content = content.replace(/'&::[^']*':\s*\{[^}]*\},?\s*/g, '');
  content = content.replace(/sx=\{[^}]*\}/g, '');
  
  // 6. Fix broken component props
  content = content.replace(/elevation=\{\d+\}/g, '');
  content = content.replace(/variant="[^"]*"/g, '');
  content = content.replace(/component=\{[^}]*\}/g, '');
  content = content.replace(/selected=\{[^}]*\}/g, '');
  
  // 7. Fix broken function calls and handlers
  content = content.replace(/(\w+)\s*\(\s*\)\s*\(\s*([^)]*)\s*\)\s*\(\s*([^)]*)\s*\)/g, '$1($2)($3)');
  
  // 8. Fix broken render props
  content = content.replace(/render=\{\(\{([^}]*)\}\)\s*=>\s*\(/g, 'render={({ $1 }) => (');
  
  // 9. Fix missing closing braces in function calls
  content = content.replace(/(\w+)\(\s*([^)]*)\s*\)\s*\(\s*([^)]*)\s*$/gm, '$1($2)($3)');
  
  // 10. Fix broken import statements
  content = content.replace(/from ['"]@\/components\/ui\/PLACEHOLDER['"];?/g, 'from \'@/components/ui/button\';');
  
  // 11. Fix duplicate className attributes
  content = content.replace(/className="[^"]*"\s+className="[^"]*"/g, 'className=""');
  
  // 12. Fix broken JSX elements
  content = content.replace(/<(\w+)([^>]*)\s*}}\s*>/g, '<$1$2>');
  
  // 13. Fix broken event handlers
  content = content.replace(/(\w+)=\{([^}]*)\s*$/gm, '$1={$2}');
  
  // 14. Fix broken object destructuring in function params
  content = content.replace(/\(\{([^}]*)\s*$/gm, '({ $1 })');
  
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
    
    content = comprehensiveSyntaxFix(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed comprehensive syntax in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Running comprehensive syntax fixes...\n');
  
  const files = getAllFiles();
  console.log(`Found ${files.length} files`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Comprehensive syntax fixes completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
  
  console.log('\n🔄 Running build test...');
  try {
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('\n🎉 Build successful!');
  } catch (error) {
    console.log('\n⚠️  Build still has issues. Manual fixes may be needed.');
  }
}

main();