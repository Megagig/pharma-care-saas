#!/usr/bin/env node

/**
 * Frontend URL Verification Script
 * Checks that all hardcoded localhost URLs have been replaced with production URLs
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = './frontend/src';
const LOCALHOST_PATTERNS = [
  /localhost:5000/g,
  /127\.0\.0\.1:5000/g,
  /http:\/\/localhost:5000/g,
  /ws:\/\/localhost:5000/g
];

function scanDirectory(dir) {
  const results = [];

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative('.', filePath);

      LOCALHOST_PATTERNS.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          results.push({
            file: relativePath,
            pattern: pattern.toString(),
            matches: matches.length,
            lines: content.split('\n').map((line, lineNum) => {
              if (pattern.test(line)) {
                return { lineNum: lineNum + 1, content: line.trim() };
              }
              return null;
            }).filter(Boolean)
          });
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    }
  }

  function walkDirectory(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other build directories
          if (!['node_modules', 'build', 'dist', '.git'].includes(item)) {
            walkDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          // Only scan relevant file types
          if (/\.(ts|tsx|js|jsx|json|env)$/.test(item)) {
            scanFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentDir}:`, error.message);
    }
  }

  walkDirectory(dir);
  return results;
}

console.log('🔍 Scanning frontend files for localhost references...\n');

const results = scanDirectory(FRONTEND_DIR);

if (results.length === 0) {
  console.log('✅ No hardcoded localhost URLs found in frontend!');
  console.log('🎉 All URLs have been successfully updated to use environment variables or production URLs.\n');

  // Check .env file
  try {
    const envContent = fs.readFileSync('./frontend/.env', 'utf8');
    console.log('📋 Current frontend environment configuration:');
    console.log(envContent);
  } catch (error) {
    console.log('⚠️  Could not read frontend/.env file');
  }
} else {
  console.log('❌ Found hardcoded localhost URLs that need to be fixed:\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. File: ${result.file}`);
    console.log(`   Pattern: ${result.pattern}`);
    console.log(`   Matches: ${result.matches}`);
    console.log('   Lines:');
    result.lines.forEach(line => {
      console.log(`     Line ${line.lineNum}: ${line.content}`);
    });
    console.log('');
  });

  console.log('🔧 Please update these files to use environment variables or production URLs.');
  process.exit(1);
}

console.log('🚀 Frontend is ready for production deployment!');
console.log('📝 Make sure to:');
console.log('   1. Restart your frontend development server');
console.log('   2. Clear browser cache');
console.log('   3. Test the login functionality');