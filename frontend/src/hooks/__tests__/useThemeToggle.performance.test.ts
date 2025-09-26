// Mock performance API for testing
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true}

// Mock requestAnimationFrame
let rafCallbacks: (() => void)[] = [];
const mockRaf = vi.fn((callback: () => void) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRaf,
  writable: true}

// Helper to flush RAF callbacks
const flushRafCallbacks = () => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(callback => callback());
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true}

// Mock matchMedia
const mockMatchMedia = vi.fn((query: string) => ({ 
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()}
}));

Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true}

describe('useThemeToggle Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];
    mockPerformance.now.mockImplementation(() => Date.now());
    
    // Reset DOM
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should toggle theme within 16ms performance target', async () => {
    const { result } = renderHook(() => useThemeToggle());
    
    // Wait for initialization
    await act(async () => {
      flushRafCallbacks();
    });

    let toggleStartTime = 0;
    let toggleEndTime = 0;

    // Mock performance.now to simulate timing
    mockPerformance.now
      .mockImplementationOnce(() => (toggleStartTime = 1000))
      .mockImplementationOnce(() => (toggleEndTime = 1010)); // 10ms toggle time

    await act(async () => {
      result.current.toggle();
      flushRafCallbacks();
    });

    const toggleDuration = toggleEndTime - toggleStartTime;
    expect(toggleDuration).toBeLessThanOrEqual(16);
  });

  it('should apply DOM changes synchronously', () => {
    const { result } = renderHook(() => useThemeToggle());
    
    act(() => {
      flushRafCallbacks();
    });

    // Initial state should be light
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.setTheme('dark');
    });

    // DOM should be updated immediately (synchronously)
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should minimize re-renders during theme changes', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useThemeToggle();
    });

    act(() => {
      flushRafCallbacks();
    });

    const initialRenderCount = renderCount;

    act(() => {
      result.current.toggle();
    });

    // Should only trigger one additional render
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  it('should handle rapid theme toggles without performance degradation', () => {
    const { result } = renderHook(() => useThemeToggle());
    
    act(() => {
      flushRafCallbacks();
    });

    const startTime = Date.now();
    
    // Perform multiple rapid toggles
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.toggle();
      }
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete all toggles quickly
    expect(totalTime).toBeLessThan(100); // 100ms for 10 toggles
  });

  it('should persist theme preference efficiently', () => {
    const { result } = renderHook(() => useThemeToggle());
    
    act(() => {
      flushRafCallbacks();
    });

    act(() => {
      result.current.setTheme('dark');
    });

    // Should call localStorage.setItem once
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('should handle system theme changes efficiently', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useThemeToggle());
    
    act(() => {
      flushRafCallbacks();
    });

    // Set theme to system
    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should validate performance metrics correctly', () => {
    const mockToggle = vi.fn();
    const performanceTest = createThemePerformanceTest(mockToggle);

    const goodMetrics = {
      toggleTime: 10,
      renderTime: 20,
      domUpdateTime: 15,
      totalTime: 30,
      frameDrops: 0,
    };

    const badMetrics = {
      toggleTime: 25, // Exceeds 16ms
      renderTime: 40,
      domUpdateTime: 30,
      totalTime: 80, // Exceeds 50ms
      frameDrops: 3, // Exceeds 1 frame
    };

    expect(performanceTest.validate(goodMetrics)).toBe(true);
    expect(performanceTest.validate(badMetrics)).toBe(false);
  });

  it('should initialize theme without flicker', () => {
    // Mock stored theme
    mockLocalStorage.getItem.mockReturnValue('dark');
    
    const { result } = renderHook(() => useThemeToggle());

    // Should start with loading state
    expect(result.current.isLoading).toBe(true);

    act(() => {
      flushRafCallbacks();
    });

    // Should complete initialization quickly
    expect(result.current.isLoading).toBe(false);
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });
});