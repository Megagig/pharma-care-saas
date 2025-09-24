import { ComponentType } from 'react';

// Component compatibility checker utility
export interface ComponentCompatibility {
    componentName: string;
    muiProps: string[];
    shadcnProps: string[];
    incompatibleProps: string[];
    migrationNotes: string[];
}

export const componentCompatibilityMap: Record<string, ComponentCompatibility> = {
    Button: {
        componentName: 'Button',
        muiProps: ['variant', 'size', 'color', 'disabled', 'onClick', 'children', 'startIcon', 'endIcon'],
        shadcnProps: ['variant', 'size', 'disabled', 'onClick', 'children', 'asChild'],
        incompatibleProps: ['color', 'startIcon', 'endIcon'],
        migrationNotes: [
            'Replace startIcon/endIcon with Lucide React icons as children',
            'Color prop not supported - use variant instead',
            'Use asChild prop for polymorphic behavior'
        ]
    },
    TextField: {
        componentName: 'Input',
        muiProps: ['variant', 'size', 'label', 'error', 'helperText', 'required', 'disabled', 'value', 'onChange'],
        shadcnProps: ['type', 'placeholder', 'disabled', 'value', 'onChange', 'className'],
        incompatibleProps: ['variant', 'label', 'error', 'helperText'],
        migrationNotes: [
            'Use separate Label component for labels',
            'Handle error states with custom styling',
            'Helper text needs custom implementation'
        ]
    },
    Card: {
        componentName: 'Card',
        muiProps: ['variant', 'elevation', 'children'],
        shadcnProps: ['className', 'children'],
        incompatibleProps: ['variant', 'elevation'],
        migrationNotes: [
            'Use CardHeader, CardContent, CardFooter for structure',
            'Elevation replaced with shadow utilities'
        ]
    }
};

// Prop mapping helpers for MUI to shadcn conversion
export const propMappings: Record<string, Record<string, string>> = {
    Button: {
        'variant="contained"': 'variant="default"',
        'variant="outlined"': 'variant="outline"',
        'variant="text"': 'variant="ghost"',
        'color="primary"': 'variant="default"',
        'color="secondary"': 'variant="secondary"',
        'color="error"': 'variant="destructive"'
    },
    TextField: {
        'variant="outlined"': '',
        'variant="filled"': '',
        'variant="standard"': ''
    }
};

// Component compatibility checker
export function checkComponentCompatibility(componentName: string): ComponentCompatibility | null {
    return componentCompatibilityMap[componentName] || null;
}

