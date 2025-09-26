/**
 * Migration utilities for converting MUI components to shadcn/ui equivalents
 */

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

/**
 * Select component migration utilities
 */

/**
 * Maps MUI Select size to shadcn Select size classes
 */
export function mapMuiSelectSize(muiSize?: string): string {
  switch (muiSize) {
    case 'small':
      return 'h-8 text-sm';
    case 'medium':
      return 'h-10 text-sm';
    case 'large':
      return 'h-12 text-base';
    default:
      return 'h-10 text-sm';
  }
}

/**
 * Maps MUI Select variant to shadcn Select styling
 */
export function mapMuiSelectVariant(muiVariant?: string): string {
  switch (muiVariant) {
    case 'outlined':
      return 'border border-input';
    case 'filled':
      return 'bg-muted border-0 border-b-2 border-input rounded-t-md rounded-b-none';
    case 'standard':
      return 'border-0 border-b border-input rounded-none bg-transparent';
    default:
      return 'border border-input';
  }
}

/**
 * Generates error styling classes for Select components
 */
export function getSelectErrorClasses(hasError?: boolean): string {
  if (!hasError) return '';
  return 'border-destructive focus:ring-destructive';
}

/**
 * Maps MUI FormControl fullWidth to Tailwind classes
 */
export function mapFormControlWidth(fullWidth?: boolean): string {
  return fullWidth ? 'w-full' : '';
}

/**
 * Chip/Badge migration utilities
 */

/**
 * Maps MUI Chip variant to shadcn Badge variant
 */
export function mapMuiChipVariant(muiVariant?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (muiVariant) {
    case 'filled':
      return 'default';
    case 'outlined':
      return 'outline';
    default:
      return 'default';
  }
}

/**
 * Maps MUI Chip color to shadcn Badge variant
 */
export function mapMuiChipColor(muiColor?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (muiColor) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'info':
      return 'secondary';
    case 'success':
      return 'default';
    case 'primary':
      return 'default';
    case 'secondary':
      return 'secondary';
    default:
      return 'default';
  }
}

/**
 * Maps MUI Chip size to shadcn Badge size classes
 */
export function mapMuiChipSize(muiSize?: string): string {
  switch (muiSize) {
    case 'small':
      return 'text-xs px-2 py-0.5';
    case 'medium':
      return 'text-sm px-2.5 py-0.5';
    default:
      return 'text-sm px-2.5 py-0.5';
  }
}

/**
 * Form validation utilities
 */

/**
 * Gets error text styling classes for form validation
 */
export function getFormErrorClasses(): string {
  return 'text-xs text-destructive mt-1';
}

/**
 * Gets helper text styling classes for form guidance
 */
export function getFormHelperClasses(): string {
  return 'text-xs text-muted-foreground mt-1';
}