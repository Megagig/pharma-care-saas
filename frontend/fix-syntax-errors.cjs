#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common syntax error patterns and their fixes
const fixes = [
  // Fix object syntax errors like "key: value, })" -> "key: value, }"
  {
    pattern: /,\s*\}\)/g,
    replacement: ', }'
  },
  // Fix duplicate import statements
  {
    pattern: /import\s+{\s*useState\s*}\s+from\s+['"]react['"];\s*\n\s*import\s+{\s*useState\s*}\s+from\s+['"]react['"];/g,
    replacement: "import { useState } from 'react';"
  },
  // Fix MUI styled components
  {
    pattern: /const\s+(\w+)\s+=\s+styled\(['"]input['"]\)\(\{\s*\)/g,
    replacement: 'const $1 = "input"'
  },
  // Fix JSX closing tag mismatches
  {
    pattern: /<\/ListItemIcon>/g,
    replacement: '</div>'
  },
  {
    pattern: /<divText/g,
    replacement: '<div'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Start fixing from src directory
walkDirectory('./src');
console.log('Syntax fixes completed!');