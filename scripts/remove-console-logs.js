#!/usr/bin/env node

/**
 * Script to remove console.log statements from production code
 * Preserves console.error, console.warn, console.info for error handling
 * Excludes test files, debug utilities, and development tools
 */

const fs = require('fs');
const path = require('path');

// Directories to clean (production code only)
const DIRS = [
  'frontend/src/services',
  'frontend/src/components',
  'frontend/src/pages',
  'frontend/src/hooks',
  'frontend/src/context',
  'frontend/src/contexts',
  'frontend/src/modules',
  'frontend/src/utils',
  'frontend/src/stores',
  'frontend/src/queries',
  'frontend/src/lib',
];

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  /test\./i,
  /\.test\./i,
  /debug/i,
  /__tests__/,
  /\/tests\//,
  /authDebug/,
  /authTest/,
  /debugWorkspace/,
  /rbacTestSuite/,
  /queryDevtools/,
  /test-runner/,
];

let totalRemoved = 0;
let filesProcessed = 0;

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Remove console.log statements from code
 */
function removeConsoleLogs(content) {
  let removed = 0;
  
  // Pattern 1: Single line console.log (most common)
  // Matches: console.log(...);
  const singleLinePattern = /^\s*console\.log\([^)]*\);?\s*$/gm;
  content = content.replace(singleLinePattern, () => {
    removed++;
    return '';
  });
  
  // Pattern 2: Inline console.log
  // Matches: something; console.log(...); something;
  const inlinePattern = /;\s*console\.log\([^)]*\);?/g;
  content = content.replace(inlinePattern, () => {
    removed++;
    return ';';
  });
  
  // Pattern 3: console.log at start of line without semicolon
  const startLinePattern = /^\s*console\.log\([^)]*\)\s*$/gm;
  content = content.replace(startLinePattern, () => {
    removed++;
    return '';
  });
  
  // Pattern 4: Multiline console.log (simple cases)
  // Matches: console.log(\n  ...\n);
  const multilinePattern = /console\.log\(\s*[^)]*\s*\);?/g;
  const lines = content.split('\n');
  let inConsoleLog = false;
  let consoleLogStart = -1;
  let parenCount = 0;
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inConsoleLog && line.match(/console\.log\(/)) {
      inConsoleLog = true;
      consoleLogStart = i;
      parenCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      
      // Check if it's a single-line console.log
      if (parenCount === 0) {
        inConsoleLog = false;
        removed++;
        continue; // Skip this line
      }
    } else if (inConsoleLog) {
      parenCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      
      if (parenCount === 0) {
        // End of console.log
        inConsoleLog = false;
        removed++;
        continue; // Skip this line
      }
    } else {
      newLines.push(line);
    }
  }
  
  if (removed > 0) {
    content = newLines.join('\n');
  }
  
  return { content, removed };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (shouldExclude(filePath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has console.log
    if (!content.includes('console.log')) {
      return;
    }
    
    const { content: newContent, removed } = removeConsoleLogs(content);
    
    if (removed > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✅ ${filePath}: Removed ${removed} console.log statement(s)`);
      totalRemoved += removed;
      filesProcessed++;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }
  
  console.log(`\n📁 Processing: ${dirPath}`);
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      processFile(filePath);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Removing console.log statements from production code...\n');
  console.log('📋 Directories to process:');
  DIRS.forEach(dir => console.log(`   - ${dir}`));
  console.log('\n🚫 Excluding:');
  console.log('   - Test files (*test*, __tests__)');
  console.log('   - Debug utilities (*debug*, *Debug*)');
  console.log('   - Development tools\n');
  console.log('⚠️  Preserving: console.error, console.warn, console.info\n');
  console.log('─'.repeat(60));
  
  DIRS.forEach(dir => {
    processDirectory(dir);
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n✅ Cleanup complete!');
  console.log(`📊 Files processed: ${filesProcessed}`);
  console.log(`📊 Total console.log statements removed: ${totalRemoved}\n`);
  
  if (totalRemoved > 0) {
    console.log('💡 Tip: Run your tests to ensure nothing broke!');
    console.log('   npm run test\n');
  }
}

main();

