// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

// Mock DOM methods
const mockClassList = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
};

const mockSetAttribute = vi.fn();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock}

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock}

Object.defineProperty(document, 'documentElement', {
    value: {
        classList: mockClassList,
        setAttribute: mockSetAttribute,
    },
    writable: true}

describe('useTheme', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default matchMedia mock
        matchMediaMock.mockReturnValue({ 
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn()}
        });

        localStorageMock.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with system theme by default', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('system');
        expect(result.current.resolvedTheme).toBe('light');
        expect(result.current.systemTheme).toBe('light');
        expect(result.current.isLight).toBe(true);
        expect(result.current.isDark).toBe(false);
        expect(result.current.isSystem).toBe(true);
    });

    it('should detect dark system theme', () => {
        matchMediaMock.mockReturnValue({ 
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn()}
        });

        const { result } = renderHook(() => useTheme());

        expect(result.current.systemTheme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(result.current.isDark).toBe(true);
    });

    it('should load saved theme preference from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should set theme and apply to DOM', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('dark');
        });

        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(result.current.isDark).toBe(true);
        expect(mockClassList.add).toHaveBeenCalledWith('dark');
        expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
    });

    it('should toggle theme correctly', () => {
        const { result } = renderHook(() => useTheme());

        // Start with light
        act(() => {
            result.current.setTheme('light');
        });
        expect(result.current.theme).toBe('light');

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('dark');

        // Toggle to system
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('system');

        // Toggle back to light
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('light');
    });

    it('should remove dark class when switching to light theme', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('light');
        });

        expect(mockClassList.remove).toHaveBeenCalledWith('dark');
        expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should resolve system theme correctly', () => {
        // Mock system dark theme
        matchMediaMock.mockReturnValue({ 
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn()}
        });

        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('system');
        });

        expect(result.current.theme).toBe('system');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(result.current.systemTheme).toBe('dark');
        expect(result.current.isSystem).toBe(true);
        expect(result.current.isDark).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
        localStorageMock.setItem.mockImplementation(() => {
            throw new Error('Storage quota exceeded');
        });

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('dark');
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to persist theme preference:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should provide server snapshot for SSR', () => {
        const serverSnapshot = themeStore.getServerSnapshot();

        expect(serverSnapshot).toEqual({ 
            mode: 'system',
            resolvedMode: 'light',
            systemTheme: 'light'}
        });
    });
});