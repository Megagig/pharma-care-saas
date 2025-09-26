#!/usr/bin/env node

/**
 * Fix broken import statements caused by the cleanup script
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

// Fix broken import statements
function fixBrokenImports(content) {
  // Fix incomplete import statements (missing closing braces and from clauses)
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('//')) {
      fixedLines.push(line);
      continue;
    }
    
    // Fix broken import statements
    if (line.trim().startsWith('import ') && !line.includes(' from ') && !line.endsWith(';')) {
      // This is likely a broken import, skip it
      console.log(`Removing broken import: ${line.trim()}`);
      continue;
    }
    
    // Fix incomplete destructuring imports
    if (line.includes('import {') && !line.includes('}') && !line.includes(' from ')) {
      // This is an incomplete import, skip it
      console.log(`Removing incomplete import: ${line.trim()}`);
      continue;
    }
    
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

// Fix specific syntax issues
function fixSyntaxIssues(content) {
  // Remove orphaned closing braces from imports
  content = content.replace(/^[^{]*}\s*from\s*['"][^'"]*['"];\s*$/gm, '');
  
  // Fix React.FC type issues
  content = content.replace(/React\.FC<\s*>/g, 'React.FC');
  
  // Fix empty destructuring
  content = content.replace(/import\s*{\s*}\s*from/g, '// Removed empty import from');
  
  // Remove duplicate imports
  const lines = content.split('\n');
  const seenImports = new Set();
  const filteredLines = lines.filter(line => {
    if (line.trim().startsWith('import ')) {
      if (seenImports.has(line.trim())) {
        return false;
      }
      seenImports.add(line.trim());
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
    content = fixBrokenImports(content);
    content = fixSyntaxIssues(content);
    
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
  console.log('🔧 Fixing broken import statements...\n');
  
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
  
  console.log(`\n✨ Import fixing completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

main();