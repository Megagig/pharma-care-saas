/**
 * Migration utilities for converting MUI components to shadcn/ui equivalents
 */

import { ButtonProps as ShadcnButtonProps } from '@/components/ui/button';
import { MUI_TO_LUCIDE_MAPPING, type IconMappingConfig } from '@/components/migration/IconMapper';

/**
 * Maps MUI Button variant to shadcn Button variant
 */
export function mapMuiButtonVariant(muiVariant?: string): ShadcnButtonProps['variant'] {
  switch (muiVariant) {
    case 'contained':
      return 'default';
    case 'outlined':
      return 'outline';
    case 'text':
      return 'ghost';
    default:
      return 'default';
  }
}

/**
 * Maps MUI Button size to shadcn Button size
 */
export function mapMuiButtonSize(muiSize?: string): ShadcnButtonProps['size'] {
  switch (muiSize) {
    case 'small':
      return 'sm';
    case 'medium':
      return 'default';
    case 'large':
      return 'lg';
    default:
      return 'default';
  }
}

/**
 * Maps MUI Button color to shadcn Button variant (for special cases)
 */
export function mapMuiButtonColor(muiColor?: string, baseVariant?: string): ShadcnButtonProps['variant'] {
  if (muiColor === 'error') {
    return 'destructive';
  }
  
  // For other colors, use the base variant mapping
  return mapMuiButtonVariant(baseVariant);
}

/**
 * Maps MUI TextField size to shadcn FormField size
 */
export function mapMuiTextFieldSize(muiSize?: string): 'small' | 'medium' | 'large' {
  switch (muiSize) {
    case 'small':
      return 'small';
    case 'medium':
      return 'medium';
    case 'large':
      return 'large';
    default:
      return 'medium';
  }
}

/**
 * Maps MUI TextField variant to shadcn FormField variant
 */
export function mapMuiTextFieldVariant(muiVariant?: string): 'outlined' | 'filled' | 'standard' {
  switch (muiVariant) {
    case 'outlined':
      return 'outlined';
    case 'filled':
      return 'filled';
    case 'standard':
      return 'standard';
    default:
      return 'outlined';
  }
}

/**
 * Converts MUI sx prop styles to Tailwind classes (basic mapping)
 */
export function convertSxToTailwind(sx?: any): string {
  if (!sx) return '';
  
  const classes: string[] = [];
  
  // Handle margin
  if (sx.mt !== undefined) classes.push(`mt-${sx.mt}`);
  if (sx.mb !== undefined) classes.push(`mb-${sx.mb}`);
  if (sx.ml !== undefined) classes.push(`ml-${sx.ml}`);
  if (sx.mr !== undefined) classes.push(`mr-${sx.mr}`);
  if (sx.m !== undefined) classes.push(`m-${sx.m}`);
  
  // Handle padding
  if (sx.pt !== undefined) classes.push(`pt-${sx.pt}`);
  if (sx.pb !== undefined) classes.push(`pb-${sx.pb}`);
  if (sx.pl !== undefined) classes.push(`pl-${sx.pl}`);
  if (sx.pr !== undefined) classes.push(`pr-${sx.pr}`);
  if (sx.p !== undefined) classes.push(`p-${sx.p}`);
  
  return classes.join(' ');
}

/**
 * Icon migration utilities
 */

/**
 * Gets the Lucide icon component name for a given MUI icon name
 */
export function getMuiIconMapping(muiIconName: string): IconMappingConfig | null {
  return MUI_TO_LUCIDE_MAPPING[muiIconName] || null;
}

/**
 * Checks if a MUI icon has a Lucide equivalent
 */
export function hasMuiIconMapping(muiIconName: string): boolean {
  return muiIconName in MUI_TO_LUCIDE_MAPPING;
}

/**
 * Gets all MUI icon names used in the codebase (for analysis)
 */
export function getAllMuiIconNames(): string[] {
  return Object.keys(MUI_TO_LUCIDE_MAPPING);
}

/**
 * Validates icon migration completeness
 */
export function validateIconMigration(usedIcons: string[]): {
  mapped: string[];
  unmapped: string[];
  mappingCoverage: number;
} {
  const mapped = usedIcons.filter(icon => hasMuiIconMapping(icon));
  const unmapped = usedIcons.filter(icon => !hasMuiIconMapping(icon));
  const mappingCoverage = (mapped.length / usedIcons.length) * 100;
  
  return {
    mapped,
    unmapped,
    mappingCoverage: Math.round(mappingCoverage * 100) / 100
  };
}

/**
 * Generates migration report for icons
 */
export function generateIconMigrationReport(usedIcons: string[]): string {
  const validation = validateIconMigration(usedIcons);
  
  let report = `# Icon Migration Report\n\n`;
  report += `## Summary\n`;
  report += `- Total icons used: ${usedIcons.length}\n`;
  report += `- Mapped icons: ${validation.mapped.length}\n`;
  report += `- Unmapped icons: ${validation.unmapped.length}\n`;
  report += `- Coverage: ${validation.mappingCoverage}%\n\n`;
  
  if (validation.unmapped.length > 0) {
    report += `## Unmapped Icons (Require Manual Mapping)\n`;
    validation.unmapped.forEach(icon => {
      report += `- ${icon}\n`;
    });
    report += `\n`;
  }
  
  report += `## Mapped Icons\n`;
  validation.mapped.forEach(icon => {
    const mapping = getMuiIconMapping(icon);
    if (mapping) {
      report += `- ${icon} → ${mapping.lucideIcon.name}\n`;
    }
  });
  
  return report;
}