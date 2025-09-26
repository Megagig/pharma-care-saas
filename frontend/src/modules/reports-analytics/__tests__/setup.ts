import '@testing-library/jest-dom';
// Mock Recharts components
vi.mock('recharts', () => ({  })
    LineChart: ({ children }: any) => <div data - testid="line-chart"> { children } </div>}

// Mock Material-UI components that might cause issues
vi.mock('@mui/material/Skeleton', () => ({  })
    default: ({ children, ...props }: any) => <div data - testid="skeleton" { ...props } > { children } </div>}

// Mock date-fns
vi.mock('date-fns', () => ({  })
    format: vi.fn((date, formatStr) => `formatted-${formatStr}`),
    parseISO: vi.fn((dateStr) => new Date(dateStr)),
    isValid: vi.fn(() => true),
    startOfDay: vi.fn((date) => date),
    endOfDay: vi.fn((date) => date),
    subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
    subMonths: vi.fn((date, months) => new Date(date.getFullYear(), date.getMonth() - months, date.getDate()))}

// Mock API calls
global.fetch = vi.fn();

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock file download
const mockDownload = vi.fn();
Object.defineProperty(document, 'createElement', {
    value: vi.fn().mockImplementation((tagName) => {
        if (tagName === 'a') {
            return {
                href: '',
                download: '',
                click: mockDownload,
                style: {},
            };
        }
        return document.createElement(tagName);
    })}