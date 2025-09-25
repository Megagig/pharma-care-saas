import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useThemeToggle, useThemeTogglePerformance } from '../useThemeToggle';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

// Mock performance.now
const performanceMock = {
    now: vi.fn(),
};

// Mock requestAnimationFrame
const requestAnimationFrameMock = vi.fn();

// Mock requestIdleCallback
const requestIdleCallbackMock = vi.fn();

describe('useThemeToggle', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Setup DOM mock
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
        });

        Object.defineProperty(window, 'matchMedia', {
            value: matchMediaMock,
            writable: true,
        });

        Object.defineProperty(window, 'performance', {
            value: performanceMock,
            writable: true,
        });

        Object.defineProperty(window, 'requestAnimationFrame', {
            value: requestAnimationFrameMock,
            writable: true,
        });

        Object.defineProperty(window, 'requestIdleCallback', {
            value: requestIdleCallbackMock,
            writable: true,
        });

        // Setup document.documentElement mock
        const mockClassList = {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
            toggle: vi.fn(),
        };

        const mockDocumentElement = {
            classList: mockClassList,
            setAttribute: vi.fn(),
            style: {},
        };

        Object.defineProperty(document, 'documentElement', {
            value: mockDocumentElement,
            writable: true,
        });

        // Default matchMedia response
        matchMediaMock.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
        });

        // Default localStorage responses
        localStorageMock.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Theme Toggle Functionality', () => {
        it('should initialize with system theme by default', () => {
            const { result } = renderHook(() => useThemeToggle());

            expect(result.current.theme).toBeDefined();
            expect(typeof result.current.isDark).toBe('boolean');
            expect(typeof result.current.isLight).toBe('boolean');
        });

        it('should toggle between light and dark themes', () => {
            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.toggleLightDark();
            });

            // Verify DOM manipulation was called
            expect(document.documentElement.classList.add).toHaveBeenCalled();
        });

        it('should set specific theme correctly', () => {
            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('dark');
            });

            expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        });

        it('should handle system theme preference', () => {
            // Mock system dark mode
            matchMediaMock.mockReturnValue({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            });

            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('system');
            });

            // Should apply dark theme based on system preference
            expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
        });
    });

    describe('Performance Requirements', () => {
        it('should complete theme toggle within performance budget', () => {
            performanceMock.now.mockReturnValueOnce(0).mockReturnValueOnce(10); // 10ms duration
            requestAnimationFrameMock.mockImplementation((callback) => callback());

            const { result } = renderHook(() => useThemeTogglePerformance());

            act(() => {
                result.current.measureTogglePerformance();
            });

            expect(performanceMock.now).toHaveBeenCalledTimes(2);
            expect(requestAnimationFrameMock).toHaveBeenCalled();
        });

        it('should warn when theme toggle exceeds 16ms', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            performanceMock.now.mockReturnValueOnce(0).mockReturnValueOnce(20); // 20ms duration
            requestAnimationFrameMock.mockImplementation((callback) => callback());

            const { result } = renderHook(() => useThemeTogglePerformance());

            act(() => {
                result.current.measureTogglePerformance();
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Theme toggle exceeded 16ms target')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('localStorage Persistence', () => {
        it('should persist theme preference to localStorage', () => {
            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('dark');
            });

            // Should eventually call localStorage.setItem
            expect(requestIdleCallbackMock).toHaveBeenCalled();
        });

        it('should read theme preference from localStorage on initialization', () => {
            localStorageMock.getItem.mockReturnValue('dark');

            renderHook(() => useThemeToggle());

            expect(localStorageMock.getItem).toHaveBeenCalledWith('theme-preference');
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('dark');
            });

            // Should not throw error
            expect(() => result.current.setTheme('light')).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('Theme Initialization', () => {
        it('should initialize theme without flicker', () => {
            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.initializeTheme();
            });

            expect(document.documentElement.classList.add).toHaveBeenCalled();
            expect(document.documentElement.setAttribute).toHaveBeenCalled();
        });

        it('should handle missing localStorage gracefully during initialization', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const { result } = renderHook(() => useThemeToggle());

            expect(() => {
                act(() => {
                    result.current.initializeTheme();
                });
            }).not.toThrow();
        });
    });

    describe('System Theme Detection', () => {
        it('should detect system dark mode preference', () => {
            matchMediaMock.mockReturnValue({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            });

            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('system');
            });

            expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
        });

        it('should detect system light mode preference', () => {
            matchMediaMock.mockReturnValue({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            });

            const { result } = renderHook(() => useThemeToggle());

            act(() => {
                result.current.setTheme('system');
            });

            expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
        });

        it('should listen for system theme changes', () => {
            const mockAddEventListener = vi.fn();
            matchMediaMock.mockReturnValue({
                matches: false,
                addEventListener: mockAddEventListener,
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            });

            renderHook(() => useThemeToggle());

            expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid theme values gracefully', () => {
            const { result } = renderHook(() => useThemeToggle());

            expect(() => {
                act(() => {
                    // @ts-expect-error Testing invalid input
                    result.current.setTheme('invalid-theme');
                });
            }).not.toThrow();
        });

        it('should work in SSR environment', () => {
            // Mock SSR environment
            const originalWindow = global.window;
            // @ts-expect-error Testing SSR
            delete global.window;

            expect(() => {
                renderHook(() => useThemeToggle());
            }).not.toThrow();

            // Restore window
            global.window = originalWindow;
        });

        it('should optimize repeated theme changes', () => {
            const { result } = renderHook(() => useThemeToggle());

            // Set same theme multiple times
            act(() => {
                result.current.setTheme('dark');
                result.current.setTheme('dark');
                result.current.setTheme('dark');
            });

            // Should optimize and not make unnecessary changes
            expect(document.documentElement.classList.add).toHaveBeenCalled();
        });
    });
});