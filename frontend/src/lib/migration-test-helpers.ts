import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentTestCase, generateTestCases } from './migration-utils';
import { ComponentType } from 'react';

// Test runner for migrated components
export class MigrationTestRunner {
    private testResults: Map<string, { passed: number; failed: number; errors: string[] }> = new Map();

    async runComponentTests(
        componentName: string,
        Component: ComponentType<any>
    ): Promise<{ passed: number; failed: number; errors: string[] }> {
        const testCases = generateTestCases(componentName);
        const results = { passed: 0, failed: 0, errors: [] as string[] };

        for (const testCase of testCases) {
            try {
                await this.runSingleTest(Component, testCase);
                results.passed++;
            } catch (error) {
                results.failed++;
                results.errors.push(`${testCase.testType}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        this.testResults.set(componentName, results);
        return results;
    }

    private async runSingleTest(Component: ComponentType<any>, testCase: ComponentTestCase): Promise<void> {
        switch (testCase.testType) {
            case 'render':
                await this.runRenderTest(Component, testCase);
                break;
            case 'interaction':
                await this.runInteractionTest(Component, testCase);
                break;
            case 'accessibility':
                await this.runAccessibilityTest(Component, testCase);
                break;
        }
    }

    private async runRenderTest(Component: ComponentType<any>, testCase: ComponentTestCase): Promise<void> {
        const { container } = render(<Component { ...testCase.props } />);

        if (!container.firstChild) {
            throw new Error('Component did not render');
        }

        // Check for basic styling classes
        const element = container.firstChild as HTMLElement;
        if (!element.className) {
            throw new Error('Component has no styling classes applied');
        }
    }

    private async runInteractionTest(Component: ComponentType<any>, testCase: ComponentTestCase): Promise<void> {
        const { container } = render(<Component { ...testCase.props } />);
        const element = container.firstChild as HTMLElement;

        if (testCase.props.disabled) {
            // Test that disabled components don't respond to clicks
            fireEvent.click(element);
            if (!element.hasAttribute('disabled') && !element.getAttribute('aria-disabled')) {
                throw new Error('Disabled component should have disabled attribute or aria-disabled');
            }
        }

        if (testCase.props.onClick) {
            // Test click functionality
            let clicked = false;
            const testProps = { ...testCase.props, onClick: () => { clicked = true; } };
            const { container: clickContainer } = render(<Component { ...testProps } />);
            const clickElement = clickContainer.firstChild as HTMLElement;

            fireEvent.click(clickElement);
            if (!clicked) {
                throw new Error('onClick handler was not called');
            }
        }
    }

    private async runAccessibilityTest(Component: ComponentType<any>, testCase: ComponentTestCase): Promise<void> {
        const { container } = render(<Component { ...testCase.props } />);
        const element = container.firstChild as HTMLElement;

        // Check for keyboard navigation support
        if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
            fireEvent.keyDown(element, { key: 'Enter' });
            fireEvent.keyDown(element, { key: ' ' });
        }

        // Check for ARIA attributes
        const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
        const hasRole = element.hasAttribute('role') || ['BUTTON', 'INPUT', 'SELECT'].includes(element.tagName);

        if (!hasAriaLabel && !hasRole) {
            console.warn(`Component may need accessibility improvements: missing aria-label or semantic role`);
        }
    }

    getAllResults(): Map<string, { passed: number; failed: number; errors: string[] }> {
        return new Map(this.testResults);
    }

    generateTestReport(): string {
        let report = 'Migration Test Report\n';
        report += '====================\n\n';

        this.testResults.forEach((result, componentName) => {
            const total = result.passed + result.failed;
            const percentage = total > 0 ? (result.passed / total * 100).toFixed(1) : '0';

            report += `${componentName}:\n`;
            report += `  ✅ Passed: ${result.passed}\n`;
            report += `  ❌ Failed: ${result.failed}\n`;
            report += `  📊 Success Rate: ${percentage}%\n`;

            if (result.errors.length > 0) {
                report += `  🐛 Errors:\n`;
                result.errors.forEach(error => {
                    report += `    - ${error}\n`;
                });
            }
            report += '\n';
        });

        return report;
    }
}

// Utility functions for testing migrated components
export function createMockProps(componentName: string): Record<string, any> {
    const mockProps: Record<string, Record<string, any>> = {
        Button: {
            children: 'Test Button',
            onClick: jest.fn(),
            variant: 'default',
            size: 'default'
        },
        Input: {
            placeholder: 'Test input',
            value: '',
            onChange: jest.fn(),
            type: 'text'
        },
        Card: {
            children: 'Test card content',
            className: 'test-card'
        },
        Badge: {
            children: 'Test Badge',
            variant: 'default'
        }
    };

    return mockProps[componentName] || {};
}

// Helper to compare MUI vs shadcn component behavior
export async function compareComponentBehavior(
    muiComponent: ComponentType<any>,
    shadcnComponent: ComponentType<any>,
    props: Record<string, any>
): Promise<{ differences: string[]; similarities: string[] }> {
    const differences: string[] = [];
    const similarities: string[] = [];

    try {
        const muiRender = render(<muiComponent { ...props } />);
        const shadcnRender = render(<shadcnComponent { ...props } />);

        const muiElement = muiRender.container.firstChild as HTMLElement;
        const shadcnElement = shadcnRender.container.firstChild as HTMLElement;

        // Compare tag names
        if (muiElement.tagName === shadcnElement.tagName) {
            similarities.push(`Both use ${muiElement.tagName} element`);
        } else {
            differences.push(`Tag name: MUI uses ${muiElement.tagName}, shadcn uses ${shadcnElement.tagName}`);
        }

        // Compare basic functionality
        if (props.onClick) {
            let muiClicked = false;
            let shadcnClicked = false;

            const muiTestRender = render(<muiComponent { ...props } onClick = {() => { muiClicked = true; }
        } />);
        const shadcnTestRender = render(<shadcnComponent { ...props } onClick = {() => { shadcnClicked = true; }
    } />);

    fireEvent.click(muiTestRender.container.firstChild as HTMLElement);
    fireEvent.click(shadcnTestRender.container.firstChild as HTMLElement);

    if (muiClicked && shadcnClicked) {
        similarities.push('Both handle onClick events');
    } else {
        differences.push(`Click handling: MUI ${muiClicked ? 'works' : 'fails'}, shadcn ${shadcnClicked ? 'works' : 'fails'}`);
    }
}

// Compare disabled state
if (props.disabled) {
    const muiDisabled = muiElement.hasAttribute('disabled') || muiElement.getAttribute('aria-disabled') === 'true';
    const shadcnDisabled = shadcnElement.hasAttribute('disabled') || shadcnElement.getAttribute('aria-disabled') === 'true';

    if (muiDisabled && shadcnDisabled) {
        similarities.push('Both handle disabled state correctly');
    } else {
        differences.push(`Disabled state: MUI ${muiDisabled ? 'correct' : 'incorrect'}, shadcn ${shadcnDisabled ? 'correct' : 'incorrect'}`);
    }
}

  } catch (error) {
    differences.push(`Comparison failed: ${error instanceof Error ? error.message : String(error)}`);
}

return { differences, similarities };
}

// Export singleton instance
export const migrationTestRunner = new MigrationTestRunner();