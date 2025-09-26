#!/usr/bin/env node

/**
 * Fix import syntax errors script
 * This script fixes malformed import statements caused by the cleanup process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TypeScript/TSX files
function getAllTsFiles() {
  try {
    const result = execSync('find src -name "*.tsx" -o -name "*.ts"', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.log('Error finding files:', error.message);
    return [];
  }
}

function fixSyntaxErrors(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Fix malformed import statements
  // Pattern: import {\nimport { ... } from '...'
  content = content.replace(/import\s*{\s*\nimport\s*{/g, 'import {');
  
  // Fix empty import blocks
  content = content.replace(/import\s*{\s*\n\s*}/g, '');
  
  // Fix imports with missing closing braces
  const lines = content.split('\n');
  const fixedLines = [];
  let inImportBlock = false;
  let importBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is the start of an import
    if (line.match(/^import\s*{/)) {
      if (line.includes('}') && line.includes('from')) {
        // Complete import on one line
        fixedLines.push(line);
      } else {
        // Start of multi-line import
        inImportBlock = true;
        importBuffer = line;
      }
    } else if (inImportBlock) {
      if (line.includes('from ')) {
        // End of import block
        importBuffer += ' ' + line.trim();
        fixedLines.push(importBuffer);
        inImportBlock = false;
        importBuffer = '';
      } else if (line.trim() && !line.includes('import {')) {
        // Part of import list
        importBuffer += ' ' + line.trim();
      } else if (line.includes('import {')) {
        // New import started, close previous one
        if (importBuffer && !importBuffer.includes('from ')) {
          // Malformed import, skip it
          console.log(`Skipping malformed import in ${filePath}: ${importBuffer}`);
        } else if (importBuffer) {
          fixedLines.push(importBuffer);
        }
        inImportBlock = true;
        importBuffer = line;
      }
    } else {
      fixedLines.push(line);
    }
  }
  
  // Handle any remaining import buffer
  if (inImportBlock && importBuffer) {
    if (importBuffer.includes('from ')) {
      fixedLines.push(importBuffer);
    }
  }
  
  const newContent = fixedLines.join('\n');
  
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`✅ Fixed syntax: ${filePath}`);
    modified = true;
  }
  
  return modified;
}

function main() {
  console.log('🔧 Fixing import syntax errors...\n');
  
  const files = getAllTsFiles();
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixSyntaxErrors(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Fixed syntax in ${fixedCount} files!`);
}

main();