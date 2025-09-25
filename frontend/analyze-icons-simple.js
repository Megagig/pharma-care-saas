#!/usr/bin/env node

/**
 * Simple script to analyze MUI icon usage across the codebase
 */

import fs from 'fs';
import path from 'path';

// File extensions to analyze
const EXTENSIONS = ['.ts', '.tsx'];

// Directories to scan
const SCAN_DIRECTORIES = [
  'src/components',
  'src/pages',
  'src/modules',
];

/**
 * Recursively find all TypeScript/React files
 */
function findFiles(dir, basePath = '') {
  const files = [];
  const fullPath = path.join(process.cwd(), basePath, dir);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`Directory not found: ${fullPath}`);
    return files;
  }
  
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const fullEntryPath = path.join(fullPath, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findFiles(entryPath, basePath));
    } else if (entry.isFile() && EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(path.join(basePath, entryPath));
    }
  }
  
  return files;
}

/**
 * Extract MUI icon usage from file content
 */
function extractIconUsage(filePath, content) {
  const usages = [];
  const lines = content.split('\n');
  
  // Track imported icons
  const importedIcons = new Set();
  
  // Find import statements
  lines.forEach((line, index) => {
    // Default imports: import AddIcon from '@mui/icons-material/Add';
    const defaultImportMatch = line.match(/import\s+(\w+)\s+from\s+['"]@mui\/icons-material\/(\w+)['"];?/);
    if (defaultImportMatch) {
      const [, importName, iconName] = defaultImportMatch;
      importedIcons.add(importName);
      usages.push({
        iconName: importName,
        filePath,
        lineNumber: index + 1,
        context: line.trim(),
        importType: 'default'
      });
    }
    
    // Named imports: import { Add as AddIcon, Edit } from '@mui/icons-material';
    const namedImportMatch = line.match(/import\s*{\s*([^}]+)\s*}\s*from\s+['"]@mui\/icons-material['"];?/);
    if (namedImportMatch) {
      const [, imports] = namedImportMatch;
      const iconNames = imports.split(',').map(imp => {
        const trimmed = imp.trim();
        // Handle "Add as AddIcon" format
        const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
        if (asMatch) {
          return asMatch[2]; // Return the alias
        }
        return trimmed;
      });
      
      iconNames.forEach(iconName => {
        if (iconName) {
          importedIcons.add(iconName);
          usages.push({
            iconName,
            filePath,
            lineNumber: index + 1,
            context: line.trim(),
            importType: 'named'
          });
        }
      });
    }
  });
  
  return usages;
}

/**
 * Analyze MUI icon usage across the codebase
 */
function analyzeIconUsage() {
  const allFiles = [];
  
  // Collect all files from scan directories
  for (const dir of SCAN_DIRECTORIES) {
    allFiles.push(...findFiles(dir));
  }
  
  console.log(`Analyzing ${allFiles.length} files...`);
  
  const result = {
    totalFiles: allFiles.length,
    filesWithIcons: 0,
    uniqueIcons: new Set(),
    iconUsages: []
  };
  
  for (const filePath of allFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const usages = extractIconUsage(filePath, content);
      
      if (usages.length > 0) {
        result.filesWithIcons++;
        result.iconUsages.push(...usages);
        
        // Track unique icons
        usages.forEach(usage => {
          result.uniqueIcons.add(usage.iconName);
        });
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }
  
  return result;
}

/**
 * Generate detailed analysis report
 */
function generateAnalysisReport(result) {
  let report = `# MUI Icon Usage Analysis Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n`;
  report += `- Total files analyzed: ${result.totalFiles}\n`;
  report += `- Files with MUI icons: ${result.filesWithIcons}\n`;
  report += `- Unique icons found: ${result.uniqueIcons.size}\n`;
  report += `- Total icon usages: ${result.iconUsages.length}\n\n`;
  
  // Most used icons
  const iconCounts = new Map();
  result.iconUsages.forEach(usage => {
    iconCounts.set(usage.iconName, (iconCounts.get(usage.iconName) || 0) + 1);
  });
  
  const sortedIcons = Array.from(iconCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15);
  
  report += `## Most Used Icons\n`;
  sortedIcons.forEach(([icon, count]) => {
    report += `- ${icon}: ${count} usages\n`;
  });
  report += `\n`;
  
  // Files with most icons
  const fileCounts = new Map();
  result.iconUsages.forEach(usage => {
    fileCounts.set(usage.filePath, (fileCounts.get(usage.filePath) || 0) + 1);
  });
  
  const sortedFiles = Array.from(fileCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  report += `## Files with Most Icons\n`;
  sortedFiles.forEach(([file, count]) => {
    report += `- ${file}: ${count} icons\n`;
  });
  report += `\n`;
  
  // All unique icons
  report += `## All Unique Icons Found\n`;
  Array.from(result.uniqueIcons).sort().forEach(icon => {
    const count = iconCounts.get(icon) || 0;
    report += `- ${icon} (${count} usages)\n`;
  });
  
  // Files breakdown
  report += `\n## Files with Icon Usage\n`;
  const fileUsages = new Map();
  result.iconUsages.forEach(usage => {
    if (!fileUsages.has(usage.filePath)) {
      fileUsages.set(usage.filePath, []);
    }
    fileUsages.get(usage.filePath).push(usage);
  });
  
  Array.from(fileUsages.entries()).forEach(([file, usages]) => {
    report += `\n### ${file}\n`;
    const fileIcons = new Set(usages.map(u => u.iconName));
    Array.from(fileIcons).sort().forEach(icon => {
      const iconUsages = usages.filter(u => u.iconName === icon);
      report += `- ${icon} (${iconUsages.length} usages)\n`;
    });
  });
  
  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('Starting MUI icon analysis...');
  
  const result = analyzeIconUsage();
  const report = generateAnalysisReport(result);
  
  // Write report to file
  const reportPath = path.join(process.cwd(), 'MUI_ICON_ANALYSIS_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\nAnalysis complete!`);
  console.log(`- Found ${result.uniqueIcons.size} unique icons in ${result.filesWithIcons} files`);
  console.log(`- Report saved to: ${reportPath}`);
  
  // Show top icons
  const iconCounts = new Map();
  result.iconUsages.forEach(usage => {
    iconCounts.set(usage.iconName, (iconCounts.get(usage.iconName) || 0) + 1);
  });
  
  const topIcons = Array.from(iconCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  console.log(`\nTop 10 most used icons:`);
  topIcons.forEach(([icon, count]) => {
    console.log(`  ${icon}: ${count} usages`);
  });
  
  console.log(`\nNext steps:`);
  console.log(`1. Review the analysis report: ${reportPath}`);
  console.log(`2. Update IconMapper.tsx with any missing mappings`);
  console.log(`3. Run the icon replacement process`);
}

// Run the analysis
main();