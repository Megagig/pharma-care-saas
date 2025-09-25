#!/usr/bin/env node

/**
 * Script to analyze MUI icon usage across the codebase
 * This helps identify all icons that need to be migrated
 */

import fs from 'fs';
import path from 'path';
import { generateIconMigrationReport } from '../lib/migration-utils';

// File extensions to analyze
const EXTENSIONS = ['.ts', '.tsx'];

// Directories to scan
const SCAN_DIRECTORIES = [
  'src/components',
  'src/pages',
  'src/modules',
];

// Patterns to match MUI icon imports and usage
const MUI_ICON_PATTERNS = [
  // Import patterns
  /import\s+(\w+)\s+from\s+['"]@mui\/icons-material\/(\w+)['"];?/g,
  /import\s*{\s*([^}]+)\s*}\s*from\s+['"]@mui\/icons-material['"];?/g,
  // Usage patterns (for icons used as components)
  /<(\w+Icon)\s*[^>]*\/?>/g,
  /<(\w+)\s+[^>]*\/?>(?=.*Icon)/g,
];

interface IconUsage {
  iconName: string;
  filePath: string;
  lineNumber: number;
  context: string;
  importType: 'default' | 'named';
}

interface AnalysisResult {
  totalFiles: number;
  filesWithIcons: number;
  uniqueIcons: Set<string>;
  iconUsages: IconUsage[];
  unmappedIcons: string[];
  mappingCoverage: number;
}

/**
 * Recursively find all TypeScript/React files
 */
function findFiles(dir: string, basePath: string = ''): string[] {
  const files: string[] = [];
  const fullPath = path.join(process.cwd(), 'frontend', basePath, dir);
  
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
function extractIconUsage(filePath: string, content: string): IconUsage[] {
  const usages: IconUsage[] = [];
  const lines = content.split('\n');
  
  // Track imported icons
  const importedIcons = new Set<string>();
  
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
  
  // Find icon usage in JSX
  lines.forEach((line, index) => {
    importedIcons.forEach(iconName => {
      if (line.includes(`<${iconName}`) || line.includes(`{${iconName}}`)) {
        usages.push({
          iconName,
          filePath,
          lineNumber: index + 1,
          context: line.trim(),
          importType: 'default' // Usage context
        });
      }
    });
  });
  
  return usages;
}

/**
 * Analyze MUI icon usage across the codebase
 */
function analyzeIconUsage(): AnalysisResult {
  const allFiles: string[] = [];
  
  // Collect all files from scan directories
  for (const dir of SCAN_DIRECTORIES) {
    allFiles.push(...findFiles(dir));
  }
  
  console.log(`Analyzing ${allFiles.length} files...`);
  
  const result: AnalysisResult = {
    totalFiles: allFiles.length,
    filesWithIcons: 0,
    uniqueIcons: new Set(),
    iconUsages: [],
    unmappedIcons: [],
    mappingCoverage: 0
  };
  
  for (const filePath of allFiles) {
    try {
      const fullPath = path.join(process.cwd(), 'frontend', filePath);
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
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
  
  // Generate migration report
  const uniqueIconsArray = Array.from(result.uniqueIcons);
  const migrationReport = generateIconMigrationReport(uniqueIconsArray);
  
  // Extract unmapped icons from the report
  const reportLines = migrationReport.split('\n');
  const unmappedSection = reportLines.findIndex(line => line.includes('Unmapped Icons'));
  if (unmappedSection !== -1) {
    for (let i = unmappedSection + 1; i < reportLines.length; i++) {
      const line = reportLines[i].trim();
      if (line.startsWith('- ') && !line.includes('→')) {
        result.unmappedIcons.push(line.substring(2));
      } else if (line.startsWith('##')) {
        break; // Next section
      }
    }
  }
  
  // Calculate coverage
  const mappedCount = uniqueIconsArray.length - result.unmappedIcons.length;
  result.mappingCoverage = uniqueIconsArray.length > 0 
    ? (mappedCount / uniqueIconsArray.length) * 100 
    : 100;
  
  return result;
}

/**
 * Generate detailed analysis report
 */
function generateAnalysisReport(result: AnalysisResult): string {
  let report = `# MUI Icon Usage Analysis Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n`;
  report += `- Total files analyzed: ${result.totalFiles}\n`;
  report += `- Files with MUI icons: ${result.filesWithIcons}\n`;
  report += `- Unique icons found: ${result.uniqueIcons.size}\n`;
  report += `- Total icon usages: ${result.iconUsages.length}\n`;
  report += `- Mapping coverage: ${result.mappingCoverage.toFixed(1)}%\n\n`;
  
  // Most used icons
  const iconCounts = new Map<string, number>();
  result.iconUsages.forEach(usage => {
    iconCounts.set(usage.iconName, (iconCounts.get(usage.iconName) || 0) + 1);
  });
  
  const sortedIcons = Array.from(iconCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  report += `## Most Used Icons\n`;
  sortedIcons.forEach(([icon, count]) => {
    report += `- ${icon}: ${count} usages\n`;
  });
  report += `\n`;
  
  // Files with most icons
  const fileCounts = new Map<string, number>();
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
  
  // Unmapped icons
  if (result.unmappedIcons.length > 0) {
    report += `## Unmapped Icons (Need Manual Mapping)\n`;
    result.unmappedIcons.forEach(icon => {
      const usageCount = iconCounts.get(icon) || 0;
      report += `- ${icon} (${usageCount} usages)\n`;
    });
    report += `\n`;
  }
  
  // All unique icons
  report += `## All Unique Icons Found\n`;
  Array.from(result.uniqueIcons).sort().forEach(icon => {
    const count = iconCounts.get(icon) || 0;
    const mapped = !result.unmappedIcons.includes(icon) ? '✅' : '❌';
    report += `- ${mapped} ${icon} (${count} usages)\n`;
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
  const reportPath = path.join(process.cwd(), 'frontend', 'MUI_ICON_ANALYSIS_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\nAnalysis complete!`);
  console.log(`- Found ${result.uniqueIcons.size} unique icons in ${result.filesWithIcons} files`);
  console.log(`- Mapping coverage: ${result.mappingCoverage.toFixed(1)}%`);
  console.log(`- Report saved to: ${reportPath}`);
  
  if (result.unmappedIcons.length > 0) {
    console.log(`\n⚠️  ${result.unmappedIcons.length} icons need manual mapping:`);
    result.unmappedIcons.slice(0, 5).forEach(icon => console.log(`   - ${icon}`));
    if (result.unmappedIcons.length > 5) {
      console.log(`   ... and ${result.unmappedIcons.length - 5} more`);
    }
  }
  
  console.log(`\nNext steps:`);
  console.log(`1. Review the analysis report: ${reportPath}`);
  console.log(`2. Add missing icon mappings to IconMapper.tsx`);
  console.log(`3. Run the icon replacement script`);
}

// Run the analysis
if (require.main === module) {
  main();
}

export { analyzeIconUsage, generateAnalysisReport };