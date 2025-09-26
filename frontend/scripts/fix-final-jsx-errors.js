#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TSX files
function getAllTsxFiles() {
  try {
    const result = execSync('find src -name "*.tsx" -type f', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return result.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.log('No TSX files found');
    return [];
  }
}

function fixFinalJsxErrors(content) {
  // Fix duplicate className attributes
  content = content.replace(/className="[^"]*"\s+className="[^"]*"/g, 'className=""');
  
  // Fix broken JSX with trailing }}
  content = content.replace(/className=""\s*}}\s*([^>]*>)/g, 'className="" $1');
  content = content.replace(/className=""\s*}}/g, 'className=""');
  
  // Fix broken component props with object syntax remnants
  content = content.replace(/(\w+)={\s*[^}]*}}\s*>/g, '>');
  content = content.replace(/(\w+)={\s*[^}]*}}/g, '');
  
  // Fix broken attributes with trailing }}
  content = content.replace(/(\w+)="[^"]*"\s*}}/g, '$1=""');
  
  // Fix broken JSX elements with object syntax
  content = content.replace(/<(\w+)([^>]*)\s*}}\s*>/g, '<$1$2>');
  
  // Fix broken div elements with elevation prop (MUI remnant)
  content = content.replace(/<div\s+elevation={\d+}/g, '<div');
  
  // Fix broken component usage
  content = content.replace(/<IconButton([^>]*)\s*}}\s*([^>]*)>/g, '<IconButton$1 $2>');
  
  // Fix any remaining object syntax in JSX
  content = content.replace(/\s*}}\s*>/g, '>');
  content = content.replace(/\s*}}\s*$/gm, '');
  
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
    
    content = fixFinalJsxErrors(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed final JSX errors in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing final JSX syntax errors...\n');
  
  const files = getAllTsxFiles();
  console.log(`Found ${files.length} TSX files`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Final JSX syntax fixes completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
}

main();