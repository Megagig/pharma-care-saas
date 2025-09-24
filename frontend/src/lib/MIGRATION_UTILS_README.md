# Migration Utilities Documentation

This directory contains utilities to help with the MUI to shadcn/ui migration process.

## Files Overview

### `migration-utils.ts`

Core migration utilities including:

- Component compatibility checking
- Prop mapping between MUI and shadcn/ui
- Migration progress tracking
- Test case generation
- Usage analysis tools

### `migration-test-helpers.ts`

Testing utilities for migrated components:

- Automated test runner for migrated components
- Component behavior comparison tools
- Mock prop generators
- Test report generation

### `migration-cli.ts`

Command-line interface utilities:

- Migration progress tracking
- Summary generation
- Component status management

### `utils.ts`

General utility functions:

- `cn()` - Class name merging utility using clsx and tailwind-merge
- Date formatting helpers

## Usage Examples

### Basic Component Migration

```typescript
import {
  checkComponentCompatibility,
  mapMuiPropsToShadcn,
} from './migration-utils';

// Check if a component can be migrated
const compatibility = checkComponentCompatibility('Button');
if (compatibility) {
  console.log('Migration notes:', compatibility.migrationNotes);
}

// Map MUI props to shadcn props
const muiProps = { variant: 'contained', color: 'primary' };
const shadcnProps = mapMuiPropsToShadcn('Button', muiProps);
```

### Progress Tracking

```typescript
import { migrationTracker } from './migration-utils';

// Initialize migration
migrationTracker.setTotalComponents(10);

// Track component migration
migrationTracker.startComponentMigration('Button');
// ... perform migration ...
migrationTracker.completeComponentMigration('Button');

// Get progress
const progress = migrationTracker.getProgress();
console.log(
  `${progress.migratedComponents}/${progress.totalComponents} completed`
);
```

### Testing Migrated Components

```typescript
import { migrationTestRunner } from './migration-test-helpers';
import { Button } from '../components/ui/button';

// Run automated tests
const results = await migrationTestRunner.runComponentTests('Button', Button);
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
```

## Component Compatibility Map

The migration utilities include compatibility information for common MUI components:

- **Button**: Maps variants, handles icon placement differences
- **TextField → Input**: Requires separate Label component, custom error handling
- **Card**: Uses CardHeader, CardContent, CardFooter structure

## Migration Process

1. **Analysis**: Use `analyzeMuiUsage()` to scan codebase for MUI components
2. **Planning**: Check compatibility with `checkComponentCompatibility()`
3. **Migration**: Use `mapMuiPropsToShadcn()` for prop conversion
4. **Testing**: Run `migrationTestRunner` on migrated components
5. **Tracking**: Monitor progress with `migrationTracker`

## Best Practices

1. Always check component compatibility before migration
2. Use the prop mapping utilities to ensure correct conversion
3. Run automated tests after each component migration
4. Track progress to maintain visibility into migration status
5. Review migration notes for component-specific considerations

## Testing

Run the migration utility tests:

```bash
npm run test src/lib/__tests__/migration-utils.test.ts
```
