import { Button } from '@/components/ui/button';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true}
describe('IconMapper', () => {
  it('should map MUI icons to Lucide equivalents', () => {
    const addIcon = IconMapper.getLucideIcon('Add');
    expect(addIcon).toBeDefined();
    const deleteIcon = IconMapper.getLucideIcon('Delete');
    expect(deleteIcon).toBeDefined();
    const searchIcon = IconMapper.getLucideIcon('Search');
    expect(searchIcon).toBeDefined();
  });
  it('should return null for unmapped icons', () => {
    const unknownIcon = IconMapper.getLucideIcon('UnknownIcon');
    expect(unknownIcon).toBeNull();
  });
  it('should check if mapping exists', () => {
    expect(IconMapper.hasMapping('Add')).toBe(true);
    expect(IconMapper.hasMapping('UnknownIcon')).toBe(false);
  });
  it('should suggest alternatives for similar icons', () => {
    const suggestions = IconMapper.suggestAlternatives('add');
    expect(suggestions).toContain('Add');
    expect(suggestions.length).toBeGreaterThan(0);
  });
  it('should provide mapping statistics', () => {
    const stats = IconMapper.getMappingStats();
    expect(stats.totalMappings).toBeGreaterThan(0);
    expect(stats.categories).toBeDefined();
    expect(stats.categories.actions).toBeGreaterThan(0);
  });
});
describe('PropMapper', () => {
  it('should map MUI Button props correctly', () => {
    const muiProps = {
      variant: 'contained',
      color: 'primary',
      size: 'large',
      disabled: false,
      onClick: vi.fn(),
      children: 'Test Button'
    };
    const mappedProps = PropMapper.mapButtonProps(muiProps);
    expect(mappedProps.variant).toBe('default');
    expect(mappedProps.size).toBe('lg');
    expect(mappedProps.disabled).toBe(false);
    expect(mappedProps.onClick).toBe(muiProps.onClick);
    expect(mappedProps.children).toBe('Test Button');
  });
  it('should map MUI TextField props correctly', () => {
    const muiProps = {
      label: 'Test Label',
      placeholder: 'Test Placeholder',
      error: true,
      helperText: 'Error message',
      fullWidth: true,
      value: 'test value',
      onChange: vi.fn()
    };
    const mappedProps = PropMapper.mapInputProps(muiProps);
    expect(mappedProps.placeholder).toBe('Test Placeholder');
    expect(mappedProps.value).toBe('test value');
    expect(mappedProps.onChange).toBe(muiProps.onChange);
    expect(mappedProps.className).toContain('w-full');
    expect(mappedProps.className).toContain('border-destructive');
    expect(mappedProps['aria-invalid']).toBe('true');
  });
  it('should map MUI Card props correctly', () => {
    const muiProps = {
      elevation: 3,
      className: 'custom-class'
    };
    const mappedProps = PropMapper.mapCardProps(muiProps);
    expect(mappedProps.className).toContain('shadow-md');
    expect(mappedProps.className).toContain('custom-class');
  });
  it('should map MUI Typography props correctly', () => {
    const muiProps = {
      variant: 'h1',
      align: 'center',
      gutterBottom: true,
      className: 'custom-class'
    };
    const mappedProps = PropMapper.mapTypographyProps(muiProps);
    expect(mappedProps.className).toContain('text-4xl');
    expect(mappedProps.className).toContain('font-bold');
    expect(mappedProps.className).toContain('text-center');
    expect(mappedProps.className).toContain('mb-4');
    expect(mappedProps.className).toContain('custom-class');
  });
});
describe('MigrationTracker', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });
  it('should track component migration progress', () => {
    MigrationTracker.trackComponent('TestComponent', 'completed');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mui-shadcn-migration-progress',
      expect.stringContaining('TestComponent')
    );
  });
  it('should get migration progress', () => {
    const mockProgress = {
      'TestComponent': {
        status: 'completed',
        timestamp: '2023-01-01T00:00:00.000Z',
        version: '1.0.0'
      }
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));
    const progress = MigrationTracker.getProgress();
    expect(progress).toEqual(mockProgress);
  });
  it('should calculate migration statistics', () => {
    const mockProgress = {
      'Component1': { status: 'completed' },
      'Component2': { status: 'in-progress' },
      'Component3': { status: 'failed' },
      'Component4': { status: 'pending' }
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));
    const stats = MigrationTracker.getStats();
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(1);
  });
  it('should clear migration progress', () => {
    MigrationTracker.clearProgress();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mui-shadcn-migration-progress');
  });
  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    const progress = MigrationTracker.getProgress();
    expect(progress).toEqual({});
  });
});
describe('MigrationUtils', () => {
  it('should convert sx props to Tailwind classes', () => {
    const sx = {
      p: 4,
      mx: 2,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    };
    const tailwindClasses = MigrationUtils.sxToTailwind(sx);
    expect(tailwindClasses).toContain('p-4');
    expect(tailwindClasses).toContain('mx-2');
    expect(tailwindClasses).toContain('w-full');
    expect(tailwindClasses).toContain('flex');
    expect(tailwindClasses).toContain('justify-center');
    expect(tailwindClasses).toContain('items-center');
  });
  it('should generate component migration report', () => {
    const beforeCode = `
      
      function MyComponent() {
        return <Button >Click me</Button>;
      }
    `;
    const afterCode = `
      
      function MyComponent() {
        return <Button>Click me</Button>;
      }
    `;
    const report = MigrationUtils.generateComponentReport('MyComponent', beforeCode, afterCode);
    expect(report.component).toBe('MyComponent');
    expect(report.timestamp).toBeDefined();
    expect(report.changes).toBeDefined();
    expect(report.muiImportsRemoved).toBeGreaterThan(0);
    expect(report.shadcnImportsAdded).toBeGreaterThan(0);
  });
  it('should validate migration completion', () => {
    const codeWithMui = `
      
      function MyComponent() {
        return <Button className="">Click me</Button>;
      }
    `;
    const codeWithoutMui = `
      
      function MyComponent() {
        return <Button className="p-2">Click me</Button>;
      }
    `;
    const invalidResult = MigrationUtils.validateMigration(codeWithMui);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.issues.length).toBeGreaterThan(0);
    const validResult = MigrationUtils.validateMigration(codeWithoutMui);
    expect(validResult.isValid).toBe(true);
    expect(validResult.issues.length).toBe(0);
  });
  it('should handle empty sx props', () => {
    const tailwindClasses = MigrationUtils.sxToTailwind(null);
    expect(tailwindClasses).toBe('');
    const tailwindClasses2 = MigrationUtils.sxToTailwind({});
    expect(tailwindClasses2).toBe('');
  });
});