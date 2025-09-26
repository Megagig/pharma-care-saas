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

function fixJsxSyntaxErrors(content) {
  // Fix broken className with trailing commas and object syntax
  content = content.replace(/className="",\s*[^}]*}}\s*>/g, 'className="">');
  content = content.replace(/className="",/g, 'className=""');
  
  // Fix broken JSX with object syntax remnants
  content = content.replace(/className=""\s*[^>]*}}\s*>/g, 'className="">');
  content = content.replace(/>\s*className="",\s*[^}]*}}\s*>/g, ' className="">');
  
  // Fix specific broken patterns
  content = content.replace(/className="",\s*gap:\s*\d+,\s*[^}]*}}/g, 'className=""');
  content = content.replace(/className="",\s*alignItems:\s*'[^']*',\s*[^}]*}}/g, 'className=""');
  content = content.replace(/className="",\s*[^}]*}}/g, 'className=""');
  
  // Fix broken div with object syntax
  content = content.replace(/<div\s+className="",\s*[^}]*}}\s*>/g, '<div className="">');
  
  // Fix broken component props with object syntax
  content = content.replace(/(\w+)\s+className="",\s*[^}]*}}\s*>/g, '$1 className="">');
  
  // Fix broken ListItem usage (replace with div)
  content = content.replace(/<ListItem([^>]*)>/g, '<div$1>');
  content = content.replace(/<\/ListItem>/g, '</div>');
  
  // Fix broken Fade usage (remove it)
  content = content.replace(/<Fade[^>]*>/g, '<div>');
  content = content.replace(/<\/Fade>/g, '</div>');
  
  // Fix broken Progress with variant
  content = content.replace(/variant="determinate"\s*value={[^}]*}/g, '');
  
  // Fix broken component attributes with object syntax
  content = content.replace(/(\w+)={\s*[^}]*}}\s*>/g, '>');
  
  return content;
}

function fixImportStatements(content) {
  // Fix broken import statements
  content = content.replace(/import\s+([^;]+);\s*([^i])/g, 'import $1;\n$2');
  
  // Fix missing React imports for files with JSX
  if (content.includes('<') && content.includes('>') && !content.includes('import React')) {
    content = 'import React from \'react\';\n' + content;
  }
  
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
    
    content = fixJsxSyntaxErrors(content);
    content = fixImportStatements(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed JSX syntax in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing JSX syntax errors...\n');
  
  const files = getAllTsxFiles();
  console.log(`Found ${files.length} TSX files`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ JSX syntax fixes completed!`);
  console.log(`📊 Files processed: ${files.length}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
}

main();