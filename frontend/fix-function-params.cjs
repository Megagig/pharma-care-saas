#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix function parameter syntax errors
const fixes = [
  // Fix function parameter destructuring like "{ prop, }" -> "{ prop }"
  {
    pattern: /,\s*\}\s*=>\s*\{/g,
    replacement: '\n}) => {'
  },
  // Fix "{ prop, } }) => {" -> "{ prop }) => {"
  {
    pattern: /,\s*\}\s*\}\)\s*=>\s*\{/g,
    replacement: '\n}) => {'
  },
  // Fix object syntax errors in new Date calls
  {
    pattern: /subscriptionData\.endDate\}/g,
    replacement: 'subscriptionData.endDate)'
  },
  // Fix currency formatter syntax
  {
    pattern: /minimumFractionDigits:\s*0,\s*\}\.format\(/g,
    replacement: 'minimumFractionDigits: 0\n    }).format('
  },
  // Fix interface declarations after imports
  {
    pattern: /import.*;\s*\n\s*\n\s*interface/g,
    replacement: function(match) {
      return match.replace(/\n\s*\n\s*interface/, '\n\ninterface');
    }
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
console.log('Function parameter fixes completed!');