// Prop mapping utility
export function mapMuiPropsToShadcn(componentName: string, muiProps: Record<string, any>): Record<string, any> {
    const mappings = propMappings[componentName] || {};
    const shadcnProps: Record<string, any> = {};

    Object.entries(muiProps).forEach(([key, value]) => {
        const propString = `${key}="${value}"`;
        const mappedProp = mappings[propString];

        if (mappedProp !== undefined) {
            if (mappedProp === '') {
                // Skip this prop (not supported)
                return;
            }
            // Parse mapped prop
            const [mappedKey, mappedValue] = mappedProp.split('=');
            shadcnProps[mappedKey.replace('variant', 'variant')] = mappedValue.replace(/"/g, '');
        } else {
            // Keep original prop if no mapping exists
            shadcnProps[key] = value;
        }
    });

    return shadcnProps;
}

// Migration progress tracking system
export interface MigrationProgress {
    totalComponents: number;
    migratedComponents: number;
    componentsInProgress: string[];
    completedComponents: string[];
    failedComponents: { name: string; error: string }[];
}

class MigrationTracker {
    private progress: MigrationProgress = {
        totalComponents: 0,
        migratedComponents: 0,
        componentsInProgress: [],
        completedComponents: [],
        failedComponents: []
    };

    setTotalComponents(count: number) {
        this.progress.totalComponents = count;
    }

    startComponentMigration(componentName: string) {
        if (!this.progress.componentsInProgress.includes(componentName)) {
            this.progress.componentsInProgress.push(componentName);
        }
    }

    completeComponentMigration(componentName: string) {
        this.progress.componentsInProgress = this.progress.componentsInProgress.filter(
            name => name !== componentName
        );

        if (!this.progress.completedComponents.includes(componentName)) {
            this.progress.completedComponents.push(componentName);
            this.progress.migratedComponents++;
        }
    }

    failComponentMigration(componentName: string, error: string) {
        this.progress.componentsInProgress = this.progress.componentsInProgress.filter(
            name => name !== componentName
        );

        this.progress.failedComponents.push({ name: componentName, error });
    }

    getProgress(): MigrationProgress {
        return { ...this.progress };
    }

    getProgressPercentage(): number {
        if (this.progress.totalComponents === 0) return 0;
        return (this.progress.migratedComponents / this.progress.totalComponents) * 100;
    }

    reset() {
        this.progress = {
            totalComponents: 0,
            migratedComponents: 0,
            componentsInProgress: [],
            completedComponents: [],
            failedComponents: []
        };
    }
}

export const migrationTracker = new MigrationTracker();

// Automated testing helpers for migrated components
export interface ComponentTestCase {
    componentName: string;
    props: Record<string, any>;
    expectedBehavior: string;
    testType: 'render' | 'interaction' | 'accessibility';
}

export function generateTestCases(componentName: string): ComponentTestCase[] {
    const compatibility = checkComponentCompatibility(componentName);
    if (!compatibility) return [];

    const testCases: ComponentTestCase[] = [];

    // Generate render tests
    testCases.push({
        componentName,
        props: {},
        expectedBehavior: 'renders without crashing',
        testType: 'render'
    });

    // Generate prop tests
    compatibility.shadcnProps.forEach(prop => {
        if (prop === 'variant') {
            testCases.push({
                componentName,
                props: { variant: 'default' },
                expectedBehavior: 'applies default variant styling',
                testType: 'render'
            });
        }

        if (prop === 'disabled') {
            testCases.push({
                componentName,
                props: { disabled: true },
                expectedBehavior: 'is disabled and not interactive',
                testType: 'interaction'
            });
        }
    });

    // Generate accessibility tests
    testCases.push({
        componentName,
        props: {},
        expectedBehavior: 'is accessible via keyboard navigation',
        testType: 'accessibility'
    });

    return testCases;
}

// Utility to analyze existing MUI usage in codebase
export interface MuiUsageAnalysis {
    componentName: string;
    occurrences: number;
    files: string[];
    commonProps: Record<string, number>;
    migrationComplexity: 'low' | 'medium' | 'high';
}

export function analyzeMuiUsage(codeContent: string, fileName: string): MuiUsageAnalysis[] {
    const analyses: MuiUsageAnalysis[] = [];
    const muiComponents = Object.keys(componentCompatibilityMap);

    muiComponents.forEach(componentName => {
        const regex = new RegExp(`<${componentName}[^>]*>`, 'g');
        const matches = codeContent.match(regex) || [];

        if (matches.length > 0) {
            const commonProps: Record<string, number> = {};

            matches.forEach(match => {
                // Extract props from the match
                const propRegex = /(\w+)=(?:{[^}]*}|"[^"]*"|'[^']*')/g;
                let propMatch;
                while ((propMatch = propRegex.exec(match)) !== null) {
                    const propName = propMatch[1];
                    commonProps[propName] = (commonProps[propName] || 0) + 1;
                }
            });

            const compatibility = checkComponentCompatibility(componentName);
            const incompatiblePropsUsed = Object.keys(commonProps).filter(prop =>
                compatibility?.incompatibleProps.includes(prop)
            );

            analyses.push({
                componentName,
                occurrences: matches.length,
                files: [fileName],
                commonProps,
                migrationComplexity: incompatiblePropsUsed.length > 2 ? 'high' :
                    incompatiblePropsUsed.length > 0 ? 'medium' : 'low'
            });
        }
    });

    return analyses;
}

// Helper to generate migration report
export function generateMigrationReport(): string {
    const progress = migrationTracker.getProgress();
    const percentage = migrationTracker.getProgressPercentage();

    return `
Migration Progress Report
========================

Overall Progress: ${percentage.toFixed(1)}% (${progress.migratedComponents}/${progress.totalComponents})

Completed Components:
${progress.completedComponents.map(name => `✅ ${name}`).join('\n')}

In Progress:
${progress.componentsInProgress.map(name => `🔄 ${name}`).join('\n')}

Failed Migrations:
${progress.failedComponents.map(({ name, error }) => `❌ ${name}: ${error}`).join('\n')}

Next Steps:
- Complete in-progress migrations
- Address failed migrations
- Run comprehensive testing
- Update documentation
  `;
}