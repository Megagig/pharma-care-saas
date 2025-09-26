#!/usr/bin/env node

/**
 * Final syntax fix script to resolve all remaining issues
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

// Fix all syntax issues
function fixAllSyntaxIssues(content) {
  // Fix broken React imports
  if (content.includes('createContext,') && !content.includes('import React')) {
    content = content.replace(
      /(\s*createContext,[\s\S]*?)(import\s+\w+)/,
      'import React, {\n  $1\n} from \'react\';\n$2'
    );
  }

  // Fix incomplete destructuring imports
  content = content.replace(/import\s*{\s*([^}]*)\s*$/gm, (match, p1) => {
    if (!p1.includes('}')) {
      return `// Removed incomplete import: ${match.trim()}`;
    }
    return match;
  });

  // Fix broken export statements
  content = content.replace(/^export\s*{\s*$/gm, '// Removed broken export');
  content = content.replace(/^export\s*{\s*([^}]*)\s*$/gm, (match, p1) => {
    if (!p1.includes('}')) {
      return `// Removed incomplete export: ${match.trim()}`;
    }
    return match;
  });

  // Fix React.FC type issues
  content = content.replace(/React\.FC<\s*>/g, 'React.FC');
  content = content.replace(/React\.FC<\s*\n\s*>/g, 'React.FC');

  // Remove empty lines that might cause issues
  content = content.replace(/^\s*\n\s*import/gm, '\nimport');
  content = content.replace(/^\s*\n\s*export/gm, '\nexport');

  // Fix missing semicolons on imports
  content = content.replace(/^(import[^;]+)$/gm, '$1;');

  // Remove duplicate imports
  const lines = content.split('\n');
  const seenImports = new Set();
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ')) {
      if (seenImports.has(trimmed)) {
        return false;
      }
      seenImports.add(trimmed);
    }
    return true;
  });

  return filteredLines.join('\n');
}

// Main cleanup function
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixAllSyntaxIssues(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
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
  console.log('🔧 Final syntax fix...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = getAllFiles(srcDir);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    try {
      if (fixFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n✨ Final syntax fix completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

main();