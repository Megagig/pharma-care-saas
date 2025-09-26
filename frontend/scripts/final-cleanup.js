#!/usr/bin/env node

/**
 * Final cleanup script to fix all remaining syntax and import issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAllTsFiles() {
  try {
    const result = execSync('find src -name "*.tsx" -o -name "*.ts"', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function cleanupFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Remove duplicate imports
  const lines = content.split('\n');
  const seenImports = new Set();
  const cleanedLines = [];
  
  for (const line of lines) {
    if (line.startsWith('import ') && line.includes('from ')) {
      if (!seenImports.has(line.trim())) {
        seenImports.add(line.trim());
        cleanedLines.push(line);
      } else {
        modified = true;
      }
    } else if (line.trim() === '// Removed malformed import') {
      modified = true;
      // Skip this line
    } else {
      cleanedLines.push(line);
    }
  }

  // Remove empty lines between imports
  const finalLines = [];
  let inImportSection = false;
  
  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    
    if (line.startsWith('import ')) {
      inImportSection = true;
      finalLines.push(line);
    } else if (inImportSection && line.trim() === '') {
      // Skip empty lines in import section unless it's the last empty line
      const nextNonEmpty = cleanedLines.slice(i + 1).find(l => l.trim() !== '');
      if (nextNonEmpty && !nextNonEmpty.startsWith('import ')) {
        finalLines.push(line);
        inImportSection = false;
      }
    } else {
      inImportSection = false;
      finalLines.push(line);
    }
  }

  const newContent = finalLines.join('\n');
  
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    modified = true;
  }

  return modified;
}

function main() {
  console.log('🧹 Running final cleanup...\n');
  
  const files = getAllTsFiles();
  let fixedCount = 0;
  
  files.forEach(file => {
    if (cleanupFile(file)) {
      console.log(`✅ Cleaned: ${file}`);
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Final cleanup completed! Fixed ${fixedCount} files.`);
}

main();