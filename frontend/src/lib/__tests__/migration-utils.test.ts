import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkComponentCompatibility,
    mapMuiPropsToShadcn,
    migrationTracker,
    generateTestCases
} from '../migration-utils';

describe('Migration Utils', () => {
    beforeEach(() => {
        migrationTracker.reset();
    });

    describe('checkComponentCompatibility', () => {
        it('should return compatibility info for Button component', () => {
            const compatibility = checkComponentCompatibility('Button');

            expect(compatibility).toBeDefined();
            expect(compatibility?.componentName).toBe('Button');
            expect(compatibility?.muiProps).toContain('variant');
            expect(compatibility?.shadcnProps).toContain('variant');
            expect(compatibility?.incompatibleProps).toContain('color');
        });

        it('should return null for unknown component', () => {
            const compatibility = checkComponentCompatibility('UnknownComponent');
            expect(compatibility).toBeNull();
        });
    });

    describe('mapMuiPropsToShadcn', () => {
        it('should map MUI Button props to shadcn props', () => {
            const muiProps = { variant: 'contained', color: 'primary' };
            const shadcnProps = mapMuiPropsToShadcn('Button', muiProps);

            expect(shadcnProps.variant).toBe('default');
        });
    });

    describe('migrationTracker', () => {
        it('should track migration progress', () => {
            migrationTracker.setTotalComponents(3);
            migrationTracker.startComponentMigration('Button');
            migrationTracker.completeComponentMigration('Button');

            const progress = migrationTracker.getProgress();
            expect(progress.totalComponents).toBe(3);
            expect(progress.migratedComponents).toBe(1);
            expect(progress.completedComponents).toContain('Button');
        });

        it('should calculate progress percentage', () => {
            migrationTracker.setTotalComponents(4);
            migrationTracker.completeComponentMigration('Button');
            migrationTracker.completeComponentMigration('Input');

            const percentage = migrationTracker.getProgressPercentage();
            expect(percentage).toBe(50);
        });
    });

    describe('generateTestCases', () => {
        it('should generate test cases for Button component', () => {
            const testCases = generateTestCases('Button');

            expect(testCases.length).toBeGreaterThan(0);
            expect(testCases.some(tc => tc.testType === 'render')).toBe(true);
            expect(testCases.some(tc => tc.testType === 'accessibility')).toBe(true);
        });
    });
});